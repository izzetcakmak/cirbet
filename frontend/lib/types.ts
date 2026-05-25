export type MarketState = 0 | 1 | 2; // Active | Locked | Resolved
export type Category   = 0 | 1 | 2; // Crypto | Sports | General

export const MARKET_STATE_LABEL: Record<MarketState, string> = {
  0: "Active",
  1: "Locked",
  2: "Resolved",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  0: "Crypto",
  1: "Sports",
  2: "General",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  0: "text-arc-400  bg-arc-600/10  border-arc-600/30",
  1: "text-green-400 bg-green-600/10 border-green-600/30",
  2: "text-amber-400 bg-amber-600/10 border-amber-600/30",
};

export const STATE_COLOR: Record<MarketState, string> = {
  0: "text-green-400  bg-green-600/10  border-green-600/30",
  1: "text-amber-400  bg-amber-600/10  border-amber-600/30",
  2: "text-arc-400    bg-arc-600/10    border-arc-600/30",
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

export type CategoryFilter = "All" | "Crypto" | "Sports" | "General";
export type StateFilter    = "All" | "Active"  | "Locked"  | "Resolved";
