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
import { fetchAnimeNews, getOfficialTrailersFeed } from '../services/animeNewsService';

import { HeroCarousel } from '../components/home/HeroCarousel';
import { UpcomingCountdownWidget } from '../components/home/UpcomingCountdownWidget';
import { AnimeSection } from '../components/home/AnimeSection';
import { TrailersSection } from '../components/home/TrailersSection';
import { NewsCard } from '../components/news/NewsCard';
import { NewsDetailModal } from '../components/news/NewsDetailModal';
import { useWatchlist } from '../contexts/WatchlistContext';
import { Tv, ArrowRight } from 'lucide-react';

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

  const [loading, setLoading] = useState(true);
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsArticle | null>(null);

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
      {/* Hero Carousel */}
      <HeroCarousel items={trending.slice(0, 5)} onSelect={onSelectAnime} onWatch={onWatchAnime} />

      {/* Continue Watching Section if Watch History exists */}
      {watchHistory.length > 0 && (
        <section className="glass-panel rounded-3xl p-6 border border-violet-500/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
                <Tv className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-display text-white">Continue Watching</h2>
            </div>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="text-xs font-semibold text-violet-400 hover:underline"
            >
              My Library →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchHistory.slice(0, 4).map((item) => (
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
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 cursor-pointer group transition"
              >
                <img src={item.coverImage} alt={item.animeTitle} className="w-14 h-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-violet-400 truncate transition">
                    {item.animeTitle}
                  </h4>
                  <p className="text-[11px] font-semibold text-violet-400">Episode {item.episodeNumber}</p>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-500 h-full rounded-full"
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

      {/* Official Video Trailers */}
      <TrailersSection onSelectAnime={onSelectAnime} onWatchAnime={onWatchAnime} />

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

      {/* Editorial News Feed */}
      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-slate-800/60 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Latest Anime Editorial & News
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Industry announcements, studio updates, and adaptation reveals</p>
          </div>
          <button
            onClick={() => onNavigateTab('news')}
            className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 group transition"
          >
            <span>All News</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article) => (
            <NewsCard key={article.id} article={article} onSelect={() => setSelectedNewsArticle(article)} />
          ))}
        </div>
      </section>

      {/* Article Modal Reader */}
      {selectedNewsArticle && (
        <NewsDetailModal article={selectedNewsArticle} onClose={() => setSelectedNewsArticle(null)} />
      )}
    </div>
  );
};
