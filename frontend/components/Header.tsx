"use client";

import { WalletButton } from "./WalletButton";
import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-surface-0/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-arc-600 flex items-center justify-center arc-glow">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-lg tracking-tight">CirBet</span>
            <span className="text-arc-400 text-[10px] font-medium tracking-widest uppercase">
              Prediction Market
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#markets" className="hover:text-white transition-colors">Markets</a>
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Faucet
          </a>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Explorer
          </a>
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}
