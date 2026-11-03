import React, { useState, useEffect } from 'react';
import {
  Shield,
  Rss,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Database,
  History,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getNewsSources,
  addNewsSource,
  deleteNewsSource,
  refreshNewsArticles,
  getNewsRefreshLogs,
  NewsSourceItem,
  NewsRefreshLogItem,
} from '../services/newsService';

export const AdminNewsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [sources, setSources] = useState<NewsSourceItem[]>([]);
  const [logs, setLogs] = useState<NewsRefreshLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New source form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [category, setCategory] = useState('News');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Manual refresh status
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sourcesData, logsData] = await Promise.all([
        getNewsSources().catch(() => []),
        getNewsRefreshLogs().catch(() => []),
      ]);
      setSources(sourcesData);
      setLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load admin news data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center my-12 space-y-4 max-w-md mx-auto border border-rose-500/30">
        <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 w-16 h-16 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-white">Access Denied</h2>
        <p className="text-xs text-slate-400">
          The RSS News Management console is strictly restricted to platform administrators.
        </p>
      </div>
    );
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setFormSubmitting(true);
    setFormError(null);

    try {
      await addNewsSource({
        name: name.trim(),
        url: url.trim(),
        siteUrl: siteUrl.trim() || undefined,
        category,
      });
      setName('');
      setUrl('');
      setSiteUrl('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add RSS source');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRemoveSource = async (id: string, sourceName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${sourceName}?`)) return;
    try {
      await deleteNewsSource(id);
      await loadData();
    } catch (err: any) {
      alert(`Error removing source: ${err.message}`);
    }
  };

  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    setRefreshError(null);

    try {
      const res = await refreshNewsArticles();
      const summary = res.summary;
      setRefreshMessage(
        `Refresh complete! Found ${summary?.totalArticlesFound || 0} articles (${summary?.totalArticlesAdded || 0} newly added). Enriched: ${summary?.enrichedCount || 0}.`
      );
      await loadData();
    } catch (err: any) {
      setRefreshError(err.message || 'Refresh operation failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalArticles = sources.reduce((acc, s) => acc + (s.articleCount || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Rss className="w-6 h-6 text-violet-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              RSS Feed & News Source Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed orchestrator, automated secondary enrichment, and live feed health diagnostics
          </p>
        </div>

        {/* Manual Refresh Now Button */}
        <button
          onClick={handleTriggerRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Ingesting Feeds...' : 'Manual Refresh Now'}</span>
        </button>
      </div>

      {/* Status Notifications */}
      {refreshMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{refreshMessage}</span>
        </div>
      )}

      {refreshError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Configured Sources</span>
            <Rss className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-white">{sources.length}</p>
          <p className="text-[10px] text-slate-500">Active automated feed ingestion</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Indexed Articles</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalArticles}</p>
          <p className="text-[10px] text-slate-500">Stored in indexed database table</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Automated Schedule</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">Every 30 min</p>
          <p className="text-[10px] text-emerald-400 font-medium">Automatic background job active</p>
        </div>
      </div>

      {/* Add New Source Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold text-white font-display">Add Authorized Anime RSS Source</h2>
        </div>

        <form onSubmit={handleAddSource} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Publisher Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Anime News Network"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Feed URL (RSS / Atom XML)</label>
              <input
                type="url"
                required
                placeholder="https://.../feed.xml"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Website URL (Optional)</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Default Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="News">News</option>
                <option value="Industry">Industry</option>
                <option value="General">General</option>
                <option value="Reviews">Reviews</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-400 font-medium">{formError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting ? 'Adding Source...' : 'Add RSS Source'}
            </button>
          </div>
        </form>
      </div>

      {/* Sources Table / Cards */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-bold text-white font-display">Active Sources & Live Status</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{sources.length} sources registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800/80 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Publisher</th>
                <th className="py-3 px-4">Feed URL</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Stored Articles</th>
                <th className="py-3 px-4">Last Refresh</th>
                <th className="py-3 px-4">Last Error</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sources.map((src) => {
                const isSuccess = src.lastRefreshStatus === 'SUCCESS';
                const isError = src.lastRefreshStatus === 'ERROR';

                return (
                  <tr key={src.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {src.name}
                      <span className="block text-[10px] text-slate-500 font-normal">{src.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-violet-400 flex items-center gap-1"
                      >
                        <span className="truncate">{src.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isError
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {src.lastRefreshStatus || 'INITIAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white font-mono">
                      {src.articleCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                      {src.lastRefreshAt ? new Date(src.lastRefreshAt).toLocaleTimeString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 text-[11px] max-w-xs truncate">
                      {src.lastError || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRemoveSource(src.id, src.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Outcomes Log History */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white font-display">Refresh Outcome Audit Logs</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 30 ingestion runs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800/80 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-center">Found</th>
                <th className="py-3 px-4 text-center">Added</th>
                <th className="py-3 px-4">Notes / Error Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No refresh logs recorded yet. Click "Manual Refresh Now" above to initiate a run.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isOk = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white font-sans">{log.sourceName}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-300">{log.articlesFound}</td>
                      <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">
                        +{log.articlesAdded}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 max-w-sm truncate">
                        {log.errorMessage ? (
                          <span className="text-rose-400">{log.errorMessage}</span>
                        ) : (
                          <span className="text-slate-600">Completed successfully</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminNewsPage;
