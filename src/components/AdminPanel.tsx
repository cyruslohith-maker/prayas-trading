// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Send, Lock, Unlock } from 'lucide-react';
import { 
  getActiveRound, 
  setRoundAction,
  getOptionLockState,
  setOptionLock,
  getNewsLockState,
  setNewsLock,
  getShortLockState,
  setShortLock,
  injectNews
} from '../lib/api';

export function AdminPanel({ onBack }) {
  const [activeRound, setActiveRoundState] = useState(0);
  const [optionLock, setOptionLockState] = useState('open');
  const [newsLock, setNewsLockState] = useState('open');
  const [shortLock, setShortLockState] = useState('open');
  const [loading, setLoading] = useState(false);
  
  // News injection
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsSource, setNewsSource] = useState('SYSTEM');
  
  useEffect(() => {
    loadStates();
    const interval = setInterval(loadStates, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStates = async () => {
    try {
      const [round, optLock, nLock, sLock] = await Promise.all([
        getActiveRound(),
        getOptionLockState(),
        getNewsLockState(),
        getShortLockState()
      ]);
      setActiveRoundState(round);
      setOptionLockState(optLock);
      setNewsLockState(nLock);
      setShortLockState(sLock);
    } catch (e) {
      console.error('Error loading states:', e);
    }
  };

  const handleSetRound = async (round: number) => {
    setLoading(true);
    try {
      await setRoundAction(round);
      setActiveRoundState(round);
      alert(`✅ Round set to ${round}`);
    } catch (e) {
      alert('❌ Failed to set round');
    } finally {
      setLoading(false);
    }
  };

  const toggleOptionLock = async () => {
    const newState = optionLock === 'open' ? 'closed' : 'open';
    try {
      await setOptionLock(newState);
      setOptionLockState(newState);
    } catch (e) {
      alert('❌ Failed to toggle option lock');
    }
  };

  const toggleNewsLock = async () => {
    const newState = newsLock === 'open' ? 'closed' : 'open';
    try {
      await setNewsLock(newState);
      setNewsLockState(newState);
    } catch (e) {
      alert('❌ Failed to toggle news lock');
    }
  };

  const toggleShortLock = async () => {
    const newState = shortLock === 'open' ? 'closed' : 'open';
    try {
      await setShortLock(newState);
      setShortLockState(newState);
    } catch (e) {
      alert('❌ Failed to toggle short lock');
    }
  };

  const handleInjectNews = async () => {
    if (!newsTitle || !newsSummary) {
      alert('Please enter title and summary');
      return;
    }
    
    setLoading(true);
    try {
      await injectNews(newsTitle, newsSummary, newsContent || newsSummary, newsSource);
      alert('✅ News injected successfully');
      setNewsTitle('');
      setNewsSummary('');
      setNewsContent('');
    } catch (e) {
      alert('❌ Failed to inject news');
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

      <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
      <p className="text-gray-400 mb-8">Control rounds, locks, and inject news</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Round Control */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Round Control</h2>
            <button onClick={loadStates} className="p-2 hover:bg-zinc-800 rounded">
              <RefreshCw size={16} className="text-gray-400" />
            </button>
          </div>
          
          <div className="mb-4">
            <span className="text-gray-400">Current Round: </span>
            <span className="text-2xl font-bold text-green-500">{activeRound}</span>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map(round => (
              <button
                key={round}
                onClick={() => handleSetRound(round)}
                disabled={loading}
                className={`py-3 rounded-lg font-bold transition-colors ${
                  activeRound === round
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {round}
              </button>
            ))}
          </div>
        </div>

        {/* Lock Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Lock Controls</h2>
          
          <div className="space-y-4">
            {/* Option Lock */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Options Trading</p>
                <p className="text-gray-500 text-sm">
                  {optionLock === 'open' ? 'Traders can access options' : 'Options hidden from traders'}
                </p>
              </div>
              <button
                onClick={toggleOptionLock}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  optionLock === 'open'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {optionLock === 'open' ? <Unlock size={16} /> : <Lock size={16} />}
                {optionLock === 'open' ? 'OPEN' : 'LOCKED'}
              </button>
            </div>

            {/* News Lock */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div>
                <p className="text-white font-medium">News Feed</p>
                <p className="text-gray-500 text-sm">
                  {newsLock === 'open' ? 'News visible to traders' : 'News hidden from traders'}
                </p>
              </div>
              <button
                onClick={toggleNewsLock}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  newsLock === 'open'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {newsLock === 'open' ? <Unlock size={16} /> : <Lock size={16} />}
                {newsLock === 'open' ? 'OPEN' : 'LOCKED'}
              </button>
            </div>

            {/* Short Lock */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Short Selling</p>
                <p className="text-gray-500 text-sm">
                  {shortLock === 'open' ? 'Short tab visible to traders' : 'Short tab hidden from traders'}
                </p>
              </div>
              <button
                onClick={toggleShortLock}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  shortLock === 'open'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {shortLock === 'open' ? <Unlock size={16} /> : <Lock size={16} />}
                {shortLock === 'open' ? 'OPEN' : 'LOCKED'}
              </button>
            </div>
          </div>
        </div>

        {/* News Injection */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Inject News</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Breaking: Market Update..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Source</label>
                <input
                  type="text"
                  value={newsSource}
                  onChange={(e) => setNewsSource(e.target.value)}
                  placeholder="SYSTEM"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Summary</label>
              <input
                type="text"
                value={newsSummary}
                onChange={(e) => setNewsSummary(e.target.value)}
                placeholder="Brief summary of the news..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Content (optional)</label>
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Full news content..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>
            
            <button
              onClick={handleInjectNews}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Send size={18} />
              Publish News
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
