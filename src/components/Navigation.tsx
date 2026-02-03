// @ts-nocheck
import { 
  TrendingUp, 
  ArrowRightLeft, 
  Briefcase,
  Newspaper, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  Gavel
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string;
  newsLockState: string;
  optionLockState: string;
}

export function Navigation({ currentPage, onNavigate, userRole, newsLockState, optionLockState }: NavigationProps) {
  const isAdmin = userRole === 'admin';
  const isBroker = userRole === 'broker';
  const isTrader = userRole === 'user';
  
  // Traders can't see News when locked (unless admin/broker)
  const showNews = newsLockState === 'open' || isAdmin || isBroker;

  const navItems = [
    { id: 'market', label: 'Market', icon: TrendingUp, show: true },
    { id: 'trade', label: 'Trade', icon: ArrowRightLeft, show: isTrader || isAdmin || isBroker },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, show: isTrader },
    { id: 'options', label: 'Options', icon: BarChart3, show: isTrader || isAdmin || isBroker },
    { id: 'news', label: 'News', icon: Newspaper, show: showNews },
    { id: 'auction', label: 'Auction', icon: Gavel, show: true },
    { id: 'broker', label: 'Broker Panel', icon: ShieldCheck, show: isBroker || isAdmin },
    { id: 'admin', label: 'Admin Panel', icon: Settings, show: isAdmin },
  ];

  return (
    <nav className="flex-1 p-4">
      <ul className="space-y-1">
        {navItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-green-600/20 text-green-500 border border-green-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
