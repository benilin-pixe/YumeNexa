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
    name: 'Honey’s Anime',
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
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Try direct fetch or CORS proxy fallback
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const json = await res.json();
    if (!json.contents) return [];

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(json.contents, 'text/xml');
    const items = Array.from(xmlDoc.querySelectorAll('item'));

    return items.slice(0, 10).map((item, idx) => {
      const title = item.querySelector('title')?.textContent || 'Anime Article';
      const link = item.querySelector('link')?.textContent || source.url;
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

      // Extract image enclosure or media:content if present
      const enclosure = item.querySelector('enclosure')?.getAttribute('url') || '';
      const mediaContent = item.querySelector('content')?.getAttribute('url') || item.querySelector('media\\:content')?.getAttribute('url') || '';
      const imageUrl = validateNewsImageUrl(enclosure || mediaContent);

      // Clean HTML tags from excerpt
      const cleanExcerpt = description.replace(/<[^>]*>?/gm, '').slice(0, 180).trim();

      const slug = `${source.id}-${idx}-${Date.now()}`;

      return {
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
      };
    });
  } catch (err) {
    console.warn(`RSS Feed parse error for ${source.name}:`, err);
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
