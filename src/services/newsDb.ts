import { DatabaseSync } from 'node:sqlite';
import path from 'path';

export interface StoredArticle {
  id: string;
  title: string;
  link: string;
  originalLink?: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  image?: string;
  imageUrl?: string;
  videoId?: string;
  sourceName: string;
  sourceUrl: string;
  category: 'News' | 'Announcements' | 'Movies' | 'Releases' | 'General';
  checkedAt?: string | null;
  createdAt: string;
}

export interface NewsSourceRecord {
  id: string;
  name: string;
  url: string;
  siteUrl: string;
  category: string;
  active: boolean;
  lastRefreshStatus?: string | null;
  lastRefreshAt?: string | null;
  lastError?: string | null;
  articleCount?: number;
}

export interface RefreshLogRecord {
  id: string;
  timestamp: string;
  sourceId?: string;
  sourceName: string;
  status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
  articlesFound: number;
  articlesAdded: number;
  errorMessage?: string | null;
}

const DB_PATH = path.resolve(process.cwd(), 'news.db');
let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDatabaseSchema(dbInstance);
  }
  return dbInstance;
}

function initDatabaseSchema(db: DatabaseSync) {
  // 1. Articles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      link TEXT UNIQUE NOT NULL,
      excerpt TEXT NOT NULL,
      published_at TEXT NOT NULL,
      author TEXT,
      image_url TEXT,
      video_id TEXT,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      category TEXT NOT NULL,
      checked_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
    CREATE INDEX IF NOT EXISTS idx_news_link ON news_articles(link);

    CREATE TABLE IF NOT EXISTS news_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      site_url TEXT NOT NULL,
      category TEXT,
      active INTEGER DEFAULT 1,
      last_refresh_status TEXT,
      last_refresh_at TEXT,
      last_error TEXT,
      article_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS news_refresh_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      source_id TEXT,
      source_name TEXT,
      status TEXT NOT NULL,
      articles_found INTEGER DEFAULT 0,
      articles_added INTEGER DEFAULT 0,
      error_message TEXT
    );
  `);

  // Seed default anime RSS sources if empty
  const countRow = db.prepare('SELECT count(*) as count FROM news_sources').get() as { count: number };
  if (countRow.count === 0) {
    const defaultSources: Omit<NewsSourceRecord, 'active'>[] = [
      {
        id: 'crunchyroll',
        name: 'Crunchyroll News',
        url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss',
        siteUrl: 'https://crunchyroll.com/news',
        category: 'Industry',
      },
      {
        id: 'animecorner',
        name: 'Anime Corner',
        url: 'https://animecorner.me/feed/',
        siteUrl: 'https://animecorner.me',
        category: 'News',
      },
      {
        id: 'animeuk',
        name: 'Anime UK News',
        url: 'https://animeuknews.net/feed/',
        siteUrl: 'https://animeuknews.net',
        category: 'General',
      },
      {
        id: 'animeherald',
        name: 'Anime Herald',
        url: 'https://animeherald.com/feed/',
        siteUrl: 'https://animeherald.com',
        category: 'Industry',
      },
      {
        id: 'honeys',
        name: "Honey's Anime",
        url: 'https://honeysanime.com/feed/',
        siteUrl: 'https://honeysanime.com',
        category: 'Reviews',
      },
    ];

    const insertSource = db.prepare(`
      INSERT INTO news_sources (id, name, url, site_url, category, active, last_refresh_status)
      VALUES (?, ?, ?, ?, ?, 1, 'INITIAL')
    `);

    for (const src of defaultSources) {
      insertSource.run(src.id, src.name, src.url, src.siteUrl, src.category);
    }
  }
}

/**
 * Upsert an article parsed from a feed.
 * Deduplicates by URL: if article exists, do not overwrite unless new info found.
 * Returns true if new article inserted, false if already exists.
 */
export function upsertArticle(article: {
  id: string;
  title: string;
  link: string;
  excerpt: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  videoId?: string;
  sourceName: string;
  sourceUrl: string;
  category: string;
}): boolean {
  const db = getDatabase();

  const existing = db.prepare('SELECT id, image_url, video_id FROM news_articles WHERE link = ?').get(article.link) as any;

  if (existing) {
    // If existing lacks image or video and new one has it, update it
    if ((!existing.image_url && article.imageUrl) || (!existing.video_id && article.videoId)) {
      db.prepare(`
        UPDATE news_articles
        SET image_url = COALESCE(image_url, ?),
            video_id = COALESCE(video_id, ?)
        WHERE id = ?
      `).run(article.imageUrl || null, article.videoId || null, existing.id);
    }
    return false;
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO news_articles (
      id, title, link, excerpt, published_at, author, image_url, video_id, source_name, source_url, category, checked_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    article.id,
    article.title,
    article.link,
    article.excerpt,
    article.publishedAt,
    article.author || 'Editorial Staff',
    article.imageUrl || null,
    article.videoId || null,
    article.sourceName,
    article.sourceUrl,
    article.category,
    article.imageUrl ? now : null, // If image already exists, mark checked
    now
  );

  return true;
}

/**
 * Get articles needing secondary enrichment pass (checked_at IS NULL)
 */
export function getArticlesNeedingEnrichment(limit = 25): { id: string; link: string; sourceUrl: string }[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, link, source_url as sourceUrl
    FROM news_articles
    WHERE checked_at IS NULL AND (image_url IS NULL OR video_id IS NULL)
    ORDER BY published_at DESC
    LIMIT ?
  `).all(limit) as { id: string; link: string; sourceUrl: string }[];

  return rows;
}

