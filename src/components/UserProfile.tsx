// @ts-nocheck
import { User, ChevronDown, RefreshCw } from 'lucide-react';

export function UserProfile({ name, cash, role, currentCashBalance, onRefreshBalance, isRefreshing }) {
  const roleLabels = {
    user: 'Trader',
    broker: 'Broker',
    admin: 'Admin'
  };

  const showCashBalance = role === 'user' && currentCashBalance !== undefined;

  return (
    <div className="px-4 mb-6">
      {/* User Info */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
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

        {/* Starting Capital */}
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-gray-500 text-xs mb-1">Starting Capital</p>
          <p className="text-white text-lg font-bold">₹{parseFloat(cash).toLocaleString('en-IN')}</p>
        </div>

        {/* Current Cash Balance - Only for traders */}
        {showCashBalance && (
          <div className="border-t border-zinc-800 pt-3 mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-500 text-xs">Current Cash Balance</p>
              <button
                onClick={onRefreshBalance}
                disabled={isRefreshing}
                className="p-1 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                title="Refresh balance"
              >
                <RefreshCw 
                  size={14} 
                  className={`text-gray-400 hover:text-green-500 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>
            <p className={`text-lg font-bold ${
              currentCashBalance >= parseFloat(cash) ? 'text-green-500' : 'text-red-500'
            }`}>
              ₹{parseFloat(currentCashBalance).toLocaleString('en-IN')}
            </p>
            {currentCashBalance !== parseFloat(cash) && (
              <p className={`text-xs mt-1 ${
                currentCashBalance >= parseFloat(cash) ? 'text-green-500' : 'text-red-500'
              }`}>
                {currentCashBalance >= parseFloat(cash) ? '+' : ''}
                ₹{(currentCashBalance - parseFloat(cash)).toLocaleString('en-IN')} 
                ({((currentCashBalance - parseFloat(cash)) / parseFloat(cash) * 100).toFixed(2)}%)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}