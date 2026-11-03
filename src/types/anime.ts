export interface AnimeTitle {
  userPreferred?: string;
  romaji?: string;
  english?: string;
  native?: string;
}

export interface AnimeImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
}

export interface AnimeTrailer {
  id?: string;
  site?: string;
  thumbnail?: string;
}

export interface AnimeStudio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
}

export interface CharacterVoiceActor {
  id: number;
  name: {
    full: string;
    native?: string;
  };
  image?: {
    medium?: string;
    large?: string;
  };
  language?: string;
}

export interface AnimeCharacterNode {
  id: number;
  name: {
    full: string;
    native?: string;
  };
  image?: {
    large?: string;
    medium?: string;
  };
  role: string;
  voiceActors?: CharacterVoiceActor[];
}

export interface AiringScheduleNode {
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  mediaId: number;
  media?: AnimeMedia;
}

export interface AnimeRelationNode {
  relationType: string;
  node: AnimeMedia;
}

export interface AnimeMedia {
  id: number;
  idMal?: number;
  title: AnimeTitle;
  coverImage: AnimeImage;
  bannerImage?: string;
  description?: string;
  genres: string[];
  tags?: Array<{ id: number; name: string; rank?: number; category?: string }>;
  averageScore?: number;
  popularity?: number;
  favourites?: number;
  trending?: number;
  episodes?: number;
  duration?: number;
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  startDate?: { year?: number; month?: number; day?: number };
  endDate?: { year?: number; month?: number; day?: number };
  nextAiringEpisode?: {
    id: number;
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
  studios?: {
    nodes: AnimeStudio[];
  };
  characters?: {
    nodes: AnimeCharacterNode[];
    edges?: Array<{
      role: string;
      node: {
        id: number;
        name: { full: string; native?: string };
        image?: { large?: string; medium?: string };
      };
      voiceActors?: CharacterVoiceActor[];
    }>;
  };
  recommendations?: {
    nodes: Array<{
      mediaRecommendation?: AnimeMedia;
    }>;
  };
  relations?: {
    edges: AnimeRelationNode[];
  };
  trailer?: AnimeTrailer;
}

export interface PageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AnimeSearchFilter {
  search?: string;
  genre?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
  status?: string;
  sort?: string[];
  page?: number;
  perPage?: number;
}
