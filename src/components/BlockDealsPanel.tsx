// @ts-nocheck
import { useState, useEffect } from 'react';
import { floatTradeAction, fetchMarketPrices } from '../lib/api';
import { Plus } from 'lucide-react';



export function BlockDealsPanel({ onBack }) {
  const [tab, setTab] = useState('place'); // 'place' | 'history'
  
  // Form state
  const [ticker, setTicker] = useState('');
  const [action, setAction] = useState('buy'); // 'buy' | 'sell'
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [changePercent, setChangePercent] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Market data
  const [marketStocks, setMarketStocks] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);

  useEffect(() => {
    fetchMarketPrices().then(setMarketStocks);
    // TODO: Fetch recent block trades history
  }, []);

  const handlePlaceTrade = async () => {
    if (!ticker || !qty || !price) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await floatTrade(
        ticker,
        parseInt(qty),
        parseFloat(price),
        action === 'buy',
        parseFloat(changePercent) || 0
      );
      
      if (res.success) {
        alert("Block trade placed successfully!");
        setTicker('');
        setQty('');
        setPrice('');
        setChangePercent('');
      } else {
        alert("Failed to place block trade");
      }
    } catch (e) {
      console.error(e);
      alert("Error placing block trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-8">Broker Operations</h1>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-b border-zinc-800">
          <button
            onClick={() => setTab('place')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'place'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Block Trades
          </button>
          <button
            onClick={() => setTab('options')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'options'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Options Trading
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'history'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Trade History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Place Block Trade */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Plus size={20} className="text-green-500" />
              <h2 className="text-xl font-bold text-white">Place Block Trade</h2>
            </div>

            {/* Asset Selection */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Asset</label>
              <select
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select stock or commodity</option>
                {marketStocks.map((s, i) => (
                  <option key={i} value={s.ticker}>
                    {s.ticker} — ₹{s.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Toggle */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Action</label>
              <div className="flex gap-0 border border-zinc-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setAction('buy')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${
                    action === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setAction('sell')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${
                    action === 'sell'
                      ? 'bg-green-600 text-white'
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Quantity</label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="Enter quantity"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Price */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Price per unit (₹)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Enter price"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Change Percent (Optional) */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">
                Price Impact (%)
                <span className="text-gray-600 ml-2">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={changePercent}
                onChange={e => setChangePercent(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-gray-600 text-xs mt-2">
                Expected price movement percentage after this trade
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePlaceTrade}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-semibold transition-all ${
                loading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-black'
              }`}
            >
              {loading ? 'Processing...' : 'Place Block Trade'}
            </button>
          </div>

          {/* Right: Recent Block Trades */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Recent Block Trades</h2>

            {recentTrades.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                No block trades placed yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentTrades.map((trade, i) => (
                  <div key={i} className="bg-black border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{trade.ticker}</span>
                      <span className={`text-sm font-bold ${
                        trade.action === 'BUY' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trade.action}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{trade.qty} @ ₹{trade.price}</span>
                      <span>{trade.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
