"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { LayoutDashboard, Shield, Plus, LineChart, Menu, X, ExternalLink } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { LanguageSelector } from "./LanguageSelector";
import { BlockTicker } from "./BlockTicker";
import { CreateMarketModal } from "./CreateMarketModal";
import { ProposeMarketModal } from "./ProposeMarketModal";
import { CirBetLogo } from "./CirBetLogo";
import { useI18n } from "@/lib/i18nContext";
import { OWNER_ADDRESS } from "@/lib/contracts";

export function Header() {
  const { t } = useI18n();
  const { address } = useAccount();
  const [showCreate,   setShowCreate]   = useState(false);
  const [showPropose,  setShowPropose]  = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  const isAdmin = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  return (
    <>
      <header className="sticky top-0 z-40 header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <CirBetLogo size={38} />
            <div className="flex flex-col leading-none">
              <span
                className="text-[19px] leading-tight tracking-tight"
                style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}
              >
                <span style={{ color: "#f0efe8" }}>CIR</span>
                <span style={{
                  WebkitTextStroke: "1.2px #c8a96e",
                  color: "transparent",
                  letterSpacing: "0.08em",
                }}>BET</span>
              </span>
              <span
                className="text-[8px] uppercase tracking-[0.3em] mt-0.5"
                style={{ color: "#0099cc", fontFamily: "monospace" }}
              >
                Prediction Market
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-gray-400">
            <a href="/#markets" className="hover:text-white transition-colors">{t("navMarkets")}</a>
            <a href="/institutional"
               className="flex items-center gap-1.5 hover:text-white transition-colors text-blue-400 hover:text-blue-300">
              <LineChart size={13} />
              Institutional
            </a>
            <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{t("navFaucet")}</a>
            {isAdmin && (
              <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{t("navExplorer")}</a>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Desktop: Dashboard */}
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

            {isAdmin && <BlockTicker />}
            <LanguageSelector />

            {/* Desktop: Admin */}
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

            {/* Desktop: Create market */}
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

            {/* Mobile: hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl
                         bg-surface-2 border border-border text-gray-300 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-border bg-surface-1/95 backdrop-blur-md px-4 py-3 flex flex-col gap-2">
            <a
              href="/#markets"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300
                         hover:text-white hover:bg-surface-2 transition-all"
            >
              {t("navMarkets")}
            </a>

            <a
              href="/institutional"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-blue-400
                         hover:text-blue-300 hover:bg-surface-2 transition-all"
            >
              <LineChart size={15} />
              Institutional
            </a>

            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300
                         hover:text-white hover:bg-surface-2 transition-all"
            >
              {t("navFaucet")}
              <ExternalLink size={13} className="ml-auto opacity-50" />
            </a>

            {address && (
              <a
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300
                           hover:text-white hover:bg-surface-2 border border-border transition-all"
              >
                <LayoutDashboard size={15} />
                {t("navMyAccount")}
              </a>
            )}

            {isAdmin && (
              <a
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-amber-400
                           hover:text-amber-300 bg-amber-600/10 hover:bg-amber-600/20
                           border border-amber-600/30 transition-all"
              >
                <Shield size={15} />
                {t("navAdmin")}
              </a>
            )}

            {isAdmin && (
              <button
                onClick={() => { setShowCreate(true); setMobileOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white
                           bg-arc-600 hover:bg-arc-500 border border-arc-500 transition-all"
              >
                <Plus size={15} />
                {t("navCreate")}
              </button>
            )}
          </div>
        )}
      </header>

      {showCreate  && <CreateMarketModal  onClose={() => setShowCreate(false)}  onSuccess={() => setShowCreate(false)} />}
      {showPropose && <ProposeMarketModal onClose={() => setShowPropose(false)} />}
    </>
  );
}
