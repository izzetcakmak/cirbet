"use client";

import { useState, useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { Loader2, SearchX } from "lucide-react";
import { Header } from "@/components/Header";
import { CirBetLogo } from "@/components/CirBetLogo";
import { MarketCard } from "@/components/MarketCard";
import { MarketFilters } from "@/components/MarketFilters";
import { contractConfig } from "@/lib/contracts";
import type { Market, CategoryFilter, StateFilter } from "@/lib/types";
import { CATEGORY_LABEL, MARKET_STATE_LABEL } from "@/lib/types";
import { useI18n } from "@/lib/i18nContext";

// ─── Market data fetching ─────────────────────────────────────────────────────

function useMarkets() {
  const { data: total, refetch: refetchTotal } = useReadContract({
    ...contractConfig,
    functionName: "totalMarkets",
  });

  const count = Number(total ?? 0n);

  const { data: marketResults, isLoading, refetch: refetchMarkets } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      ...contractConfig,
      functionName: "getMarket" as const,
      args: [BigInt(i)] as const,
    })),
    query: { enabled: count > 0 },
  });

  const markets: Market[] = useMemo(() => {
    if (!marketResults) return [];
    return marketResults
      .map((r) => r.result as Market | undefined)
      .filter((m): m is Market => m !== undefined);
  }, [marketResults]);

  function refetch() {
    refetchTotal();
    refetchMarkets();
  }

  return { markets, isLoading: isLoading && count > 0, total: count, refetch };
}

// ─── Category / State filter logic ───────────────────────────────────────────

function filterMarkets(
  markets: Market[],
  category: CategoryFilter,
  state: StateFilter,
): Market[] {
  return markets.filter((m) => {
    const catOk =
      category === "All" || CATEGORY_LABEL[m.category] === category;
    const stateOk =
      state === "All" || MARKET_STATE_LABEL[m.state] === state;
    return catOk && stateOk;
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { t } = useI18n();
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [state,    setState]    = useState<StateFilter>("All");

  const { markets, isLoading, refetch } = useMarkets();
  const filtered = useMemo(
    () => filterMarkets(markets, category, state),
    [markets, category, state],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-14 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-arc-600/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-arc-600/10 border border-arc-600/20
                          rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-arc-400">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {t("heroBadge")}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-8 mt-10 text-sm">
            <Stat label={t("statsMarkets")} value={markets.length.toString()} />
            <div className="w-px h-8 bg-border" />
            <Stat label={t("statsActive")} value={markets.filter((m) => m.state === 0).length.toString()} />
            <div className="w-px h-8 bg-border" />
            <Stat label={t("statsResolved")} value={markets.filter((m) => m.state === 2).length.toString()} />
            <div className="w-px h-8 bg-border hidden sm:block" />
            <Stat label={t("statsNetwork")} value="Arc Testnet" className="hidden sm:block" />
          </div>
        </div>
      </section>

      {/* Markets section */}
      <main id="markets" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-20">
        <MarketFilters
          category={category}
          state={state}
          onCategory={setCategory}
          onState={setState}
          totalCount={filtered.length}
        />

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <Loader2 size={32} className="animate-spin text-arc-500" />
            <p className="text-sm">{t("loadingMarkets")}</p>
          </div>
        )}

        {/* No contract deployed yet */}
        {!isLoading && markets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
              <CirBetLogo size={44} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg mb-1">{t("noMarketsYet")}</p>
              <p className="text-gray-500 text-sm max-w-sm">
                Deploy the contract and create your first prediction market to get started.
              </p>
            </div>
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-sm"
            >
              View on ArcScan
            </a>
          </div>
        )}

        {/* No results after filter */}
        {!isLoading && markets.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <SearchX size={36} className="text-gray-600" />
            <p className="text-gray-400 text-sm">{t("noMarketsFilter")}</p>
            <button
              onClick={() => { setCategory("All"); setState("All"); }}
              className="btn-ghost text-xs"
            >
              {t("clearFilters")}
            </button>
          </div>
        )}

        {/* Market grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((market) => (
              <MarketCard
                key={market.id.toString()}
                market={market}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4
                        text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <CirBetLogo size={20} />
            <span>CirBet © 2026 — Built on Arc Network</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://docs.arc.io" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Docs</a>
            <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Faucet</a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Explorer</a>
            <a href="https://x.com/tembetpro" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Twitter</a>
            <a href="mailto:info@cirbet.xyz" className="hover:text-gray-400 transition-colors">info@cirbet.xyz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <span className="text-white font-bold text-xl">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}
