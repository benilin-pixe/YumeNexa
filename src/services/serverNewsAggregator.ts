import { ParsedFeedItem, parseFeedXml, parseFeedWithRssParser, generateArticleId, normalizeArticleUrl, assignNewsCategory, cleanExcerpt } from './newsFeedParser';
import { validateNewsImageUrl } from './newsImageService';

export interface NewsSourceConfig {
  id: string;
  name: string;
  url: string;
  siteUrl: string;
  category: string;
  type: 'rss' | 'json';
  active: boolean;
}

export interface NormalizedNewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  originalLink?: string;
  image: string;
  imageUrl?: string;
  source: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  category: 'News' | 'Announcements' | 'Movies' | 'Releases' | 'General';
  videoId?: string;
  author?: string;
  fetchedAt: string;
}

export interface SourceDebugResult {
  id: string;
  name: string;
  url: string;
  status: 'SUCCESS' | 'TIMEOUT' | 'ERROR';
  httpCode?: number;
  itemCount: number;
  responseTimeMs: number;
  error?: string | null;
  retried: boolean;
}

export interface ServerAggregationResult {
  articles: NormalizedNewsArticle[];
  sourceDebug: SourceDebugResult[];
  timestamp: string;
}

export const ALLOWED_NEWS_HOSTS = [
  'aninews.vercel.app',
  'www.animenewsnetwork.com',
  'animenewsnetwork.com',
  'animeuknews.net',
  'www.animeuknews.net',
  'honeysanime.com',
  'www.honeysanime.com',
  'animeherald.com',
  'www.animeherald.com',
  'cr-news-api-service.prd.crunchyrollsvc.com',
  'crunchyroll.com',
  'www.crunchyroll.com',
  'animecorner.me',
  'www.animecorner.me',
  'api.jikan.moe',
  'cdn.myanimelist.net',
];

export const PRIMARY_NEWS_SOURCES: NewsSourceConfig[] = [
  {
    id: 'ann',
    name: 'Anime News Network',
    url: 'https://www.animenewsnetwork.com/all/rss',
    siteUrl: 'https://www.animenewsnetwork.com',
    category: 'Industry',
    type: 'rss',
    active: true,
  },
  {
    id: 'jikan_mal',
    name: 'MyAnimeList (via Jikan)',
    url: 'https://api.jikan.moe/v4/top/anime?limit=10',
    siteUrl: 'https://myanimelist.net',
    category: 'Announcements',
    type: 'json',
    active: true,
  },
  {
    id: 'primary_aninews',
    name: 'AniNews API',
    url: 'https://aninews.vercel.app/api/news?limit=20',
    siteUrl: 'https://aninews.vercel.app',
    category: 'News',
    type: 'json',
    active: true,
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll News',
    url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss',
    siteUrl: 'https://crunchyroll.com/news',
    category: 'Industry',
    type: 'rss',
    active: true,
  },
  {
    id: 'animeuk',
    name: 'Anime UK News',
    url: 'https://animeuknews.net/feed/',
    siteUrl: 'https://animeuknews.net',
    category: 'General',
    type: 'rss',
    active: true,
  },
  {
    id: 'honeys',
    name: "Honey's Anime",
    url: 'https://honeysanime.com/feed/',
    siteUrl: 'https://honeysanime.com',
    category: 'Reviews',
    type: 'rss',
    active: true,
  },
  {
    id: 'herald',
    name: 'Anime Herald',
    url: 'https://animeherald.com/feed/',
    siteUrl: 'https://animeherald.com',
    category: 'Industry',
    type: 'rss',
    active: true,
  },
  {
    id: 'animecorner',
    name: 'Anime Corner',
    url: 'https://animecorner.me/feed/',
    siteUrl: 'https://animecorner.me',
    category: 'News',
    type: 'rss',
    active: true,
  },
];

export function isUrlInAllowlist(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }

    return ALLOWED_NEWS_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs = 8000
): Promise<{ response: Response; retried: boolean }> {
  let retried = false;

  const attemptFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    const res = await attemptFetch();
    return { response: res, retried: false };
  } catch (firstErr) {
    retried = true;
    // Brief 300ms backoff jitter before single retry
    await new Promise((resolve) => setTimeout(resolve, 300));
    const res = await attemptFetch();
    return { response: res, retried: true };
  }
}

/**
 * Fetch and normalize a single news source on the server
 */
