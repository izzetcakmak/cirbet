import { BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
  MarketCreated,
  BetPlaced,
  MarketLocked,
  MarketResolved,
  MarketCancelled,
  WinningsClaimed,
  RefundClaimed,
} from "../generated/PredictionMarket/PredictionMarket";
import { Market, Bet, User, Activity, Protocol } from "../generated/schema";

// ── Helpers ────────────────────────────────────────────────────────────────

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("1");
  if (!protocol) {
    protocol = new Protocol("1");
    protocol.totalVolume    = BigInt.fromI32(0);
    protocol.totalBets      = BigInt.fromI32(0);
    protocol.totalMarkets   = 0;
    protocol.activeMarkets  = 0;
    protocol.resolvedMarkets = 0;
    protocol.uniqueBettors  = 0;
    protocol.updatedAt      = BigInt.fromI32(0);
  }
  return protocol;
}

function getOrCreateUser(address: Bytes, timestamp: BigInt): User {
  const id = address.toHexString();
  let user = User.load(id);
  if (!user) {
    user = new User(id);
    user.totalBet   = BigInt.fromI32(0);
    user.totalWon   = BigInt.fromI32(0);
    user.totalRefund = BigInt.fromI32(0);
    user.betCount   = 0;
    user.wonCount   = 0;
    user.firstBetAt = timestamp;
    user.lastBetAt  = timestamp;
  }
  return user;
}

// ── Handlers ──────────────────────────────────────────────────────────────

export function handleMarketCreated(event: MarketCreated): void {
  const market = new Market(event.params.id.toString());
  market.question      = event.params.question;
  market.category      = event.params.category;
  market.state         = 0; // Active
  market.endTime       = event.params.endTime;
  market.createdAt     = event.block.timestamp;
  market.creator       = event.params.creator;
  market.winningOption = BigInt.fromI32(0);
  market.totalPool     = BigInt.fromI32(0);
  market.optionCount   = 0; // updated via BetPlaced inference; no options array in event
  market.imageUrl      = "";
  market.resolvedAt    = null;
  market.cancelledAt   = null;
  market.lockedAt      = null;
  market.save();

  // Activity
  const activity = new Activity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  activity.type        = "MarketCreated";
  activity.market      = market.id;
  activity.timestamp   = event.block.timestamp;
  activity.txHash      = event.transaction.hash;
  activity.bettorAddr  = null;
  activity.amount      = null;
  activity.optionIndex = null;
  activity.save();

  // Protocol
  const protocol = getOrCreateProtocol();
  protocol.totalMarkets  = protocol.totalMarkets + 1;
  protocol.activeMarkets = protocol.activeMarkets + 1;
  protocol.updatedAt     = event.block.timestamp;
  protocol.save();
}

export function handleBetPlaced(event: BetPlaced): void {
  // Market
  const market = Market.load(event.params.marketId.toString());
  if (!market) return;
  market.totalPool = market.totalPool.plus(event.params.amount);
  market.save();

  // User
  const isNew = User.load(event.params.bettor.toHexString()) === null;
  const user  = getOrCreateUser(event.params.bettor, event.block.timestamp);
  const wasFirstBet = user.betCount === 0;
  user.totalBet  = user.totalBet.plus(event.params.amount);
  user.betCount  = user.betCount + 1;
  user.lastBetAt = event.block.timestamp;
  user.save();

  // Bet — id: marketId-bettorHex-logIndex
  const betId = event.params.marketId.toString()
    + "-" + event.params.bettor.toHexString()
    + "-" + event.logIndex.toString();
  const bet = new Bet(betId);
  bet.market      = market.id;
  bet.bettor      = event.params.bettor.toHexString(); // User entity id
  bet.optionIndex = event.params.option;
  bet.amount      = event.params.amount;
  bet.claimed     = false;
  bet.refunded    = false;
  bet.timestamp   = event.block.timestamp;
  bet.txHash      = event.transaction.hash;
  bet.save();

  // Activity
  const activity = new Activity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  activity.type        = "BetPlaced";
  activity.market      = market.id;
  activity.bettorAddr  = event.params.bettor.toHexString();
  activity.amount      = event.params.amount;
  activity.optionIndex = event.params.option;
  activity.timestamp   = event.block.timestamp;
  activity.txHash      = event.transaction.hash;
  activity.save();

  // Protocol
  const protocol = getOrCreateProtocol();
  protocol.totalVolume = protocol.totalVolume.plus(event.params.amount);
  protocol.totalBets   = protocol.totalBets.plus(BigInt.fromI32(1));
  if (wasFirstBet) protocol.uniqueBettors = protocol.uniqueBettors + 1;
  protocol.updatedAt   = event.block.timestamp;
  protocol.save();
}

export function handleMarketLocked(event: MarketLocked): void {
  const market = Market.load(event.params.marketId.toString());
  if (!market) return;
  market.state    = 1; // Locked
  market.lockedAt = event.block.timestamp;
  market.save();

  const activity = new Activity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  activity.type        = "MarketLocked";
  activity.market      = market.id;
  activity.timestamp   = event.block.timestamp;
  activity.txHash      = event.transaction.hash;
  activity.bettorAddr  = null;
  activity.amount      = null;
  activity.optionIndex = null;
  activity.save();

  const protocol = getOrCreateProtocol();
  protocol.activeMarkets = protocol.activeMarkets - 1;
  protocol.updatedAt     = event.block.timestamp;
  protocol.save();
}

export function handleMarketResolved(event: MarketResolved): void {
  const market = Market.load(event.params.marketId.toString());
  if (!market) return;
  market.state         = 2; // Resolved
  market.winningOption = event.params.winningOption;
  market.resolvedAt    = event.block.timestamp;
  market.save();

  const activity = new Activity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  activity.type        = "MarketResolved";
  activity.market      = market.id;
  activity.optionIndex = event.params.winningOption;
  activity.timestamp   = event.block.timestamp;
  activity.txHash      = event.transaction.hash;
  activity.bettorAddr  = null;
  activity.amount      = null;
  activity.save();

  const protocol = getOrCreateProtocol();
  // activeMarkets already decremented at lock; only increment resolved
  protocol.resolvedMarkets = protocol.resolvedMarkets + 1;
  protocol.updatedAt       = event.block.timestamp;
  protocol.save();
}

export function handleMarketCancelled(event: MarketCancelled): void {
  const market = Market.load(event.params.marketId.toString());
  if (!market) return;
  market.state       = 3; // Cancelled
  market.cancelledAt = event.block.timestamp;
  market.save();

  const activity = new Activity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  activity.type        = "MarketCancelled";
  activity.market      = market.id;
  activity.amount      = event.params.totalRefunded;
  activity.timestamp   = event.block.timestamp;
  activity.txHash      = event.transaction.hash;
  activity.bettorAddr  = null;
  activity.optionIndex = null;
  activity.save();

  const protocol = getOrCreateProtocol();
  protocol.updatedAt = event.block.timestamp;
  protocol.save();
}

export function handleWinningsClaimed(event: WinningsClaimed): void {
  const user = User.load(event.params.bettor.toHexString());
  if (!user) return;
  user.totalWon = user.totalWon.plus(event.params.amount);
  user.wonCount = user.wonCount + 1;
  user.save();
}

export function handleRefundClaimed(event: RefundClaimed): void {
  const user = User.load(event.params.bettor.toHexString());
  if (!user) return;
  user.totalRefund = user.totalRefund.plus(event.params.amount);
  user.save();
}
