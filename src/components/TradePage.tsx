// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  createStockSellOrder, matchStockBuyOrder, buyFromSystem,
  createOptionBuyOrder, createOptionSellOrder, matchOptionOrder,
  fetchOptionChain, getOptionPremium,
  shortStock, coverStock, getActiveShorts
} from '../lib/api';

export function TradePage({ onBack, userName, activeRound, marketStocks, optionLockState, shortLockState, userRole }) {
  const [assetType, setAssetType] = useState<'stocks' | 'options' | 'short'>('stocks');
  const [isBuy, setIsBuy] = useState(activeRound === 0);

  // Stock fields
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [pin, setPin] = useState('');
  const [genPin, setGenPin] = useState<number | null>(null);

  // Short fields
  const [shortAction, setShortAction] = useState<'short' | 'square'>('short');
  const [shortTicker, setShortTicker] = useState('');
  const [shortQty, setShortQty] = useState('');
  const [shortPin, setShortPin] = useState('');
  const [shortValue, setShortValue] = useState(0);
  const [activeShortsList, setActiveShortsList] = useState([]);
  const [loadingShorts, setLoadingShorts] = useState(false);

  // Option fields
  const [optionType, setOptionType] = useState<'Call-B' | 'Put-B'>('Call-B');
  const [strike, setStrike] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [lots, setLots] = useState('');
  const [premium, setPremium] = useState(0);
  const [totalPremium, setTotalPremium] = useState(0);
  const [optionPin, setOptionPin] = useState('');
  const [genOptionPin, setGenOptionPin] = useState<number | null>(null);

  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(false);

  const showOptionsTab = optionLockState === 'open' || userRole === 'broker' || userRole === 'admin';
  const showShortTab = shortLockState === 'open' || userRole === 'broker' || userRole === 'admin';
  const isRoundZero = activeRound === 0;

  useEffect(() => {
    if (isRoundZero) {
      setIsBuy(true);
      setAssetType('stocks');
    }
  }, [isRoundZero]);

  useEffect(() => {
    if (assetType === 'options' && activeRound >= 1) {
      fetchOptionChain(activeRound).then(data => setStrikes(data.map(d => d.strike)));
    }
  }, [assetType, activeRound]);

  useEffect(() => {
    if (assetType === 'short') loadActiveShorts();
  }, [assetType, userName]);

  const loadActiveShorts = async () => {
    setLoadingShorts(true);
    try {
      const shorts = await getActiveShorts(userName);
      setActiveShortsList(shorts || []);
    } catch (e) { console.error(e); }
    finally { setLoadingShorts(false); }
  };

  useEffect(() => {
    if (assetType === 'options' && !isBuy && strike && lots && lotSize) {
      const type = optionType.includes('Call') ? 'call' : 'put';
      getOptionPremium(activeRound, parseFloat(strike), type).then(prem => {
        setPremium(prem);
        setTotalPremium(prem * parseInt(lots) * parseInt(lotSize));
      });
    }
  }, [strike, lots, lotSize, optionType, activeRound, assetType, isBuy]);

  useEffect(() => {
    if (assetType === 'short' && shortTicker && shortQty) {
      const stock = marketStocks.find(s => s.ticker === shortTicker);
      setShortValue(stock ? stock.price * parseInt(shortQty || '0') : 0);
    }
  }, [shortTicker, shortQty, marketStocks, assetType]);

  const getCurrentPrice = () => marketStocks.find(s => s.ticker === ticker)?.price || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (assetType === 'stocks') {
        if (isRoundZero) {
          if (!ticker || !qty) { alert("Select stock and enter quantity"); setLoading(false); return; }
          const res = await buyFromSystem(userName, ticker, parseInt(qty));
          if (res.success) {
            alert(`✅ PURCHASE SUCCESSFUL!\n\n${qty} shares of ${ticker}\nPrice: ₹${res.price?.toLocaleString('en-IN')}\nTotal: ₹${res.total?.toLocaleString('en-IN')}\n\nPIN: ${res.pin}`);
            setTicker(''); setQty('');
          } else alert(`❌ ${res.error || 'Error'}\n${res.message || ''}`);
        } else if (isBuy) {
          const res = await matchStockBuyOrder(userName, pin, ticker, parseInt(qty), parseFloat(price));
          if (res.success) {
            alert(`✅ Trade matched!\nPIN: ${pin}\nSeller: ${res.seller}`);
            setPin(''); setQty(''); setPrice(''); setTicker('');
          } else alert(`❌ ${res.error || 'Error'}\n${res.message || ''}`);
        } else {
          try {
            const generatedPin = await createStockSellOrder(userName, ticker, parseInt(qty), parseFloat(price));
            setGenPin(generatedPin);
            alert(`✅ Sell order created!\n\nYour PIN: ${generatedPin}\n\nShare with the buyer.`);
            setTicker(''); setQty(''); setPrice('');
          } catch (error: any) {
            alert(`❌ ${error.message}`);
          }
        }
      } else if (assetType === 'short') {
        if (shortAction === 'short') {
          if (!shortTicker || !shortQty) { alert("Select stock and enter quantity"); setLoading(false); return; }
          const res = await shortStock(userName, shortTicker, parseInt(shortQty));
          if (res.success) {
            alert(`✅ SHORT OPENED!\n\n${shortTicker}\nQty: ${shortQty}\nSell Rate: ₹${res.price?.toLocaleString('en-IN')}\nValue: ₹${res.value?.toLocaleString('en-IN')}\n\nPIN: ${res.pin}\n\nSave this PIN to square off.`);
            setShortTicker(''); setShortQty(''); setShortValue(0);
            loadActiveShorts();
          } else alert(`❌ ${res.error || 'Error'}\n${res.message || ''}`);
        } else {
          if (!shortPin || !shortQty || !shortTicker) { alert("Enter PIN, select stock, enter quantity"); setLoading(false); return; }
          const res = await coverStock(userName, shortTicker, shortPin, parseInt(shortQty));
          if (res.success) {
            const txt = res.profit >= 0 ? `Profit: ₹${res.profit?.toLocaleString('en-IN')}` : `Loss: ₹${Math.abs(res.profit)?.toLocaleString('en-IN')}`;
            alert(`✅ SQUARED OFF!\n\nCovered: ${res.coveredQty} shares\n${txt}`);
            setShortPin(''); setShortQty(''); setShortTicker(''); setShortValue(0);
            loadActiveShorts();
          } else alert(`❌ ${res.error || 'Error'}\n${res.message || ''}`);
        }
      } else {
        // Options
        if (isBuy) {
          const res = await matchOptionOrder(userName, true, optionPin, optionType, parseFloat(strike), parseInt(lotSize), parseInt(lots));
          if (res.success) {
            alert(`✅ Option matched!\nPIN: ${res.pin}`);
            setOptionPin(''); setStrike(''); setLots(''); setLotSize('');
          } else alert(`❌ ${res.error || 'Error'}\n${res.message || ''}`);
        } else {
          const res = await createOptionBuyOrder(userName, optionType, parseFloat(strike), parseInt(lotSize), parseInt(lots), premium);
          if (res.success) {
            setGenOptionPin(res.pin);
            alert(`✅ OPTION BUY ORDER CREATED!\n\nPIN: ${res.pin}\nPremium: ₹${res.premiumPaid?.toLocaleString('en-IN')}\n\nShare PIN with seller.`);
            setStrike(''); setLots(''); setLotSize('');
          } else alert(`❌ ${res.error || 'Error'}\n${res.message || ''}`);
        }
      }
    } catch (e: any) {
      alert(`❌ Error: ${e.message || 'Connection error'}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={20} /><span>Back</span>
      </button>

      <h1 className="text-4xl font-bold text-white mb-2">Trade</h1>
      <p className="text-gray-400 mb-8">{isRoundZero ? 'Round 0: Buy from system' : 'Execute trades'}</p>

      {/* Asset Tabs */}
      <div className="flex gap-0 border border-zinc-700 rounded-lg overflow-hidden mb-6 max-w-md">
        <button onClick={() => setAssetType('stocks')}
          className={`flex-1 py-3 text-sm font-semibold ${assetType === 'stocks' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
          Stocks
        </button>
        {showOptionsTab && (
          <button onClick={() => !isRoundZero && setAssetType('options')} disabled={isRoundZero}
            className={`flex-1 py-3 text-sm font-semibold ${assetType === 'options' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400'} ${isRoundZero ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}>
            Options
          </button>
        )}
        {showShortTab && (
          <button onClick={() => !isRoundZero && setAssetType('short')} disabled={isRoundZero}
            className={`flex-1 py-3 text-sm font-semibold ${assetType === 'short' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400'} ${isRoundZero ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}>
            Short
          </button>
        )}
      </div>

      {/* Buy/Sell Toggle */}
      {assetType === 'stocks' && !isRoundZero && (
        <div className="flex gap-0 border border-zinc-700 rounded-lg overflow-hidden mb-6 max-w-md">
          <button onClick={() => setIsBuy(true)}
            className={`flex-1 py-3 text-sm font-semibold ${isBuy ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
            Buy (Enter PIN)
          </button>
          <button onClick={() => setIsBuy(false)}
            className={`flex-1 py-3 text-sm font-semibold ${!isBuy ? 'bg-red-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
            Sell (Generate PIN)
          </button>
        </div>
      )}

      {assetType === 'options' && (
        <div className="flex gap-0 border border-zinc-700 rounded-lg overflow-hidden mb-6 max-w-md">
          <button onClick={() => setIsBuy(false)}
            className={`flex-1 py-3 text-sm font-semibold ${!isBuy ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
            Buy (Generate PIN)
          </button>
          <button onClick={() => setIsBuy(true)}
            className={`flex-1 py-3 text-sm font-semibold ${isBuy ? 'bg-red-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
            Sell (Enter PIN)
          </button>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          {assetType === 'stocks' ? (isRoundZero ? '💡 Buy at market price. No PIN required.' : isBuy ? '💡 Enter seller\'s PIN to buy.' : '💡 Generate PIN and share with buyer.')
            : assetType === 'short' ? (shortAction === 'short' ? '💡 Open short position. Get PIN to square off.' : '💡 Enter PIN to square off.')
            : (isBuy ? '💡 Enter buyer\'s PIN to sell.' : '💡 Pay premium, generate PIN for seller.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {/* STOCKS */}
        {assetType === 'stocks' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Stock</label>
              <select value={ticker} onChange={e => setTicker(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                <option value="">Select Stock</option>
                {marketStocks.filter(s => !['INDEX', 'GOLD', 'COPPER'].includes(s.ticker)).map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white" placeholder="Enter quantity" />
            </div>
            {!isRoundZero && (
              <div>
                <label className="block text-sm font-medium mb-2">Price (₹)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" min="0.01" required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white" placeholder="Enter price" />
              </div>
            )}
            {isBuy && !isRoundZero && (
              <div>
                <label className="block text-sm font-medium mb-2">Seller's PIN</label>
                <input value={pin} onChange={e => setPin(e.target.value)} maxLength={4} required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest" placeholder="PIN" />
              </div>
            )}
            {isRoundZero && ticker && qty && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Price:</span><span>₹{getCurrentPrice().toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-lg font-bold mt-2"><span className="text-gray-400">Total:</span><span className="text-green-500">₹{(getCurrentPrice() * parseInt(qty || '0')).toLocaleString('en-IN')}</span></div>
              </div>
            )}
            {!isBuy && genPin && (
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                <p className="text-green-500 text-sm mb-2">Your PIN:</p>
                <p className="text-white text-3xl font-bold tracking-widest">{genPin}</p>
              </div>
            )}
          </>
        )}

        {/* SHORT */}
        {assetType === 'short' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Action</label>
              <select value={shortAction} onChange={e => setShortAction(e.target.value as 'short' | 'square')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                <option value="short">Short</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stock</label>
              <select value={shortTicker} onChange={e => setShortTicker(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                <option value="">Select Stock</option>
                {marketStocks.filter(s => !['INDEX', 'GOLD', 'COPPER'].includes(s.ticker)).map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} - ₹{s.price?.toLocaleString('en-IN')}</option>
                ))}
              </select>
            </div>
            {shortAction === 'square' && (
              <div>
                <label className="block text-sm font-medium mb-2">PIN</label>
                <input value={shortPin} onChange={e => setShortPin(e.target.value)} maxLength={4} required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest" placeholder="PIN" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">No. of Shares</label>
              <input value={shortQty} onChange={e => setShortQty(e.target.value)} type="number" min="1" required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white" placeholder="Quantity" />
            </div>
            {shortTicker && shortQty && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Current Price:</span><span>₹{(marketStocks.find(s => s.ticker === shortTicker)?.price || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-lg font-bold mt-2"><span className="text-gray-400">Value:</span><span className={shortAction === 'short' ? 'text-red-500' : 'text-green-500'}>₹{shortValue.toLocaleString('en-IN')}</span></div>
              </div>
            )}
            {shortAction === 'square' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-400">Your Active Shorts</h4>
                  <button type="button" onClick={loadActiveShorts} className="p-1 hover:bg-zinc-800 rounded">
                    <RefreshCw size={14} className={`text-gray-400 ${loadingShorts ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {activeShortsList.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activeShortsList.map((s, i) => (
                      <div key={i} className="flex justify-between text-sm bg-zinc-800 rounded p-2">
                        <span className="text-white">{s.stock}</span>
                        <span className="text-gray-400">{s.qty} @ ₹{s.sellRate}</span>
                        <span className="text-yellow-500">PIN: {s.pin}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No active shorts</p>}
              </div>
            )}
          </>
        )}

        {/* OPTIONS */}
        {assetType === 'options' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select value={optionType} onChange={e => setOptionType(e.target.value as 'Call-B' | 'Put-B')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                <option value="Call-B">Call</option>
                <option value="Put-B">Put</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Strike Price</label>
              <select value={strike} onChange={e => setStrike(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                <option value="">Select Strike</option>
                {strikes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lot Size</label>
              <input value={lotSize} onChange={e => setLotSize(e.target.value)} type="number" min="1" required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white" placeholder="Lot size" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lots</label>
              <input value={lots} onChange={e => setLots(e.target.value)} type="number" min="1" required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white" placeholder="Lots" />
            </div>
            {isBuy && (
              <div>
                <label className="block text-sm font-medium mb-2">Buyer's PIN</label>
                <input value={optionPin} onChange={e => setOptionPin(e.target.value)} maxLength={4} required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest" placeholder="PIN" />
              </div>
            )}
            {!isBuy && lots && lotSize && strike && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Premium/unit:</span><span>₹{premium.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold mt-2"><span className="text-gray-400">Total Premium:</span><span className="text-green-500">₹{totalPremium.toLocaleString('en-IN')}</span></div>
              </div>
            )}
            {!isBuy && genOptionPin && (
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                <p className="text-green-500 text-sm mb-2">Your PIN:</p>
                <p className="text-white text-3xl font-bold tracking-widest">{genOptionPin}</p>
              </div>
            )}
          </>
        )}

        <button type="submit" disabled={loading}
          className={`w-full py-4 rounded-lg font-bold text-lg text-white ${loading ? 'bg-gray-600 cursor-not-allowed' 
            : assetType === 'short' ? (shortAction === 'short' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500')
            : isBuy ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {loading ? 'Processing...' : assetType === 'short' ? (shortAction === 'short' ? 'SHORT' : 'SQUARE OFF')
            : isRoundZero ? 'BUY FROM SYSTEM' : isBuy ? 'BUY' : 'SELL'}
        </button>
      </form>
    </div>
  );
}
