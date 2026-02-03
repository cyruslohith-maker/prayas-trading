// @ts-nocheck
import { BarChart3, ArrowLeftRight, TrendingUp, Newspaper, Lightbulb, Briefcase } from 'lucide-react';

export function Navigation({ activeItem, onNavigate, userRole, isCollapsed, hasCompletedAuction, optionLockState, newsLockState, shortLockState }) {
  const isAdminOrBroker = userRole === 'admin' || userRole === 'broker';
  const showOptionChain = optionLockState === 'open' || isAdminOrBroker;
  const showNews = newsLockState === 'open' || isAdminOrBroker;
  
  const items = [
    { id: 'market', label: 'Market', icon: BarChart3, show: true },
    { id: 'trade', label: 'Trade', icon: ArrowLeftRight, show: true },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, show: userRole === 'user' },
    ...(showOptionChain ? [{ id: 'options', label: 'Option Chain', icon: TrendingUp, show: true }] : []),
    ...(showNews ? [{ id: 'news', label: 'News', icon: Newspaper, show: true }] : []),
    { id: 'intel', label: 'Intel', icon: Lightbulb, showDot: hasCompletedAuction, show: true }
  ].filter(item => item.show);

  return (
    <nav className={`space-y-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)} title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all relative ${
              isActive ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
            }`}>
            <Icon size={20} />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            {item.showDot && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </button>
        );
      })}
    </nav>
  );
}
