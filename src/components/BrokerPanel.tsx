// @ts-nocheck
import { useState, useEffect } from 'react';
import { getPendingTrades, getPendingOptionTrades, verifyStockTrade, verifyOptionTrade, rejectStockTrade, rejectOptionTrade, getActiveRound } from '../lib/api';
import { ArrowLeft, Filter, Check, X } from 'lucide-react';

export function BrokerPanel({ onBack, userName }) {
  const [trades, setTrades] = useState([]);
  const [optionTrades, setOptionTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' | 'options'
  
  // Filters
  const [roundFilter, setRoundFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Stats
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);

  useEffect(() => {
    loadTrades();
    getActiveRound().then(setActiveRound);
    const interval = setInterval(loadTrades, 5000);
    return () => clearInterval(interval);
  }, []);

   const loadTrades = async () => {
   const [stockData, optionData] = await Promise.all([
    getPendingTrades(),
    getPendingOptionTrades()
    ]);
  
   setTrades(stockData || []);
   setOptionTrades(optionData || []);
  
   const pending = (stockData?.length || 0) + (optionData?.length || 0);
   setPendingCount(pending);
   };
   
  const handleVerifyStock = async (tradeId) => {
    setLoading(true);
    try {
      const res = await verifyStockTrade(tradeId);
      if (res.success) {
        alert("Stock trade verified successfully!");
        loadTrades();
      } else {
        alert("Failed to verify trade");
      }
    } catch (e) {
      alert("Error verifying trade");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOption = async (tradeId) => {
    setLoading(true);
    try {
      const res = await verifyOptionTrade(tradeId);
      if (res.success) {
        alert("Option trade verified! Margin locked successfully.");
        loadTrades();
      } else if (res.error === 'INSUFFICIENT_MARGIN') {
        // Show detailed error with trade details
        const details = res.tradeDetails;
        const message = `❌ MARGIN REQUIREMENT NOT MET\n\n${res.message}\n\n` +
          `Trade Details:\n` +
          `Buyer: ${details.buyer}\n` +
          `Seller: ${details.seller}\n` +
          `Margin Required: ₹${details.marginRequired.toLocaleString('en-IN')}\n\n` +
          `⚠️ This trade has been automatically removed from the broker sheet.\n` +
          `Please notify both parties that their trade did not go through.`;
        alert(message);
        loadTrades();
      } else {
        alert("Failed to verify option trade");
      }
    } catch (e) {
      alert("Error verifying option trade");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectStock = async (tradeId) => {
    if (!confirm("Are you sure you want to REJECT this Stock trade?")) return;
    setLoading(true);
    try {
      await rejectStockTrade(tradeId);
      alert("Trade Rejected.");
      loadTrades();
    } catch (e) { alert("Error rejecting trade"); }
    finally { setLoading(false); }
  };

  const handleRejectOption = async (tradeId) => {
    if (!confirm("Are you sure you want to REJECT this Option trade?")) return;
    setLoading(true);
    try {
      await rejectOptionTrade(tradeId);
      alert("Option Trade Rejected.");
      loadTrades();
    } catch (e) { alert("Error rejecting trade"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>
      
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Broker Panel</h1>
          <p className="text-gray-400">Verify and manage all trades</p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-yellow-600 rounded-lg px-6 py-3">
            <div className="text-gray-400 text-xs mb-1">Pending</div>
            <div className="text-yellow-500 text-3xl font-bold">{pendingCount}</div>
          </div>
          <div className="bg-zinc-900 border border-green-600 rounded-lg px-6 py-3">
            <div className="text-gray-400 text-xs mb-1">Verified</div>
            <div className="text-green-500 text-3xl font-bold">{verifiedCount}</div>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-0 mb-6 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stocks'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Stock/Commodity Trades ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'options'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Option Trades ({optionTrades.length})
        </button>
      </div>

      {/* Stock/Commodity Trades */}
      {activeTab === 'stocks' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Trade ID</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Seller</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Buyer</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Quantity</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">PIN</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Round</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                      No pending stock trades
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => {
                    const total = trade.quantity * trade.price;
                    
                    return (
                      <tr key={trade.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-4 text-sm text-white font-mono">{trade.id}</td>
                        <td className="px-4 py-4 text-sm text-white font-semibold">{trade.symbol}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{trade.seller}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{trade.buyer}</td>
                        <td className="px-4 py-4 text-sm text-white text-right">{trade.quantity}</td>
                        <td className="px-4 py-4 text-sm text-white text-right">₹{Number(trade.price).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-sm text-white text-right font-semibold">
                          ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-green-500 font-mono text-sm">{trade.pin}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-white text-sm">{trade.round}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerifyStock(trade.id)}
                              disabled={loading}
                              className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Verify"
                            >
                              <Check size={16} className="text-white" />
                            </button>
                            <button
                              onClick={() => handleRejectStock(trade.id)}
                              disabled={loading}
                              className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reject"
                            >
                              <X size={16} className="text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Option Trades */}
      {activeTab === 'options' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Trade ID</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Strike</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Seller</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Buyer</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Price/Lot</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">PIN</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Round</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {optionTrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      No pending option trades
                    </td>
                  </tr>
                ) : (
                  optionTrades.map((trade) => {
                    return (
                      <tr key={trade.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-4 text-sm text-green-500 font-mono">{trade.pin}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            trade.trade === 'Call-B' ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                          }`}>
                            {trade.trade}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-white font-semibold">{trade.strike}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{trade.buyer}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{trade.seller}</td>
                        <td className="px-4 py-4 text-sm text-white text-right">
                          ₹{Number(trade.marginRequired).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-white text-sm">{trade.round}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerifyOption(trade.id)}
                              disabled={loading}
                              className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Verify & Lock Margin"
                            >
                              <Check size={16} className="text-white" />
                            </button>

                            <button
                             onClick={() => handleRejectOption(trade.id)}
                             disabled={loading}
                             className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Reject"
                             >
                              <X size={16} className="text-white" />

                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}