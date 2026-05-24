"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { Clock, Users, TrendingUp, Trophy } from "lucide-react";
import { PlaceBetModal } from "./PlaceBetModal";
import type { Market } from "@/lib/types";
import {
  CATEGORY_LABEL, CATEGORY_COLOR,
  STATE_COLOR, MARKET_STATE_LABEL,
} from "@/lib/types";

interface Props {
  market: Market;
  onRefresh?: () => void;
}

function timeLeft(endTime: bigint): string {
  const diff = Number(endTime) - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function MarketCard({ market, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);

  const totalPool = Number(formatUnits(market.totalPool, 6));
  const isActive  = market.state === 0;
  const isResolved = market.state === 2;

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
      <div className="card p-5 flex flex-col gap-4 animate-fade-in">

        {/* Badges */}
        <div className="flex items-center justify-between">
          <span className={`badge ${CATEGORY_COLOR[market.category]}`}>
            {CATEGORY_LABEL[market.category]}
          </span>
          <span className={`badge ${STATE_COLOR[market.state]}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block
              ${market.state === 0 ? "bg-green-400" : market.state === 1 ? "bg-amber-400" : "bg-arc-400"}`}
            />
            {MARKET_STATE_LABEL[market.state]}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-white font-semibold text-base leading-snug min-h-[3rem]">
          {market.question}
        </h3>

        {/* Options */}
        <div className="space-y-2">
          {market.options.map((opt, i) => {
            const pct  = getPct(i);
            const odds = getOdds(i);
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
            <span>pool</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock size={13} />
            <span className={isActive ? "text-gray-400" : "text-gray-600"}>
              {isActive ? timeLeft(market.endTime) : "Closed"}
            </span>
          </div>
        </div>

        {/* CTA */}
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
          {isActive ? "Place Bet" : isResolved ? "View Result" : "Locked"}
        </button>
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
