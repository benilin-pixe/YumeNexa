import React from 'react';
import { X, ExternalLink, Calendar, User, Newspaper } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { getPublisherBadge, handleNewsImageError } from '../../services/newsImageService';

interface NewsDetailModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  const badge = getPublisherBadge(article.source);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-violet-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
          {/* Header Image or Video */}
          {article.videoUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
              <iframe
                src={article.videoUrl}
                title={article.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={article.imageUrl}
                alt={article.title}
                onError={handleNewsImageError}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>
          )}

          {/* Article Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 text-xs text-slate-400">
              <span
                className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${badge.bg} ${badge.color}`}
              >
                {article.source}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  {article.author || article.source}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  {new Date(article.publishedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display leading-snug">
              {article.title}
            </h1>
          </div>

          {/* Article Content Excerpt */}
          <div className="text-sm text-slate-200 leading-relaxed space-y-4 font-sans">
            <p className="text-slate-300 leading-relaxed">{article.summary}</p>
            <p className="text-xs text-slate-400 italic bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              Published by {article.source}. All article rights and copyright belong to the original publisher.
            </p>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
              {article.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* External Publisher Link */}
          <div className="pt-4 flex justify-end">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-xl hover:scale-105 transition"
            >
              <span>Read Full Article on {article.source}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
