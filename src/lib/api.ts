// @ts-nocheck
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJ4_vwOwCWn9AIWamVzHYSqoTDkZsIn9dBxrw8C4miEnS9kPT-v3FhY4jcqJ_BVsGiAg/exec";

// Optimized request with longer timeout for Google Apps Script
async function request(payload: any, timeout: number = 25000) {
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
    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn("Request timeout - trade may have executed");
      return { success: true, warning: 'TIMEOUT_BUT_MAY_SUCCEED', message: 'Request took longer than expected. Please check if trade executed.' };
    }
    console.error("API ERROR:", error);
    return { success: false, error: 'CONNECTION_ERROR', message: error.message || 'Connection failed' };
  }
}

// Fast GET request with shorter timeout
async function fastGet(url: string, timeout: number = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("GET Error:", error);
    return null;
  }
}

// --- AUTHENTICATION ---
export async function loginUser(userName: string, pin: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=login&userName=${encodeURIComponent(userName)}&pin=${pin}`, 10000);
  return data || { success: false };
}

// --- MARKET DATA ---
export async function fetchMarketPrices(round?: number) {
  const roundParam = round !== undefined ? `&round=${round}` : '';
  const data = await fastGet(`${SCRIPT_URL}?action=getMarketPrices${roundParam}&t=${Date.now()}`, 6000);
  return data || [];
}

export async function getStockPrice(stock: string, round: number) {
  const data = await fastGet(`${SCRIPT_URL}?action=getStockPrice&stock=${encodeURIComponent(stock)}&round=${round}&t=${Date.now()}`, 5000);
  return data?.price || 0;
}

// --- OPTION CHAIN ---
export async function fetchOptionChain(round: number) {
  const data = await fastGet(`${SCRIPT_URL}?action=getOptionChain&round=${round}&t=${Date.now()}`, 6000);
  return data || [];
}

// --- ACCOUNT DATA ---
export async function getUserBalance(userName: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getUserBalance&userName=${encodeURIComponent(userName)}&t=${Date.now()}`, 5000);
  return data?.balance || 0;
}

export async function getCurrentCashBalance(userName: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getCurrentCashBalance&userName=${encodeURIComponent(userName)}&t=${Date.now()}`, 5000);
  return data?.balance || 0;
}

export async function getStartingCapital() {
  const data = await fastGet(`${SCRIPT_URL}?action=getStartingCapital&t=${Date.now()}`, 5000);
  return data?.capital || 10000000;
}

// --- GLOBAL STATE ---
export async function getActiveRound() {
  const data = await fastGet(`${SCRIPT_URL}?action=getActiveRound&t=${Date.now()}`, 4000);
  return data?.round ?? 1;
}

export async function setRoundAction(round: number) {
  return await request({ action: "setRound", round });
}

// --- LOCK STATES ---
export async function getOptionLockState() {
  const data = await fastGet(`${SCRIPT_URL}?action=getOptionLockState&t=${Date.now()}`, 4000);
  return data?.state || 'open';
}

export async function setOptionLock(state: string) {
  return await request({ action: "setOptionLock", state });
}

export async function getNewsLockState() {
  const data = await fastGet(`${SCRIPT_URL}?action=getNewsLockState&t=${Date.now()}`, 4000);
  return data?.state || 'open';
}

export async function setNewsLock(state: string) {
  return await request({ action: "setNewsLock", state });
}

export async function getShortLockState() {
  const data = await fastGet(`${SCRIPT_URL}?action=getShortLockState&t=${Date.now()}`, 4000);
  return data?.state || 'open';
}

export async function setShortLock(state: string) {
  return await request({ action: "setShortLock", state });
}

// --- OPTION PREMIUM ---
export async function getOptionPremium(round: number, strike: number, type: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getOptionPremium&round=${round}&strike=${strike}&type=${type}&t=${Date.now()}`, 5000);
  return data?.premium || 0;
}

// --- STOCK TRADING ---
export async function buyFromSystem(buyer: string, stock: string, qty: number) {
  return await request({ 
    action: "buyFromSystem", 
    buyer, 
    stock,
    qty: parseInt(String(qty))
  }, 20000);
}

export async function createStockSellOrder(seller: string, stock: string, qty: number, price: number) {
  const res = await request({ 
    action: "createStockSellOrder", 
    seller, 
    stock,
    qty: parseInt(String(qty)), 
    price: parseFloat(String(price))
  }, 20000);
  
  if (res.success) {
    return res.pin;
  } else if (res.error === 'INSUFFICIENT_POSITION') {
    throw new Error(res.message || 'Insufficient shares to sell');
  } else if (res.warning === 'TIMEOUT_BUT_MAY_SUCCEED') {
    throw new Error('Request timed out. Check Trades sheet for your PIN.');
  } else {
    throw new Error(res.message || 'Failed to create sell order');
  }
}

