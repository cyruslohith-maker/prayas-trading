// @ts-nocheck
import { useState, useEffect } from 'react';
import { fetchOptionChain, getActiveRound, fetchMarketPrices } from '../lib/api';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export function OptionChainPage({ onBack, activeRound }) {
  const [optionChain, setOptionChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotPrice, setSpotPrice] = useState(15000);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [activeRound]);

  const loadData = async () => {
    // 1. Load Option Chain
    const chain = await fetchOptionChain(activeRound);
    setOptionChain(chain || []);

    // 2. Load Real Index Price
    const marketData = await fetchMarketPrices();
    const indexData = marketData.find(s => s.ticker === 'INDEX' || s.ticker === 'Index A'); // Check your exact ticker name
    if (indexData) {
      setSpotPrice(indexData.price);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-4xl font-bold text-white mb-2">Caliper Index Options</h1>
            <p className="text-gray-400">Current Spot: ₹{spotPrice.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-3">
            <div className="text-gray-400 text-xs mb-1">Spot Price</div>
            <div className="text-white text-2xl font-bold">₹{spotPrice.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Option Chain Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Loading option chain...
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <div className="text-green-500 font-bold text-sm uppercase">CALLS</div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="text-white font-bold text-sm uppercase">STRIKE</div>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <div className="text-red-500 font-bold text-sm uppercase">PUTS</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {optionChain.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      No option chain data available
                    </td>
                  </tr>
                ) : (
                  optionChain.map((row, i) => {
                    const isATM = Math.abs(row.strike - spotPrice) < 100;
                    
                    return (
                      <tr 
                        key={i} 
                        className={`border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                          isATM ? 'bg-green-600/5' : ''
                        }`}
                      >
                        {/* Call Price */}
                        <td className="px-6 py-4 text-left">
                          <div  className="text-green-500 font-semibold text-lg">
                           ₹{Number(row.callLTP).toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Strike Price */}
                        <td className="px-6 py-4 text-center">
                          <div className={`font-bold text-lg ${isATM ? 'text-white bg-green-600 rounded-lg px-4 py-2 inline-block' : 'text-gray-300'}`}>
                            {Number(row.strike).toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Put Price */}
                        <td className="px-6 py-4 text-right">
                         <div className="text-red-500 font-semibold text-lg">
                            ₹{Number(row.putLTP).toFixed(2)}
                         </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Strike prices highlighted in green represent At-The-Money (ATM) options</p>
        </div>
      </div>
    </div>
  );
}