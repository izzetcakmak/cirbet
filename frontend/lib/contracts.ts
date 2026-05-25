export const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const OWNER_ADDRESS = "0xd4f1254c803662c46d9c21f80f4f3c15ff57e2c9" as const;

export const PREDICTION_MARKET_ABI = [
  // ── Read ──────────────────────────────────────────────────────────────────
  { name:"totalMarkets",    type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  { name:"totalProposals",  type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  { name:"accumulatedFees", type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  { name:"owner",           type:"function", stateMutability:"view", inputs:[], outputs:[{type:"address"}] },
  { name:"FEE_BPS",         type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  {
    name:"getMarket", type:"function", stateMutability:"view",
    inputs:[{name:"marketId",type:"uint256"}],
    outputs:[{ type:"tuple", components:[
      {name:"id",            type:"uint256"},
      {name:"question",      type:"string"},
      {name:"options",       type:"string[]"},
      {name:"endTime",       type:"uint256"},
      {name:"category",      type:"uint8"},
      {name:"state",         type:"uint8"},
      {name:"winningOption", type:"uint256"},
      {name:"totalPool",     type:"uint256"},
      {name:"optionPools",   type:"uint256[]"},
      {name:"imageUrl",      type:"string"},
      {name:"createdAt",     type:"uint256"},
    ]}],
  },
  {
    name:"getProposal", type:"function", stateMutability:"view",
    inputs:[{name:"proposalId",type:"uint256"}],
    outputs:[{ type:"tuple", components:[
      {name:"id",        type:"uint256"},
      {name:"question",  type:"string"},
      {name:"options",   type:"string[]"},
      {name:"endTime",   type:"uint256"},
      {name:"category",  type:"uint8"},
      {name:"imageUrl",  type:"string"},
      {name:"proposer",  type:"address"},
      {name:"status",    type:"uint8"},
      {name:"createdAt", type:"uint256"},
    ]}],
  },
  {
    name:"getUserBets", type:"function", stateMutability:"view",
    inputs:[{name:"marketId",type:"uint256"},{name:"user",type:"address"}],
    outputs:[{ type:"tuple[]", components:[
      {name:"optionIndex",type:"uint256"},
      {name:"amount",     type:"uint256"},
      {name:"claimed",    type:"bool"},
    ]}],
  },

  // ── User write ─────────────────────────────────────────────────────────────
  {
    name:"placeBet", type:"function", stateMutability:"payable",
    inputs:[{name:"marketId",type:"uint256"},{name:"optionIdx",type:"uint256"}],
    outputs:[],
  },
  { name:"claimWinnings", type:"function", stateMutability:"nonpayable", inputs:[{name:"marketId",type:"uint256"}], outputs:[] },
  {
    name:"proposeMarket", type:"function", stateMutability:"nonpayable",
    inputs:[
      {name:"question", type:"string"},
      {name:"options",  type:"string[]"},
      {name:"endTime",  type:"uint256"},
      {name:"category", type:"uint8"},
      {name:"imageUrl", type:"string"},
    ],
    outputs:[{name:"proposalId",type:"uint256"}],
  },

  // ── Admin write ────────────────────────────────────────────────────────────
  {
    name:"createMarket", type:"function", stateMutability:"nonpayable",
    inputs:[
      {name:"question", type:"string"},
      {name:"options",  type:"string[]"},
      {name:"endTime",  type:"uint256"},
      {name:"category", type:"uint8"},
      {name:"imageUrl", type:"string"},
    ],
    outputs:[{name:"id",type:"uint256"}],
  },
  { name:"approveProposal", type:"function", stateMutability:"nonpayable", inputs:[{name:"proposalId",type:"uint256"}], outputs:[{name:"marketId",type:"uint256"}] },
  { name:"rejectProposal",  type:"function", stateMutability:"nonpayable", inputs:[{name:"proposalId",type:"uint256"}], outputs:[] },
  { name:"lockMarket",      type:"function", stateMutability:"nonpayable", inputs:[{name:"marketId",type:"uint256"}], outputs:[] },
  {
    name:"resolveMarket", type:"function", stateMutability:"nonpayable",
    inputs:[{name:"marketId",type:"uint256"},{name:"winningOption",type:"uint256"}],
    outputs:[],
  },
  { name:"withdrawFees", type:"function", stateMutability:"nonpayable", inputs:[{name:"to",type:"address"}], outputs:[] },

  // ── Events ─────────────────────────────────────────────────────────────────
  { name:"MarketCreated",    type:"event", inputs:[{name:"id",type:"uint256",indexed:true},{name:"question",type:"string",indexed:false},{name:"category",type:"uint8",indexed:false},{name:"endTime",type:"uint256",indexed:false}] },
  { name:"MarketProposed",   type:"event", inputs:[{name:"proposalId",type:"uint256",indexed:true},{name:"proposer",type:"address",indexed:true},{name:"question",type:"string",indexed:false}] },
  { name:"ProposalApproved", type:"event", inputs:[{name:"proposalId",type:"uint256",indexed:true},{name:"marketId",type:"uint256",indexed:true}] },
  { name:"ProposalRejected", type:"event", inputs:[{name:"proposalId",type:"uint256",indexed:true}] },
  { name:"BetPlaced",        type:"event", inputs:[{name:"marketId",type:"uint256",indexed:true},{name:"bettor",type:"address",indexed:true},{name:"option",type:"uint256",indexed:false},{name:"amount",type:"uint256",indexed:false}] },
  { name:"MarketLocked",     type:"event", inputs:[{name:"marketId",type:"uint256",indexed:true}] },
  { name:"MarketResolved",   type:"event", inputs:[{name:"marketId",type:"uint256",indexed:true},{name:"winningOption",type:"uint256",indexed:false}] },
  { name:"WinningsClaimed",  type:"event", inputs:[{name:"marketId",type:"uint256",indexed:true},{name:"bettor",type:"address",indexed:true},{name:"amount",type:"uint256",indexed:false}] },
] as const;

export const contractConfig = {
  address: PREDICTION_MARKET_ADDRESS,
  abi:     PREDICTION_MARKET_ABI,
} as const;
