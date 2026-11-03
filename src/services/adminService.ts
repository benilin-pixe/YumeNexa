import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { logAdminAction } from './adminAuditService';

export interface UserAdminRecord {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalWatchlists: number;
  totalNewsArticles: number;
  totalAuditLogs: number;
}

export async function getAllUsers(): Promise<UserAdminRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users: UserAdminRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        email: data.email || 'unknown@yumenexa.com',
        displayName: data.displayName || data.email?.split('@')[0] || 'YumeNexa User',
        role: data.role || 'user',
        status: data.status || 'active',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt,
      });
    });

    return users;
  } catch (err) {
    console.error('[Admin Service] Get users error:', err);
    return [];
  }
}

export async function updateUserAccountStatus(uid: string, status: 'active' | 'suspended'): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
    await logAdminAction(
      'UPDATE_USER_STATUS',
      'USER',
      `Updated user (${uid}) status to ${status.toUpperCase()}`
    );
  } catch (err) {
    console.error('[Admin Service] Update user status error:', err);
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function updateUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const adminRoleRef = doc(db, 'adminRoles', uid);

  try {
    await updateDoc(userRef, {
      role,
      updatedAt: new Date().toISOString(),
    });

    if (role === 'admin') {
      await setDoc(adminRoleRef, {
        assignedAt: new Date().toISOString(),
        role: 'admin',
      });
    } else {
      try {
        await deleteDoc(adminRoleRef);
      } catch {
        // Ignore if doc didn't exist
      }
    }

    await logAdminAction(
      'UPDATE_USER_ROLE',
      'USER',
      `Changed user (${uid}) role to ${role.toUpperCase()}`
    );
  } catch (err) {
    console.error('[Admin Service] Update user role error:', err);
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function getOverviewStats(): Promise<AdminOverviewStats> {
  let totalUsers = 0;
  let activeUsers = 0;
  let suspendedUsers = 0;
  let totalWatchlists = 0;
  let totalNewsArticles = 0;
  let totalAuditLogs = 0;

  try {
    const userSnap = await getDocs(collection(db, 'users'));
    totalUsers = userSnap.size;
    userSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'suspended') {
        suspendedUsers += 1;
      } else {
        activeUsers += 1;
      }
    });
  } catch (err) {
    console.warn('[Overview Stats] Users count check error:', err);
  }

  try {
    const watchlistSnap = await getDocs(collection(db, 'watchlists'));
    totalWatchlists = watchlistSnap.size;
  } catch (err) {
    console.warn('[Overview Stats] Watchlist count check error:', err);
  }

  try {
    const logsSnap = await getDocs(collection(db, 'adminAuditLogs'));
    totalAuditLogs = logsSnap.size;
  } catch (err) {
    console.warn('[Overview Stats] Audit logs count check error:', err);
  }

  try {
    const res = await fetch('/api/news?limit=50');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        totalNewsArticles = data.length;
      } else if (data.articles && Array.isArray(data.articles)) {
        totalNewsArticles = data.articles.length;
      }
    }
  } catch (err) {
    console.warn('[Overview Stats] News count check error:', err);
  }

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalWatchlists,
    totalNewsArticles,
    totalAuditLogs,
  };
}
