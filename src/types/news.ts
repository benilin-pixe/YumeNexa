export interface NewsArticle {
  id: string;
  slug?: string;
  title: string;
  url: string;
  link?: string;
  originalLink?: string;
  source: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt: string;
  summary: string;
  excerpt?: string;
  imageUrl?: string;
  image?: string;
  author?: string;
  category?: 'Announcements' | 'Adaptations' | 'Movies' | 'Industry' | 'Reviews' | 'General' | 'Trailers' | 'News' | 'Releases';
  videoId?: string;
  videoUrl?: string;
  relatedAnimeId?: number;
  tags?: string[];
}
