import { fetchAniListRealTrailers } from './anilistTrailerService';

export interface AnimeNewsVideo {
  id: string;
  youtubeId: string;
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
  embedUrl: string;
  originalUrl: string;
  category: 'Trailer' | 'Teaser' | 'Studio Announcement' | 'Event' | 'Interview';
  relatedAnimeTitle?: string;
  description: string;
}

export async function fetchOfficialAnimeVideos(category?: string, query?: string): Promise<AnimeNewsVideo[]> {
  try {
    const realTrailers = await fetchAniListRealTrailers(16);

    let videos: AnimeNewsVideo[] = realTrailers.map((t) => ({
      id: t.id,
      youtubeId: t.videoId,
      title: t.trailerTitle,
      channelName: t.animeMedia.studios?.nodes?.[0]?.name || 'Official Studio',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: t.thumbnailUrl,
      embedUrl: t.embedUrl,
      originalUrl: t.originalUrl,
      category: t.category === 'Movie' ? 'Trailer' : 'Teaser',
      relatedAnimeTitle: t.animeTitle,
      description: t.animeMedia.description || `${t.animeTitle} official trailer response from AniList.`,
    }));

    if (category && category !== 'All') {
      videos = videos.filter((v) => v.category.toLowerCase() === category.toLowerCase());
    }

    if (query && query.trim()) {
      const term = query.toLowerCase().trim();
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(term) ||
          v.channelName.toLowerCase().includes(term) ||
          (v.relatedAnimeTitle && v.relatedAnimeTitle.toLowerCase().includes(term))
      );
    }

    return videos;
  } catch (err) {
    console.warn('Failed to fetch official anime videos from AniList:', err);
    return [];
  }
}
