import { AnimeMedia, AnimeSearchFilter, PageInfo, AiringScheduleNode } from '../types/anime';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchAniListGraphQL<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const cacheKey = JSON.stringify({ query, variables });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`AniList GraphQL error: status ${response.status}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      console.error('AniList errors:', json.errors);
      throw new Error(json.errors[0].message || 'GraphQL Query Error');
    }

    cache.set(cacheKey, { data: json.data, timestamp: Date.now() });
    return json.data as T;
  } catch (err) {
    console.error('Failed to fetch from AniList:', err);
    throw err;
  }
}

// Common GraphQL fragments
const MEDIA_FRAGMENT = `
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
  favourites
  trending
  episodes
  duration
  status
  format
  season
  seasonYear
  startDate { year month day }
  endDate { year month day }
  nextAiringEpisode {
    id
    airingAt
    timeUntilAiring
    episode
  }
  studios(isMain: true) {
    nodes {
      id
      name
      isAnimationStudio
    }
  }
  trailer {
    id
    site
    thumbnail
  }
`;

export async function getTrendingAnime(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: PageInfo }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total perPage currentPage lastPage hasNextPage
        }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: PageInfo } }>(query, { page, perPage });
  return data.Page;
}

export async function getPopularAnime(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: PageInfo }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total perPage currentPage lastPage hasNextPage
        }
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: PageInfo } }>(query, { page, perPage });
  return data.Page;
}

export async function getCurrentSeasonalAnime(season?: string, seasonYear?: number, page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: PageInfo }> {
  const date = new Date();
  const currentYear = seasonYear || date.getFullYear();
  const currentMonth = date.getMonth(); // 0-11
  let currentSeason = season;

  if (!currentSeason) {
    if (currentMonth >= 0 && currentMonth <= 2) currentSeason = 'WINTER';
    else if (currentMonth >= 3 && currentMonth <= 5) currentSeason = 'SPRING';
    else if (currentMonth >= 6 && currentMonth <= 8) currentSeason = 'SUMMER';
    else currentSeason = 'FALL';
  }

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total perPage currentPage lastPage hasNextPage
        }
        media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: PageInfo } }>(query, {
    season: currentSeason,
    seasonYear: currentYear,
    page,
    perPage,
  });
  return data.Page;
}

export async function getUpcomingAnime(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: PageInfo }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total perPage currentPage lastPage hasNextPage
        }
        media(status: NOT_YET_RELEASED, sort: [POPULARITY_DESC], type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: PageInfo } }>(query, { page, perPage });
  return data.Page;
}

export async function getPopularMovies(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: PageInfo }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total perPage currentPage lastPage hasNextPage
        }
        media(format: MOVIE, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: PageInfo } }>(query, { page, perPage });
  return data.Page;
}

export async function getAnimeDetails(id: number): Promise<AnimeMedia> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FRAGMENT}
        tags {
          id
          name
          category
          rank
        }
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            role
            node {
              id
              name { full native }
              image { large medium }
            }
            voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
              id
              name { full native }
              image { large medium }
              language
            }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 8) {
          nodes {
            mediaRecommendation {
              ${MEDIA_FRAGMENT}
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              ${MEDIA_FRAGMENT}
            }
          }
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Media: AnimeMedia }>(query, { id });
  return data.Media;
}

export async function searchAnime(filters: AnimeSearchFilter): Promise<{ media: AnimeMedia[]; pageInfo: PageInfo }> {
  const query = `
    query ($search: String, $genre: String, $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort], $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total perPage currentPage lastPage hasNextPage
        }
        media(
          search: $search,
          genre: $genre,
          season: $season,
          seasonYear: $seasonYear,
          format: $format,
          status: $status,
          sort: $sort,
          type: ANIME,
          isAdult: false
        ) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page: filters.page || 1,
    perPage: filters.perPage || 18,
  };

  if (filters.search && filters.search.trim()) variables.search = filters.search.trim();
  if (filters.genre) variables.genre = filters.genre;
  if (filters.season) variables.season = filters.season;
  if (filters.seasonYear) variables.seasonYear = filters.seasonYear;
  if (filters.format) variables.format = filters.format;
  if (filters.status) variables.status = filters.status;
  if (filters.sort && filters.sort.length) variables.sort = filters.sort;
  else variables.sort = ['POPULARITY_DESC'];

  const data = await fetchAniListGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: PageInfo } }>(query, variables);
  return data.Page;
}

export async function getAiringSchedule(airingAtGreater: number, airingAtLesser: number): Promise<AiringScheduleNode[]> {
  const query = `
    query ($airingAtGreater: Int, $airingAtLesser: Int) {
      Page(page: 1, perPage: 100) {
        airingSchedules(airingAt_greater: $airingAtGreater, airingAt_lesser: $airingAtLesser, sort: TIME) {
          id
          airingAt
          timeUntilAiring
          episode
          mediaId
          media {
            ${MEDIA_FRAGMENT}
          }
        }
      }
    }
  `;
  const data = await fetchAniListGraphQL<{ Page: { airingSchedules: AiringScheduleNode[] } }>(query, {
    airingAtGreater,
    airingAtLesser,
  });
  return data.Page.airingSchedules || [];
}

export async function getUpcomingCountdowns(limit = 6): Promise<AiringScheduleNode[]> {
  const now = Math.floor(Date.now() / 1000);
  const next7Days = now + 7 * 24 * 3600;
  const schedule = await getAiringSchedule(now, next7Days);
  return schedule.slice(0, limit);
}
