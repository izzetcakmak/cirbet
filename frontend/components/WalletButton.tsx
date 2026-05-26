"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { arcTestnet } from "@/lib/arc";
import { createPublicClient, formatUnits, http } from "viem";
import {
  Wallet,
  LogOut,
  ChevronDown,
  AlertTriangle,
  ArrowUpDown,
  ArrowLeftRight,
  Send,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { AppKit } from "@circle-fin/app-kit";
import {
  createViemAdapterFromProvider,
  type ViemAdapter,
} from "@circle-fin/adapter-viem-v2";
import { ArcTestnet } from "@circle-fin/app-kit/chains";

/* ── Types ────────────────────────────────────────────────────────────────── */
type ActiveTab   = "send" | "bridge" | "swap";
type OpStatus    = { type: "success" | "error"; msg: string } | null;
type SwapToken   = "USDC" | "EURC" | "cirBTC";

/* ── Arc Testnet swap tokens (USDT not supported; cirBTC on 0xf0C4…) ──────── */
const SWAP_TOKENS: { id: SwapToken; label: string }[] = [
  { id: "USDC",   label: "USDC"   },
  { id: "EURC",   label: "EURC"   },
  { id: "cirBTC", label: "cirBTC" },
];

/* ── Constants ────────────────────────────────────────────────────────────── */
const BRIDGE_CHAINS = [
  { id: "Base",      name: "Base"      },
  { id: "Ethereum",  name: "Ethereum"  },
  { id: "Polygon",   name: "Polygon"   },
  { id: "Arbitrum",  name: "Arbitrum"  },
  { id: "Optimism",  name: "Optimism"  },
  { id: "Avalanche", name: "Avalanche" },
];

/* ── Module-level AppKit instance ─────────────────────────────────────────── */
const kit = new AppKit();

/* ── Reusable sub-components ─────────────────────────────────────────────── */
function StatusMsg({ status }: { status: OpStatus }) {
  if (!status) return null;
  const ok = status.type === "success";
  return (
    <p
      className={`text-xs px-3 py-2 rounded-lg leading-snug
        ${ok ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}
    >
      {status.msg}
    </p>
  );
}

function AmountRow({
  value,
  onChange,
  token,
}: {
  value: string;
  onChange: (v: string) => void;
  token: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        min="0"
        step="any"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 bg-surface-1 border border-border rounded-lg
                   text-sm text-white placeholder-gray-600
                   focus:outline-none focus:border-arc-500 transition-colors"
      />
      <span
        className="flex items-center px-3 py-2 bg-surface-1 border border-border
                   rounded-lg text-xs font-semibold text-gray-400 shrink-0"
      >
        {token}
      </span>
    </div>
  );
}

function ActionBtn({
  loading,
  disabled,
  icon,
  label,
  loadingLabel,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  loadingLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {loading ? loadingLabel : label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export function WalletButton() {
  /* wagmi */
  const { address, isConnected, chain, connector } = useAccount();
  const { connect, connectors, isPending }          = useConnect();
  const { disconnect }                              = useDisconnect();
  const { switchChain }                             = useSwitchChain();
  const { data: balance, refetch: refetchBal }      = useBalance({
    address,
    query: { enabled: !!address },
  });

  /* UI */
  const [showMenu,       setShowMenu]       = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [activeTab,      setActiveTab]      = useState<ActiveTab>("send");
  const menuRef = useRef<HTMLDivElement>(null);

  /* Adapter */
  const [adapter,        setAdapter]        = useState<ViemAdapter | null>(null);
  const [adapterReady,   setAdapterReady]   = useState(false);

  /* Send */
  const [sendTo,         setSendTo]         = useState("");
  const [sendAmt,        setSendAmt]        = useState("");
  const [sendLoading,    setSendLoading]    = useState(false);
  const [sendStatus,     setSendStatus]     = useState<OpStatus>(null);

  /* Bridge */
  const [bridgeAmt,      setBridgeAmt]      = useState("");
  const [bridgeDest,     setBridgeDest]     = useState("Base");
  const [bridgeLoading,  setBridgeLoading]  = useState(false);
  const [bridgeStatus,   setBridgeStatus]   = useState<OpStatus>(null);

  /* Swap */
  const [swapAmt,        setSwapAmt]        = useState("");
  const [swapIn,         setSwapIn]         = useState<SwapToken>("USDC");
  const [swapOut,        setSwapOut]        = useState<SwapToken>("EURC");
  const [swapLoading,    setSwapLoading]    = useState(false);
  const [swapStatus,     setSwapStatus]     = useState<OpStatus>(null);

  const wrongNetwork = isConnected && chain?.id !== arcTestnet.id;

  /* ── Close dropdown on outside click ──────────────────────────────────── */
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  /* ── Build Arc App Kit adapter from browser wallet provider ───────────── */
  useEffect(() => {
    setAdapter(null);
    setAdapterReady(false);
    if (!connector || !isConnected) return;

    let cancelled = false;
    (async () => {
      try {
        const provider = await connector.getProvider();
        if (!provider || cancelled) return;

        const newAdapter = await createViemAdapterFromProvider({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          provider: provider as any,
          getPublicClient: ({ chain: viemChain }) =>
            createPublicClient({
              chain: viemChain,
              transport: http(
                viemChain.id === arcTestnet.id
                  ? "https://rpc.testnet.arc.network/"
                  : undefined
              ),
            }),
          capabilities: {
            addressContext: "user-controlled" as const,
            supportedChains: [ArcTestnet],
          },
        });

        if (!cancelled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAdapter(newAdapter as any);
          setAdapterReady(true);
        }
      } catch (err) {
        console.warn("[WalletButton] adapter init:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [connector, isConnected]);

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    if (!adapter || !sendTo || !sendAmt) return;
    setSendLoading(true);
    setSendStatus(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await kit.send({
        from:   { adapter: adapter as any, chain: "Arc_Testnet" },
        to:     sendTo,
        amount: sendAmt,
        token:  "USDC",
      });
      setSendStatus({
        type: "success",
        msg: `Sent! TX: ${String(res.txHash).slice(0, 14)}…`,
      });
      setSendTo("");
      setSendAmt("");
      setTimeout(refetchBal, 3500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSendStatus({ type: "error", msg: msg.slice(0, 100) });
    } finally {
      setSendLoading(false);
    }
  }, [adapter, sendTo, sendAmt, refetchBal]);

  const handleBridge = useCallback(async () => {
    if (!adapter || !address || !bridgeAmt) return;
    setBridgeLoading(true);
    setBridgeStatus(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (kit as any).bridge({
        from:   { adapter: adapter as any, chain: "Arc_Testnet" },
        to:     { chain: bridgeDest, useForwarder: true, recipientAddress: address },
        amount: bridgeAmt,
        token:  "USDC",
      });
      setBridgeStatus({ type: "success", msg: `Bridge to ${bridgeDest} initiated!` });
      setBridgeAmt("");
      setTimeout(refetchBal, 5000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setBridgeStatus({ type: "error", msg: msg.slice(0, 100) });
    } finally {
      setBridgeLoading(false);
    }
  }, [adapter, address, bridgeAmt, bridgeDest, refetchBal]);

  const handleSwap = useCallback(async () => {
    if (!adapter || !swapAmt) return;
    setSwapLoading(true);
    setSwapStatus(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await kit.swap({
        from:     { adapter: adapter as any, chain: "Arc_Testnet" },
        tokenIn:  swapIn,
        tokenOut: swapOut,
        amountIn: swapAmt,
      });
      setSwapStatus({
        type: "success",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        msg: `Swapped! TX: ${String((res as any)?.txHash ?? "").slice(0, 14)}…`,
      });
      setSwapAmt("");
      setTimeout(refetchBal, 3500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSwapStatus({ type: "error", msg: msg.slice(0, 100) });
    } finally {
      setSwapLoading(false);
    }
  }, [adapter, swapAmt, swapIn, swapOut, refetchBal]);

  /* ── Flip swap tokens ──────────────────────────────────────────────────── */
  const flipSwap = () => {
    setSwapIn(swapOut);
    setSwapOut(swapIn);
  };

  /* ── Ensure tokenIn ≠ tokenOut when selection changes ─────────────────── */
  const changeSwapIn = (v: SwapToken) => {
    setSwapIn(v);
    if (v === swapOut) {
      // Pick next available token that differs
      const other = SWAP_TOKENS.find((t) => t.id !== v);
      if (other) setSwapOut(other.id);
    }
  };
  const changeSwapOut = (v: SwapToken) => {
    setSwapOut(v);
    if (v === swapIn) {
      const other = SWAP_TOKENS.find((t) => t.id !== v);
      if (other) setSwapIn(other.id);
    }
  };

  /* ════════════════════════════════════════════════════════════════════════
     Render: Wrong network
  ════════════════════════════════════════════════════════════════════════ */
  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30
                   border border-amber-600/40 text-amber-400 font-semibold
                   px-4 py-2 rounded-xl transition-all text-sm"
      >
        <AlertTriangle size={15} />
        Switch to Arc Testnet
      </button>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     Render: Connected
  ════════════════════════════════════════════════════════════════════════ */
  if (isConnected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    const bal   = balance
      ? Number(formatUnits(balance.value, 6)).toFixed(2)
      : "—";

    return (
      <div className="relative" ref={menuRef}>

        {/* ── Trigger button ──────────────────────────────────────────── */}
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3
                     border border-border text-white font-medium
                     px-4 py-2 rounded-xl transition-all text-sm"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
          <span>{bal} USDC</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300">{short}</span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200
                        ${showMenu ? "rotate-180" : ""}`}
          />
        </button>

        {/* ── Dropdown panel ──────────────────────────────────────────── */}
        {showMenu && (
          <div
            className="absolute right-0 mt-2 w-80 bg-surface-2 border border-border
                       rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden
                       animate-fade-in"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-border
                            bg-gradient-to-br from-surface-2 to-surface-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">
                    Arc Testnet
                  </p>
                  <p className="text-xs font-mono text-gray-400">{short}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">
                    Balance
                  </p>
                  <p className="text-sm font-bold text-white">{bal} USDC</p>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-border bg-surface-1">
              {(["send", "bridge", "swap"] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSendStatus(null);
                    setBridgeStatus(null);
                    setSwapStatus(null);
                  }}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider
                              transition-colors relative
                              ${activeTab === tab
                                ? "text-arc-400"
                                : "text-gray-500 hover:text-gray-300"}`}
                >
                  {tab === "send"   && <Send         size={12} className="inline mr-1.5 -mt-0.5" />}
                  {tab === "bridge" && <ArrowLeftRight size={12} className="inline mr-1.5 -mt-0.5" />}
                  {tab === "swap"   && <ArrowUpDown   size={12} className="inline mr-1.5 -mt-0.5" />}
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-arc-500 rounded-t-sm" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 space-y-3 min-h-[160px]">

              {/* Adapter loading indicator */}
              {!adapterReady && (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
                  <Loader2 size={11} className="animate-spin text-arc-400" />
                  <span>Connecting wallet kit…</span>
                </div>
              )}

              {/* ── SEND ─────────────────────────────────────────────── */}
              {activeTab === "send" && (
                <>
                  <input
                    placeholder="Recipient address (0x…)"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-1 border border-border
                               rounded-lg text-sm text-white placeholder-gray-600
                               focus:outline-none focus:border-arc-500 transition-colors
                               font-mono text-[13px]"
                  />
                  <AmountRow value={sendAmt} onChange={setSendAmt} token="USDC" />
                  <ActionBtn
                    loading={sendLoading}
                    disabled={!adapterReady || !sendTo || !sendAmt}
                    icon={<Send size={14} />}
                    label="Send USDC"
                    loadingLabel="Sending…"
                    onClick={handleSend}
                  />
                  <StatusMsg status={sendStatus} />
                </>
              )}

              {/* ── BRIDGE ───────────────────────────────────────────── */}
              {activeTab === "bridge" && (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                      Destination chain
                    </p>
                    <select
                      value={bridgeDest}
                      onChange={(e) => setBridgeDest(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-1 border border-border
                                 rounded-lg text-sm text-white
                                 focus:outline-none focus:border-arc-500 transition-colors"
                    >
                      {BRIDGE_CHAINS.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <AmountRow value={bridgeAmt} onChange={setBridgeAmt} token="USDC" />
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    Bridges to your same address on {bridgeDest} via CCTP
                  </p>
                  <ActionBtn
                    loading={bridgeLoading}
                    disabled={!adapterReady || !bridgeAmt}
                    icon={<ArrowLeftRight size={14} />}
                    label={`Bridge → ${bridgeDest}`}
                    loadingLabel="Bridging…"
                    onClick={handleBridge}
                  />
                  <StatusMsg status={bridgeStatus} />
                </>
              )}

              {/* ── SWAP ─────────────────────────────────────────────── */}
              {activeTab === "swap" && (
                <>
                  <div className="flex items-end gap-2">
                    {/* Token In */}
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                        From
                      </p>
                      <select
                        value={swapIn}
                        onChange={(e) => changeSwapIn(e.target.value as SwapToken)}
                        className="w-full px-3 py-2 bg-surface-1 border border-border
                                   rounded-lg text-sm text-white
                                   focus:outline-none focus:border-arc-500 transition-colors"
                      >
                        {SWAP_TOKENS.map((t) => (
                          <option key={t.id} value={t.id} disabled={t.id === swapOut}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Flip button */}
                    <button
                      onClick={flipSwap}
                      className="mb-0.5 p-2 rounded-lg bg-surface-1 border border-border
                                 text-gray-400 hover:text-arc-400 hover:border-arc-600/40
                                 transition-colors"
                      title="Flip tokens"
                    >
                      <ArrowLeftRight size={13} />
                    </button>

                    {/* Token Out */}
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                        To
                      </p>
                      <select
                        value={swapOut}
                        onChange={(e) => changeSwapOut(e.target.value as SwapToken)}
                        className="w-full px-3 py-2 bg-surface-1 border border-border
                                   rounded-lg text-sm text-white
                                   focus:outline-none focus:border-arc-500 transition-colors"
                      >
                        {SWAP_TOKENS.map((t) => (
                          <option key={t.id} value={t.id} disabled={t.id === swapIn}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <AmountRow value={swapAmt} onChange={setSwapAmt} token={swapIn} />
                  <ActionBtn
                    loading={swapLoading}
                    disabled={!adapterReady || !swapAmt || swapIn === swapOut}
                    icon={<ArrowUpDown size={14} />}
                    label={`Swap ${swapIn} → ${swapOut}`}
                    loadingLabel="Swapping…"
                    onClick={handleSwap}
                  />
                  <StatusMsg status={swapStatus} />
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border">
              <a
                href={`https://testnet.arcscan.app/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-400
                           hover:text-white hover:bg-surface-3 transition-colors"
              >
                <ExternalLink size={13} />
                View on ArcScan
              </a>
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm
                           text-red-400 hover:bg-red-600/10 transition-colors"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     Render: Not connected
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors((v) => !v)}
        className="btn-primary flex items-center gap-2 text-sm"
        disabled={isPending}
      >
        <Wallet size={16} />
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>

      {showConnectors && (
        <div
          className="absolute right-0 mt-2 w-56 bg-surface-2 border border-border
                     rounded-xl shadow-xl shadow-black/40 z-50 overflow-hidden
                     animate-fade-in"
        >
          <p className="px-4 py-3 text-xs text-gray-500 border-b border-border
                        font-medium uppercase tracking-wider">
            Choose wallet
          </p>
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => { connect({ connector: c }); setShowConnectors(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200
                         hover:bg-surface-3 hover:text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center
                              justify-center text-xs font-bold text-arc-400">
                {c.name[0]}
              </div>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
