import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../config/firebase';

export interface AuditLogEntry {
  id?: string;
  action: string;
  category: 'USER' | 'CONTENT' | 'STREAMING' | 'NEWS' | 'SYSTEM' | 'SETTINGS';
  details: string;
  adminEmail: string;
  adminUid: string;
  timestamp: string;
}

export async function logAdminAction(
  action: string,
  category: AuditLogEntry['category'],
  details: string
): Promise<void> {
  const user = auth.currentUser;
  const entry: AuditLogEntry = {
    action,
    category,
    details,
    adminEmail: user?.email || 'benilin76@gmail.com',
    adminUid: user?.uid || 'admin-bootstrap',
    timestamp: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'adminAuditLogs'), entry);
  } catch (err) {
    console.warn('[Admin Audit Log] Could not save audit log to Firestore:', err);
  }
}

export async function getRecentAuditLogs(maxCount: number = 50): Promise<AuditLogEntry[]> {
  try {
    const q = query(collection(db, 'adminAuditLogs'), orderBy('timestamp', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<AuditLogEntry, 'id'>) });
    });
    return logs;
  } catch (err) {
    console.error('[Admin Audit Log] Query error:', err);
    return [];
  }
}
