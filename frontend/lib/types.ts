export type MarketState = 0 | 1 | 2 | 3;
export type Category   = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const MARKET_STATE_LABEL: Record<MarketState, string> = {
  0: "Active",
  1: "Locked",
  2: "Resolved",
  3: "Cancelled",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  0: "Crypto",
  1: "Sports",
  2: "General",
  3: "Inflation",
  4: "Interest Rates",
  5: "Macro Data",
  6: "Geopolitical",
  7: "Corporate",
  8: "Energy",
  9: "Policy",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  0: "text-arc-400     bg-arc-600/10     border-arc-600/30",
  1: "text-green-400   bg-green-600/10   border-green-600/30",
  2: "text-amber-400   bg-amber-600/10   border-amber-600/30",
  3: "text-orange-400  bg-orange-600/10  border-orange-600/30",
  4: "text-blue-400    bg-blue-600/10    border-blue-600/30",
  5: "text-cyan-400    bg-cyan-600/10    border-cyan-600/30",
  6: "text-red-400     bg-red-600/10     border-red-600/30",
  7: "text-purple-400  bg-purple-600/10  border-purple-600/30",
  8: "text-yellow-400  bg-yellow-600/10  border-yellow-600/30",
  9: "text-emerald-400 bg-emerald-600/10 border-emerald-600/30",
};

export const STATE_COLOR: Record<MarketState, string> = {
  0: "text-green-400  bg-green-600/10  border-green-600/30",
  1: "text-amber-400  bg-amber-600/10  border-amber-600/30",
  2: "text-arc-400    bg-arc-600/10    border-arc-600/30",
  3: "text-red-400    bg-red-600/10    border-red-600/30",
};

export interface Market {
  id:            bigint;
  question:      string;
  options:       string[];
  endTime:       bigint;
  category:      Category;
  state:         MarketState;
  winningOption: bigint;
  totalPool:     bigint;
  optionPools:   bigint[];
  imageUrl:      string;
  createdAt:     bigint;
  creator:       `0x${string}`;
  resolvedAt:    bigint;
  hasClaims:     boolean;
}

export interface UserBet {
  optionIndex: bigint;
  amount:      bigint;
  claimed:     boolean;
}

export interface Proposal {
  id:        bigint;
  question:  string;
  options:   string[];
  endTime:   bigint;
  category:  Category;
  imageUrl:  string;
  proposer:  `0x${string}`;
  status:    0 | 1 | 2; // Pending | Approved | Rejected
  createdAt: bigint;
}

export type CategoryFilter =
  | "All"
  | "Crypto"
  | "Sports"
  | "General"
  | "Inflation"
  | "Interest Rates"
  | "Macro Data"
  | "Geopolitical"
  | "Corporate"
  | "Energy"
  | "Policy";

export type StateFilter = "All" | "Active" | "Locked" | "Resolved";
