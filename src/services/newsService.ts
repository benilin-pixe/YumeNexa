export interface NewsArticleRecord {
  id: string;
  title: string;
  link: string;
  originalLink?: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  imageUrl?: string;
  image?: string;
  videoId?: string;
  sourceName: string;
  sourceUrl?: string;
  category: 'News' | 'Announcements' | 'Movies' | 'Releases' | 'General';
  checkedAt?: string | null;
}

export interface NewsQueryResult {
  articles: NewsArticleRecord[];
  total: number;
  limit: number;
  offset: number;
  cached?: boolean;
  isStale?: boolean;
  lastRefreshedAt?: string;
}

export interface NewsSourceItem {
  id: string;
  name: string;
  url: string;
  siteUrl?: string;
  category?: string;
  active: boolean;
  lastRefreshStatus?: string | null;
  lastRefreshAt?: string | null;
  lastError?: string | null;
  articleCount?: number;
}

export interface NewsRefreshLogItem {
  id: string;
  timestamp: string;
  sourceId?: string;
  sourceName: string;
  status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
  articlesFound: number;
  articlesAdded: number;
  errorMessage?: string | null;
}

const CLIENT_CACHE_KEY = 'yumenexa_client_news_cache_v3';

/**
 * Fetch articles from the public backend endpoint with caching, search filters, and localStorage fallback
 */
export async function getNewsArticles(params?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsQueryResult> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All') {
    query.set('category', params.category);
  }
  if (params?.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  if (params?.offset !== undefined) {
    query.set('offset', String(params.offset));
  }

  const endpoint = `/api/news?${query.toString()}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'x-requested-by': 'yumenexa-client',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const articles = data.articles || [];
      const result: NewsQueryResult = {
        articles,
        total: data.total || articles.length,
        limit: data.limit || 20,
        offset: data.offset || 0,
        cached: data.cached || false,
        isStale: data.isStale || false,
        lastRefreshedAt: data.lastRefreshedAt || new Date().toISOString(),
      };

      if (typeof window !== 'undefined' && window.localStorage && articles.length > 0) {
        try {
          window.localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify({
            result,
            savedAt: Date.now(),
          }));
        } catch {
          // Ignore quota errors
        }
      }

      return result;
    }
  } catch (fetchErr) {
    console.warn('[NewsService] Network request failed, attempting localStorage fallback:', fetchErr);
  }

  // Fallback to localStorage if offline or network error occurs
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(CLIENT_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.result?.articles?.length > 0) {
          let articles: NewsArticleRecord[] = parsed.result.articles;

          if (params?.category && params.category !== 'All') {
            articles = articles.filter((a) => a.category?.toLowerCase() === params.category!.toLowerCase());
          }

          if (params?.search && params.search.trim()) {
            const term = params.search.trim().toLowerCase();
            articles = articles.filter(
              (a) =>
                a.title.toLowerCase().includes(term) ||
                (a.excerpt || '').toLowerCase().includes(term) ||
                (a.sourceName || '').toLowerCase().includes(term)
            );
          }

          return {
            articles: articles.slice(params?.offset || 0, (params?.offset || 0) + (params?.limit || 20)),
            total: articles.length,
            limit: params?.limit || 20,
            offset: params?.offset || 0,
            cached: true,
            isStale: true,
            lastRefreshedAt: parsed.result.lastRefreshedAt || new Date(parsed.savedAt).toISOString(),
          };
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }

  throw new Error('Unable to fetch news articles and no offline cache available.');
}

import { auth } from '../config/firebase';

export function getAdminAuthHeaders() {
  const user = auth.currentUser;
  return {
    'Content-Type': 'application/json',
    'x-requested-by': 'yumenexa-client',
    'x-user-email': user?.email || '',
    'x-user-role': user?.email === 'benilin76@gmail.com' ? 'admin' : 'user',
  };
}

/**
 * Fetch news sources configured in the backend
 */
export async function getNewsSources(): Promise<NewsSourceItem[]> {
  const res = await fetch('/api/news/sources', {
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to load news sources');
  }

  return await res.json();
}

/**
 * Add a new RSS source
 */
export async function addNewsSource(source: {
  name: string;
  url: string;
  siteUrl?: string;
  category?: string;
}): Promise<NewsSourceItem> {
  const res = await fetch('/api/news/sources', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(source),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to add news source');
  }

  return await res.json();
}

/**
 * Delete an RSS source
 */
export async function deleteNewsSource(id: string): Promise<void> {
  const res = await fetch(`/api/news/sources/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to delete news source');
  }
}

/**
 * Trigger manual refresh job on protected endpoint
 */
export async function refreshNewsArticles(): Promise<any> {
  const res = await fetch('/api/news/refresh', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to trigger feed refresh');
  }

  return await res.json();
}

/**
 * Get refresh logs for admin
 */
export async function getNewsRefreshLogs(): Promise<NewsRefreshLogItem[]> {
  const res = await fetch('/api/news/logs', {
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    return [];
  }

  return await res.json();
}

