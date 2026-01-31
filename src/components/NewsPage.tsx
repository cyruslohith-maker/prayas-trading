// @ts-nocheck
import { useState, useEffect } from 'react';
import { getNews } from '../lib/api';
import { ArrowLeft, Newspaper } from 'lucide-react';

export function NewsPage({ onBack }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadNews = async () => {
    const data = await getNews();
    setNews(data || []);
    setLoading(false);
  };

  const getNewsStyle = (summary) => {
    // Determine news sentiment from summary field
    const s = (summary || '').toLowerCase();
    if (s.includes('positive') || s.includes('bullish') || s.includes('growth')) {
      return {
        border: 'border-green-600',
        titleColor: 'text-green-500'
      };
    }
    if (s.includes('negative') || s.includes('bearish') || s.includes('decline')) {
      return {
        border: 'border-red-600',
        titleColor: 'text-red-500'
      };
    }
    return {
      border: 'border-zinc-800',
      titleColor: 'text-white'
    };
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-4xl font-bold text-white mb-2">Market News</h1>
        <p className="text-gray-400 mb-8">Latest updates from the financial markets</p>

        {/* News Feed */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Loading news...
          </div>
        ) : news.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Newspaper size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No news available at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, i) => {
              const style = getNewsStyle(item.summary);
              
              return (
                <div 
                  key={i}
                  className={`bg-zinc-900 border ${style.border} rounded-xl p-6 hover:bg-zinc-800 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className={`text-lg font-bold ${style.titleColor} flex-1`}>
                      {item.title}
                    </h3>
                    <span className="text-gray-500 text-sm whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3">{item.source}</p>
                  
                  {item.content && (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
