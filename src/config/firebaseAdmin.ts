import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let adminDb: Firestore | null = null;
let initializationAttempted = false;

export function hasAdminCredentials(): boolean {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  return Boolean((clientEmail && privateKey) || googleAppCreds);
}

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;
  if (initializationAttempted) return adminDb;

  initializationAttempted = true;

  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  // Only initialize Admin SDK if explicit service account credentials or ADC environment variables exist
  if (!clientEmail || !privateKey) {
    console.log(
      `[Firebase Admin SDK] Environment credentials (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) not provided. Project: '${projectId}', Database: '${databaseId}'. Using Client SDK fallback for Firestore operations.`
    );
    return null;
  }

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    adminDb = databaseId && databaseId !== '(default)'
      ? getFirestore(databaseId)
      : getFirestore();

    console.log(`[Firebase Admin SDK] Successfully initialized for Project '${projectId}', Database '${databaseId}'.`);
    return adminDb;
  } catch (err: any) {
    console.warn(`[Firebase Admin SDK Initialization Error] Project: '${projectId}', Database: '${databaseId}':`, err?.message || err);
    return null;
  }
}
