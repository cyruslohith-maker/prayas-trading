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
import { Activity, ChevronLeft, ChevronRight, LogOut, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { 
  getUserBalance, 
  getActiveRound, 
  fetchMarketPrices, 
  getStockPricesForRound,
  getAuctions, 
  getOptionLockState,
  getNewsLockState,
  getCurrentCashBalance
} from "../lib/api";

// Session storage keys
const SESSION_KEYS = {
  isLoggedIn: 'mockstock_isLoggedIn',
  userName: 'mockstock_userName',
  userRole: 'mockstock_userRole',
  loginTime: 'mockstock_loginTime',
  currentPage: 'mockstock_currentPage',
  formState: 'mockstock_formState'
};

export default function App() {
  // Initialize state from sessionStorage for persistence
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_KEYS.isLoggedIn);
    return saved === 'true';
  });
  const [userName, setUserName] = useState(() => {
    return sessionStorage.getItem(SESSION_KEYS.userName) || '';
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem(SESSION_KEYS.userRole) || 'user';
  });
  const [userCapital, setUserCapital] = useState('0');
  const [currentCashBalance, setCurrentCashBalance] = useState(0);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [marketStocks, setMarketStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(() => {
    return sessionStorage.getItem(SESSION_KEYS.currentPage) || 'market';
  });
  const [activeRound, setActiveRound] = useState(0);
  const [previousRound, setPreviousRound] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasCompletedAuction, setHasCompletedAuction] = useState(false);
  const [optionLockState, setOptionLockState] = useState('open');
  const [newsLockState, setNewsLockState] = useState('open');

  // Persist login state
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEYS.isLoggedIn, isLoggedIn.toString());
    sessionStorage.setItem(SESSION_KEYS.userName, userName);
    sessionStorage.setItem(SESSION_KEYS.userRole, userRole);
    sessionStorage.setItem(SESSION_KEYS.currentPage, currentPage);
  }, [isLoggedIn, userName, userRole, currentPage]);

  // 1. Session timeout (40 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Check/set login time
    let loginTime = sessionStorage.getItem(SESSION_KEYS.loginTime);
    if (!loginTime) {
      loginTime = Date.now().toString();
      sessionStorage.setItem(SESSION_KEYS.loginTime, loginTime);
    }
    
    // Check every minute
    const interval = setInterval(() => {
      const storedLoginTime = parseInt(sessionStorage.getItem(SESSION_KEYS.loginTime) || '0');
      const elapsed = Date.now() - storedLoginTime;
      const FORTY_MINS = 40 * 60 * 1000;
      
      if (elapsed > FORTY_MINS) {
        handleLogout(true);
        alert('Session expired. Please login again.');
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 2. Poll option lock state
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const checkOptionLock = async () => {
      try {
        const state = await getOptionLockState();
        setOptionLockState(state);
      } catch (e) {
        console.error("Option lock check error:", e);
      }
    };
    
    checkOptionLock();
    const interval = setInterval(checkOptionLock, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 2b. Poll news lock state
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const checkNewsLock = async () => {
      try {
        const state = await getNewsLockState();
        setNewsLockState(state);
      } catch (e) {
        console.error("News lock check error:", e);
      }
    };
    
    checkNewsLock();
    const interval = setInterval(checkNewsLock, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 3. Data synchronization (Prices & Round) - with round-based price updates
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const sync = async () => {
      try {
        const rd = await getActiveRound();
        const newRound = rd || 0;
        
        // Check if round changed
        if (newRound !== previousRound) {
          setPreviousRound(newRound);
          // Fetch prices for new round
          const prices = await getStockPricesForRound(newRound);
          if (prices && prices.length > 0) {
            setMarketStocks(prices);
          }
        } else {
          // Regular price fetch
          const prices = await fetchMarketPrices(newRound);
          if (prices && prices.length > 0) {
            setMarketStocks(prices);
          }
        }
        
        setActiveRound(newRound);
      } catch (e) { 
        console.error("Sync error:", e); 
      }
    };
    
    sync();
    const interval = setInterval(sync, 5000); 
    return () => clearInterval(interval);
  }, [isLoggedIn, previousRound]);

  // 4. Balance Sync - Initial capital
  useEffect(() => {
    if (!isLoggedIn || !userName) return;
    const syncBal = async () => {
      try {
        const bal = await getUserBalance(userName);
        setUserCapital(bal.toString());
      } catch (e) {
        console.error("Balance sync error:", e);
      }
    };
    syncBal();
  }, [isLoggedIn, userName]);

  // 4b. Current Cash Balance Sync
  useEffect(() => {
    if (!isLoggedIn || !userName || userRole === 'broker' || userRole === 'admin') return;
    
    const syncCashBalance = async () => {
      try {
        const balance = await getCurrentCashBalance(userName);
        setCurrentCashBalance(balance);
      } catch (e) {
        console.error("Cash balance sync error:", e);
      }
    };
    
    syncCashBalance();
    const interval = setInterval(syncCashBalance, 6000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userName, userRole]);

  // Manual refresh cash balance
  const handleRefreshBalance = useCallback(async () => {
    if (isRefreshingBalance) return;
    setIsRefreshingBalance(true);
    try {
      const balance = await getCurrentCashBalance(userName);
      setCurrentCashBalance(balance);
    } catch (e) {
      console.error("Balance refresh error:", e);
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [userName, isRefreshingBalance]);

  // 5. Check for completed auctions
  useEffect(() => {
    if (!isLoggedIn) return;
    const checkAuctions = async () => {
      try {
        const auctions = await getAuctions();
        const now = Date.now();
        
        const hasRecent = auctions.some(a => {
          if (!a.time || !a.duration) return false;
          const startTime = new Date(a.time).getTime();
          const endTime = startTime + (a.duration * 60 * 1000);
          const timeSinceEnd = now - endTime;
          return timeSinceEnd > 0 && timeSinceEnd < (2 * 60 * 1000);
        });
        
        setHasCompletedAuction(hasRecent);
      } catch (e) {
        console.error("Auction check error:", e);
      }
    };
    checkAuctions();
    const interval = setInterval(checkAuctions, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = (silent = false) => {
    if (!silent && !confirm("Are you sure you want to logout?")) return;
    
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('user');
    setCurrentPage('market');
    setCurrentCashBalance(0);
    
    // Clear all session data
    Object.values(SESSION_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  };

  const handleLogin = (name, role) => {
    const normalizedName = name.toLowerCase().trim();
    setUserName(normalizedName);
    setUserRole(role);
    setIsLoggedIn(true);
    
    // Set login time
    sessionStorage.setItem(SESSION_KEYS.loginTime, Date.now().toString());
    
    // Navigate based on role
    if (role === 'admin') setCurrentPage('admin');
    else if (role === 'broker') setCurrentPage('broker');
    else setCurrentPage('market');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Check if news should be visible for this user
  const showNews = newsLockState === 'open' || userRole === 'broker' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-black flex">
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-80'
        } bg-black border-r border-zinc-800 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}
      >
        
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

        {/* User Profile with Cash Balance */}
        {!isSidebarCollapsed && (
          <UserProfile 
            name={userName} 
            cash={userCapital} 
            role={userRole}
            currentCashBalance={currentCashBalance}
            onRefreshBalance={handleRefreshBalance}
            isRefreshing={isRefreshingBalance}
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
          />
          
          {/* Collapse/Expand Button */}
          <div className={`${isSidebarCollapsed ? 'px-2' : 'px-4'} mt-4`}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <>
                  <ChevronLeft size={20} />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Section - Panel Buttons + Logout */}
        <div className="border-t border-zinc-800">
          {/* Panel Access Buttons */}
          {(userRole === 'broker' || userRole === 'admin') && (
            <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} space-y-2`}>
              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors"
                >
                  {isSidebarCollapsed ? 'A' : 'Open Admin Panel'}
                </button>
              )}
              <button
                onClick={() => setCurrentPage('broker')}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg transition-colors"
              >
                {isSidebarCollapsed ? 'B' : 'Broker Panel'}
              </button>
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={() => handleLogout(false)}
            className={`w-full ${isSidebarCollapsed ? 'p-4' : 'px-4 py-4'} flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-3'
            } text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors`}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-black min-h-screen overflow-y-auto">
        
        {/* Top Bar with Round Display */}
        <div className="sticky top-0 z-10 bg-black border-b border-zinc-800 px-8 py-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Active Round</span>
            <div className={`${activeRound === 0 ? 'bg-yellow-600' : 'bg-green-600'} text-white px-4 py-2 rounded-lg font-bold text-lg`}>
              {activeRound === 0 ? 'Round 0 (Initial)' : activeRound}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* Market Watch Page */}
          {currentPage === "market" && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Market Watch</h1>
                <p className="text-gray-400">
                  {activeRound === 0 
                    ? 'Round 0: Build your initial portfolio by buying from the system'
                    : 'Live market prices and performance'
                  }
                </p>
              </div>

              {/* Round 0 Info Banner */}
              {activeRound === 0 && userRole === 'user' && (
                <div className="bg-yellow-600/10 border border-yellow-600 rounded-xl p-6 mb-8">
                  <h3 className="text-yellow-500 font-bold mb-2">📢 Round 0: Initial Portfolio Purchase</h3>
                  <p className="text-gray-300 text-sm">
                    This is the initial round. You can buy stocks from the system at current prices to build your portfolio.
                    No PIN is required, and no trading between teams is allowed in this round.
                  </p>
                </div>
              )}

              {/* Stocks Section */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4">Stocks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {marketStocks.length > 0 ? (
                    marketStocks
                      .filter(s => !s.ticker.includes('GOLD') && !s.ticker.includes('COPPER'))
                      .map((s, i) => (
                        <StockCard 
                          key={i} 
                          ticker={s.ticker} 
                          price={s.price} 
                          change={s.change}
                          previousPrice={s.previousPrice}
                        />
                      ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-gray-500">
                      PunkWorks System: Loading market data...
                    </div>
                  )}
                </div>
              </div>

              {/* Commodities Section */}
              {marketStocks.some(s => s.ticker.includes('GOLD') || s.ticker.includes('COPPER')) && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Commodities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {marketStocks
                      .filter(s => s.ticker.includes('GOLD') || s.ticker.includes('COPPER'))
                      .map((s, i) => (
                        <StockCard 
                          key={i} 
                          ticker={s.ticker} 
                          price={s.price} 
                          change={s.change}
                          previousPrice={s.previousPrice}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Pages */}
          {currentPage === "trade" && (
            <TradePage 
              onBack={() => setCurrentPage('market')} 
              userName={userName} 
              activeRound={activeRound}
              marketStocks={marketStocks}
              optionLockState={optionLockState}
              userRole={userRole}
            />
          )}
          {currentPage === "options" && <OptionChainPage onBack={() => setCurrentPage('market')} activeRound={activeRound} />}
          {currentPage === "news" && showNews && <NewsPage onBack={() => setCurrentPage('market')} />}
          {currentPage === "intel" && (
            <IntelPage 
              onBack={() => setCurrentPage('market')} 
              userName={userName} 
              userRole={userRole}
              marketStocks={marketStocks}
            />
          )}
          {currentPage === "broker" && <BrokerPanel onBack={() => setCurrentPage('market')} userName={userName} />}
          {currentPage === "blockdeals" && <BlockDealsPanel onBack={() => setCurrentPage('market')} />}
          {currentPage === "admin" && <AdminPanel onBack={() => setCurrentPage('market')} />}
        </div>
      </main>
    </div>
  );
}