export async function matchStockBuyOrder(buyer: string, pin: string, stock: string, qty: number, price: number) {
  return await request({ 
    action: "matchStockBuyOrderDirect",
    pin: String(pin).trim(), 
    buyer,
    stock,
    qty: parseInt(String(qty)),
    price: parseFloat(String(price))
  }, 20000);
}

// --- SHORT SELLING ---
export async function shortStock(team: string, stock: string, qty: number) {
  return await request({
    action: "shortStock",
    team,
    stock,
    qty: parseInt(String(qty))
  }, 20000);
}

export async function coverStock(team: string, stock: string, pin: string, qty: number) {
  return await request({
    action: "coverStock",
    team,
    stock,
    pin: String(pin).trim(),
    qty: parseInt(String(qty))
  }, 20000);
}

export async function getActiveShorts(userName: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getActiveShorts&userName=${encodeURIComponent(userName)}&t=${Date.now()}`, 6000);
  return data || [];
}

// --- OPTION TRADING ---
export async function createOptionBuyOrder(buyer: string, trade: string, strike: number, lotSize: number, lots: number, premium: number) {
  return await request({
    action: "createOptionBuyOrder",
    buyer, trade, strike, lotSize, lots, premium
  }, 20000);
}

export async function createOptionSellOrder(seller: string, trade: string, strike: number, lotSize: number, lots: number, premium: number) {
  return await request({
    action: "createOptionSellOrder",
    seller, trade, strike, lotSize, lots, premium
  }, 20000);
}

export async function matchOptionOrder(user: string, isSeller: boolean, pin: string, trade: string, strike: number, lotSize: number, lots: number) {
  return await request({
    action: "matchOptionOrder",
    user, isSeller,
    pin: String(pin).trim(),
    trade, strike, lotSize, lots
  }, 20000);
}

// --- BROKER PANEL ---
export async function getPendingTrades() {
  const data = await fastGet(`${SCRIPT_URL}?action=getQueue&t=${Date.now()}`, 6000);
  return data || [];
}

export async function getPendingOptionTrades(brokerName?: string) {
  const brokerParam = brokerName ? `&broker=${encodeURIComponent(brokerName)}` : '';
  const data = await fastGet(`${SCRIPT_URL}?action=getPendingOptionTrades${brokerParam}&t=${Date.now()}`, 6000);
  return data || [];
}

export async function getVerifiedOptionTrades(brokerName?: string) {
  const brokerParam = brokerName ? `&broker=${encodeURIComponent(brokerName)}` : '';
  const data = await fastGet(`${SCRIPT_URL}?action=getVerifiedOptionTrades${brokerParam}&t=${Date.now()}`, 6000);
  return data || [];
}

export async function verifyStockTrade(tradeId: string) {
  return await request({ action: "finalizeStockTrade", tradeId }, 20000);
}

export async function verifyOptionTrade(tradeId: string) {
  return await request({ action: "finalizeOptionTrade", tradeId }, 20000);
}

export async function rejectStockTrade(tradeId: string) {
  return await request({ action: "rejectStockTrade", tradeId }, 15000);
}

export async function rejectOptionTrade(tradeId: string) {
  return await request({ action: "rejectOptionTrade", tradeId }, 15000);
}

// --- PORTFOLIO ---
export async function getPortfolioHoldings(userName: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getPortfolioHoldings&userName=${encodeURIComponent(userName)}&t=${Date.now()}`, 6000);
  return data || [];
}

export async function getActiveOptionTrades(userName: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getActiveOptionTrades&userName=${encodeURIComponent(userName)}&t=${Date.now()}`, 6000);
  return data || [];
}

// --- NEWS ---
export async function getNews() {
  const data = await fastGet(`${SCRIPT_URL}?action=getNews&t=${Date.now()}`, 6000);
  return data || [];
}

export async function injectNews(title: string, summary: string, content: string, source: string = "SYSTEM") {
  return await request({ action: "injectNews", title, summary, content, source }, 15000);
}

// --- AUCTIONS ---
export async function getAuctions() {
  const data = await fastGet(`${SCRIPT_URL}?action=getAuctions&t=${Date.now()}`, 6000);
  return data || [];
}

export async function getAuctionBids(auctionId: string) {
  const data = await fastGet(`${SCRIPT_URL}?action=getAuctionBids&auctionId=${encodeURIComponent(auctionId)}&t=${Date.now()}`, 5000);
  return data || [];
}

export async function createAuction(round: number, stock: string, snippet: string, duration: number, startingBid: number) {
  return await request({ action: "createAuction", round, stock, snippet, duration, startingBid }, 15000);
}

export async function placeBid(auctionId: string, bidder: string, amount: number) {
  return await request({ action: "placeBid", auctionId, bidder, amount }, 15000);
}

// --- BLOCK DEALS ---
export async function floatTradeAction(ticker: string, qty: number, price: number, isBuy: boolean, changePercent: number) {
  return await request({
    action: "floatTrade",
    ticker,
    qty: parseInt(String(qty)),
    price: parseFloat(String(price)),
    isBuy,
    changePercent: parseFloat(String(changePercent))
  }, 15000);
}
