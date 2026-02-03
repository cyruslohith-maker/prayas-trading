// @ts-nocheck
export function UserProfile({ name, cash, startingCapital, role }) {
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '...';
    return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };
  
  const isTrader = role === 'user';

  return (
    <div className="p-6 border-b border-zinc-800">
      <div className="mb-4">
        <p className="text-white font-bold text-lg">{name}</p>
        <p className="text-gray-500 text-xs uppercase tracking-wide">
          {role === 'admin' ? 'Administrator' : role === 'broker' ? 'Broker' : 'Trader'}
        </p>
      </div>
      
      {isTrader && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Starting Capital</span>
            <span className="text-gray-400 text-sm font-medium">{formatCurrency(startingCapital)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Current Cash</span>
            <span className="text-white text-sm font-bold">{formatCurrency(cash)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
