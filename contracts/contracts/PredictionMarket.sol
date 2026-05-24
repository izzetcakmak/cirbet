// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CirBet Prediction Market
 * @notice Decentralized prediction market on Arc Network — native USDC (6 decimals) as betting currency
 */
contract PredictionMarket is Ownable, ReentrancyGuard {

    // ─── Types ───────────────────────────────────────────────────────────────

    enum MarketState { Active, Locked, Resolved }
    enum Category    { Crypto, Sports, General }

    struct Market {
        uint256 id;
        string  question;
        string[] options;
        uint256  endTime;
        Category category;
        MarketState state;
        uint256  winningOption;   // only valid when Resolved
        uint256  totalPool;       // total USDC (6 dec) in pool
        uint256[] optionPools;    // USDC per option
        string   imageUrl;        // optional cover image
        uint256  createdAt;
    }

    struct Bet {
        uint256 optionIndex;
        uint256 amount;           // USDC (6 dec)
        bool    claimed;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant FEE_BPS = 300; // 3% platform fee
    uint256 public constant MIN_BET  = 1_000; // 0.001 USDC

    uint256 private _nextId;
    uint256 public  accumulatedFees;

    mapping(uint256 => Market) public markets;
    // marketId → user → Bet[]
    mapping(uint256 => mapping(address => Bet[])) public userBets;
    // marketId → user → total amount bet (for quick lookup)
    mapping(uint256 => mapping(address => uint256)) public userTotalBet;

    // ─── Events ───────────────────────────────────────────────────────────────

    event MarketCreated(uint256 indexed id, string question, Category category, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, address indexed bettor, uint256 option, uint256 amount);
    event MarketLocked(uint256 indexed marketId);
    event MarketResolved(uint256 indexed marketId, uint256 winningOption);
    event WinningsClaimed(uint256 indexed marketId, address indexed bettor, uint256 amount);
    event FeeWithdrawn(address indexed to, uint256 amount);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Admin: Market Management ────────────────────────────────────────────

    function createMarket(
        string calldata question,
        string[] calldata options,
        uint256 endTime,
        Category category,
        string calldata imageUrl
    ) external onlyOwner returns (uint256 id) {
        require(options.length >= 2 && options.length <= 8, "2-8 options required");
        require(endTime > block.timestamp, "endTime must be future");

        id = _nextId++;

        uint256[] memory pools = new uint256[](options.length);
        string[] memory _opts = options;

        markets[id] = Market({
            id: id,
            question: question,
            options: _opts,
            endTime: endTime,
            category: category,
            state: MarketState.Active,
            winningOption: 0,
            totalPool: 0,
            optionPools: pools,
            imageUrl: imageUrl,
            createdAt: block.timestamp
        });

        emit MarketCreated(id, question, category, endTime);
    }

    function lockMarket(uint256 marketId) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.state == MarketState.Active, "Not active");
        require(block.timestamp >= m.endTime, "Not ended yet");
        m.state = MarketState.Locked;
        emit MarketLocked(marketId);
    }

    function resolveMarket(uint256 marketId, uint256 winningOption) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.state == MarketState.Locked, "Not locked");
        require(winningOption < m.options.length, "Invalid option");
        m.state = MarketState.Resolved;
        m.winningOption = winningOption;
        emit MarketResolved(marketId, winningOption);
    }

    // ─── User: Betting ────────────────────────────────────────────────────────

    /**
     * @notice Place a bet — send native USDC as msg.value
     * @param marketId  Target market
     * @param optionIdx Index of the chosen option
     */
    function placeBet(uint256 marketId, uint256 optionIdx) external payable nonReentrant {
        Market storage m = markets[marketId];
        require(m.state == MarketState.Active, "Market not active");
        require(block.timestamp < m.endTime,   "Betting period ended");
        require(optionIdx < m.options.length,  "Invalid option");
        require(msg.value >= MIN_BET,           "Below minimum bet");

        m.optionPools[optionIdx] += msg.value;
        m.totalPool              += msg.value;

        userBets[marketId][msg.sender].push(Bet({
            optionIndex: optionIdx,
            amount:      msg.value,
            claimed:     false
        }));

        userTotalBet[marketId][msg.sender] += msg.value;

        emit BetPlaced(marketId, msg.sender, optionIdx, msg.value);
    }

    // ─── User: Claiming ───────────────────────────────────────────────────────

    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.state == MarketState.Resolved, "Not resolved");

        Bet[] storage bets = userBets[marketId][msg.sender];
        uint256 winningPool = m.optionPools[m.winningOption];

        uint256 totalPayout;
        for (uint256 i; i < bets.length; i++) {
            Bet storage b = bets[i];
            if (b.claimed || b.optionIndex != m.winningOption) continue;
            // proportional share of totalPool minus fee
            uint256 gross = (b.amount * m.totalPool) / winningPool;
            uint256 fee   = (gross * FEE_BPS) / 10_000;
            accumulatedFees += fee;
            totalPayout     += gross - fee;
            b.claimed = true;
        }

        require(totalPayout > 0, "Nothing to claim");

        (bool ok,) = payable(msg.sender).call{value: totalPayout}("");
        require(ok, "Transfer failed");

        emit WinningsClaimed(marketId, msg.sender, totalPayout);
    }

    // ─── Admin: Fee Withdrawal ────────────────────────────────────────────────

    function withdrawFees(address payable to) external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees");
        accumulatedFees = 0;
        (bool ok,) = to.call{value: amount}("");
        require(ok, "Transfer failed");
        emit FeeWithdrawn(to, amount);
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getOptions(uint256 marketId) external view returns (string[] memory) {
        return markets[marketId].options;
    }

    function getOptionPools(uint256 marketId) external view returns (uint256[] memory) {
        return markets[marketId].optionPools;
    }

    function getUserBets(uint256 marketId, address user) external view returns (Bet[] memory) {
        return userBets[marketId][user];
    }

    function totalMarkets() external view returns (uint256) {
        return _nextId;
    }
}
