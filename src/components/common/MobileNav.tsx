import React from 'react';
import { Sparkles, Compass, Tv, Calendar, Newspaper, Bookmark } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'watch', label: 'Watch', icon: Tv },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
              isActive
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-violet-600 dark:text-violet-400 scale-110' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
