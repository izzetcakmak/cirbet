"use client";

import { useState, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Home, Loader2, CheckCircle2, AlertCircle, Trophy, RotateCcw, Coins,
  PlusCircle, Users, Clock,
} from "lucide-react";
import { contractConfig, OWNER_ADDRESS } from "@/lib/contracts";
import { useI18n } from "@/lib/i18nContext";
import type { Market, UserBet } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, STATE_COLOR } from "@/lib/types";
import { formatUnits } from "viem";

function formatUSDC(wei: bigint): string {
  return parseFloat(formatUnits(wei, 6)).toFixed(2);
}

type DashTab = "all" | "claims" | "refunds" | "mymarkets";

interface BetWithMarket {
  market:          Market;
  bet:             UserBet;
  marketRefunded:  boolean;
}

function useUserBets(address: `0x${string}` | undefined) {
  const { data: total } = useReadContract({ ...contractConfig, functionName: "totalMarkets" });
  const count = Number(total ?? 0n);

  const { data: marketResults, isLoading: loadingMarkets, refetch: refetchMarkets } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      ...contractConfig, functionName: "getMarket" as const, args: [BigInt(i)] as const,
    })),
    query: { enabled: count > 0 },
  });

  const { data: betResults, isLoading: loadingBets, refetch: refetchBets } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      ...contractConfig,
      functionName: "getUserBets" as const,
      args: [BigInt(i), address ?? "0x0000000000000000000000000000000000000000"] as const,
    })),
    query: { enabled: count > 0 && !!address },
  });

  const { data: refundedResults, refetch: refetchRefunded } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      ...contractConfig,
      functionName: "isRefunded" as const,
      args: [BigInt(i), address ?? "0x0000000000000000000000000000000000000000"] as const,
    })),
    query: { enabled: count > 0 && !!address },
  });

  const betsWithMarkets: BetWithMarket[] = useMemo(() => {
    if (!marketResults || !betResults) return [];
    const result: BetWithMarket[] = [];
    marketResults.forEach((mr, i) => {
      const market          = mr.result as Market | undefined;
      const bets            = betResults[i]?.result as UserBet[] | undefined;
      const marketRefunded  = !!(refundedResults?.[i]?.result as boolean | undefined);
      if (!market || !bets) return;
      bets.forEach((bet) => {
        if (bet.amount > 0n) result.push({ market, bet, marketRefunded });
      });
    });
    return result;
  }, [marketResults, betResults, refundedResults]);

  // All markets (for "my created markets" tab)
  const allMarkets: Market[] = useMemo(() => {
    if (!marketResults) return [];
    return marketResults
      .map((r) => r.result as Market | undefined)
      .filter((m): m is Market => m !== undefined && m.state !== 3);
  }, [marketResults]);

  function refetch() { refetchMarkets(); refetchBets(); refetchRefunded(); }

  return {
    betsWithMarkets,
    allMarkets,
    isLoading: (loadingMarkets || loadingBets) && count > 0,
    refetch,
  };
}

