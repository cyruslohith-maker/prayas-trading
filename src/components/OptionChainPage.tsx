// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchOptionChain } from '../lib/api';

export function OptionChainPage({ onBack, activeRound }) {
  const [optionChain, setOptionChain] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadOptionChain(); }, [activeRound]);

  const loadOptionChain = async () => {
    setLoading(true);
    try { setOptionChain(await fetchOptionChain(Math.max(activeRound, 1)) || []); }
    catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={20} /><span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-4xl font-bold text-white">Option Chain</h1><p className="text-gray-400">Round {Math.max(activeRound, 1)} • INDEX A</p></div>
        <button onClick={loadOptionChain} disabled={loading} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg">
          <RefreshCw size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {optionChain.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800">
                <th className="py-4 px-6 text-left text-green-500 font-bold">CALL LTP</th>
                <th className="py-4 px-6 text-center text-white font-bold">STRIKE</th>
                <th className="py-4 px-6 text-right text-red-500 font-bold">PUT LTP</th>
              </tr>
            </thead>
            <tbody>
              {optionChain.map((row, i) => (
                <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                  <td className="py-4 px-6 text-left text-green-500 font-mono">₹{Number(row.callLTP || 0).toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6 text-center text-white font-bold">{row.strike}</td>
                  <td className="py-4 px-6 text-right text-red-500 font-mono">₹{Number(row.putLTP || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">{loading ? 'Loading...' : 'No option chain data'}</div>
      )}
    </div>
  );
}
