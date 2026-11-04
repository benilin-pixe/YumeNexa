export type WatchlistStatus = 'WATCHING' | 'COMPLETED' | 'PLANNING' | 'ON_HOLD' | 'DROPPED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'superadmin';
  status?: 'active' | 'suspended';
  theme: 'dark' | 'light';
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id?: string;
  userId: string;
  animeId: number;
  title: string;
  coverImage: string;
  status: WatchlistStatus;
  score?: number;
  progress: number;
  totalEpisodes?: number;
  notificationsEnabled?: boolean;
  updatedAt: string;
}

export interface WatchHistoryItem {
  id?: string;
  userId: string;
  animeId: number;
  animeTitle: string;
  coverImage: string;
  episodeNumber: number;
  progressSeconds: number;
  totalDurationSeconds: number;
  lastWatchedAt: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  createdAt: string;
}
