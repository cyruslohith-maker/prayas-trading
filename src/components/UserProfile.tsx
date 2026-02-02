// @ts-nocheck
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getCurrentCashBalance, getStartingCapital } from '../lib/api';

export function UserProfile({ userName, userRole }) {
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [startingCapital, setStartingCapital] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBalances();
    
    // Auto-refresh every 4 seconds
    const interval = setInterval(loadBalances, 4000);
    return () => clearInterval(interval);
  }, [userName]);

  const loadBalances = async () => {
    try {
      const [balance, capital] = await Promise.all([
        getCurrentCashBalance(userName),
        getStartingCapital()
      ]);
      setCurrentBalance(balance);
      setStartingCapital(capital);
    } catch (e) {
      console.error('Error loading balances:', e);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadBalances();
    setLoading(false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '...';
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Don't show balance for brokers/admins
  const showBalance = userRole === 'user';

  return (
    <div className="p-4 border-b border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white font-semibold text-lg">{userName}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide">
            {userRole === 'admin' ? 'Administrator' : userRole === 'broker' ? 'Broker' : 'Trader'}
          </p>
        </div>
      </div>
      
      {showBalance && (
        <div className="mt-3 space-y-2">
          {/* Starting Capital */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Starting Capital</span>
            <span className="text-gray-300 text-sm font-medium">
              {formatCurrency(startingCapital)}
            </span>
          </div>
          
          {/* Current Cash Balance */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Current Cash</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold">
                {formatCurrency(currentBalance)}
              </span>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
                title="Refresh balance"
              >
                <RefreshCw size={12} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
