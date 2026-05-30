/**
 * CirBet Demo Recorder
 * Records cirbet-demo.html as a 1920×1080 video (WebM)
 * Output: cirbet-demo.webm (same folder)
 *
 * Usage:
 *   node record-demo.mjs
 *
 * Requires Playwright chromium browser to be installed:
 *   npx playwright install chromium
 */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HTML_FILE   = path.join(__dirname, "cirbet-demo.html");
const OUTPUT_DIR  = __dirname;
const RECORD_MS   = 88_000; // 88 seconds — full animation + small buffer
const WIDTH       = 1920;
const HEIGHT      = 1080;

console.log("🎬 CirBet Demo Recorder");
console.log("   HTML  :", HTML_FILE);
console.log("   Output:", path.join(OUTPUT_DIR, "cirbet-demo.webm"));
console.log("   Length:", RECORD_MS / 1000, "seconds");
console.log();

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  const context = await browser.newContext({
    viewport:    { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir:  OUTPUT_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();

  console.log("⏳ Opening demo page…");
  await page.goto(`file:///${HTML_FILE.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });

  // Give the page half a second to settle before the animation clock starts
  await page.waitForTimeout(500);

  // Click once to dismiss any browser focus issues
  await page.mouse.click(WIDTH / 2, HEIGHT / 2);

  console.log(`⏳ Recording for ${RECORD_MS / 1000}s — do not close this window…`);

  // Wait for the full animation to play out
  await page.waitForTimeout(RECORD_MS);

  console.log("💾 Saving video…");
  const video  = await page.video();
  const tmpPath = await video.path();

  await context.close();
  await browser.close();

  // Playwright auto-names the file; rename it to cirbet-demo.webm
  const fs  = await import("fs");
  const dest = path.join(OUTPUT_DIR, "cirbet-demo.webm");

  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(tmpPath, dest);

  console.log();
  console.log("✅ Done!");
  console.log("   Video saved to:", dest);
  console.log();
  console.log("Next steps:");
  console.log("  1. Open cirbet-demo.webm in any video player to verify");
  console.log("  2. Upload to HeyGen as 'Background video' and add avatar narration");
  console.log("  3. Use the script in HEYGEN_SCRIPT.md as the avatar's text");
})();
