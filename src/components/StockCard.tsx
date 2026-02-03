// @ts-nocheck
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StockCard({ ticker, price, change, onClick }) {
  const isPositive = change >= 0;
  const changePercent = (change * 100).toFixed(2);
  
  const subtitles = {
    'SUNPHARMA': 'Sun Pharma',
    'SUN PHARMA': 'Sun Pharma',
    'HDFCBANK': 'HDFC Bank',
    'HDFC BANK': 'HDFC Bank',
    'RELIANCE': 'Reliance Ind',
    'TCS': 'TCS',
    'INFY': 'Infosys',
    'ICICIBANK': 'ICICI Bank',
    'ICICI BANK': 'ICICI Bank',
    'WIPRO': 'Wipro',
    'ITC': 'ITC Ltd',
    'GOLD': 'Gold',
    'COPPER': 'Copper',
    'STATE BANK OF INDIA': 'SBI',
    'VA TECH WABAG': 'VA Tech'
  };
  
  const subtitle = subtitles[ticker] || ticker;

  return (
    <div 
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-bold mb-1">{ticker}</h3>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        <div className={`p-1 rounded ${isPositive ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
          {isPositive ? (
            <TrendingUp size={18} className="text-green-500" />
          ) : (
            <TrendingDown size={18} className="text-red-500" />
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-white text-2xl font-bold">
          ₹{Number(price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className={`flex items-center gap-1 text-sm font-semibold ${
        isPositive ? 'text-green-500' : 'text-red-500'
      }`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isPositive ? '+' : ''}{changePercent}%</span>
      </div>
    </div>
  );
}
