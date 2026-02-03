// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchOptionChain } from '../lib/api';

export function OptionChainPage({ onBack, userName, activeRound }) {
  const [optionChain, setOptionChain] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptionChain();
  }, [activeRound]);

  const loadOptionChain = async () => {
    setLoading(true);
    try {
      const round = activeRound > 0 ? activeRound : 1;
      const data = await fetchOptionChain(round);
      setOptionChain(data || []);
    } catch (e) {
      console.error('Error loading option chain:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Option Chain</h1>
          <p className="text-gray-400">NOVUS INDEX Options for Round {activeRound}</p>
        </div>
        <button
          onClick={loadOptionChain}
          disabled={loading}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RefreshCw size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Option Chain Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800">
              <th colSpan={2} className="py-3 px-4 text-green-500 font-semibold text-center border-r border-zinc-700">
                CALLS
              </th>
              <th className="py-3 px-4 text-white font-semibold text-center border-r border-zinc-700">
                STRIKE
              </th>
              <th colSpan={2} className="py-3 px-4 text-red-500 font-semibold text-center">
                PUTS
              </th>
            </tr>
            <tr className="text-gray-400 text-sm border-b border-zinc-800">
              <th className="py-2 px-4 text-left">LTP</th>
              <th className="py-2 px-4 text-right border-r border-zinc-700">Premium</th>
              <th className="py-2 px-4 text-center border-r border-zinc-700">Price</th>
              <th className="py-2 px-4 text-left">LTP</th>
              <th className="py-2 px-4 text-right">Premium</th>
            </tr>
          </thead>
          <tbody>
            {optionChain.length > 0 ? (
              optionChain.map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4 text-green-400 font-medium">
                    ₹{parseFloat(row.callLTP || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 border-r border-zinc-700">
                    {parseFloat(row.callLTP || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center text-white font-bold border-r border-zinc-700">
                    {row.strike}
                  </td>
                  <td className="py-3 px-4 text-red-400 font-medium">
                    ₹{parseFloat(row.putLTP || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400">
                    {parseFloat(row.putLTP || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  {loading ? 'Loading option chain...' : 'No option data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <p className="text-gray-400 text-sm">
          💡 To trade options, go to the Trade page and select the Options tab. 
          Buyers pay premium upfront. Sellers require margin verification from brokers.
        </p>
      </div>
    </div>
  );
}
