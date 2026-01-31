// @ts-nocheck
import { useState, useEffect } from 'react';
import { setRoundAction, getActiveRound, injectNews, getOptionLockState, setOptionLock } from '../lib/api';
import { ArrowLeft, ChevronLeft, ChevronRight, Send, Activity, Lock, Unlock } from 'lucide-react';

export function AdminPanel({ onBack }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [loading, setLoading] = useState(false);
  const [optionLockState, setOptionLockState] = useState('open');
  
  // News injection state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSource, setNewsSource] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsSending, setNewsSending] = useState(false);

  useEffect(() => {
    loadRound();
    loadOptionLockState();
  }, []);

  const loadRound = async () => {
    const round = await getActiveRound();
    setCurrentRound(round || 1);
  };

  const loadOptionLockState = async () => {
    const state = await getOptionLockState();
    setOptionLockState(state || 'open');
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
        setOptionLockState(newState);
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

  const handleUpdateRound = async (newRound) => {
    if (newRound < 1 || newRound > 5 || loading) return;
    
    if (!confirm(`Switch to Round ${newRound}? This will affect all users.`)) return;
    
    setLoading(true);
    try {
      const res = await setRoundAction(newRound);
      if (res.success) {
        setCurrentRound(newRound);
        alert(`Successfully switched to Round ${newRound}`);
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
        newsContent, // summary = content for now
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
      <div className="max-w-5xl mx-auto">
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
              <div className="text-green-500 text-7xl font-bold mb-4">{currentRound}</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-500 text-sm font-semibold">ACTIVE</span>
              </div>
            </div>

            {/* Round Controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => handleUpdateRound(currentRound - 1)}
                disabled={currentRound <= 1 || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  currentRound <= 1 || loading
                    ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              
              <button
                onClick={() => handleUpdateRound(currentRound + 1)}
                disabled={currentRound >= 5 || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  currentRound >= 5 || loading
                    ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Quick Round Selector */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(round => (
                <button
                  key={round}
                  onClick={() => handleUpdateRound(round)}
                  disabled={loading}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    currentRound === round
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  R{round}
                </button>
              ))}
            </div>

            {loading && (
              <p className="text-center text-gray-500 text-sm mt-4">Updating round...</p>
            )}
          </div>

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
                        <Unlock className="text-green-500" size={20} />
                        <span className="text-green-500 font-bold text-lg">UNLOCKED</span>
                      </>
                    ) : (
                      <>
                        <Lock className="text-red-500" size={20} />
                        <span className="text-red-500 font-bold text-lg">LOCKED</span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleOptionLockToggle}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${
                    optionLockState === 'open'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {optionLockState === 'open' ? 'LOCK OPTIONS' : 'UNLOCK OPTIONS'}
                </button>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-blue-400">ℹ️ About Option Lock:</span><br/>
                When <strong>LOCKED</strong>, traders cannot:
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>See the Option Chain button in sidebar</li>
                  <li>Access the Options tab in Trade page</li>
                  <li>Trade any options</li>
                </ul>
                <br/>
                <strong className="text-green-400">Brokers and Admins are NOT affected</strong> and can always trade options.
              </p>
            </div>
          </div>

          {/* News Injection */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Inject News</h2>

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

              {/* Content */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Content</label>
                <textarea
                  value={newsContent}
                  onChange={e => setNewsContent(e.target.value)}
                  placeholder="Enter the full news article content..."
                  rows={6}
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
            Round changes and news injections are immediately visible to all participants. 
            Use these controls responsibly and coordinate with brokers before making system-wide changes.
          </p>
        </div>
      </div>
    </div>
  );
}
