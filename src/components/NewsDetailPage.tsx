// @ts-nocheck
import { ArrowLeft, Calendar, Tag, Zap, ShieldCheck, FileText, AlertTriangle, Info } from 'lucide-react';

export function NewsDetailPage({ article, onBack }) {

  // Helper for Impact Coloring
  const getImpactColor = (impact) => {
    const i = String(impact || '').toLowerCase();
    if (i.includes('high') || i.includes('critical')) return 'text-brand-red';
    if (i.includes('medium') || i.includes('moderate')) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getImpactLabel = (impact) => {
    return impact || "General Update";
  };

  return (
    <div className="max-w-5xl mx-auto animate-in zoom-in duration-500 pb-20">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-4 text-gray-500 hover:text-brand-green transition-all group"
        >
          <div className="bg-terminal-bg p-4 rounded-2xl border border-terminal-border group-hover:border-brand-green">
            <ArrowLeft size={24} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Back to News Wire</span>
        </button>

        <div className="bg-brand-green/10 border border-brand-green/20 px-6 py-3 rounded-2xl flex items-center gap-3">
          <Zap size={16} className="text-brand-green fill-brand-green" />
          <span className="text-brand-green text-[10px] font-black uppercase tracking-widest italic">Live Transmission</span>
        </div>
      </div>

      {/* Article Header - Rounded-[2.5rem] Top Container */}
      <div className="bg-terminal-bg border border-terminal-border rounded-t-[3rem] p-12 pb-8 border-b-0">
        <h1 className="text-white text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-10 border-l-8 border-brand-green pl-8">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-8 border-t border-terminal-border pt-8">
          <div className="flex items-center gap-3">
            <Calendar className="text-brand-green" size={16} />
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] italic">{article.date || "Today"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Tag className="text-brand-green" size={16} />
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic">{article.source || "System"}</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="text-brand-green" size={16} />
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] italic">REF: {(article.id || "000").slice(-8)}</span>
          </div>
        </div>
      </div>

      {/* Article Body - Rounded-b-[3rem] */}
      <div className="bg-terminal-bg border border-terminal-border rounded-b-[3rem] p-12 pt-0 shadow-2xl relative">
        <div className="space-y-10">
          
          {/* Executive Summary Block */}
          <div className="bg-black/40 rounded-[2rem] p-8 border border-terminal-border border-l-brand-green border-l-4 shadow-inner">
            <p className="text-white text-xl font-black italic uppercase tracking-tight leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Full Intelligence Content */}
          <div className="bg-black/20 p-10 rounded-[2.5rem] border border-terminal-border/50">
            <p className="text-gray-300 text-lg leading-loose font-medium italic whitespace-pre-wrap">
              {article.content || "No additional details provided in this briefing."}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-terminal-border">
            <div className="bg-black/40 p-6 rounded-2xl border border-brand-green/10 flex items-center gap-4">
              <ShieldCheck className="text-brand-green" size={24} />
              <div>
                <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest italic">Node Authentication</p>
                <p className="text-brand-green text-[11px] font-black uppercase italic">Verified Source Active</p>
              </div>
            </div>
            
            {/* Dynamic Impact Block */}
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex items-center gap-4">
              {String(article.impact || '').toLowerCase().includes('high') ? (
                 <AlertTriangle className={getImpactColor(article.impact)} size={24} />
              ) : (
                 <Info className={getImpactColor(article.impact)} size={24} />
              )}
              <div>
                <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest italic">Asset Impact Forecast</p>
                <p className={`text-[11px] font-black uppercase italic ${getImpactColor(article.impact)}`}>
                  {getImpactLabel(article.impact)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 py-10 text-center border-t border-terminal-border">
          <p className="text-gray-800 text-[10px] font-black uppercase tracking-[0.6em] italic">
            Institutional Wire • Authorized Access Only • Prayas Exchange Network
          </p>
      </div>
    </div>
  );
}