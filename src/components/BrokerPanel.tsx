// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from 'lucide-react';
import { 
  getPendingOptionTrades,
  getVerifiedOptionTrades,
  verifyOptionTrade,
  rejectOptionTrade
} from '../lib/api';

export function BrokerPanel({ onBack, userName, userRole }) {
  const [pendingTrades, setPendingTrades] = useState([]);
  const [verifiedTrades, setVerifiedTrades] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingVerified, setLoadingVerified] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const brokerName = isAdmin ? null : userName; // Admin sees all, broker sees filtered

  useEffect(() => {
    loadAllTrades();
    const interval = setInterval(loadAllTrades, 4000);
    return () => clearInterval(interval);
  }, [userName]);

  const loadAllTrades = () => {
    loadPendingTrades();
    loadVerifiedTrades();
  };

  const loadPendingTrades = async () => {
    setLoadingPending(true);
    try {
      const data = await getPendingOptionTrades(brokerName);
      setPendingTrades(data || []);
    } catch (e) {
      console.error('Error loading pending trades:', e);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadVerifiedTrades = async () => {
    setLoadingVerified(true);
    try {
      const data = await getVerifiedOptionTrades(brokerName);
      setVerifiedTrades(data || []);
    } catch (e) {
      console.error('Error loading verified trades:', e);
    } finally {
      setLoadingVerified(false);
    }
  };

  const handleVerify = async (tradeId: string) => {
    setProcessing(tradeId);
    try {
      const res = await verifyOptionTrade(tradeId);
      if (res.success) {
        alert(`✅ Trade ${tradeId} verified!`);
        loadAllTrades();
      } else {
        alert(`❌ ${res.error || 'Error'}\n\n${res.message || 'Verification failed'}`);
        loadAllTrades();
      }
    } catch (e) {
      alert('❌ Failed to verify trade');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (tradeId: string) => {
    if (!confirm(`Are you sure you want to reject trade ${tradeId}?`)) return;
    
    setProcessing(tradeId);
    try {
      const res = await rejectOptionTrade(tradeId);
      if (res.success) {
        alert(`Trade ${tradeId} rejected`);
        loadAllTrades();
      } else {
        alert('Failed to reject trade');
      }
    } catch (e) {
      alert('❌ Failed to reject trade');
    } finally {
      setProcessing(null);
    }
  };

  // Get which sheet this broker handles
  const getBrokerInfo = () => {
    if (isAdmin) return 'All option trades (R4 & R5)';
    if (userName === 'broker_01' || userName === 'broker_02') {
      return 'Options Broker R4 (Rounds 1-2)';
    }
    if (userName === 'broker_03') {
      return 'Options Broker R5 (Rounds 3-4)';
    }
    return 'Option trades';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <h1 className="text-4xl font-bold text-white mb-2">Broker Panel</h1>
      <p className="text-gray-400 mb-2">Verify and manage option trades</p>
      <p className="text-sm text-blue-400 mb-8">{getBrokerInfo()}</p>

      <div className="space-y-6">
        
        {/* Pending Trades */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Pending Verification
              {pendingTrades.length > 0 && (
                <span className="ml-2 bg-yellow-600 text-white text-sm px-2 py-1 rounded-full">
                  {pendingTrades.length}
                </span>
              )}
            </h2>
            <button
              onClick={loadPendingTrades}
              disabled={loadingPending}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={`text-gray-400 ${loadingPending ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            {pendingTrades.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr className="text-gray-400 border-b border-zinc-800">
                    <th className="text-left py-2 px-2">PIN</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Buyer</th>
                    <th className="text-left py-2 px-2">Seller</th>
                    <th className="text-right py-2 px-2">Strike</th>
                    <th className="text-right py-2 px-2">Lots</th>
                    <th className="text-right py-2 px-2">Margin</th>
                    <th className="text-center py-2 px-2">Sheet</th>
                    <th className="text-center py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrades.map((trade, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2 text-yellow-500 font-mono font-bold">{trade.pin}</td>
                      <td className="py-3 px-2 text-white">{trade.trade}</td>
                      <td className="py-3 px-2 text-green-400">{trade.buyer}</td>
                      <td className="py-3 px-2 text-red-400">{trade.seller}</td>
                      <td className="py-3 px-2 text-right text-white">{trade.strike}</td>
                      <td className="py-3 px-2 text-right text-white">{trade.lots}</td>
                      <td className="py-3 px-2 text-right text-blue-400">
                        ₹{parseFloat(trade.marginRequired || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-500 text-xs">
                        {trade.sheet?.includes('R4') ? 'R4' : 'R5'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerify(trade.pin)}
                            disabled={processing === trade.pin}
                            className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Verify"
                          >
                            <Check size={16} className="text-white" />
                          </button>
                          <button
                            onClick={() => handleReject(trade.pin)}
                            disabled={processing === trade.pin}
                            className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {loadingPending ? 'Loading...' : 'No pending trades to verify'}
              </div>
            )}
          </div>
        </div>

        {/* Verified Trades */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Verified Trades (Active)
              {verifiedTrades.length > 0 && (
                <span className="ml-2 bg-green-600 text-white text-sm px-2 py-1 rounded-full">
                  {verifiedTrades.length}
                </span>
              )}
            </h2>
            <button
              onClick={loadVerifiedTrades}
              disabled={loadingVerified}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={`text-gray-400 ${loadingVerified ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
            {verifiedTrades.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr className="text-gray-400 border-b border-zinc-800">
                    <th className="text-left py-2 px-2">PIN</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Buyer</th>
                    <th className="text-left py-2 px-2">Seller</th>
                    <th className="text-right py-2 px-2">Strike</th>
                    <th className="text-right py-2 px-2">Lot Size</th>
                    <th className="text-right py-2 px-2">Lots</th>
                    <th className="text-right py-2 px-2">Margin</th>
                    <th className="text-center py-2 px-2">Sheet</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedTrades.map((trade, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2 text-yellow-500 font-mono font-bold">{trade.pin}</td>
                      <td className="py-3 px-2 text-white">{trade.trade}</td>
                      <td className="py-3 px-2 text-green-400">{trade.buyer}</td>
                      <td className="py-3 px-2 text-red-400">{trade.seller}</td>
                      <td className="py-3 px-2 text-right text-white">{trade.strike}</td>
                      <td className="py-3 px-2 text-right text-gray-400">{trade.lotSize}</td>
                      <td className="py-3 px-2 text-right text-white">{trade.lots}</td>
                      <td className="py-3 px-2 text-right text-blue-400">
                        ₹{parseFloat(trade.marginRequired || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-500 text-xs">
                        {trade.sheet?.includes('R4') ? 'R4' : 'R5'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="bg-green-600/20 text-green-500 text-xs px-2 py-1 rounded">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {loadingVerified ? 'Loading...' : 'No verified trades yet'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
