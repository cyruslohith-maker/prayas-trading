// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from 'lucide-react';
import { getPendingOptionTrades, getVerifiedOptionTrades, verifyOptionTrade, rejectOptionTrade } from '../lib/api';

export function BrokerPanel({ onBack, userName, userRole }) {
  const [pendingTrades, setPendingTrades] = useState([]);
  const [verifiedTrades, setVerifiedTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [userName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const brokerFilter = userRole === 'admin' ? undefined : userName;
      const [pending, verified] = await Promise.all([
        getPendingOptionTrades(brokerFilter),
        getVerifiedOptionTrades(brokerFilter)
      ]);
      setPendingTrades(pending || []);
      setVerifiedTrades(verified || []);
    } catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  const handleVerify = async (tradeId) => {
    setActionLoading(tradeId);
    try {
      const res = await verifyOptionTrade(tradeId);
      if (res.success) {
        alert('✅ Trade verified');
        loadData();
      } else {
        alert(`❌ ${res.message || 'Failed'}\n\n${res.error === 'INSUFFICIENT_MARGIN' ? 'Seller does not have sufficient margin.' : ''}`);
        loadData();
      }
    } catch (e) { alert('❌ Error'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (tradeId) => {
    if (!confirm('Reject this trade?')) return;
    setActionLoading(tradeId);
    try { await rejectOptionTrade(tradeId); loadData(); }
    catch (e) { alert('❌ Error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft size={20} /><span>Back</span></button>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-4xl font-bold text-white">Broker Panel</h1><p className="text-gray-400">Verify option trades</p></div>
        <button onClick={loadData} disabled={loading} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg">
          <RefreshCw size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            Pending Verification ({pendingTrades.length})
          </h2>
          {pendingTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-zinc-800">
                    <th className="text-left py-3 px-2">PIN</th>
                    <th className="text-left py-3 px-2">Round</th>
                    <th className="text-left py-3 px-2">Trade</th>
                    <th className="text-left py-3 px-2">Strike</th>
                    <th className="text-left py-3 px-2">Lots</th>
                    <th className="text-left py-3 px-2">Buyer</th>
                    <th className="text-left py-3 px-2">Seller</th>
                    <th className="text-right py-3 px-2">Margin</th>
                    <th className="text-center py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrades.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2 font-mono text-yellow-500">{t.pin}</td>
                      <td className="py-3 px-2 text-gray-400">R{t.round}</td>
                      <td className="py-3 px-2 text-white font-medium">{t.trade}</td>
                      <td className="py-3 px-2 text-white">{t.strike}</td>
                      <td className="py-3 px-2 text-white">{t.lots}</td>
                      <td className="py-3 px-2 text-green-500">{t.buyer}</td>
                      <td className="py-3 px-2 text-red-500">{t.seller}</td>
                      <td className="py-3 px-2 text-right text-white">₹{Math.abs(t.marginRequired || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleVerify(t.id)} disabled={actionLoading === t.id}
                            className="p-2 bg-green-600 hover:bg-green-500 rounded text-white disabled:bg-gray-700"><Check size={16} /></button>
                          <button onClick={() => handleReject(t.id)} disabled={actionLoading === t.id}
                            className="p-2 bg-red-600 hover:bg-red-500 rounded text-white disabled:bg-gray-700"><X size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">{loading ? 'Loading...' : 'No pending trades'}</div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Verified Trades (Active) ({verifiedTrades.length})
          </h2>
          {verifiedTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-zinc-800">
                    <th className="text-left py-3 px-2">PIN</th>
                    <th className="text-left py-3 px-2">Round</th>
                    <th className="text-left py-3 px-2">Trade</th>
                    <th className="text-left py-3 px-2">Strike</th>
                    <th className="text-left py-3 px-2">Lots</th>
                    <th className="text-left py-3 px-2">Buyer</th>
                    <th className="text-left py-3 px-2">Seller</th>
                    <th className="text-center py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedTrades.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-800/50">
                      <td className="py-3 px-2 font-mono text-green-500">{t.pin}</td>
                      <td className="py-3 px-2 text-gray-400">R{t.round}</td>
                      <td className="py-3 px-2 text-white font-medium">{t.trade}</td>
                      <td className="py-3 px-2 text-white">{t.strike}</td>
                      <td className="py-3 px-2 text-white">{t.lots}</td>
                      <td className="py-3 px-2 text-green-500">{t.buyer}</td>
                      <td className="py-3 px-2 text-red-500">{t.seller}</td>
                      <td className="py-3 px-2 text-center"><span className="px-2 py-1 bg-green-600/20 text-green-500 rounded text-xs font-semibold">ACTIVE</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">{loading ? 'Loading...' : 'No active trades'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
