import React, { useState } from 'react';
import { Bookmark, Check, ChevronDown, Trash2, Bell } from 'lucide-react';
import { WatchlistStatus } from '../../types/user';
import { useWatchlist } from '../../contexts/WatchlistContext';

interface WatchlistButtonProps {
  animeId: number;
  title: string;
  coverImage: string;
  totalEpisodes?: number;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  animeId,
  title,
  coverImage,
  totalEpisodes = 0,
}) => {
  const [open, setOpen] = useState(false);
  const { getItemStatus, updateAnimeStatus, removeItem, toggleNotifications } = useWatchlist();
  const current = getItemStatus(animeId);

  const statuses: Array<{ id: WatchlistStatus; label: string; color: string }> = [
    { id: 'WATCHING', label: 'Watching', color: 'text-violet-400' },
    { id: 'PLANNING', label: 'Plan to Watch', color: 'text-sky-400' },
    { id: 'COMPLETED', label: 'Completed', color: 'text-emerald-400' },
    { id: 'ON_HOLD', label: 'On Hold', color: 'text-amber-400' },
    { id: 'DROPPED', label: 'Dropped', color: 'text-rose-400' },
  ];

  const handleSelect = async (status: WatchlistStatus) => {
    await updateAnimeStatus(animeId, title, coverImage, status, current?.progress || 0, totalEpisodes);
    setOpen(false);
  };

  const handleRemove = async () => {
    await removeItem(animeId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs transition border ${
          current
            ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30'
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700'
        }`}
      >
        <Bookmark className="w-4 h-4" />
        <span>{current ? current.status.replace('_', ' ') : 'Add to Watchlist'}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-1" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel bg-slate-900/95 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
          {statuses.map((item) => {
            const isSelected = current?.status === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition ${
                  isSelected ? 'bg-violet-600/20 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className={item.color}>{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
              </button>
            );
          })}

          {current && (
            <div className="pt-1 mt-1 border-t border-slate-800/80 space-y-1">
              <button
                onClick={() => toggleNotifications(animeId, !current.notificationsEnabled)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition ${
                  current.notificationsEnabled ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Release Alerts</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800">
                  {current.notificationsEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={handleRemove}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl font-medium text-rose-400 hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Watchlist</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
