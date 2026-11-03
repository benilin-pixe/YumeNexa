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
    }, 7000);
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
    <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-950 group">
      {/* Background Image with Layered Gradient */}
      <div className="absolute inset-0">
        <img
          src={banner}
          alt={title}
          className="w-full h-full object-cover object-center scale-105 filter contrast-[1.05] transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-violet-600/90 text-white font-semibold shadow-md shadow-violet-600/30">
              # Featured #{currentIndex + 1}
            </span>
            {score && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-400 font-semibold backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {score} / 10
              </span>
            )}
            {current.format && (
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-medium backdrop-blur-md uppercase">
                {current.format}
              </span>
            )}
            {current.seasonYear && (
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-medium backdrop-blur-md">
                {current.season} {current.seasonYear}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white line-clamp-2 drop-shadow-lg leading-tight">
            {title}
          </h1>

          {/* Genres */}
          {current.genres && (
            <div className="flex flex-wrap gap-2 pt-1">
              {current.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis Preview */}
          <p className="text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
            {current.description?.replace(/<[^>]*>?/gm, '')}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={() => onWatch(current)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-xl shadow-violet-600/30 hover:scale-105 active:scale-95 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Episode 1
            </button>

            <button
              onClick={() => onSelect(current)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-sm backdrop-blur-md transition"
            >
              <Info className="w-4 h-4 text-violet-400" />
              View Details
            </button>

            <button
              onClick={() => {
                if (watchlistEntry) {
                  updateAnimeStatus(current.id, title, current.coverImage?.large || '', 'COMPLETED');
                } else {
                  updateAnimeStatus(current.id, title, current.coverImage?.large || '', 'PLANNING', 0, current.episodes || 0);
                }
              }}
              className={`p-3 rounded-2xl border text-sm backdrop-blur-md transition ${
                watchlistEntry
                  ? 'bg-emerald-600/90 border-emerald-500 text-white'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={watchlistEntry ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-violet-600 hover:text-white transition backdrop-blur-md z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-violet-600 hover:text-white transition backdrop-blur-md z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 right-8 flex items-center gap-1.5 z-20">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'w-8 bg-violet-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
