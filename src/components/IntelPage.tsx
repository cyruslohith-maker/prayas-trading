// @ts-nocheck
import { useState, useEffect } from 'react';
import { getAuctions, createAuction, placeBid } from '../lib/api';
import { ArrowLeft, Lock, Plus, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export function IntelPage({ onBack, userName, userRole, marketStocks }) {
  const [auctions, setAuctions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [setupModal, setSetupModal] = useState(null);
  const [setupRound, setSetupRound] = useState(1);
  const [setupSnippet, setSetupSnippet] = useState('');
  const [setupDuration, setSetupDuration] = useState('');
  const [setupBid, setSetupBid] = useState('');

  const isAdminOrBroker = userRole === 'admin' || userRole === 'broker';
  const displayStocks = (marketStocks || []).filter(s => s && s.ticker && !s.ticker.includes('GOLD') && !s.ticker.includes('COPPER'));

  useEffect(() => {
    loadAuctions();
    const interval = setInterval(loadAuctions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAuctions = async () => {
    setLoadingAuctions(true);
    try { setAuctions(await getAuctions() || []); }
    catch (e) { console.error('Error:', e); }
    finally { setLoadingAuctions(false); }
  };

  const handleCreateAuction = async () => {
    if (!setupModal || !setupSnippet || !setupDuration || !setupBid) { alert("Fill all fields"); return; }
    setLoading(true);
    try {
      const res = await createAuction(parseInt(setupRound), setupModal.ticker, setupSnippet, parseInt(setupDuration), parseFloat(setupBid));
      if (res.success) {
        alert("✅ Auction created!");
        setSetupModal(null); setSetupSnippet(''); setSetupDuration(''); setSetupBid('');
        loadAuctions();
      } else { alert("❌ Failed"); }
    } catch (e) { alert("❌ Error"); }
    finally { setLoading(false); }
  };

  const handlePlaceBid = async () => {
    if (!selectedStock || !bidAmount) { alert("Enter bid amount"); return; }
    setLoading(true);
    try {
      const res = await placeBid(`INTEL_${selectedStock.stock}`, userName, parseFloat(bidAmount));
      if (res.success) { alert("✅ Bid placed!"); setSelectedStock(null); setBidAmount(''); }
      else { alert("❌ Failed"); }
    } catch (e) { alert("❌ Error"); }
    finally { setLoading(false); }
  };

  const getAuctionStatus = (auction) => {
    if (!auction || !auction.time || !auction.duration) return 'closed';
    const elapsed = (Date.now() - new Date(auction.time).getTime()) / 1000 / 60;
    return elapsed < auction.duration ? 'live' : 'closed';
  };

  const getStockAuction = (ticker) => auctions.find(a => a.stock === ticker && getAuctionStatus(a) === 'live');

  const subtitles = { 'SUNPHARMA': 'Sun Pharma', 'SUN PHARMA': 'Sun Pharma', 'HDFCBANK': 'HDFC Bank', 'HDFC BANK': 'HDFC Bank', 'RELIANCE': 'Reliance Ind', 'TCS': 'TCS', 'INFY': 'Infosys', 'ICICIBANK': 'ICICI Bank', 'ICICI BANK': 'ICICI Bank', 'WIPRO': 'Wipro', 'ITC': 'ITC Ltd' };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={20} /><span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-white">Market Intelligence</h1>
        <button onClick={loadAuctions} disabled={loadingAuctions} className="p-2 hover:bg-zinc-800 rounded-lg">
          <RefreshCw size={20} className={`text-gray-400 ${loadingAuctions ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-gray-400 mb-8">{isAdminOrBroker ? 'Create and manage auctions' : 'Insider information auctions'}</p>

      {!isAdminOrBroker && (
        <div className="bg-green-600/10 border border-green-600 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-green-500 font-bold mb-3">How It Works</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Click glowing stock for insider info</li>
                <li>• Place blind bids</li>
                <li>• Highest bidder wins</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {displayStocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStocks.map((stock, i) => {
            const isPositive = (stock.change || 0) >= 0;
            const changePercent = ((stock.change || 0) * 100).toFixed(2);
            const auction = getStockAuction(stock.ticker);
            const hasLiveAuction = !!auction;
            const subtitle = subtitles[stock.ticker] || stock.ticker;
            
            return (
              <div key={i}
                onClick={() => { if (isAdminOrBroker) setSetupModal(stock); else if (hasLiveAuction) setSelectedStock(auction); }}
                className={`bg-zinc-900 border rounded-xl p-6 transition-all cursor-pointer ${
                  hasLiveAuction ? 'border-green-600 shadow-lg shadow-green-600/20 hover:bg-zinc-800' :
                  isAdminOrBroker ? 'border-zinc-700 hover:border-green-600 hover:bg-zinc-800' :
                  'border-zinc-800 opacity-50 cursor-not-allowed'
                }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white text-lg font-bold mb-1">{stock.ticker}</h3>
                    <p className="text-gray-500 text-sm">{subtitle}</p>
                  </div>
                  {hasLiveAuction ? (
                    <div className="p-2 bg-green-600/20 rounded-lg animate-pulse"><Lock size={16} className="text-green-500" /></div>
                  ) : isAdminOrBroker ? (
                    <div className="p-2 bg-zinc-800 rounded-lg"><Plus size={16} className="text-gray-400" /></div>
                  ) : null}
                </div>
                <div className="mb-3"><div className="text-white text-2xl font-bold">₹{Number(stock.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div></div>
                <div className={`flex items-center gap-1 text-sm font-semibold mb-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{isPositive ? '+' : ''}{changePercent}%</span>
                </div>
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
      ) : (
        <div className="text-center py-16 text-gray-500">Loading stocks...</div>
      )}

      {setupModal && isAdminOrBroker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{setupModal.ticker}</h3>
                <p className="text-gray-400 text-sm">Create Auction</p>
              </div>
              <button onClick={() => setSetupModal(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Round</label>
                <select value={setupRound} onChange={e => setSetupRound(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white">
                  {[1, 2, 3, 4].map(r => (<option key={r} value={r}>Round {r}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Information</label>
                <textarea value={setupSnippet} onChange={e => setSetupSnippet(e.target.value)} placeholder="Insider info..." rows={3} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white resize-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Duration (min)</label>
                <input type="number" value={setupDuration} onChange={e => setSetupDuration(e.target.value)} placeholder="30" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Starting Bid (₹)</label>
                <input type="number" value={setupBid} onChange={e => setSetupBid(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setSetupModal(null)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">Cancel</button>
                <button onClick={handleCreateAuction} disabled={loading} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold disabled:bg-gray-700">{loading ? 'Creating...' : 'Go Live'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => { setSelectedStock(null); setBidAmount(''); }} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="bg-black border border-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-xs mb-2 uppercase">Insider Info:</p>
              <p className="text-white text-sm">{selectedStock.snippet}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Minimum Bid</span>
                <span className="text-white font-bold">₹{selectedStock.startingBid}</span>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Your Bid (₹)</label>
              <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={`Min: ₹${selectedStock.startingBid}`} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSelectedStock(null); setBidAmount(''); }} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">Cancel</button>
              <button onClick={handlePlaceBid} disabled={loading} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold disabled:bg-gray-700">{loading ? 'Placing...' : 'Place Bid'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
