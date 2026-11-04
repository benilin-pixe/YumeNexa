import { getCachedArticlesFromFirestore } from '../../src/services/firestoreNewsCache';
import { DEFAULT_NEWS_SOURCES } from '../../src/services/serverNewsAggregator';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-by, x-api-key, x-user-email, x-user-role');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const cachedData = await getCachedArticlesFromFirestore();
      const healthMap = new Map<string, any>();

      for (const h of cachedData.sourceHealth) {
        healthMap.set(h.id, h);
      }

      const sourcesList = DEFAULT_NEWS_SOURCES.map((src) => {
        const health = healthMap.get(src.id);
        const articleCount = cachedData.articles.filter((a) => a.sourceName === src.name).length;

        return {
          id: src.id,
          name: src.name,
          url: src.url,
          siteUrl: src.siteUrl,
          category: src.category,
          active: src.active,
          lastRefreshStatus: health?.status || 'SUCCESS',
          lastRefreshAt: health?.lastRefreshAt || cachedData.lastRefreshedAt || new Date().toISOString(),
          lastError: health?.lastError || null,
          articleCount,
        };
      });

      return res.status(200).json(sourcesList);
    } catch (err: any) {
      console.error('[Vercel API /api/news/sources Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve news sources' });
    }
  }

  if (req.method === 'POST') {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }
    const { name, url, siteUrl, category } = req.body || {};
    if (!name || !url) {
      return res.status(400).json({ error: 'Source name and RSS feed URL are required' });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newSource = {
      id,
      name,
      url,
      siteUrl: siteUrl || url,
      category: category || 'General',
      active: true,
      lastRefreshStatus: 'INITIAL',
      articleCount: 0,
    };

    return res.status(201).json(newSource);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
