// @ts-nocheck
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StockCard({ ticker, price, change, previousPrice }) {
  // Calculate percentage change dynamically if previousPrice is provided
  let calculatedChange = change;
  if (previousPrice !== undefined && previousPrice > 0) {
    calculatedChange = (price - previousPrice) / previousPrice;
  }
  
  const isPositive = calculatedChange >= 0;
  const changePercent = (calculatedChange * 100).toFixed(2);
  
  // Get subtitle (company name) from ticker
  const subtitles = {
    'SBI': 'State Bank Of India',
    'SBIN': 'State Bank Of India',
    'STATE BANK OF INDIA': 'Banking',
    'HDFCBANK': 'HDFC Bank',
    'HDFC BANK': 'Banking',
    'VEDANTA': 'Mining',
    'COAL INDIA': 'Mining',
    'COALINDIA': 'Coal India',
    'VA TECH WABAG': 'Water Treatment',
    'VATECH': 'VA Tech Wabag',
    'ION EXCHANGE': 'Water Treatment',
    'ITC HOTELS': 'Hospitality',
    'ITCHOTELS': 'ITC Hotels',
    'HILTON HOTELS': 'Hospitality',
    'HILTON': 'Hilton Hotels',
    'BHARAT FORGE': 'Auto Components',
    'BHARATFORGE': 'Bharat Forge',
    'SONA PRECISIONS': 'Auto Components',
    'SONAPRECISIONS': 'Sona Precisions',
    'MARUTI SUZUKI': 'Automobile',
    'MARUTI': 'Maruti Suzuki',
    'MAHINDRA & MAHINDRA': 'Automobile',
    'M&M': 'Mahindra & Mahindra',
    'RELIANCE': 'Reliance Ind',
    'TCS': 'TCS',
    'INFY': 'Infosys',
    'ICICIBANK': 'ICICI Bank',
    'WIPRO': 'Wipro',
    'ITC': 'ITC Ltd',
    'GOLD': 'Gold',
    'COPPER': 'Copper',
    'NOCUS INDEX': 'Market Index'
  };
  
  const subtitle = subtitles[ticker.toUpperCase()] || ticker;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
      {/* Header */}
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

      {/* Price */}
      <div className="mb-3">
        <div className="text-white text-2xl font-bold">
          ₹{Number(price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </div>
        {/* Show previous price if available */}
        {previousPrice !== undefined && previousPrice > 0 && previousPrice !== price && (
          <div className="text-gray-500 text-xs mt-1">
            Prev: ₹{Number(previousPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Change */}
      <div className={`flex items-center gap-1 text-sm font-semibold ${
        isPositive ? 'text-green-500' : 'text-red-500'
      }`}>
        {isPositive ? (
          <TrendingUp size={14} />
        ) : (
          <TrendingDown size={14} />
        )}
        <span>{isPositive ? '+' : ''}{changePercent}%</span>
        {previousPrice !== undefined && previousPrice > 0 && (
          <span className="text-gray-500 text-xs ml-2">
            ({isPositive ? '+' : ''}₹{(price - previousPrice).toFixed(2)})
          </span>
        )}
      </div>
    </div>
  );
}
