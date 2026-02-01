// @ts-nocheck
import { BarChart3, ArrowLeftRight, TrendingUp, Newspaper, Lightbulb } from 'lucide-react';

export function Navigation({ activeItem, onNavigate, userRole, isCollapsed, hasCompletedAuction, optionLockState, newsLockState }) {
  
  // Only show Option Chain if unlocked OR user is broker/admin
  const showOptionChain = optionLockState === 'open' || userRole === 'broker' || userRole === 'admin';
  
  // Only show News if unlocked OR user is broker/admin
  const showNews = newsLockState === 'open' || userRole === 'broker' || userRole === 'admin';
  
  const items = [
    { id: 'market', label: 'Market', icon: BarChart3 },
    { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
    ...(showOptionChain ? [{ id: 'options', label: 'Option Chain', icon: TrendingUp }] : []),
    ...(showNews ? [{ id: 'news', label: 'News', icon: Newspaper }] : []),
    { id: 'intel', label: 'Intel', icon: Lightbulb, showDot: hasCompletedAuction }
  ];

  return (
    <nav className={`space-y-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-3'
            } px-4 py-3 rounded-lg transition-all relative ${
              isActive 
                ? 'bg-green-600 text-white' 
                : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Icon size={20} />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            {item.showDot && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
