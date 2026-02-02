// @ts-nocheck
import { useState, useEffect } from 'react';
import { setRoundAction, getActiveRound, injectNews, getOptionLockState, setOptionLock, getNewsLockState, setNewsLock } from '../lib/api';
import { ArrowLeft, ChevronLeft, ChevronRight, Send, Activity, Lock, Unlock, Newspaper } from 'lucide-react';

export function AdminPanel({ onBack }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optionLockState, setOptionLockStateLocal] = useState('open');
  const [newsLockState, setNewsLockStateLocal] = useState('open');
  
  // News injection state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSource, setNewsSource] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsSending, setNewsSending] = useState(false);

  useEffect(() => {
    loadRound();
    loadOptionLockState();
    loadNewsLockState();
  }, []);

  const loadRound = async () => {
    const round = await getActiveRound();
    setCurrentRound(round || 0);
  };

  const loadOptionLockState = async () => {
    const state = await getOptionLockState();
    setOptionLockStateLocal(state || 'open');
  };

  const loadNewsLockState = async () => {
    const state = await getNewsLockState();
    setNewsLockStateLocal(state || 'open');
  };

  const handleOptionLockToggle = async () => {
    const newState = optionLockState === 'open' ? 'closed' : 'open';
    
    if (!confirm(`${newState === 'closed' ? 'LOCK' : 'UNLOCK'} option trading for traders?\n\nThis will ${newState === 'closed' ? 'hide' : 'show'} Option Chain and options trading for all traders.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await setOptionLock(newState);
      if (res.success) {
        setOptionLockStateLocal(newState);
        alert(`Option trading ${newState === 'closed' ? 'LOCKED ✗' : 'UNLOCKED ✓'} for traders`);
      } else {
        alert("Failed to update option lock");
      }
    } catch (e) {
      alert("Error updating option lock");
    } finally {
      setLoading(false);
    }
  };

  const handleNewsLockToggle = async () => {
    const newState = newsLockState === 'open' ? 'closed' : 'open';
    
    if (!confirm(`${newState === 'closed' ? 'LOCK' : 'UNLOCK'} news feed for traders?\n\nThis will ${newState === 'closed' ? 'hide' : 'show'} the News page for all traders.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await setNewsLock(newState);
      if (res.success) {
        setNewsLockStateLocal(newState);
        alert(`News feed ${newState === 'closed' ? 'LOCKED ✗' : 'UNLOCKED ✓'} for traders`);
      } else {
        alert("Failed to update news lock");
      }
    } catch (e) {
      alert("Error updating news lock");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRound = async (newRound) => {
    if (newRound < 0 || newRound > 4 || loading) return;
    
    const roundName = newRound === 0 ? 'Round 0 (Initial Portfolio)' : `Round ${newRound}`;
    
    if (!confirm(`Switch to ${roundName}?\n\nThis will:\n• Update prices for all traders\n• ${newRound === 0 ? 'Enable initial portfolio buying' : 'Enable P2P trading'}\n• Update the Backend sheet B1 cell\n\nThis affects all users.`)) return;
    
    setLoading(true);
    try {
      const res = await setRoundAction(newRound);
      if (res.success) {
        setCurrentRound(newRound);
        alert(`Successfully switched to ${roundName}`);
      } else {
        alert("Failed to update round");
      }
    } catch (e) {
      alert("Error updating round");
    } finally {
      setLoading(false);
    }
  };

  const handleInjectNews = async () => {
    if (!newsTitle || !newsContent) {
      alert("Please fill in title and content");
      return;
    }

    setNewsSending(true);
    try {
      const res = await injectNews(
        newsTitle,
        newsContent,
        newsContent,
        newsSource || 'SYSTEM'
      );
      
      if (res.success) {
        alert("News injected successfully!");
        setNewsTitle('');
        setNewsSource('');
        setNewsContent('');
      } else {
        alert("Failed to inject news");
      }
    } catch (e) {
      alert("Error injecting news");
    } finally {
      setNewsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3 mb-8">
          <Activity size={32} className="text-green-500" />
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-gray-400">System-wide controls and management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Round Control */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Round Control</h2>
            
            {/* Current Round Display */}
            <div className="bg-black border border-zinc-700 rounded-xl p-8 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-3 uppercase tracking-wide">Current Round</p>
              <div className={`text-7xl font-bold mb-4 ${currentRound === 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {currentRound}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${currentRound === 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className={`text-sm font-semibold ${currentRound === 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {currentRound === 0 ? 'INITIAL PORTFOLIO' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Round Controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => handleUpdateRound(currentRound - 1)}
                disabled={currentRound <= 0 || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  currentRound <= 0 || loading
                    ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              
              <button
                onClick={() => handleUpdateRound(currentRound + 1)}
                disabled={currentRound >= 4 || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  currentRound >= 4 || loading
                    ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Quick Round Selector - Now includes Round 0 */}
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map(round => (
                <button
                  key={round}
                  onClick={() => handleUpdateRound(round)}
                  disabled={loading}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    currentRound === round
                      ? round === 0 ? 'bg-yellow-600 text-black' : 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  R{round}
                </button>
              ))}
            </div>

            {/* Round 0 Explanation */}
            {currentRound === 0 && (
              <div className="mt-4 bg-yellow-600/10 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-500 text-sm font-semibold mb-1">Round 0: Initial Portfolio</p>
                <p className="text-gray-300 text-xs">
                  Traders buy from system at current prices. No PIN required, no P2P trading.
                </p>
              </div>
            )}

            {loading && (
              <p className="text-center text-gray-500 text-sm mt-4">Updating round...</p>
            )}
          </div>

          {/* Lock Controls */}
          <div className="space-y-8">
            {/* Option Lock Control */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Option Trading Control</h2>
              
              <div className="bg-black border border-zinc-700 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Status for Traders:</p>
                    <div className="flex items-center gap-2">
                      {optionLockState === 'open' ? (
                        <>
                          <Unlock size={20} className="text-green-500" />
                          <span className="text-green-500 font-bold">UNLOCKED</span>
                        </>
                      ) : (
                        <>
                          <Lock size={20} className="text-red-500" />
                          <span className="text-red-500 font-bold">LOCKED</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleOptionLockToggle}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    optionLockState === 'open'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {optionLockState === 'open' ? 'Lock Options' : 'Unlock Options'}
                </button>
              </div>
              
              <p className="text-gray-500 text-sm">
                {optionLockState === 'open' 
                  ? 'Option Chain and options trading are visible to all traders.'
                  : 'Option Chain and options trading are hidden from traders.'}
              </p>
            </div>

            {/* News Lock Control - NEW */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">News Feed Control</h2>
              
              <div className="bg-black border border-zinc-700 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Status for Traders:</p>
                    <div className="flex items-center gap-2">
                      {newsLockState === 'open' ? (
                        <>
                          <Newspaper size={20} className="text-green-500" />
                          <span className="text-green-500 font-bold">VISIBLE</span>
                        </>
                      ) : (
                        <>
                          <Lock size={20} className="text-red-500" />
                          <span className="text-red-500 font-bold">HIDDEN</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleNewsLockToggle}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    newsLockState === 'open'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {newsLockState === 'open' ? 'Hide News' : 'Show News'}
                </button>
              </div>
              
              <p className="text-gray-500 text-sm">
                {newsLockState === 'open' 
                  ? 'News page is visible to all traders.'
                  : 'News page is hidden from traders. Only brokers and admin can see it.'}
              </p>
            </div>
          </div>
        </div>

        {/* News Injection */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Inject News</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Headline</label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={e => setNewsTitle(e.target.value)}
                  placeholder="Breaking: Market Reaches All-Time High"
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Source</label>
                <input
                  type="text"
                  value={newsSource}
                  onChange={e => setNewsSource(e.target.value)}
                  placeholder="Economic Times"
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Content */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Content</label>
                <textarea
                  value={newsContent}
                  onChange={e => setNewsContent(e.target.value)}
                  placeholder="Enter the full news article content..."
                  rows={5}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleInjectNews}
                disabled={newsSending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  newsSending
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                <Send size={18} />
                {newsSending ? 'Sending...' : 'Inject News'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-yellow-600/10 border border-yellow-600 rounded-xl p-6">
          <h3 className="text-yellow-500 font-bold mb-2">⚠️ Admin Actions Affect All Users</h3>
          <p className="text-gray-300 text-sm">
            Round changes, lock controls, and news injections are immediately visible to all participants. 
            Use these controls responsibly and coordinate with brokers before making system-wide changes.
          </p>
        </div>
      </div>
    </div>
  );
}
