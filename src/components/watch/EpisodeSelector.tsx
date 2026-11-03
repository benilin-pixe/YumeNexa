import React, { useState } from 'react';
import { Play, Check, Search } from 'lucide-react';

interface EpisodeSelectorProps {
  totalEpisodes: number;
  currentEpisode: number;
  onSelectEpisode: (ep: number) => void;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  totalEpisodes,
  currentEpisode,
  onSelectEpisode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const count = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 24; // Default range if total episodes is continuous or unknown
  const episodes = Array.from({ length: count }, (_, i) => i + 1);

  const filtered = episodes.filter((ep) => ep.toString().includes(searchTerm));

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div>
          <h3 className="text-lg font-bold font-display text-white">Select Episode</h3>
          <p className="text-xs text-slate-400">Total available episodes: {count}</p>
        </div>

        {/* Filter search */}
        <div className="relative w-full sm:w-40">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ep #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2.5 max-h-72 overflow-y-auto no-scrollbar pr-1">
        {filtered.map((ep) => {
          const isCurrent = ep === currentEpisode;
          const isWatched = ep < currentEpisode;

          return (
            <button
              key={ep}
              onClick={() => onSelectEpisode(ep)}
              className={`relative py-3 rounded-2xl font-bold text-xs transition flex flex-col items-center justify-center gap-1 border ${
                isCurrent
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border-violet-400 shadow-lg shadow-violet-600/30 scale-105 z-10'
                  : isWatched
                  ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  : 'bg-slate-950 border-slate-900 text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>EP {ep}</span>
              {isCurrent && <Play className="w-3 h-3 fill-white" />}
              {isWatched && <Check className="w-3 h-3 text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
