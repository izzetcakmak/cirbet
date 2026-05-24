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
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease",
        "slide-up":   "slideUp 0.35s ease",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
