/**
 * One-shot market creation script.
 * Usage: npx hardhat run scripts/create-market.ts --network arc
 */

import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x169912c97c7bec28A5EE6561C1D14a5F18E36DF9";

const ABI = [
  "function createMarket(string question, string[] options, uint256 endTime, uint8 category, string imageUrl) returns (uint256)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`\n✅  Signer : ${signer.address}`);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const now     = Math.floor(Date.now() / 1000);
  const day     = 86_400;
  const endTime = now + 60 * day;   // 60 gün

  // ── Market tanımı ─────────────────────────────────────────────────────────
  const question = "What will the US GDP growth rate be in Q2 2026?";
  const options  = [
    "Below 1.0%",
    "1.0% – 2.0%",
    "2.0% – 3.0%",
    "Above 3.0%",
  ];
  const category = 5;   // Macro Data
  const imageUrl = "";

  console.log(`\n📊  Creating Macro Data market…`);
  console.log(`   Question : ${question}`);
  console.log(`   Options  : ${options.join(" | ")}`);
  console.log(`   Category : ${category} (Macro Data)`);
  console.log(`   End      : ${new Date(endTime * 1000).toISOString()}\n`);

  const tx = await contract.createMarket(question, options, endTime, category, imageUrl);
  console.log(`   TX hash  : ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`   ✓ Confirmed in block ${receipt.blockNumber}`);
  console.log(`\n🔗  ArcScan : https://testnet.arcscan.app/tx/${tx.hash}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
