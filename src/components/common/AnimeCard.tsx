import React from 'react';
import { Star, Play, Plus, Check } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { useWatchlist } from '../../contexts/WatchlistContext';

interface AnimeCardProps {
  anime: AnimeMedia;
  onSelect: (anime: AnimeMedia) => void;
  onWatch?: (anime: AnimeMedia) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect, onWatch }) => {
  const { getItemStatus, updateAnimeStatus } = useWatchlist();
  const watchlistEntry = getItemStatus(anime.id);

  const title = anime.title.english || anime.title.userPreferred || anime.title.romaji || 'Untitled';
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium || '';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (watchlistEntry) {
      updateAnimeStatus(anime.id, title, cover, 'COMPLETED');
    } else {
      updateAnimeStatus(anime.id, title, cover, 'PLANNING', 0, anime.episodes || 0);
    }
  };

  return (
    <div
      onClick={() => onSelect(anime)}
      className="group relative flex flex-col cursor-pointer rounded-2xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 overflow-hidden hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-600/10 transition-all duration-300"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {score ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-400 font-semibold text-xs shadow-md">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{score}</span>
            </div>
          ) : (
            <div />
          )}

          {anime.format && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-300 font-medium text-[10px] uppercase">
              {anime.format}
            </span>
          )}
        </div>

        {/* Play Quick Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {onWatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatch(anime);
              }}
              className="p-3.5 rounded-full bg-violet-600/90 text-white shadow-lg shadow-violet-600/40 hover:scale-110 active:scale-95 transition"
              title="Watch Episode 1"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>
          )}
        </div>

        {/* Watchlist Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md border text-xs font-medium transition ${
            watchlistEntry
              ? 'bg-emerald-600/90 border-emerald-500 text-white'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-violet-600 hover:border-violet-500 hover:text-white'
          }`}
          title={watchlistEntry ? 'In Watchlist' : 'Add to Watchlist'}
        >
          {watchlistEntry ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Info Content */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1">
        <div>
          <h3 className="font-semibold text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 line-clamp-2 leading-snug group-hover:text-violet-400 transition">
            {title}
          </h3>
          {anime.genres && anime.genres.length > 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1 line-clamp-1">
              {anime.genres.slice(0, 2).join(' • ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 text-[11px] text-slate-400">
          <span>{anime.episodes ? `${anime.episodes} Ep` : 'Ongoing'}</span>
          <span className="capitalize">{anime.seasonYear || anime.status?.toLowerCase().replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
};
