// @ts-nocheck
import { useState } from 'react';
import { Activity } from 'lucide-react';
import { loginUser } from '../lib/api';

export function LoginPage({ onLogin }) {
  const [userName, setUserName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await loginUser(userName, pin);
      if (result.success) {
        onLogin(userName, result.role || 'user');
      } else {
        setError('Invalid credentials');
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Prayas <span className="text-green-600">CUCA</span>
          </h1>
          <p className="text-gray-500">Mock Stock Trading Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Team ID</label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="team_alpha" 
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-green-600 focus:outline-none" required />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">PIN</label>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" 
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-green-600 focus:outline-none" required />
          </div>

          {error && <div className="mb-6 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400 text-sm">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-colors">
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">Mega Event</p>
      </div>
    </div>
  );
}
