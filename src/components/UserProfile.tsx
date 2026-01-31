// @ts-nocheck
import { User, ChevronDown } from 'lucide-react';

export function UserProfile({ name, cash, role }) {
  const roleLabels = {
    user: 'Trader',
    broker: 'Broker',
    admin: 'Admin'
  };

  return (
    <div className="px-4 mb-6">
      {/* User Info */}
      <button className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm">{name}</h3>
              <ChevronDown size={14} className="text-gray-500" />
            </div>
            <p className="text-gray-500 text-xs">{roleLabels[role] || 'Trader'}</p>
          </div>
        </div>

        {/* Capital */}
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-gray-500 text-xs mb-1">Starting Capital</p>
          <p className="text-white text-lg font-bold">₹{parseFloat(cash).toLocaleString('en-IN')}</p>
        </div>
      </button>
    </div>
  );
}
