"use client";

import type { CategoryFilter, StateFilter } from "@/lib/types";
import { useI18n } from "@/lib/i18nContext";

const CATEGORIES: CategoryFilter[] = [
  "All", "Crypto", "Sports", "General",
  "Inflation", "Interest Rates", "Macro Data",
  "Geopolitical", "Corporate", "Energy", "Policy",
];

const STATES: StateFilter[] = ["All", "Active", "Locked", "Resolved"];

interface Props {
  category:   CategoryFilter;
  state:      StateFilter;
  onCategory: (v: CategoryFilter) => void;
  onState:    (v: StateFilter)    => void;
  totalCount: number;
}

export function MarketFilters({ category, state, onCategory, onState, totalCount }: Props) {
  const { t } = useI18n();

  const categoryLabels: Record<CategoryFilter, string> = {
    All:              t("filterAll"),
    Crypto:           t("filterCrypto"),
    Sports:           t("filterSports"),
    General:          t("filterGeneral"),
    Inflation:        t("filterInflation"),
    "Interest Rates": t("filterRates"),
    "Macro Data":     t("filterMacro"),
    Geopolitical:     t("filterGeopolitical"),
    Corporate:        t("filterCorporate"),
    Energy:           t("filterEnergy"),
    Policy:           t("filterPolicy"),
  };

  const stateLabels: Record<StateFilter, string> = {
    All:      t("filterAll"),
    Active:   t("filterActive"),
    Locked:   t("filterLocked"),
    Resolved: t("filterResolved"),
  };

  return (
    <div className="flex flex-col gap-3 mb-8">

      {/* Row 1 — Category scroll */}
      <div
        className="overflow-x-auto
                   [&::-webkit-scrollbar]:h-0
                   [-ms-overflow-style:none]
                   [scrollbar-width:none]"
      >
        <div className="flex items-center gap-1.5 bg-surface-1 border border-border
                        rounded-2xl p-1 w-max min-w-full sm:min-w-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={`filter-tab whitespace-nowrap ${category === c ? "filter-tab-active" : "filter-tab-inactive"}`}
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 — State + count */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-surface-1 border border-border rounded-2xl p-1">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => onState(s)}
              className={`filter-tab ${state === s ? "filter-tab-active" : "filter-tab-inactive"}`}
            >
              {stateLabels[s]}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {totalCount} {t("filterMarkets")}
        </span>
      </div>

    </div>
  );
}
