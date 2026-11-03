import React from 'react';
import { Home, Compass } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
  onExplore: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome, onExplore }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="glass-panel rounded-3xl p-10 max-w-md w-full space-y-6 border border-slate-800">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-[2px] mx-auto shadow-2xl shadow-violet-600/30">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center font-extrabold text-3xl font-display text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-cyan-300">
            404
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-display text-white">Dimension Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The anime universe dimension you are looking for does not exist or has shifted timelines.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-600 text-white font-semibold text-xs shadow-lg hover:bg-violet-500 transition"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>

          <button
            onClick={onExplore}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Anime</span>
          </button>
        </div>
      </div>
    </div>
  );
};
