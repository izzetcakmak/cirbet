import { ethers } from "hardhat";

// ─── Owner / deployer config ──────────────────────────────────────────────────
// This wallet must be the deployer — it becomes the contract owner.
// Required for Arc airdrop eligibility criteria.
const EXPECTED_OWNER = "0xd4f1254c803662c46d9c21f80f4f3c15ff57e2c9";

async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    console.error(`\n❌  No deployer account found!`);
    console.error(`   contracts/.env dosyasını oluştur ve PRIVATE_KEY ekle:`);
    console.error(`   PRIVATE_KEY=<0xd4f1254c... cüzdanının private key'i>\n`);
    process.exit(1);
  }

  if (deployer.address.toLowerCase() !== EXPECTED_OWNER.toLowerCase()) {
    console.error(`\n❌  Wrong deployer!`);
    console.error(`   Expected : ${EXPECTED_OWNER}`);
    console.error(`   Got      : ${deployer.address}`);
    console.error(`   → Add the correct PRIVATE_KEY to .env and retry.\n`);
    process.exit(1);
  }

  console.log(`\n✅  Deployer : ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance  : ${ethers.formatUnits(balance, 6)} USDC`);

  const factory  = await ethers.getContractFactory("PredictionMarket");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n📄  PredictionMarket deployed to : ${address}`);
  console.log(`🔗  ArcScan : https://testnet.arcscan.app/address/${address}\n`);

  // ── Seed markets for demo ──────────────────────────────────────────────────
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;

  const markets = [
    {
      question: "Will Bitcoin surpass $150,000 before July 2026?",
      options:  ["Yes", "No"],
      endTime:  now + 30 * day,
      category: 0,
      image:    "",
    },
    {
      question: "Which team will win the 2026 Champions League?",
      options:  ["Real Madrid", "Manchester City", "PSG", "Bayern Munich"],
      endTime:  now + 20 * day,
      category: 1,
      image:    "",
    },
    {
      question: "Will the US Federal Reserve cut interest rates in June 2026?",
      options:  ["Yes — 25bps", "Yes — 50bps", "No cut"],
      endTime:  now + 10 * day,
      category: 2,
      image:    "",
    },
    {
      question: "Which L1 will have the highest DEX volume in Q2 2026?",
      options:  ["Arc", "Ethereum", "Solana", "Base"],
      endTime:  now + 15 * day,
      category: 0,
      image:    "",
    },
  ];

  console.log("Creating seed markets…");
  for (const m of markets) {
    const tx = await contract.createMarket(
      m.question, m.options, m.endTime, m.category, m.image
    );
    await tx.wait();
    console.log(`  ✓ "${m.question}"`);
  }

  console.log("\n─────────────────────────────────────────────────");
  console.log("Add this to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=5042002`);
  console.log("─────────────────────────────────────────────────\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
