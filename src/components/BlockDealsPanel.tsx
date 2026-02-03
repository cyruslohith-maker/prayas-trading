// @ts-nocheck
import { ArrowLeft } from 'lucide-react';

export function BlockDealsPanel({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={20} /><span>Back</span>
      </button>
      <h1 className="text-4xl font-bold text-white mb-2">Block Deals</h1>
      <p className="text-gray-400 mb-8">Large volume trades</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center">
        <p className="text-gray-500">Block deals feature coming soon</p>
      </div>
    </div>
  );
}
