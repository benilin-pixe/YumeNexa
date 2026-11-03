import React, { useState, useEffect } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { useWatchlist } from '../../contexts/WatchlistContext';

interface HeroCarouselProps {
  items: AnimeMedia[];
  onSelect: (anime: AnimeMedia) => void;
  onWatch: (anime: AnimeMedia) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items, onSelect, onWatch }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { getItemStatus, updateAnimeStatus } = useWatchlist();

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (items.length === 0) return null;

  const current = items[currentIndex];
  const title = current.title.english || current.title.userPreferred || current.title.romaji || 'Featured Anime';
  const banner = current.bannerImage || current.coverImage?.extraLarge || current.coverImage?.large;
  const score = current.averageScore ? (current.averageScore / 10).toFixed(1) : null;
  const watchlistEntry = getItemStatus(current.id);

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);

  return (
    <div className="relative w-full min-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-[#2a243a] bg-[#0c0915] group">
      {/* Background Image with Faded Opacity & Layered Gradient Overlays */}
      <div className="absolute inset-0">
        <img
          src={banner}
          alt={title}
          className="w-full h-full object-cover object-center scale-105 opacity-50 filter contrast-[1.1] transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0915] via-[#0c0915]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0915] via-transparent to-transparent" />
      </div>

      {/* Floating Particle Dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 bg-purple-400 rounded-full blur-[1px] animate-particle-1" />
        <div className="absolute top-1/2 left-2/3 w-2 h-2 bg-sky-400 rounded-full blur-[1px] animate-particle-2" />
        <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-pink-400 rounded-full blur-[1px] animate-particle-3" />
        <div className="absolute top-1/3 left-3/4 w-2 h-2 bg-purple-500 rounded-full blur-[1px] animate-particle-4" />
      </div>

      {/* Content Container */}
      <div className="relative h-full min-h-[70vh] max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-12 sm:pb-16 z-20">
        <div className="max-w-2xl space-y-4">
          {/* Small Uppercase Tagline in Electric Blue */}
          <div className="flex items-center gap-2.5">
            <span className="text-sky-400 uppercase tracking-[0.25em] text-xs font-bold font-display">
              Spotlight #{currentIndex + 1}
            </span>
            {score && (
              <>
                <span className="text-[#2a243a]" aria-hidden="true">•</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {score}
                </span>
              </>
            )}
            {current.format && (
              <>
                <span className="text-[#2a243a]" aria-hidden="true">•</span>
                <span className="text-[#a09cb0] text-xs font-medium">{current.format}</span>
              </>
            )}
          </div>

          {/* Huge Extra-Bold Title */}
          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#f8f7fa] line-clamp-2 leading-[1.1] drop-shadow-xl">
            {title}
          </h1>

          {/* Genre Pills */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {current.genres.slice(0, 4).map((g, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-[#2a243a] bg-[#161224]/80 backdrop-blur-md text-[#f8f7fa] text-xs font-semibold px-3 py-1 shadow-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis Description (3-line clamped) */}
          <p className="text-xs sm:text-base text-[#a09cb0] line-clamp-3 leading-relaxed max-w-xl font-body">
            {current.description?.replace(/<[^>]*>?/gm, '')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <button
              onClick={() => onWatch(current)}
              className="btn-primary-pill px-7 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => onSelect(current)}
              className="btn-secondary-pill px-6 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-4 h-4 text-sky-400" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                if (watchlistEntry) {
                  updateAnimeStatus(current.id, title, current.coverImage?.large || '', 'COMPLETED');
                } else {
                  updateAnimeStatus(current.id, title, current.coverImage?.large || '', 'PLANNING', 0, current.episodes || 0);
                }
              }}
              className={`p-3 rounded-full border text-xs sm:text-sm transition cursor-pointer ${
                watchlistEntry
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-[#161224] border-[#2a243a] text-[#a09cb0] hover:text-white hover:border-[#a855f7]/60'
              }`}
              title={watchlistEntry ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#161224]/80 border border-[#2a243a] text-[#a09cb0] opacity-0 group-hover:opacity-100 hover:text-white hover:border-[#a855f7]/60 transition backdrop-blur-md z-30 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#161224]/80 border border-[#2a243a] text-[#a09cb0] opacity-0 group-hover:opacity-100 hover:text-white hover:border-[#a855f7]/60 transition backdrop-blur-md z-30 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 right-8 flex items-center gap-2 z-30">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              idx === currentIndex ? 'w-8 bg-gradient-to-r from-purple-500 to-sky-400' : 'w-2 bg-[#2a243a] hover:bg-[#a09cb0]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
