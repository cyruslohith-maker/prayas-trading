// @ts-nocheck
interface Holding {
  company: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

const holdings: Holding[] = [
  { company: 'Reliance Industries', ticker: 'RELIANCE', quantity: 50, avgPrice: 2400, currentPrice: 2456.30 },
  { company: 'HDFC Bank', ticker: 'HDFCBANK', quantity: 30, avgPrice: 1650, currentPrice: 1685.75 },
  { company: 'TCS', ticker: 'TCS', quantity: 25, avgPrice: 3800, currentPrice: 3842.20 },
  { company: 'Infosys', ticker: 'INFY', quantity: 40, avgPrice: 1420, currentPrice: 1456.90 },
];

export function HoldingsTable() {
  return (
    <div className="bg-terminal-bg rounded-[2.5rem] border border-terminal-border overflow-hidden shadow-2xl animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="p-8 border-b border-terminal-border bg-black/20 flex justify-between items-center">
        <div>
          <h2 className="text-brand-green text-3xl font-black italic uppercase tracking-tighter leading-none">Institutional Holdings</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Secured Asset Ledger • Prayas CUCA</p>
        </div>
        <div className="bg-brand-green/10 border border-brand-green/20 px-6 py-2 rounded-xl">
           <span className="text-brand-green font-black uppercase text-[10px] tracking-widest italic">Live P&L Sync</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-terminal-border">
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Asset Identity</th>
              <th className="p-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Quantity</th>
              <th className="p-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Acquisition</th>
              <th className="p-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Market Value</th>
              <th className="p-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Profit / Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border">
            {holdings.map((holding) => {
              const currentValue = holding.quantity * holding.currentPrice;
              const investedValue = holding.quantity * holding.avgPrice;
              const profitLoss = currentValue - investedValue;
              const profitLossPercent = ((profitLoss / investedValue) * 100);
              const isProfit = profitLoss >= 0;
              
              return (
                <tr key={holding.ticker} className="hover:bg-brand-green/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="text-white font-black text-xl italic uppercase tracking-tighter leading-none">{holding.company}</div>
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">{holding.ticker}</div>
                  </td>
                  <td className="p-6 text-right font-mono font-black text-lg text-white italic">
                    {holding.quantity}
                  </td>
                  <td className="p-6 text-right font-mono font-black text-lg text-gray-400 italic">
                    ₹{holding.avgPrice.toFixed(2)}
                  </td>
                  <td className="p-6 text-right font-mono font-black text-xl text-white italic">
                    ₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 text-right">
                    <div className={`font-mono font-black text-xl italic tracking-tighter ${isProfit ? 'text-brand-green' : 'text-brand-red'}`}>
                      {isProfit ? '▲' : '▼'} ₹{Math.abs(profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[10px] font-black uppercase italic tracking-widest ${isProfit ? 'text-brand-green' : 'text-brand-red'}`}>
                      {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}% Yield
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div className="bg-black/40 p-6 border-t border-terminal-border text-center">
        <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.5em] italic">
          Institutional Node: 0x82...B1 • Real-Time Clearing Active
        </p>
      </div>
    </div>
  );
}
