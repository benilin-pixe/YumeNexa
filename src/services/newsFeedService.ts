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

/**
 * Clean server-side backed feed fetcher via same-origin backend API.
 * Never calls AllOrigins or browser direct CORS proxies.
 */
export async function fetchAllBackupFeeds(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('/api/news?limit=30', {
      headers: {
        Accept: 'application/json',
        'x-requested-by': 'yumenexa-client',
      },
    });

    if (!res.ok) return [];

    const json = await res.json().catch(() => null);
    if (!json || !Array.isArray(json.articles)) return [];

    return json.articles.map((item: any) => ({
      id: item.id,
      slug: item.id,
      title: item.title,
      url: item.link || item.url || '#',
      source: item.sourceName || item.source || 'Anime News',
      publishedAt: item.publishedAt || new Date().toISOString(),
      summary: item.excerpt || item.title,
      imageUrl: validateNewsImageUrl(item.imageUrl || item.image),
      videoId: item.videoId,
      author: item.author || 'Editorial Staff',
      category: item.category || 'News',
      tags: ['Anime', item.category || 'News'],
    }));
  } catch (err: any) {
    console.warn('Backup feed fetch handled gracefully:', err?.message || err);
    return [];
  }
}
