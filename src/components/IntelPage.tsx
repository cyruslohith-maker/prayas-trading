// @ts-nocheck
import { ArrowLeft, Gavel, Timer, AlertCircle, Loader2, UserCog, Plus, X, Megaphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAuctions, placeBid, getAuctionBids, createAuction } from '../lib/api';

export function IntelPage({ onBack, userName, userRole }) {
  // Data State
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bids, setBids] = useState([]);
  
  // Interaction State
  const [bidAmount, setBidAmount] = useState('');
  const [proxyTeam, setProxyTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  // Admin Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAuctionStock, setNewAuctionStock] = useState('');
  const [newAuctionSnippet, setNewAuctionSnippet] = useState('');
  const [newAuctionBid, setNewAuctionBid] = useState('');
  const [newAuctionDuration, setNewAuctionDuration] = useState('5');
  const [creating, setCreating] = useState(false);

  const isPrivileged = userRole === 'admin' || userRole === 'broker';

  // --- POLL DATA ---
  useEffect(() => {
    const loadAuctions = async () => {
      // Only show loading spinner on initial load
      if (auctions.length === 0) setLoading(true);
      try {
        const data = await getAuctions();
        setAuctions(data || []);
      } catch (e) {
        console.error("Failed to load auctions", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuctions();
    const interval = setInterval(loadAuctions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedAuction) return;
    const loadBids = async () => {
      try {
        const data = await getAuctionBids(selectedAuction.id);
        setBids(data || []);
      } catch (e) { console.error("Failed to load bids", e); }
    };
    loadBids();
    const interval = setInterval(loadBids, 3000);
    return () => clearInterval(interval);
  }, [selectedAuction]);

  // --- HANDLERS ---

  const handleCreateAuction = async () => {
    if (!newAuctionStock || !newAuctionSnippet || !newAuctionBid) {
      alert("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      // Create auction (defaulting to Round 1 since round isn't passed here, can be enhanced)
      const res = await createAuction(1, newAuctionStock.toUpperCase(), newAuctionSnippet, parseInt(newAuctionDuration), parseFloat(newAuctionBid));
      
      if (res.success) {
        alert("Auction Live!");
        setShowCreateModal(false);
        setNewAuctionStock('');
        setNewAuctionSnippet('');
        setNewAuctionBid('');
        // Reload auctions immediately
        const data = await getAuctions();
        setAuctions(data || []);
      } else {
        alert("Failed to create auction: " + (res.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error creating auction. Check console.");
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handlePlaceBid = async () => {
    const actualBidder = isPrivileged && proxyTeam ? proxyTeam : userName;
    
    if (!bidAmount || !selectedAuction) return;
    
    if (isPrivileged && !proxyTeam) {
      alert("Broker/Admin must specify a Team Name for proxy bidding.");
      return;
    }

    const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : selectedAuction.startingBid;
    
    if (parseFloat(bidAmount) <= highestBid) {
      alert(`Bid must be higher than current highest: ₹${highestBid}`);
      return;
    }

    setPlacingBid(true);
    try {
      const res = await placeBid(selectedAuction.id, actualBidder, parseFloat(bidAmount));
      if (res.success) {
        setBidAmount('');
        if (isPrivileged) setProxyTeam('');
        // Optimistic update
        setBids(prev => [{ 
          bidder: actualBidder, 
          amount: parseFloat(bidAmount), 
          time: new Date().toISOString() 
        }, ...prev]);
      } else {
        alert("Failed to place bid: " + (res.error || "Unknown error"));
      }
    } catch (e) { 
      alert("Error placing bid"); 
      console.error(e);
    } finally { 
      setPlacingBid(false); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 hover:border-green-500 transition-all">
            <ArrowLeft className="text-white" size={28} />
          </button>
          <div>
            <h1 className="text-white text-5xl font-black italic uppercase tracking-tighter flex items-center gap-4">
              <Gavel className="text-green-500" size={48} />
              Auction Hall
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
              {isPrivileged ? "MANAGER MODE ACTIVE" : "Real-Time Bidding System"}
            </p>
          </div>
        </div>

        {/* ADMIN: Create Button */}
        {isPrivileged && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-500 hover:bg-green-400 text-black px-8 py-4 rounded-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 shadow-lg shadow-green-500/20 transition-all active:scale-95"
          >
            <Plus size={24} />
            New Auction
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {loading && auctions.length === 0 ? (
             <div className="text-white text-center py-20 flex flex-col items-center">
               <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
               Loading Market Data...
             </div>
          ) : auctions.length === 0 ? (
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-12 text-center">
                <AlertCircle className="text-gray-600 mx-auto mb-4" size={48} />
                <h3 className="text-gray-400 font-bold text-xl">No Active Auctions</h3>
                <p className="text-gray-600 mt-2">Check back when the next round starts.</p>
             </div>
          ) : (
            auctions.map((auction) => (
              <div 
                key={auction.id}
                onClick={() => { setSelectedAuction(auction); setBids([]); }}
                className={`p-8 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                  selectedAuction?.id === auction.id 
                    ? 'bg-zinc-900 border-green-500 shadow-[0_0_30px_rgba(0,255,0,0.1)]' 
                    : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                         Round {auction.round}
                       </span>
                       <span className="text-gray-500 text-xs font-mono">
                         {auction.time ? new Date(auction.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'LIVE'}
                       </span>
                    </div>
                    <h3 className="text-3xl font-black italic text-white uppercase">{auction.stock}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Starting Bid</p>
                    <p className="text-2xl font-bold text-white">₹{auction.startingBid}</p>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xl">
                  {auction.snippet}
                </p>

                <div className="flex items-center gap-2 text-green-500 font-bold text-sm uppercase tracking-wider">
                  <Timer size={16} />
                  <span>Ends in {auction.duration} mins</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BIDDING PANEL */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 h-[600px] flex flex-col sticky top-8">
           {!selectedAuction ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <Gavel size={64} className="mb-4 text-gray-500" />
               <p className="text-gray-400 font-bold">Select an auction<br/>to place a bid</p>
             </div>
           ) : (
             <>
               <div className="mb-6 border-b border-zinc-800 pb-6">
                 <h2 className="text-2xl font-black italic text-white uppercase mb-1">{selectedAuction.stock}</h2>
                 <p className="text-green-500 text-xs font-bold uppercase tracking-widest">Live Bidding Room</p>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                 {bids.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                      <p>No bids yet.</p>
                      <p className="text-xs">Be the first to bid!</p>
                    </div>
                 ) : (
                   bids.map((bid, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 animate-in slide-in-from-bottom-2">
                       <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                           idx === 0 ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-gray-400'
                         }`}>{idx === 0 ? '1' : idx + 1}</div>
                         <div className="flex flex-col">
                           <span className={idx === 0 ? 'text-white font-bold' : 'text-gray-400'}>
                             {bid.bidder === userName ? 'You' : bid.bidder}
                           </span>
                           <span className="text-[10px] text-gray-600">
                             {new Date(bid.time).toLocaleTimeString()}
                           </span>
                         </div>
                       </div>
                       <span className={`font-mono font-bold ${idx === 0 ? 'text-green-400' : 'text-gray-500'}`}>₹{bid.amount}</span>
                     </div>
                   ))
                 )}
               </div>

               <div className="mt-auto pt-6 border-t border-zinc-800 space-y-3">
                  {isPrivileged && (
                    <div className="relative group">
                      <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Proxy Team Name" 
                        value={proxyTeam} 
                        onChange={(e) => setProxyTeam(e.target.value)} 
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-yellow-500 font-bold outline-none focus:border-yellow-500 transition-all text-sm" 
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      placeholder="Bid Amount" 
                      value={bidAmount} 
                      onChange={(e) => setBidAmount(e.target.value)} 
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-green-500 transition-all" 
                    />
                    <button 
                      onClick={handlePlaceBid} 
                      disabled={placingBid} 
                      className={`px-6 rounded-xl font-black uppercase italic tracking-tighter transition-all disabled:opacity-50 ${isPrivileged ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'}`}
                    >
                      {placingBid ? <Loader2 className="animate-spin" /> : (isPrivileged ? 'PROXY' : 'BID')}
                    </button>
                  </div>
               </div>
             </>
           )}
        </div>
      </div>

      {/* CREATE AUCTION MODAL (Admin Only) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic text-white uppercase flex items-center gap-3">
                <Megaphone className="text-green-500" /> Launch Event
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Stock Ticker</label>
                <input 
                  value={newAuctionStock} 
                  onChange={e => setNewAuctionStock(e.target.value)} 
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold focus:border-green-500 outline-none uppercase" 
                  placeholder="e.g. HDFCBANK" 
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Intel Snippet</label>
                <textarea 
                  value={newAuctionSnippet} 
                  onChange={e => setNewAuctionSnippet(e.target.value)} 
                  rows={3} 
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-green-500 outline-none resize-none" 
                  placeholder="Insider info teaser..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Start Bid (₹)</label>
                  <input 
                    type="number" 
                    value={newAuctionBid} 
                    onChange={e => setNewAuctionBid(e.target.value)} 
                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold focus:border-green-500 outline-none" 
                    placeholder="5000" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Duration (Min)</label>
                  <input 
                    type="number" 
                    value={newAuctionDuration} 
                    onChange={e => setNewAuctionDuration(e.target.value)} 
                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold focus:border-green-500 outline-none" 
                    placeholder="5" 
                  />
                </div>
              </div>

              <button 
                onClick={handleCreateAuction} 
                disabled={creating} 
                className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-xl font-black uppercase italic tracking-tighter text-lg mt-4 disabled:opacity-50"
              >
                {creating ? <Loader2 className="animate-spin mx-auto" /> : 'GO LIVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
