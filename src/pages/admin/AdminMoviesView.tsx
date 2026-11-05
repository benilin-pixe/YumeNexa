import React, { useState, useEffect } from 'react';
import {
  Film,
  Search,
  Star,
  Tv,
  Calendar,
  ExternalLink,
  RefreshCw,
  Plus,
  Play,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { getPopularMovies, getTrendingAnime, searchAnime } from '../../services/anilistService';
import { AnimeMedia } from '../../types/anime';

export const AdminMoviesView: React.FC = () => {
  const [movies, setMovies] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | 'MOVIE' | 'TV' | 'OVA'>('MOVIE');
  const [page, setPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  // Quick edit modal state
  const [activeMovie, setActiveMovie] = useState<AnimeMedia | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadMovies = async () => {
    setLoading(true);
    try {
      if (searchTerm.trim()) {
        const res = await searchAnime({
          search: searchTerm.trim(),
          format: selectedFormat === 'ALL' ? undefined : (selectedFormat as any),
          page,
          perPage: 12,
        });
        setMovies(res.media || []);
        setTotalMovies(res.pageInfo?.total || 0);
      } else if (selectedFormat === 'MOVIE') {
        const res = await getPopularMovies(page, 12);
        setMovies(res.media || []);
        setTotalMovies(res.pageInfo?.total || 0);
      } else {
        const res = await getTrendingAnime(page, 12);
        setMovies(res.media || []);
        setTotalMovies(res.pageInfo?.total || 0);
      }
    } catch (err) {
      console.warn('Admin movies fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, [page, selectedFormat]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMovies();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Filter Bar */}
      <div className="bg-[#161224] rounded-3xl p-6 border border-[#2a243a] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-sky-400" />
              <span>Anime Catalogue Management</span>
            </h2>
            <p className="text-xs text-[#a09cb0] mt-0.5">
              Browse anime series and movies, verify streaming availability, and inspect metadata.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadMovies}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-[#0c0915] border border-[#2a243a] text-xs font-semibold text-[#a09cb0] hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Catalogue</span>
            </button>
          </div>
        </div>

        {/* Search & Format Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#a09cb0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search movie or anime title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] placeholder:text-[#6a667a] focus:outline-none focus:border-purple-500 transition"
            />
          </form>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0915] border border-[#2a243a] shrink-0">
            {(['MOVIE', 'TV', 'ALL'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setSelectedFormat(fmt);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-[#a09cb0] hover:text-white'
                }`}
              >
                {fmt === 'MOVIE' ? 'Movies Only' : fmt === 'TV' ? 'Series' : 'All Formats'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#a09cb0] space-y-3 bg-[#161224] rounded-3xl border border-[#2a243a]">
          <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
          <p>Querying anime movie records from AniList...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#a09cb0] bg-[#161224] rounded-3xl border border-dashed border-[#2a243a]">
          No anime movies found matching the current criteria.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((item) => {
            const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || 'Untitled';
            const cover = item.coverImage?.large || item.coverImage?.medium || '';
            const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : 'N/A';

            return (
              <div
                key={item.id}
                onClick={() => setActiveMovie(item)}
                className="bg-[#161224] rounded-2xl overflow-hidden border border-[#2a243a] hover:border-sky-500/50 hover:-translate-y-1 transition duration-200 cursor-pointer flex flex-col group shadow-lg"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0c0915]">
                  <img
                    src={cover}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{score}</span>
                  </div>
                  {item.format && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-mono text-[9px] font-bold uppercase">
                      {item.format}
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition line-clamp-2 leading-tight">
                    {title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-[#a09cb0] pt-1">
                    <span>{item.seasonYear || item.status || 'Anime'}</span>
                    <span className="text-sky-400 font-semibold group-hover:underline">Inspect</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between p-4 bg-[#161224] rounded-2xl border border-[#2a243a] text-xs text-[#a09cb0]">
        <span>Page <strong className="text-white">{page}</strong> of active movie listings</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-3.5 py-1.5 rounded-xl bg-[#0c0915] border border-[#2a243a] hover:text-white transition disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || movies.length < 12}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Movie Inspector Modal */}
      {activeMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#161224] border border-[#2a243a] p-6 sm:p-7 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-start justify-between gap-4 border-b border-[#2a243a] pb-4">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                  ANILIST ID #{activeMovie.id}
                </span>
                <h3 className="text-lg font-bold font-display text-white mt-0.5">
                  {activeMovie.title?.english || activeMovie.title?.romaji || activeMovie.title?.userPreferred}
                </h3>
              </div>
              <button
                onClick={() => setActiveMovie(null)}
                className="p-1 rounded-lg text-[#a09cb0] hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4">
              <img
                src={activeMovie.coverImage?.large || activeMovie.coverImage?.medium}
                alt="Poster"
                className="w-24 aspect-[3/4] rounded-xl object-cover border border-[#2a243a] shrink-0"
              />
              <div className="space-y-1.5 text-xs text-[#a09cb0]">
                <p>
                  <strong className="text-white">Format:</strong> {activeMovie.format || 'Movie'}
                </p>
                <p>
                  <strong className="text-white">Status:</strong> {activeMovie.status || 'Finished'}
                </p>
                <p>
                  <strong className="text-white">Episodes / Duration:</strong> {activeMovie.episodes || 1} ep ({activeMovie.duration || '90'}m)
                </p>
                <p>
                  <strong className="text-white">Rating:</strong> ★ {activeMovie.averageScore ? (activeMovie.averageScore / 10).toFixed(1) : 'N/A'}
                </p>
                <p className="line-clamp-3 text-[11px] leading-relaxed pt-1">
                  {activeMovie.description?.replace(/<[^>]+>/g, '') || 'No description recorded.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2a243a] flex items-center justify-end gap-2">
              <a
                href={`https://anilist.co/anime/${activeMovie.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs font-semibold text-[#a09cb0] hover:text-white transition flex items-center gap-1.5"
              >
                <span>View on AniList</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  showToast(`Selected "${activeMovie.title?.english || activeMovie.id}" for watchlist inspection.`);
                  setActiveMovie(null);
                }}
                className="btn-primary-pill px-5 py-2 text-xs font-bold cursor-pointer"
              >
                Confirm Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
