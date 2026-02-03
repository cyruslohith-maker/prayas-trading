// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Newspaper } from 'lucide-react';
import { getNews } from '../lib/api';

export function NewsPage({ onBack }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 7000);
    return () => clearInterval(interval);
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNews(data || []);
    } catch (e) {
      console.error('Error loading news:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Market News</h1>
          <p className="text-gray-400">Stay updated with the latest market news</p>
        </div>
        <button
          onClick={loadNews}
          disabled={loading}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RefreshCw size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {news.length > 0 ? (
          news.map((item, i) => (
            <div
              key={item.id || i}
              onClick={() => setSelectedNews(selectedNews === i ? null : i)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="bg-green-600/20 p-3 rounded-lg">
                  <Newspaper size={24} className="text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-500 text-sm font-medium">{item.source}</span>
                    <span className="text-gray-500 text-sm">{item.date}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.summary}</p>
                  
                  {selectedNews === i && item.content && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-gray-300">{item.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            {loading ? 'Loading news...' : 'No news available'}
          </div>
        )}
      </div>
    </div>
  );
}
