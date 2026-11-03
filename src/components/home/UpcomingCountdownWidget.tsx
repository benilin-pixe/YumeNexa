import React, { useState, useEffect } from 'react';
import { Clock, Play, Calendar } from 'lucide-react';
import { AiringScheduleNode, AnimeMedia } from '../../types/anime';

interface UpcomingCountdownWidgetProps {
  schedule: AiringScheduleNode[];
  onSelect: (anime: AnimeMedia) => void;
  onWatch: (anime: AnimeMedia) => void;
}

export const UpcomingCountdownWidget: React.FC<UpcomingCountdownWidgetProps> = ({
  schedule,
  onSelect,
  onWatch,
}) => {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (schedule.length === 0) return null;

  return (
    <div className="w-full glass-panel rounded-3xl p-6 border border-slate-800/80 my-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Live Episode Countdowns</h2>
            <p className="text-xs text-slate-400">Next scheduled airing releases around the globe</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedule.slice(0, 6).map((item) => {
          const media = item.media;
          if (!media) return null;

          const title = media.title.english || media.title.userPreferred || media.title.romaji || 'Anime Episode';
          const secondsLeft = Math.max(0, item.airingAt - now);

          const days = Math.floor(secondsLeft / (3600 * 24));
          const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
          const minutes = Math.floor((secondsLeft % 3600) / 60);
          const seconds = secondsLeft % 60;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(media)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/50 cursor-pointer group transition"
            >
              {/* Cover */}
              <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-950">
                <img
                  src={media.coverImage?.large || media.coverImage?.medium}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-violet-950/90 text-violet-300 text-[9px] font-bold border border-violet-700/50">
                  EP {item.episode}
                </span>
              </div>

              {/* Countdown & Title */}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-xs font-semibold text-white group-hover:text-violet-400 truncate transition">
                  {title}
                </h4>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 text-violet-400" />
                  <span>
                    {new Date(item.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Timer Box */}
                <div className="grid grid-cols-4 gap-1 pt-1 text-center font-mono text-[10px]">
                  <div className="bg-slate-950/80 py-0.5 rounded border border-slate-800/80">
                    <span className="font-bold text-violet-300">{days}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">d</span>
                  </div>
                  <div className="bg-slate-950/80 py-0.5 rounded border border-slate-800/80">
                    <span className="font-bold text-violet-300">{hours}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">h</span>
                  </div>
                  <div className="bg-slate-950/80 py-0.5 rounded border border-slate-800/80">
                    <span className="font-bold text-violet-300">{minutes}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">m</span>
                  </div>
                  <div className="bg-slate-950/80 py-0.5 rounded border border-slate-800/80">
                    <span className="font-bold text-violet-300">{seconds}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">s</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
