// @ts-nocheck
// UPDATE THIS URL AFTER DEPLOYING THE NEW CODE.GS
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUlVNGql4VLd3oitWFg5orcbWQiCp1ZmTwiEjd9Yj1P2GSZu6LMK0ympjRtlDHQRMmRw/exec";

// Request helper with proper error handling
async function request(payload: any, timeout: number = 10000) {
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
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Invalid JSON response:", text);
      return { success: false, error: "Invalid response from server" };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, error: "Request timeout" };
    }
    console.error("API ERROR:", error);
    return { success: false, error: error.message || "Network error" };
  }
}

// GET helper
async function get(params: string, timeout: number = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `${SCRIPT_URL}?${params}&t=${Date.now()}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Invalid JSON:", text);
      return null;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("GET error:", error);
    return null;
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function loginUser(userName: string, pin: string) {
  const res = await get(`action=login&userName=${encodeURIComponent(userName)}&pin=${pin}`);
  return res || { success: false };
}

// ============================================================================
// MARKET DATA
// ============================================================================

export async function fetchMarketPrices(round?: number) {
  const params = round !== undefined ? `action=getMarketPrices&round=${round}` : 'action=getMarketPrices';
  return await get(params) || [];
}

export async function getStockPricesForRound(round: number) {
  return await get(`action=getStockPricesForRound&round=${round}`) || [];
}

export async function getStockPrice(stock: string, round: number) {
  const res = await get(`action=getStockPrice&stock=${encodeURIComponent(stock)}&round=${round}`);
  return res?.price || 0;
}

// ============================================================================
// BALANCE & CAPITAL
// ============================================================================

export async function getUserBalance(userName: string) {
  const res = await get(`action=getUserBalance&userName=${encodeURIComponent(userName)}`);
  return res?.balance || 0;
}

export async function getCurrentCashBalance(userName: string) {
  const res = await get(`action=getCurrentCashBalance&userName=${encodeURIComponent(userName)}`);
  return res?.balance || 0;
}

export async function getStartingCapital() {
  const res = await get('action=getStartingCapital');
  return res?.capital || 10000000;
}

// ============================================================================
// ROUND & LOCK STATES
// ============================================================================

export async function getActiveRound() {
  const res = await get('action=getActiveRound');
  return res?.round ?? 0;
}

export async function setRoundAction(round: number) {
  return await request({ action: "setRound", round });
}

export async function getOptionLockState() {
  const res = await get('action=getOptionLockState');
  return res?.state || 'open';
}

export async function setOptionLock(state: string) {
  return await request({ action: "setOptionLock", state });
}

export async function getNewsLockState() {
  const res = await get('action=getNewsLockState');
  return res?.state || 'open';
}

export async function setNewsLock(state: string) {
  return await request({ action: "setNewsLock", state });
}

export async function getShortLockState() {
  const res = await get('action=getShortLockState');
  return res?.state || 'open';
}

export async function setShortLock(state: string) {
  return await request({ action: "setShortLock", state });
}

// ============================================================================
// OPTION CHAIN
// ============================================================================

export async function fetchOptionChain(round: number) {
  return await get(`action=getOptionChain&round=${round}`) || [];
}

export async function getOptionPremium(round: number, strike: number, type: string) {
  const res = await get(`action=getOptionPremium&round=${round}&strike=${strike}&type=${type}`);
  return res?.premium || 0;
}

// ============================================================================
// STOCK TRADING
// ============================================================================

export async function buyFromSystem(buyer: string, stock: string, qty: number) {
  return await request({ action: "buyFromSystem", buyer, stock, qty: parseInt(String(qty)) });
}

export async function createStockSellOrder(seller: string, stock: string, qty: number, price: number) {
  const res = await request({
    action: "createStockSellOrder",
    seller, stock,
    qty: parseInt(String(qty)),
    price: parseFloat(String(price))
  });
  
  if (res.success) return res.pin;
  throw new Error(res.message || res.error || 'Failed to create sell order');
}

export async function matchStockBuyOrder(buyer: string, pin: string, stock: string, qty: number, price: number) {
  return await request({
    action: "matchStockBuyOrderDirect",
    buyer, pin: String(pin).trim(), stock,
    qty: parseInt(String(qty)),
    price: parseFloat(String(price))
  });
}

// ============================================================================
// SHORT SELLING
// ============================================================================

export async function shortStock(team: string, stock: string, qty: number) {
  return await request({
    action: "shortStock",
    team, stock,
    qty: parseInt(String(qty))
  });
}

export async function coverStock(team: string, stock: string, pin: string, qty: number) {
  return await request({
    action: "coverStock",
    team, stock,
    pin: String(pin).trim(),
    qty: parseInt(String(qty))
  });
}

export async function getActiveShorts(userName: string) {
  return await get(`action=getActiveShorts&userName=${encodeURIComponent(userName)}`) || [];
}

// ============================================================================
// OPTION TRADING
// ============================================================================

export async function createOptionBuyOrder(buyer: string, trade: string, strike: number, lotSize: number, lots: number, premium: number) {
  return await request({ action: "createOptionBuyOrder", buyer, trade, strike, lotSize, lots, premium });
}

export async function createOptionSellOrder(seller: string, trade: string, strike: number, lotSize: number, lots: number, premium: number) {
  return await request({ action: "createOptionSellOrder", seller, trade, strike, lotSize, lots, premium });
}

export async function matchOptionOrder(user: string, isSeller: boolean, pin: string, trade: string, strike: number, lotSize: number, lots: number) {
  return await request({ action: "matchOptionOrder", user, isSeller, pin, trade, strike, lotSize, lots });
}

// ============================================================================
// BROKER PANEL
// ============================================================================

export async function getPendingTrades() {
  return await get('action=getQueue') || [];
}

export async function getPendingOptionTrades(brokerName?: string) {
  const params = brokerName ? `action=getPendingOptionTrades&broker=${encodeURIComponent(brokerName)}` : 'action=getPendingOptionTrades';
  return await get(params) || [];
}

export async function getVerifiedOptionTrades(brokerName?: string) {
  const params = brokerName ? `action=getVerifiedOptionTrades&broker=${encodeURIComponent(brokerName)}` : 'action=getVerifiedOptionTrades';
  return await get(params) || [];
}

export async function verifyOptionTrade(tradeId: string) {
  return await request({ action: "finalizeOptionTrade", tradeId });
}

export async function rejectOptionTrade(tradeId: string) {
  return await request({ action: "rejectOptionTrade", tradeId });
}

// ============================================================================
// PORTFOLIO
// ============================================================================

export async function getPortfolioHoldings(userName: string) {
  return await get(`action=getPortfolioHoldings&userName=${encodeURIComponent(userName)}`) || [];
}

export async function getActiveOptionTrades(userName: string) {
  return await get(`action=getActiveOptionTrades&userName=${encodeURIComponent(userName)}`) || [];
}

// ============================================================================
// NEWS
// ============================================================================

export async function getNews() {
  return await get('action=getNews') || [];
}

export async function injectNews(title: string, summary: string, content: string, source: string = "SYSTEM") {
  return await request({ action: "injectNews", title, summary, content, source });
}

// ============================================================================
// AUCTIONS
// ============================================================================

export async function getAuctions() {
  return await get('action=getAuctions') || [];
}

export async function getAuctionBids(auctionId: string) {
  return await get(`action=getAuctionBids&auctionId=${encodeURIComponent(auctionId)}`) || [];
}

export async function createAuction(round: number, stock: string, snippet: string, duration: number, startingBid: number) {
  return await request({ action: "createAuction", round, stock, snippet, duration, startingBid });
}

export async function placeBid(auctionId: string, bidder: string, amount: number) {
  return await request({ action: "placeBid", auctionId, bidder, amount });
}

// ============================================================================
// BLOCK DEALS
// ============================================================================

export async function floatTradeAction(ticker: string, qty: number, price: number, isBuy: boolean, changePercent: number) {
  return await request({
    action: "floatTrade", ticker,
    qty: parseInt(String(qty)),
    price: parseFloat(String(price)),
    isBuy, changePercent: parseFloat(String(changePercent))
  });
}
