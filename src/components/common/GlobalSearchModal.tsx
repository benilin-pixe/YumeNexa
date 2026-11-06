import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { searchAnime } from '../../services/anilistService';
import { getKitsuSearch } from '../../services/kitsuService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnime: (anime: AnimeMedia) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAnime,
}) => {
  const [query, setQuery] = useState('');
  const [animeResults, setAnimeResults] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setAnimeResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [animeData] = await Promise.allSettled([
          searchAnime({ search: query, perPage: 8 }),
        ]);

        if (animeData.status === 'fulfilled' && animeData.value?.media?.length) {
          setAnimeResults(animeData.value.media);
        } else {
          const kitsuRes = await getKitsuSearch(query);
          setAnimeResults(kitsuRes);
        }
      } catch (err) {
        console.warn('Global search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="relative p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search anime titles or genres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-3 no-scrollbar flex-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Searching YumeNexa database...</p>
            </div>
          ) : !query.trim() ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Type to search across thousands of anime titles and official releases.
            </div>
          ) : animeResults.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">No matching anime titles found.</p>
          ) : (
            animeResults.map((anime) => {
              const title = anime.title.english || anime.title.userPreferred || anime.title.romaji;
              return (
                <div
                  key={anime.id}
                  onClick={() => {
                    onSelectAnime(anime);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 cursor-pointer group transition"
                >
                  <img
                    src={anime.coverImage?.large || anime.coverImage?.medium}
                    alt={title}
                    className="w-12 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 truncate transition">
                      {title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {anime.genres?.slice(0, 3).join(' · ')}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{anime.format}</span>
                      <span aria-hidden="true">·</span>
                      <span>{anime.episodes ? `${anime.episodes} Ep` : 'Ongoing'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-500 font-bold">
                        ★ {(anime.averageScore ? anime.averageScore / 10 : 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
