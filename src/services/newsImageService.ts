export const NEUTRAL_NEWS_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80';

// Known publisher logo/icon mapping for crisp UI branding
export const PUBLISHER_BADGES: Record<string, { name: string; color: string; bg: string }> = {
  'MyAnimeList': { name: 'MyAnimeList', color: 'text-sky-400', bg: 'bg-sky-500/20 border-sky-500/30' },
  'Anime News Network': { name: 'ANN', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' },
  'Crunchyroll': { name: 'Crunchyroll', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  'Crunchyroll News': { name: 'Crunchyroll', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  'Anime Corner': { name: 'Anime Corner', color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/30' },
  'Anime Trending': { name: 'Anime Trending', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
  'Otaku USA': { name: 'Otaku USA', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  'Anime Herald': { name: 'Anime Herald', color: 'text-indigo-400', bg: 'bg-indigo-500/20 border-indigo-500/30' },
};

export function getPublisherBadge(source: string) {
  return (
    PUBLISHER_BADGES[source] || {
      name: source || 'Editorial',
      color: 'text-violet-300',
      bg: 'bg-violet-600/20 border-violet-500/30',
    }
  );
}

export function validateNewsImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return NEUTRAL_NEWS_FALLBACK_IMAGE;
  }
  // If thumbnail is tiny (like MyAnimeList 100x156 thumbnail), upgrade quality if possible
  if (url.includes('cdn.myanimelist.net/r/100x156/')) {
    return url.replace('cdn.myanimelist.net/r/100x156/', 'cdn.myanimelist.net/');
  }
  return url;
}

export function handleNewsImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== NEUTRAL_NEWS_FALLBACK_IMAGE) {
    target.src = NEUTRAL_NEWS_FALLBACK_IMAGE;
  }
}
