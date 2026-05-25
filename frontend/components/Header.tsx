"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Zap, LayoutDashboard, Shield, Plus, Lightbulb } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { LanguageSelector } from "./LanguageSelector";
import { CreateMarketModal } from "./CreateMarketModal";
import { ProposeMarketModal } from "./ProposeMarketModal";
import { useI18n } from "@/lib/i18nContext";
import { OWNER_ADDRESS } from "@/lib/contracts";

export function Header() {
  const { t } = useI18n();
  const { address } = useAccount();
  const [showCreate,  setShowCreate]  = useState(false);
  const [showPropose, setShowPropose] = useState(false);

  const isAdmin = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-0/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-arc-600 flex items-center justify-center arc-glow">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-lg tracking-tight">CirBet</span>
              <span className="text-arc-400 text-[10px] font-medium tracking-widest uppercase">
                Prediction Market
              </span>
            </div>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-gray-400">
            <a href="#markets" className="hover:text-white transition-colors">{t("navMarkets")}</a>
            <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{t("navFaucet")}</a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{t("navExplorer")}</a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <LanguageSelector />

            {/* My Account — any connected user */}
            {address && (
              <a
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                           text-sm text-gray-300 hover:text-white bg-surface-2 hover:bg-surface-3
                           border border-border transition-all"
              >
                <LayoutDashboard size={14} />
                <span>{t("navMyAccount")}</span>
              </a>
            )}

            {/* Propose Market — connected non-admin users */}
            {address && !isAdmin && (
              <button
                onClick={() => setShowPropose(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                           text-sm text-arc-300 hover:text-white bg-arc-600/10
                           hover:bg-arc-600/20 border border-arc-600/30 transition-all"
              >
                <Lightbulb size={14} />
                <span>Propose</span>
              </button>
            )}

            {/* Admin panel — owner only */}
            {isAdmin && (
              <a
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                           text-sm text-amber-400 hover:text-amber-300 bg-amber-600/10
                           hover:bg-amber-600/20 border border-amber-600/30 transition-all"
              >
                <Shield size={14} />
                <span>{t("navAdmin")}</span>
              </a>
            )}

            {/* Create market — owner only */}
            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                           text-sm text-white bg-arc-600 hover:bg-arc-500
                           border border-arc-500 transition-all"
              >
                <Plus size={14} />
                <span>{t("navCreate")}</span>
              </button>
            )}

            <WalletButton />
          </div>
        </div>
      </header>

      {showCreate  && <CreateMarketModal  onClose={() => setShowCreate(false)}  onSuccess={() => setShowCreate(false)} />}
      {showPropose && <ProposeMarketModal onClose={() => setShowPropose(false)} />}
    </>
  );
}
