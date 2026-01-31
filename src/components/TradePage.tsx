// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { 
  createStockSellOrder, 
  matchStockBuyOrder,
  createOptionBuyOrder,
  createOptionSellOrder,
  matchOptionOrder,
  fetchOptionChain,
  getOptionPremium
} from '../lib/api';

export function TradePage({ onBack, userName, activeRound, marketStocks, optionLockState, userRole }) {
  const [assetType, setAssetType] = useState<'stocks' | 'options'>('stocks');
  const [isBuy, setIsBuy] = useState(false);
  
  // Stock fields
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [pin, setPin] = useState('');
  const [genPin, setGenPin] = useState<number | null>(null);
  
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
  
  // Check if options should be visible
  const showOptionsTab = optionLockState === 'open' || userRole === 'broker' || userRole === 'admin';
  
  // Load strikes for current round
  useEffect(() => {
    if (assetType === 'options' && activeRound) {
      const loadStrikes = async () => {
        const data = await fetchOptionChain(activeRound);
        setStrikes(data.map(d => d.strike));
      };
      loadStrikes();
    }
  }, [assetType, activeRound]);
  
  // Calculate premium when fields change (for option buyers generating PIN)
  useEffect(() => {
    if (assetType === 'options' && !isBuy && strike && lots && lotSize) {
      const fetchPrem = async () => {
        const type = optionType.includes('Call') ? 'call' : 'put';
        const prem = await getOptionPremium(activeRound, parseFloat(strike), type);
        setPremium(prem);
        setTotalPremium(prem * parseInt(lots) * parseInt(lotSize));
      };
      fetchPrem();
    }
  }, [strike, lots, lotSize, optionType, activeRound, assetType, isBuy]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (assetType === 'stocks') {
        // STOCK TRADING
        if (isBuy) {
          // Buy stocks (match with seller's PIN)
          const res = await matchStockBuyOrder(userName, pin, ticker, parseFloat(qty), parseFloat(price));
          if (res.success) {
            alert("✅ Trade matched successfully! Pending broker verification.");
            setPin('');
            setQty('');
            setPrice('');
            setTicker('');
          } else if (res.error === 'INSUFFICIENT_CAPITAL') {
            alert(`❌ INSUFFICIENT CAPITAL\n\n${res.message}`);
          } else if (res.error === 'PIN_MISMATCH') {
            alert(`❌ INVALID PIN\n\n${res.message}`);
          } else {
            alert(res.message || "Invalid PIN or trade details don't match");
          }
        } else {
          // Sell stocks (generate PIN)
          try {
            const generatedPin = await createStockSellOrder(userName, ticker, parseFloat(qty), parseFloat(price));
            setGenPin(generatedPin);
            alert(`✅ Sell order created!\n\nYour PIN: ${generatedPin}\n\nShare this PIN with the buyer.`);
            setTicker('');
            setQty('');
            setPrice('');
          } catch (error) {
            alert(`❌ CANNOT CREATE SELL ORDER\n\n${error.message}`);
          }
        }
      } else {
        // OPTION TRADING
        if (isBuy) {
          // SELLER: Match option (enter buyer's PIN)
          const res = await matchOptionOrder(
            userName, 
            true, // isSeller = true
            optionPin, 
            optionType, 
            parseFloat(strike), 
            parseInt(lotSize), 
            parseInt(lots)
          );
          if (res.success) {
            alert("✅ Option trade matched successfully! Pending broker verification.");
            setOptionPin('');
            setStrike('');
            setLots('');
            setLotSize('');
          } else if (res.error === 'PIN_MISMATCH') {
            alert(`❌ INVALID PIN\n\n${res.message}`);
          } else {
            alert(res.message || "Failed to match option trade");
          }
        } else {
          // BUYER: Create option buy order (generate PIN, pay premium)
          const res = await createOptionBuyOrder(
            userName,
            optionType,
            parseFloat(strike),
            parseInt(lotSize),
            parseInt(lots),
            premium
          );
          if (res.success) {
            setGenOptionPin(res.pin);
            alert(`✅ OPTION BUY ORDER CREATED!\n\nYour PIN: ${res.pin}\n\nPremium paid: ₹${res.premiumPaid.toLocaleString('en-IN')}\n\nShare this PIN with the seller.`);
            setStrike('');
            setLots('');
            setLotSize('');
          } else if (res.error === 'INSUFFICIENT_CAPITAL') {
            alert(`❌ INSUFFICIENT CAPITAL\n\n${res.message}`);
          } else {
            alert("Failed to create option buy order");
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-black text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Trade</h1>
      </div>
      
      {/* Asset Type Tabs */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => {
            setAssetType('stocks');
            setGenPin(null);
            setGenOptionPin(null);
          }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            assetType === 'stocks' 
              ? 'bg-green-600 text-white' 
              : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
          }`}
        >
          Stocks
        </button>
        {showOptionsTab && (
          <button 
            onClick={() => {
              setAssetType('options');
              setGenPin(null);
              setGenOptionPin(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              assetType === 'options' 
                ? 'bg-green-600 text-white' 
                : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
            }`}
          >
            Options
          </button>
        )}
      </div>
      
      {/* Buy/Sell Toggle */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => {
            setIsBuy(false);
            setGenPin(null);
            setGenOptionPin(null);
          }}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            !isBuy 
              ? (assetType === 'stocks' ? 'bg-red-600' : 'bg-green-600') + ' text-white' 
              : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
          }`}
        >
          {assetType === 'stocks' ? 'Sell (Generate PIN)' : 'Buy (Generate PIN)'}
        </button>
        <button 
          onClick={() => {
            setIsBuy(true);
            setGenPin(null);
            setGenOptionPin(null);
          }}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            isBuy 
              ? (assetType === 'stocks' ? 'bg-green-600' : 'bg-red-600') + ' text-white' 
              : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
          }`}
        >
          {assetType === 'stocks' ? 'Buy (Enter PIN)' : 'Sell (Enter PIN)'}
        </button>
      </div>
      
      {/* Info Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          {assetType === 'stocks' ? (
            isBuy 
              ? '💡 Enter the seller\'s PIN to complete the purchase.'
              : '💡 Enter details and generate a PIN. Share it with the buyer.'
          ) : (
            isBuy
              ? '💡 Enter the buyer\'s PIN to complete the sale.'
              : '💡 Enter details and pay premium to generate a PIN. Share it with the seller.'
          )}
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {assetType === 'stocks' ? (
          // STOCK FORM
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Symbol</label>
              <select
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              >
                <option value="">Select Stock</option>
                {marketStocks
                  .filter(s => !['INDEX', 'GOLD', 'COPPER'].includes(s.ticker))
                  .map(s => (
                    <option key={s.ticker} value={s.ticker}>{s.ticker}</option>
                  ))
                }
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input 
                value={qty} 
                onChange={(e) => setQty(e.target.value)}
                placeholder="Enter quantity"
                type="number"
                min="1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Price per Share (₹)</label>
              <input 
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                type="number"
                step="0.01"
                min="0.01"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              />
            </div>
            
            {isBuy && (
              <div>
                <label className="block text-sm font-medium mb-2">Seller's PIN</label>
                <input 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN from seller"
                  type="text"
                  maxLength="4"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest"
                  required
                />
              </div>
            )}
            
            {!isBuy && qty && price && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Estimated Value:</div>
                <div className="text-2xl font-bold text-blue-400">
                  ₹{(parseFloat(qty || 0) * parseFloat(price || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            )}
            
            {genPin && !isBuy && (
              <div className="bg-green-600 border-2 border-green-400 rounded-lg p-6 text-center animate-pulse">
                <div className="text-sm font-medium mb-2">YOUR PIN</div>
                <div className="text-4xl font-bold tracking-widest">{genPin}</div>
                <div className="text-sm mt-2 opacity-90">Share this with the buyer</div>
              </div>
            )}
          </div>
        ) : (
          // OPTION FORM
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Option Type</label>
              <select 
                value={optionType} 
                onChange={(e) => setOptionType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
              >
                <option value="Call-B">Call</option>
                <option value="Put-B">Put</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Strike Price</label>
              <select 
                value={strike} 
                onChange={(e) => setStrike(e.target.value)} 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              >
                <option value="">Select Strike</option>
                {strikes.map(s => (
                  <option key={s} value={s}>{Number(s).toFixed(2)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Lot Size</label>
              <input 
                value={lotSize} 
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="Enter lot size (e.g., 50)"
                type="number"
                min="1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Number of Lots</label>
              <input 
                value={lots} 
                onChange={(e) => setLots(e.target.value)}
                placeholder="Enter number of lots"
                type="number"
                min="1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              />
            </div>
            
            {!isBuy && totalPremium > 0 && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Premium per lot:</span>
                  <span className="font-medium">₹{premium.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Lot size:</span>
                  <span className="font-medium">{lotSize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Number of lots:</span>
                  <span className="font-medium">{lots}</span>
                </div>
                <div className="border-t border-blue-700 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Premium to Pay:</span>
                    <span className="text-2xl font-bold text-blue-400">
                      ₹{totalPremium.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {isBuy && (
              <div>
                <label className="block text-sm font-medium mb-2">Buyer's PIN</label>
                <input 
                  value={optionPin} 
                  onChange={(e) => setOptionPin(e.target.value)}
                  placeholder="Enter 4-digit PIN from buyer"
                  type="text"
                  maxLength="4"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest"
                  required
                />
              </div>
            )}
            
            {genOptionPin && !isBuy && (
              <div className="bg-green-600 border-2 border-green-400 rounded-lg p-6 text-center animate-pulse">
                <div className="text-sm font-medium mb-2">YOUR PIN</div>
                <div className="text-4xl font-bold tracking-widest">{genOptionPin}</div>
                <div className="text-sm mt-2 opacity-90">Share this with the seller</div>
              </div>
            )}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors"
        >
          {loading ? 'Processing...' : (
            assetType === 'stocks'
              ? (isBuy ? 'Match Buy Order' : 'Create Sell Order')
              : (isBuy ? 'Match Sell Order' : 'Create Buy Order & Pay Premium')
          )}
        </button>
      </form>
    </div>
  );
}