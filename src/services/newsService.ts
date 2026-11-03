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

/**
 * Fetch articles from the public backend endpoint with caching and search filters
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
  const res = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      'x-requested-by': 'yumenexa-client',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load news articles (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    articles: data.articles || [],
    total: data.total || 0,
    limit: data.limit || 20,
    offset: data.offset || 0,
  };
}

/**
 * Fetch news sources configured in the backend
 */
export async function getNewsSources(): Promise<NewsSourceItem[]> {
  const res = await fetch('/api/news/sources', {
    headers: {
      Accept: 'application/json',
      'x-requested-by': 'yumenexa-client',
    },
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
    headers: {
      'Content-Type': 'application/json',
      'x-requested-by': 'yumenexa-client',
    },
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
    headers: {
      'x-requested-by': 'yumenexa-client',
    },
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
    headers: {
      'Content-Type': 'application/json',
      'x-requested-by': 'yumenexa-client',
    },
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
    headers: {
      Accept: 'application/json',
      'x-requested-by': 'yumenexa-client',
    },
  });

  if (!res.ok) {
    return [];
  }

  return await res.json();
}
