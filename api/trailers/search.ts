// Optional YouTube Data API Proxy
export default async function handler(req: any, res: any) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const queryStr = req.query.q;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      message: 'YOUTUBE_API_KEY environment variable not configured. Using AniList trailers.',
      items: [],
    });
  }

  if (!queryStr || typeof queryStr !== 'string') {
    return res.status(400).json({ error: 'Missing search query q' });
  }

  const targetUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    queryStr + ' official anime trailer'
  )}&type=video&videoEmbeddable=true&maxResults=5&key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({ error: `YouTube API status ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, items: data.items || [] });
  } catch (err: any) {
    return res.status(502).json({ error: 'YouTube API search failed', message: err?.message });
  }
}
