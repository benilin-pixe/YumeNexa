import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-slate-600 dark:text-slate-400 text-xs mt-20 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="YumeNexa Logo" className="w-7 h-7 rounded-lg shadow-sm" />
            <span className="text-lg font-bold text-slate-900 dark:text-white font-display">YumeNexa</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Enter the next anime universe. Discover trending shows, release schedules, news, trailers, and personal watchlists.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 font-display">Navigation</h4>
          <ul className="space-y-2">
            <li><button onClick={() => setActiveTab('home')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Home</button></li>
            <li><button onClick={() => setActiveTab('explore')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Explore Anime</button></li>
            <li><button onClick={() => setActiveTab('watch')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Watch & Streaming</button></li>
            <li><button onClick={() => setActiveTab('schedule')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Release Schedule</button></li>
            <li><button onClick={() => setActiveTab('news')} className="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer">Anime News Centre</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 font-display">Data Sources & APIs</h4>
          <ul className="space-y-2 text-slate-500 dark:text-slate-400">
            <li><a href="https://anilist.co" target="_blank" rel="noreferrer" className="hover:text-violet-600 dark:hover:text-violet-400 transition">AniList GraphQL API</a></li>
            <li><a href="https://kitsu.io" target="_blank" rel="noreferrer" className="hover:text-violet-600 dark:hover:text-violet-400 transition">Kitsu API</a></li>
            <li><span>Official Studio & ANN Feeds</span></li>
            <li><a href="https://firebase.google.com" target="_blank" rel="noreferrer" className="hover:text-violet-600 dark:hover:text-violet-400 transition">Firebase Firestore & Auth</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 font-display">About YumeNexa</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            Built for anime fans worldwide with minimal, modern design and real-time release tracking.
          </p>
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for anime lovers</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} YumeNexa. All metadata powered by AniList, Kitsu, and official providers.</p>
        <p>Built for Google AI Studio Preview.</p>
      </div>
    </footer>
  );
};
