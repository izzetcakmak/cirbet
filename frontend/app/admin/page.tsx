"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useAccount, useReadContract, useReadContracts,
  useWriteContract, useWaitForTransactionReceipt,
} from "wagmi";
import { useRouter } from "next/navigation";
import {
  Shield, Home, Loader2, Lock, CheckCircle2, AlertCircle,
  ChevronDown, ThumbsUp, ThumbsDown, Bell, XCircle, LayoutGrid,
} from "lucide-react";
import { contractConfig, OWNER_ADDRESS } from "@/lib/contracts";
import { useI18n } from "@/lib/i18nContext";
import type { Translations } from "@/lib/i18n";
import type { Market, Proposal } from "@/lib/types";
import { formatUnits } from "viem";

function formatUSDC(wei: bigint) { return parseFloat(formatUnits(wei, 6)).toFixed(2); }

function timeLeft(endTime: bigint): string {
  const now  = Math.floor(Date.now() / 1000);
  const diff = Number(endTime) - now;
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function useAdminData() {
  const { data: totalM } = useReadContract({ ...contractConfig, functionName: "totalMarkets" });
  const countM = Number(totalM ?? 0n);
  const { data: marketResults, refetch: refetchM } = useReadContracts({
    contracts: Array.from({ length: countM }, (_, i) => ({
      ...contractConfig, functionName: "getMarket" as const, args: [BigInt(i)] as const,
    })),
    query: { enabled: countM > 0, refetchInterval: 30_000 },
  });

  const { data: totalP } = useReadContract({ ...contractConfig, functionName: "totalProposals" });
  const countP = Number(totalP ?? 0n);
  const { data: proposalResults, refetch: refetchP } = useReadContracts({
    contracts: Array.from({ length: countP }, (_, i) => ({
      ...contractConfig, functionName: "getProposal" as const, args: [BigInt(i)] as const,
    })),
    query: { enabled: countP > 0, refetchInterval: 30_000 },
  });

  const markets: Market[] = useMemo(() =>
    (marketResults ?? []).map((r) => r.result as Market).filter(Boolean),
  [marketResults]);

  const proposals: Proposal[] = useMemo(() =>
    (proposalResults ?? []).map((r) => r.result as Proposal).filter(Boolean),
  [proposalResults]);

  function refetch() { refetchM(); refetchP(); }
  return { markets, proposals, countM, countP, refetch };
}

type Tab = "notifications" | "pending" | "all" | "resolve";

export default function AdminPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("notifications");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Record<number, number>>({});
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const { markets, proposals, countM, countP, refetch } = useAdminData();
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isAdmin = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();
  const now = BigInt(Math.floor(Date.now() / 1000));

  // ── Notification logic ────────────────────────────────────────────────────
  const needsLock    = markets.filter((m) => m.state === 0 && m.endTime <= now);
  const needsResolve = markets.filter((m) => m.state === 1);
  const pendingProposals = proposals.filter((p) => p.status === 0);

  const alerts = useMemo(() => {
    const list: { id: number; marketId: number; type: "lock" | "resolve"; market: Market }[] = [];
    needsLock.forEach((m)    => list.push({ id: Number(m.id) * 10 + 0, marketId: Number(m.id), type: "lock",    market: m }));
    needsResolve.forEach((m) => list.push({ id: Number(m.id) * 10 + 1, marketId: Number(m.id), type: "resolve", market: m }));
    return list;
  }, [needsLock, needsResolve]);

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  // Browser notifications
  useEffect(() => {
    if (!isAdmin || activeAlerts.length === 0) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted" && activeAlerts.length > 0) {
          new Notification("CirBet Admin", {
            body: `${activeAlerts.length} market(s) need your attention`,
            icon: "/favicon.ico",
          });
        }
      });
    } else if (Notification.permission === "granted") {
      new Notification("CirBet Admin", {
        body: `${activeAlerts.length} market(s) need your attention`,
        icon: "/favicon.ico",
      });
    }
  // Only fire once on mount when markets load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, markets.length]);

  const notifCount = activeAlerts.length + pendingProposals.length;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    pending:   pendingProposals.length,
    total:     countM,
    active:    markets.filter((m) => m.state === 0).length,
    resolved:  markets.filter((m) => m.state === 2).length,
    cancelled: markets.filter((m) => m.state === 3).length,
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  function act(fn: () => void) { reset(); fn(); }

  function handleLock(id: number) {
    act(() => writeContract({ ...contractConfig, functionName: "lockMarket", args: [BigInt(id)] }));
  }
  function handleResolve(id: number) {
    act(() => writeContract({
      ...contractConfig,
      functionName: "resolveMarket",
      args: [BigInt(id), BigInt(selectedWinner[id] ?? 0)],
    }));
    setResolvingId(null);
  }
  function handleCancel(id: number) {
    act(() => writeContract({ ...contractConfig, functionName: "cancelMarket", args: [BigInt(id)] }));
  }
  function handleApprove(id: number) {
    act(() => writeContract({ ...contractConfig, functionName: "approveProposal", args: [BigInt(id)] }));
  }
  function handleReject(id: number) {
    act(() => writeContract({ ...contractConfig, functionName: "rejectProposal", args: [BigInt(id)] }));
  }

  if (!address || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield size={48} className="text-gray-600 mx-auto" />
          <p className="text-gray-400">Access restricted to admin</p>
          <button onClick={() => router.push("/")} className="btn-primary px-6 py-2">{t("adminHome")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top bar */}
      <div className="bg-surface-1 border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
            <Home size={14} /> {t("adminHome")}
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-amber-400 flex items-center gap-1.5 text-sm font-medium">
            <Shield size={14} /> {t("adminTitle")}
          </span>
          {notifCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
              {notifCount}
            </span>
          )}
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
            { label: t("adminCancelled"), value: stats.cancelled, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-1 border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {([
            { key: "notifications", label: "Notifications", icon: <Bell size={13}/>,     count: notifCount },
            { key: "pending",       label: t("adminPendingApproval"), icon: <ThumbsUp size={13}/>, count: pendingProposals.length },
            { key: "resolve",       label: t("adminToResolve"),       icon: null,         count: needsResolve.length + needsLock.length },
            { key: "all",           label: t("adminAllMarkets"),      icon: <LayoutGrid size={13}/>, count: countM },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === item.key
                  ? "border-arc-500 text-arc-400"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
              {item.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-bold ${
                  tab === item.key ? "bg-arc-600/30 text-arc-300" : "bg-surface-2 text-gray-400"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global tx status */}
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
            <CheckCircle2 size={16} /> Transaction confirmed!
          </div>
        )}

        {/* ── NOTIFICATIONS ────────────────────────────────────────────────── */}
        {tab === "notifications" && (
          <div className="space-y-3">
            {activeAlerts.length === 0 && pendingProposals.length === 0 && (
              <div className="text-center py-20">
                <CheckCircle2 size={40} className="text-green-500/40 mx-auto mb-3" />
                <p className="text-gray-500">All clear — no pending actions</p>
              </div>
            )}

            {/* Market alerts */}
            {activeAlerts.map((a) => (
              <div key={a.id}
                className={`border rounded-xl p-4 flex items-start justify-between gap-4 ${
                  a.type === "lock"
                    ? "bg-yellow-600/5 border-yellow-600/30"
                    : "bg-arc-600/5 border-arc-600/30"
                }`}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Bell size={16} className={a.type === "lock" ? "text-yellow-400 mt-0.5 shrink-0" : "text-arc-400 mt-0.5 shrink-0"} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${a.type === "lock" ? "text-yellow-300" : "text-arc-300"}`}>
                      {a.type === "lock" ? "Market expired — needs to be Locked" : "Market locked — ready to Resolve"}
                    </p>
                    <p className="text-white text-sm mt-0.5 line-clamp-1">{a.market.question}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Pool: {formatUSDC(a.market.totalPool)} USDC · #{a.marketId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.type === "lock" && (
                    <button
                      onClick={() => handleLock(a.marketId)}
                      disabled={isPending || isConfirming}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-yellow-400 bg-yellow-600/10 border border-yellow-600/30 hover:bg-yellow-600/20 disabled:opacity-40 transition-all"
                    >
                      {(isPending || isConfirming) ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                      Lock
                    </button>
                  )}
                  {a.type === "resolve" && (
                    resolvingId === a.marketId ? (
                      <ResolveInline
                        market={a.market}
                        selectedWinner={selectedWinner}
                        setSelectedWinner={setSelectedWinner}
                        onConfirm={() => handleResolve(a.marketId)}
                        onCancel={() => setResolvingId(null)}
                        isPending={isPending || isConfirming}
                      />
                    ) : (
                      <button
                        onClick={() => setResolvingId(a.marketId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-600/10 border border-green-600/30 hover:bg-green-600/20 transition-all"
                      >
                        <CheckCircle2 size={12} /> Resolve
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setDismissedAlerts((s) => new Set([...s, a.id]))}
                    className="text-gray-600 hover:text-gray-400 transition-colors p-1"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Pending proposals in notifications */}
            {pendingProposals.map((p) => (
              <div key={Number(p.id)} className="bg-amber-600/5 border border-amber-600/30 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <ThumbsUp size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-amber-300 text-sm font-medium">New market proposal</p>
                    <p className="text-white text-sm mt-0.5 line-clamp-1">{p.question}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      By {p.proposer.slice(0, 6)}…{p.proposer.slice(-4)} · {p.options.length} options
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleApprove(Number(p.id))} disabled={isPending || isConfirming}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-600/10 border border-green-600/30 hover:bg-green-600/20 disabled:opacity-40 transition-all">
                    {(isPending || isConfirming) ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />} Approve
                  </button>
                  <button onClick={() => handleReject(Number(p.id))} disabled={isPending || isConfirming}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 disabled:opacity-40 transition-all">
                    <ThumbsDown size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PENDING PROPOSALS ────────────────────────────────────────────── */}
        {tab === "pending" && (
          pendingProposals.length === 0
            ? <div className="text-center py-20 text-gray-600">{t("noData")}</div>
            : <div className="space-y-3">
                {pendingProposals.map((p) => (
                  <ProposalCard
                    key={Number(p.id)}
                    proposal={p}
                    now={now}
                    onApprove={() => handleApprove(Number(p.id))}
                    onReject={() => handleReject(Number(p.id))}
                    isPending={isPending || isConfirming}
                    t={t}
                  />
                ))}
              </div>
        )}

        {/* ── TO RESOLVE ───────────────────────────────────────────────────── */}
        {tab === "resolve" && (
          <MarketList
            markets={[...needsLock, ...needsResolve]}
            now={now}
            resolvingId={resolvingId}
            setResolvingId={setResolvingId}
            selectedWinner={selectedWinner}
            setSelectedWinner={setSelectedWinner}
            handleLock={handleLock}
            handleResolve={handleResolve}
            handleCancel={handleCancel}
            isPending={isPending || isConfirming}
            t={t}
          />
        )}

        {/* ── ALL MARKETS ──────────────────────────────────────────────────── */}
        {tab === "all" && (
          <MarketList
            markets={markets}
            now={now}
            resolvingId={resolvingId}
            setResolvingId={setResolvingId}
            selectedWinner={selectedWinner}
            setSelectedWinner={setSelectedWinner}
            handleLock={handleLock}
            handleResolve={handleResolve}
            handleCancel={handleCancel}
            isPending={isPending || isConfirming}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

// ─── Resolve inline ────────────────────────────────────────────────────────────

function ResolveInline({ market, selectedWinner, setSelectedWinner, onConfirm, onCancel, isPending }: {
  market: Market;
  selectedWinner: Record<number, number>;
  setSelectedWinner: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selectedWinner[Number(market.id)] ?? 0}
          onChange={(e) => setSelectedWinner((prev) => ({ ...prev, [Number(market.id)]: Number(e.target.value) }))}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-white text-xs appearance-none pr-6"
        >
          {market.options.map((opt, i) => <option key={i} value={i}>{opt}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      <button onClick={onConfirm} disabled={isPending}
        className="px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-600/10 border border-green-600/30 hover:bg-green-600/20 disabled:opacity-40 transition-all">
        {isPending ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
      </button>
      <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs transition-colors">✕</button>
    </div>
  );
}

// ─── Proposal card ─────────────────────────────────────────────────────────────

function ProposalCard({ proposal: p, now, onApprove, onReject, isPending, t }: {
  proposal: Proposal;
  now: bigint;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
  t: (key: keyof Translations) => string;
}) {
  const isExpired = p.endTime <= now;
  return (
    <div className="bg-surface-1 border border-amber-600/20 rounded-xl p-4 space-y-3">
      {p.imageUrl && (
        <div className="w-full h-28 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl} alt={p.question} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-600">Proposal #{Number(p.id)}</span>
            <span className="text-xs text-yellow-400 bg-yellow-600/10 px-2 py-0.5 rounded-full">Pending</span>
            {isExpired && <span className="text-xs text-red-400">{t("adminTimeExpired")}</span>}
          </div>
          <p className="text-white text-sm font-medium line-clamp-2">{p.question}</p>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
            <span>By: {p.proposer.slice(0, 6)}…{p.proposer.slice(-4)}</span>
            {!isExpired && <span>{timeLeft(p.endTime)} {t("adminTimeLeft")}</span>}
          </div>
        </div>
        {!isExpired && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onApprove} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-600/10 border border-green-600/30 hover:bg-green-600/20 disabled:opacity-40 transition-all">
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />} Approve
            </button>
            <button onClick={onReject} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 disabled:opacity-40 transition-all">
              <ThumbsDown size={12} /> Reject
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.options.map((opt, i) => (
          <span key={i} className="text-xs bg-surface-2 border border-border rounded-lg px-2 py-1 text-gray-400">{opt}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Market list ───────────────────────────────────────────────────────────────

interface MarketListProps {
  markets: Market[];
  now: bigint;
  resolvingId: number | null;
  setResolvingId: (id: number | null) => void;
  selectedWinner: Record<number, number>;
  setSelectedWinner: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleLock: (id: number) => void;
  handleResolve: (id: number) => void;
  handleCancel: (id: number) => void;
  isPending: boolean;
  t: (key: keyof Translations) => string;
}

function MarketList({
  markets, now, resolvingId, setResolvingId,
  selectedWinner, setSelectedWinner,
  handleLock, handleResolve, handleCancel,
  isPending, t,
}: MarketListProps) {
  if (markets.length === 0)
    return <div className="text-center py-20 text-gray-600">{t("noData")}</div>;

  return (
    <div className="space-y-3">
      {markets.map((market) => {
        const isExpired  = market.endTime <= now;
        const isCancelled = market.state === 3;
        const stateLabels = ["Active", "Locked", "Resolved", "Cancelled"];
        const stateColors = ["text-arc-400", "text-yellow-400", "text-green-400", "text-red-400"];
        const stateLabel  = stateLabels[market.state] ?? "Unknown";
        const stateColor  = stateColors[market.state] ?? "text-gray-400";

        const canLock    = market.state === 0;
        const canResolve = market.state === 1 || (market.state === 0 && isExpired);
        const canCancel  = market.state === 0 || market.state === 1;

        return (
          <div key={Number(market.id)}
            className={`bg-surface-1 border rounded-xl overflow-hidden ${
              isCancelled ? "border-red-600/20 opacity-60" : "border-border"
            }`}>

            {market.imageUrl && (
              <div className="w-full h-20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={market.imageUrl} alt={market.question} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">#{Number(market.id)}</span>
                    <span className={`text-xs font-medium ${stateColor}`}>{stateLabel}</span>
                    {isExpired && market.state === 0 && (
                      <span className="text-xs text-red-400 bg-red-600/10 px-2 py-0.5 rounded-full animate-pulse">
                        {t("adminTimeExpired")}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm font-medium line-clamp-2">{market.question}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                    <span>{t("adminPool")}: {formatUSDC(market.totalPool)} USDC</span>
                    {market.state === 0 && !isExpired && <span>{timeLeft(market.endTime)} {t("adminTimeLeft")}</span>}
                    <span>{market.options.length} opts</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canLock && !isExpired && (
                    <button onClick={() => handleLock(Number(market.id))} disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-yellow-400 bg-yellow-600/10 border border-yellow-600/30 hover:bg-yellow-600/20 disabled:opacity-40 transition-all">
                      {isPending ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />} {t("adminLock")}
                    </button>
                  )}

                  {canResolve && (
                    resolvingId === Number(market.id) ? (
                      <ResolveInline
                        market={market}
                        selectedWinner={selectedWinner}
                        setSelectedWinner={setSelectedWinner}
                        onConfirm={() => handleResolve(Number(market.id))}
                        onCancel={() => setResolvingId(null)}
                        isPending={isPending}
                      />
                    ) : (
                      <button onClick={() => setResolvingId(Number(market.id))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-600/10 border border-green-600/30 hover:bg-green-600/20 transition-all">
                        <CheckCircle2 size={12} /> {t("adminResolve")}
                      </button>
                    )
                  )}

                  {canCancel && (
                    <button onClick={() => handleCancel(Number(market.id))} disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 disabled:opacity-40 transition-all"
                      title="Cancel market & refund all bettors">
                      {isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {market.options.map((opt, i) => (
                  <span key={i} className={`text-xs border rounded-lg px-2 py-1 ${
                    market.state === 2 && Number(market.winningOption) === i
                      ? "bg-green-600/10 border-green-600/30 text-green-400"
                      : "bg-surface-2 border-border text-gray-400"
                  }`}>{opt}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
