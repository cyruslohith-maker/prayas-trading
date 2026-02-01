// @ts-nocheck
import { useState, useEffect } from 'react';
import { getPendingTrades, getPendingOptionTrades, verifyStockTrade, verifyOptionTrade, rejectStockTrade, rejectOptionTrade, getActiveRound, getTeamBrokerMapping } from '../lib/api';
import { ArrowLeft, Filter, Check, X, CheckCircle } from 'lucide-react';

// Team to Broker Mapping
const TEAM_BROKER_MAPPING = {
  broker_01: ['team_alpha', 'team_beta', 'team_charlie', 'team_defcon'],
  broker_02: ['team_tango', 'team_foxtrot', 'team_delta', 'team_golf'],
  broker_03: ['team_hotel', 'team_romeo', 'team_gamma', 'team_delta']
};

export function BrokerPanel({ onBack, userName }) {
  const [trades, setTrades] = useState([]);
  const [optionTrades, setOptionTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [activeTab, setActiveTab] = useState('options'); // Options only now for broker verification
  
  // Filters
  const [roundFilter, setRoundFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Stats
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);

  // Get broker name from userName
  const getBrokerName = () => {
    if (userName.includes('broker_01') || userName.includes('broker01')) return 'broker_01';
    if (userName.includes('broker_02') || userName.includes('broker02')) return 'broker_02';
    if (userName.includes('broker_03') || userName.includes('broker03')) return 'broker_03';
    return null;
  };

  const brokerName = getBrokerName();

  // Get teams assigned to this broker
  const getAssignedTeams = () => {
    if (!brokerName) return [];
    return TEAM_BROKER_MAPPING[brokerName] || [];
  };

  useEffect(() => {
    loadTrades();
    getActiveRound().then(setActiveRound);
    const interval = setInterval(loadTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTrades = async () => {
    // Stocks no longer need broker verification - only for display
    const [stockData, optionData] = await Promise.all([
      getPendingTrades(),
      getPendingOptionTrades(brokerName) // Pass broker name to filter
    ]);
    
    setTrades(stockData || []);
    
    // Filter option trades for this broker's assigned teams
    const assignedTeams = getAssignedTeams();
    let filteredOptions = optionData || [];
    
    if (brokerName && assignedTeams.length > 0) {
      filteredOptions = filteredOptions.filter(trade => 
        assignedTeams.includes(trade.buyer?.toLowerCase()) || 
        assignedTeams.includes(trade.seller?.toLowerCase())
      );
    }
    
    setOptionTrades(filteredOptions);
    
    const pending = filteredOptions.filter(t => t.status !== 'VERIFIED').length;
    const verified = filteredOptions.filter(t => t.status === 'VERIFIED').length;
    setPendingCount(pending);
    setVerifiedCount(verified);
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
          <p className="text-gray-400">
            {brokerName ? `${brokerName.toUpperCase()} - Verify option trades` : 'Verify and manage trades'}
          </p>
          {brokerName && (
            <p className="text-gray-500 text-sm mt-1">
              Assigned Teams: {getAssignedTeams().join(', ')}
            </p>
          )}
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

      {/* Notice about Stock Trades */}
      <div className="bg-blue-600/10 border border-blue-600 rounded-xl p-4 mb-6">
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> Stock trades no longer require broker verification. They are directly processed 
          and allocated to the appropriate Broker sheets. Only option trades require verification below.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-0 mb-6 border-b border-zinc-800">
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
        <button
          onClick={() => setActiveTab('stocks')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stocks'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Stock Trades (View Only) ({trades.length})
        </button>
      </div>

      {/* Option Trades */}
      {activeTab === 'options' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Trade ID</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Buyer</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase">Seller</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Strike</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Lots</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase">Premium</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">PIN</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Round</th>
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {optionTrades.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                      No option trades pending verification
                    </td>
                  </tr>
                ) : (
                  optionTrades.map((trade, i) => (
                    <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="px-4 py-4 text-white font-mono text-sm">{trade.tradeId || trade.id || '-'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.type?.includes('Call') ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                        }`}>
                          {trade.type || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-white">{trade.buyer || '-'}</td>
                      <td className="px-4 py-4 text-white">{trade.seller || '-'}</td>
                      <td className="px-4 py-4 text-right text-white">₹{(trade.strike || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right text-white">{trade.lots || trade.lotSize || '-'}</td>
                      <td className="px-4 py-4 text-right text-yellow-500 font-semibold">₹{(trade.premium || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-center text-white font-mono">{trade.pin || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-zinc-700 text-white px-2 py-1 rounded text-xs">
                          R{trade.round || activeRound}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {trade.status === 'VERIFIED' ? (
                          <div className="flex items-center justify-center gap-1 text-green-500">
                            <CheckCircle size={16} />
                            <span className="text-xs font-semibold">VERIFIED</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerifyOption(trade.tradeId || trade.id)}
                              disabled={loading}
                              className="p-2 bg-green-600 hover:bg-green-500 rounded transition-colors"
                              title="Verify"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectOption(trade.tradeId || trade.id)}
                              disabled={loading}
                              className="p-2 bg-red-600 hover:bg-red-500 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Trades (View Only) */}
      {activeTab === 'stocks' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700">
            <p className="text-gray-400 text-xs">
              Stock trades are automatically processed and don't require broker verification.
            </p>
          </div>
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
                  <th className="px-4 py-4 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                      No stock trades in queue
                    </td>
                  </tr>
                ) : (
                  trades.map((trade, i) => (
                    <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="px-4 py-4 text-white font-mono text-sm">{trade.tradeId || '-'}</td>
                      <td className="px-4 py-4 text-white font-semibold">{trade.asset || trade.symbol || '-'}</td>
                      <td className="px-4 py-4 text-red-400">{trade.seller || '-'}</td>
                      <td className="px-4 py-4 text-green-400">{trade.buyer || '-'}</td>
                      <td className="px-4 py-4 text-right text-white">{trade.qty || '-'}</td>
                      <td className="px-4 py-4 text-right text-white">₹{(trade.price || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right text-yellow-500 font-semibold">
                        ₹{((trade.qty || 0) * (trade.price || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-center text-white font-mono">{trade.pin || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-zinc-700 text-white px-2 py-1 rounded text-xs">
                          R{trade.round || activeRound}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-green-500 text-xs font-semibold flex items-center justify-center gap-1">
                          <CheckCircle size={14} />
                          AUTO
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
