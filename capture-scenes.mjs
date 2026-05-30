/**
 * CirBet Scene Screenshot Capture
 * Takes one high-quality screenshot per scene from cirbet-demo.html
 * Output: scenes/scene-01.png … scene-08.png
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_FILE  = path.join(__dirname, "cirbet-demo.html");
const OUT_DIR    = path.join(__dirname, "scenes");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

// Scene definitions: [id, captureAt_ms, label]
// Capture at ~60% into each scene for best visual state
const SCENES = [
  { id: "s1", at:  4800, label: "01-hero"       },
  { id: "s2", at: 16000, label: "02-markets"    },
  { id: "s3", at: 26000, label: "03-bet-modal"  },
  { id: "s4", at: 34000, label: "04-success"    },
  { id: "s5", at: 46000, label: "05-wallet"     },
  { id: "s6", at: 54000, label: "06-currency"   },
  { id: "s7", at: 65000, label: "07-dashboard"  },
  { id: "s8", at: 79000, label: "08-cta"        },
];

console.log("📸  CirBet Scene Capture");
console.log("   Source:", HTML_FILE);
console.log("   Output:", OUT_DIR);
console.log();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto(`file:///${HTML_FILE.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });

  // Pause the auto-advance so we can seek manually
  await page.evaluate(() => {
    // Store original scene data for manual control
    window.__scenes = window.scenes || [];
  });

  for (const scene of SCENES) {
    console.log(`⏳  Scene ${scene.label} (t=${scene.at}ms)…`);

    // Force the specific scene to be active
    await page.evaluate((sceneId) => {
      // Hide all scenes
      document.querySelectorAll(".scene").forEach(el => {
        el.classList.remove("active");
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      });
      // Show target scene
      const target = document.getElementById(sceneId);
      if (target) {
        target.classList.add("active");
        target.style.opacity = "1";
        target.style.pointerEvents = "auto";
      }
    }, scene.id);

    // Wait for animations to settle
    await page.waitForTimeout(800);

    // For wallet scene, activate the swap tab for a nicer screenshot
    if (scene.id === "s5") {
      await page.evaluate(() => {
        const tabs = document.querySelectorAll(".wd-tab");
        tabs.forEach(t => t.classList.remove("active"));
        const swapTab = Array.from(tabs).find(t => t.textContent.trim() === "Swap");
        if (swapTab) swapTab.classList.add("active");
        document.querySelectorAll(".wd-panel").forEach(p => p.style.display = "none");
        const swapPanel = document.getElementById("wdSwap");
        if (swapPanel) swapPanel.style.display = "block";
      });
      await page.waitForTimeout(300);
    }

    const outPath = path.join(OUT_DIR, `scene-${scene.label}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`   ✅  Saved: scene-${scene.label}.png`);
  }

  await browser.close();

  console.log();
  console.log("✅  All 8 scenes captured!");
  console.log("   Folder:", OUT_DIR);
  console.log();
  console.log("Next: upload to Synthesia / D-ID with per-scene script");
})();
