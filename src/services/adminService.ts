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
  const userRoleRef = doc(db, 'user_roles', uid);

  try {
    await updateDoc(userRef, {
      role,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(userRoleRef, {
      role,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

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

export function getAdminApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-requested-by': 'yumenexa-client',
    'x-user-role': 'admin',
    'x-user-email': 'benilin76@gmail.com',
  };
}

/**
 * Provision an initial administrator using a server-side environment secret.
 */
export async function provisionInitialAdmin(provisionSecret: string, uid: string, email: string) {
  const res = await fetch('/api/admin/provision-initial-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provisionSecret, uid, email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to provision initial admin account');
  }
  return data;
}

/**
 * Server-side verification of admin role / custom claims.
 */
export async function verifyAdminRoleServerSide(uid: string, email: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/verify-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.isAdmin;
    }
  } catch (err) {
    console.warn('[Admin Service] Server-side role verification error:', err);
  }
  return false;
}

export async function fetchAdminOverview() {
  try {
    const res = await fetch('/api/admin/overview', {
      headers: getAdminApiHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Admin Service] Overview fetch warning:', err);
  }
  return null;
}

// Providers API
export async function fetchAdminProviders() {
  const res = await fetch('/api/admin/providers', { headers: getAdminApiHeaders() });
  if (!res.ok) throw new Error('Failed to fetch providers');
  return await res.json();
}

export async function createAdminProvider(label: string, baseUrl: string) {
  const res = await fetch('/api/admin/providers', {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ label, baseUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create provider');
  return data;
}

export async function editAdminProvider(id: string, label: string, baseUrl: string) {
  const res = await fetch(`/api/admin/providers/${id}`, {
    method: 'PUT',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ label, baseUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update provider');
  return data;
}

export async function toggleAdminProvider(id: string) {
  const res = await fetch(`/api/admin/providers/${id}/toggle`, {
    method: 'PATCH',
    headers: getAdminApiHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle provider');
  return data;
}

export async function deleteAdminProvider(id: string) {
  const res = await fetch(`/api/admin/providers/${id}`, {
    method: 'DELETE',
    headers: getAdminApiHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete provider');
  return true;
}

export async function checkAdminProviderReachability(id: string) {
  const res = await fetch(`/api/admin/providers/${id}/check`, {
    method: 'POST',
    headers: getAdminApiHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Provider reachability check failed');
  return data;
}

// Streaming Sources API
export async function fetchAdminSources() {
  const res = await fetch('/api/admin/sources', { headers: getAdminApiHeaders() });
  if (!res.ok) throw new Error('Failed to fetch streaming sources');
  return await res.json();
}

export async function importAnimeAdmin(animeId: number) {
  const res = await fetch('/api/admin/sources/import', {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ animeId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to import anime');
  return data;
}

export async function addEpisodeAdmin(animeId: number, episodeNumber: number) {
  const res = await fetch('/api/admin/sources/episodes', {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ animeId, episodeNumber }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add episode');
  return data;
}

export async function attachSourceAdmin(
  animeId: number,
  episodeNumber: number,
  url: string,
  type: string,
  quality: string,
  language: string
) {
  const res = await fetch('/api/admin/sources/attach', {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ animeId, episodeNumber, url, type, quality, language }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to attach source');
  return data;
}

export async function testSourceAdmin(animeId: number, episodeNumber: number, sourceId: string) {
  const res = await fetch('/api/admin/sources/test', {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ animeId, episodeNumber, sourceId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Source test failed');
  return data;
}

export async function deleteSourceAdmin(animeId: number, episodeNumber: number, sourceId: string) {
  const res = await fetch('/api/admin/sources/delete', {
    method: 'DELETE',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ animeId, episodeNumber, sourceId }),
  });
  if (!res.ok) throw new Error('Failed to delete streaming source');
  return true;
}

// System Logs API
export async function fetchAdminSystemLogs() {
  const res = await fetch('/api/admin/logs', { headers: getAdminApiHeaders() });
  if (!res.ok) return [];
  return await res.json();
}
