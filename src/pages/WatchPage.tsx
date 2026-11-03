import React, { useState, useEffect } from 'react';
import { AnimeMedia } from '../types/anime';
import { VideoPlayer } from '../components/watch/VideoPlayer';
import { EpisodeSelector } from '../components/watch/EpisodeSelector';
import { WatchlistButton } from '../components/anime/WatchlistButton';
import { Star, Tv, Info, ArrowLeft } from 'lucide-react';

interface WatchPageProps {
  anime: AnimeMedia | null;
  initialEpisode?: number;
  onBackToExplore: () => void;
  onSelectAnime: (anime: AnimeMedia) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  anime,
  initialEpisode = 1,
  onBackToExplore,
  onSelectAnime,
}) => {
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

  useEffect(() => {
    setCurrentEpisode(initialEpisode);
  }, [initialEpisode, anime?.id]);

  if (!anime) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center my-12 space-y-4 max-w-xl mx-auto">
        <div className="p-4 rounded-full bg-violet-600/20 text-violet-400 w-16 h-16 flex items-center justify-center mx-auto">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-white">No Anime Selected for Playback</h2>
        <p className="text-xs text-slate-400">Select any anime title from Home or Explore to enter the YumeNexa Player.</p>
        <button
          onClick={onBackToExplore}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow-lg transition"
        >
          Explore Anime Directory
        </button>
      </div>
    );
  }

  const title = anime.title.english || anime.title.userPreferred || anime.title.romaji || 'Anime Title';
  const totalEps = anime.episodes || 12;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header / Back CTA */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <button
          onClick={onBackToExplore}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-3">
          <WatchlistButton
            animeId={anime.id}
            title={title}
            coverImage={anime.coverImage?.large || ''}
            totalEpisodes={totalEps}
          />
        </div>
      </div>

      {/* Embedded Video Player */}
      <VideoPlayer
        animeId={anime.id}
        animeTitle={title}
        coverImage={anime.coverImage?.extraLarge || anime.coverImage?.large || ''}
        episodeNumber={currentEpisode}
        trailerYoutubeId={anime.trailer?.id}
        totalEpisodes={totalEps}
        onNextEpisode={() => setCurrentEpisode((ep) => Math.min(totalEps, ep + 1))}
        onPrevEpisode={() => setCurrentEpisode((ep) => Math.max(1, ep - 1))}
      />

      {/* Episode Selection Grid */}
      <EpisodeSelector
        totalEpisodes={totalEps}
        currentEpisode={currentEpisode}
        onSelectEpisode={(ep) => setCurrentEpisode(ep)}
      />

      {/* Anime Overview & Details */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 flex flex-col md:flex-row gap-6 items-start">
        <img
          src={anime.coverImage?.extraLarge || anime.coverImage?.large}
          alt={title}
          className="w-32 sm:w-40 aspect-[3/4] rounded-2xl object-cover shrink-0 border border-slate-800 shadow-xl"
        />

        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {(anime.averageScore ? anime.averageScore / 10 : 0).toFixed(1)}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-semibold uppercase">
              {anime.format || 'TV'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-600/20 text-violet-300 font-semibold">
              {anime.season} {anime.seasonYear}
            </span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white">{title}</h2>

          {anime.genres && (
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.map((g) => (
                <span key={g} className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
                  {g}
                </span>
              ))}
            </div>
          )}

          <p
            className="text-xs text-slate-300 leading-relaxed line-clamp-4"
            dangerouslySetInnerHTML={{ __html: anime.description || '' }}
          />
        </div>
      </div>
    </div>
  );
};
