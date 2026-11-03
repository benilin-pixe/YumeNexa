export interface Episode {
  id: string;
  animeId: number;
  episodeNumber: number;
  title?: string;
  thumbnailUrl?: string;
}

// In a real app, this would fetch from a provider API
export async function getAnimeEpisodes(animeId: number): Promise<Episode[]> {
  // Mock sequence for now, based on AniList total episodes
  return [];
}
