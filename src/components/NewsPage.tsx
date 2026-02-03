// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getNews } from '../lib/api';

export function NewsPage({ onBack }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try { setNews(await getNews() || []); }
    catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={20} /><span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-4xl font-bold text-white">News Feed</h1><p className="text-gray-400">Latest market news</p></div>
        <button onClick={loadNews} disabled={loading} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg">
          <RefreshCw size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item, i) => (
            <div key={item.id || i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 cursor-pointer transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-white flex-1">{item.title}</h3>
                <span className="text-gray-500 text-sm ml-4 flex-shrink-0">{item.source}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">{item.date}</p>
              <p className="text-gray-300">{item.summary}</p>
              {expandedId === item.id && item.content && item.content !== item.summary && (
                <div className="mt-4 pt-4 border-t border-zinc-800"><p className="text-gray-400 text-sm">{item.content}</p></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">{loading ? 'Loading...' : 'No news available'}</div>
      )}
    </div>
  );
}
