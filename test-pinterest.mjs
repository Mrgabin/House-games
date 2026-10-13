import fetch from 'node-fetch';

async function testPinUrl(rawUrl) {
  console.log("=== Testing URL:", rawUrl);

  // If already an image
  if (rawUrl.includes('i.pinimg.com') && !rawUrl.includes('d53b014d86a6b6761bf649a0ed813c2b')) {
    console.log("Direct i.pinimg.com link:", rawUrl);
    return rawUrl;
  }

  // Follow redirects to get real URL
  let currentUrl = rawUrl;
  let pinId = null;

  try {
    const headRes = await fetch(currentUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    const loc = headRes.headers.get('location');
    if (loc) {
      console.log("Redirect 1 to:", loc);
      currentUrl = loc;
    }
  } catch (e) {}

  // Check if pinId is in URL
  const m = currentUrl.match(/\/pin\/(\d+)/) || rawUrl.match(/\/pin\/(\d+)/);
  if (m) pinId = m[1];
  console.log("Current URL:", currentUrl, "pinId:", pinId);

  // Technique 1: Fetch HTML with desktop User-Agent and inspect
  const res = await fetch(currentUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });

  const html = await res.text();
  console.log("HTML length:", html.length);

  // Unescape
  const unescaped = html.replace(/\\\/|\u002F/g, '/');

  // Look for any i.pinimg.com link EXCEPT d53b014d86a6b6761bf649a0ed813c2b
  const matches = unescaped.match(/https:\/\/i\.pinimg\.com\/(?:originals|1200x|736x|564x|474x|236x)\/[a-zA-Z0-9_\-\.\/]+(?:\.jpg|\.png|\.webp|\.jpeg)/gi) || [];
  const valid = matches.filter(url => !url.includes('d53b014d86a6b6761bf649a0ed813c2b'));
  console.log("Found valid pinimg matches:", valid);

  // Look for JSON or image objects
  const imgUrlMatches = unescaped.match(/"images"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i);
  console.log("imgUrlMatches:", imgUrlMatches ? imgUrlMatches[1] : null);

  // Look for og:image
  const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
             html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  console.log("og:image:", og ? og[1] : null);
}

async function run() {
  await testPinUrl("https://www.pinterest.com/pin/108367934783359677/");
}

run();
