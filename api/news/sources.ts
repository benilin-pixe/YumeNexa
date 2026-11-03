// Vercel Serverless Route /api/news/sources
export default async function handler(req: any, res: any) {
  const sources = [
    { id: 'myanimelist', name: 'MyAnimeList News' },
    { id: 'crunchyroll', name: 'Crunchyroll News' },
    { id: 'animenewsnetwork', name: 'Anime News Network' },
    { id: 'animecorner', name: 'Anime Corner' },
    { id: 'animetrending', name: 'Anime Trending' },
    { id: 'otakuusa', name: 'Otaku USA' },
  ];

  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.status(200).json({ success: true, sources });
}
