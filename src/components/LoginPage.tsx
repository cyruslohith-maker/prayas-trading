// @ts-nocheck
import { Activity, User, UserCog, Shield, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { loginUser } from '../lib/api';

export function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'broker' | 'admin' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const roleConfig = {
    user: {
      icon: User,
      label: 'Trader',
      color: 'from-brand-green to-[#008C04]',
      borderColor: 'border-brand-green',
      glow: 'shadow-brand-green/20',
    },
    broker: {
      icon: UserCog,
      label: 'Broker',
      color: 'from-brand-red to-[#CC4000]',
      borderColor: 'border-brand-red',
      glow: 'shadow-brand-red/20',
    },
    admin: {
      icon: Shield,
      label: 'Admin',
      color: 'from-white to-gray-400',
      borderColor: 'border-white',
      glow: 'shadow-white/10',
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedRole) {
      setError('SELECT TERMINAL ROLE');
      return;
    }

    if (!username || !password) {
      setError('CREDENTIALS REQUIRED');
      return;
    }

    setIsConnecting(true);

    try {
      const result = await loginUser(username, password);

      if (result && result.success) {
        // FIX: Infer Role from Username because Sheet only has 3 Columns
        let backendRole = result.role;
        
        if (!backendRole) {
          const lowerName = username.toLowerCase();
          if (lowerName.includes('admin')) {
            backendRole = 'admin';
          } else if (lowerName.includes('broker')) {
            backendRole = 'broker';
          } else {
            backendRole = 'user'; // Default to Trader (team_alpha, etc.)
          }
        }
        
        backendRole = backendRole.toLowerCase().trim();

        // Role Mismatch Guard
        if (backendRole !== selectedRole) {
           setError(`INVALID ROLE: THIS ID BELONGS TO ${backendRole.toUpperCase()}`);
           setIsConnecting(false);
           return;
        }
        
        // Success
        onLogin(username, backendRole);
      } else {
        setError('ACCESS DENIED: CHECK PASSWORD');
        setIsConnecting(false);
      }
    } catch (err) {
      console.error(err);
      setError('UPLINK FAILURE: CHECK INTERNET');
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 font-sans selection:bg-brand-green/30 text-white">
      <div className="w-full max-md max-w-md animate-in fade-in zoom-in duration-700">
        
        <div className="text-center mb-10">
          <div className="flex flex-col items-center gap-6 mb-4">
            <div className="w-20 h-20 rounded-[2rem] bg-brand-green flex items-center justify-center shadow-[0_0_50px_rgba(0,200,5,0.3)]">
              <Activity className="text-black" size={40} />
            </div>
            <h1 className="text-white text-5xl font-black italic tracking-tighter uppercase leading-none">Prayas CUCA</h1>
          </div>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] italic">Market Management System • v6.0</p>
        </div>

        <div className="space-y-6">
          <div className="bg-terminal-bg rounded-[2rem] p-8 border border-terminal-border shadow-2xl">
            <h2 className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em] mb-6 text-center italic">Assign Identity</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(roleConfig).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedRole === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isConnecting}
                    onClick={() => { setSelectedRole(key as any); setError(''); }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                      isSelected
                        ? `${config.borderColor} bg-white/5 scale-105 ${config.glow} shadow-xl`
                        : 'border-terminal-border hover:border-white/10 bg-black/20 opacity-30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                      <Icon className={key === 'admin' ? 'text-black' : 'text-white'} size={24} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-terminal-bg rounded-[2.5rem] p-10 border border-terminal-border shadow-2xl relative overflow-hidden">
            {selectedRole && (
               <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-all duration-1000 bg-gradient-to-br ${roleConfig[selectedRole].color}`} />
            )}

            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-gray-500 text-[10px] font-black uppercase ml-2 tracking-widest italic block">Authorization ID</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700" size={20} />
                  <input
                    type="text"
                    disabled={isConnecting}
                    placeholder="OPERATOR ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black border border-terminal-border text-white h-16 pl-14 rounded-2xl focus:border-white transition-all font-black italic placeholder:text-gray-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-gray-500 text-[10px] font-black uppercase ml-2 tracking-widest italic block">Access Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={isConnecting}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-terminal-border text-white h-16 px-6 rounded-2xl focus:border-white transition-all font-mono text-2xl tracking-[0.3em] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-brand-red/10 border border-brand-red/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                  <p className="text-brand-red text-[11px] font-black uppercase text-center tracking-widest italic">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedRole || isConnecting}
                className={`w-full h-20 rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.3em] italic transition-all duration-500 shadow-2xl active:scale-[0.95] flex items-center justify-center ${
                  selectedRole && !isConnecting
                    ? `bg-gradient-to-r ${roleConfig[selectedRole].color} text-white shadow-lg`
                    : 'bg-[#2A2A2A] text-gray-700 cursor-not-allowed border border-white/5'
                }`}
              >
                {isConnecting ? (
                  <Loader2 className="mr-4 animate-spin" size={24} />
                ) : (
                  <LogIn className="mr-4" size={24} />
                )}
                {isConnecting ? "ENCRYPTING..." : "Establish Secure Link"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.6em] italic">
            Made by PunkWorks, a Christ university brand • Unauthorized Access is Prohibited
          </p>
        </div>
      </div>
    </div>
  );
}