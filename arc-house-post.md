# 🔮 CirBet — An On-Chain Prediction Market Built Natively on Arc Network

**Category:** Builder Showcase · DeFi · Prediction Markets
**Chain:** Arc Testnet (Chain ID 5042002)
**Stack:** Circle App Kit · USDC · Goldsky · Solidity · Next.js · wagmi v2
**Live:** [cirbet.xyz](https://cirbet.xyz)

---

## What We Built

CirBet is a fully on-chain prediction market where users bet on real-world outcomes — crypto prices, sports results, geopolitical events — using USDC as the native settlement currency. No wrapped tokens, no synthetic assets, no intermediaries. You place a position, the oracle resolves it, and your winnings land in your wallet automatically.

The core insight: Arc Network's native USDC integration eliminates the biggest friction point in DeFi prediction markets. On every other chain, "use USDC" means bridge something, wrap something, or swap something first. On Arc, USDC *is* the currency users already have — and Circle's infrastructure makes the entire DX frictionless from day one.

---

## 💰 Create a Market. Earn From Every Bet.

Anyone can spin up a prediction market on CirBet — no permission required.

When your market attracts bets and resolves, **you earn a share of the protocol fee**. The more volume your market generates, the more you earn — automatically, on-chain, in USDC.

**How it works:**
1. 🏗️ **Create** — define your question, options, and end time
2. 📈 **Attract** — share your market, bettors pile in
3. ✅ **Resolve** — outcome is set on-chain
4. 💵 **Earn** — fee revenue lands in your wallet in USDC

> *No platform risk. No invoices. No middleman. Just a smart contract paying you out.*

This turns CirBet into a **permissionless prediction market protocol** — not just an app. Anyone can be a market maker and earn from their insight about what the community wants to bet on.

**Early creator advantage:** The first markets on a new chain capture the most volume. Arc Testnet is live now — your market could be the one everyone's betting on.

---

## Architecture Deep Dive

### Smart Contract

The `PredictionMarket.sol` contract lives at:
```
0x169912c97c7bec28A5EE6561C1D14a5F18E36DF9 — Arc Testnet
```

It handles the complete lifecycle of a market:

```
Active → Locked → Resolved  ✓ (winnings claimable)
       ↘         → Cancelled ✗ (refunds claimable)
```

Key mechanics:
- **Market creation:** Any address can create a market by defining a question, category, option set, and Unix end time. No permissioned oracle — the contract owner resolves.
- **Bet placement:** Users call `placeBet(marketId, optionIndex, amount)`. The contract pulls USDC directly via `IERC20.transferFrom`. No ETH required.
- **Payout calculation:** Standard pari-mutuel model. Winners receive `(userStake / winnersPool) × totalPool`, minus a 2% protocol fee shared between creator and protocol.
- **Refund path:** If a market is cancelled before resolution, every bettor can claim a full refund with `claimRefund(marketId)`.

The events emitted by the contract are the source of truth for the entire indexing layer:

```solidity
event MarketCreated(uint256 indexed id, string question, uint8 category, uint256 endTime, address indexed creator);
event BetPlaced(uint256 indexed marketId, address indexed bettor, uint256 option, uint256 amount);
event MarketLocked(uint256 indexed marketId);
event MarketResolved(uint256 indexed marketId, uint256 winningOption);
event MarketCancelled(uint256 indexed marketId, uint256 totalRefunded, uint256 feeCollected);
event WinningsClaimed(uint256 indexed marketId, address indexed bettor, uint256 amount);
event RefundClaimed(uint256 indexed marketId, address indexed bettor, uint256 amount);
```

---

### Circle App Kit — The DeFi Wallet Layer

The most technically interesting integration is the embedded DeFi wallet powered by **Circle's App Kit**. Instead of telling users to "go to your wallet app," we built Send, Bridge, and Swap directly into the app's wallet button dropdown.

The adapter initialization pattern was the critical piece:

```typescript
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();

// On wallet connection, create the viem adapter from the browser provider
const provider = await connector.getProvider();

const adapter = await createViemAdapterFromProvider({
  provider: provider as EIP1193Provider,
  getPublicClient: ({ chain }) =>
    createPublicClient({
      chain,
      transport: http(
        chain.id === ARC_TESTNET_ID
          ? "https://rpc.testnet.arc.network/"
          : undefined
      ),
    }),
  capabilities: {
    addressContext: "user-controlled",
    supportedChains: [ArcTestnet],
  },
});
```

Once the adapter is live, the three DeFi operations drop in cleanly:

```typescript
// Send
kit.send({ from: { adapter, chain: "Arc_Testnet" }, to: recipientAddress, amount, token: "USDC" });

// Bridge (Arc → any testnet, using forwarder pattern)
kit.bridge({
  from: { adapter, chain: "Arc_Testnet" },
  to: { chain: destChain, useForwarder: true, recipientAddress: address },
  amount,
  token: "USDC",
});

// Swap (USDC ↔ EURC ↔ cirBTC)
kit.swap({ adapter, chain: "Arc_Testnet", from: tokenA, to: tokenB, amount });
```

Bridge destinations: `Base_Sepolia`, `Ethereum_Sepolia`, `Arbitrum_Sepolia`, `Optimism_Sepolia`, `Polygon_Amoy_Testnet`, `Avalanche_Fuji`, `Unichain_Sepolia` — fully testnet-native.

One non-obvious lesson: the `BridgeDestination` type requires either a full `adapter` on the destination chain, or the `useForwarder: true` + `recipientAddress` pattern. For a single-chain app where users don't have an adapter on the destination, the forwarder is the right path.

---

### Goldsky Subgraph — Solving the O(N) Dashboard Problem

The dashboard page originally made `3 × N` RPC calls — one `getMarket()`, one `getOptionCount()`, and one `getTotalPool()` per market. At 10 markets that's 30 calls. At 100 markets it becomes untenable.

The fix: a Goldsky-hosted subgraph on `arc-testnet` that indexes every event into a queryable GraphQL schema.

**Schema highlights:**

```graphql
type Market @entity {
  id: ID!
  question: String!
  category: Int!
  state: Int!         # 0=Active 1=Locked 2=Resolved 3=Cancelled
  totalPool: BigInt!
  winningOption: BigInt!
  bets: [Bet!]!       @derivedFrom(field: "market")
  activities: [Activity!]! @derivedFrom(field: "market")
}

type User @entity {
  id: ID!             # lowercase hex address
  totalBet: BigInt!
  totalWon: BigInt!
  betCount: Int!
  wonCount: Int!
  bets: [Bet!]!       @derivedFrom(field: "bettor")
}

type Protocol @entity {
  id: ID!             # singleton "1"
  totalVolume: BigInt!
  totalBets: BigInt!
  activeMarkets: Int!
  resolvedMarkets: Int!
  uniqueBettors: Int!
}
```

The `subgraph.yaml` targets Arc Testnet:
```yaml
network: arc-testnet
source:
  address: "0x169912c97c7bec28A5EE6561C1D14a5F18E36DF9"
  startBlock: 1
```

The dashboard now makes **one GraphQL query** to get all active markets, their pools, and recent activity in a single round trip. The `Protocol` singleton gives protocol-wide stats (total volume, unique bettors, market counts) at zero marginal cost.

---

### Multi-Currency Betting — The QCAD Play

The bet modal already has the currency selector infrastructure wired in:

| Token | Status | Details |
|-------|--------|---------|
| **USDC** | ✅ Live | Circle's native USD stablecoin on Arc |
| **EURC** | 🔜 Soon | Circle's EUR stablecoin — adapter ready |
| **QCAD** | 🔜 Soon | Canada's first regulated CAD stablecoin by Stablecorp |

QCAD is particularly compelling. It's already live on Arc Testnet as a regulated, audited, 1:1 CAD-backed token. The moment Circle activates the settlement corridor, CirBet can immediately spin up CAD-denominated prediction markets — Canadian politics, Bank of Canada rate decisions, NHL championships. There's genuine product-market fit here that no other prediction market platform is positioned to serve.

---

## Why Arc + Circle is the Right Stack for This

Three things made this build possible that wouldn't work the same elsewhere:

**1. Native stablecoin = zero onboarding friction**
Users don't need to bridge ETH, swap to USDC, then approve. They have USDC in a Circle wallet, they connect, they bet. The flow is three taps.

**2. App Kit's composability**
Building Send/Bridge/Swap from scratch would take weeks. App Kit dropped it in as a ~200-line integration. The `createViemAdapterFromProvider` abstraction is elegant — it takes any EIP-1193 provider (MetaMask, WalletConnect, whatever) and hands back a typed adapter that works with the full Circle DeFi suite.

**3. Goldsky on Arc Testnet**
The `arc-testnet` network slug being supported in Goldsky's registry meant we went from zero to live subgraph in one deploy command. No custom node setup, no archive node costs, no polling hacks.

---

## Numbers

| Metric | Value |
|--------|-------|
| Contract | Deployed, verified |
| Markets supported | Binary + multi-option |
| Max options per market | Configurable (default 4) |
| Protocol fee | 2% (shared: creator + protocol) |
| Bet settlement | Automatic (on-chain) |
| Indexing latency | ~2s (Goldsky) |
| Frontend | Next.js 14, wagmi v2, Tailwind |

---

## What's Next

- **Live EURC markets** — Euro-denominated predictions, first on Arc
- **QCAD markets** — CAD-denominated markets when Circle activates the corridor
- **Creator fee dashboard** — Track your markets' volume and earned fees in real time
- **Oracle integration** — Chainlink / UMA for trustless resolution
- **Mobile-first UI** — The wallet dropdown is already mobile-optimized
- **Mainnet deployment** — When Arc Mainnet launches

---

## Get Involved

- 🌐 App: [cirbet.xyz](https://cirbet.xyz)
- 📦 Contract: `0x169912c97c7bec28A5EE6561C1D14a5F18E36DF9` (Arc Testnet)
- 🔗 Faucet: [Arc Testnet Faucet](https://faucet.testnet.arc.network) — get USDC to bet with
- 🏗️ Built with: Circle App Kit · Arc Network · Goldsky · wagmi v2

---

*Built during Arc Testnet launch period by a solo developer exploring what's possible when programmable dollars meet prediction markets. Feedback welcome — especially from anyone thinking about multi-currency settlement, oracle design, or creator fee mechanics.*

---

**Tags:** `#PredictionMarket` `#CircleAppKit` `#ArcNetwork` `#USDC` `#EURC` `#QCAD` `#Goldsky` `#DeFi` `#BuildOnArc` `#EarnOnChain`

---

> 💡 **Technical TL;DR:** ERC-20 pari-mutuel market contract + permissionless market creation with creator fee share + Circle App Kit (Send/Bridge/Swap) embedded wallet + Goldsky subgraph indexing + multi-currency selector (USDC live, EURC/QCAD coming). One codebase, three Circle primitives, zero off-chain settlement.