/**
 * Persist enrichment results
 */
export function updateArticleEnrichment(id: string, imageUrl?: string, videoId?: string) {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE news_articles
    SET image_url = COALESCE(?, image_url),
        video_id = COALESCE(?, video_id),
        checked_at = ?
    WHERE id = ?
  `).run(imageUrl || null, videoId || null, now, id);
}

/**
 * Query articles with filtering, search, and pagination
 */
export function queryArticles(params: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): {
  articles: StoredArticle[];
  total: number;
  limit: number;
  offset: number;
} {
  const db = getDatabase();

  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
  const offset = Math.max(Number(params.offset) || 0, 0);

  const whereClauses: string[] = [];
  const args: any[] = [];

  if (params.category && params.category !== 'All') {
    whereClauses.push('category = ?');
    args.push(params.category);
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    whereClauses.push('(title LIKE ? OR excerpt LIKE ?)');
    args.push(term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count
  const countStmt = db.prepare(`SELECT count(*) as count FROM news_articles ${whereSql}`);
  const totalRow = countStmt.get(...args) as { count: number };
  const total = totalRow ? totalRow.count : 0;

  // Get articles sorted by published_at DESC
  const selectStmt = db.prepare(`
    SELECT
      id,
      title,
      link,
      link as originalLink,
      excerpt,
      published_at as publishedAt,
      author,
      image_url as imageUrl,
      image_url as image,
      video_id as videoId,
      source_name as sourceName,
      source_url as sourceUrl,
      category,
      checked_at as checkedAt,
      created_at as createdAt
    FROM news_articles
    ${whereSql}
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = selectStmt.all(...args, limit, offset) as unknown as StoredArticle[];

  return {
    articles: rows,
    total,
    limit,
    offset,
  };
}

/**
 * Source management methods
 */
export function getAllSources(): NewsSourceRecord[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.url,
      s.site_url as siteUrl,
      s.category,
      s.active,
      s.last_refresh_status as lastRefreshStatus,
      s.last_refresh_at as lastRefreshAt,
      s.last_error as lastError,
      (SELECT count(*) FROM news_articles a WHERE a.source_name = s.name) as articleCount
    FROM news_sources s
    ORDER BY s.name ASC
  `).all() as any[];

  return rows.map(r => ({
    ...r,
    active: Boolean(r.active),
  }));
}

export function addSource(source: { name: string; url: string; siteUrl?: string; category?: string }): NewsSourceRecord {
  const db = getDatabase();
  const id = source.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const siteUrl = source.siteUrl || new URL(source.url).origin;

  db.prepare(`
    INSERT INTO news_sources (id, name, url, site_url, category, active, last_refresh_status)
    VALUES (?, ?, ?, ?, ?, 1, 'PENDING')
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      site_url = excluded.site_url,
      category = excluded.category,
      active = 1
  `).run(id, source.name, source.url, siteUrl, source.category || 'General');

  return {
    id,
    name: source.name,
    url: source.url,
    siteUrl,
    category: source.category || 'General',
    active: true,
    lastRefreshStatus: 'PENDING',
    articleCount: 0,
  };
}

export function removeSource(id: string): boolean {
  const db = getDatabase();
  db.prepare('DELETE FROM news_sources WHERE id = ?').run(id);
  return true;
}

export function updateSourceRefreshStatus(id: string, status: string, error?: string | null) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE news_sources
    SET last_refresh_status = ?,
        last_refresh_at = ?,
        last_error = ?
    WHERE id = ?
  `).run(status, now, error || null, id);
}

/**
 * Log refresh operations
 */
export function addRefreshLog(log: Omit<RefreshLogRecord, 'id' | 'timestamp'>) {
  const db = getDatabase();
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO news_refresh_logs (
      id, timestamp, source_id, source_name, status, articles_found, articles_added, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    timestamp,
    log.sourceId || null,
    log.sourceName,
    log.status,
    log.articlesFound || 0,
    log.articlesAdded || 0,
    log.errorMessage || null
  );
}

export function getRecentRefreshLogs(limit = 20): RefreshLogRecord[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT
      id,
      timestamp,
      source_id as sourceId,
      source_name as sourceName,
      status,
      articles_found as articlesFound,
      articles_added as articlesAdded,
      error_message as errorMessage
    FROM news_refresh_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit) as unknown as RefreshLogRecord[];

  return rows;
}
