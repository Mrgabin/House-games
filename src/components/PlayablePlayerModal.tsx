import React, { useState, useRef, useEffect } from 'react';
import { Game } from '../types';
import { X, Maximize2, Minimize2, RotateCcw, ExternalLink, Keyboard, Info, Code2, Globe } from 'lucide-react';

interface PlayablePlayerModalProps {
  game: Game | null;
  onClose: () => void;
}

export const PlayablePlayerModal: React.FC<PlayablePlayerModalProps> = ({ game, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControlsBar, setShowControlsBar] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const hasEmbedCode = Boolean(game?.embedCode && game.embedCode.trim().length > 0);

  // Generate blob URL for HTML embed code
  useEffect(() => {
    setIsLoading(true);
    if (game?.embedCode && game.embedCode.trim()) {
      try {
        const blob = new Blob([game.embedCode], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.warn("Erreur création Blob embed:", err);
        setBlobUrl(null);
      }
    } else {
      setBlobUrl(null);
    }
  }, [game?.id, game?.embedCode, reloadKey]);

  if (!game) return null;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Erreur passage plein écran:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Erreur sortie plein écran:', err);
      });
      setIsFullscreen(false);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey(prev => prev + 1);
  };

  const handleOpenNewTab = (e: React.MouseEvent) => {
    if (hasEmbedCode) {
      e.preventDefault();
      if (blobUrl) {
        window.open(blobUrl, '_blank');
      } else if (game.embedCode) {
        const blob = new Blob([game.embedCode], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    }
  };

  const currentSrc = hasEmbedCode ? (blobUrl || undefined) : game.gameUrl;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className={`relative flex flex-col bg-[#030612] border border-white/15 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-6xl h-[88vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#070c1e] border-b border-white/10 shrink-0 select-none">
          
          {/* Game Title, Category & Mode Badge */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(76,230,255,0.8)]" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>{game.title}</span>
                <span className="text-[10px] font-mono font-normal text-purple-300 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                  {game.category}
                </span>
                {hasEmbedCode ? (
                  <span className="text-[10px] font-mono font-normal text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-cyan-400" />
                    <span>Balise HTML</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-normal text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>URL Web</span>
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Quick Controls Info */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 truncate max-w-md">
            <Keyboard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{game.controlsInfo}</span>
          </div>

          {/* Player Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            <button
              type="button"
              onClick={() => setShowControlsBar(prev => !prev)}
              className={`p-2 rounded-lg transition-colors text-xs cursor-pointer ${
                showControlsBar ? 'bg-white/10 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Afficher/masquer les astuces de commandes"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReload}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Redémarrer le jeu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <a
              href={hasEmbedCode ? (blobUrl || '#') : game.gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={hasEmbedCode ? handleOpenNewTab : undefined}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Ouvrir en plein écran dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 hover:text-white transition-colors cursor-pointer"
              title="Quitter la session de jeu"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Optional Collapsible Controls Hint Bar */}
        {showControlsBar && (
          <div className="px-4 py-2 bg-[#0a1028] border-b border-white/5 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-cyan-200">Rappel des touches :</span>
              <span className="font-mono text-slate-300">{game.controlsInfo}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Cliquez dans le cadre pour activer la capture clavier et souris
            </span>
          </div>
        )}

        {/* Main Game Screen Viewport */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#02030a] space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-cyan-400 animate-spin shadow-[0_0_20px_rgba(76,230,255,0.4)]" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white tracking-wide font-['Outfit']">
                  Chargement de l'environnement de jeu...
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {hasEmbedCode ? `Exécution de la balise HTML pour ${game.title}` : `Initialisation du moteur web ${game.title}`}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Web Iframe Container */}
          <iframe
            key={`${game.id}-${reloadKey}`}
            ref={iframeRef}
            src={currentSrc}
            srcDoc={hasEmbedCode && !blobUrl ? game.embedCode : undefined}
            title={game.title}
            onLoad={() => setIsLoading(false)}
            allow="autoplay; fullscreen; gamepad; focus-without-user-activation; cross-origin-isolated *"
            allowFullScreen
            sandbox="allow-forms allow-modals allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-downloads"
            className="w-full h-full border-0 bg-black"
          />

        </div>

        {/* Bottom Safety Helper */}
        <div className="px-4 py-2 bg-[#050818] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">● Session Active</span>
            <span>·</span>
            <span>{game.studio}</span>
            {hasEmbedCode && (
              <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Balise HTML / WebGL
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>{hasEmbedCode ? 'Jeu exécuté via balise HTML source' : 'Si le jeu ne charge pas directement :'}</span>
            <a 
              href={hasEmbedCode ? (blobUrl || '#') : game.gameUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={hasEmbedCode ? handleOpenNewTab : undefined}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
            >
              Lancer dans un nouvel onglet
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
