import { doc, setDoc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface WebVitalMetric {
  name: 'LCP' | 'CLS' | 'INP' | 'FID' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  route: string;
  timestamp: string;
}

export interface ErrorLogRecord {
  message: string;
  stack?: string;
  route: string;
  userId: string | null;
  userEmail?: string | null;
  userAgent: string;
  severity: 'error' | 'warning' | 'critical';
  timestamp: string;
  resolved: boolean;
}

/**
 * Record a pageview in aggregate daily counter document in 'siteStats'
 * Uses FieldValue.increment(1) to minimize Firestore write costs.
 */
export async function trackPageView(route: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const today = new Date().toISOString().split('T')[0];
  const statRef = doc(db, 'siteStats', today);

  try {
    const userAgent = navigator.userAgent;
    const isMobile = /mobile/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    await setDoc(
      statRef,
      {
        date: today,
        totalPageViews: increment(1),
        [`routes.${route.replace(/\//g, '_')}`]: increment(1),
        [`devices.${deviceType}`]: increment(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    // Non-blocking analytics error
  }
}

/**
 * Log error to 'errorLogs' collection in Firestore
 */
export async function logErrorToFirestore(
  message: string,
  stack?: string,
  severity: 'error' | 'warning' | 'critical' = 'error',
  customRoute?: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const route = customRoute || window.location.pathname;
  const userId = auth.currentUser?.uid || null;
  const userEmail = auth.currentUser?.email || null;
  const userAgent = navigator.userAgent;

  try {
    await addDoc(collection(db, 'errorLogs'), {
      message: message.slice(0, 500),
      stack: (stack || '').slice(0, 2000),
      route,
      userId,
      userEmail,
      userAgent,
      severity,
      resolved: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Error Logger Fallback]:', err?.message || err);
  }
}

/**
 * Global Error Handlers Setup: window.onerror & unhandledrejection
 */
export function initGlobalErrorListeners(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const msg = event.message || 'Unhandled Window Error';
    const isFirestorePermission = msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions');
    const severity = isFirestorePermission ? 'critical' : 'error';

    logErrorToFirestore(
      isFirestorePermission ? `[Firestore Permission Denied] ${msg}` : msg,
      event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      severity
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason) || 'Unhandled Promise Rejection';
    const isFirestorePermission = msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions');
    const severity = isFirestorePermission ? 'critical' : 'error';

    logErrorToFirestore(
      isFirestorePermission ? `[Firestore Permission Denied] ${msg}` : msg,
      reason?.stack || 'Unhandled Promise Rejection Stack',
      severity
    );
  });
}

/**
 * Capture Web Vitals metrics
 */
export async function logWebVital(metric: WebVitalMetric): Promise<void> {
  try {
    await addDoc(collection(db, 'performanceLogs'), metric);
  } catch {
    // Non-blocking performance metric
  }
}

/**
 * Check if Maintenance Mode is active
 */
export async function checkMaintenanceMode(): Promise<{ active: boolean; message?: string }> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        active: Boolean(data.maintenanceMode),
        message: data.maintenanceMessage || 'YumeNexa is currently undergoing scheduled maintenance. Please check back shortly!',
      };
    }
  } catch {
    // Default false if settings read fails
  }
  return { active: false };
}
