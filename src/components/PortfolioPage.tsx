// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { 
  getPortfolioHoldings, 
  getActiveShorts, 
  getActiveOptionTrades 
} from '../lib/api';

export function PortfolioPage({ onBack, userName }) {
  const [holdings, setHoldings] = useState([]);
  const [activeShorts, setActiveShorts] = useState([]);
  const [activeOptions, setActiveOptions] = useState([]);
  
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [loadingShorts, setLoadingShorts] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [userName]);

  const loadAllData = () => {
    loadHoldings();
    loadShorts();
    loadOptions();
  };

  const loadHoldings = async () => {
    setLoadingHoldings(true);
    try {
      const data = await getPortfolioHoldings(userName);
      setHoldings(data || []);
    } catch (e) {
      console.error('Error loading holdings:', e);
    } finally {
      setLoadingHoldings(false);
    }
  };

  const loadShorts = async () => {
    setLoadingShorts(true);
    try {
      const data = await getActiveShorts(userName);
      setActiveShorts(data || []);
    } catch (e) {
      console.error('Error loading shorts:', e);
    } finally {
      setLoadingShorts(false);
    }
  };

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const data = await getActiveOptionTrades(userName);
      setActiveOptions(data || []);
    } catch (e) {
      console.error('Error loading options:', e);
    } finally {
      setLoadingOptions(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        <span>Back to Market</span>
      </button>

      <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
      <p className="text-gray-400 mb-8">View your holdings, active shorts, and option positions</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT SIDE: Stock Holdings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Stock Holdings</h2>
            <button
              onClick={loadHoldings}
              disabled={loadingHoldings}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={`text-gray-400 ${loadingHoldings ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[400px]">
            {holdings.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr className="text-gray-400 border-b border-zinc-800">
                    <th className="text-left py-2 px-2">Round</th>
                    <th className="text-left py-2 px-2">Stock</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2 text-gray-400">R{h.round}</td>
                      <td className="py-3 px-2 text-white font-medium">{h.stock}</td>
                      <td className="py-3 px-2 text-right text-white">{h.qty}</td>
                      <td className="py-3 px-2 text-right text-green-500">
                        ₹{h.price?.toLocaleString('en-IN') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {loadingHoldings ? 'Loading...' : 'No stock holdings found'}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Shorts + Options */}
        <div className="space-y-6">
          
          {/* Active Shorts Container */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Active Shorts</h2>
              <button
                onClick={loadShorts}
                disabled={loadingShorts}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <RefreshCw size={18} className={`text-gray-400 ${loadingShorts ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[180px]">
              {activeShorts.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-900">
                    <tr className="text-gray-400 border-b border-zinc-800">
                      <th className="text-left py-2 px-2">Stock</th>
                      <th className="text-right py-2 px-2">Qty</th>
                      <th className="text-right py-2 px-2">Sell Rate</th>
                      <th className="text-right py-2 px-2">PIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeShorts.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-2 px-2 text-white font-medium">{s.stock}</td>
                        <td className="py-2 px-2 text-right text-white">{s.qty}</td>
                        <td className="py-2 px-2 text-right text-red-500">
                          ₹{s.sellRate?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-right text-yellow-500 font-mono">{s.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loadingShorts ? 'Loading...' : 'No active shorts'}
                </div>
              )}
            </div>
          </div>

          {/* Active Options Container */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Active Option Trades</h2>
              <button
                onClick={loadOptions}
                disabled={loadingOptions}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <RefreshCw size={18} className={`text-gray-400 ${loadingOptions ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[180px]">
              {activeOptions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-900">
                    <tr className="text-gray-400 border-b border-zinc-800">
                      <th className="text-left py-2 px-1">Action</th>
                      <th className="text-left py-2 px-1">Type</th>
                      <th className="text-right py-2 px-1">Lot</th>
                      <th className="text-right py-2 px-1">Lots</th>
                      <th className="text-right py-2 px-1">Strike</th>
                      <th className="text-right py-2 px-1">Value</th>
                      <th className="text-right py-2 px-1">PIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOptions.map((o, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className={`py-2 px-1 font-medium ${o.action === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                          {o.action}
                        </td>
                        <td className="py-2 px-1 text-white">
                          {o.type?.includes('Call') ? 'CALL' : 'PUT'}
                        </td>
                        <td className="py-2 px-1 text-right text-gray-400">{o.lotSize}</td>
                        <td className="py-2 px-1 text-right text-white">{o.lots}</td>
                        <td className="py-2 px-1 text-right text-white">{o.strike}</td>
                        <td className="py-2 px-1 text-right text-blue-400">
                          ₹{parseFloat(o.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-1 text-right text-yellow-500 font-mono">{o.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loadingOptions ? 'Loading...' : 'No active option trades'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
