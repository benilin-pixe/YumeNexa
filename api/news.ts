import { getNewsWithStaleWhileRevalidate } from '../src/services/firestoreNewsCache';

export default async function handler(req: any, res: any) {
  // CORS & Cache-Control Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-by, x-api-key');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const category = (req.query.category as string) || 'All';
    const search = (req.query.search as string) || '';
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 50);
    const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);
    const forceRefresh = req.query.refresh === 'true';
    const isDebug = req.query.debug === '1' || req.query.debug === 'true';

    const newsData = await getNewsWithStaleWhileRevalidate(forceRefresh);

    let filtered = newsData.articles;

    if (category && category !== 'All') {
      filtered = filtered.filter(
        (a) => a.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          (a.summary || '').toLowerCase().includes(term) ||
          a.sourceName.toLowerCase().includes(term)
      );
    }

    const total = filtered.length;
    const paginatedArticles = filtered.slice(offset, offset + limit);

    if (isDebug) {
      return res.status(200).json({
        timestamp: newsData.lastRefreshedAt,
        totalArticles: newsData.articles.length,
        fromCache: newsData.fromCache,
        isStale: newsData.isStale,
        sourceDebug: newsData.sourceDebug || newsData.sourceHealth,
        articles: paginatedArticles,
        total,
        limit,
        offset,
      });
    }

    return res.status(200).json({
      articles: paginatedArticles,
      total,
      limit,
      offset,
      cached: newsData.fromCache,
      isStale: newsData.isStale,
      lastRefreshedAt: newsData.lastRefreshedAt,
      sourceHealth: newsData.sourceHealth,
    });
  } catch (err: any) {
    console.error('[Vercel API /api/news Error]:', err);
    return res.status(500).json({
      error: 'Failed to retrieve news articles',
      message: err?.message || String(err),
    });
  }
}

