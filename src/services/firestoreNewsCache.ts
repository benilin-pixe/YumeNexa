import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as limitDocs,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getAdminDb } from '../config/firebaseAdmin';
import {
  AggregatedArticle,
  SourceHealthRecord,
  aggregateAllNewsSourcesServerSide,
  DEFAULT_NEWS_SOURCES,
} from './serverNewsAggregator';

export interface CachedNewsResponse {
  articles: AggregatedArticle[];
  total: number;
  sourceHealth: SourceHealthRecord[];
  sourceDebug?: any[];
  lastRefreshedAt: string;
  isStale: boolean;
  fromCache: boolean;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
const MAX_ARTICLES_RETENTION = 200;
const LOCAL_STORAGE_CACHE_KEY = 'yumenexa_news_cache_v2';

// In-memory fallback cache
let inMemoryCache: {
  articles: AggregatedArticle[];
  sourceHealth: SourceHealthRecord[];
  lastRefreshedAt: string;
} | null = null;

let isRefreshingInProgress = false;

/**
 * Reads local storage cache fallback
 */
function readLocalStorageFallback(): {
  articles: AggregatedArticle[];
  sourceHealth: SourceHealthRecord[];
  lastRefreshedAt: string | null;
} | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.articles)) {
      return {
        articles: parsed.articles,
        sourceHealth: parsed.sourceHealth || [],
        lastRefreshedAt: parsed.lastRefreshedAt || null,
      };
    }
  } catch {
    // Ignore JSON parse error
  }
  return null;
}

/**
 * Saves local storage cache fallback
 */
function saveLocalStorageFallback(
  articles: AggregatedArticle[],
  sourceHealth: SourceHealthRecord[],
  lastRefreshedAt: string
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_CACHE_KEY,
      JSON.stringify({
        articles,
        sourceHealth,
        lastRefreshedAt,
      })
    );
  } catch {
    // Ignore storage quota error
  }
}

/**
 * Reads cached news articles from Firestore with in-memory/localStorage fallback
 */
export async function getCachedArticlesFromFirestore(): Promise<{
  articles: AggregatedArticle[];
  sourceHealth: SourceHealthRecord[];
  lastRefreshedAt: string | null;
}> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const metaDoc = await adminDb.collection('news_meta').doc('cache').get();
      let lastRefreshedAt: string | null = null;
      let storedHealth: SourceHealthRecord[] = [];
      if (metaDoc.exists) {
        const data = metaDoc.data();
        lastRefreshedAt = data?.lastRefreshedAt || null;
        storedHealth = data?.sourceHealth || [];
      }

      const newsSnap = await adminDb.collection('news').orderBy('publishedAt', 'desc').limit(100).get();
      const articles: AggregatedArticle[] = [];
      if (!newsSnap.empty) {
        newsSnap.forEach((docSnap: any) => {
          const d = docSnap.data() as any;
          articles.push({
            id: d.id || docSnap.id,
            title: d.title,
            summary: d.summary || d.excerpt || d.title,
            url: d.url || d.link,
            originalLink: d.originalLink || d.url || d.link,
            image: d.imageUrl || d.image,
            imageUrl: d.imageUrl || d.image,
            videoId: d.videoId,
            source: d.sourceName || d.source || 'Anime News',
            sourceName: d.sourceName || d.source || 'Anime News',
            sourceUrl: d.sourceUrl || d.url || d.link,
            publishedAt: d.publishedAt || new Date().toISOString(),
            category: d.category || 'News',
            fetchedAt: d.fetchedAt || d.publishedAt,
          });
        });
      }

      if (articles.length > 0) {
        inMemoryCache = {
          articles,
          sourceHealth: storedHealth,
          lastRefreshedAt: lastRefreshedAt || new Date().toISOString(),
        };
        saveLocalStorageFallback(articles, storedHealth, inMemoryCache.lastRefreshedAt);
        return {
          articles,
          sourceHealth: storedHealth,
          lastRefreshedAt,
        };
      }
    } catch (adminErr: any) {
      console.warn('[Firestore Admin News Cache Read Warning]:', adminErr?.message || adminErr);
    }
  }

  try {
    // 1. Try reading metadata doc first
    const metaSnap = await getDoc(doc(db, 'news_meta', 'cache')).catch(() => null);
    let lastRefreshedAt: string | null = null;
    let storedHealth: SourceHealthRecord[] = [];

    if (metaSnap && metaSnap.exists()) {
      const data = metaSnap.data();
      lastRefreshedAt = data.lastRefreshedAt || null;
      storedHealth = data.sourceHealth || [];
    }

    // 2. Fetch stored articles sorted by publishedAt DESC
    const q = query(
      collection(db, 'news'),
      orderBy('publishedAt', 'desc'),
      limitDocs(100)
    );
    const querySnap = await getDocs(q).catch(() => null);

    const articles: AggregatedArticle[] = [];
    if (querySnap && !querySnap.empty) {
      querySnap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        articles.push({
          id: d.id || docSnap.id,
          title: d.title,
          summary: d.summary || d.excerpt || d.title,
          url: d.url || d.link,
          originalLink: d.originalLink || d.url || d.link,
          image: d.imageUrl || d.image,
          imageUrl: d.imageUrl || d.image,
          videoId: d.videoId,
          source: d.sourceName || d.source || 'Anime News',
          sourceName: d.sourceName || d.source || 'Anime News',
          sourceUrl: d.sourceUrl || d.url || d.link,
          publishedAt: d.publishedAt || new Date().toISOString(),
          category: d.category || 'News',
          fetchedAt: d.fetchedAt || d.publishedAt,
        });
      });
    }

    if (articles.length > 0) {
      inMemoryCache = {
        articles,
        sourceHealth: storedHealth,
        lastRefreshedAt: lastRefreshedAt || new Date().toISOString(),
      };
      saveLocalStorageFallback(articles, storedHealth, inMemoryCache.lastRefreshedAt);
      return {
        articles,
        sourceHealth: storedHealth,
        lastRefreshedAt,
      };
    }
  } catch (err: any) {
    const authUid = auth?.currentUser?.uid || 'unauthenticated';
    console.warn(`[Firestore News Cache] Read error at path '/news' or '/news_meta/cache' (auth: ${authUid}):`, err?.message || err);
  }

  // Fallback to in-memory or localStorage
  if (inMemoryCache && inMemoryCache.articles.length > 0) {
    return {
      articles: inMemoryCache.articles,
      sourceHealth: inMemoryCache.sourceHealth,
      lastRefreshedAt: inMemoryCache.lastRefreshedAt,
    };
  }

  const lsCache = readLocalStorageFallback();
  if (lsCache && lsCache.articles.length > 0) {
    inMemoryCache = {
      articles: lsCache.articles,
      sourceHealth: lsCache.sourceHealth,
      lastRefreshedAt: lsCache.lastRefreshedAt || new Date().toISOString(),
    };
    return lsCache;
  }

  return {
    articles: [],
    sourceHealth: [],
    lastRefreshedAt: null,
  };
}

