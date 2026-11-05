import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, PieChart, Calendar } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';

interface TrendsSectionProps {
  trendingAnime: AnimeMedia[];
}

export const TrendsSection: React.FC<TrendsSectionProps> = ({ trendingAnime }) => {
  const { genreData, releaseData } = useMemo(() => {
    const genreCount: Record<string, number> = {};
    const releaseCount: Record<string, number> = {};

    trendingAnime.forEach((anime) => {
      // Aggregate Genres
      anime.genres?.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });

      // Aggregate Releases (if startDate exists)
      if (anime.startDate?.year && anime.startDate?.month) {
        const dateKey = `${anime.startDate.year}-${anime.startDate.month}`;
        releaseCount[dateKey] = (releaseCount[dateKey] || 0) + 1;
      }
    });

    return {
      genreData: Object.entries(genreCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      releaseData: Object.entries(releaseCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [trendingAnime]);

  return (
    <section className="glass-panel rounded-3xl p-6 border border-purple-500/20 shadow-2xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold font-display text-white">Market Trends</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Popularity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <PieChart className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Top Genres</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Release Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Release Activity</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={releaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#0ea5e9" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
