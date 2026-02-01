// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { 
  createStockSellOrder, 
  matchStockBuyOrder,
  buyFromSystem,
  createOptionBuyOrder,
  createOptionSellOrder,
  matchOptionOrder,
  fetchOptionChain,
  getOptionPremium
} from '../lib/api';

// Session storage for form state persistence
const FORM_STATE_KEY = 'mockstock_tradeFormState';

export function TradePage({ onBack, userName, activeRound, marketStocks, optionLockState, userRole }) {
  const [assetType, setAssetType] = useState<'stocks' | 'options'>('stocks');
  const [isBuy, setIsBuy] = useState(activeRound === 0 ? true : false); // Default to buy for Round 0
  
  // Stock fields - with persistence
  const [ticker, setTicker] = useState(() => {
    const saved = sessionStorage.getItem(FORM_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.ticker || '';
    }
    return '';
  });
  const [qty, setQty] = useState(() => {
    const saved = sessionStorage.getItem(FORM_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.qty || '';
    }
    return '';
  });
  const [price, setPrice] = useState(() => {
    const saved = sessionStorage.getItem(FORM_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.price || '';
    }
    return '';
  });
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
  
  // Round 0 specific: Only allow buying from system
  const isRoundZero = activeRound === 0;
  
  // Persist form state
  useEffect(() => {
    const formState = { ticker, qty, price };
    sessionStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
  }, [ticker, qty, price]);

  // Force buy mode and stocks for Round 0
  useEffect(() => {
    if (isRoundZero) {
      setIsBuy(true);
      setAssetType('stocks');
    }
  }, [isRoundZero]);
  
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

  // Get current price for selected stock (for Round 0)
  const getCurrentPrice = () => {
    const stock = marketStocks.find(s => s.ticker === ticker);
    return stock ? stock.price : 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (assetType === 'stocks') {
        // STOCK TRADING
        
        if (isRoundZero) {
          // ROUND 0: Buy from system (no PIN, no seller)
          const currentPrice = getCurrentPrice();
          if (!ticker || !qty) {
            alert("Please select a stock and enter quantity");
            setLoading(false);
            return;
          }
          
          const res = await buyFromSystem(userName, ticker, parseInt(qty));
          if (res.success) {
            const totalValue = currentPrice * parseInt(qty);
            alert(`✅ PURCHASE SUCCESSFUL!\n\nYou bought ${qty} shares of ${ticker}\nat ₹${currentPrice.toLocaleString('en-IN')} per share\n\nTotal: ₹${totalValue.toLocaleString('en-IN')}`);
            setTicker('');
            setQty('');
          } else if (res.error === 'INSUFFICIENT_CAPITAL') {
            alert(`❌ INSUFFICIENT CAPITAL\n\n${res.message}`);
          } else {
            alert(res.message || "Failed to complete purchase");
          }
        } else if (isBuy) {
          // ROUND 1+: Buy stocks (match with seller's PIN) - Direct to broker sheet
          const res = await matchStockBuyOrder(userName, pin, ticker, parseFloat(qty), parseFloat(price));
          
          if (res.success) {
            // Show immediate success for perceived speed
            alert("✅ Trade matched successfully! Stocks allocated.");
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
          // ROUND 1+: Sell stocks (generate PIN)
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
        // OPTION TRADING (unchanged - requires broker verification)
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

      {/* Round 0 Banner */}
      {isRoundZero && (
        <div className="bg-yellow-600/10 border border-yellow-600 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-500 font-bold mb-1">🏁 Round 0: Initial Portfolio</h3>
          <p className="text-gray-300 text-sm">
            Buy stocks from the system at current market prices. No PIN required, no P2P trading.
          </p>
        </div>
      )}
      
      {/* Asset Type Tabs - Disabled options for Round 0 */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => {
            if (!isRoundZero) {
              setAssetType('stocks');
              setGenPin(null);
              setGenOptionPin(null);
            }
          }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            assetType === 'stocks' 
              ? 'bg-green-600 text-white' 
              : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
          }`}
        >
          Stocks
        </button>
        {showOptionsTab && !isRoundZero && (
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
      
      {/* Buy/Sell Toggle - For Round 0, only Buy is available */}
      {!isRoundZero && (
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
      )}

      {/* Round 0 Buy Only Indicator */}
      {isRoundZero && (
        <div className="flex gap-2 mb-6">
          <div className="flex-1 px-6 py-3 rounded-lg font-medium bg-green-600 text-white text-center">
            Buy from System
          </div>
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          {isRoundZero ? (
            '💡 Select a stock and quantity to buy from the system at current market price.'
          ) : assetType === 'stocks' ? (
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
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} {isRoundZero ? `- ₹${s.price.toLocaleString('en-IN')}` : ''}
                    </option>
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
            
            {/* Price field - NOT shown for Round 0 */}
            {!isRoundZero && (
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
            )}

            {/* Show calculated total for Round 0 */}
            {isRoundZero && ticker && qty && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price per share:</span>
                  <span className="text-white">₹{getCurrentPrice().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white">{qty}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-700">
                  <span className="text-gray-400 font-semibold">Total:</span>
                  <span className="text-green-500 font-bold">
                    ₹{(getCurrentPrice() * parseInt(qty || '0')).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
            
            {/* PIN field - NOT shown for Round 0 */}
            {!isRoundZero && isBuy && (
              <div>
                <label className="block text-sm font-medium mb-2">Seller's PIN</label>
                <input 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN from seller"
                  type="text"
                  maxLength={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest"
                  required
                />
              </div>
            )}
            
            {/* Show calculated total for Round 1+ */}
            {!isRoundZero && !isBuy && qty && price && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-white font-bold">
                    ₹{(parseFloat(qty) * parseFloat(price)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
            
            {/* Generated PIN display */}
            {genPin && !isRoundZero && (
              <div className="bg-green-600/10 border border-green-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm mb-2">Your PIN (share with buyer):</p>
                <p className="text-green-500 text-4xl font-bold tracking-widest">{genPin}</p>
              </div>
            )}
          </div>
        ) : (
          // OPTION FORM (unchanged)
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Option Type</label>
              <select
                value={optionType}
                onChange={(e) => setOptionType(e.target.value as 'Call-B' | 'Put-B')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                required
              >
                <option value="Call-B">Call Option (Bullish)</option>
                <option value="Put-B">Put Option (Bearish)</option>
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
                  <option key={s} value={s}>₹{s.toLocaleString('en-IN')}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Lot Size</label>
              <input 
                value={lotSize} 
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="Enter lot size"
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
            
            {isBuy && (
              <div>
                <label className="block text-sm font-medium mb-2">Buyer's PIN</label>
                <input 
                  value={optionPin} 
                  onChange={(e) => setOptionPin(e.target.value)}
                  placeholder="Enter PIN from buyer"
                  type="text"
                  maxLength={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest"
                  required
                />
              </div>
            )}
            
            {!isBuy && premium > 0 && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Premium per unit:</span>
                  <span className="text-white">₹{premium.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Premium:</span>
                  <span className="text-yellow-500 font-bold">
                    ₹{totalPremium.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
            
            {genOptionPin && (
              <div className="bg-green-600/10 border border-green-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm mb-2">Your PIN (share with seller):</p>
                <p className="text-green-500 text-4xl font-bold tracking-widest">{genOptionPin}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            loading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : isRoundZero
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : isBuy
                  ? (assetType === 'stocks' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500') + ' text-white'
                  : (assetType === 'stocks' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500') + ' text-white'
          }`}
        >
          {loading ? 'Processing...' : (
            isRoundZero 
              ? 'Buy from System'
              : assetType === 'stocks'
                ? (isBuy ? 'Buy Stock' : 'Generate Sell PIN')
                : (isBuy ? 'Sell Option' : 'Generate Buy PIN')
          )}
        </button>
      </form>
    </div>
  );
}
