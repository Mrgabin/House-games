export default async function handler(req: any, res: any) {
  const rawUrl = (req.query?.url || new URL(req.url, 'http://localhost').searchParams.get('url')) as string;
  if (!rawUrl) {
    return res.status(400).json({ error: 'URL requise' });
  }

  try {
    if (rawUrl.includes('i.pinimg.com') || rawUrl.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i)) {
      return res.json({ imageUrl: rawUrl });
    }

    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      redirect: 'follow'
    });
    const html = await response.text();
    const unescaped = html.replace(/\\\/|\u002F/g, '/');

    const originalsMatch = unescaped.match(/https:\/\/i\.pinimg\.com\/(?:originals|1200x|736x|564x|474x)\/[a-zA-Z0-9_\-\.\/]+(?:\.jpg|\.png|\.webp|\.jpeg)/i);
    if (originalsMatch) {
      return res.json({ imageUrl: originalsMatch[0] });
    }

    const genericPinimg = unescaped.match(/https:\/\/i\.pinimg\.com\/[a-zA-Z0-9_\-\.\/]+(?:\.jpg|\.png|\.webp|\.jpeg)/i);
    if (genericPinimg) {
      return res.json({ imageUrl: genericPinimg[0] });
    }

    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogMatch && ogMatch[1]) {
      return res.json({ imageUrl: ogMatch[1] });
    }

    return res.json({ imageUrl: rawUrl });
  } catch (e: any) {
    return res.json({ imageUrl: rawUrl });
  }
}
