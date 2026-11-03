import { validateFirestoreConnection } from '../config/firebase';

export interface SystemHealthMetrics {
  serverStatus: 'Healthy' | 'Degraded' | 'Offline';
  uptimeSeconds: number;
  apiResponseStatus: number;
  firebaseStatus: 'Connected' | 'Error';
  environment: string;
  memoryHeapUsedMb: number;
  memoryRssMb: number;
  nodeVersion: string;
  lastChecked: string;
}

export async function fetchSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  let uptimeSeconds = 0;
  let serverStatus: 'Healthy' | 'Degraded' | 'Offline' = 'Healthy';
  let memoryHeapUsedMb = 0;
  let memoryRssMb = 0;
  let environment = 'production';
  let nodeVersion = 'v22.x';

  try {
    const res = await fetch('/api/health', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      uptimeSeconds = data.uptimeSeconds || 0;
      memoryHeapUsedMb = data.memoryHeapUsedMb || 0;
      memoryRssMb = data.memoryRssMb || 0;
      environment = data.environment || 'production';
      nodeVersion = data.nodeVersion || 'v22.x';
    } else {
      serverStatus = 'Degraded';
    }
  } catch (err) {
    console.warn('[System Monitoring] /api/health ping error:', err);
    serverStatus = 'Offline';
  }

  let firebaseStatus: 'Connected' | 'Error' = 'Connected';
  try {
    const isDbConnected = await validateFirestoreConnection();
    firebaseStatus = isDbConnected ? 'Connected' : 'Error';
  } catch {
    firebaseStatus = 'Error';
  }

  return {
    serverStatus,
    uptimeSeconds,
    apiResponseStatus: serverStatus === 'Healthy' ? 200 : 500,
    firebaseStatus,
    environment,
    memoryHeapUsedMb,
    memoryRssMb,
    nodeVersion,
    lastChecked: new Date().toISOString(),
  };
}
