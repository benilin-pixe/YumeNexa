import { executeControlledRefresh } from '../../src/services/firestoreNewsCache';

const SECRET_API_KEY = process.env.API_KEY || 'yumenexa-news-cron-secret-key-2026';
const ADMIN_PROVISION_SECRET = process.env.ADMIN_PROVISION_SECRET || SECRET_API_KEY;

function isAuthorizedAdmin(req: any): boolean {
  const apiKey = (req.headers['x-api-key'] as string) || (req.query.key as string);
  const authHeader = req.headers.authorization;
  const requestedBy = req.headers['x-requested-by'];
  const userRoleHeader = req.headers['x-user-role'];
  const userEmailHeader = req.headers['x-user-email'];

  if (apiKey === SECRET_API_KEY || apiKey === ADMIN_PROVISION_SECRET) return true;
  if (authHeader && (authHeader === `Bearer ${SECRET_API_KEY}` || authHeader === `Bearer ${ADMIN_PROVISION_SECRET}`)) return true;

  if (requestedBy === 'yumenexa-client') {
    if (userEmailHeader === 'benilin76@gmail.com' || userRoleHeader === 'admin') {
      return true;
    }
  }

  return false;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-by, x-api-key, x-user-email, x-user-role');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
  }

  try {
    const refreshed = await executeControlledRefresh();

    return res.status(200).json({
      success: true,
      message: 'News sources successfully refreshed',
      timestamp: refreshed.timestamp,
      totalArticles: refreshed.articles.length,
      sourceHealth: refreshed.sourceHealth,
    });
  } catch (err: any) {
    console.error('[Vercel API /api/news/refresh Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to refresh news feeds',
    });
  }
}
