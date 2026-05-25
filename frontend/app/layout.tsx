import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne  = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["700", "800"] });

export const metadata: Metadata = {
  title:       "CirBet — Prediction Market on Arc Network",
  description: "Decentralized prediction market powered by native USDC on Arc Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="bg-surface-0 text-white antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
