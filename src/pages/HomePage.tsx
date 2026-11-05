import React, { useEffect, useState } from 'react';
import { AnimeMedia, AiringScheduleNode } from '../types/anime';
import { NewsArticle } from '../types/news';
import {
  getTrendingAnime,
  getPopularAnime,
  getCurrentSeasonalAnime,
  getUpcomingAnime,
  getPopularMovies,
  getUpcomingCountdowns,
} from '../services/anilistService';
import { getKitsuTrendingAnime, getKitsuPopularAnime } from '../services/kitsuService';
import { fetchAnimeNews } from '../services/animeNewsService';

import { HeroCarousel } from '../components/home/HeroCarousel';
import { UpcomingCountdownWidget } from '../components/home/UpcomingCountdownWidget';
import { AnimeSection } from '../components/home/AnimeSection';
import { NewsCard } from '../components/news/NewsCard';
import { NewsDetailModal } from '../components/news/NewsDetailModal';
import { Tv, ArrowRight, Bell, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { subscribeToActiveAnnouncements } from '../services/firestoreService';
import { SystemAnnouncement } from '../types/user';
import { useWatchlist } from '../contexts/WatchlistContext';
import { WatchHistoryItem } from '../types/user';

interface HomePageProps {
  onSelectAnime: (anime: AnimeMedia) => void;
  onWatchAnime: (anime: AnimeMedia, ep?: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectAnime,
  onWatchAnime,
  onNavigateTab,
}) => {
  const { watchHistory } = useWatchlist();

  const [trending, setTrending] = useState<AnimeMedia[]>([]);
  const [popular, setPopular] = useState<AnimeMedia[]>([]);
  const [seasonal, setSeasonal] = useState<AnimeMedia[]>([]);
  const [upcoming, setUpcoming] = useState<AnimeMedia[]>([]);
  const [movies, setMovies] = useState<AnimeMedia[]>([]);
  const [countdowns, setCountdowns] = useState<AiringScheduleNode[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    const unsub = subscribeToActiveAnnouncements((list) => {
      setAnnouncements(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      // Execute all requests independently with Promise.allSettled
      const results = await Promise.allSettled([
        getTrendingAnime(1, 12),
        getPopularAnime(1, 12),
        getCurrentSeasonalAnime(undefined, undefined, 1, 12),
        getUpcomingAnime(1, 12),
        getPopularMovies(1, 12),
        getUpcomingCountdowns(6),
        fetchAnimeNews(),
      ]);

      if (!isMounted) return;

      const [
        trendingRes,
        popularRes,
        seasonalRes,
        upcomingRes,
        moviesRes,
        countdownsRes,
        newsRes,
      ] = results;

      // Primary AniList data with Kitsu fallbacks if AniList fails
      if (trendingRes.status === 'fulfilled' && trendingRes.value?.media?.length) {
        setTrending(trendingRes.value.media);
      } else {
        const kitsuTrending = await getKitsuTrendingAnime();
        setTrending(kitsuTrending);
      }

      if (popularRes.status === 'fulfilled' && popularRes.value?.media?.length) {
        setPopular(popularRes.value.media);
      } else {
        const kitsuPopular = await getKitsuPopularAnime();
        setPopular(kitsuPopular);
      }

      if (seasonalRes.status === 'fulfilled') setSeasonal(seasonalRes.value?.media || []);
      if (upcomingRes.status === 'fulfilled') setUpcoming(upcomingRes.value?.media || []);
      if (moviesRes.status === 'fulfilled') setMovies(moviesRes.value?.media || []);
      if (countdownsRes.status === 'fulfilled') setCountdowns(countdownsRes.value || []);
      if (newsRes.status === 'fulfilled') setNews((newsRes.value || []).slice(0, 6));

      setLoading(false);
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Persistent System Alert Banners for All Users */}
      {announcements.length > 0 && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {announcements.map((ann) => {
            const isWarning = ann.type === 'warning';
            const isSuccess = ann.type === 'success';
            return (
              <div
                key={ann.id}
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                  isWarning
                    ? 'bg-gradient-to-r from-amber-950/80 via-[#1f1610] to-[#161224] border-amber-500/40 text-amber-200'
                    : isSuccess
                    ? 'bg-gradient-to-r from-emerald-950/80 via-[#101f18] to-[#161224] border-emerald-500/40 text-emerald-200'
                    : 'bg-gradient-to-r from-purple-950/80 via-[#1d1830] to-[#161224] border-purple-500/40 text-purple-200'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 border ${
                      isWarning
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : isSuccess
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    ) : isSuccess ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5 animate-bounce" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isWarning
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                            : isSuccess
                            ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                            : 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                        }`}
                      >
                        System Broadcast
                      </span>
                      <h3 className="text-sm sm:text-base font-black font-display text-white">
                        {ann.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#d4cff2] mt-1 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-[11px] text-[#a09cb0] font-mono self-end sm:self-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Live Alert</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero Carousel */}
      <HeroCarousel items={trending.slice(0, 5)} onSelect={onSelectAnime} onWatch={onWatchAnime} />

      {/* Continue Watching Section if Watch History exists */}
      {watchHistory.length > 0 && (
        <section className="glass-panel rounded-3xl p-6 border border-violet-500/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-500 dark:text-violet-400">
                <Tv className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Continue Watching</h2>
            </div>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              My Library →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchHistory.slice(0, 4).map((item: WatchHistoryItem) => (
              <div
                key={`${item.animeId}_ep${item.episodeNumber}`}
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
                className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 cursor-pointer group transition shadow-sm"
              >
                <img src={item.coverImage} alt={item.animeTitle} className="w-14 h-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 truncate transition">
                    {item.animeTitle}
                  </h4>
                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">Episode {item.episodeNumber}</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-600 dark:bg-violet-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((item.progressSeconds / item.totalDurationSeconds) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Live Upcoming Episode Countdowns */}
      <UpcomingCountdownWidget schedule={countdowns} onSelect={onSelectAnime} onWatch={onWatchAnime} />

      {/* Trending Anime Section */}
      <AnimeSection
        title="Trending Right Now"
        subtitle="Most talked about anime worldwide"
        items={trending}
        loading={loading}
        onSelect={onSelectAnime}
        onWatch={onWatchAnime}
        onViewAll={() => onNavigateTab('explore')}
      />

      {/* Current Seasonal Anime */}
      <AnimeSection
        title="Current Season Releases"
        subtitle="Fresh weekly episodes airing this season"
        items={seasonal}
        loading={loading}
        onSelect={onSelectAnime}
        onWatch={onWatchAnime}
        onViewAll={() => onNavigateTab('explore')}
      />

      {/* Most Popular Anime */}
      <AnimeSection
        title="All-Time Popular Anime"
        subtitle="Top ranked classics and record breakers"
        items={popular}
        loading={loading}
        onSelect={onSelectAnime}
        onWatch={onWatchAnime}
        onViewAll={() => onNavigateTab('explore')}
      />

      {/* Upcoming Anime Section */}
      <AnimeSection
        title="Most Anticipated Upcoming"
        subtitle="Announced titles releasing in upcoming seasons"
        items={upcoming}
        loading={loading}
        onSelect={onSelectAnime}
        onWatch={onWatchAnime}
        onViewAll={() => onNavigateTab('explore')}
      />

      {/* Popular Anime Movies */}
      <AnimeSection
        title="Popular Anime Movies"
        subtitle="Feature films, theatrical releases, and specials"
        items={movies}
        loading={loading}
        onSelect={onSelectAnime}
        onWatch={onWatchAnime}
        onViewAll={() => onNavigateTab('explore')}
      />
    </div>
  );
};
