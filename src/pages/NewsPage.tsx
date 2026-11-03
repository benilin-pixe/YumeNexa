import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Play,
  ExternalLink,
  Search,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Film,
  Sparkles,
  Clapperboard,
  Layers,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { NewsArticleRecord, getNewsArticles } from '../services/newsService';

const CATEGORIES = ['All', 'News', 'Announcements', 'Movies', 'Releases'] as const;
type CategoryType = typeof CATEGORIES[number];

const PAGE_SIZE = 12;

export const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticleRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<CategoryType>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Active inline video playing card ID
  const [playingVideoCardId, setPlayingVideoCardId] = useState<string | null>(null);

  // Image load error cache
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCategoryChange = (cat: CategoryType) => {
    setCategory(cat);
    setCurrentPage(1);
    setPlayingVideoCardId(null);
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await getNewsArticles({
        category: category !== 'All' ? category : undefined,
        search: debouncedSearch.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      });

      setArticles(data.articles);
      setTotalCount(data.total);
    } catch (err: any) {
      console.error('Error loading news:', err);
      setError(err?.message || 'Failed to load news articles. Please try again.');
      setArticles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const formatPublishedDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recent';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Recent';
    }
  };

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case 'Movies':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Announcements':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Releases':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'News':
      default:
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startItemIndex = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItemIndex = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950/90 via-slate-900 to-slate-950 border border-violet-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-violet-400" />
            <span>Live RSS Feed Aggregation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            YumeNexa <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">Anime News</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Real, verifiable headlines from premier anime publications. Includes official trailers, release dates, and studio announcements.
          </p>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat === 'All' && <Layers className="w-3.5 h-3.5 inline mr-1.5" />}
                {cat === 'News' && <Newspaper className="w-3.5 h-3.5 inline mr-1.5" />}
                {cat === 'Announcements' && <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />}
                {cat === 'Movies' && <Film className="w-3.5 h-3.5 inline mr-1.5" />}
                {cat === 'Releases' && <Clapperboard className="w-3.5 h-3.5 inline mr-1.5" />}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search anime headlines..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pagination Counter & Controls */}
      {!loading && !error && totalCount > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/60 pb-3">
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-200">{startItemIndex}–{endItemIndex}</strong> of{' '}
            <strong className="text-slate-900 dark:text-slate-200">{totalCount}</strong> articles
          </span>
          <button
            onClick={() => fetchArticles()}
            className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:text-violet-500 font-semibold transition cursor-pointer"
            title="Refresh articles"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col animate-pulse"
            >
              <div className="w-full h-48 bg-slate-200 dark:bg-slate-800/60" />
              <div className="p-5 flex-grow space-y-3">
                <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="w-full h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="w-4/5 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="glass-panel rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto border border-rose-500/30">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 w-16 h-16 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Unable to Load News Feeds</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          <button
            onClick={() => fetchArticles()}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto border border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-full bg-violet-600/10 text-violet-500 dark:text-violet-400 w-16 h-16 flex items-center justify-center mx-auto">
            <Newspaper className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">No Articles Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {searchTerm
              ? `No anime news matches your search "${searchTerm}". Try another keyword.`
              : 'No news articles available in this category yet. Check back soon for the latest updates!'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-white font-medium transition cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Article Cards Grid */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const articleImg = article.imageUrl || article.image;
            const isImageFailed = brokenImages[article.id] || !articleImg;
            const isPlayingVideo = playingVideoCardId === article.id;
            const hasVideo = Boolean(article.videoId);

            return (
              <article
                key={article.id}
                className="group glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-violet-500/40 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-violet-600/10 transition-all duration-300"
              >
                {/* Media Container: Inline Video OR Cover Image */}
                <div className="relative w-full aspect-video bg-slate-900 overflow-hidden">
                  {isPlayingVideo && article.videoId ? (
                    <div className="relative w-full h-full bg-black flex flex-col">
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800">
                        <a
                          href={`https://www.youtube.com/watch?v=${article.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 mr-2"
                        >
                          <span>Watch on YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => setPlayingVideoCardId(null)}
                          className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Close video player"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${article.videoId}?autoplay=1`}
                        title={article.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <>
                      {!isImageFailed ? (
                        <img
                          src={articleImg}
                          alt={article.title}
                          loading="lazy"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [article.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
                          <div className="p-3 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/20">
                            {article.category === 'Movies' ? (
                              <Film className="w-6 h-6" />
                            ) : (
                              <Newspaper className="w-6 h-6" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{article.sourceName}</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getCategoryBadgeClass(
                            article.category
                          )}`}
                        >
                          {article.category}
                        </span>
                      </div>

                      {/* Play Video Trigger Overlay Button */}
                      {hasVideo && (
                        <div className="absolute bottom-3 right-3 z-10">
                          <button
                            onClick={() => setPlayingVideoCardId(article.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/50 backdrop-blur-md transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Play Video</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-5 flex-grow space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2 leading-snug">
                      <a
                        href={article.link || article.originalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline focus:outline-none"
                      >
                        {article.title}
                      </a>
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/60 font-medium">
                    <span className="text-violet-600 dark:text-violet-400 font-semibold truncate max-w-[150px]">
                      {article.sourceName}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatPublishedDate(article.publishedAt)}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {article.author ? `By ${article.author}` : article.sourceName}
                  </span>

                  <a
                    href={article.link || article.originalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline transition"
                  >
                    <span>Read article</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> of{' '}
            <strong className="text-slate-900 dark:text-slate-200">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default NewsPage;
