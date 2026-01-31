// @ts-nocheck
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyRZccNGpkG1xSBIcMUurW6AD8t8u7i8UpbEPxuUwWzKpGEaUea6qU5veREoJmM_RuDxA/exec";

async function request(payload: any) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, 
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("API ERROR:", error);
    return { success: false, message: "CONNECTION_LOST" };
  }
}

// --- AUTHENTICATION ---
export async function loginUser(userName: string, pin: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=login&userName=${encodeURIComponent(userName)}&pin=${pin}`);
    return await res.json();
  } catch (e) { return { success: false }; }
}

// --- MARKET DATA ---
export async function fetchMarketPrices() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getMarketPrices&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

// --- OPTION CHAIN (Round-based) ---
export async function fetchOptionChain(round: number) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getOptionChain&round=${round}&t=${Date.now()}`);
    return await res.json(); 
  } catch (e) { return []; }
}

// --- ACCOUNT TELEMETRY ---
export async function getUserBalance(userName: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getUserBalance&userName=${userName}&t=${Date.now()}`);
    const data = await res.json();
    return data.balance || 0;
  } catch (e) { return 0; }
}

// --- GLOBAL STATE CONTROL ---
export async function getActiveRound() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getActiveRound&t=${Date.now()}`);
    const data = await res.json();
    return data.round || 1;
  } catch (e) { return 1; }
}

export async function setRoundAction(round: number) {
  return await request({ action: "setRound", round });
}

// --- OPTION LOCK STATE ---
export async function getOptionLockState() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getOptionLockState&t=${Date.now()}`);
    const data = await res.json();
    return data.state || 'open';
  } catch (e) { return 'open'; }
}

export async function setOptionLock(state: string) {
  return await request({ action: "setOptionLock", state });
}

// --- GET OPTION PREMIUM ---
export async function getOptionPremium(round: number, strike: number, type: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getOptionPremium&round=${round}&strike=${strike}&type=${type}&t=${Date.now()}`);
    const data = await res.json();
    return data.premium || 0;
  } catch (e) { return 0; }
}

// --- STOCK TRADING ---
export async function createStockSellOrder(seller: string, stock: string, qty: number, price: number) {
  const res = await request({ 
    action: "createStockSellOrder", 
    seller, 
    stock: stock.toUpperCase(),
    qty: parseInt(qty), 
    price: parseFloat(price)
  });
  
  if (res.success) {
    return res.pin;
  } else if (res.error === 'INSUFFICIENT_POSITION') {
    throw new Error(res.message || 'Insufficient position to sell');
  } else {
    throw new Error('Failed to create sell order');
  }
}

export async function matchStockBuyOrder(buyer: string, pin: string, stock: string, qty: number, price: number) {
  return await request({ 
    action: "matchStockBuyOrder", 
    pin: String(pin).trim(), 
    buyer,
    stock: stock.toUpperCase(),
    qty: parseInt(qty),
    price: parseFloat(price)
  });
}

// NEW: Get pending option trades from Broker Options sheets
export async function getPendingOptionTrades() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getPendingOptionTrades&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

// --- OPTION TRADING (New Flow) ---
export async function createOptionBuyOrder(buyer: string, trade: string, strike: number, lotSize: number, lots: number, premium: number) {
  return await request({
    action: "createOptionBuyOrder",
    buyer,
    trade,
    strike,
    lotSize,
    lots,
    premium
  });
}

export async function createOptionSellOrder(seller: string, trade: string, strike: number, lotSize: number, lots: number, premium: number) {
  return await request({
    action: "createOptionSellOrder",
    seller,
    trade,
    strike,
    lotSize,
    lots,
    premium
  });
}

export async function matchOptionOrder(user: string, isSeller: boolean, pin: string, trade: string, strike: number, lotSize: number, lots: number) {
  return await request({
    action: "matchOptionOrder",
    user,
    isSeller,
    pin,
    trade,
    strike,
    lotSize,
    lots
  });
}

// --- BLOCK DEALS ---
export async function floatTradeAction(ticker: string, qty: number, price: number, isBuy: boolean, changePercent: number) {
  return await request({
    action: "floatTrade",
    ticker: ticker.toUpperCase(),
    qty: parseInt(qty),
    price: parseFloat(price),
    isBuy,
    changePercent: parseFloat(changePercent)
  });
}

// --- BROKER PANEL ---
export async function getPendingTrades() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getQueue&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

export async function verifyStockTrade(tradeId: string) {
  return await request({ action: "finalizeStockTrade", tradeId });
}

export async function verifyOptionTrade(tradeId: string) {
  return await request({ action: "finalizeOptionTrade", tradeId });
}

// --- REJECTION HANDLING ---
export async function rejectStockTrade(tradeId: string) {
  return await request({ action: "rejectStockTrade", tradeId });
}

export async function rejectOptionTrade(tradeId: string) {
  return await request({ action: "rejectOptionTrade", tradeId });
}

// --- NEWS ---
export async function getNews() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getNews&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

export async function injectNews(title: string, summary: string, content: string, source: string = "SYSTEM") {
  return await request({ 
    action: "injectNews", 
    title: title.toUpperCase(), 
    summary, 
    content,
    source
  });
}

// --- AUCTION SYSTEM ---
export async function getAuctions() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getAuctions&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

export async function getAuctionBids(auctionId: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getAuctionBids&auctionId=${encodeURIComponent(auctionId)}&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

export async function createAuction(round: number, stock: string, snippet: string, duration: number, startingBid: number) {
  return await request({ 
    action: "createAuction", 
    round, 
    stock, 
    snippet, 
    duration, 
    startingBid 
  });
}

export async function placeBid(auctionId: string, bidder: string, amount: number) {
  return await request({ action: "placeBid", auctionId, bidder, amount });
}
