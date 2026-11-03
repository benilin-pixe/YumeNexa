import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center font-bold text-violet-400 font-display text-sm">
                Y
              </div>
            </div>
            <span className="text-lg font-bold text-white font-display">YumeNexa</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Enter the next anime universe. Discover trending shows, release schedules, news, trailers, and personal watchlists.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3 font-display">Navigation</h4>
          <ul className="space-y-2">
            <li><button onClick={() => setActiveTab('home')} className="hover:text-violet-400 transition">Home</button></li>
            <li><button onClick={() => setActiveTab('explore')} className="hover:text-violet-400 transition">Explore Anime</button></li>
            <li><button onClick={() => setActiveTab('watch')} className="hover:text-violet-400 transition">Watch & Streaming</button></li>
            <li><button onClick={() => setActiveTab('schedule')} className="hover:text-violet-400 transition">Release Schedule</button></li>
            <li><button onClick={() => setActiveTab('news')} className="hover:text-violet-400 transition">Anime News Centre</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3 font-display">Data Sources & APIs</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="https://anilist.co" target="_blank" rel="noreferrer" className="hover:text-violet-400 transition">AniList GraphQL API (Primary)</a></li>
            <li><a href="https://kitsu.io" target="_blank" rel="noreferrer" className="hover:text-violet-400 transition">Kitsu API (Supplementary)</a></li>
            <li><span className="text-slate-400">Official Studio & ANN Feeds</span></li>
            <li><a href="https://firebase.google.com" target="_blank" rel="noreferrer" className="hover:text-violet-400 transition">Firebase Firestore & Auth</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3 font-display">About YumeNexa</h4>
          <p className="text-slate-400 leading-relaxed mb-4">
            Built for anime fans worldwide with minimal, modern design and real-time release tracking.
          </p>
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for anime lovers</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} YumeNexa. All metadata powered by AniList, Kitsu, and official providers.</p>
        <p>Built for Google AI Studio Preview.</p>
      </div>
    </footer>
  );
};
