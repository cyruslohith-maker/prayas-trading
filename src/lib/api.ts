// @ts-nocheck
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwowrmynkHDiQ0bsz4dfKkeRfJeLn9Qr7M7EzgyX_D7Pn1rufm4KEbNn-jTh4zL7sIa2Q/exec";

// Optimized request function with faster timeout
async function request(payload: any, timeout: number = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, 
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("API ERROR:", error);
    return { success: false, message: "CONNECTION_LOST" };
  }
}

// Fire-and-forget request for background processing (for perceived speed)
function requestAsync(payload: any) {
  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, 
    body: JSON.stringify(payload),
  }).catch(console.error);
}

// --- AUTHENTICATION ---
export async function loginUser(userName: string, pin: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=login&userName=${encodeURIComponent(userName)}&pin=${pin}`);
    return await res.json();
  } catch (e) { return { success: false }; }
}

// --- MARKET DATA (with round-based pricing) ---
export async function fetchMarketPrices(round?: number) {
  try {
    const roundParam = round !== undefined ? `&round=${round}` : '';
    const res = await fetch(`${SCRIPT_URL}?action=getMarketPrices${roundParam}&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

// NEW: Get stock prices for specific round from Back End sheet
export async function getStockPricesForRound(round: number) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getStockPricesForRound&round=${round}&t=${Date.now()}`);
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

// NEW: Get current cash balance from Result sheet Column L
export async function getCurrentCashBalance(userName: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getCurrentCashBalance&userName=${userName}&t=${Date.now()}`);
    const data = await res.json();
    return data.balance || 0;
  } catch (e) { return 0; }
}

// --- GLOBAL STATE CONTROL ---
export async function getActiveRound() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getActiveRound&t=${Date.now()}`);
    const data = await res.json();
    return data.round || 0;
  } catch (e) { return 0; }
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

// --- NEWS LOCK STATE (NEW) ---
export async function getNewsLockState() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getNewsLockState&t=${Date.now()}`);
    const data = await res.json();
    return data.state || 'open';
  } catch (e) { return 'open'; }
}

export async function setNewsLock(state: string) {
  return await request({ action: "setNewsLock", state });
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

// ROUND 0: Buy from system (no PIN, no seller)
export async function buyFromSystem(buyer: string, stock: string, qty: number) {
  return await request({ 
    action: "buyFromSystem", 
    buyer, 
    stock: stock.toUpperCase(),
    qty: parseInt(qty)
  }, 4000);
}

// ROUND 1+: Seller creates sell order
export async function createStockSellOrder(seller: string, stock: string, qty: number, price: number) {
  const res = await request({ 
    action: "createStockSellOrder", 
    seller, 
    stock: stock.toUpperCase(),
    qty: parseInt(qty), 
    price: parseFloat(price)
  }, 4000);
  
  if (res.success) {
    return res.pin;
  } else if (res.error === 'INSUFFICIENT_POSITION') {
    throw new Error(res.message || 'Insufficient position to sell');
  } else {
    throw new Error('Failed to create sell order');
  }
}

// ROUND 1+: Buyer matches with seller's PIN (now bypasses P2P queue for stocks)
export async function matchStockBuyOrder(buyer: string, pin: string, stock: string, qty: number, price: number) {
  // Immediately return success for UI, let backend process
  const res = await request({ 
    action: "matchStockBuyOrderDirect", // New action: direct to broker sheet
    pin: String(pin).trim(), 
    buyer,
    stock: stock.toUpperCase(),
    qty: parseInt(qty),
    price: parseFloat(price)
  }, 4000);
  
  return res;
}

// NEW: Get pending stock trades from Broker sheets (for admin view only)
export async function getPendingTrades() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getQueue&t=${Date.now()}`);
    return await res.json();
  } catch (e) { return []; }
}

// --- OPTION TRADING (with broker verification) ---
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

// --- BROKER PANEL ---
export async function getPendingOptionTrades(brokerName?: string) {
  try {
    const brokerParam = brokerName ? `&broker=${encodeURIComponent(brokerName)}` : '';
    const res = await fetch(`${SCRIPT_URL}?action=getPendingOptionTrades${brokerParam}&t=${Date.now()}`);
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

// --- TEAM CONFIGURATION ---
export async function getTeamBrokerMapping() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTeamBrokerMapping&t=${Date.now()}`);
    return await res.json();
  } catch (e) { 
    // Default mapping if API fails
    return {
      broker_01: ['team_alpha', 'team_beta', 'team_charlie', 'team_defcon'],
      broker_02: ['team_tango', 'team_foxtrot', 'team_delta', 'team_golf'],
      broker_03: ['team_hotel', 'team_romeo', 'team_gamma', 'team_delta']
    };
  }
}
