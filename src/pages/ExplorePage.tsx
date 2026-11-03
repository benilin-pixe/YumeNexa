import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeMedia, PageInfo } from '../types/anime';
import { searchAnime } from '../services/anilistService';
import { AnimeCard } from '../components/common/AnimeCard';
import { SkeletonCard } from '../components/common/SkeletonCard';

interface ExplorePageProps {
  onSelectAnime: (anime: AnimeMedia) => void;
  onWatchAnime: (anime: AnimeMedia) => void;
}

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const FORMATS = [
  { id: 'TV', label: 'TV Series' },
  { id: 'MOVIE', label: 'Movie' },
  { id: 'OVA', label: 'OVA' },
  { id: 'ONA', label: 'ONA' },
  { id: 'SPECIAL', label: 'Special' },
];

const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

const STATUSES = [
  { id: 'RELEASING', label: 'Airing Now' },
  { id: 'FINISHED', label: 'Finished' },
  { id: 'NOT_YET_RELEASED', label: 'Upcoming' },
];

const SORTS = [
  { id: 'POPULARITY_DESC', label: 'Most Popular' },
  { id: 'SCORE_DESC', label: 'Highest Rated' },
  { id: 'TRENDING_DESC', label: 'Trending' },
  { id: 'START_DATE_DESC', label: 'Newest First' },
];

export const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectAnime, onWatchAnime }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('POPULARITY_DESC');
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExploreData = async () => {
    setLoading(true);
    try {
      const data = await searchAnime({
        search: searchTerm,
        genre: selectedGenre || undefined,
        format: selectedFormat || undefined,
        season: selectedSeason || undefined,
        status: selectedStatus || undefined,
        sort: [selectedSort],
        page,
        perPage: 18,
      });
      setResults(data.media || []);
      setPageInfo(data.pageInfo || null);
    } catch (err) {
      console.warn('Explore search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExploreData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedGenre, selectedFormat, selectedSeason, selectedStatus, selectedSort, page]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedFormat('');
    setSelectedSeason('');
    setSelectedStatus('');
    setSelectedSort('POPULARITY_DESC');
    setPage(1);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title */}
      <div className="space-y-1 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <h1 className="text-3xl font-black font-display text-slate-900 dark:text-white">Explore Anime Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Search and filter across thousands of canonical anime titles
        </p>
      </div>

      {/* Search & Main Controls Bar */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-violet-500 dark:text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anime title by English or Romaji name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Sort Dropdown */}
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 transition cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                  {s.label}
                </option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          {/* Genre Controls */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Filter by Genre
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
              <button
                onClick={() => {
                  setSelectedGenre('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  !selectedGenre
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Genres
              </button>
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setSelectedGenre(g === selectedGenre ? '' : g);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    selectedGenre === g
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">All Formats</option>
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-white dark:bg-slate-900">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Season
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">All Seasons</option>
                {SEASONS.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Airing Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">All Airing Status</option>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <p className="text-lg font-bold text-slate-900 dark:text-white">No anime found matching your filter criteria.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search keyword or clearing selected genre filters.</p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs shadow-md hover:bg-violet-500 transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onSelect={onSelectAnime} onWatch={onWatchAnime} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pageInfo && pageInfo.lastPage > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
            Page {page} of {pageInfo.lastPage}
          </span>

          <button
            disabled={!pageInfo.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-violet-600 border border-violet-500 text-white text-xs font-semibold hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
