import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          50:  "#f0ecff",
          100: "#e0d8ff",
          400: "#9c7bff",
          500: "#7c5cff",
          600: "#6c47ff",
          700: "#5535e6",
          900: "#1a0a66",
        },
        surface: {
          0:  "#08080f",
          1:  "#0e0e1a",
          2:  "#131325",
          3:  "#1a1a30",
        },
        border: "#1e1e35",
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":      "fadeIn 0.3s ease",
        "slide-up":     "slideUp 0.35s ease",
        "pulse-slow":   "pulse 3s infinite",
        "card-in":      "cardIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both",
        "float":        "float 7s ease-in-out infinite",
        "shimmer":      "shimmer 2.8s linear infinite",
        "glow-pulse":   "glowPulse 2.5s ease-in-out infinite",
        "ticker-flash": "tickerFlash 0.6s ease forwards",
        "count-up":     "countUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "hero-in":      "heroIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "badge-in":     "badgeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        cardIn: {
          "0%":   { transform: "translateY(32px) scale(0.96)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)",       opacity: "1" },
        },
        heroIn: {
          "0%":   { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        badgeIn: {
          "0%":   { transform: "scale(0.7)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-9px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "1" },
        },
        tickerFlash: {
          "0%":   { color: "rgb(74 222 128)" },
          "65%":  { color: "rgb(74 222 128)" },
          "100%": { color: "rgb(107 114 128)" },
        },
        countUp: {
          "0%":   { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
