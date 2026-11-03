// Vercel Serverless Route /api/news/videos
export default async function handler(req: any, res: any) {
  const category = req.query.category;
  const query = req.query.q;

  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1200');
  return res.status(200).json({
    success: true,
    message: 'Official Video News Feed Endpoint',
    category,
    query,
  });
}
