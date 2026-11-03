import React, { createContext, useContext, useEffect, useState } from 'react';
import { WatchlistItem, WatchHistoryItem, WatchlistStatus } from '../types/user';
import { useAuth } from './AuthContext';
import {
  getUserWatchlist,
  saveWatchlistItem,
  updateWatchlistStatus,
  removeFromWatchlist,
  getUserWatchHistory,
  saveWatchProgress,
} from '../services/firestoreService';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  watchHistory: WatchHistoryItem[];
  loading: boolean;
  getItemStatus: (animeId: number) => WatchlistItem | undefined;
  updateAnimeStatus: (
    animeId: number,
    title: string,
    coverImage: string,
    status: WatchlistStatus,
    progress?: number,
    totalEpisodes?: number
  ) => Promise<void>;
  removeItem: (animeId: number) => Promise<void>;
  recordProgress: (
    animeId: number,
    animeTitle: string,
    coverImage: string,
    episodeNumber: number,
    progressSeconds: number,
    totalDurationSeconds: number
  ) => Promise<void>;
  refreshWatchlist: () => Promise<void>;
  playbackPref: 'SUB' | 'DUB';
  updatePlaybackPref: (pref: 'SUB' | 'DUB') => void;
  autoplayNext: boolean;
  updateAutoplay: (enabled: boolean) => void;
  toggleNotifications: (animeId: number, enabled: boolean) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [playbackPref, setPlaybackPref] = useState<'SUB' | 'DUB'>('SUB');
  const [autoplayNext, setAutoplayNext] = useState(true);

  // Load prefs from local storage/db
  useEffect(() => {
    const savedPref = localStorage.getItem('yumenexa_lang_pref');
    if (savedPref) setPlaybackPref(savedPref as 'SUB' | 'DUB');
    const savedAutoplay = localStorage.getItem('yumenexa_autoplay');
    if (savedAutoplay) setAutoplayNext(savedAutoplay === 'true');
  }, []);

  const updatePlaybackPref = (pref: 'SUB' | 'DUB') => {
    setPlaybackPref(pref);
    localStorage.setItem('yumenexa_lang_pref', pref);
  };
  
  const updateAutoplay = (enabled: boolean) => {
    setAutoplayNext(enabled);
    localStorage.setItem('yumenexa_autoplay', enabled.toString());
  };

  const loadUserData = async () => {
    if (!currentUser) {
      setWatchlist([]);
      setWatchHistory([]);
      return;
    }
    setLoading(true);
    try {
      const [wl, history] = await Promise.all([
        getUserWatchlist(currentUser.uid),
        getUserWatchHistory(currentUser.uid),
      ]);
      setWatchlist(wl);
      setWatchHistory(history);
    } catch (err) {
      console.warn('Watchlist sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const getItemStatus = (animeId: number) => {
    return watchlist.find((item) => item.animeId === animeId);
  };

  const updateAnimeStatus = async (
    animeId: number,
    title: string,
    coverImage: string,
    status: WatchlistStatus,
    progress = 0,
    totalEpisodes = 0
  ) => {
    if (!currentUser) return;

    // Optimistic UI update
    const existing = getItemStatus(animeId);
    const updatedItem: WatchlistItem = {
      userId: currentUser.uid,
      animeId,
      title,
      coverImage,
      status,
      progress,
      totalEpisodes,
      updatedAt: new Date().toISOString(),
    };

    setWatchlist((prev) => {
      const filtered = prev.filter((i) => i.animeId !== animeId);
      return [...filtered, updatedItem];
    });

    try {
      if (existing) {
        await updateWatchlistStatus(currentUser.uid, animeId, status, progress);
      } else {
        await saveWatchlistItem(updatedItem);
      }
    } catch (err) {
      console.error('Failed to update watchlist:', err);
      // Revert if error
      await loadUserData();
    }
  };

  const removeItem = async (animeId: number) => {
    if (!currentUser) return;
    setWatchlist((prev) => prev.filter((i) => i.animeId !== animeId));
    try {
      await removeFromWatchlist(currentUser.uid, animeId);
    } catch (err) {
      console.error('Failed to remove watchlist item:', err);
      await loadUserData();
    }
  };

  const recordProgress = async (
    animeId: number,
    animeTitle: string,
    coverImage: string,
    episodeNumber: number,
    progressSeconds: number,
    totalDurationSeconds: number
  ) => {
    if (!currentUser) return;
    const historyItem: WatchHistoryItem = {
      userId: currentUser.uid,
      animeId,
      animeTitle,
      coverImage,
      episodeNumber,
      progressSeconds,
      totalDurationSeconds,
      lastWatchedAt: new Date().toISOString(),
    };

    setWatchHistory((prev) => {
      const filtered = prev.filter((i) => !(i.animeId === animeId && i.episodeNumber === episodeNumber));
      return [historyItem, ...filtered];
    });

    try {
      await saveWatchProgress(historyItem);
    } catch (err) {
      console.warn('Failed to save watch history:', err);
    }
  };

  const toggleNotifications = async (animeId: number, enabled: boolean) => {
    if (!currentUser) return;
    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          console.warn('Browser notification permission not granted.');
        }
      } catch (e) {
        console.warn('Notification permission request error:', e);
      }
    }

    const existing = getItemStatus(animeId);
    if (!existing) return;

    const updatedItem: WatchlistItem = {
      ...existing,
      notificationsEnabled: enabled,
      updatedAt: new Date().toISOString(),
    };

    setWatchlist((prev) => prev.map((item) => (item.animeId === animeId ? updatedItem : item)));

    try {
      await saveWatchlistItem(updatedItem);
      if (enabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('YumeNexa Release Alert Enabled', {
          body: `You will receive push notifications when new episodes of "${existing.title}" air.`,
          icon: existing.coverImage || '/vite.svg',
        });
      }
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
      await loadUserData();
    }
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        watchHistory,
        loading,
        getItemStatus,
        updateAnimeStatus,
        removeItem,
        recordProgress,
        refreshWatchlist: loadUserData,
        playbackPref,
        updatePlaybackPref,
        autoplayNext,
        updateAutoplay,
        toggleNotifications,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used within WatchlistProvider');
  return context;
};
