import { AnimeMedia } from '../types/anime';

const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

const kitsuCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function fetchKitsu<T>(endpoint: string): Promise<T | null> {
  const cacheKey = `kitsu_${endpoint}`;
  const cached = kitsuCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${KITSU_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Kitsu API error status: ${response.status}`);
      return null;
    }

    const json = await response.json();
    const data = json.data;
    kitsuCache.set(cacheKey, { data, timestamp: Date.now() });
    return data as T;
  } catch (err) {
    console.warn('Kitsu fetch failed gracefully:', err);
    return null;
  }
}

// Convert Kitsu API item to AnimeMedia format
export function mapKitsuToAnimeMedia(item: any): AnimeMedia {
  const attr = item?.attributes || {};
  return {
    id: parseInt(item?.id || '0', 10) + 9000000, // Namespace Kitsu IDs safely
    title: {
      userPreferred: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || 'Untitled',
      english: attr.titles?.en || attr.canonicalTitle,
      romaji: attr.titles?.en_jp || attr.canonicalTitle,
      native: attr.titles?.ja_jp,
    },
    coverImage: {
      extraLarge: attr.posterImage?.large || attr.posterImage?.original || attr.posterImage?.medium,
      large: attr.posterImage?.medium || attr.posterImage?.small,
      medium: attr.posterImage?.small,
    },
    bannerImage: attr.coverImage?.large || attr.coverImage?.original || attr.posterImage?.large,
    description: attr.synopsis || attr.description || '',
    genres: attr.categories?.data ? attr.categories.data.map((c: any) => c.attributes?.title) : ['Anime'],
    averageScore: attr.averageRating ? Math.round(parseFloat(attr.averageRating)) : undefined,
    popularity: attr.userCount || 0,
    episodes: attr.episodeCount || 0,
    duration: attr.episodeLength || 24,
    status: attr.status === 'current' ? 'RELEASING' : attr.status === 'finished' ? 'FINISHED' : 'NOT_YET_RELEASED',
    format: attr.subtype ? (attr.subtype.toUpperCase() as any) : 'TV',
    seasonYear: attr.startDate ? new Date(attr.startDate).getFullYear() : undefined,
  };
}

export async function getKitsuTrendingAnime(): Promise<AnimeMedia[]> {
  const data = await fetchKitsu<any[]>('/trending/anime?page[limit]=12');
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapKitsuToAnimeMedia);
}

export async function getKitsuPopularAnime(): Promise<AnimeMedia[]> {
  const data = await fetchKitsu<any[]>('/anime?sort=-userCount&page[limit]=12');
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapKitsuToAnimeMedia);
}

export async function getKitsuSearch(queryStr: string): Promise<AnimeMedia[]> {
  if (!queryStr.trim()) return [];
  const data = await fetchKitsu<any[]>(`/anime?filter[text]=${encodeURIComponent(queryStr.trim())}&page[limit]=12`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapKitsuToAnimeMedia);
}
