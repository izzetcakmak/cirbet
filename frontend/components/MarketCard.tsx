"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { Clock, TrendingUp, Trophy, Share2 } from "lucide-react";
import { PlaceBetModal } from "./PlaceBetModal";
import type { Market } from "@/lib/types";
import {
  CATEGORY_COLOR,
  STATE_COLOR,
} from "@/lib/types";
import { useI18n } from "@/lib/i18nContext";

interface Props {
  market: Market;
  onRefresh?: () => void;
}

function timeLeft(endTime: bigint, endedText: string): string {
  const diff = Number(endTime) - Math.floor(Date.now() / 1000);
  if (diff <= 0) return endedText;
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function MarketCard({ market, onRefresh }: Props) {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);

  const totalPool  = Number(formatUnits(market.totalPool, 6));
  const isActive   = market.state === 0;
  const isResolved = market.state === 2;

  // Map numeric category/state to translated display labels
  const categoryLabel: Record<number, string> = {
    0: t("filterCrypto"),
    1: t("filterSports"),
    2: t("filterGeneral"),
    3: "Inflation",
    4: "Interest Rates",
    5: "Macro Data",
    6: "Geopolitical",
    7: "Corporate",
    8: "Energy",
    9: "Policy",
  };
  const stateLabel: Record<number, string> = {
    0: t("filterActive"),
    1: t("filterLocked"),
    2: t("filterResolved"),
    3: t("filterCancelled"),
  };

  function getPct(i: number): number {
    const optPool = Number(formatUnits(market.optionPools[i] ?? 0n, 6));
    if (totalPool === 0) return Math.floor(100 / market.options.length);
    return Math.round((optPool / totalPool) * 100);
  }

  function getOdds(i: number): string {
    const optPool = Number(formatUnits(market.optionPools[i] ?? 0n, 6));
    if (totalPool === 0 || optPool === 0) return "—";
    return `${(totalPool / optPool).toFixed(2)}x`;
  }

  return (
    <>
      <div className="card flex flex-col gap-0 animate-fade-in overflow-hidden">

        {/* Cover image */}
        {market.imageUrl && (
          <div className="w-full h-36 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={market.imageUrl}
              alt={market.question}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 flex flex-col gap-4">
          {/* Badges */}
          <div className="flex items-center justify-between">
            <span className={`badge ${CATEGORY_COLOR[market.category]}`}>
              {categoryLabel[market.category] ?? t("filterGeneral")}
            </span>
            <span className={`badge ${STATE_COLOR[market.state]}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block
                ${market.state === 0 ? "bg-green-400" : market.state === 1 ? "bg-amber-400" : "bg-arc-400"}`}
              />
              {stateLabel[market.state] ?? t("filterActive")}
            </span>
          </div>

          {/* Question */}
          <h3 className="text-white font-semibold text-base leading-snug min-h-[3rem]">
            {market.question}
          </h3>

          {/* Options */}
          <div className="space-y-2">
            {market.options.map((opt, i) => {
              const pct      = getPct(i);
              const odds     = getOdds(i);
              const isWinner = isResolved && Number(market.winningOption) === i;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium flex items-center gap-1
                      ${isWinner ? "text-green-400" : "text-gray-300"}`}>
                      {isWinner && <Trophy size={11} className="text-green-400" />}
                      {opt}
                    </span>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{pct}%</span>
                      <span className="text-arc-400 font-semibold">{odds}</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-0 rounded-full h-1.5">
                    <div
                      className={`progress-bar ${isWinner ? "bg-green-500" : "bg-arc-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between pt-1 border-t border-border text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} />
              <span className="font-semibold text-gray-300">
                {totalPool.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
              </span>
              <span>{t("pool")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span className={isActive ? "text-gray-400" : "text-gray-600"}>
                {isActive ? timeLeft(market.endTime, t("ended")) : t("closed")}
              </span>
            </div>
          </div>

          {/* Share + CTA */}
          <div className="flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎯 "${market.question}"\n\nPredict the outcome on CirBet — powered by Arc Network!\n`)}&url=${encodeURIComponent("https://cirbet.xyz")}&hashtags=CirBet,ArcNetwork,PredictionMarket`}
            target="_blank"
            rel="noreferrer"
            title="Share on X"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
                       bg-black hover:bg-zinc-800 border border-zinc-700
                       text-white text-sm font-bold transition-all shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 1200 1227" fill="currentColor">
              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
            </svg>
            <span className="text-xs">{t("shareBtn")}</span>
          </a>
          <button
            onClick={() => setShowModal(true)}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
              ${isActive
                ? "btn-primary"
                : isResolved
                ? "bg-surface-2 hover:bg-surface-3 border border-border text-gray-400 hover:text-white"
                : "bg-surface-2 border border-border text-gray-500 cursor-default opacity-60"
              }`}
            disabled={market.state === 1}
          >
            {isActive ? t("placeBet") : isResolved ? t("viewResult") : t("lockedBtn")}
          </button>
          </div>
        </div>
      </div>

      {showModal && (
        <PlaceBetModal
          market={market}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); onRefresh?.(); }}
        />
      )}
    </>
  );
}
