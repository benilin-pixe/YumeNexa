import React, { useState } from 'react';
import { Bookmark, Play, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { WatchlistStatus } from '../types/user';
import { AnimeMedia } from '../types/anime';

interface WatchlistPageProps {
  onSelectAnime: (anime: AnimeMedia) => void;
  onWatchAnime: (anime: AnimeMedia, ep?: number) => void;
  onOpenAuth: () => void;
}

const TABS: Array<{ id: WatchlistStatus | 'HISTORY'; label: string }> = [
  { id: 'WATCHING', label: 'Currently Watching' },
  { id: 'PLANNING', label: 'Plan to Watch' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'ON_HOLD', label: 'On Hold' },
  { id: 'DROPPED', label: 'Dropped' },
  { id: 'HISTORY', label: 'Watch History' },
];

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  onSelectAnime,
  onWatchAnime,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const { watchlist, watchHistory, updateAnimeStatus, removeItem, toggleNotifications } = useWatchlist();
  const [activeTab, setActiveTab] = useState<WatchlistStatus | 'HISTORY'>('WATCHING');

  if (!currentUser) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center my-12 space-y-4 max-w-md mx-auto border border-slate-200 dark:border-slate-800">
        <div className="p-4 rounded-full bg-violet-600/20 text-violet-500 dark:text-violet-400 w-16 h-16 flex items-center justify-center mx-auto">
          <Bookmark className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Sign In to View Watchlist</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Sync your favourite anime, current episode progress, and custom library across all your devices seamlessly.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-2xl bg-violet-600 text-white font-bold text-xs shadow-xl shadow-violet-600/30 hover:scale-105 transition cursor-pointer"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const filteredItems = watchlist.filter((item) => item.status === activeTab);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-violet-500 dark:text-violet-400" />
            <h1 className="text-3xl font-black font-display text-slate-900 dark:text-white">My Personal Anime Library</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track and manage your watched episodes and future watchlist
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[10px] uppercase">Watchlist Items</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">{watchlist.length}</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[10px] uppercase">History Recorded</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">{watchHistory.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === 'HISTORY'
              ? watchHistory.length
              : watchlist.filter((i) => i.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold shrink-0 transition flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-violet-600/10 dark:bg-violet-600/30 border-violet-500 text-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'HISTORY' ? (
        watchHistory.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No watch history recorded yet.</p>
            <p>Start watching any episode to automatically track your playback history.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchHistory.map((item) => (
              <div
                key={`${item.animeId}_ep${item.episodeNumber}_${item.lastWatchedAt}`}
                onClick={() =>
                  onWatchAnime(
                    {
                      id: item.animeId,
                      title: { english: item.animeTitle, romaji: item.animeTitle },
                      coverImage: { extraLarge: item.coverImage, large: item.coverImage },
                      genres: [],
                    },
                    item.episodeNumber
                  )
                }
                className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 hover:border-violet-500/50 cursor-pointer group transition flex items-center gap-3"
              >
                <img src={item.coverImage} alt={item.animeTitle} className="w-16 h-20 rounded-xl object-cover shrink-0 bg-slate-950" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 truncate transition">
                    {item.animeTitle}
                  </h4>
                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">Episode {item.episodeNumber}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(item.lastWatchedAt).toLocaleDateString()}
                  </p>
                </div>
                <Play className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0 group-hover:scale-110 transition" />
              </div>
            ))}
          </div>
        )
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No anime in this status folder.</p>
          <p>Add titles to your watchlist from the Explore page or Anime cards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.animeId}
              className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-3"
            >
              <div className="flex gap-3">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-16 h-22 rounded-xl object-cover shrink-0 bg-slate-950 cursor-pointer"
                  onClick={() =>
                    onSelectAnime({
                      id: item.animeId,
                      title: { english: item.title, romaji: item.title },
                      coverImage: { extraLarge: item.coverImage, large: item.coverImage },
                      genres: [],
                    })
                  }
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <h3
                    onClick={() =>
                      onSelectAnime({
                        id: item.animeId,
                        title: { english: item.title, romaji: item.title },
                        coverImage: { extraLarge: item.coverImage, large: item.coverImage },
                        genres: [],
                      })
                    }
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-violet-500 dark:hover:text-violet-400 cursor-pointer truncate transition leading-tight"
                  >
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Progress: Ep {item.progress} / {item.totalEpisodes || '?'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() =>
                        onWatchAnime(
                          {
                            id: item.animeId,
                            title: { english: item.title, romaji: item.title },
                            coverImage: { extraLarge: item.coverImage, large: item.coverImage },
                            genres: [],
                          },
                          Math.max(1, item.progress)
                        )
                      }
                      className="px-3 py-1 rounded-xl bg-violet-600 text-white font-semibold text-[11px] hover:bg-violet-500 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Play Ep {Math.max(1, item.progress)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Status Adjust & Release Alerts & Remove */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <select
                  value={item.status}
                  onChange={(e) =>
                    updateAnimeStatus(
                      item.animeId,
                      item.title,
                      item.coverImage,
                      e.target.value as WatchlistStatus,
                      item.progress,
                      item.totalEpisodes
                    )
                  }
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="WATCHING">Watching</option>
                  <option value="PLANNING">Plan to Watch</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DROPPED">Dropped</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleNotifications(item.animeId, !item.notificationsEnabled)}
                    className={`p-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                      item.notificationsEnabled
                        ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800'
                    }`}
                    title={item.notificationsEnabled ? 'Release Alerts ON' : 'Release Alerts OFF'}
                  >
                    <Bell className={`w-3.5 h-3.5 ${item.notificationsEnabled ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => removeItem(item.animeId)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
