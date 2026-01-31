// @ts-nocheck
import { ArrowLeft, Shield, BarChart3, TrendingUp, ChevronRight, ChevronLeft, Newspaper, Loader2, Activity, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setRoundAction, getActiveRound, SCRIPT_URL } from '../lib/api';

export function AdminPanel({ onBack }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsImpact, setNewsImpact] = useState('neutral');

  useEffect(() => {
    const syncRound = async () => {
      const rd = await getActiveRound();
      if(rd) setCurrentRound(Number(rd));
    };
    syncRound();
  }, []);

  const handleUpdateRound = async (newRound: number) => {
    if (newRound < 1 || newRound > 5 || loading) return;
    setLoading(true);
    try {
      const res = await setRoundAction(newRound);
      if (res.success) {
        setCurrentRound(newRound);
      }
    } catch (e) {
      alert("Terminal Outage: Command Center Disconnected.");
    } finally {
      setLoading(false);
    }
  };

  const handleInjectNews = async () => {
    if (!newsHeadline || newsLoading) return;
    setNewsLoading(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'injectNews',
          title: newsHeadline.toUpperCase(),
          impact: newsImpact,
          summary: `BREAKING: ${newsImpact.toUpperCase()} MARKET SHOCK`,
        })
      });
      const result = await response.json();
      if (result.success) {
        setNewsHeadline('');
        alert("📢 BROADCAST SENT");
      }
    } catch (error) {
      alert("Broadcast Interrupted.");
    } finally {
      setNewsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Header - Reverted to Neon Green/Red Branding */}
      <div className="flex items-center gap-8 mb-12">
        <button onClick={onBack} className="bg-terminal-bg p-5 rounded-2xl border border-terminal-border hover:border-brand-green transition-all">
          <ArrowLeft className="text-white" size={28} />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-5xl font-black italic uppercase tracking-tighter flex items-center gap-4">
            <Shield className="text-brand-green" size={48} />
            Command Center
          </h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] italic">System Architect • Prayas CUCA</p>
        </div>
        
        <div className="bg-brand-green text-black rounded-2xl px-10 py-4 font-black italic uppercase text-xl shadow-[0_0_30px_rgba(0,200,5,0.2)]">
          Admin_Console
        </div>
      </div>

      {/* Control Grid - Restored Round-3xl & High Contrast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Round Control */}
        <div className="bg-terminal-bg rounded-[3rem] p-10 border border-terminal-border relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-green/10 blur-[60px] rounded-full" />
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 italic">Execution Phase Control</p>
          <div className="flex items-center justify-between">
            <div className="text-white text-7xl font-black italic uppercase tracking-tighter">0{currentRound}</div>
            <div className="flex gap-4">
              <button 
                onClick={() => handleUpdateRound(currentRound - 1)} 
                disabled={loading || currentRound === 1} 
                className="w-20 h-20 bg-black border border-terminal-border text-white rounded-3xl hover:bg-white/10 disabled:opacity-10 flex items-center justify-center transition-all"
              >
                <ChevronLeft size={32}/>
              </button>
              <button 
                onClick={() => handleUpdateRound(currentRound + 1)} 
                disabled={loading || currentRound === 5} 
                className="w-20 h-20 bg-brand-green text-black rounded-3xl hover:brightness-110 shadow-xl shadow-brand-green/20 disabled:opacity-10 flex items-center justify-center transition-all"
              >
                <ChevronRight size={32}/>
              </button>
            </div>
          </div>
        </div>

        {/* Global Connectivity */}
        <div className="bg-terminal-bg rounded-[3rem] p-10 border border-terminal-border flex flex-col justify-between">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 italic">Security Engine Status</p>
          <div className="flex items-center justify-between">
            <div className="text-white text-5xl font-black italic uppercase tracking-tighter">Shield_v6.0</div>
            <Activity className="text-brand-green animate-pulse" size={48} />
          </div>
          <div className="mt-8 pt-8 border-t border-terminal-border flex justify-between items-center">
            <span className="text-brand-green font-black italic uppercase tracking-widest text-[11px]">System Integrity: Optimal</span>
            <Zap className="text-brand-green fill-brand-green" size={20} />
          </div>
        </div>
      </div>

      {/* Headline Injector - Fixed to Green/Black Aesthetic */}
      <div className="bg-terminal-bg rounded-[3rem] p-12 border border-terminal-border shadow-2xl relative">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-brand-green/10 p-5 rounded-[1.5rem] border border-brand-green/20">
            <Newspaper className="text-brand-green" size={32} />
          </div>
          <h3 className="text-white text-4xl font-black italic uppercase tracking-tight">Market Wire Injector</h3>
        </div>
        
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] ml-2 italic">Broadcast Headline</label>
            <input 
              value={newsHeadline} 
              onChange={(e) => setNewsHeadline(e.target.value)} 
              className="w-full bg-black border border-terminal-border text-white h-24 rounded-3xl text-3xl font-black italic px-8 uppercase focus:border-brand-green outline-none transition-all placeholder:text-gray-800" 
              placeholder="ENTER BREAKING NEWS..." 
            />
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {['positive', 'neutral', 'negative'].map((type) => (
              <button 
                key={type}
                onClick={() => setNewsImpact(type)} 
                className={`h-20 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] italic transition-all border-2 ${
                  newsImpact === type 
                    ? 'bg-white text-black border-white shadow-xl scale-[1.02]' 
                    : 'bg-black text-gray-700 border-terminal-border hover:border-white/20'
                }`}
              >
                {type} Impact
              </button>
            ))}
          </div>

          <button 
            disabled={newsLoading} 
            onClick={handleInjectNews} 
            className="w-full h-28 bg-brand-green hover:brightness-110 text-black font-black text-3xl italic uppercase tracking-tighter rounded-[2rem] shadow-2xl shadow-brand-green/20 flex items-center justify-center gap-4 active:scale-95 transition-all"
          >
            {newsLoading ? <Loader2 className="animate-spin" size={36} /> : "Execute Global Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}