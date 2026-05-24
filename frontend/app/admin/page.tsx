"use client";

import { useState, useMemo } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import { Shield, Home, Loader2, Lock, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { contractConfig, OWNER_ADDRESS } from "@/lib/contracts";
import { useI18n } from "@/lib/i18nContext";
import type { Market } from "@/lib/types";
import { formatUnits } from "viem";

function useAllMarkets() {
  const { data: total } = useReadContract({ ...contractConfig, functionName: "totalMarkets" });
  const count = Number(total ?? 0n);
  const { data: results, isLoading, refetch } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      ...contractConfig, functionName: "getMarket" as const, args: [BigInt(i)] as const,
    })),
    query: { enabled: count > 0 },
  });
  const markets: Market[] = useMemo(() => {
    if (!results) return [];
    return results.map((r) => r.result as Market | undefined).filter((m): m is Market => m !== undefined);
  }, [results]);
  return { markets, isLoading: isLoading && count > 0, total: count, refetch };
}

function timeLeft(endTime: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(endTime) - now;
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatUSDC(wei: bigint): string {
  return parseFloat(formatUnits(wei, 6)).toFixed(2);
}

type Tab = "all" | "pending" | "resolve";

export default function AdminPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("all");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Record<number, number>>({});

  const { markets, isLoading, total, refetch } = useAllMarkets();

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isAdmin = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  if (!address || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield size={48} className="text-gray-600 mx-auto" />
          <p className="text-gray-400">Access restricted to admin</p>
          <button onClick={() => router.push("/")} className="btn-primary px-6 py-2">
            {t("adminHome")}
          </button>
        </div>
      </div>
    );
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  const pending  = markets.filter((m) => m.state === 0 && m.endTime > now);
  const toResolve = markets.filter((m) => m.state === 1 || (m.state === 0 && m.endTime <= now));
  const displayed = tab === "all" ? markets : tab === "pending" ? pending : toResolve;

  const stats = {
    pending:  pending.length,
    total:    total,
    active:   markets.filter((m) => m.state === 0).length,
    resolved: markets.filter((m) => m.state === 2).length,
    cancelled:0,
  };

  function handleLock(id: number) {
    writeContract({ ...contractConfig, functionName: "lockMarket", args: [BigInt(id)] });
  }

  function handleResolve(id: number) {
    const winner = selectedWinner[id] ?? 0;
    writeContract({ ...contractConfig, functionName: "resolveMarket", args: [BigInt(id), BigInt(winner)] });
    setResolvingId(null);
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <div className="bg-surface-1 border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
          >
            <Home size={14} /> {t("adminHome")}
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-amber-400 flex items-center gap-1.5 text-sm font-medium">
            <Shield size={14} /> {t("adminTitle")}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: t("adminPending"),   value: stats.pending,   color: "text-yellow-400" },
            { label: t("adminTotal"),     value: stats.total,     color: "text-white" },
            { label: t("adminActive"),    value: stats.active,    color: "text-arc-400" },
            { label: t("adminResolved"),  value: stats.resolved,  color: "text-green-400" },
            { label: t("adminCancelled"), value: stats.cancelled, color: "text-gray-500" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-1 border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          {([
            { key: "all",     label: t("adminAllMarkets"),       count: total },
            { key: "pending", label: t("adminPendingApproval"),  count: pending.length },
            { key: "resolve", label: t("adminToResolve"),        count: toResolve.length },
          ] as const).map((tab_item) => (
            <button
              key={tab_item.key}
              onClick={() => setTab(tab_item.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tab_item.key
                  ? "border-arc-500 text-arc-400"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              {tab_item.label}
              <span className="ml-2 text-xs bg-surface-2 rounded-full px-2 py-0.5">
                {tab_item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Error / Success */}
        {writeError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-600/10 border border-red-600/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            <span className="truncate">{writeError.message.split("\n")[0]}</span>
          </div>
        )}
        {isSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-600/10 border border-green-600/30 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} /> Transaction confirmed!
          </div>
        )}

        {/* Market list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-arc-400" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-gray-600">{t("noData")}</div>
        ) : (
          <div className="space-y-3">
            {displayed.map((market) => {
              const isExpired = market.endTime <= now;
              const stateLabel = ["Active", "Locked", "Resolved"][market.state] ?? "Unknown";
              const stateColor = ["text-arc-400", "text-yellow-400", "text-green-400"][market.state] ?? "text-gray-400";

              return (
                <div key={Number(market.id)}
                  className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600">#{Number(market.id)}</span>
                        <span className={`text-xs font-medium ${stateColor}`}>{stateLabel}</span>
                        {isExpired && market.state === 0 && (
                          <span className="text-xs text-red-400 bg-red-600/10 px-2 py-0.5 rounded-full">
                            {t("adminTimeExpired")}
                          </span>
                        )}
                      </div>
                      <p className="text-white text-sm font-medium line-clamp-2">{market.question}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        <span>{t("adminPool")}: {formatUSDC(market.totalPool)} USDC</span>
                        {market.state === 0 && !isExpired && (
                          <span>{timeLeft(market.endTime)} {t("adminTimeLeft")}</span>
                        )}
                        <span>{market.options.length} options</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {market.state === 0 && (
                        <button
                          onClick={() => handleLock(Number(market.id))}
                          disabled={isPending || isConfirming}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                     text-yellow-400 bg-yellow-600/10 border border-yellow-600/30
                                     hover:bg-yellow-600/20 disabled:opacity-40 transition-all"
                        >
                          {(isPending || isConfirming)
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Lock size={12} />}
                          {t("adminLock")}
                        </button>
                      )}

                      {(market.state === 1 || (market.state === 0 && isExpired)) && (
                        resolvingId === Number(market.id) ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                value={selectedWinner[Number(market.id)] ?? 0}
                                onChange={(e) => setSelectedWinner((prev) => ({
                                  ...prev, [Number(market.id)]: Number(e.target.value),
                                }))}
                                className="bg-surface-2 border border-border rounded-lg px-2 py-1.5
                                           text-white text-xs appearance-none pr-6"
                              >
                                {market.options.map((opt, i) => (
                                  <option key={i} value={i}>{opt}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <button
                              onClick={() => handleResolve(Number(market.id))}
                              disabled={isPending || isConfirming}
                              className="px-3 py-1.5 rounded-lg text-xs text-green-400
                                         bg-green-600/10 border border-green-600/30
                                         hover:bg-green-600/20 disabled:opacity-40 transition-all"
                            >
                              {(isPending || isConfirming)
                                ? <Loader2 size={12} className="animate-spin" />
                                : t("adminConfirmResolve")}
                            </button>
                            <button
                              onClick={() => setResolvingId(null)}
                              className="text-gray-500 hover:text-white text-xs transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolvingId(Number(market.id))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                       text-green-400 bg-green-600/10 border border-green-600/30
                                       hover:bg-green-600/20 transition-all"
                          >
                            <CheckCircle2 size={12} />
                            {t("adminResolve")}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Options preview */}
                  <div className="flex flex-wrap gap-1.5">
                    {market.options.map((opt, i) => (
                      <span key={i}
                        className="text-xs bg-surface-2 border border-border rounded-lg px-2 py-1 text-gray-400">
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