const STATE_BADGE: Record<number, string> = {
  0: "text-arc-400    bg-arc-600/10    border-arc-600/30",
  1: "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  2: "text-green-400  bg-green-600/10  border-green-600/30",
  3: "text-red-400    bg-red-600/10    border-red-600/30",
};
const STATE_LABEL: Record<number, string> = {
  0: "Active", 1: "Locked", 2: "Resolved", 3: "Cancelled",
};

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { address } = useAccount();
  const [tab, setTab] = useState<DashTab>("all");

  const { betsWithMarkets, allMarkets, isLoading, refetch } = useUserBets(address);

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isAdmin = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // ── Creator fee balance ──────────────────────────────────────────────────────
  const { data: creatorFeeBalance, refetch: refetchCreatorFee } = useReadContract({
    ...contractConfig,
    functionName: "creatorFees",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });
  const creatorFeeAmt = (creatorFeeBalance as bigint | undefined) ?? 0n;

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalBet = betsWithMarkets.reduce((acc, { bet }) => acc + bet.amount, 0n);

  // pendingWin = resolved-won unclaimed (exact) + active/locked estimated payout
  const pendingWin = betsWithMarkets.reduce((acc, { market, bet }) => {
    if (bet.claimed) return acc;
    const optPool = market.optionPools[Number(bet.optionIndex)] ?? 0n;
    if (optPool === 0n) return acc;

    if (market.state === 2) {
      // Resolved: only count if this option actually won
      if (market.winningOption !== bet.optionIndex) return acc;
      const gross = (bet.amount * market.totalPool) / optPool;
      const fee   = (gross * 300n) / 10000n;
      return acc + gross - fee;
    }

    if (market.state === 0 || market.state === 1) {
      // Active / Locked: estimated payout at current pool ratios
      const gross = (bet.amount * market.totalPool) / optPool;
      const fee   = (gross * 300n) / 10000n;
      return acc + gross - fee;
    }

    return acc;
  }, 0n);

  // True when result includes estimates from still-active bets (show ≈ prefix)
  const pendingIsEstimate = betsWithMarkets.some(
    ({ market, bet }) => !bet.claimed && (market.state === 0 || market.state === 1),
  );

  const claimedWin = betsWithMarkets.reduce((acc, { bet }) => {
    if (bet.claimed) return acc + bet.amount;
    return acc;
  }, 0n);

  const refundableMarketIds = useMemo(() => {
    const seen = new Set<bigint>();
    for (const { market, bet, marketRefunded } of betsWithMarkets) {
      if (market.state === 3 && !marketRefunded && bet.amount > 0n) seen.add(market.id);
    }
    return seen;
  }, [betsWithMarkets]);

  const refundableTotal = betsWithMarkets.reduce((acc, { market, bet, marketRefunded }) => {
    if (market.state === 3 && !marketRefunded) return acc + bet.amount;
    return acc;
  }, 0n);

  const claimsCount  = betsWithMarkets.filter(({ market, bet }) =>
    market.state === 2 && market.winningOption === bet.optionIndex && !bet.claimed
  ).length;
  const refundsCount = refundableMarketIds.size;

  // Markets created by this wallet
  const createdMarkets = useMemo(
    () => allMarkets.filter((m) => m.creator.toLowerCase() === address?.toLowerCase()),
    [allMarkets, address],
  );

  // Estimated creator fee: 1% of pool for active/locked created markets that crossed 100 USDC threshold
  const POOL_THRESHOLD = 100_000_000n; // 100 USDC (6 decimals)
  const estimatedCreatorFee = useMemo(
    () =>
      createdMarkets
        .filter((m) => (m.state === 0 || m.state === 1) && m.totalPool >= POOL_THRESHOLD)
        .reduce((acc, m) => acc + m.totalPool / 100n, 0n),
    [createdMarkets],
  );

  const filtered = useMemo(() => {
    if (tab === "claims")  return betsWithMarkets.filter(
      ({ market, bet }) => market.state === 2 && market.winningOption === bet.optionIndex && !bet.claimed
    );
    if (tab === "refunds") return betsWithMarkets.filter(
      ({ market, marketRefunded }) => market.state === 3 && !marketRefunded
    );
    return betsWithMarkets;
  }, [betsWithMarkets, tab]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  function handleClaim(marketId: bigint) {
    reset();
    writeContract({ ...contractConfig, functionName: "claimWinnings", args: [marketId] });
  }
  function handleClaimRefund(marketId: bigint) {
    reset();
    writeContract({ ...contractConfig, functionName: "claimRefund", args: [marketId] });
  }
  function handleWithdrawFees() {
    if (!address) return;
    reset();
    writeContract({ ...contractConfig, functionName: "withdrawFees", args: [address] });
  }
  function handleWithdrawCreatorFees() {
    reset();
    writeContract({ ...contractConfig, functionName: "withdrawCreatorFees" });
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LayoutDashboard size={48} className="text-gray-600 mx-auto" />
          <p className="text-gray-400">Connect your wallet to view your account</p>
          <button onClick={() => router.push("/")} className="btn-primary px-6 py-2">
            {t("adminHome")}
          </button>
        </div>
      </div>
    );
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
          <span className="text-arc-400 flex items-center gap-1.5 text-sm font-medium">
            <LayoutDashboard size={14} /> {t("accountTitle")}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">{t("accountTitle")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("accountSubtitle")}</p>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 gap-3 ${estimatedCreatorFee > 0n ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
          {[
            { label: t("accountTotalBet"),   value: `${formatUSDC(totalBet)} USDC`,        color: "text-white",      border: "" },
            { label: t("accountClaimedWin"), value: `${formatUSDC(claimedWin)} USDC`,      color: "text-green-400",  border: "" },
            { label: t("accountRefunds"),    value: `${formatUSDC(refundableTotal)} USDC`, color: "text-red-400",    border: "" },
            ...(estimatedCreatorFee > 0n ? [{
              label:  t("accountEstFee"),
              value:  `≈ ${formatUSDC(estimatedCreatorFee)} USDC`,
              color:  "text-arc-400",
              border: "border-arc-600/30",
            }] : []),
          ].map((s) => (
            <div key={s.label} className={`bg-surface-1 border rounded-xl p-4 ${s.border || "border-border"}`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Creator Fee Earnings — visible to any non-admin who has earned fees */}
        {!isAdmin && (
          <div className={`border rounded-xl p-4 flex items-center justify-between gap-4 transition-all ${
            creatorFeeAmt > 0n
              ? "bg-arc-600/10 border-arc-600/30"
              : "bg-surface-1 border-border opacity-60"
          }`}>
            <div className="flex items-center gap-3">
              <Coins size={20} className={creatorFeeAmt > 0n ? "text-arc-400" : "text-gray-600"} />
              <div>
                <p className={`text-sm font-medium ${creatorFeeAmt > 0n ? "text-arc-300" : "text-gray-500"}`}>
                  {t("accountCreatorFees")}
                </p>
                <p className={`text-xs mt-0.5 ${creatorFeeAmt > 0n ? "text-arc-400 font-bold" : "text-gray-600"}`}>
                  {formatUSDC(creatorFeeAmt)} USDC
                </p>
                <p className="text-gray-600 text-xs mt-0.5">
                  1% of pool earnings when your market exceeds the volume threshold
                </p>
              </div>
            </div>
            {creatorFeeAmt > 0n && (
              <button
                onClick={handleWithdrawCreatorFees}
                disabled={isPending || isConfirming}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-arc-300
                           bg-arc-600/20 border border-arc-600/40 hover:bg-arc-600/30
                           disabled:opacity-40 transition-all shrink-0"
              >
                {(isPending || isConfirming) ? <Loader2 size={14} className="animate-spin" /> : null}
                Withdraw
              </button>
            )}
          </div>
        )}

        {/* Admin: withdraw platform fees */}
        {isAdmin && (
          <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-400 text-sm font-medium">Admin: Platform Fees</p>
              <p className="text-gray-500 text-xs mt-0.5">Withdraw accumulated platform fees to your wallet</p>
            </div>
            <button
              onClick={handleWithdrawFees}
              disabled={isPending || isConfirming}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-amber-400
                         bg-amber-600/20 border border-amber-600/40 hover:bg-amber-600/30
                         disabled:opacity-40 transition-all"
            >
              {(isPending || isConfirming) ? <Loader2 size={14} className="animate-spin" /> : null}
              {t("accountWithdrawFees")}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto [&::-webkit-scrollbar]:h-0">
          {([
            { key: "all",       label: t("accountAllBets"),  count: betsWithMarkets.length },
            { key: "claims",    label: t("accountClaims"),   count: claimsCount },
            { key: "refunds",   label: t("accountRefunds"),  count: refundsCount },
            { key: "mymarkets", label: t("accountMyMarkets"), count: createdMarkets.length },
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
              <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${
                tab_item.key === "refunds"   && tab_item.count > 0 ? "bg-red-600/20 text-red-400"   :
                tab_item.key === "mymarkets" && tab_item.count > 0 ? "bg-arc-600/20 text-arc-400"   :
                "bg-surface-2 text-gray-500"
              }`}>{tab_item.count}</span>
            </button>
          ))}
        </div>

        {/* Tx status */}
        {writeError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-600/10 border border-red-600/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            <span className="truncate">
              {writeError.message.includes("reason:")
                ? writeError.message.split("reason:")[1]?.trim().split("\n")[0]
                : writeError.message.split("\n")[0]}
            </span>
          </div>
        )}
        {isSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-600/10 border border-green-600/30 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} /> Transaction confirmed!{" "}
            <button onClick={() => { refetch(); refetchCreatorFee(); }} className="underline text-xs ml-1">Refresh</button>
          </div>
        )}

        {/* ── My Created Markets tab ── */}
        {tab === "mymarkets" && (
          isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-arc-400" />
            </div>
          ) : createdMarkets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
              <PlusCircle size={40} />
              <p className="text-sm">{t("accountNoMarkets")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {createdMarkets.map((market) => {
                const pool     = parseFloat(formatUnits(market.totalPool, 6));
                const poolFmt  = pool >= 1000
                  ? `${(pool / 1000).toFixed(1)}k USDC`
                  : `${pool.toFixed(2)} USDC`;
                const diff     = Number(market.endTime) - Math.floor(Date.now() / 1000);
                const timeStr  = diff <= 0
                  ? t("ended")
                  : diff < 3600
                    ? `${Math.floor(diff / 60)}m`
                    : diff < 86400
                      ? `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
                      : `${Math.floor(diff / 86400)}d ${Math.floor((diff % 86400) / 3600)}h`;

                return (
                  <div key={market.id.toString()}
                    className="bg-surface-1 border border-border rounded-xl p-4 space-y-3
                               hover:border-arc-600/30 transition-colors">

                    {/* Top row: badges + pool */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[10px] py-0.5 ${CATEGORY_COLOR[market.category]}`}>
                          {CATEGORY_LABEL[market.category]}
                        </span>
                        <span className={`badge text-[10px] py-0.5 ${STATE_COLOR[market.state]}`}>
                          <span className={`w-1 h-1 rounded-full mr-1 inline-block ${
                            market.state === 0 ? "bg-green-400" :
                            market.state === 1 ? "bg-amber-400" : "bg-arc-400"
                          }`}/>
                          {STATE_BADGE_LABEL[market.state]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono font-semibold">{poolFmt}</span>
                    </div>

                    {/* Question */}
                    <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                      {market.question}
                    </p>

                    {/* Options preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {market.options.map((opt, i) => {
                        const optPool = Number(formatUnits(market.optionPools[i] ?? 0n, 6));
                        const pct = pool === 0 ? 0 : Math.round((optPool / pool) * 100);
                        return (
                          <span key={i}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-surface-2
                                       border border-border text-gray-400">
                            {opt} <span className="text-gray-600">{pct}%</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Bottom row: market ID + time */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users size={11}/> {market.options.length} options · Market #{Number(market.id)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11}/>
                        {diff <= 0 ? t("ended") : `${timeStr} ${t("adminTimeLeft")}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Bet list — all / claims / refunds tabs */}
        {tab !== "mymarkets" && (isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-arc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-600">{t("accountNoBets")}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ market, bet, marketRefunded }, idx) => {
              const isCancelled = market.state === 3;
              const isWinner    = market.state === 2 && market.winningOption === bet.optionIndex;
              const isLoser     = market.state === 2 && market.winningOption !== bet.optionIndex;
              const canClaim    = isWinner && !bet.claimed;
              const canRefund   = isCancelled && !marketRefunded;

              const optPool = market.optionPools[Number(bet.optionIndex)] ?? 0n;
              const estimatedWin = optPool > 0n
                ? (() => {
                    const gross = (bet.amount * market.totalPool) / optPool;
                    const fee   = (gross * 300n) / 10000n;
                    return gross - fee;
                  })()
                : 0n;

              return (
                <div key={idx}
                  className={`bg-surface-1 border rounded-xl p-4 space-y-3 ${
                    canRefund   ? "border-red-600/40"   :
                    isWinner    ? "border-green-600/40" :
                    isLoser     ? "border-red-600/20"   :
                    "border-border"
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-2">{market.question}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span>
                          {t("accountYourChoice")}:&nbsp;
                          <span className="text-gray-300">{market.options[Number(bet.optionIndex)]}</span>
                        </span>
                        <span>
                          {t("accountBetAmount")}:&nbsp;
                          <span className="text-gray-300">{formatUSDC(bet.amount)} USDC</span>
                        </span>
                        {isWinner && !bet.claimed && (
                          <span className="text-green-400">
                            Win: ~{formatUSDC(estimatedWin)} USDC
                          </span>
                        )}
                        {isCancelled && !marketRefunded && (
                          <span className="text-red-400">
                            Refundable: {formatUSDC(bet.amount)} USDC
                          </span>
                        )}
                        {isCancelled && marketRefunded && (
                          <span className="text-gray-500">Refund received</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {bet.claimed && !isCancelled && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {t("accountClaimed")}
                        </span>
                      )}
                      {isCancelled && marketRefunded && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Refunded
                        </span>
                      )}
                      {isWinner && !bet.claimed && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <Trophy size={12} /> Winner
                        </span>
                      )}
                      {canClaim && (
                        <button
                          onClick={() => handleClaim(market.id)}
                          disabled={isPending || isConfirming}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                     text-green-400 bg-green-600/10 border border-green-600/30
                                     hover:bg-green-600/20 disabled:opacity-40 transition-all"
                        >
                          {(isPending || isConfirming)
                            ? <Loader2 size={12} className="animate-spin" />
                            : <CheckCircle2 size={12} />}
                          {(isPending || isConfirming) ? t("accountClaiming") : t("accountClaim")}
                        </button>
                      )}
                      {canRefund && (
                        <button
                          onClick={() => handleClaimRefund(market.id)}
                          disabled={isPending || isConfirming}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                     text-red-400 bg-red-600/10 border border-red-600/30
                                     hover:bg-red-600/20 disabled:opacity-40 transition-all"
                        >
                          {(isPending || isConfirming)
                            ? <Loader2 size={12} className="animate-spin" />
                            : <RotateCcw size={12} />}
                          {(isPending || isConfirming) ? "Processing…" : "Claim Refund"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Market state badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATE_BADGE[market.state] ?? STATE_BADGE[0]}`}>
                      {STATE_LABEL[market.state] ?? "Unknown"}
                    </span>
                    <span className="text-xs text-gray-600">Market #{Number(market.id)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Label maps used in My Markets tab ─────────────────────────────────────────
const STATE_BADGE_LABEL: Record<number, string> = {
  0: "Active", 1: "Locked", 2: "Resolved", 3: "Cancelled",
};
