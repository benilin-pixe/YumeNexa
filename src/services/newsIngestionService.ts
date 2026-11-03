import {
  getAllSources,
  upsertArticle,
  getArticlesNeedingEnrichment,
  updateArticleEnrichment,
  updateSourceRefreshStatus,
  addRefreshLog,
  NewsSourceRecord,
} from './newsDb';
import { parseFeedXml } from './newsFeedParser';
import { enrichArticlePage } from './newsEnricher';

export interface IngestionSummary {
  timestamp: string;
  sourcesProcessed: number;
  totalArticlesFound: number;
  totalArticlesAdded: number;
  enrichedCount: number;
  errors: { sourceName: string; error: string }[];
}

const FEED_TIMEOUT_MS = 10000; // 10s timeout per requirement

export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YumeNexaNewsBot/1.0; +https://yumenexa.tv)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Ingest single RSS / Atom feed
 */
export async function ingestSource(source: NewsSourceRecord): Promise<{
  articlesFound: number;
  articlesAdded: number;
  error?: string;
}> {
  console.log(`[News Ingestion] Fetching feed for: ${source.name} (${source.url})`);

  try {
    const response = await fetchWithTimeout(source.url, FEED_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    if (!xmlText || xmlText.length < 50) {
      throw new Error('Received empty or invalid XML payload');
    }

    const items = parseFeedXml(xmlText);
    let addedCount = 0;

    for (const item of items) {
      const isNew = upsertArticle({
        id: item.id,
        title: item.title,
        link: item.link,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        author: item.author,
        imageUrl: item.imageUrl,
        videoId: item.videoId,
        sourceName: source.name,
        sourceUrl: source.siteUrl || source.url,
        category: item.category,
      });

      if (isNew) {
        addedCount++;
      }
    }

    updateSourceRefreshStatus(source.id, 'SUCCESS', null);
    addRefreshLog({
      sourceId: source.id,
      sourceName: source.name,
      status: 'SUCCESS',
      articlesFound: items.length,
      articlesAdded: addedCount,
      errorMessage: null,
    });

    console.log(`[News Ingestion] ${source.name}: Found ${items.length}, added ${addedCount} new articles.`);
    return { articlesFound: items.length, articlesAdded: addedCount };
  } catch (err: any) {
    const errorMsg = err?.name === 'AbortError' ? 'Feed request timed out (10s)' : (err?.message || 'Failed to fetch feed');
    console.warn(`[News Ingestion] Feed error for ${source.name}:`, errorMsg);

    updateSourceRefreshStatus(source.id, 'ERROR', errorMsg);
    addRefreshLog({
      sourceId: source.id,
      sourceName: source.name,
      status: 'ERROR',
      articlesFound: 0,
      articlesAdded: 0,
      errorMessage: errorMsg,
    });

    return { articlesFound: 0, articlesAdded: 0, error: errorMsg };
  }
}

/**
 * Secondary enrichment pass for articles missing images or YouTube videos
 */
export async function runEnrichmentPass(maxArticles = 30): Promise<number> {
  const articles = getArticlesNeedingEnrichment(maxArticles);
  if (articles.length === 0) return 0;

  console.log(`[News Ingestion] Starting secondary enrichment pass for ${articles.length} articles...`);
  let enrichedCount = 0;

  // Process concurrently with limited concurrency to avoid flooding
  const BATCH_SIZE = 5;
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (art) => {
        try {
          const result = await enrichArticlePage(art.link, art.sourceUrl);
          updateArticleEnrichment(art.id, result.imageUrl, result.videoId);
          if (result.imageUrl || result.videoId) {
            enrichedCount++;
          }
        } catch {
          // Mark as checked to prevent infinite retry
          updateArticleEnrichment(art.id);
        }
      })
    );
  }

  console.log(`[News Ingestion] Secondary enrichment completed. Enriched ${enrichedCount} articles.`);
  return enrichedCount;
}

/**
 * Main entry point: Refreshes all active sources and executes secondary enrichment pass
 */
export async function refreshAllNewsFeeds(): Promise<IngestionSummary> {
  const sources = getAllSources().filter((s) => s.active);
  const summary: IngestionSummary = {
    timestamp: new Date().toISOString(),
    sourcesProcessed: sources.length,
    totalArticlesFound: 0,
    totalArticlesAdded: 0,
    enrichedCount: 0,
    errors: [],
  };

  // Fetch all feeds in parallel with individual error isolation
  const results = await Promise.allSettled(sources.map((src) => ingestSource(src)));

  results.forEach((res, index) => {
    const source = sources[index];
    if (res.status === 'fulfilled') {
      summary.totalArticlesFound += res.value.articlesFound;
      summary.totalArticlesAdded += res.value.articlesAdded;
      if (res.value.error) {
        summary.errors.push({ sourceName: source.name, error: res.value.error });
      }
    } else {
      summary.errors.push({ sourceName: source.name, error: res.reason?.message || 'Unknown error' });
    }
  });

  // Run secondary enrichment pass for articles missing images or videos
  try {
    summary.enrichedCount = await runEnrichmentPass(30);
  } catch (err: any) {
    console.error('[News Ingestion] Enrichment pass error:', err?.message);
  }

  return summary;
}
