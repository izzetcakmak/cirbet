// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CirBet Prediction Market
 * @notice Prediction market on Arc Network — native USDC (6 dec)
 *         States: Active → Locked → Resolved | Active/Locked → Cancelled (full refund)
 *
 * Fee structure:
 *   - All markets: 3% fee on winnings
 *   - If totalPool > creatorFeeThreshold:
 *       2% → admin (accumulatedFees)
 *       1% → market creator (creatorFees[creator])
 *   - If totalPool <= creatorFeeThreshold:
 *       3% → admin (accumulatedFees)
 */
contract PredictionMarket is Ownable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum MarketState    { Active, Locked, Resolved, Cancelled }
    enum Category       { Crypto, Sports, General, Inflation, Rates, Macro, Geopolitical, Corporate, Energy, Policy }
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
        address   creator;      // market creator (admin or proposer)
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

    uint256 public constant FEE_BPS        = 300;   // 3% total fee
    uint256 public constant ADMIN_FEE_BPS  = 200;   // 2% admin share (when above threshold)
    uint256 public constant CREATOR_FEE_BPS = 100;  // 1% creator share (when above threshold)
    uint256 public constant MIN_BET        = 1_000; // 0.001 USDC

    /// @notice Pool threshold above which creator fee kicks in (default: 100 USDC = 100_000_000)
    uint256 public creatorFeeThreshold = 100_000_000;

    uint256 private _nextMarketId;
    uint256 private _nextProposalId;
    uint256 public  accumulatedFees;

    /// @notice Accumulated creator fees per address (claimable by creator)
    mapping(address => uint256) public creatorFees;

    mapping(uint256 => Market)   private _markets;
    mapping(uint256 => Proposal) private _proposals;

    mapping(uint256 => mapping(address => Bet[]))   public userBets;
    mapping(uint256 => mapping(address => uint256)) public userTotalBet;

    // bettor tracking for refunds
    mapping(uint256 => address[])                   private _marketBettors;
    mapping(uint256 => mapping(address => bool))    private _hasBet;
    mapping(uint256 => mapping(address => bool))    private _refunded;

    // ─── Events ───────────────────────────────────────────────────────────────

    event MarketCreated      (uint256 indexed id, string question, Category category, uint256 endTime, address indexed creator);
    event MarketProposed     (uint256 indexed proposalId, address indexed proposer, string question);
    event ProposalApproved   (uint256 indexed proposalId, uint256 indexed marketId);
    event ProposalRejected   (uint256 indexed proposalId);
    event BetPlaced          (uint256 indexed marketId, address indexed bettor, uint256 option, uint256 amount);
    event MarketLocked       (uint256 indexed marketId);
    event MarketResolved     (uint256 indexed marketId, uint256 winningOption);
    event MarketCancelled    (uint256 indexed marketId, uint256 totalRefunded, uint256 bettorCount);
    event RefundClaimed      (uint256 indexed marketId, address indexed bettor, uint256 amount);
    event WinningsClaimed    (uint256 indexed marketId, address indexed bettor, uint256 amount);
    event FeeWithdrawn       (address indexed to, uint256 amount);
    event CreatorFeeEarned   (uint256 indexed marketId, address indexed creator, uint256 amount);
    event CreatorFeeWithdrawn(address indexed creator, uint256 amount);
    event ThresholdUpdated   (uint256 oldThreshold, uint256 newThreshold);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Admin: threshold management ─────────────────────────────────────────

    /**
     * @notice Update the pool threshold above which creator fees apply.
     *         Set to 100_000_000 for 100 USDC (testing), 100_000_000_000 for 100k USDC (production).
     */
    function setCreatorFeeThreshold(uint256 newThreshold) external onlyOwner {
        emit ThresholdUpdated(creatorFeeThreshold, newThreshold);
        creatorFeeThreshold = newThreshold;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _createMarket(
        string memory   question,
        string[] memory options,
        uint256         endTime,
        Category        category,
        string memory   imageUrl,
        address         creator
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
            createdAt:     block.timestamp,
            creator:       creator
        });

        emit MarketCreated(id, question, category, endTime, creator);
    }

    // ─── Admin: direct market creation ───────────────────────────────────────

    function createMarket(
        string   calldata question,
        string[] calldata options,
        uint256           endTime,
        Category          category,
        string   calldata imageUrl
    ) external onlyOwner returns (uint256) {
        return _createMarket(question, options, endTime, category, imageUrl, owner());
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
                _refunded[marketId][bettor] = false;
                totalRefunded -= amount;
            }
        }

        emit MarketCancelled(marketId, totalRefunded, bettors.length);
    }

    // ─── User: claim refund ───────────────────────────────────────────────────

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
        // Creator = original proposer (earns 1% fee when pool > threshold)
        marketId = _createMarket(p.question, p.options, p.endTime, p.category, p.imageUrl, p.proposer);
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

        if (!_hasBet[marketId][msg.sender]) {
            _hasBet[marketId][msg.sender] = true;
            _marketBettors[marketId].push(msg.sender);
        }

        emit BetPlaced(marketId, msg.sender, optionIdx, msg.value);
    }

    // ─── User: claim winnings ─────────────────────────────────────────────────

    /**
     * @notice Claim winnings for a resolved market.
     *         Fee split logic:
     *           - totalPool > creatorFeeThreshold → 2% admin + 1% creator
     *           - totalPool ≤ creatorFeeThreshold → 3% admin
     *         Winners always receive 97% of their gross payout.
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = _markets[marketId];
        require(m.state == MarketState.Resolved, "Not resolved");

        Bet[] storage bets   = userBets[marketId][msg.sender];
        uint256 winningPool  = m.optionPools[m.winningOption];
        uint256 totalPayout;
        uint256 totalCreatorFee;

        bool aboveThreshold = m.totalPool > creatorFeeThreshold;

        for (uint256 i; i < bets.length; i++) {
            Bet storage b = bets[i];
            if (b.claimed || b.optionIndex != m.winningOption) continue;

            uint256 gross = (b.amount * m.totalPool) / winningPool;

            if (aboveThreshold) {
                // 2% to admin, 1% to creator
                uint256 adminFee   = (gross * ADMIN_FEE_BPS)   / 10_000;
                uint256 creatorFee = (gross * CREATOR_FEE_BPS) / 10_000;
                accumulatedFees   += adminFee;
                totalCreatorFee   += creatorFee;
                totalPayout       += gross - adminFee - creatorFee;
            } else {
                // 3% to admin
                uint256 fee     = (gross * FEE_BPS) / 10_000;
                accumulatedFees += fee;
                totalPayout     += gross - fee;
            }

            b.claimed = true;
        }

        require(totalPayout > 0, "Nothing to claim");

        // Credit creator fees
        if (totalCreatorFee > 0) {
            address creator = m.creator;
            creatorFees[creator] += totalCreatorFee;
            emit CreatorFeeEarned(marketId, creator, totalCreatorFee);
        }

        (bool ok,) = payable(msg.sender).call{value: totalPayout}("");
        require(ok, "Transfer failed");
        emit WinningsClaimed(marketId, msg.sender, totalPayout);
    }

    // ─── Creator: withdraw fees ───────────────────────────────────────────────

    /**
     * @notice Market creators withdraw their accumulated 1% fee earnings.
     */
    function withdrawCreatorFees() external nonReentrant {
        uint256 amount = creatorFees[msg.sender];
        require(amount > 0, "No creator fees");
        creatorFees[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit CreatorFeeWithdrawn(msg.sender, amount);
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
