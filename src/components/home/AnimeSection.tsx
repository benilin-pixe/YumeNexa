import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { AnimeCard } from '../common/AnimeCard';
import { SkeletonCard } from '../common/SkeletonCard';

interface AnimeSectionProps {
  title: string;
  subtitle?: string;
  items: AnimeMedia[];
  loading?: boolean;
  onSelect: (anime: AnimeMedia) => void;
  onWatch?: (anime: AnimeMedia) => void;
  onViewAll?: () => void;
}

export const AnimeSection: React.FC<AnimeSectionProps> = ({
  title,
  subtitle,
  items,
  loading,
  onSelect,
  onWatch,
  onViewAll,
}) => {
  // Format title to highlight the last word with gradient text
  const titleWords = title.split(' ');
  const mainTitle = titleWords.length > 1 ? titleWords.slice(0, -1).join(' ') : title;
  const highlightWord = titleWords.length > 1 ? titleWords[titleWords.length - 1] : '';

  return (
    <section className="space-y-4 my-10">
      <div className="flex items-end justify-between border-b border-[#2a243a] pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#f2effc] tracking-tight">
            {mainTitle}{' '}
            {highlightWord && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400">
                {highlightWord}
              </span>
            )}
          </h2>
          {subtitle && <p className="text-xs text-[#a09cb0] mt-1">{subtitle}</p>}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 group transition cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4 scroll-smooth">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[160px] sm:w-[190px] shrink-0">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#161224] border border-[#2a243a] text-[#a09cb0] text-sm">
          No anime available in this category.
        </div>
      ) : (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4 scroll-smooth focus:outline-none">
          {items.map((anime) => (
            <div key={anime.id} className="w-[160px] sm:w-[190px] shrink-0">
              <AnimeCard anime={anime} onSelect={onSelect} onWatch={onWatch} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
