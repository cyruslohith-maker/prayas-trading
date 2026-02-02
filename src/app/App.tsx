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
import { Activity, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
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
  
  // Lock states
  const [optionLockState, setOptionLockState] = useState('open');
  const [newsLockState, setNewsLockState] = useState('open');
  const [shortLockState, setShortLockState] = useState('open');

  // Session persistence - restore on mount
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
        setUserName(savedUser);
        setUserRole(savedRole || 'user');
        if (savedPage) setCurrentPage(savedPage);
      } else {
        // Session expired
        handleLogout();
      }
    }
  }, []);

  // Session timeout checker
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(() => {
      const loginTime = parseInt(sessionStorage.getItem('mockstock_loginTime') || '0');
      const elapsed = Date.now() - loginTime;
      const FORTY_MINS = 40 * 60 * 1000;
      
      if (elapsed > FORTY_MINS) {
        handleLogout();
        alert('Session expired. Please login again.');
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Save current page to session
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem('mockstock_currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn]);

  // Poll lock states
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const checkLocks = async () => {
      try {
        const [optLock, nLock, sLock] = await Promise.all([
          getOptionLockState(),
          getNewsLockState(),
          getShortLockState()
        ]);
        setOptionLockState(optLock);
        setNewsLockState(nLock);
        setShortLockState(sLock);
      } catch (e) {
        console.error("Lock check error:", e);
      }
    };
    
    checkLocks();
    const interval = setInterval(checkLocks, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Poll market data and round
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const loadData = async () => {
      try {
        const round = await getActiveRound();
        setActiveRound(round);
        
        const prices = await fetchMarketPrices(round);
        if (prices && prices.length > 0) {
          setMarketStocks(prices);
        }
      } catch (e) {
        console.error("Data load error:", e);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = (name: string, role: string) => {
    setIsLoggedIn(true);
    setUserName(name);
    setUserRole(role);
    setCurrentPage('market');
    
    // Save to session
    sessionStorage.setItem('mockstock_isLoggedIn', 'true');
    sessionStorage.setItem('mockstock_userName', name);
    sessionStorage.setItem('mockstock_userRole', role);
    sessionStorage.setItem('mockstock_loginTime', Date.now().toString());
    sessionStorage.setItem('mockstock_currentPage', 'market');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('user');
    setCurrentPage('market');
    
    // Clear session
    sessionStorage.removeItem('mockstock_isLoggedIn');
    sessionStorage.removeItem('mockstock_userName');
    sessionStorage.removeItem('mockstock_userRole');
    sessionStorage.removeItem('mockstock_loginTime');
    sessionStorage.removeItem('mockstock_currentPage');
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Render current page content
  const renderContent = () => {
    switch (currentPage) {
      case 'trade':
        return (
          <TradePage 
            onBack={() => setCurrentPage('market')} 
            userName={userName}
            activeRound={activeRound}
            marketStocks={marketStocks}
            optionLockState={optionLockState}
            shortLockState={shortLockState}
            userRole={userRole}
          />
        );
      case 'portfolio':
        return (
          <PortfolioPage
            onBack={() => setCurrentPage('market')}
            userName={userName}
          />
        );
      case 'options':
        return (
          <OptionChainPage 
            onBack={() => setCurrentPage('market')} 
            userName={userName}
            activeRound={activeRound}
          />
        );
      case 'news':
        return (
          <NewsPage onBack={() => setCurrentPage('market')} />
        );
      case 'broker':
        return (
          <BrokerPanel 
            onBack={() => setCurrentPage('market')} 
            userName={userName}
            userRole={userRole}
          />
        );
      case 'admin':
        return (
          <AdminPanel onBack={() => setCurrentPage('market')} />
        );
      case 'market':
      default:
        return (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Market Overview</h1>
                <p className="text-gray-400">
                  Round {activeRound} • {marketStocks.length} stocks available
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
                  <span className="text-gray-400 text-sm">Round</span>
                  <span className="text-white font-bold text-xl ml-2">{activeRound}</span>
                </div>
              </div>
            </div>

            {/* Stock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {marketStocks
                .filter(s => s.ticker && s.price > 0)
                .map((stock) => (
                  <StockCard 
                    key={stock.ticker} 
                    stock={stock} 
                    onClick={() => setCurrentPage('trade')}
                  />
                ))
              }
            </div>

            {marketStocks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Loading market data...
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <Activity className="text-green-500" size={24} />
            {!isSidebarCollapsed && <span className="font-bold text-lg">MockStock</span>}
          </div>
        </div>
        
        {/* User Profile */}
        {!isSidebarCollapsed && (
          <UserProfile userName={userName} userRole={userRole} />
        )}
        
        {/* Navigation */}
        <Navigation 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          userRole={userRole}
          newsLockState={newsLockState}
          optionLockState={optionLockState}
        />
        
        {/* Sidebar Toggle & Logout */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isSidebarCollapsed && <span>Collapse</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
