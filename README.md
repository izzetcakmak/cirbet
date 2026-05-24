# CirBet — Prediction Market on Arc Network

Decentralized prediction market built from scratch on **Arc Testnet** (Circle's L1).  
Native USDC as the betting currency. Sub-second finality. Full EVM compatibility.

---

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Contracts | Solidity 0.8.24 + Hardhat + OpenZeppelin |
| Frontend  | Next.js 15 + wagmi v2 + viem      |
| Network   | Arc Testnet (Chain ID: 5042002)   |
| Gas token | Native USDC (6 decimals)          |

---

## Quick Start

### 1. Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env — add PRIVATE_KEY and RPC_URL
npm run compile
npm run deploy:arc
# → Copy contract address from output
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local — paste NEXT_PUBLIC_CONTRACT_ADDRESS from deploy step
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Network Config

| Parameter    | Value                             |
|--------------|-----------------------------------|
| Chain ID     | `5042002`                         |
| RPC          | `https://rpc.testnet.arc.network` |
| Explorer     | `https://testnet.arcscan.app`     |
| Gas token    | USDC (6 decimals)                 |
| Faucet       | `https://faucet.circle.com`       |

---

## Contract Architecture

`PredictionMarket.sol` — single contract handles everything:

- **Admin** creates markets (question, options, deadline, category)
- **Users** bet with native USDC (`msg.value`)
- **Admin** locks market after deadline, then resolves with winning option
- **Winners** claim proportional USDC (3% platform fee deducted)
- All market state lives on-chain — no backend needed

Market lifecycle: `Active → Locked → Resolved`

---

## ARC-specific Notes

- USDC is the **native currency** on Arc (like ETH on Ethereum)
- Bets use `msg.value` — no ERC-20 approve needed
- 6 decimal precision (1 USDC = 1_000_000 units)
- Minimum bet: 0.001 USDC (`MIN_BET = 1_000`)
