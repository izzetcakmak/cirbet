"use client";

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/arc";
import { formatUnits } from "viem";
import { Wallet, LogOut, ChevronDown, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending }   = useConnect();
  const { disconnect }  = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

  const [showMenu, setShowMenu] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  const wrongNetwork = isConnected && chain?.id !== arcTestnet.id;

  // ── Wrong network ─────────────────────────────────────────────────────────
  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40
                   text-amber-400 font-semibold px-4 py-2 rounded-xl transition-all text-sm"
      >
        <AlertTriangle size={15} />
        Switch to Arc Testnet
      </button>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  if (isConnected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    const bal   = balance ? Number(formatUnits(balance.value, 6)).toFixed(2) : "—";

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border
                     text-white font-medium px-4 py-2 rounded-xl transition-all text-sm"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
          <span>{bal} USDC</span>
          <span className="text-gray-400">|</span>
          <span>{short}</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-52 bg-surface-2 border border-border rounded-xl
                          shadow-xl shadow-black/40 z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-gray-500">Connected to</p>
              <p className="text-sm font-semibold text-arc-400">Arc Testnet</p>
            </div>
            <a
              href={`https://testnet.arcscan.app/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white
                         hover:bg-surface-3 transition-colors"
            >
              View on ArcScan
            </a>
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400
                         hover:bg-red-600/10 transition-colors"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────
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
        <div className="absolute right-0 mt-2 w-56 bg-surface-2 border border-border rounded-xl
                        shadow-xl shadow-black/40 z-50 overflow-hidden animate-fade-in">
          <p className="px-4 py-3 text-xs text-gray-500 border-b border-border font-medium uppercase tracking-wider">
            Choose wallet
          </p>
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => { connect({ connector: c }); setShowConnectors(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200
                         hover:bg-surface-3 hover:text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-xs font-bold">
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
