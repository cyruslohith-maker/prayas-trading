// @ts-nocheck
import { UserProfile } from "../components/UserProfile";
import { Navigation } from "../components/Navigation";
import { StockCard } from "../components/StockCard";
import { TradePage } from "../components/TradePage";
import { PortfolioPage } from "../components/PortfolioPage";
import { LoginPage } from "../components/LoginPage";
import { NewsPage } from "../components/NewsPage";
import { OptionChainPage } from "../components/OptionChainPage";
import { BrokerPanel } from "../components/BrokerPanel";
import { AdminPanel } from "../components/AdminPanel";
import { AuctionsPage } from "../pages/AuctionsPage"; // Ensure this is imported correctly
import { Activity, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState, useEffect, useCallback } from "react"; 
import { 
  getActiveRound, 
  fetchMarketPrices, 
  getOptionLockState,
  getNewsLockState,
  getShortLockState
} from "../lib/api";

export default function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(''); 
  const [userRole, setUserRole] = useState('user');
  
  // App state
  const [marketStocks, setMarketStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState("market");
  const [activeRound, setActiveRound] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Track selected stock safely
  const [selectedTicker, setSelectedTicker] = useState(''); 
  
  // Lock states
  const [optionLockState, setOptionLockState] = useState('open');
  const [newsLockState, setNewsLockState] = useState('open');
  const [shortLockState, setShortLockState] = useState('open');

  // --- HANDLERS ---

  const handleLogin = (name: string, role: string) => {
    const safeName = name || ''; 
    const safeRole = role || 'user';
    
    setIsLoggedIn(true);
    setUserName(safeName);
    setUserRole(safeRole);
    setCurrentPage('market');
    
    sessionStorage.setItem('mockstock_isLoggedIn', 'true');
    sessionStorage.setItem('mockstock_userName', safeName);
    sessionStorage.setItem('mockstock_userRole', safeRole);
    sessionStorage.setItem('mockstock_loginTime', Date.now().toString());
    sessionStorage.setItem('mockstock_currentPage', 'market');
  };

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('user');
    setCurrentPage('market');
    setSelectedTicker('');
    
    sessionStorage.removeItem('mockstock_isLoggedIn');
    sessionStorage.removeItem('mockstock_userName');
    sessionStorage.removeItem('mockstock_userRole');
    sessionStorage.removeItem('mockstock_loginTime');
    sessionStorage.removeItem('mockstock_currentPage');
  }, []);

  const handleStockClick = (ticker) => {
    if (ticker) {
      setSelectedTicker(ticker);
      setCurrentPage('trade');
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    const savedLogin = sessionStorage.getItem('mockstock_isLoggedIn');
    const savedUser = sessionStorage.getItem('mockstock_userName');
    const savedRole = sessionStorage.getItem('mockstock_userRole');
    const savedLoginTime = sessionStorage.getItem('mockstock_loginTime');
    const savedPage = sessionStorage.getItem('mockstock_currentPage');
    
    if (savedLogin === 'true' && savedUser && savedLoginTime) {
      const elapsed = Date.now() - parseInt(savedLoginTime);
      const FORTY_MINS = 40 * 60 * 1000;
      
      if (elapsed < FORTY_MINS) {
        setIsLoggedIn(true);
        setUserName(savedUser || '');
        setUserRole(savedRole || 'user');
        
        if (savedPage === 'trade') {
          setCurrentPage('market');
        } else if (savedPage) {
          setCurrentPage(savedPage);
        }
      } else {
        handleLogout();
      }
    }
  }, [handleLogout]);

  // Session timeout
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const loginTime = parseInt(sessionStorage.getItem('mockstock_loginTime') || '0');
      if (Date.now() - loginTime > 40 * 60 * 1000) {
        handleLogout();
        alert('Session expired. Please login again.');
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, handleLogout]);

  // Save Page
  useEffect(() => {
    if (isLoggedIn && currentPage !== 'trade') {
      sessionStorage.setItem('mockstock_currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn]);

  // Poll Locks
  useEffect(() => {
    if (!isLoggedIn) return;
    const checkLocks = async () => {
      try {
        const [opt, news, short] = await Promise.all([
          getOptionLockState(), getNewsLockState(), getShortLockState()
        ]);
        setOptionLockState(opt); setNewsLockState(news); setShortLockState(short);
      } catch (e) { console.error(e); }
    };
    checkLocks();
    const interval = setInterval(checkLocks, 4000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Poll Data
  useEffect(() => {
    if (!isLoggedIn) return;
    const loadData = async () => {
      try {
        const round = await getActiveRound();
        setActiveRound(round);
        const prices = await fetchMarketPrices(round);
        if (prices && Array.isArray(prices)) setMarketStocks(prices);
      } catch (e) { console.error(e); }
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // --- RENDER ---

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  const renderContent = () => {
    switch (currentPage) {
      case 'trade':
        if (!selectedTicker) {
           setTimeout(() => setCurrentPage('market'), 0);
           return <div className="text-white p-8">Loading...</div>;
        }
        return (
          <TradePage 
            onBack={() => { setCurrentPage('market'); setSelectedTicker(''); }} 
            userName={userName || ''}
            activeRound={activeRound}
            marketStocks={marketStocks}
            optionLockState={optionLockState}
            shortLockState={shortLockState}
            userRole={userRole}
            initialStock={selectedTicker}
          />
        );
      case 'portfolio':
        return <PortfolioPage onBack={() => setCurrentPage('market')} userName={userName || ''} />;
      case 'options':
        return <OptionChainPage onBack={() => setCurrentPage('market')} userName={userName || ''} activeRound={activeRound} />;
      case 'news':
        return <NewsPage onBack={() => setCurrentPage('market')} />;
      case 'broker':
        return <BrokerPanel onBack={() => setCurrentPage('market')} userName={userName || ''} userRole={userRole} />;
      case 'admin':
        return <AdminPanel onBack={() => setCurrentPage('market')} />;
      
      // UPDATED: Auctions Page (Intel)
      case 'auctions': // or 'intel' based on your Navigation component
        return (
          <AuctionsPage 
            onBack={() => setCurrentPage('market')} 
            userName={userName || ''} 
            userRole={userRole} // Passing role for proxy bidding
          />
        );

      case 'market':
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Market Overview</h1>
                <p className="text-gray-400">Round {activeRound} • {marketStocks.length} stocks</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 flex flex-col items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Round</span>
                <span className="text-green-500 font-bold text-2xl">{activeRound}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {marketStocks
                .filter(s => s && s.ticker && s.price > 0) 
                .map((stock) => (
                  <StockCard 
                    key={stock.ticker} 
                    stock={stock} 
                    onClick={() => handleStockClick(stock.ticker)}
                  />
                ))
              }
            </div>
            
            {marketStocks.length === 0 && (
              <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                <Activity className="animate-spin text-green-500" size={32} />
                <p>Connecting...</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 z-10`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between h-16">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="bg-green-500/10 p-2 rounded-lg">
               <Activity className="text-green-500" size={20} />
            </div>
            {!isSidebarCollapsed && <span className="font-bold text-lg tracking-tight">MockStock</span>}
          </div>
        </div>
        
        {!isSidebarCollapsed && <UserProfile userName={userName || 'User'} userRole={userRole} />}
        
        <Navigation 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          userRole={userRole}
          newsLockState={newsLockState}
          optionLockState={optionLockState}
          isCollapsed={isSidebarCollapsed}
        />
        <div className="p-4 border-t border-zinc-800 space-y-2 mt-auto">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isSidebarCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-zinc-950/50">
        <div className="p-8 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
