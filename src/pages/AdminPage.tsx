import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Users,
  Film,
  Rss,
  Server,
  Settings,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Lock,
  FileText,
  Clock,
  TrendingUp,
  Database,
  Tv,
  Check,
  XCircle,
  PlaySquare,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllUsers,
  updateUserAccountStatus,
  updateUserRole,
  UserAdminRecord,
  getOverviewStats,
  AdminOverviewStats,
} from '../services/adminService';
import { getRecentAuditLogs, AuditLogEntry, logAdminAction } from '../services/adminAuditService';
import { fetchSystemHealthMetrics, SystemHealthMetrics } from '../services/systemMonitoringService';
import { getPlaybackMetricsSummary } from '../services/playbackService';
import { getNewsHealth, getAllNewsSourcesWithStats } from '../services/animeNewsService';
import { createAnnouncement } from '../services/firestoreService';
import { validateFirestoreConnection } from '../config/firebase';
import { getTrendingAnime } from '../services/anilistService';
import { ConfirmationModal } from '../components/admin/ConfirmationModal';

export const AdminPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'content' | 'streaming' | 'news' | 'system' | 'settings'
  >('overview');

  // Dashboard States
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [usersList, setUsersList] = useState<UserAdminRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [playbackMetrics, setPlaybackMetrics] = useState<any>(null);
  const [newsHealth, setNewsHealth] = useState<any>(null);
  const [newsSources, setNewsSources] = useState<any[]>([]);
  const [newsLogs, setNewsLogs] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success'>('info');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);
  const [refreshingNews, setRefreshingNews] = useState(false);

  // Confirmation Modal State
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'toggleStatus' | 'toggleRole' | 'refreshNews' | 'postAnnouncement';
    targetUid?: string;
    targetCurrentVal?: string;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'toggleStatus',
  });
  const [actionProcessing, setActionProcessing] = useState(false);

  const loadAdminDashboardData = async () => {
    setLoadingData(true);
    setErrorMessage(null);
    try {
      const [stats, users, logs, health, playback, newsH, sources, trending] = await Promise.all([
        getOverviewStats(),
        getAllUsers(),
        getRecentAuditLogs(50),
        fetchSystemHealthMetrics(),
        Promise.resolve(getPlaybackMetricsSummary()),
        getNewsHealth(),
        Promise.resolve(getAllNewsSourcesWithStats()),
        getTrendingAnime(1, 12),
      ]);

      setOverviewStats(stats);
      setUsersList(users);
      setAuditLogs(logs);
      setSystemHealth(health);
      setPlaybackMetrics(playback);
      setNewsHealth(newsH);
      setNewsSources(sources);
      setCatalogItems(trending.media || []);

      // Fetch news refresh logs if available
      try {
        const logsRes = await fetch('/api/news/logs');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setNewsLogs(Array.isArray(logsData) ? logsData : []);
        }
      } catch {
        // Soft fallback for news logs
      }
    } catch (err: any) {
      console.error('[Admin Dashboard] Error loading data:', err);
      setErrorMessage(err.message || 'Failed to load administrative dashboard metrics');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminDashboardData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center my-16 space-y-6 max-w-lg mx-auto border border-rose-500/30 shadow-2xl">
        <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 w-16 h-16 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-white">Access Denied / Unauthorized</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The YumeNexa Secure Admin Dashboard is strictly restricted to verified administrators.
            Your account (<span className="text-rose-400 font-semibold">{currentUser?.email || 'Guest'}</span>) does not have administrator privileges.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = '/')}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer"
        >
          Return to Universe Home
        </button>
      </div>
    );
  }

  // Confirmation Modal Trigger Handlers
  const triggerStatusToggleConfirmation = (user: UserAdminRecord) => {
    const isSuspending = user.status === 'active';
    setConfirmationState({
      isOpen: true,
      title: isSuspending ? `Suspend User Account?` : `Reactivate User Account?`,
      message: isSuspending
        ? `Are you sure you want to suspend account ${user.email}? The user will be unable to sign in or modify their watchlist.`
        : `Are you sure you want to reactivate account ${user.email}? Full platform access will be restored.`,
      actionType: 'toggleStatus',
      targetUid: user.uid,
      targetCurrentVal: user.status,
      variant: isSuspending ? 'danger' : 'warning',
    });
  };

  const triggerRoleToggleConfirmation = (user: UserAdminRecord) => {
    const isPromoting = user.role === 'user';
    setConfirmationState({
      isOpen: true,
      title: isPromoting ? `Grant Administrator Access?` : `Revoke Administrator Access?`,
      message: isPromoting
        ? `Are you sure you want to promote ${user.email} to Administrator? They will receive full administrative control over users, content, and settings.`
        : `Are you sure you want to revoke Administrator access for ${user.email}? They will be demoted to a regular user.`,
      actionType: 'toggleRole',
      targetUid: user.uid,
      targetCurrentVal: user.role,
      variant: isPromoting ? 'warning' : 'danger',
    });
  };

  const executeConfirmedAction = async () => {
    setActionProcessing(true);
    try {
      if (confirmationState.actionType === 'toggleStatus' && confirmationState.targetUid) {
        const nextStatus = confirmationState.targetCurrentVal === 'active' ? 'suspended' : 'active';
        await updateUserAccountStatus(confirmationState.targetUid, nextStatus);
        setUsersList((prev) =>
          prev.map((u) => (u.uid === confirmationState.targetUid ? { ...u, status: nextStatus } : u))
        );
      } else if (confirmationState.actionType === 'toggleRole' && confirmationState.targetUid) {
        const nextRole = confirmationState.targetCurrentVal === 'admin' ? 'user' : 'admin';
        await updateUserRole(confirmationState.targetUid, nextRole);
        setUsersList((prev) =>
          prev.map((u) => (u.uid === confirmationState.targetUid ? { ...u, role: nextRole } : u))
        );
      } else if (confirmationState.actionType === 'refreshNews') {
        setRefreshingNews(true);
        const res = await fetch('/api/news/refresh', { method: 'POST' });
        if (res.ok) {
          await logAdminAction('NEWS_REFRESH_MANUAL', 'NEWS', 'Triggered manual news feeds synchronization.');
          await loadAdminDashboardData();
        }
      }
    } catch (err: any) {
      console.error('Action execution failed:', err);
    } finally {
      setActionProcessing(false);
      setRefreshingNews(false);
      setConfirmationState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    setPostingAnnouncement(true);
    try {
      await createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        type: announcementType,
        active: true,
        createdAt: new Date().toISOString(),
      });
      await logAdminAction('CREATE_ANNOUNCEMENT', 'SETTINGS', `Published broadcast announcement: "${announcementTitle}"`);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementSuccess(true);
      setTimeout(() => setAnnouncementSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to post announcement:', err);
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const missingArtworkCount = catalogItems.filter((item) => !item.coverImage?.large).length;
  const missingTrailerCount = catalogItems.filter((item) => !item.trailer?.id).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        variant={confirmationState.variant}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        isLoading={actionProcessing}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmationState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white">YumeNexa Secure Admin Dashboard</h1>
              <p className="text-xs text-slate-400">
                Authenticated Admin: <span className="text-violet-400 font-semibold">{currentUser?.email}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminDashboardData}
            disabled={loadingData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-violet-400 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'content', label: 'Content Management', icon: Film },
          { id: 'streaming', label: 'Streaming & Player', icon: PlaySquare },
          { id: 'news', label: 'News Center', icon: Rss },
          { id: 'system', label: 'System Monitoring', icon: Server },
          { id: 'settings', label: 'Admin Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Registered Users</span>
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-3xl font-black font-display text-white">{overviewStats?.totalUsers ?? usersList.length}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">{overviewStats?.activeUsers ?? 0} Active Accounts</span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Saved Watchlists</span>
                <Tv className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-black font-display text-white">{overviewStats?.totalWatchlists ?? 0}</div>
              <span className="text-[10px] text-slate-400 font-semibold">User Library Entries</span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">News Articles</span>
                <Rss className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black font-display text-white">{overviewStats?.totalNewsArticles ?? 0}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">AniNewsAPI Synchronized</span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">System Uptime</span>
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-black font-display text-white">{systemHealth?.uptimeSeconds ?? 0}s</div>
              <span className="text-[10px] text-emerald-400 font-semibold">Server Running</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                <span>Audit Logs & Administrative Trail</span>
              </h3>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No administrative audit logs recorded yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {auditLogs.map((log, idx) => (
                    <div key={log.id || idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-violet-600/20 text-violet-300 font-bold text-[10px] uppercase">
                            {log.category}
                          </span>
                          <span className="text-xs font-bold text-white">{log.action}</span>
                        </div>
                        <p className="text-xs text-slate-300">{log.details}</p>
                        <span className="text-[10px] text-slate-500 font-mono">Admin: {log.adminEmail}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Diagnostics Summary</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Node Express Server:</span>
                  <span className={`font-bold ${systemHealth?.serverStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {systemHealth?.serverStatus || 'Offline'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Firebase Firestore:</span>
                  <span className={`font-bold ${systemHealth?.firebaseStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {systemHealth?.firebaseStatus || 'Checking...'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Memory Heap Used:</span>
                  <span className="text-white font-mono">{systemHealth?.memoryHeapUsedMb ?? 0} MB</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Environment:</span>
                  <span className="text-violet-400 font-semibold capitalize">{systemHealth?.environment ?? 'Production'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                <span>User Accounts & Permissions</span>
              </h3>
              <p className="text-xs text-slate-400">Manage account status and administrator privilege assignments.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search email or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
              <p>No registered users found matching your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-display text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User / Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => triggerStatusToggleConfirmation(u)}
                          className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => triggerRoleToggleConfirmation(u)}
                          className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold text-[11px] transition cursor-pointer"
                        >
                          Make {u.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTENT MANAGEMENT */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>Anime Catalog & Metadata Health Check</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">AniList GraphQL Catalog</span>
                <div className="text-2xl font-bold font-display text-emerald-400">
                  {catalogItems.length > 0 ? 'Connected' : 'Offline'}
                </div>
                <p className="text-[11px] text-slate-400">{catalogItems.length} titles inspected live.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Missing Artwork</span>
                <div className="text-2xl font-bold font-display text-white">{missingArtworkCount} Titles</div>
                <p className="text-[11px] text-slate-400">Titles missing cover image asset.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Missing Trailers</span>
                <div className="text-2xl font-bold font-display text-amber-400">{missingTrailerCount} Titles</div>
                <p className="text-[11px] text-slate-400">Titles missing YouTube trailer key.</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Sample Anime Metadata Verification</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catalogItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                    <img
                      src={item.coverImage?.medium || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&q=80'}
                      alt={item.title?.userPreferred}
                      className="w-10 h-14 object-cover rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{item.title?.userPreferred || item.title?.english}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.format} • {item.episodes || '?'} Episodes</p>
                      <span className={`text-[10px] font-semibold ${item.trailer?.id ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.trailer?.id ? 'Trailer Valid' : 'No Trailer Key'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STREAMING & PLAYER MONITORING */}
      {activeTab === 'streaming' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-blue-400" />
              <span>Streaming & Player Performance Metrics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Recorded Playback Requests</span>
                <div className="text-2xl font-bold text-white font-display">{playbackMetrics?.totalRequests || 0}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Stream Success Rate</span>
                <div className="text-2xl font-bold text-emerald-400 font-display">{playbackMetrics?.successRate || 100}%</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Average Provider Latency</span>
                <div className="text-2xl font-bold text-violet-400 font-display">{playbackMetrics?.averageLatencyMs || 45} ms</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                AniEmbed v2 Provider Integration Specs
              </span>
              <p className="text-slate-400">
                Pattern: <code className="text-violet-300 font-mono">https://aniembed.se/e/&#123;anilistId&#125;/&#123;episode&#125;?lang=sub|dub&autoplay=1&t=SECONDS</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NEWS CENTER MONITORING */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Rss className="w-5 h-5 text-emerald-400" />
                <span>News Center & RSS Feeds Monitoring</span>
              </h3>

              <button
                onClick={() =>
                  setConfirmationState({
                    isOpen: true,
                    title: 'Refresh News Feeds?',
                    message: 'Are you sure you want to trigger a manual news ingestion and deduplication cycle across all RSS sources?',
                    actionType: 'refreshNews',
                    variant: 'info',
                  })
                }
                disabled={refreshingNews}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingNews ? 'animate-spin' : ''}`} />
                <span>Trigger Manual Feed Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">AniNewsAPI Status</span>
                <div className="text-lg font-bold text-emerald-400">{newsHealth?.status || 'Connected'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Configured RSS Sources</span>
                <div className="text-lg font-bold text-white">{newsSources.length} Active Feeds</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Deduplication Engine</span>
                <div className="text-lg font-bold text-violet-400">SHA-256 Active</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Configured RSS Feed Sources</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newsSources.map((source, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{source.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{source.url}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      {source.status || 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM MONITORING */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-violet-400" />
              <span>System & Server Health Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Server Process Uptime</span>
                <div className="text-lg font-bold text-emerald-400 font-mono">{systemHealth?.uptimeSeconds ?? 0}s</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Memory Heap Used</span>
                <div className="text-lg font-bold text-white font-mono">{systemHealth?.memoryHeapUsedMb ?? 0} MB</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Firebase Firestore</span>
                <div className="text-lg font-bold text-emerald-400">{systemHealth?.firebaseStatus ?? 'Connected'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Runtime Node Version</span>
                <div className="text-lg font-bold text-violet-400 font-mono">{systemHealth?.nodeVersion ?? 'v22.x'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-300">Test live Firestore Database connectivity directly from browser:</span>
              <button
                onClick={async () => {
                  const isOk = await validateFirestoreConnection();
                  alert(isOk ? 'Firestore Database Connection Test Successful!' : 'Firestore Connection Failed');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
              >
                Test Firestore Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ADMIN SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-violet-400" />
              <span>Broadcast System Announcement</span>
            </h3>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Scheduled Seasonal Maintenance"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Banner Style</label>
                  <select
                    value={announcementType}
                    onChange={(e) => setAnnouncementType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="info">Info (Violet)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="success">Success (Emerald)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Announcement Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter message visible to all active users..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={postingAnnouncement}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs shadow-lg hover:bg-violet-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {postingAnnouncement ? 'Publishing...' : 'Publish Broadcast'}
                </button>

                {announcementSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Broadcast published successfully!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