async function fetchAndNormalizeSource(
  source: NewsSourceConfig
): Promise<{ articles: NormalizedNewsArticle[]; debug: SourceDebugResult }> {
  const startMs = Date.now();
  const nowStr = new Date().toISOString();

  if (!isUrlInAllowlist(source.url)) {
    return {
      articles: [],
      debug: {
        id: source.id,
        name: source.name,
        url: source.url,
        status: 'ERROR',
        httpCode: 403,
        itemCount: 0,
        responseTimeMs: Date.now() - startMs,
        error: 'Target URL is not in the approved allowlist',
        retried: false,
      },
    };
  }

  const reqOptions: RequestInit = {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; YumeNexaBot/3.0; +https://yumenexa.tv)',
      Accept: source.type === 'json' ? 'application/json' : 'application/rss+xml, application/atom+xml, text/xml',
    },
  };

  try {
    const { response: res, retried } = await fetchWithRetry(source.url, reqOptions, 8000);
    const duration = Date.now() - startMs;

    if (!res.ok) {
      return {
        articles: [],
        debug: {
          id: source.id,
          name: source.name,
          url: source.url,
          status: 'ERROR',
          httpCode: res.status,
          itemCount: 0,
          responseTimeMs: duration,
          error: `HTTP ${res.status}`,
          retried,
        },
      };
    }

    const fetched: NormalizedNewsArticle[] = [];

    if (source.id === 'jikan_mal') {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.data)) {
        for (const item of data.data) {
          const rawUrl = item.url || `https://myanimelist.net/anime/${item.mal_id}`;
          const normUrl = normalizeArticleUrl(rawUrl);
          const title = item.title_japanese || item.title || 'Anime Announcement';
          const summary = cleanExcerpt(item.synopsis || title, 300);
          const image = validateNewsImageUrl(item.images?.jpg?.large_image_url || item.images?.jpg?.image_url);

          fetched.push({
            id: generateArticleId(normUrl),
            title,
            summary,
            url: normUrl,
            originalLink: normUrl,
            image,
            imageUrl: image,
            source: source.name,
            sourceName: source.name,
            sourceUrl: source.siteUrl,
            publishedAt: nowStr,
            category: 'Announcements',
            fetchedAt: nowStr,
          });
        }
      }
    } else if (source.type === 'json') {
      const data = await res.json().catch(() => null);
      if (data) {
        const rawItems = Array.isArray(data) ? data : (data.articles || data.news || data.data || []);
        for (const item of rawItems) {
          const rawUrl = item.link || item.url || item.guid;
          if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.startsWith('http')) continue;

          const normUrl = normalizeArticleUrl(rawUrl);
          const title = item.title?.trim() || 'Untitled Anime Article';
          const summary = cleanExcerpt(item.excerpt || item.summary || item.description || title, 300);
          const image = validateNewsImageUrl(item.imageUrl || item.image || item.thumbnail);
          const pubDate = item.publishedAt || item.pubDate || item.date || nowStr;

          fetched.push({
            id: generateArticleId(normUrl),
            title,
            summary,
            url: normUrl,
            originalLink: normUrl,
            image,
            imageUrl: image,
            videoId: item.videoId,
            source: source.name,
            sourceName: source.name,
            sourceUrl: source.siteUrl,
            publishedAt: new Date(pubDate).toISOString(),
            category: assignNewsCategory(title, summary),
            author: item.author || source.name,
            fetchedAt: nowStr,
          });
        }
      }
    } else {
      const xmlText = await res.text();
      const parsed = await parseFeedWithRssParser(xmlText);

      for (const item of parsed) {
        const image = validateNewsImageUrl(item.imageUrl);
        fetched.push({
          id: item.id,
          title: item.title,
          summary: cleanExcerpt(item.excerpt, 300),
          url: item.link,
          originalLink: item.link,
          image,
          imageUrl: image,
          videoId: item.videoId,
          source: source.name,
          sourceName: source.name,
          sourceUrl: source.siteUrl,
          publishedAt: item.publishedAt,
          category: item.category as any,
          author: item.author || source.name,
          fetchedAt: nowStr,
        });
      }
    }

    return {
      articles: fetched,
      debug: {
        id: source.id,
        name: source.name,
        url: source.url,
        status: 'SUCCESS',
        httpCode: res.status,
        itemCount: fetched.length,
        responseTimeMs: duration,
        error: null,
        retried,
      },
    };
  } catch (err: any) {
    const duration = Date.now() - startMs;
    const isTimeout = err?.name === 'AbortError';
    return {
      articles: [],
      debug: {
        id: source.id,
        name: source.name,
        url: source.url,
        status: isTimeout ? 'TIMEOUT' : 'ERROR',
        httpCode: isTimeout ? 408 : 500,
        itemCount: 0,
        responseTimeMs: duration,
        error: isTimeout ? '8s timeout exceeded' : (err?.message || 'Connection failed'),
        retried: true,
      },
    };
  }
}

/**
 * Main server aggregator: Promise.allSettled with deduplication by URL and normalized title
 */
export async function aggregateServerSideNews(
  sources: NewsSourceConfig[] = PRIMARY_NEWS_SOURCES
): Promise<ServerAggregationResult> {
  const activeSources = sources.filter((s) => s.active);

  const results = await Promise.allSettled(
    activeSources.map((src) => fetchAndNormalizeSource(src))
  );

  const allArticles: NormalizedNewsArticle[] = [];
  const debugRecords: SourceDebugResult[] = [];

  results.forEach((res, idx) => {
    const src = activeSources[idx];
    if (res.status === 'fulfilled') {
      allArticles.push(...res.value.articles);
      debugRecords.push(res.value.debug);
    } else {
      debugRecords.push({
        id: src.id,
        name: src.name,
        url: src.url,
        status: 'ERROR',
        httpCode: 500,
        itemCount: 0,
        responseTimeMs: 0,
        error: res.reason?.message || 'Unhandled source rejection',
        retried: false,
      });
    }
  });

  // Deduplicate by URL AND by normalized title
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const deduplicated: NormalizedNewsArticle[] = [];

  for (const article of allArticles) {
    const urlKey = article.url.toLowerCase().trim();
    const titleKey = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!seenUrls.has(urlKey) && !seenTitles.has(titleKey)) {
      seenUrls.add(urlKey);
      seenTitles.add(titleKey);
      deduplicated.push(article);
    }
  }

  // Sort by publishedAt DESC
  deduplicated.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Cap at 50 items as mandated
  const capped = deduplicated.slice(0, 50);

  return {
    articles: capped,
    sourceDebug: debugRecords,
    timestamp: new Date().toISOString(),
  };
}

export type AggregatedArticle = NormalizedNewsArticle;
export type SourceHealthRecord = SourceDebugResult;
export const aggregateAllNewsSourcesServerSide = aggregateServerSideNews;
export const DEFAULT_NEWS_SOURCES = PRIMARY_NEWS_SOURCES;

