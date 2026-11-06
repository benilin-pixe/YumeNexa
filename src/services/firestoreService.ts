import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../config/firebase';
import { UserProfile, WatchlistItem, WatchHistoryItem, SystemAnnouncement, WatchlistStatus } from '../types/user';

// User Profiles
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    // 1. Primary User Profile in users collection with merge support
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });

    // 2. Secondary role document in user_roles collection (isolated so non-critical role sync doesn't break profile creation)
    try {
      await setDoc(doc(db, 'user_roles', profile.uid), {
        role: profile.role || 'user',
        email: profile.email || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (roleErr) {
      console.warn('[createUserProfile] Secondary user_roles write note:', roleErr);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Watchlist
export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const path = 'watchlists';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    const items: WatchlistItem[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as WatchlistItem) });
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveWatchlistItem(item: Omit<WatchlistItem, 'id'>): Promise<string> {
  const path = 'watchlists';
  const docId = `${item.userId}_${item.animeId}`;
  try {
    const payload = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, docId), payload);
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${docId}`);
  }
}

export async function updateWatchlistStatus(userId: string, animeId: number, status: WatchlistStatus, progress = 0): Promise<void> {
  const docId = `${userId}_${animeId}`;
  const path = `watchlists/${docId}`;
  try {
    await updateDoc(doc(db, 'watchlists', docId), {
      status,
      progress,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeFromWatchlist(userId: string, animeId: number): Promise<void> {
  const docId = `${userId}_${animeId}`;
  const path = `watchlists/${docId}`;
  try {
    await deleteDoc(doc(db, 'watchlists', docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Watch History
export async function getUserWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
  const path = 'watchHistory';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    const items: WatchHistoryItem[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as WatchHistoryItem) });
    });
    return items.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveWatchProgress(item: Omit<WatchHistoryItem, 'id'>): Promise<void> {
  const docId = `${item.userId}_${item.animeId}_ep${item.episodeNumber}`;
  const path = `watchHistory/${docId}`;
  try {
    await setDoc(doc(db, 'watchHistory', docId), {
      ...item,
      lastWatchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// System Announcements
export function subscribeToActiveAnnouncements(
  callback: (announcements: SystemAnnouncement[]) => void
): () => void {
  const path = 'announcements';
  const q = query(collection(db, path), where('active', '==', true));
  
  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const announcements: SystemAnnouncement[] = [];
      snap.forEach((d) => {
        announcements.push({ ...(d.data() as SystemAnnouncement), id: d.id });
      });
      callback(
        announcements.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
      );
    },
    (err) => {
      console.error('Firestore Announcement listener error:', err);
      // Firebase SDK automatically retries real-time streams on transient errors.
      // Do not perform manual fallback fetch here as it might conflict with active listener.
    }
  );

  return unsubscribe;
}

export async function getActiveAnnouncements(): Promise<SystemAnnouncement[]> {
  const path = 'announcements';
  try {
    const q = query(collection(db, path), where('active', '==', true));
    const snap = await getDocs(q);
    const announcements: SystemAnnouncement[] = [];
    snap.forEach((d) => {
      announcements.push({ ...(d.data() as SystemAnnouncement), id: d.id });
    });
    return announcements;
  } catch (err) {
    console.warn('Could not fetch announcements from Firestore:', err);
    return [];
  }
}

export async function createAnnouncement(
  announcement: Omit<SystemAnnouncement, 'id' | 'createdAt'> & { createdAt?: string }
): Promise<string> {
  const path = 'announcements';
  const newRef = doc(collection(db, path));
  try {
    await setDoc(newRef, {
      ...announcement,
      createdAt: announcement.createdAt || new Date().toISOString(),
    });
    return newRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${newRef.id}`);
  }
}

export async function getAllAnnouncements(): Promise<SystemAnnouncement[]> {
  const path = 'announcements';
  try {
    const snap = await getDocs(collection(db, path));
    const list: SystemAnnouncement[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as SystemAnnouncement), id: d.id });
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.warn('Could not fetch all announcements from Firestore:', err);
    return [];
  }
}

export async function toggleAnnouncementActive(id: string, active: boolean): Promise<void> {
  const path = `announcements/${id}`;
  try {
    await updateDoc(doc(db, 'announcements', id), { active });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const path = `announcements/${id}`;
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

