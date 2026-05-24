export const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const PREDICTION_MARKET_ABI = [
  // ── Read ──────────────────────────────────────────────────────────────────
  {
    name: "totalMarkets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getMarket",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id",            type: "uint256" },
          { name: "question",      type: "string"  },
          { name: "options",       type: "string[]" },
          { name: "endTime",       type: "uint256" },
          { name: "category",      type: "uint8"   },
          { name: "state",         type: "uint8"   },
          { name: "winningOption", type: "uint256" },
          { name: "totalPool",     type: "uint256" },
          { name: "optionPools",   type: "uint256[]" },
          { name: "imageUrl",      type: "string"  },
          { name: "createdAt",     type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getUserBets",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "user",     type: "address" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "optionIndex", type: "uint256" },
          { name: "amount",      type: "uint256" },
          { name: "claimed",     type: "bool"    },
        ],
      },
    ],
  },
  {
    name: "FEE_BPS",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // ── Write ─────────────────────────────────────────────────────────────────
  {
    name: "placeBet",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "marketId",  type: "uint256" },
      { name: "optionIdx", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "claimWinnings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: "BetPlaced",
    type: "event",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true  },
      { name: "bettor",   type: "address", indexed: true  },
      { name: "option",   type: "uint256", indexed: false },
      { name: "amount",   type: "uint256", indexed: false },
    ],
  },
  {
    name: "MarketResolved",
    type: "event",
    inputs: [
      { name: "marketId",      type: "uint256", indexed: true  },
      { name: "winningOption", type: "uint256", indexed: false },
    ],
  },
  {
    name: "WinningsClaimed",
    type: "event",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true  },
      { name: "bettor",   type: "address", indexed: true  },
      { name: "amount",   type: "uint256", indexed: false },
    ],
  },
] as const;

export const contractConfig = {
  address: PREDICTION_MARKET_ADDRESS,
  abi:     PREDICTION_MARKET_ABI,
} as const;
