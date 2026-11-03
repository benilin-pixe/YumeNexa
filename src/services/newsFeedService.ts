import { NewsArticle } from '../types/news';
import { validateNewsImageUrl } from './newsImageService';

export interface RSSFeedSource {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const VERIFIED_RSS_SOURCES: RSSFeedSource[] = [
  {
    id: 'ann',
    name: 'Anime News Network',
    url: 'https://www.animenewsnetwork.com/all/rss',
    category: 'Industry',
  },
  {
    id: 'animeuk',
    name: 'Anime UK News',
    url: 'https://animeuknews.net/feed/',
    category: 'General',
  },
  {
    id: 'honeys',
    name: "Honey's Anime",
    url: 'https://honeysanime.com/feed/',
    category: 'Reviews',
  },
  {
    id: 'herald',
    name: 'Anime Herald',
    url: 'https://animeherald.com/feed/',
    category: 'Industry',
  },
];

export async function parseRSSFeed(source: RSSFeedSource): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s per source per requirement

    // Try CORS proxy fallback with 12s timeout
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`, {
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (!res || !res.ok) return [];

    const json = await res.json().catch(() => null);
    if (!json || !json.contents) return [];

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(json.contents, 'text/xml');
    const items = Array.from(xmlDoc.querySelectorAll('item, entry'));

    const parsedArticles: NewsArticle[] = [];

    items.slice(0, 10).forEach((item, idx) => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Anime Article';
      let link = item.querySelector('link')?.textContent?.trim() || item.querySelector('link')?.getAttribute('href') || source.url;

      // Validate link safety: must start with http:// or https://
      if (!link || (!link.startsWith('http://') && !link.startsWith('https://'))) {
        link = source.url;
      }

      const description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || new Date().toISOString();

      const enclosure = item.querySelector('enclosure')?.getAttribute('url') || '';
      const mediaContent = item.querySelector('content')?.getAttribute('url') || item.querySelector('media\\:content')?.getAttribute('url') || '';
      const imageUrl = validateNewsImageUrl(enclosure || mediaContent);

      // Clean HTML tags and decode entities
      const cleanExcerpt = description
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]*>?/gm, '')
        .replace(/\s+/g, ' ')
        .slice(0, 240)
        .trim();

      const slug = `${source.id}-${idx}-${Date.now()}`;

      parsedArticles.push({
        id: slug,
        slug,
        title,
        url: link,
        source: source.name,
        publishedAt: new Date(pubDate).toISOString(),
        summary: cleanExcerpt || title,
        imageUrl,
        author: source.name,
        category: source.category as any,
      });
    });

    return parsedArticles;
  } catch (err: any) {
    console.warn(`RSS Feed parse gracefully handled for ${source.name}:`, err?.message || err);
    return [];
  }
}

export async function fetchAllBackupFeeds(): Promise<NewsArticle[]> {
  const promises = VERIFIED_RSS_SOURCES.map((src) => parseRSSFeed(src));
  const results = await Promise.allSettled(promises);
  const articles: NewsArticle[] = [];

  results.forEach((res) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      articles.push(...res.value);
    }
  });

  return articles;
}

