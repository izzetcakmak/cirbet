/**
 * CirBet Logo Mark — SVG component
 * Derived from cirbet-logo.html
 * Uses the same 220×220 viewBox with no animation (static header/icon use).
 */
export function CirBetLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Arc Network gradient — electric blue → cyan */}
        <linearGradient id="cbl-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00d4ff" />
          <stop offset="40%"  stopColor="#0099cc" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2" />
        </linearGradient>

        {/* USDC / Circle gradient — gold */}
        <linearGradient id="cbl-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f0cc80" />
          <stop offset="50%"  stopColor="#c8a96e" />
          <stop offset="100%" stopColor="#f0cc80" stopOpacity="0.3" />
        </linearGradient>

        {/* Glow filters */}
        <filter id="cbl-glow-arc" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cbl-glow-gold" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Outer Arc ring (Arc Network) ── */}
      <circle
        cx="110" cy="110" r="80"
        stroke="url(#cbl-arc)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        filter="url(#cbl-glow-arc)"
      />

      {/* ── Inner Circle ring (USDC / Circle) ── */}
      <circle
        cx="110" cy="110" r="40"
        stroke="url(#cbl-gold)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        filter="url(#cbl-glow-gold)"
      />

      {/* ── C letterform — white stroke, gold glow ── */}
      <path
        d="M 145 75 A 48 48 0 1 0 145 145"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        filter="url(#cbl-glow-gold)"
      />

      {/* ── Top endpoint dot (Arc Network — cyan) ── */}
      <circle cx="145" cy="75"  r="5" fill="#00d4ff" filter="url(#cbl-glow-arc)" />

      {/* ── Bottom endpoint dot (USDC — gold) ── */}
      <circle cx="145" cy="145" r="5" fill="#f0cc80" filter="url(#cbl-glow-gold)" />
    </svg>
  );
}
