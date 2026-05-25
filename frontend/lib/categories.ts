/**
 * Shared category definitions used in CreateMarketModal, ProposeMarketModal,
 * MarketCard and MarketFilters.
 * iconName strings are resolved to Lucide components inside each "use client" component.
 */

export interface CategoryDef {
  value:    number;
  label:    string;
  subtitle: string;
  iconName: string;
  /** tailwind text-color class for the icon (unselected state) */
  color:    string;
  /** tailwind border + bg + text classes for the selected state */
  active:   string;
}

export const ALL_CATEGORIES: CategoryDef[] = [
  {
    value:    0,
    label:    "Crypto",
    subtitle: "BTC · ETH · DeFi",
    iconName: "Coins",
    color:    "text-arc-400",
    active:   "border-arc-600/70 bg-arc-600/15 text-arc-300",
  },
  {
    value:    1,
    label:    "Sports",
    subtitle: "Football · Basketball · Tennis",
    iconName: "Trophy",
    color:    "text-green-400",
    active:   "border-green-600/70 bg-green-600/15 text-green-300",
  },
  {
    value:    2,
    label:    "General",
    subtitle: "World Events · Culture · Tech",
    iconName: "Newspaper",
    color:    "text-amber-400",
    active:   "border-amber-600/70 bg-amber-600/15 text-amber-300",
  },
  {
    value:    3,
    label:    "Inflation",
    subtitle: "CPI · PPI · PCE",
    iconName: "TrendingUp",
    color:    "text-orange-400",
    active:   "border-orange-600/70 bg-orange-600/15 text-orange-300",
  },
  {
    value:    4,
    label:    "Interest Rates",
    subtitle: "FED · ECB · BOE · BOJ",
    iconName: "Percent",
    color:    "text-blue-400",
    active:   "border-blue-600/70 bg-blue-600/15 text-blue-300",
  },
  {
    value:    5,
    label:    "Macro Data",
    subtitle: "GDP · Unemployment · PMI",
    iconName: "BarChart3",
    color:    "text-cyan-400",
    active:   "border-cyan-600/70 bg-cyan-600/15 text-cyan-300",
  },
  {
    value:    6,
    label:    "Geopolitical",
    subtitle: "Conflict · Diplomacy · Sanctions",
    iconName: "Globe",
    color:    "text-red-400",
    active:   "border-red-600/70 bg-red-600/15 text-red-300",
  },
  {
    value:    7,
    label:    "Corporate",
    subtitle: "Earnings · Revenue · Guidance",
    iconName: "Building2",
    color:    "text-purple-400",
    active:   "border-purple-600/70 bg-purple-600/15 text-purple-300",
  },
  {
    value:    8,
    label:    "Energy",
    subtitle: "Oil · Gas · Gold · Metals",
    iconName: "Flame",
    color:    "text-yellow-400",
    active:   "border-yellow-600/70 bg-yellow-600/15 text-yellow-300",
  },
  {
    value:    9,
    label:    "Policy",
    subtitle: "Regulation · Legislation · Elections",
    iconName: "Landmark",
    color:    "text-emerald-400",
    active:   "border-emerald-600/70 bg-emerald-600/15 text-emerald-300",
  },
];
