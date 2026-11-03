import React, { useEffect, useState } from 'react';
import { X, Play, Star, Calendar, Tv, Users, Heart, Share2, Sparkles } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { getAnimeDetails } from '../../services/anilistService';
import { WatchlistButton } from './WatchlistButton';

interface AnimeDetailModalProps {
  animeId: number | null;
  initialAnime?: AnimeMedia | null;
  onClose: () => void;
  onWatch: (anime: AnimeMedia, ep?: number) => void;
  onSelectRelated: (anime: AnimeMedia) => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  animeId,
  initialAnime,
  onClose,
  onWatch,
  onSelectRelated,
}) => {
  const [details, setDetails] = useState<AnimeMedia | null>(initialAnime || null);
  const [loading, setLoading] = useState<boolean>(!initialAnime);

  useEffect(() => {
    if (!animeId) return;
    let isMounted = true;
    setLoading(true);

    getAnimeDetails(animeId)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load full anime details:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [animeId]);

  if (!animeId) return null;

  const anime = details || initialAnime;
  if (!anime) return null;

  const englishTitle = anime.title.english;
  const romajiTitle = anime.title.romaji || anime.title.userPreferred;
  const nativeTitle = anime.title.native;
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const banner = anime.bannerImage || cover;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:bg-violet-600 transition backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto custom-scrollbar">
          {/* Banner Header */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
            <img src={banner} alt={romajiTitle} className="w-full h-full object-cover filter contrast-[1.05]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          </div>

          {/* Main Info Header Grid */}
          <div className="relative px-6 sm:px-10 -mt-24 sm:-mt-32 pb-6 flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Card */}
            <div className="w-36 sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl shrink-0 bg-slate-950">
              <img src={cover} alt={romajiTitle} className="w-full h-full object-cover" />
            </div>

            {/* Title & Primary Badges */}
            <div className="flex-1 space-y-3 pt-2 sm:pt-16">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {score} / 10
                </span>
                {anime.format && (
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 font-semibold uppercase">
                    {anime.format}
                  </span>
                )}
                {anime.status && (
                  <span className="px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold capitalize">
                    {anime.status.toLowerCase().replace('_', ' ')}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display leading-tight">
                  {englishTitle || romajiTitle}
                </h1>
                {englishTitle && romajiTitle && (
                  <p className="text-xs text-slate-400 font-medium italic mt-0.5">{romajiTitle}</p>
                )}
                {nativeTitle && <p className="text-xs text-slate-500 mt-0.5">{nativeTitle}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onWatch(anime, 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-violet-600/30 hover:scale-105 transition"
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  Watch Episode 1
                </button>

                <WatchlistButton
                  animeId={anime.id}
                  title={englishTitle || romajiTitle || 'Anime'}
                  coverImage={cover || ''}
                  totalEpisodes={anime.episodes}
                />
              </div>
            </div>
          </div>

          {/* Detailed Content Tabs & Metadata */}
          <div className="px-6 sm:px-10 pb-10 space-y-8">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Episodes</span>
                <span className="text-white font-bold text-sm">{anime.episodes || 'Ongoing'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Season</span>
                <span className="text-white font-bold text-sm">
                  {anime.season} {anime.seasonYear}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Studio</span>
                <span className="text-white font-bold text-sm truncate block">
                  {anime.studios?.nodes?.[0]?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Popularity</span>
                <span className="text-white font-bold text-sm">#{anime.popularity?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h3 className="text-lg font-bold text-white font-display mb-2">Synopsis</h3>
              <p
                className="text-sm text-slate-300 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: anime.description || 'No description available.' }}
              />
            </div>

            {/* Genres & Tags */}
            {anime.genres && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Genres & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((g) => (
                    <span key={g} className="px-3 py-1 rounded-xl bg-violet-600/20 text-violet-300 text-xs font-medium border border-violet-500/30">
                      {g}
                    </span>
                  ))}
                  {anime.tags?.slice(0, 8).map((t) => (
                    <span key={t.id} className="px-3 py-1 rounded-xl bg-slate-800/60 text-slate-400 text-xs font-medium border border-slate-700/60">
                      #{t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Main Characters */}
            {anime.characters?.edges && anime.characters.edges.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white font-display mb-3">Main Characters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {anime.characters.edges.slice(0, 8).map((edge, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <img
                        src={edge.node.image?.large || edge.node.image?.medium}
                        alt={edge.node.name.full}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200 truncate">{edge.node.name.full}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{edge.role.toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {anime.recommendations?.nodes && anime.recommendations.nodes.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white font-display mb-3">Recommended Anime</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {anime.recommendations.nodes.slice(0, 4).map((rec, i) => {
                    const item = rec.mediaRecommendation;
                    if (!item) return null;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          onSelectRelated(item);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-violet-500/50 cursor-pointer group transition"
                      >
                        <img
                          src={item.coverImage?.large || item.coverImage?.medium}
                          alt={item.title.userPreferred}
                          className="w-12 h-16 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-violet-400 truncate transition">
                            {item.title.english || item.title.userPreferred}
                          </p>
                          <span className="text-[10px] text-amber-400 font-semibold">
                            ★ {(item.averageScore ? item.averageScore / 10 : 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
