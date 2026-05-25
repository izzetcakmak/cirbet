"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Percent, BarChart3, Globe, Building2, Flame, Landmark,
  ChevronDown, ChevronUp, ArrowRight, Shield, CheckCircle2,
  ExternalLink, Info, BookOpen, Zap, Database,
} from "lucide-react";
import { Header } from "@/components/Header";
import { CirBetLogo } from "@/components/CirBetLogo";
import {
  INSTITUTIONAL_CATEGORIES,
  TRUST_POINTS,
  HOW_IT_WORKS_STEPS,
  type InstitutionalCategory,
  type MarketExample,
} from "@/lib/institutional";

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  TrendingUp, Percent, BarChart3, Globe, Building2, Flame, Landmark,
};

function CategoryIcon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[name] ?? BarChart3;
  return <Icon size={size} className={className} />;
}

// ─── Market Intelligence block ────────────────────────────────────────────────

function MarketIntelBlock({ example }: { example: MarketExample }) {
  const [open, setOpen] = useState(false);
  const { intel } = example;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2
                   hover:bg-surface-3 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Info size={14} className="text-arc-400 shrink-0" />
          <span className="text-sm font-medium text-white truncate">{example.question}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-xs text-arc-400 hidden sm:block">Market Intelligence</span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 bg-surface-1 space-y-3 text-xs border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IntelRow icon={<Database size={12} />} label="Previous Data"    value={intel.previousData} />
            <IntelRow icon={<Zap size={12} />}       label="Next Release"    value={intel.nextRelease} />
            <IntelRow icon={<ExternalLink size={12} />} label="Official Source" value={intel.officialSource} />
            <IntelRow icon={<CheckCircle2 size={12} />} label="Resolution"    value={intel.resolutionCriteria} />
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-[10px] font-medium mb-1.5">
              Related Market Factors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {intel.relatedFactors.map((f) => (
                <span key={f} className="bg-surface-2 border border-border rounded-lg px-2 py-0.5 text-gray-400">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IntelRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-gray-500 uppercase tracking-wider text-[10px] font-medium mb-0.5">
        {icon} {label}
      </p>
      <p className="text-gray-300 leading-relaxed">{value}</p>
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ cat, active, onClick }: {
  cat:     InstitutionalCategory;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-5 cursor-pointer transition-all duration-200 ${cat.bg}
                  ${active ? "ring-2 ring-arc-500/60 shadow-lg shadow-arc-600/10" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-surface-0/60 border border-border/60
                         flex items-center justify-center shrink-0`}>
          <CategoryIcon name={cat.iconName} size={20} className={cat.color} />
        </div>
        <span className={`text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded-full
                          bg-surface-0/40 border border-border/40 ${cat.color}`}>
          {cat.subtitle}
        </span>
      </div>
      <h3 className="text-white font-bold text-base mb-1.5">{cat.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{cat.description}</p>
      <div className={`flex items-center gap-1.5 mt-4 text-xs font-medium ${cat.color}`}>
        <span>{active ? "Viewing examples" : "View examples"}</span>
        <ArrowRight size={12} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstitutionalPage() {
  const [activeCat, setActiveCat] = useState<string>(INSTITUTIONAL_CATEGORIES[0].id);
  const selectedCat = INSTITUTIONAL_CATEGORIES.find((c) => c.id === activeCat)!;

  return (
    <div className="min-h-screen flex flex-col bg-surface-0">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-14 px-4">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-600/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[250px] bg-arc-600/6 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20
                          rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-blue-400">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Arc-Native Institutional Forecasting
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Institutional Markets
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-3">
            Trade forecasts on macro data, rates, inflation, geopolitical risk
            and institutional events using USDC on Arc.
          </p>
          <p className="text-gray-600 text-sm max-w-xl mx-auto">
            An Arc-native market intelligence layer for trading real-world forecasts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a href="#categories" className="btn-primary px-6 py-3">
              Explore Market Categories
            </a>
            <a href="#how-it-works" className="btn-ghost px-6 py-3">
              How It Works
            </a>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm">
            {[
              { label: "Market Categories",  value: "7" },
              { label: "Settlement",          value: "USDC" },
              { label: "Network",             value: "Arc" },
              { label: "Finality",            value: "<1s" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-white font-bold text-xl">{s.value}</span>
                  <span className="text-gray-500 text-xs">{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-border hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Positioning copy ────────────────────────────────────────────────── */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-surface-1 border border-arc-600/20 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-arc-600/10 border border-arc-600/20
                            flex items-center justify-center mt-0.5">
              <BookOpen size={18} className="text-arc-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg mb-2">
                Beyond Simple Prediction Markets
              </h2>
              <p className="text-gray-400 leading-relaxed">
                CirBet is evolving beyond simple prediction markets. Built on Arc and powered
                by USDC, CirBet enables transparent forecasting markets for inflation, interest
                rates, macroeconomic data, geopolitical risk, corporate events and real-world
                institutional outcomes.
              </p>
              <p className="text-gray-500 text-sm mt-3 italic">
                "CirBet turns real-world uncertainty into transparent USDC markets on Arc."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Market Categories ────────────────────────────────────────────────── */}
      <section id="categories" className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="text-arc-400 text-xs uppercase tracking-widest font-medium mb-2">Market Categories</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Institutional Forecast Markets
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl">
              Select a category to view example markets, market intelligence context and
              resolution criteria.
            </p>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {INSTITUTIONAL_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                active={activeCat === cat.id}
                onClick={() => setActiveCat(cat.id)}
              />
            ))}
          </div>

          {/* Selected category detail */}
          <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
            <div className={`px-6 py-4 border-b border-border flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-lg bg-surface-2 border border-border
                               flex items-center justify-center`}>
                <CategoryIcon name={selectedCat.iconName} size={16} className={selectedCat.color} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">{selectedCat.title}</h3>
                <p className="text-gray-500 text-xs">{selectedCat.subtitle}</p>
              </div>
              <span className={`ml-auto text-xs px-3 py-1 rounded-full border ${selectedCat.bg} ${selectedCat.color}`}>
                {selectedCat.examples.length} example markets
              </span>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm mb-6">{selectedCat.description}</p>

              {selectedCat.examples.map((ex, i) => (
                <MarketIntelBlock key={i} example={ex} />
              ))}

              <div className="pt-2">
                <Link
                  href="/#markets"
                  className="inline-flex items-center gap-2 text-sm text-arc-400
                             hover:text-arc-300 transition-colors font-medium"
                >
                  <ArrowRight size={14} />
                  View live markets on CirBet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="text-arc-400 text-xs uppercase tracking-widest font-medium mb-2">Process</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              How Institutional Markets Work
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.step}
                className="relative bg-surface-1 border border-border rounded-2xl p-6
                           hover:border-arc-600/30 transition-all">
                {/* Connector line */}
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2.5 w-5 h-px bg-border z-10" />
                )}
                <div className="text-4xl font-bold text-surface-3 mb-4 font-mono">
                  {step.step}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section ─────────────────────────────────────────────────────── */}
      <section id="trust" className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-1 border border-border rounded-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={20} className="text-arc-400" />
              <p className="text-arc-400 text-xs uppercase tracking-widest font-medium">Infrastructure</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Built for Higher-Trust Forecast Markets
            </h2>
            <p className="text-gray-500 text-sm mb-8 max-w-xl">
              CirBet is designed to support transparent, source-verified and
              professionally structured prediction markets for real-world outcomes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRUST_POINTS.map((pt) => (
                <div key={pt.title}
                  className="flex items-start gap-3 p-4 rounded-xl bg-surface-2
                             border border-border hover:border-arc-600/30 transition-all">
                  <CheckCircle2 size={16} className="text-arc-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium mb-0.5">{pt.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Market Intelligence anchor ────────────────────────────────────────── */}
      <section id="market-intelligence" className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="border border-blue-600/20 bg-blue-600/5 rounded-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-2">
              <Database size={20} className="text-blue-400" />
              <p className="text-blue-400 text-xs uppercase tracking-widest font-medium">Market Intelligence</p>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Context Behind Every Market
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-2xl mb-6">
              Unlike simple prediction markets, CirBet institutional markets include a
              structured Market Intelligence block for every forecast. Each market shows the
              relevant previous data, expected release date, official source, related market
              factors and exact resolution criteria — before you trade.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Previous Data",       desc: "Last known data point from the official source" },
                { label: "Next Release Date",   desc: "When the next data publication is expected" },
                { label: "Official Source",     desc: "The authoritative body publishing the outcome data" },
                { label: "Related Factors",     desc: "Key variables that may influence the market outcome" },
                { label: "Resolution Criteria", desc: "Exact conditions under which the market resolves YES or NO" },
                { label: "AI Summary",          desc: "Automated context digest — coming soon" },
              ].map((item) => (
                <div key={item.label}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-1 border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-gray-600 text-xs mt-6">
              Market intelligence data is currently placeholder. Live data integration via official APIs
              is on the product roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-1 border border-border rounded-xl p-5">
            <p className="text-gray-600 text-xs leading-relaxed">
              <span className="text-gray-400 font-medium">Disclaimer: </span>
              CirBet is a prediction market interface for informational and experimental purposes.
              Market availability may depend on jurisdiction, regulation and platform policy.
              Users are responsible for understanding applicable laws in their region.
              Each market includes clearly defined resolution criteria and trusted data sources
              before becoming active. This platform does not constitute financial advice.
              Past market outcomes do not guarantee future results.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between
                        gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <CirBetLogo size={20} />
            <span>CirBet © 2026 — Built on Arc Network</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-400 transition-colors">Markets</Link>
            <Link href="/institutional" className="hover:text-gray-400 transition-colors">Institutional</Link>
            <a href="https://docs.arc.io" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Docs</a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
