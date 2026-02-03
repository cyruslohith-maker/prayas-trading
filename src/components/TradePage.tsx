// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { 
  createStockSellOrder, 
  matchStockBuyOrder, 
  buyFromSystem,
  createOptionBuyOrder,
  matchOptionOrder,
  shortStock,
  coverStock,
  getActiveShorts,
  getUserBalance
} from '../lib/api';

export function TradePage({ onBack, userName, activeRound, marketStocks, optionLockState, shortLockState, userRole }) {
  const [assetType, setAssetType] = useState('stocks');
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBuy, setIsBuy] = useState(false);
  
  const [optionType, setOptionType] = useState('Call');
  const [strike, setStrike] = useState('');
  const [lotSize, setLotSize] = useState('50');
  const [lots, setLots] = useState('1');
  const [premium, setPremium] = useState('');
  
  const [shortAction, setShortAction] = useState('short');
  const [activeShorts, setActiveShorts] = useState([]);
  const [loadingShorts, setLoadingShorts] = useState(false);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [shortValue, setShortValue] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  
  const isAdminOrBroker = userRole === 'admin' || userRole === 'broker';
  const showOptionsTab = optionLockState === 'open' || isAdminOrBroker;
  const showShortTab = shortLockState === 'open' || isAdminOrBroker;
  
  const tradeableStocks = marketStocks.filter(s => 
    s.ticker && !['INDEX', 'GOLD', 'COPPER'].includes(s.ticker.toUpperCase())
  );
  
  useEffect(() => {
    const loadBalance = async () => {
      const bal = await getUserBalance(userName);
      setUserBalance(bal);
    };
    loadBalance();
  }, [userName]);
  
  useEffect(() => {
    if (assetType === 'short') loadActiveShorts();
  }, [assetType, userName]);
  
  useEffect(() => {
    if (assetType === 'short' && ticker && qty) {
      const stock = marketStocks.find(s => s.ticker === ticker);
      if (stock) setShortValue(parseFloat(qty) * stock.price);
    }
  }, [ticker, qty, marketStocks, assetType]);
  
  const loadActiveShorts = async () => {
    setLoadingShorts(true);
    try {
      const shorts = await getActiveShorts(userName);
      setActiveShorts(shorts || []);
    } catch (e) {
      console.error('Error loading shorts:', e);
    } finally {
      setLoadingShorts(false);
    }
  };
  
  const resetForm = () => {
    setTicker(''); setQty(''); setPrice(''); setPin('');
    setStrike(''); setLots('1'); setPremium(''); setGeneratedPin(null);
  };
  
  const handleStockTrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedPin(null);
    
    try {
      if (activeRound === 0) {
        const res = await buyFromSystem(userName, ticker, parseInt(qty));
        if (res.success) {
          setGeneratedPin(res.pin);
          alert(`✅ Trade executed!\n\nPIN: ${res.pin}\nStock: ${ticker}\nQty: ${qty}\nPrice: ₹${res.price}\nTotal: ₹${res.total?.toLocaleString('en-IN')}`);
          resetForm();
          const bal = await getUserBalance(userName);
          setUserBalance(bal);
        } else {
          alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Trade failed'}`);
        }
        setLoading(false);
        return;
      }
      
      if (!isBuy) {
        const generatedPin = await createStockSellOrder(userName, ticker, parseInt(qty), parseFloat(price));
        setGeneratedPin(generatedPin);
        alert(`✅ Sell order created!\n\nYour PIN: ${generatedPin}\n\nShare this PIN with the buyer.`);
      } else {
        const res = await matchStockBuyOrder(userName, pin, ticker, parseInt(qty), parseFloat(price));
        if (res.success) {
          alert(`✅ Trade executed!\n\nPIN: ${pin}\nStock: ${ticker}\nQty: ${qty}\nPrice: ₹${price}\nSeller: ${res.seller}`);
          resetForm();
          const bal = await getUserBalance(userName);
          setUserBalance(bal);
        } else {
          alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Trade failed'}`);
        }
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOptionTrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedPin(null);
    
    try {
      const trade = `${optionType} ${strike}`;
      const premiumValue = parseFloat(premium) || 0;
      
      if (!isBuy) {
        const res = await createOptionBuyOrder(userName, trade, parseFloat(strike), parseInt(lotSize), parseInt(lots), premiumValue);
        if (res.success) {
          setGeneratedPin(res.pin);
          alert(`✅ Option buy order created!\n\nYour PIN: ${res.pin}\nPremium Paid: ₹${res.premiumPaid?.toLocaleString('en-IN')}\n\nShare this PIN with the seller.`);
        } else {
          alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Failed'}`);
        }
      } else {
        const res = await matchOptionOrder(userName, true, pin, trade, parseFloat(strike), parseInt(lotSize), parseInt(lots));
        if (res.success) {
          alert(`✅ Option trade matched!\n\nPIN: ${pin}\n\nAwaiting broker verification.`);
          resetForm();
        } else {
          alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Failed'}`);
        }
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShortTrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedPin(null);
    
    try {
      if (shortAction === 'short') {
        const res = await shortStock(userName, ticker, parseInt(qty));
        if (res.success) {
          setGeneratedPin(res.pin);
          alert(`✅ Short position opened!\n\nPIN: ${res.pin}\nStock: ${ticker}\nQty: ${qty}\nSell Rate: ₹${res.price}\nValue: ₹${res.value?.toLocaleString('en-IN')}\n\nUse this PIN to square off later.`);
          resetForm();
          loadActiveShorts();
        } else {
          alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Failed'}`);
        }
      } else {
        const res = await coverStock(userName, ticker, pin, parseInt(qty));
        if (res.success) {
          const profitColor = res.profit >= 0 ? '🟢' : '🔴';
          alert(`✅ Position squared off!\n\n${profitColor} P&L: ₹${res.profit?.toLocaleString('en-IN')}\nQty: ${res.coveredQty}`);
          resetForm();
          loadActiveShorts();
          const bal = await getUserBalance(userName);
          setUserBalance(bal);
        } else {
          alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Failed'}`);
        }
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-lg">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Trade</h1>
          <p className="text-gray-400">Round {activeRound} • Balance: ₹{userBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      {/* Asset Type Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => { setAssetType('stocks'); resetForm(); }}
          className={`px-6 py-3 rounded-lg font-medium ${assetType === 'stocks' ? 'bg-green-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'}`}>
          Stocks
        </button>
        {showOptionsTab && (
          <button onClick={() => { setAssetType('options'); resetForm(); }}
            className={`px-6 py-3 rounded-lg font-medium ${assetType === 'options' ? 'bg-green-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'}`}>
            Options
          </button>
        )}
        {showShortTab && (
          <button onClick={() => { setAssetType('short'); resetForm(); }}
            className={`px-6 py-3 rounded-lg font-medium ${assetType === 'short' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'}`}>
            Short
          </button>
        )}
      </div>
      
      {/* STOCKS TAB */}
      {assetType === 'stocks' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          {activeRound === 0 ? (
            <>
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4 mb-6">
                <p className="text-blue-400 font-medium">📌 Round 0: Initial Portfolio Purchase</p>
                <p className="text-gray-400 text-sm mt-1">Buy stocks from the system at current prices.</p>
              </div>
              
              <form onSubmit={handleStockTrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Stock</label>
                  <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required>
                    <option value="">Select Stock</option>
                    {tradeableStocks.map(s => (
                      <option key={s.ticker} value={s.ticker}>{s.ticker} — ₹{s.price?.toLocaleString('en-IN')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                  <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Enter quantity" min="1" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg">
                  {loading ? 'Processing...' : 'Buy from System'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                <button onClick={() => { setIsBuy(false); setGeneratedPin(null); }}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium ${!isBuy ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400'}`}>
                  Sell (Generate PIN)
                </button>
                <button onClick={() => { setIsBuy(true); setGeneratedPin(null); }}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium ${isBuy ? 'bg-green-600 text-white' : 'bg-zinc-800 text-gray-400'}`}>
                  Buy (Enter PIN)
                </button>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400">
                  {isBuy ? '💡 Enter seller\'s PIN to complete purchase.' : '💡 Generate PIN and share with buyer.'}
                </p>
              </div>
              
              <form onSubmit={handleStockTrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Stock</label>
                  <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required>
                    <option value="">Select Stock</option>
                    {tradeableStocks.map(s => (
                      <option key={s.ticker} value={s.ticker}>{s.ticker} — ₹{s.price?.toLocaleString('en-IN')}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                    <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Price (₹)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} step="0.01" min="0.01" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
                  </div>
                </div>
                
                {isBuy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Seller's PIN</label>
                    <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={4} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest" required />
                  </div>
                )}
                
                {generatedPin && !isBuy && (
                  <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                    <p className="text-green-400 text-sm mb-1">Your PIN:</p>
                    <p className="text-green-500 text-3xl font-bold tracking-widest">{generatedPin}</p>
                    <p className="text-gray-400 text-xs mt-2">Share with buyer</p>
                  </div>
                )}
                
                <button type="submit" disabled={loading} className={`w-full font-bold py-4 px-6 rounded-lg ${isBuy ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white disabled:bg-gray-700`}>
                  {loading ? 'Processing...' : (isBuy ? 'Buy Stock' : 'Sell Stock')}
                </button>
              </form>
            </>
          )}
        </div>
      )}
      
      {/* OPTIONS TAB */}
      {assetType === 'options' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setIsBuy(false); setGeneratedPin(null); }}
              className={`flex-1 px-6 py-3 rounded-lg font-medium ${!isBuy ? 'bg-green-600 text-white' : 'bg-zinc-800 text-gray-400'}`}>
              Buy (Generate PIN)
            </button>
            <button onClick={() => { setIsBuy(true); setGeneratedPin(null); }}
              className={`flex-1 px-6 py-3 rounded-lg font-medium ${isBuy ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400'}`}>
              Sell (Enter PIN)
            </button>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">
              {!isBuy ? '💡 Buyer pays premium and generates PIN.' : '💡 Seller enters buyer\'s PIN.'}
            </p>
          </div>
          
          <form onSubmit={handleOptionTrade} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                <select value={optionType} onChange={(e) => setOptionType(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white">
                  <option value="Call">Call</option>
                  <option value="Put">Put</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Strike Price</label>
                <input type="number" value={strike} onChange={(e) => setStrike(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Lot Size</label>
                <input type="number" value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Lots</label>
                <input type="number" value={lots} onChange={(e) => setLots(e.target.value)} min="1" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Premium (₹)</label>
                <input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} step="0.01" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
              </div>
            </div>
            
            {isBuy && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Buyer's PIN</label>
                <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={4} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest" required />
              </div>
            )}
            
            {generatedPin && !isBuy && (
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                <p className="text-green-400 text-sm mb-1">Your PIN:</p>
                <p className="text-green-500 text-3xl font-bold tracking-widest">{generatedPin}</p>
              </div>
            )}
            
            <button type="submit" disabled={loading} className={`w-full font-bold py-4 px-6 rounded-lg ${!isBuy ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white disabled:bg-gray-700`}>
              {loading ? 'Processing...' : (!isBuy ? 'Buy Option' : 'Sell Option')}
            </button>
          </form>
        </div>
      )}
      
      {/* SHORT TAB */}
      {assetType === 'short' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex gap-2 mb-6">
              <button onClick={() => { setShortAction('short'); setGeneratedPin(null); setPin(''); }}
                className={`flex-1 px-6 py-3 rounded-lg font-medium ${shortAction === 'short' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400'}`}>
                Short (Open)
              </button>
              <button onClick={() => { setShortAction('square'); setGeneratedPin(null); }}
                className={`flex-1 px-6 py-3 rounded-lg font-medium ${shortAction === 'square' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-gray-400'}`}>
                Square Off (Close)
              </button>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">
                {shortAction === 'short' ? '💡 Short to profit from price drop. Max: 3x cash.' : '💡 Enter PIN to square off.'}
              </p>
            </div>
            
            <form onSubmit={handleShortTrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Stock</label>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required>
                  <option value="">Select Stock</option>
                  {tradeableStocks.map(s => (
                    <option key={s.ticker} value={s.ticker}>{s.ticker} — ₹{s.price?.toLocaleString('en-IN')}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
              </div>
              
              {shortAction === 'short' && shortValue > 0 && (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Estimated Value:</span>
                    <span className="text-white font-bold">₹{shortValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Max Allowed (3x):</span>
                    <span className="text-yellow-500 font-bold">₹{(userBalance * 3).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              
              {shortAction === 'square' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Short PIN</label>
                  <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN from short trade" maxLength={4} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest" required />
                </div>
              )}
              
              {generatedPin && shortAction === 'short' && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
                  <p className="text-red-400 text-sm mb-1">Your Short PIN:</p>
                  <p className="text-red-500 text-3xl font-bold tracking-widest">{generatedPin}</p>
                  <p className="text-gray-400 text-xs mt-2">Save to square off</p>
                </div>
              )}
              
              <button type="submit" disabled={loading} className={`w-full font-bold py-4 px-6 rounded-lg ${shortAction === 'short' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white disabled:bg-gray-700`}>
                {loading ? 'Processing...' : (shortAction === 'short' ? 'Open Short' : 'Square Off')}
              </button>
            </form>
          </div>
          
          {/* Active Shorts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Active Shorts</h3>
              <button onClick={loadActiveShorts} disabled={loadingShorts} className="p-2 hover:bg-zinc-800 rounded-lg">
                <RefreshCw size={16} className={`text-gray-400 ${loadingShorts ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {activeShorts.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-zinc-800">
                    <th className="text-left py-2">Stock</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Sell Rate</th>
                    <th className="text-right py-2">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {activeShorts.map((s, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-3 text-white font-medium">{s.stock}</td>
                      <td className="py-3 text-right text-white">{s.qty}</td>
                      <td className="py-3 text-right text-red-500">₹{s.sellRate?.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-yellow-500 font-mono">{s.pin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-8">{loadingShorts ? 'Loading...' : 'No active shorts'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
