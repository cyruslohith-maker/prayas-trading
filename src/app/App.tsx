// @ts-nocheck
import { UserProfile } from "../components/UserProfile";
import { Navigation } from "../components/Navigation";
import { StockCard } from "../components/StockCard";
import { TradePage } from "../components/TradePage";
import { LoginPage } from "../components/LoginPage";
import { NewsPage } from "../components/NewsPage";
import { OptionChainPage } from "../components/OptionChainPage";
import { IntelPage } from "../components/IntelPage";
import { BrokerPanel } from "../components/BrokerPanel";
import { AdminPanel } from "../components/AdminPanel";
import { BlockDealsPanel } from "../components/BlockDealsPanel";
import { PortfolioPage } from "../components/PortfolioPage";
import { Activity, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  getUserBalance, 
  getActiveRound, 
  fetchMarketPrices, 
  getAuctions, 
  getOptionLockState,
  getNewsLockState,
  getShortLockState,
  getCurrentCashBalance,
  getStartingCapital
} from "../lib/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userCapital, setUserCapital] = useState(0);
  const [startingCapital, setStartingCapital] = useState(10000000);
  const [marketStocks, setMarketStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState("market");
  const [activeRound, setActiveRound] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasCompletedAuction, setHasCompletedAuction] = useState(false);
  const [optionLockState, setOptionLockState] = useState('open');
  const [newsLockState, setNewsLockState] = useState('open');
  const [shortLockState, setShortLockState] = useState('open');

  // Session persistence
  useEffect(() => {
    const savedLogin = localStorage.getItem('mockstock_isLoggedIn');
    const savedUser = localStorage.getItem('mockstock_userName');
    const savedRole = localStorage.getItem('mockstock_userRole');
    const savedTime = localStorage.getItem('mockstock_loginTime');
    
    if (savedLogin === 'true' && savedUser && savedTime) {
      const elapsed = Date.now() - parseInt(savedTime);
      const FORTY_MINS = 40 * 60 * 1000;
      
      if (elapsed < FORTY_MINS) {
        setIsLoggedIn(true);
        setUserName(savedUser);
        setUserRole(savedRole || 'user');
      } else {
        handleLogout();
      }
    }
  }, []);

  // Session timeout check
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('mockstock_loginTime') || '0');
      const elapsed = Date.now() - loginTime;
      const FORTY_MINS = 40 * 60 * 1000;
      
      if (elapsed > FORTY_MINS) {
        handleLogout();
        alert('Session expired. Please login again.');
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Poll lock states
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const checkLocks = async () => {
      try {
        const [optLock, newsLock, shortLock] = await Promise.all([
          getOptionLockState(),
          getNewsLockState(),
          getShortLockState()
        ]);
        setOptionLockState(optLock);
        setNewsLockState(newsLock);
        setShortLockState(shortLock);
      } catch (e) {
        console.error("Lock check error:", e);
      }
    };
    
    checkLocks();
    const interval = setInterval(checkLocks, 3000);
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
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Poll user balance
  useEffect(() => {
    if (!isLoggedIn || userRole !== 'user') return;
    
    const loadBalance = async () => {
      try {
        const [balance, starting] = await Promise.all([
          getCurrentCashBalance(userName),
          getStartingCapital()
        ]);
        setUserCapital(balance);
        setStartingCapital(starting);
      } catch (e) {
        console.error("Balance load error:", e);
      }
    };
    
    loadBalance();
    const interval = setInterval(loadBalance, 4000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userName, userRole]);

  const handleLogin = (name, role) => {
    setIsLoggedIn(true);
    setUserName(name.toLowerCase().trim());
    setUserRole(role);
    setCurrentPage('market');
    
    localStorage.setItem('mockstock_isLoggedIn', 'true');
    localStorage.setItem('mockstock_userName', name.toLowerCase().trim());
    localStorage.setItem('mockstock_userRole', role);
    localStorage.setItem('mockstock_loginTime', Date.now().toString());
    
    if (role === 'admin') setCurrentPage('admin');
    else if (role === 'broker') setCurrentPage('broker');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('user');
    setCurrentPage('market');
    
    localStorage.removeItem('mockstock_isLoggedIn');
    localStorage.removeItem('mockstock_userName');
    localStorage.removeItem('mockstock_userRole');
    localStorage.removeItem('mockstock_loginTime');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black flex">
      
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-black border-r border-zinc-800 flex flex-col h-screen sticky top-0 transition-all duration-300`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity size={24} className="text-white" />
            </div>
            {!isSidebarCollapsed && (
              <h1 className="text-xl font-bold text-white">
                Prayas <span className="text-green-600">CUCA</span>
              </h1>
            )}
          </div>
        </div>

        {/* User Profile */}
        {!isSidebarCollapsed && (
          <UserProfile 
            name={userName} 
            cash={userCapital} 
            startingCapital={startingCapital}
            role={userRole} 
          />
        )}
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <Navigation 
            activeItem={currentPage} 
            onNavigate={setCurrentPage} 
            userRole={userRole}
            isCollapsed={isSidebarCollapsed}
            hasCompletedAuction={hasCompletedAuction}
            optionLockState={optionLockState}
            newsLockState={newsLockState}
            shortLockState={shortLockState}
          />
          
          {/* Collapse Button */}
          <div className={`${isSidebarCollapsed ? 'px-2' : 'px-4'} mt-4`}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : (
                <>
                  <ChevronLeft size={20} />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-zinc-800">
          {(userRole === 'broker' || userRole === 'admin') && (
            <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
              <button
                onClick={() => setCurrentPage(userRole === 'admin' ? 'admin' : 'broker')}
                className={`w-full ${isSidebarCollapsed ? 'p-3' : 'px-4 py-3'} bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-colors flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}
              >
                {isSidebarCollapsed ? (userRole === 'admin' ? 'A' : 'B') : (userRole === 'admin' ? 'Admin Panel' : 'Broker Panel')}
              </button>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full ${isSidebarCollapsed ? 'p-4' : 'px-4 py-4'} flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors`}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-black min-h-screen overflow-y-auto">
        
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-black border-b border-zinc-800 px-8 py-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Active Round</span>
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
              {activeRound}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          
          {/* Market Watch */}
          {currentPage === "market" && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Market Watch</h1>
                <p className="text-gray-400">Live market prices • Click any stock to trade</p>
              </div>

              {/* Stocks Section */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4">Stocks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {marketStocks.length > 0 ? (
                    marketStocks
                      .filter(s => s.ticker && !s.ticker.includes('GOLD') && !s.ticker.includes('COPPER'))
                      .map((s, i) => (
                        <StockCard 
                          key={i} 
                          ticker={s.ticker} 
                          price={s.price} 
                          change={s.change}
                          onClick={() => setCurrentPage('trade')}
                        />
                      ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-gray-500">
                      Loading market data...
                    </div>
                  )}
                </div>
              </div>

              {/* Commodities Section */}
              {marketStocks.some(s => s.ticker && (s.ticker.includes('GOLD') || s.ticker.includes('COPPER'))) && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Commodities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {marketStocks
                      .filter(s => s.ticker && (s.ticker.includes('GOLD') || s.ticker.includes('COPPER')))
                      .map((s, i) => (
                        <StockCard 
                          key={i} 
                          ticker={s.ticker} 
                          price={s.price} 
                          change={s.change}
                          onClick={() => setCurrentPage('trade')}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentPage === "trade" && (
            <TradePage 
              onBack={() => setCurrentPage('market')} 
              userName={userName} 
              activeRound={activeRound}
              marketStocks={marketStocks}
              optionLockState={optionLockState}
              shortLockState={shortLockState}
              userRole={userRole}
            />
          )}
          
          {currentPage === "portfolio" && (
            <PortfolioPage onBack={() => setCurrentPage('market')} userName={userName} />
          )}
          
          {currentPage === "options" && (
            <OptionChainPage onBack={() => setCurrentPage('market')} activeRound={activeRound} />
          )}
          
          {currentPage === "news" && (
            <NewsPage onBack={() => setCurrentPage('market')} />
          )}
          
          {currentPage === "intel" && (
            <IntelPage onBack={() => setCurrentPage('market')} userName={userName} userRole={userRole} marketStocks={marketStocks} />
          )}
          
          {currentPage === "broker" && (
            <BrokerPanel onBack={() => setCurrentPage('market')} userName={userName} userRole={userRole} />
          )}
          
          {currentPage === "blockdeals" && (
            <BlockDealsPanel onBack={() => setCurrentPage('market')} />
          )}
          
          {currentPage === "admin" && (
            <AdminPanel onBack={() => setCurrentPage('market')} />
          )}
        </div>
      </main>
    </div>
  );
}
