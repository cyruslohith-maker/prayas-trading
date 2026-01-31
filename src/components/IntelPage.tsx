// @ts-nocheck
import { useState, useEffect } from 'react';
import { getAuctions, createAuction, placeBid } from '../lib/api';
import { ArrowLeft, Lock, Plus, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export function IntelPage({ onBack, userName, userRole, marketStocks }) {
  const [auctions, setAuctions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Admin/Broker setup modal state
  const [setupModal, setSetupModal] = useState(null);
  const [setupRound, setSetupRound] = useState(1);
  const [setupSnippet, setSetupSnippet] = useState('');
  const [setupDuration, setSetupDuration] = useState('');
  const [setupBid, setSetupBid] = useState('');

  const isAdminOrBroker = userRole === 'admin' || userRole === 'broker';

  useEffect(() => {
    loadAuctions();
    const interval = setInterval(loadAuctions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAuctions = async () => {
    const data = await getAuctions();
    setAuctions(data || []);
  };

  const handleCreateAuction = async () => {
    if (!setupModal || !setupSnippet || !setupDuration || !setupBid) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await createAuction(
        parseInt(setupRound),
        setupModal.ticker,
        setupSnippet,
        parseInt(setupDuration),
        parseFloat(setupBid)
      );
      
      if (res.success) {
        alert("Auction created successfully!");
        setSetupModal(null);
        setSetupSnippet('');
        setSetupDuration('');
        setSetupBid('');
        loadAuctions();
      } else {
        alert("Failed to create auction");
      }
    } catch (e) {
      alert("Error creating auction");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedStock || !bidAmount) {
      alert("Please enter a bid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await placeBid(
        `INTEL_${selectedStock.stock}`,
        userName,
        parseFloat(bidAmount)
      );
      
      if (res.success) {
        alert("Bid placed successfully!");
        setSelectedStock(null);
        setBidAmount('');
      } else {
        alert("Failed to place bid");
      }
    } catch (e) {
      alert("Error placing bid");
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if auction is live or closed
  const getAuctionStatus = (auction) => {
    if (!auction.time || !auction.duration) return 'closed';
    
    const startTime = new Date(auction.time).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / 1000 / 60; // minutes
    
    return elapsed < auction.duration ? 'live' : 'closed';
  };

  // Get active auction for a stock
  const getStockAuction = (ticker) => {
    return auctions.find(a => a.stock === ticker && getAuctionStatus(a) === 'live');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <h1 className="text-4xl font-bold text-white mb-2">Market Intelligence</h1>
      <p className="text-gray-400 mb-8">
        {isAdminOrBroker ? 'Create and manage insider information auctions' : 'Exclusive insider information auctions'}
      </p>

      {/* How It Works (for users only) */}
      {!isAdminOrBroker && (
        <div className="bg-green-600/10 border border-green-600 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-green-500 font-bold mb-3">How It Works</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Click on a glowing stock to view available insider information</li>
                <li>• Place blind bids - you won't see other participants' bids</li>
                <li>• Your bid amount is locked until the auction closes</li>
                <li>• Highest bidder wins when the timer expires</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketStocks.map((stock, i) => {
          const isPositive = stock.change >= 0;
          const changePercent = (stock.change * 100).toFixed(2);
          const auction = getStockAuction(stock.ticker);
          const hasLiveAuction = !!auction;
          
          // Subtitles
          const subtitles = {
            'SUNPHARMA': 'Sun Pharma',
            'HDFCBANK': 'HDFC Bank',
            'RELIANCE': 'Reliance Ind',
            'TCS': 'TCS',
            'INFY': 'Infosys',
            'ICICIBANK': 'ICICI Bank',
            'WIPRO': 'Wipro',
            'ITC': 'ITC Ltd'
          };
          const subtitle = subtitles[stock.ticker] || stock.ticker;
          
          return (
            <div 
              key={i}
              onClick={() => {
                if (isAdminOrBroker) {
                  setSetupModal(stock);
                } else if (hasLiveAuction) {
                  setSelectedStock(auction);
                }
              }}
              className={`bg-zinc-900 border rounded-xl p-6 transition-all cursor-pointer ${
                hasLiveAuction
                  ? 'border-green-600 shadow-lg shadow-green-600/20 hover:bg-zinc-800 animate-pulse' 
                  : isAdminOrBroker
                  ? 'border-zinc-700 hover:border-green-600 hover:bg-zinc-800'
                  : 'border-zinc-800 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white text-lg font-bold mb-1">{stock.ticker}</h3>
                  <p className="text-gray-500 text-sm">{subtitle}</p>
                </div>
                {hasLiveAuction ? (
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Lock size={16} className="text-green-500" />
                  </div>
                ) : isAdminOrBroker ? (
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <Plus size={16} className="text-gray-400" />
                  </div>
                ) : null}
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="text-white text-2xl font-bold">
                  ₹{Number(stock.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Change */}
              <div className={`flex items-center gap-1 text-sm font-semibold mb-3 ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>{isPositive ? '+' : ''}{changePercent}%</span>
              </div>

              {/* Auction Status */}
              {hasLiveAuction && (
                <div className="bg-green-600/10 border border-green-600 rounded-lg p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-500 font-bold">LIVE AUCTION</span>
                    <span className="text-gray-400">Min: ₹{auction.startingBid}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin/Broker Setup Modal */}
      {setupModal && isAdminOrBroker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{setupModal.ticker}</h3>
                <p className="text-gray-400 text-sm">Create Insider Information Auction</p>
              </div>
              <button
                onClick={() => setSetupModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Round */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Round</label>
                <select
                  value={setupRound}
                  onChange={e => setSetupRound(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {[1, 2, 3, 4, 5].map(r => (
                    <option key={r} value={r}>Round {r}</option>
                  ))}
                </select>
              </div>

              {/* Snippet */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Information Snippet</label>
                <textarea
                  value={setupSnippet}
                  onChange={e => setSetupSnippet(e.target.value)}
                  placeholder="Enter a teaser about the insider information..."
                  rows={3}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Duration (Minutes)</label>
                <input
                  type="number"
                  value={setupDuration}
                  onChange={e => setSetupDuration(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Starting Bid */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Starting Bid (₹)</label>
                <input
                  type="number"
                  value={setupBid}
                  onChange={e => setSetupBid(e.target.value)}
                  placeholder="Minimum bid amount"
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSetupModal(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAuction}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    loading
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {loading ? 'Creating...' : 'Go Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Bid Modal */}
      {selectedStock && !isAdminOrBroker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedStock.stock}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500 text-sm font-semibold">LIVE AUCTION</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedStock(null); setBidAmount(''); }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Snippet */}
            <div className="bg-black border border-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Insider Information:</p>
              <p className="text-white text-sm">{selectedStock.snippet}</p>
            </div>

            {/* Starting Bid */}
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Minimum Bid</span>
                <span className="text-white font-bold">₹{selectedStock.startingBid}</span>
              </div>
            </div>

            {/* Bid Input */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Your Bid Amount (₹)</label>
              <input
                type="number"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder={`Min: ₹${selectedStock.startingBid}`}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <p className="text-gray-500 text-xs mt-2">
                This is a blind auction. Higher bids have better chances of winning.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedStock(null); setBidAmount(''); }}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBid}
                disabled={loading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  loading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {loading ? 'Placing...' : 'Place Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
