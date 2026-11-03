import { NewsArticle } from '../types/news';
import { validateNewsImageUrl } from './newsImageService';
import { fetchAllBackupFeeds } from './newsFeedService';
import { fetchAniListRealTrailers } from './anilistTrailerService';

const ANINEWS_API_URL = 'https://aninews.vercel.app/api/news?limit=25';

const newsCache = new Map<string, { data: NewsArticle[]; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export interface AniNewsItem {
  title: string;
  slug: string;
  source: string;
  excerpt: string;
  date: string;
  image: string;
  link: string;
  tags?: string[];
}

export async function fetchPrimaryAniNews(): Promise<NewsArticle[]> {
  const cacheKey = 'aninews_primary';
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(ANINEWS_API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AniNewsAPI returned status ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('AniNewsAPI response format invalid');
    }

    const rawArticles: AniNewsItem[] = json.data;

    const normalizedArticles: NewsArticle[] = rawArticles.map((item) => {
      const validImage = validateNewsImageUrl(item.image);
      const cleanSlug = item.slug || encodeURIComponent(item.link || item.title);

      return {
        id: cleanSlug,
        slug: cleanSlug,
        title: item.title,
        url: item.link || '#',
        source: item.source || 'Anime Press',
        publishedAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        summary: item.excerpt || item.title,
        imageUrl: validImage,
        author: item.source || 'Newsroom',
        category: categorizeArticle(item.title, item.excerpt, item.tags),
        tags: item.tags || ['Anime', item.source],
      };
    });

    newsCache.set(cacheKey, { data: normalizedArticles, timestamp: Date.now() });
    return normalizedArticles;
  } catch (err) {
    console.warn('AniNewsAPI primary fetch failed. Switching to backup feeds:', err);
    return [];
  }
}

function categorizeArticle(title: string, excerpt: string, tags?: string[]): 'Announcements' | 'Adaptations' | 'Movies' | 'Industry' | 'Reviews' | 'Trailers' | 'General' {
  const text = `${title} ${excerpt} ${(tags || []).join(' ')}`.toLowerCase();

  if (text.includes('trailer') || text.includes('teaser') || text.includes('pv') || text.includes('promo')) {
    return 'Trailers';
  }
  if (text.includes('movie') || text.includes('film') || text.includes('theatrical')) {
    return 'Movies';
  }
  if (text.includes('announced') || text.includes('confirms') || text.includes('unveils') || text.includes('reveals')) {
    return 'Announcements';
  }
  if (text.includes('manga') || text.includes('adaptation') || text.includes('light novel')) {
    return 'Adaptations';
  }
  if (text.includes('box office') || text.includes('record') || text.includes('studio') || text.includes('industry')) {
    return 'Industry';
  }
  if (text.includes('review') || text.includes('impression') || text.includes('rating')) {
    return 'Reviews';
  }

  return 'General';
}

export async function fetchAnimeNews(category?: string, search?: string): Promise<NewsArticle[]> {
  let primary = await fetchPrimaryAniNews();

  if (primary.length === 0) {
    primary = await fetchAllBackupFeeds();
  }

  const seenUrls = new Set<string>();
  let deduplicated: NewsArticle[] = [];

  for (const article of primary) {
    const key = article.url.toLowerCase().trim();
    if (!seenUrls.has(key)) {
      seenUrls.add(key);
      deduplicated.push(article);
    }
  }

  if (category && category !== 'All') {
    deduplicated = deduplicated.filter(
      (a) => a.category?.toLowerCase() === category.toLowerCase()
    );
  }

  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    deduplicated = deduplicated.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.summary.toLowerCase().includes(term) ||
        a.source.toLowerCase().includes(term)
    );
  }

  return deduplicated.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getOfficialTrailersFeed(): Promise<NewsArticle[]> {
  try {
    const realTrailers = await fetchAniListRealTrailers(8);
    return realTrailers.map((t) => ({
      id: t.id,
      title: t.trailerTitle,
      url: t.originalUrl,
      source: t.animeMedia.studios?.nodes?.[0]?.name || 'AniList Official',
      publishedAt: new Date().toISOString(),
      summary: t.animeMedia.description || `${t.animeTitle} official trailer response.`,
      imageUrl: t.thumbnailUrl,
      videoUrl: t.embedUrl,
      relatedAnimeId: t.animeId,
      category: 'Trailers',
    }));
  } catch {
    return [];
  }
}

export async function fetchNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const articles = await fetchAnimeNews();
  const match = articles.find((a) => a.slug === slug || a.id === slug);
  return match || null;
}

export async function getNewsHealth() {
  const articles = await fetchAnimeNews();
  return {
    status: articles.length > 0 ? 'Connected' : 'Offline',
    provider: 'AniNewsAPI Primary + Backup RSS Feeds',
    totalArticles: articles.length,
  };
}

export function getAllNewsSourcesWithStats() {
  return [
    { name: 'Anime Corner', url: 'https://animecorner.me/feed/', category: 'General', status: 'Active', articleCount: 42 },
    { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/encyclopedia/rss.xml', category: 'Industry', status: 'Active', articleCount: 65 },
    { name: 'Crunchyroll News', url: 'https://www.crunchyroll.com/news/rss', category: 'Streaming', status: 'Active', articleCount: 38 },
    { name: "Honey's Anime", url: 'https://honeysanime.com/feed/', category: 'Reviews', status: 'Active', articleCount: 24 },
  ];
}

