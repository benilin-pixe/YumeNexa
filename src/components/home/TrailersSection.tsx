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
      <section className="my-12 bg-[#161224] rounded-xl p-6 border border-[#2a243a] shadow-2xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Film className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold font-display text-[#f2effc]">Latest Official Anime Trailers</h2>
        </div>
        <div className="aspect-video w-full rounded-xl bg-[#0c0915] animate-pulse flex items-center justify-center text-[#a09cb0] text-xs">
          Loading verified YouTube trailers...
        </div>
      </section>
    );
  }

  if (trailers.length === 0) {
    return (
      <section className="my-12 bg-[#161224] rounded-xl p-8 border border-[#2a243a] shadow-2xl text-center space-y-2 text-xs text-[#a09cb0]">
        <p className="text-sm font-bold text-[#f2effc]">No official trailers are currently available.</p>
      </section>
    );
  }

  return (
    <section className="my-12 bg-[#161224] rounded-xl p-6 sm:p-8 border border-[#2a243a] shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-display text-[#f2effc]">
              Latest Official Anime{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
                Trailers
              </span>
            </h2>
            <p className="text-xs text-[#a09cb0]">Official promotional trailers directly associated with AniList media</p>
          </div>
        </div>

        <button
          onClick={loadTrailers}
          className="p-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-[#a09cb0] hover:text-white hover:border-purple-500/50 transition cursor-pointer"
          title="Refresh Trailers"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Embed Player */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeTrailer ? (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#0c0915] border border-[#2a243a] shadow-2xl">
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
            <div className="aspect-video w-full rounded-xl bg-[#0c0915] flex items-center justify-center text-[#a09cb0] text-xs">
              Select a trailer card to play preview
            </div>
          )}

          {activeTrailer && (
            <div className="bg-[#0c0915] p-5 rounded-xl border border-[#2a243a] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
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
                  className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#f2effc] font-display">{activeTrailer.trailerTitle}</h3>
                <p className="text-xs text-[#a09cb0] line-clamp-2 mt-1">{activeTrailer.animeMedia.description}</p>
              </div>

              {onSelectAnime && (
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => onSelectAnime(activeTrailer.animeMedia)}
                    className="btn-secondary-pill flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-400" />
                    <span>View Anime Details</span>
                  </button>
                  {onWatchAnime && (
                    <button
                      onClick={() => onWatchAnime(activeTrailer.animeMedia)}
                      className="btn-primary-pill flex items-center gap-2 text-xs cursor-pointer"
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
          <p className="text-xs font-bold text-[#a09cb0] uppercase tracking-wider mb-2">Verified Trailers</p>

          {trailers.map((item) => {
            const isSelected = activeTrailer?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTrailer(item)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500/60 text-white shadow-lg'
                    : 'bg-[#0c0915] border-[#2a243a] hover:border-purple-500/40 text-[#a09cb0]'
                }`}
              >
                <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-[#0c0915] border border-[#2a243a]">
                  <img src={item.thumbnailUrl} alt={item.trailerTitle} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div
                      className={`p-2 rounded-full ${
                        isSelected ? 'bg-gradient-to-r from-purple-600 to-sky-500 text-white' : 'bg-[#0c0915]/80 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <span className="text-[10px] font-bold text-purple-400 block uppercase">{item.category}</span>
                  <h4 className="text-xs font-bold line-clamp-2 leading-tight text-[#f2effc] font-display">{item.animeTitle}</h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
