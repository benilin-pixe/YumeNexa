import React, { useState, useEffect, useRef } from 'react';
import { Play, Film, ExternalLink, RefreshCw, Star, Tv } from 'lucide-react';
import { fetchAniListRealTrailers, AniListTrailerItem } from '../../services/anilistTrailerService';
import { AnimeMedia } from '../../types/anime';

interface TrailersSectionProps {
  onSelectAnime?: (anime: AnimeMedia) => void;
  onWatchAnime?: (anime: AnimeMedia) => void;
}

export const TrailersSection: React.FC<TrailersSectionProps> = ({ onSelectAnime, onWatchAnime }) => {
  const [trailers, setTrailers] = useState<AniListTrailerItem[]>([]);
  const [activeTrailer, setActiveTrailer] = useState<AniListTrailerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const loadTrailers = async () => {
    setLoading(true);
    try {
      const data = await fetchAniListRealTrailers(10);
      setTrailers(data);
      if (data.length > 0) {
        setActiveTrailer(data[0]);
      }
    } catch (err) {
      console.warn('TrailersSection load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrailers();
  }, []);

  // Autoplay logic using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
            // Autoplay logic (YouTube autoplay parameter in src URL)
        } else {
            // Pause logic (could reload src or handle via message)
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [activeTrailer]);

  if (loading) {
    return (
      <section className="my-12 glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
            <Film className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-display text-white">Latest Official Anime Trailers</h2>
        </div>
        <div className="aspect-video w-full rounded-2xl bg-slate-900/60 animate-pulse flex items-center justify-center text-slate-500 text-xs">
          Loading verified YouTube trailers...
        </div>
      </section>
    );
  }

  if (trailers.length === 0) {
    return (
      <section className="my-12 glass-panel rounded-3xl p-8 border border-slate-800/80 shadow-2xl text-center space-y-2 text-xs text-slate-400">
        <p className="text-sm font-semibold text-white">No official trailers are currently available.</p>
      </section>
    );
  }

  return (
    <section className="my-12 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Latest Official Anime Trailers</h2>
            <p className="text-xs text-slate-400">Official promotional trailers directly associated with AniList media</p>
          </div>
        </div>

        <button
          onClick={loadTrailers}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh Trailers"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Embed Player */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeTrailer ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <iframe
                ref={videoRef}
                key={activeTrailer.id}
                src={`${activeTrailer.embedUrl}&autoplay=1&mute=1&playsinline=1`}
                title={activeTrailer.trailerTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
              Select a trailer card to play preview
            </div>
          )}

          {activeTrailer && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-600/20 text-violet-300 font-bold border border-violet-500/30">
                    {activeTrailer.category}
                  </span>
                  {activeTrailer.animeMedia.averageScore && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {(activeTrailer.animeMedia.averageScore / 10).toFixed(1)}
                    </span>
                  )}
                </div>

                <a
                  href={activeTrailer.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:underline"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-display">{activeTrailer.trailerTitle}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{activeTrailer.animeMedia.description}</p>
              </div>

              {onSelectAnime && (
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => onSelectAnime(activeTrailer.animeMedia)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    <Tv className="w-3.5 h-3.5 text-violet-400" />
                    <span>View Anime Details</span>
                  </button>
                  {onWatchAnime && (
                    <button
                      onClick={() => onWatchAnime(activeTrailer.animeMedia)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      <span>Watch Episode 1</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Playlist Selector */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 no-scrollbar">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verified Trailers</p>

          {trailers.map((item) => {
            const isSelected = activeTrailer?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTrailer(item)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-violet-600/20 border-violet-500/50 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="relative w-28 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                  <img src={item.thumbnailUrl} alt={item.trailerTitle} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div
                      className={`p-2 rounded-full ${
                        isSelected ? 'bg-violet-600 text-white' : 'bg-slate-950/80 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <span className="text-[10px] font-bold text-violet-400 block uppercase">{item.category}</span>
                  <h4 className="text-xs font-bold line-clamp-2 leading-tight">{item.animeTitle}</h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
