import React, { useState, useEffect } from 'react';
import { AnimeMedia } from '../types/anime';
import { VideoPlayer } from '../components/watch/VideoPlayer';
import { EpisodeSelector } from '../components/watch/EpisodeSelector';
import { WatchlistButton } from '../components/anime/WatchlistButton';
import { Star, Tv, ArrowLeft } from 'lucide-react';

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
      <div className="bg-[#161224] rounded-xl p-12 text-center my-12 space-y-4 max-w-xl mx-auto border border-[#2a243a]">
        <div className="p-4 rounded-full bg-purple-500/20 text-purple-400 w-16 h-16 flex items-center justify-center mx-auto border border-purple-500/30">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold font-display text-[#f2effc]">No Anime Selected for Playback</h2>
        <p className="text-xs text-[#a09cb0]">Select any anime title from Home or Explore to enter the YumeNexa Player.</p>
        <button
          onClick={onBackToExplore}
          className="btn-primary-pill px-6 py-2.5 text-xs font-bold cursor-pointer"
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
      <div className="flex items-center justify-between border-b border-[#2a243a] pb-4">
        <button
          onClick={onBackToExplore}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161224] border border-[#2a243a] text-[#f2effc] hover:border-purple-500/50 hover:text-purple-400 text-xs font-semibold transition cursor-pointer"
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
      <div className="bg-[#161224] rounded-xl p-6 sm:p-8 border border-[#2a243a] flex flex-col md:flex-row gap-6 items-start">
        <img
          src={anime.coverImage?.extraLarge || anime.coverImage?.large}
          alt={title}
          className="w-32 sm:w-40 aspect-[3/4] rounded-xl object-cover shrink-0 border border-[#2a243a] shadow-xl"
        />

        <div className="space-y-3 flex-1 min-w-0">
          {/* Unboxed Metadata Line */}
          <div className="flex items-center gap-2 text-xs text-[#a09cb0] font-medium">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {(anime.averageScore ? anime.averageScore / 10 : 0).toFixed(1)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{anime.format || 'TV'}</span>
            {anime.season && (
              <>
                <span aria-hidden="true">·</span>
                <span>{anime.season} {anime.seasonYear}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl font-extrabold font-display text-[#f2effc]">{title}</h2>

          {anime.genres && (
            <p className="text-xs text-[#a09cb0] font-medium">
              {anime.genres.join(' · ')}
            </p>
          )}

          <p
            className="text-xs sm:text-sm text-[#a09cb0] leading-relaxed line-clamp-4"
            dangerouslySetInnerHTML={{ __html: anime.description || '' }}
          />
        </div>
      </div>
    </div>
  );
};
