export default async function handler(req: any, res: any) {
  const rawUrl = (req.query?.url || new URL(req.url, 'http://localhost').searchParams.get('url')) as string;
  if (!rawUrl) {
    return res.status(400).send('URL manquante');
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.pinterest.com/'
      }
    });

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (e: any) {
    return res.status(500).send(e.message);
  }
}
