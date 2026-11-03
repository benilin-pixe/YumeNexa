import React, { useState } from 'react';
import { ExternalLink, Calendar, Newspaper } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { getPublisherBadge, handleNewsImageError } from '../../services/newsImageService';

interface NewsCardProps {
  article: NewsArticle;
  onSelect: (article: NewsArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onSelect }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const badge = getPublisherBadge(article.source);

  return (
    <div
      onClick={() => onSelect(article)}
      className="group glass-panel rounded-3xl overflow-hidden border border-slate-800/80 hover:border-violet-500/50 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-xl"
    >
      <div className="space-y-3">
        {/* Featured Article Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center text-slate-700">
              <Newspaper className="w-8 h-8 opacity-40" />
            </div>
          )}

          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={handleNewsImageError}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {/* Publisher & Category Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${badge.bg} ${badge.color}`}
            >
              {badge.name}
            </span>

            {article.category && (
              <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-300 font-semibold text-[10px] uppercase border border-slate-800">
                {article.category}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-violet-400">{article.source}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(article.publishedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h3 className="text-base font-bold text-white font-display line-clamp-2 group-hover:text-violet-400 transition leading-snug">
            {article.title}
          </h3>

          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">{article.summary}</p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition border-t border-slate-800/40">
        <span>Read Article & Source</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
