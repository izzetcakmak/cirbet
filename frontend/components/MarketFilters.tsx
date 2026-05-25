"use client";

import type { CategoryFilter, StateFilter } from "@/lib/types";
import { useI18n } from "@/lib/i18nContext";

const CATEGORIES: CategoryFilter[] = ["All", "Crypto", "Sports", "General"];
const STATES: StateFilter[]        = ["All", "Active", "Locked", "Resolved"];

interface Props {
  category:    CategoryFilter;
  state:       StateFilter;
  onCategory:  (v: CategoryFilter) => void;
  onState:     (v: StateFilter)    => void;
  totalCount:  number;
}

export function MarketFilters({ category, state, onCategory, onState, totalCount }: Props) {
  const { t } = useI18n();

  const categoryLabels: Record<CategoryFilter, string> = {
    All:     t("filterAll"),
    Crypto:  t("filterCrypto"),
    Sports:  t("filterSports"),
    General: t("filterGeneral"),
  };

  const stateLabels: Record<StateFilter, string> = {
    All:      t("filterAll"),
    Active:   t("filterActive"),
    Locked:   t("filterLocked"),
    Resolved: t("filterResolved"),
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">

      {/* Category filters */}
      <div className="flex items-center gap-1.5 bg-surface-1 border border-border rounded-2xl p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onCategory(c)}
            className={`filter-tab ${category === c ? "filter-tab-active" : "filter-tab-inactive"}`}
          >
            {categoryLabels[c]}
          </button>
        ))}
      </div>

      {/* State filters + count */}
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
