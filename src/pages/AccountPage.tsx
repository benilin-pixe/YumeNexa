import React, { useState } from 'react';
import { Bookmark, Tv, Moon, Sun, LogOut, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { updateUserProfile } from '../services/firestoreService';
import { formatAuthError } from '../utils/authErrors';

export const AccountPage: React.FC = () => {
  const { currentUser, userProfile, logout, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { watchlist, watchHistory } = useWatchlist();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    setSavedMessage(false);
    setErrorMessage(null);
    try {
      await updateUserProfile(currentUser.uid, { displayName });
      await refreshProfile();
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      console.error('Failed to update name:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      {/* Title */}
      <div className="space-y-1 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <h1 className="text-3xl font-black font-display text-slate-900 dark:text-white">Account Settings & Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your YumeNexa user credentials and appearance preferences
        </p>
      </div>

      {/* Account Info Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[2px]">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-bold text-white font-display">
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">{displayName || 'User'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-violet-600/20 text-violet-600 dark:text-violet-300 border border-violet-500/30 text-[10px] font-bold uppercase">
              {userProfile?.role || 'User'} Account
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveName} className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs shadow-md hover:bg-violet-500 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>

            {savedMessage && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Profile updated successfully
              </span>
            )}

            {errorMessage && (
              <span className="text-xs text-rose-500 font-semibold">
                {errorMessage}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">Theme Preference</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Switch between dark charcoal theme and soft light theme</p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Dark Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-violet-600" />
              <span>Light Theme</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <Bookmark className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          <span className="text-2xl font-black font-display text-slate-900 dark:text-white block">{watchlist.length}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Saved Anime</span>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <Tv className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          <span className="text-2xl font-black font-display text-slate-900 dark:text-white block">{watchHistory.length}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Episodes Played</span>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of YumeNexa
        </button>
      </div>
    </div>
  );
};
