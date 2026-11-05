import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Power,
  Sparkles,
} from 'lucide-react';
import {
  getAllAnnouncements,
  createAnnouncement,
  toggleAnnouncementActive,
  deleteAnnouncement,
} from '../../services/firestoreService';
import { SystemAnnouncement } from '../../types/user';

export const AdminNotificationsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // New announcement form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.warn('Load notifications notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        type,
        active: true,
      });

      setTitle('');
      setContent('');
      setType('info');
      showToast('New system notification published successfully.');
      await loadAnnouncements();
    } catch (err: any) {
      showToast(err.message || 'Failed to create notification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: SystemAnnouncement) => {
    try {
      await toggleAnnouncementActive(item.id, !item.active);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, active: !item.active } : a))
      );
      showToast(`Notification ${!item.active ? 'Activated' : 'Deactivated'}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update notification');
    }
  };

  const handleDelete = async (id: string, annTitle: string) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast(`Notification "${annTitle}" deleted.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete notification');
    }
  };

  const iconTypeMap = {
    info: <Info className="w-4 h-4 text-sky-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Creation Form */}
      <div className="bg-[#161224] rounded-3xl p-6 sm:p-7 border border-[#2a243a] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a243a] pb-5">
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Global System Notifications</span>
            </h2>
            <p className="text-xs text-[#a09cb0] mt-0.5">
              Publish site-wide alert banners, system maintenance notices, and platform updates.
            </p>
          </div>

          <button
            onClick={loadAnnouncements}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-[#0c0915] border border-[#2a243a] text-xs font-semibold text-[#a09cb0] hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Notifications</span>
          </button>
        </div>

        {/* Publish Form */}
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-[#f2effc]">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Platform Upgrade"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] placeholder:text-[#6a667a] focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#f2effc]">Severity / Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] focus:outline-none focus:border-purple-500 transition cursor-pointer"
              >
                <option value="info">Info Notice (Blue / Purple)</option>
                <option value="warning">Warning / Alert (Amber)</option>
                <option value="success">Success / Resolved (Green)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#f2effc]">Notification Body Content</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide a clear, brief explanation of the notice that will be visible to all users at the top of the screen..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] placeholder:text-[#6a667a] focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="btn-primary-pill px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : 'Broadcast Notification'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Listing */}
      <div className="bg-[#161224] rounded-3xl border border-[#2a243a] shadow-xl overflow-hidden space-y-4 p-6 sm:p-7">
        <div className="flex items-center justify-between border-b border-[#2a243a] pb-4">
          <h3 className="text-base font-bold font-display text-white">Active & Past Broadcasts</h3>
          <span className="text-xs text-[#a09cb0]">
            Total: <strong className="text-white">{announcements.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#a09cb0] space-y-3">
            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p>Fetching notifications from Firestore...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#a09cb0] border border-dashed border-[#2a243a] rounded-2xl">
            No system notifications currently created. Use the broadcast form above to publish one.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.active
                    ? 'bg-[#0c0915] border-purple-500/40 shadow-md'
                    : 'bg-[#0c0915]/50 border-[#2a243a] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-[#161224] border border-[#2a243a] shrink-0 mt-0.5">
                    {iconTypeMap[item.type] || <Info className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          item.active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-[#a09cb0]'
                        }`}
                      >
                        {item.active ? 'Broadcasting' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-[#a09cb0] leading-relaxed line-clamp-2">
                      {item.content}
                    </p>
                    <p className="text-[10px] text-[#6a667a] font-mono">
                      Created: {new Date(item.createdAt || '').toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      item.active
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{item.active ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
