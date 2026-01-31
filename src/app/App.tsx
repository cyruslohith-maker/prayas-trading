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
import { Activity, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { getUserBalance, getActiveRound, fetchMarketPrices, getAuctions, getOptionLockState } from "../lib/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userCapital, setUserCapital] = useState('0');
  const [marketStocks, setMarketStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState("market");
  const [activeRound, setActiveRound] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasCompletedAuction, setHasCompletedAuction] = useState(false);
  const [optionLockState, setOptionLockState] = useState('open');

  // 1. Session timeout (45 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Store login time
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) {
      localStorage.setItem('loginTime', Date.now().toString());
    }
    
    // Check every minute
    const interval = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
      const elapsed = Date.now() - loginTime;
      const FORTY_MINS = 40 * 60 * 1000;
      
      if (elapsed > FORTY_MINS) {
        handleLogout();
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

  // --- REMOVED DUPLICATE STATE DECLARATION HERE ---

  // 3. Data synchronization (Prices & Round)
  useEffect(() => {
    if (!isLoggedIn) return;
    const sync = async () => {
      try {
        const [prices, rd] = await Promise.all([
          fetchMarketPrices(),
          getActiveRound()
        ]);
        setMarketStocks(prices || []);
        setActiveRound(rd || 1);
      } catch (e) { 
        console.error("Sync error:", e); 
      }
    };
    sync();
    const interval = setInterval(sync, 5000); 
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 4. Balance Sync
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
    const interval = setInterval(syncBal, 6000); 
    return () => clearInterval(interval);
  }, [isLoggedIn, userName]);

  // --- REMOVED DUPLICATE SESSION TIMEOUT EFFECT HERE ---
  // --- REMOVED DUPLICATE OPTION LOCK EFFECT HERE ---

  // 5. Check for completed auctions
  useEffect(() => {
    if (!isLoggedIn) return;
    const checkAuctions = async () => {
      try {
        const auctions = await getAuctions();
        const now = Date.now();
        
        // Check if any auction completed in last 2 minutes
        const hasRecent = auctions.some(a => {
          if (!a.time || !a.duration) return false;
          const startTime = new Date(a.time).getTime();
          const endTime = startTime + (a.duration * 60 * 1000);
          const timeSinceEnd = now - endTime;
          return timeSinceEnd > 0 && timeSinceEnd < (2 * 60 * 1000); // 0-2 minutes after end
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

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('user');
      setCurrentPage('market');
      localStorage.removeItem('loginTime'); // Clear session timer
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={(name, role) => { 
      setUserName(name.toLowerCase().trim()); 
      setUserRole(role); 
      setIsLoggedIn(true);
      if (role === 'admin') setCurrentPage('admin');
      else if (role === 'broker') setCurrentPage('broker');
      else setCurrentPage('market');
    }} />;
  }

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

        {/* User Profile */}
        {!isSidebarCollapsed && (
          <UserProfile name={userName} cash={userCapital} role={userRole} />
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
            onClick={handleLogout}
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
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
              {activeRound}
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
                <p className="text-gray-400">Live market prices and performance</p>
              </div>

              {/* Stocks Section */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4">Stocks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {marketStocks.length > 0 ? (
                    marketStocks
                      .filter(s => !s.ticker.includes('GOLD') && !s.ticker.includes('COPPER'))
                      .map((s, i) => (
                        <StockCard key={i} ticker={s.ticker} price={s.price} change={s.change} />
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
                        <StockCard key={i} ticker={s.ticker} price={s.price} change={s.change} />
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
          {currentPage === "news" && <NewsPage onBack={() => setCurrentPage('market')} />}
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