/**
 * Saves or merges newly fetched news articles into Firestore
 */
export async function saveNewsToFirestoreCache(
  newArticles: AggregatedArticle[],
  sourceHealth: SourceHealthRecord[]
): Promise<void> {
  const nowStr = new Date().toISOString();
  const authUid = auth?.currentUser?.uid || 'unauthenticated';

  // Always update in-memory and localStorage fallback immediately
  if (newArticles.length > 0) {
    inMemoryCache = {
      articles: newArticles,
      sourceHealth,
      lastRefreshedAt: nowStr,
    };
    saveLocalStorageFallback(newArticles, sourceHealth, nowStr);
  }

  // Prefer Firebase Admin SDK for server-side writes (bypasses security rules)
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection('news_meta').doc('cache').set(
        {
          lastRefreshedAt: nowStr,
          sourceHealth,
          totalCount: newArticles.length,
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[Firestore Admin News Cache] Write error at news_meta/cache:', err?.message || err);
    }

    for (const h of sourceHealth) {
      try {
        await adminDb.collection('news_sources').doc(h.id).set(
          {
            id: h.id,
            name: h.name,
            url: h.url,
            lastRefreshStatus: h.status,
            lastRefreshAt: nowStr,
            lastError: h.error || null,
            articlesCount: h.itemCount,
            active: true,
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn(`[Firestore Admin News Cache] Write error at news_sources/${h.id}:`, err?.message || err);
      }
    }

    for (const art of newArticles.slice(0, MAX_ARTICLES_RETENTION)) {
      try {
        await adminDb.collection('news').doc(art.id).set(
          {
            id: art.id,
            title: art.title,
            url: art.url,
            originalLink: art.originalLink || art.url,
            summary: art.summary,
            publishedAt: art.publishedAt,
            author: art.author || art.sourceName || 'Editorial Staff',
            imageUrl: art.imageUrl || art.image || null,
            image: art.imageUrl || art.image || null,
            videoId: art.videoId || null,
            sourceName: art.sourceName,
            sourceUrl: art.sourceUrl,
            category: art.category,
            fetchedAt: nowStr,
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn(`[Firestore Admin News Cache] Write error at news/${art.id}:`, err?.message || err);
      }
    }

    console.log(`[Firestore Admin News Cache] Successfully saved ${newArticles.length} articles via Admin SDK.`);
    return;
  }

  // Fallback to client SDK writes
  // 1. Save metadata document
  try {
    await setDoc(
      doc(db, 'news_meta', 'cache'),
      {
        lastRefreshedAt: nowStr,
        sourceHealth,
        totalCount: newArticles.length,
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn(`[Firestore News Cache] Write error at path 'news_meta/cache' (auth: ${authUid}):`, err?.message || err);
  }

  // 2. Save source health documents
  for (const h of sourceHealth) {
    try {
      await setDoc(
        doc(db, 'news_sources', h.id),
        {
          id: h.id,
          name: h.name,
          url: h.url,
          lastRefreshStatus: h.status,
          lastRefreshAt: nowStr,
          lastError: h.error || null,
          articlesCount: h.itemCount,
          active: true,
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn(`[Firestore News Cache] Write error at path 'news_sources/${h.id}' (auth: ${authUid}):`, err?.message || err);
    }
  }

  // 3. Upsert articles into Firestore 'news' collection
  let successCount = 0;
  let failCount = 0;
  let firstError = '';

  for (const art of newArticles.slice(0, MAX_ARTICLES_RETENTION)) {
    try {
      await setDoc(
        doc(db, 'news', art.id),
        {
          id: art.id,
          title: art.title,
          url: art.url,
          originalLink: art.originalLink || art.url,
          summary: art.summary,
          publishedAt: art.publishedAt,
          author: art.author || art.sourceName || 'Editorial Staff',
          imageUrl: art.imageUrl || art.image || null,
          image: art.imageUrl || art.image || null,
          videoId: art.videoId || null,
          sourceName: art.sourceName,
          sourceUrl: art.sourceUrl,
          category: art.category,
          fetchedAt: nowStr,
        },
        { merge: true }
      );
      successCount++;
    } catch (err: any) {
      failCount++;
      if (!firstError) firstError = err?.message || String(err);
    }
  }

  if (failCount > 0) {
    console.warn(`[Firestore News Cache] Saved ${successCount} articles (${failCount} writes failed). Initial error: ${firstError}`);
  } else {
    console.log(`[Firestore News Cache] Successfully saved ${successCount} articles to Firestore.`);
  }
}

/**
 * Stale-While-Revalidate News Fetching
 */
export async function getNewsWithStaleWhileRevalidate(
  forceRefresh = false
): Promise<CachedNewsResponse> {
  const now = Date.now();
  const cached = await getCachedArticlesFromFirestore();

  const lastTime = cached.lastRefreshedAt ? new Date(cached.lastRefreshedAt).getTime() : 0;
  const isStale = forceRefresh || !cached.lastRefreshedAt || now - lastTime > CACHE_TTL_MS;

  // 1. If cache exists and is NOT stale, serve immediately
  if (!isStale && cached.articles.length > 0) {
    return {
      articles: cached.articles,
      total: cached.articles.length,
      sourceHealth: cached.sourceHealth,
      lastRefreshedAt: cached.lastRefreshedAt || new Date().toISOString(),
      isStale: false,
      fromCache: true,
    };
  }

  // 2. If stale and we have existing articles, serve stale articles AND revalidate concurrently in background
  if (isStale && cached.articles.length > 0 && !forceRefresh) {
    triggerBackgroundRefresh().catch((err) =>
      console.warn('[Background Refresh Exception]:', err?.message || err)
    );

    return {
      articles: cached.articles,
      total: cached.articles.length,
      sourceHealth: cached.sourceHealth,
      lastRefreshedAt: cached.lastRefreshedAt || new Date().toISOString(),
      isStale: true,
      fromCache: true,
    };
  }

  // 3. Cache is empty or forced refresh requested: perform synchronous refresh
  const refreshedData = await executeControlledRefresh();

  if (refreshedData.articles.length > 0) {
    return {
      articles: refreshedData.articles,
      total: refreshedData.articles.length,
      sourceHealth: refreshedData.sourceHealth,
      lastRefreshedAt: refreshedData.timestamp,
      isStale: false,
      fromCache: false,
    };
  }

  return {
    articles: cached.articles,
    total: cached.articles.length,
    sourceHealth: refreshedData.sourceHealth.length > 0 ? refreshedData.sourceHealth : cached.sourceHealth,
    lastRefreshedAt: cached.lastRefreshedAt || new Date().toISOString(),
    isStale: true,
    fromCache: true,
  };
}

async function triggerBackgroundRefresh(): Promise<void> {
  if (isRefreshingInProgress) return;
  try {
    isRefreshingInProgress = true;
    await executeControlledRefresh();
  } finally {
    isRefreshingInProgress = false;
  }
}

/**
 * Controlled refresh logic
 */
export async function executeControlledRefresh() {
  console.log('[News Refresh] Initiating server-side RSS aggregation pass...');

  const aggregation = await aggregateAllNewsSourcesServerSide(DEFAULT_NEWS_SOURCES);

  const currentCached = await getCachedArticlesFromFirestore();

  const mergedMap = new Map<string, AggregatedArticle>();

  for (const art of aggregation.articles) {
    mergedMap.set(art.url.toLowerCase(), art);
  }

  for (const art of currentCached.articles) {
    const key = art.url.toLowerCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, art);
    }
  }

  const mergedArticles = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  await saveNewsToFirestoreCache(mergedArticles, aggregation.sourceDebug);

  return {
    articles: mergedArticles,
    sourceHealth: aggregation.sourceDebug,
    sourceDebug: aggregation.sourceDebug,
    timestamp: new Date().toISOString(),
  };
}
