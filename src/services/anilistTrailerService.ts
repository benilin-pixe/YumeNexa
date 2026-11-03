import { AnimeMedia } from '../types/anime';

export interface AniListTrailerItem {
  id: string; // Unique combined key: `anilist_${mediaId}_${videoId}`
  animeId: number;
  animeTitle: string;
  englishTitle?: string;
  romajiTitle?: string;
  videoId: string;
  site: 'youtube' | string;
  thumbnailUrl: string; // https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
  embedUrl: string;     // https://www.youtube-nocookie.com/embed/VIDEO_ID
  originalUrl: string;  // https://www.youtube.com/watch?v=VIDEO_ID
  trailerTitle: string;
  animeMedia: AnimeMedia;
  category: 'Trending' | 'Popular' | 'Upcoming' | 'Movie' | 'General';
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const trailerCache = new Map<string, { data: AniListTrailerItem[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

export async function fetchAniListRealTrailers(limit = 12): Promise<AniListTrailerItem[]> {
  const cacheKey = `anilist_real_trailers_${limit}`;
  const cached = trailerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: [TRENDING_DESC, POPULARITY_DESC], type: ANIME, isAdult: false) {
          id
          idMal
          title {
            userPreferred
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          popularity
          episodes
          duration
          status
          format
          season
          seasonYear
          trailer {
            id
            site
          }
          studios(isMain: true) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables: { page: 1, perPage: 50 } }),
    });

    if (!response.ok) {
      throw new Error(`AniList trailers query failed with status ${response.status}`);
    }

    const json = await response.json();
    const mediaList: AnimeMedia[] = json.data?.Page?.media || [];

    const realTrailers: AniListTrailerItem[] = [];
    const seenKeys = new Set<string>();

    for (const media of mediaList) {
      const tr = media.trailer;

      // Strict validation according to specifications
      if (
        tr &&
        typeof tr.id === 'string' &&
        tr.id.trim().length > 3 &&
        typeof tr.site === 'string' &&
        tr.site.trim().toLowerCase() === 'youtube'
      ) {
        const videoId = tr.id.trim();
        const site = tr.site.trim().toLowerCase();
        const uniqueKey = `anilist_${media.id}_${videoId}`;

        if (seenKeys.has(uniqueKey)) continue;
        seenKeys.add(uniqueKey);

        const animeTitle = media.title.english || media.title.userPreferred || media.title.romaji || 'Anime';
        const category =
          media.format === 'MOVIE'
            ? 'Movie'
            : media.status === 'NOT_YET_RELEASED'
            ? 'Upcoming'
            : 'Trending';

        realTrailers.push({
          id: uniqueKey,
          animeId: media.id,
          animeTitle,
          englishTitle: media.title.english,
          romajiTitle: media.title.romaji || media.title.userPreferred,
          videoId,
          site: 'youtube',
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`,
          originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
          trailerTitle: `${animeTitle} Official Trailer`,
          animeMedia: media,
          category,
        });
      }
    }

    const result = realTrailers.slice(0, limit);
    trailerCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('Failed to fetch real AniList trailers:', err);
    return [];
  }
}
