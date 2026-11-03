import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Globe, Search, Play } from 'lucide-react';
import { AiringScheduleNode, AnimeMedia } from '../types/anime';
import { getAiringSchedule } from '../services/anilistService';

interface SchedulePageProps {
  onSelectAnime: (anime: AnimeMedia) => void;
  onWatchAnime: (anime: AnimeMedia, ep?: number) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

export const SchedulePage: React.FC<SchedulePageProps> = ({ onSelectAnime, onWatchAnime }) => {
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());
  const [scheduleList, setScheduleList] = useState<AiringScheduleNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timezone, setTimezone] = useState<string>('local');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadWeeklySchedule() {
      // Query 7 days range around current time
      const start = Math.floor(Date.now() / 1000) - 24 * 3600;
      const end = start + 8 * 24 * 3600;

      try {
        const data = await getAiringSchedule(start, end);
        if (isMounted) {
          setScheduleList(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load schedule:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadWeeklySchedule();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter schedule by selected day of week
  const filteredSchedule = scheduleList.filter((item) => {
    const date = new Date(item.airingAt * 1000);
    const day = date.getDay();
    const title = item.media?.title.english || item.media?.title.userPreferred || item.media?.title.romaji || '';
    const matchesDay = day === activeDay;
    const matchesSearch = !searchTerm.trim() || title.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesDay && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-violet-500 dark:text-violet-400" />
            <h1 className="text-3xl font-black font-display text-slate-900 dark:text-white">Live Release Schedule</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time Japanese broadcasting schedule and upcoming episode release countdowns
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            <span>Timezone:</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="local" className="bg-white dark:bg-slate-900">Local Browser Time</option>
              <option value="jst" className="bg-white dark:bg-slate-900">Japan Standard Time (JST)</option>
              <option value="utc" className="bg-white dark:bg-slate-900">UTC Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {DAYS_OF_WEEK.map((d) => {
          const isActive = d.id === activeDay;
          const isToday = d.id === new Date().getDay();
          return (
            <button
              key={d.id}
              onClick={() => setActiveDay(d.id)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition shrink-0 flex flex-col items-center gap-0.5 border cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{d.label}</span>
              {isToday && <span className="text-[9px] uppercase tracking-wider text-cyan-500 dark:text-cyan-300">Today</span>}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-violet-500 dark:text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter scheduled anime title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
        />
      </div>

      {/* Schedule Items List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3 glass-panel rounded-3xl">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Fetching broadcasting schedules from AniList...</p>
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No scheduled releases found for {DAYS_OF_WEEK[activeDay].label}.
          </p>
          <p>Check back later or select another day of the week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedule.map((item) => {
            const media = item.media;
            if (!media) return null;

            const title = media.title.english || media.title.userPreferred || media.title.romaji || 'Anime Title';
            const secondsLeft = Math.max(0, item.airingAt - now);
            const isAiringInFuture = secondsLeft > 0;

            const days = Math.floor(secondsLeft / (3600 * 24));
            const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
            const minutes = Math.floor((secondsLeft % 3600) / 60);
            const seconds = secondsLeft % 60;

            const timeString = new Date(item.airingAt * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnime(media)}
                className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 hover:border-violet-500/50 cursor-pointer group transition space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={media.coverImage?.large || media.coverImage?.medium}
                    alt={title}
                    className="w-16 h-22 rounded-xl object-cover shrink-0 bg-slate-950"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-600 dark:text-violet-300 font-bold border border-violet-500/30">
                        Episode {item.episode}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{timeString}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 line-clamp-2 transition leading-tight">
                      {title}
                    </h3>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {media.genres?.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                </div>

                {/* Countdown Status Box */}
                {isAiringInFuture ? (
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-center font-mono text-[10px]">
                    <div className="bg-slate-100 dark:bg-slate-950 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-violet-600 dark:text-violet-300 text-xs">{days}</span>
                      <span className="block text-[8px] text-slate-500 uppercase">Days</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-950 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-violet-600 dark:text-violet-300 text-xs">{hours}</span>
                      <span className="block text-[8px] text-slate-500 uppercase">Hours</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-950 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-violet-600 dark:text-violet-300 text-xs">{minutes}</span>
                      <span className="block text-[8px] text-slate-500 uppercase">Mins</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-950 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-violet-600 dark:text-violet-300 text-xs">{seconds}</span>
                      <span className="block text-[8px] text-slate-500 uppercase">Secs</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Aired / Available Now
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchAnime(media, item.episode);
                      }}
                      className="px-3 py-1 rounded-xl bg-violet-600 text-white font-semibold text-[11px] hover:bg-violet-500 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Watch
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
