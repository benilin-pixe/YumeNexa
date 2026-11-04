import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const INITIAL_SUPER_ADMIN_EMAIL = 'benilin76@gmail.com';

let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let initializationAttempted = false;

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function isSuperAdminEmail(email?: string | null): boolean {
  return normalizeEmail(email) === INITIAL_SUPER_ADMIN_EMAIL;
}

export function hasAdminCredentials(): boolean {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  return Boolean((clientEmail && privateKey) || googleAppCreds);
}

function ensureAdminInitialized(): boolean {
  if (getApps().length > 0) return true;
  if (initializationAttempted) return getApps().length > 0;

  initializationAttempted = true;
  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!clientEmail || !privateKey) {
    return false;
  }

  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return true;
  } catch (err: any) {
    console.warn(`[Firebase Admin SDK Initialization Error]:`, err?.message || err);
    return false;
  }
}

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;
  if (!ensureAdminInitialized()) return null;

  try {
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    adminDb = databaseId && databaseId !== '(default)'
      ? getFirestore(databaseId)
      : getFirestore();
    return adminDb;
  } catch (err) {
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth;
  if (!ensureAdminInitialized()) return null;

  try {
    adminAuth = getAuth();
    return adminAuth;
  } catch (err) {
    return null;
  }
}

