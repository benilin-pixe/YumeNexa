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
  return (
    <section className="space-y-4 my-8">
      <div className="flex items-end justify-between border-b border-slate-800/60 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 group transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-slate-800/60 text-slate-400 text-sm">
          No anime available in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onSelect={onSelect} onWatch={onWatch} />
          ))}
        </div>
      )}
    </section>
  );
};
