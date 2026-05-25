// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CirBet Prediction Market
 * @notice Prediction market on Arc Network — native USDC (6 dec)
 *         States: Active → Locked → Resolved | Active/Locked → Cancelled (full refund)
 */
contract PredictionMarket is Ownable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum MarketState    { Active, Locked, Resolved, Cancelled }
    enum Category       { Crypto, Sports, General }
    enum ProposalStatus { Pending, Approved, Rejected }

    struct Market {
        uint256   id;
        string    question;
        string[]  options;
        uint256   endTime;
        Category  category;
        MarketState state;
        uint256   winningOption;
        uint256   totalPool;
        uint256[] optionPools;
        string    imageUrl;
        uint256   createdAt;
    }

    struct Proposal {
        uint256        id;
        string         question;
        string[]       options;
        uint256        endTime;
        Category       category;
        string         imageUrl;
        address        proposer;
        ProposalStatus status;
        uint256        createdAt;
    }

    struct Bet {
        uint256 optionIndex;
        uint256 amount;
        bool    claimed;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant FEE_BPS = 300;
    uint256 public constant MIN_BET = 1_000;

    uint256 private _nextMarketId;
    uint256 private _nextProposalId;
    uint256 public  accumulatedFees;

    mapping(uint256 => Market)   private _markets;
    mapping(uint256 => Proposal) private _proposals;

    mapping(uint256 => mapping(address => Bet[]))   public userBets;
    mapping(uint256 => mapping(address => uint256)) public userTotalBet;

    // bettor tracking for refunds
    mapping(uint256 => address[])                   private _marketBettors;
    mapping(uint256 => mapping(address => bool))    private _hasBet;
    mapping(uint256 => mapping(address => bool))    private _refunded;

    // ─── Events ───────────────────────────────────────────────────────────────

    event MarketCreated   (uint256 indexed id, string question, Category category, uint256 endTime);
    event MarketProposed  (uint256 indexed proposalId, address indexed proposer, string question);
    event ProposalApproved(uint256 indexed proposalId, uint256 indexed marketId);
    event ProposalRejected(uint256 indexed proposalId);
    event BetPlaced       (uint256 indexed marketId, address indexed bettor, uint256 option, uint256 amount);
    event MarketLocked    (uint256 indexed marketId);
    event MarketResolved  (uint256 indexed marketId, uint256 winningOption);
    event MarketCancelled (uint256 indexed marketId, uint256 totalRefunded, uint256 bettorCount);
    event RefundClaimed   (uint256 indexed marketId, address indexed bettor, uint256 amount);
    event WinningsClaimed (uint256 indexed marketId, address indexed bettor, uint256 amount);
    event FeeWithdrawn    (address indexed to, uint256 amount);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _createMarket(
        string memory   question,
        string[] memory options,
        uint256         endTime,
        Category        category,
        string memory   imageUrl
    ) internal returns (uint256 id) {
        require(options.length >= 2 && options.length <= 8, "2-8 options required");
        require(endTime > block.timestamp, "endTime must be future");

        id = _nextMarketId++;
        uint256[] memory pools = new uint256[](options.length);

        _markets[id] = Market({
            id:            id,
            question:      question,
            options:       options,
            endTime:       endTime,
            category:      category,
            state:         MarketState.Active,
            winningOption: 0,
            totalPool:     0,
            optionPools:   pools,
            imageUrl:      imageUrl,
            createdAt:     block.timestamp
        });

        emit MarketCreated(id, question, category, endTime);
    }

    // ─── Admin: direct market creation ───────────────────────────────────────

    function createMarket(
        string   calldata question,
        string[] calldata options,
        uint256           endTime,
        Category          category,
        string   calldata imageUrl
    ) external onlyOwner returns (uint256) {
        return _createMarket(question, options, endTime, category, imageUrl);
    }

    // ─── Admin: market lifecycle ──────────────────────────────────────────────

    function lockMarket(uint256 marketId) external onlyOwner {
        Market storage m = _markets[marketId];
        require(m.state == MarketState.Active, "Not active");
        m.state = MarketState.Locked;
        emit MarketLocked(marketId);
    }

    function resolveMarket(uint256 marketId, uint256 winningOption) external onlyOwner {
        Market storage m = _markets[marketId];
        require(
            m.state == MarketState.Locked ||
            (m.state == MarketState.Active && block.timestamp >= m.endTime),
            "Not resolvable"
        );
        require(winningOption < m.options.length, "Invalid option");
        m.state         = MarketState.Resolved;
        m.winningOption = winningOption;
        emit MarketResolved(marketId, winningOption);
    }

    /**
     * @notice Cancel a market and immediately push refunds to all bettors.
     *         If a push fails (e.g. smart-contract wallet rejects), the bettor
     *         can still pull their refund via claimRefund().
     */
    function cancelMarket(uint256 marketId) external onlyOwner nonReentrant {
        Market storage m = _markets[marketId];
        require(
            m.state == MarketState.Active || m.state == MarketState.Locked,
            "Cannot cancel"
        );
        m.state = MarketState.Cancelled;

        address[] memory bettors = _marketBettors[marketId];
        uint256 totalRefunded;

        for (uint256 i = 0; i < bettors.length; i++) {
            address bettor = bettors[i];
            if (_refunded[marketId][bettor]) continue;
            uint256 amount = userTotalBet[marketId][bettor];
            if (amount == 0) continue;
            _refunded[marketId][bettor] = true;
            totalRefunded += amount;
            // solhint-disable-next-line avoid-low-level-calls
            (bool ok,) = payable(bettor).call{value: amount}("");
            if (!ok) {
                // Allow manual pull claim
                _refunded[marketId][bettor] = false;
                totalRefunded -= amount;
            }
        }

        emit MarketCancelled(marketId, totalRefunded, bettors.length);
    }

    // ─── User: claim refund (fallback for failed push, or pull preference) ────

    function claimRefund(uint256 marketId) external nonReentrant {
        require(_markets[marketId].state == MarketState.Cancelled, "Not cancelled");
        require(!_refunded[marketId][msg.sender], "Already refunded");
        uint256 amount = userTotalBet[marketId][msg.sender];
        require(amount > 0, "Nothing to refund");
        _refunded[marketId][msg.sender] = true;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit RefundClaimed(marketId, msg.sender, amount);
    }

    // ─── User: propose market ─────────────────────────────────────────────────

    function proposeMarket(
        string   calldata question,
        string[] calldata options,
        uint256           endTime,
        Category          category,
        string   calldata imageUrl
    ) external returns (uint256 proposalId) {
        require(bytes(question).length > 0,                 "Empty question");
        require(options.length >= 2 && options.length <= 8, "2-8 options required");
        require(endTime > block.timestamp,                  "endTime must be future");

        proposalId = _nextProposalId++;
        string[] memory opts = options;

        _proposals[proposalId] = Proposal({
            id:        proposalId,
            question:  question,
            options:   opts,
            endTime:   endTime,
            category:  category,
            imageUrl:  imageUrl,
            proposer:  msg.sender,
            status:    ProposalStatus.Pending,
            createdAt: block.timestamp
        });

        emit MarketProposed(proposalId, msg.sender, question);
    }

    // ─── Admin: approve / reject proposals ───────────────────────────────────

    function approveProposal(uint256 proposalId) external onlyOwner returns (uint256 marketId) {
        Proposal storage p = _proposals[proposalId];
        require(p.status == ProposalStatus.Pending, "Not pending");
        require(p.endTime > block.timestamp,         "Proposal expired");
        p.status = ProposalStatus.Approved;
        marketId = _createMarket(p.question, p.options, p.endTime, p.category, p.imageUrl);
        emit ProposalApproved(proposalId, marketId);
    }

    function rejectProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = _proposals[proposalId];
        require(p.status == ProposalStatus.Pending, "Not pending");
        p.status = ProposalStatus.Rejected;
        emit ProposalRejected(proposalId);
    }

    // ─── User: bet ────────────────────────────────────────────────────────────

    function placeBet(uint256 marketId, uint256 optionIdx) external payable nonReentrant {
        Market storage m = _markets[marketId];
        require(m.state == MarketState.Active, "Market not active");
        require(block.timestamp < m.endTime,   "Betting period ended");
        require(optionIdx < m.options.length,  "Invalid option");
        require(msg.value >= MIN_BET,          "Below minimum bet");

        m.optionPools[optionIdx] += msg.value;
        m.totalPool              += msg.value;

        userBets[marketId][msg.sender].push(Bet({
            optionIndex: optionIdx,
            amount:      msg.value,
            claimed:     false
        }));
        userTotalBet[marketId][msg.sender] += msg.value;

        // Track unique bettors for refunds
        if (!_hasBet[marketId][msg.sender]) {
            _hasBet[marketId][msg.sender] = true;
            _marketBettors[marketId].push(msg.sender);
        }

        emit BetPlaced(marketId, msg.sender, optionIdx, msg.value);
    }

    // ─── User: claim winnings ─────────────────────────────────────────────────

    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = _markets[marketId];
        require(m.state == MarketState.Resolved, "Not resolved");

        Bet[] storage bets = userBets[marketId][msg.sender];
        uint256 winningPool = m.optionPools[m.winningOption];
        uint256 totalPayout;

        for (uint256 i; i < bets.length; i++) {
            Bet storage b = bets[i];
            if (b.claimed || b.optionIndex != m.winningOption) continue;
            uint256 gross    = (b.amount * m.totalPool) / winningPool;
            uint256 fee      = (gross * FEE_BPS) / 10_000;
            accumulatedFees += fee;
            totalPayout     += gross - fee;
            b.claimed        = true;
        }

        require(totalPayout > 0, "Nothing to claim");
        (bool ok,) = payable(msg.sender).call{value: totalPayout}("");
        require(ok, "Transfer failed");
        emit WinningsClaimed(marketId, msg.sender, totalPayout);
    }

    // ─── Admin: fee withdrawal ────────────────────────────────────────────────

    function withdrawFees(address payable to) external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees");
        accumulatedFees = 0;
        (bool ok,) = to.call{value: amount}("");
        require(ok, "Transfer failed");
        emit FeeWithdrawn(to, amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getMarket(uint256 marketId)      external view returns (Market memory)   { return _markets[marketId]; }
    function getProposal(uint256 proposalId)  external view returns (Proposal memory) { return _proposals[proposalId]; }
    function getUserBets(uint256 marketId, address user) external view returns (Bet[] memory) { return userBets[marketId][user]; }
    function getMarketBettors(uint256 marketId) external view returns (address[] memory) { return _marketBettors[marketId]; }
    function isRefunded(uint256 marketId, address bettor) external view returns (bool) { return _refunded[marketId][bettor]; }
    function totalMarkets()   external view returns (uint256) { return _nextMarketId; }
    function totalProposals() external view returns (uint256) { return _nextProposalId; }
}
