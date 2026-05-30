/**
 * CirBet Narration Generator + Video Combiner
 * 1. Generates professional English narration via edge-tts (Microsoft Neural TTS)
 * 2. Overlays audio onto cirbet-demo.webm using Playwright's bundled FFmpeg
 * Output: cirbet-demo-narrated.mp4
 */

import { EdgeTTS } from "edge-tts";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCRIPT = `What if you could bet on real-world outcomes — instantly, on-chain — using USDC you already hold? Meet CirBet.

CirBet is a prediction market built natively on Arc Network. Browse live questions across crypto, sports, and geopolitics. Every market is on-chain. Every outcome is verifiable. And every bet settles in USDC — the stablecoin you already use.

Placing a bet takes just seconds. Pick your outcome, enter your amount, confirm. No gas fees. Arc Network handles that. Your position is recorded on-chain the moment you hit Place Bet.

Done. You're in the market. When the outcome resolves, winnings land directly in your wallet — no manual claims, no waiting.

The built-in wallet does more than just hold USDC. Send funds to any address in one tap. Bridge between Arc Testnet and seven other chains. Or swap between USDC, EURC, and cirBTC — all inside the same interface, powered by Circle App Kit.

We're also bringing multi-currency betting to prediction markets. USDC is live today. EURC and QCAD — Canada's first regulated CAD stablecoin — are coming next.

The creator dashboard lets you spin up your own market in minutes. A Goldsky-powered subgraph indexes every bet, every resolution, and every claim in real time.

CirBet is live on Arc Testnet right now. No email, no KYC — just connect and bet. Visit cirbet dot xyz.`;

const AUDIO_OUT = path.join(__dirname, "narration.mp3");
const VIDEO_IN  = path.join(__dirname, "cirbet-demo.webm");
const VIDEO_OUT = path.join(__dirname, "cirbet-demo-narrated.mp4");

// Playwright's bundled ffmpeg
const FFMPEG = "C:\\Users\\Monster\\AppData\\Local\\ms-playwright\\ffmpeg-1011\\ffmpeg-win64\\ffmpeg-win64\\ffmpeg.exe";

(async () => {
  console.log("🎙️  CirBet Narration Generator");
  console.log();

  // ── Step 1: Generate audio ──────────────────────────────────────────────
  console.log("⏳ Generating narration (en-US-GuyNeural voice)…");
  const tts = new EdgeTTS();
  await tts.ttsPromise(SCRIPT, AUDIO_OUT, "en-US-GuyNeural", "+0%", "+0%");
  console.log("✅ Audio saved:", AUDIO_OUT);
  console.log();

  // ── Step 2: Check FFmpeg ────────────────────────────────────────────────
  if (!fs.existsSync(FFMPEG)) {
    console.error("❌ FFmpeg not found at:", FFMPEG);
    console.error("   Run: npx playwright install chromium");
    process.exit(1);
  }

  // ── Step 3: Combine video + audio ──────────────────────────────────────
  console.log("⏳ Combining video + narration with FFmpeg…");

  // Get video duration
  const probe = execSync(`"${FFMPEG}" -i "${VIDEO_IN}" 2>&1`, { encoding: "utf8" });
  const durMatch = probe.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const videoDur = durMatch
    ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
    : 88;
  console.log(`   Video duration: ${videoDur.toFixed(1)}s`);

  const cmd = [
    `"${FFMPEG}"`,
    `-y`,
    `-i "${VIDEO_IN}"`,          // video input
    `-i "${AUDIO_OUT}"`,         // audio input
    `-c:v libx264`,              // re-encode to H.264 for broad compatibility
    `-preset fast`,
    `-crf 18`,                   // high quality
    `-c:a aac`,
    `-b:a 192k`,
    `-shortest`,                 // end at shortest stream
    `-movflags +faststart`,      // web-optimised
    `"${VIDEO_OUT}"`
  ].join(" ");

  execSync(cmd, { stdio: "inherit" });

  console.log();
  console.log("✅ Done!");
  console.log("   Output:", VIDEO_OUT);

  const size = (fs.statSync(VIDEO_OUT).size / (1024 * 1024)).toFixed(1);
  console.log(`   Size:   ${size} MB`);
  console.log();
  console.log("Open the file to preview:");
  console.log(`   start "" "${VIDEO_OUT}"`);
})();
