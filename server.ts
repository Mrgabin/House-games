import express from 'express';
import { createServer as createViteServer } from 'vite';

async function start() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Endpoint to resolve any Pinterest pin URL or web image URL to its direct image
  app.get('/api/resolve-pinterest', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).json({ error: 'URL requise' });
    }

    try {
      // If already a direct image URL
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

      // Normalize escaped slashes often found in JSON/data blobs on Pinterest
      const unescaped = html.replace(/\\\/|\u002F/g, '/');

      // 1. Check for originals or highest resolution pinimg
      const originalsMatch = unescaped.match(/https:\/\/i\.pinimg\.com\/(?:originals|1200x|736x|564x|474x)\/[a-zA-Z0-9_\-\.\/]+(?:\.jpg|\.png|\.webp|\.jpeg)/i);
      if (originalsMatch) {
        return res.json({ imageUrl: originalsMatch[0] });
      }

      // 2. Check for any other i.pinimg.com URL
      const genericPinimg = unescaped.match(/https:\/\/i\.pinimg\.com\/[a-zA-Z0-9_\-\.\/]+(?:\.jpg|\.png|\.webp|\.jpeg)/i);
      if (genericPinimg) {
        return res.json({ imageUrl: genericPinimg[0] });
      }

      // 3. Look for og:image meta tag
      const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogMatch && ogMatch[1]) {
        return res.json({ imageUrl: ogMatch[1] });
      }

      // 4. Look for twitter:image meta tag
      const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (twitterMatch && twitterMatch[1]) {
        return res.json({ imageUrl: twitterMatch[1] });
      }

      return res.json({ imageUrl: rawUrl });
    } catch (e: any) {
      console.warn('Erreur résolution Pinterest:', e.message);
      return res.json({ imageUrl: rawUrl });
    }
  });

  // Image proxy endpoint for high-reliability image delivery without CORS/Referer blocks
  app.get('/api/proxy-image', async (req, res) => {
    const rawUrl = req.query.url as string;
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
      res.send(Buffer.from(buffer));
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Mount Vite middlewares in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`House Game Server running on port ${PORT}`);
  });
}

start();
