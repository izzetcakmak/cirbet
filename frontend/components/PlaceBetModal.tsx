"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { contractConfig } from "@/lib/contracts";
import type { Market } from "@/lib/types";
import { CATEGORY_COLOR, STATE_COLOR } from "@/lib/types";
import { useI18n } from "@/lib/i18nContext";

interface Props {
  market:  Market;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PlaceBetModal({ market, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { isConnected } = useAccount();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [amount, setAmount] = useState("");

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isActive = market.state === 0;
  const totalPool = Number(formatUnits(market.totalPool, 6));

  const categoryLabel: Record<number, string> = {
    0: t("filterCrypto"),
    1: t("filterSports"),
    2: t("filterGeneral"),
  };
  const stateLabel: Record<number, string> = {
    0: t("filterActive"),
    1: t("filterLocked"),
    2: t("filterResolved"),
    3: t("filterCancelled"),
  };

  function getOdds(optIdx: number): string {
    const optPool = Number(formatUnits(market.optionPools[optIdx] ?? 0n, 6));
    if (totalPool === 0 || optPool === 0) return "—";
    const ratio = totalPool / optPool;
    return `${ratio.toFixed(2)}x`;
  }

  function getPercent(optIdx: number): number {
    const optPool = Number(formatUnits(market.optionPools[optIdx] ?? 0n, 6));
    if (totalPool === 0) return 0;
    return Math.round((optPool / totalPool) * 100);
  }

  function handleBet() {
    if (selectedOption === null || !amount) return;
    const value = parseUnits(amount, 6);
    writeContract({
      ...contractConfig,
      functionName: "placeBet",
      args:  [market.id, BigInt(selectedOption)],
      value,
    });
  }

  const amountNum = parseFloat(amount) || 0;
  const potentialWin =
    selectedOption !== null && amountNum > 0 && market.optionPools[selectedOption] !== undefined
      ? amountNum *
        (totalPool + amountNum) /
        (Number(formatUnits(market.optionPools[selectedOption], 6)) + amountNum) *
        0.97
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg shadow-2xl
                      animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${CATEGORY_COLOR[market.category]}`}>
                {categoryLabel[market.category] ?? t("filterGeneral")}
              </span>
              <span className={`badge ${STATE_COLOR[market.state]}`}>
                {stateLabel[market.state] ?? t("filterActive")}
              </span>
            </div>
            <h2 className="text-white font-semibold text-base leading-snug">{market.question}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Pool info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{t("modalTotalPool")}</span>
            <span className="text-white font-semibold">
              {totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
            </span>
          </div>

          {/* Option selection */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t("modalPickOutcome")}</p>
            {market.options.map((opt, i) => {
              const pct    = getPercent(i);
              const odds   = getOdds(i);
              const active = selectedOption === i;

              return (
                <button
                  key={i}
                  onClick={() => isActive && setSelectedOption(i)}
                  disabled={!isActive}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200
                    ${active
                      ? "border-arc-600 bg-arc-600/10"
                      : "border-border bg-surface-2 hover:border-arc-600/40 hover:bg-surface-3"}
                    ${!isActive ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-300"}`}>
                      {opt}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{pct}%</span>
                      <span className={`font-semibold ${active ? "text-arc-400" : "text-gray-400"}`}>
                        {odds}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-0 rounded-full h-1.5">
                    <div
                      className={`progress-bar ${active ? "bg-arc-500" : "bg-gray-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Amount input */}
          {isActive && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                {t("modalBetAmount")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.001"
                  step="0.1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white
                             text-sm focus:outline-none focus:border-arc-600/60 placeholder:text-gray-600
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                  USDC
                </span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {["1", "5", "10", "25"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3
                               border border-border text-gray-400 hover:text-white transition-all"
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Potential win */}
              {selectedOption !== null && potentialWin > 0 && (
                <div className="flex items-center justify-between text-sm px-1">
                  <span className="text-gray-400">{t("modalPotentialPayout")}</span>
                  <span className="text-green-400 font-semibold">
                    ≈ {potentialWin.toFixed(2)} USDC
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status messages */}
          {isSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-600/10
                            border border-green-600/30 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} />
              {t("modalBetSuccess")}
            </div>
          )}

          {writeError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-600/10
                            border border-red-600/30 rounded-xl px-4 py-3">
              <AlertCircle size={16} />
              <span className="truncate">{writeError.message.split("\n")[0]}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1">
            {t("createCancel")}
          </button>

          {isActive ? (
            <button
              onClick={handleBet}
              disabled={selectedOption === null || !amount || isPending || isConfirming || !isConnected}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isPending || isConfirming
                ? <><Loader2 size={15} className="animate-spin" /> {t("modalConfirming")}</>
                : !isConnected
                ? t("connectWallet")
                : t("placeBet")}
            </button>
          ) : (
            <button disabled className="btn-primary flex-1 opacity-40 cursor-default">
              {t("modalBettingClosed")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
