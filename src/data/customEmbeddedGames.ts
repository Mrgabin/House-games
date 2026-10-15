// =========================================================================================
// HOUSE GAME - INTÉGRATION DE CODE HTML / JEUX WEBGL VOLUMINEUX
// =========================================================================================
// COLLER VOTRE CODE HTML INTÉGRAL CI-DESSOUS (À PARTIR DE LA LIGNE 6, ENTRE LES GUILLEMETS ` `) :
// =========================================================================================
export const CUSTOM_GAME_HTML_CODE = `<!DOCTYPE html>
<html lang="en-us">
  <head>
    <base href="https://cdn.jsdelivr.net/gh/web-ports/cuphead@c9ff1b6b16f9d402b78a42fc2200e1c076c0ab6e/">
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unity WebGL Player | Cuphead</title>
    
    <style>
      body {
        background-color: black;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      #gameContainer {
        width: 100vw !important;
        height: 100vh !important;
        position: absolute;
        top: 0;
        left: 0;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
      #loading-text {
        font-weight: bold;
        background: linear-gradient(
          270deg,
          #ff0000,
          #ff7f00,
          #ffff00,
          #00ff00,
          #0000ff,
          #4b0082,
          #8f00ff
        );
        background-size: 400% 400%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: rainbow 3s ease infinite;
        position: relative;
        z-index: 10;
        color: white; 
        font-size: 48px; 
        font-family: cursive; 
        text-align: center; 
        margin-top: 20px;
      }
      @keyframes rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    </style>
  </head>
  <body>
    <div id="loading-text">LOADING...</div>
    <div id="gameContainer"></div>

    <script src="Build/UnityLoader.js"></script>
    
    <script>
      var loadingText = document.querySelector("#loading-text");
      let totalBytes = 0;
      let loadedBytes = 0;

      async function fetchWithProgress(url) {
        const response = await fetch(url);
        const reader = response.body.getReader();
        let chunks = [];
        let received = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          received += value.length;
          loadedBytes += value.length;
          chunks.push(value);
          
          let mbDone = (loadedBytes / (1024 * 1024)).toFixed(2);
          let mbTotal = '2101.31'; // Approximated total size for the game
          loadingText.textContent = \`LOADING... \${mbDone} MB / \${mbTotal} MB\`;
        }
        
        let fullBuffer = new Uint8Array(received);
        let offset = 0;
        for (let chunk of chunks) {
          fullBuffer.set(chunk, offset);
          offset += chunk.length;
        }
        return fullBuffer.buffer;
      }

      async function mergeFiles(fileParts, cacheKey) {
        const cache = await caches.open("cuphead-cache");
        const cachedResponse = await cache.match(cacheKey);
        
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          return URL.createObjectURL(blob);
        }
        
        const buffers = await Promise.all(
          fileParts.map(part => fetchWithProgress(part))
        );
        
        const mergedBlob = new Blob(buffers);
        const response = new Response(mergedBlob);
        await cache.put(cacheKey, response);
        return URL.createObjectURL(mergedBlob);
      }

      function getParts(file, start, end) {
        let parts = [];
        for (let i = start; i <= end; i++) {
          parts.push(file + ".part" + i);
        }
        return parts;
      }

      (async () => {
        try {
          const [dataUrl, wasmUrl, asmUrl] = await Promise.all([
            mergeFiles(getParts("Build/CupheadPort.data.unityweb", 1, 103), "CupheadPort.data.unityweb"),
            mergeFiles(getParts("Build/CupheadPort.wasm.code.unityweb", 1, 2), "CupheadPort.wasm.code.unityweb"),
            mergeFiles(getParts("Build/CupheadPort.asm.code.unityweb", 1, 3), "CupheadPort.asm.code.unityweb"),
          ]);

          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            if (url.includes("CupheadPort.data.unityweb")) {
              url = dataUrl;
            } else if (url.includes("CupheadPort.wasm.code.unityweb")) {
              url = wasmUrl;
            } else if (url.includes("CupheadPort.asm.code.unityweb")) {
              url = asmUrl;
            }
            return originalOpen.call(this, method, url, ...rest);
          };

          var unityInstance = UnityLoader.instantiate("gameContainer", "Build/CupheadPort.json");
          loadingText.remove();
        } catch (error) {
          console.error("Error loading the game:", error);
          loadingText.textContent = "ERROR LOADING GAME. Check Console.";
          loadingText.style.animation = "none";
          loadingText.style.color = "red";
        }
      })();
    </script>
  </body>
</html>`;

/**
 * Dictionnaire associant un identifiant, titre ou slug de jeu à son code HTML lourd spécifique.
 * Si vous ajoutez un jeu avec le titre "qsdsqdqds", il utilisera automatiquement CUSTOM_GAME_HTML_CODE !
 */
export const CUSTOM_EMBEDDED_GAMES: Record<string, string> = {
  // Clés reconnues pour le jeu nommé "qsdsqdqds"
  'qsdsqdqds': CUSTOM_GAME_HTML_CODE,
  'qsdsqdqds-slug': CUSTOM_GAME_HTML_CODE,
  'cuphead': CUSTOM_GAME_HTML_CODE,
};

/**
 * Fonction de résolution qui vérifie si un jeu possède du code HTML lourd défini en local
 */
export function getCustomGameHtml(game?: { id?: string; title?: string; slug?: string; embedCode?: string } | null): string | null {
  if (!game) return null;

  // 1. Si le jeu a le titre ou le slug ou l'id "qsdsqdqds" (insensible à la casse)
  const normalizedTitle = (game.title || '').trim().toLowerCase();
  const normalizedSlug = (game.slug || '').trim().toLowerCase();
  const normalizedId = (game.id || '').trim().toLowerCase();

  if (
    normalizedTitle === 'qsdsqdqds' ||
    normalizedSlug === 'qsdsqdqds' ||
    normalizedId === 'qsdsqdqds' ||
    normalizedTitle.includes('qsdsqdqds')
  ) {
    return CUSTOM_GAME_HTML_CODE;
  }

  // 2. Vérification dans le dictionnaire CUSTOM_EMBEDDED_GAMES
  if (game.id && CUSTOM_EMBEDDED_GAMES[game.id]) return CUSTOM_EMBEDDED_GAMES[game.id];
  if (game.slug && CUSTOM_EMBEDDED_GAMES[game.slug]) return CUSTOM_EMBEDDED_GAMES[game.slug];
  if (game.title && CUSTOM_EMBEDDED_GAMES[normalizedTitle]) return CUSTOM_EMBEDDED_GAMES[normalizedTitle];

  // 3. Fallback sur le embedCode stocké dans l'objet jeu (si présent)
  if (game.embedCode && game.embedCode.trim().length > 0) {
    return game.embedCode.trim();
  }

  return null;
}
