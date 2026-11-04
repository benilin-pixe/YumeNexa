import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  return (
    <footer className="bg-[#161224] border-t border-[#2a243a] py-12 px-4 sm:px-6 lg:px-8 text-[#a09cb0] text-xs mt-20 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0c0915] rounded-[7px] flex items-center justify-center">
                <span className="font-extrabold text-xs text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">YN</span>
              </div>
            </div>
            <span className="text-lg font-extrabold tracking-[0.2em] font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400 uppercase">
              YUMENEXA
            </span>
          </div>
          <p className="text-[#a09cb0] leading-relaxed">
            Enter the next anime universe. Discover trending shows, release schedules, news, and personal watchlists with high fidelity.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#f2effc] mb-3 font-display">Navigation</h4>
          <ul className="space-y-2">
            <li><button onClick={() => setActiveTab('home')} className="hover:text-purple-400 transition cursor-pointer">Home</button></li>
            <li><button onClick={() => setActiveTab('explore')} className="hover:text-purple-400 transition cursor-pointer">Explore Anime</button></li>
            <li><button onClick={() => setActiveTab('watch')} className="hover:text-purple-400 transition cursor-pointer">Watch & Streaming</button></li>
            <li><button onClick={() => setActiveTab('schedule')} className="hover:text-purple-400 transition cursor-pointer">Release Schedule</button></li>
            <li><button onClick={() => setActiveTab('news')} className="hover:text-purple-400 transition cursor-pointer">Anime News Centre</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#f2effc] mb-3 font-display">Data Sources & APIs</h4>
          <ul className="space-y-2 text-[#a09cb0]">
            <li><a href="https://anilist.co" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition">AniList GraphQL API</a></li>
            <li><a href="https://kitsu.io" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition">Kitsu API</a></li>
            <li><span>Official Studio & ANN Feeds</span></li>
            <li><a href="https://firebase.google.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition">Firebase Firestore & Auth</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#f2effc] mb-3 font-display">About YumeNexa</h4>
          <p className="text-[#a09cb0] leading-relaxed mb-4">
            Built for anime fans worldwide with minimal, modern dark design and real-time release tracking.
          </p>
          <div className="flex items-center gap-1.5 text-[#a09cb0] text-[11px]">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
            <span>for anime lovers</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#2a243a] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#a09cb0]">
        <p>© {new Date().getFullYear()} YumeNexa. All metadata powered by AniList, Kitsu, and official providers.</p>
        <p>Built for Google AI Studio Preview.</p>
      </div>
    </footer>
  );
};
