import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Game, User, GameSave } from '../types';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ExternalLink, 
  Keyboard, 
  Info, 
  Code2, 
  Globe, 
  Save, 
  Clock, 
  Download, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  FolderDown,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Check
} from 'lucide-react';
import { getCustomGameHtml } from '../data/customEmbeddedGames';
import { FirebaseService } from '../services/firebase';
import { StorageService } from '../services/storage';
import { idbSaves } from '../services/indexedDbSaves';
import { downloadSaveFile } from '../utils/download';

interface PlayablePlayerModalProps {
  game: Game | null;
  currentUser?: User | null;
  onClose: () => void;
  onRecordPlaytime?: (gameId: string, additionalSeconds: number) => void;
}

export const PlayablePlayerModal: React.FC<PlayablePlayerModalProps> = ({ 
  game, 
  currentUser, 
  onClose,
  onRecordPlaytime
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControlsBar, setShowControlsBar] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  // Saves Drawer & Notifications
  const [isSavesDrawerOpen, setIsSavesDrawerOpen] = useState(false);
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [editingSaveId, setEditingSaveId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [saveToast, setSaveToast] = useState<{ title: string; subtitle?: string } | null>(null);

  // Playtime Tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve custom embedded HTML from code file (Ligne 6 de customEmbeddedGames.ts) or fallback to embedCode
  const customHtml = game ? getCustomGameHtml(game) : null;
  const rawHtmlToUse = customHtml || (game?.embedCode && game.embedCode.trim().length > 0 ? game.embedCode.trim() : null);
  const hasEmbedCode = Boolean(rawHtmlToUse && rawHtmlToUse.length > 0);

  // Load and subscribe to game saves
  useEffect(() => {
    if (!game) return;

    const refreshSaves = () => {
      const localSaves = StorageService.getGameSaves(game.id, currentUser?.id);
      setSaves(localSaves);
    };

    refreshSaves();
    const unsubIdb = idbSaves.subscribe(refreshSaves);

    if (currentUser) {
      // Subscribe to live Firestore saves
      const unsubscribe = FirebaseService.subscribeGameSaves(currentUser.id, game.id, (cloudSaves) => {
        // Merge cloud saves with locally cached binary saves if needed
        setSaves(cloudSaves);
      });
      return () => {
        unsubscribe();
        unsubIdb();
      };
    }

    return () => unsubIdb();
  }, [game?.id, currentUser?.id]);

  // Session timer increment & periodic playtime sync
  useEffect(() => {
    sessionSecondsRef.current = 0;
    setSessionSeconds(0);

    const interval = setInterval(() => {
      setSessionSeconds(prev => {
        const next = prev + 1;
        sessionSecondsRef.current = next;
        return next;
      });
    }, 1000);

    // Periodic sync every 30 seconds for safety
    const syncInterval = setInterval(() => {
      if (sessionSecondsRef.current >= 30 && game && onRecordPlaytime) {
        onRecordPlaytime(game.id, 30);
        sessionSecondsRef.current = 0;
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      // Flush remaining seconds on unmount
      if (sessionSecondsRef.current > 0 && game && onRecordPlaytime) {
        onRecordPlaytime(game.id, sessionSecondsRef.current);
      }
    };
  }, [game?.id]);

  // Handle in-game save downloads interception
  const handleSaveIntercepted = useCallback(async (data: { fileName: string; fileData: string; fileSize: number }, autoDownloadToPC = true) => {
    if (!game) return;

    const fileName = data.fileName || `${game.slug || 'jeu'}-save-${new Date().toISOString().slice(0, 10)}.dat`;
    const fileSize = data.fileSize || 0;
    const saveId = `save-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSaveData = {
      id: saveId,
      gameId: game.id,
      gameTitle: game.title,
      userId: currentUser?.id || 'guest',
      fileName,
      fileData: data.fileData,
      fileSize
    };

    // 1. Save in local storage
    const savedLocal = StorageService.saveGameSave(newSaveData);
    setSaves(prev => [savedLocal, ...prev.filter(s => s.id !== savedLocal.id)]);

    // 2. Save in Firebase if user logged in
    if (currentUser) {
      try {
        await FirebaseService.saveGameSave(newSaveData);
      } catch (err) {
        console.warn("Erreur sauvegarde cloud Firebase:", err);
      }
    }

    // 3. Trigger actual browser download to user PC if intercepted from game
    if (autoDownloadToPC && data.fileData) {
      downloadSaveFile(fileName, data.fileData);
    }

    // 4. Show notification
    const sizeFormatted = fileSize > 1024 * 1024 
      ? `${(fileSize / (1024 * 1024)).toFixed(2)} Mo`
      : `${(fileSize / 1024).toFixed(1)} Ko`;

    setSaveToast({
      title: autoDownloadToPC ? `Sauvegarde capturée & téléchargée !` : `Sauvegarde enregistrée !`,
      subtitle: `${fileName} (${sizeFormatted}) ajoutée à votre coffre de sauvegardes.`
    });

    setTimeout(() => {
      setSaveToast(null);
    }, 4500);
  }, [game, currentUser]);

  // Listen to window postMessage from the iframe interceptor
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'HOUSEGAME_SAVE_INTERCEPTED') {
        handleSaveIntercepted(e.data);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleSaveIntercepted]);

  // Generate blob URL for HTML embed code with injected download interceptor
  useEffect(() => {
    setIsLoading(true);
    if (rawHtmlToUse && rawHtmlToUse.trim()) {
      try {
        // Interceptor script injected into the game's page
        const interceptorScript = `
<script>
(function() {
  // 1. Intercept standard <a> programmatic click downloads
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    try {
      const isDownload = this.hasAttribute('download') || (this.download && this.download !== '');
      if (isDownload && this.href) {
        const fileName = this.getAttribute('download') || this.download || 'game-save.dat';
        const href = this.href;
        if (href.startsWith('blob:') || href.startsWith('data:')) {
          fetch(href)
            .then(function(res) { return res.blob(); })
            .then(function(blob) {
              const reader = new FileReader();
              reader.onloadend = function() {
                try {
                  window.parent.postMessage({
                    type: 'HOUSEGAME_SAVE_INTERCEPTED',
                    fileName: fileName,
                    fileData: reader.result,
                    fileSize: blob.size,
                    timestamp: new Date().toISOString()
                  }, '*');
                } catch(e){}
              };
              reader.readAsDataURL(blob);
            })
            .catch(function(e){ console.warn('[Save Fetcher]', e); });
        }
      }
    } catch(err) {
      console.warn('[Save Interceptor]', err);
    }
    return origClick.apply(this, arguments);
  };
})();
</script>
`;

        let finalHtml = rawHtmlToUse;
        if (finalHtml.includes('</head>')) {
          finalHtml = finalHtml.replace('</head>', `${interceptorScript}</head>`);
        } else if (finalHtml.includes('</body>')) {
          finalHtml = finalHtml.replace('</body>', `${interceptorScript}</body>`);
        } else {
          finalHtml = `${interceptorScript}${finalHtml}`;
        }

        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
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
  }, [game?.id, rawHtmlToUse, reloadKey]);

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
      } else if (rawHtmlToUse) {
        const blob = new Blob([rawHtmlToUse], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    }
  };

  // Manual save file download back to user machine
  const handleDownloadSaveFile = (save: GameSave) => {
    const fileDataToUse = save.fileData || idbSaves.getById(save.id)?.fileData;
    if (fileDataToUse) {
      downloadSaveFile(save.customName || save.fileName, fileDataToUse);
    } else {
      setSaveToast({
        title: "Données introuvables",
        subtitle: "Le contenu binaire de cette sauvegarde n'est pas disponible sur cet appareil."
      });
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Start rename
  const handleStartRename = (save: GameSave) => {
    setEditingSaveId(save.id);
    setEditNameInput(save.customName || save.fileName);
  };

  // Submit save rename
  const handleSaveRename = async (saveId: string) => {
    if (!editNameInput.trim()) return;
    const newName = editNameInput.trim();
    StorageService.updateGameSaveName(saveId, newName);
    if (currentUser) {
      try {
        await FirebaseService.updateGameSaveName(currentUser.id, saveId, newName);
      } catch (e) {
        console.warn("Erreur renommage Firebase:", e);
      }
    }
    setSaves(prev => prev.map(s => s.id === saveId ? { ...s, fileName: newName, customName: newName } : s));
    setEditingSaveId(null);
    setSaveToast({
      title: "Sauvegarde renommée !",
      subtitle: `Nouveau libellé : "${newName}"`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Delete save file immediately on click - 1-click direct deletion
  const executeDeleteSave = async (save: GameSave) => {
    // 1. Remove from local storage
    StorageService.deleteGameSave(save.id, save.fileName, save.gameId);

    // 2. Remove from Firebase if user logged in
    if (currentUser) {
      try {
        await FirebaseService.deleteGameSave(currentUser.id, save.id);
      } catch (e) {
        console.warn('Erreur suppression Firebase:', e);
      }
    }

    // 3. Immediately update UI state
    setSaves(prev => prev.filter(s => s.id !== save.id && s.fileName !== save.fileName));
    setSaveToast({
      title: "Sauvegarde supprimée !",
      subtitle: `"${save.customName || save.fileName}" a été supprimée avec succès.`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Clear all saves for this game
  const handleClearAllSaves = async () => {
    if (!game) return;
    const savesList = [...saves];
    for (const s of savesList) {
      StorageService.deleteGameSave(s.id, s.fileName, s.gameId);
      if (currentUser) {
        try {
          await FirebaseService.deleteGameSave(currentUser.id, s.id);
        } catch (e) {}
      }
    }
    setSaves([]);
    setIsConfirmingClearAll(false);
    setSaveToast({
      title: "Toutes les sauvegardes ont été purgées",
      subtitle: `Les sauvegardes de ${game.title} ont été supprimées.`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Manual save upload from local PC
  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const fileData = evt.target?.result as string;
      if (fileData) {
        await handleSaveIntercepted({
          fileName: file.name,
          fileData,
          fileSize: file.size
        }, false);
        // Visually open drawer so the user immediately sees the imported file
        setIsSavesDrawerOpen(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
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
          isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-6xl h-[90vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#070c1e] border-b border-white/10 shrink-0 select-none">
          
          {/* Game Title, Category, Mode Badge & Session Playtime */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(76,230,255,0.8)]" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>{game.title}</span>
                
                <span className="text-[10px] font-mono font-normal text-purple-300 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                  {game.category}
                </span>

                {game.isPrivate && (
                  <span className="text-[10px] font-mono font-medium text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                    Privé (Admin)
                  </span>
                )}

                {hasEmbedCode ? (
                  <span className="text-[10px] font-mono font-normal text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-cyan-400" />
                    <span>{customHtml ? 'Code HTML Dédié' : 'Balise HTML'}</span>
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

          {/* Center Playtime Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Session :</span>
            <span className="font-bold tabular-nums text-white">{formatSeconds(sessionSeconds)}</span>
          </div>

          {/* Player Action Buttons & Saves Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Saves Drawer Toggle Button with count */}
            <button
              type="button"
              onClick={() => setIsSavesDrawerOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isSavesDrawerOpen
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(76,230,255,0.5)]'
                  : 'bg-white/10 text-cyan-300 hover:bg-white/15 border border-cyan-500/30'
              }`}
              title="Ouvrir le tiroir des sauvegardes Cloud et fichiers enregistrés"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sauvegardes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/50 text-[10px] font-mono">
                {saves.length}
              </span>
            </button>

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
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Intercepteur de sauvegardes actif
              </span>
            </div>
          </div>
        )}

        {/* Floating Save Intercepted Toast Banner */}
        {saveToast && (
          <div className="absolute top-16 right-4 z-40 max-w-sm p-3.5 rounded-xl bg-[#08122c]/95 border border-cyan-400/50 shadow-[0_0_25px_rgba(76,230,255,0.4)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">{saveToast.title}</p>
                {saveToast.subtitle && (
                  <p className="text-[11px] text-slate-300 leading-snug">{saveToast.subtitle}</p>
                )}
                <button
                  type="button"
                  onClick={() => setIsSavesDrawerOpen(true)}
                  className="mt-1 text-[11px] font-semibold text-cyan-400 hover:underline cursor-pointer block"
                >
                  Voir dans le tiroir de sauvegardes &rarr;
                </button>
              </div>
            </div>
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
                  {customHtml 
                    ? `Exécution du code HTML lourd dédié pour ${game.title}` 
                    : hasEmbedCode 
                      ? `Exécution de la balise HTML pour ${game.title}` 
                      : `Initialisation du moteur web ${game.title}`}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Web Iframe Container */}
          <iframe
            key={`${game.id}-${reloadKey}`}
            ref={iframeRef}
            src={currentSrc}
            srcDoc={hasEmbedCode && !blobUrl ? (rawHtmlToUse || undefined) : undefined}
            title={game.title}
            onLoad={() => setIsLoading(false)}
            allow="autoplay; fullscreen; gamepad; focus-without-user-activation; cross-origin-isolated *"
            allowFullScreen
            sandbox="allow-forms allow-modals allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-downloads"
            className="w-full h-full border-0 bg-black"
          />

          {/* SLIDING SAVES DRAWER (Right Sidebar) */}
          {isSavesDrawerOpen && (
            <div 
              className="absolute inset-y-0 right-0 z-30 w-full sm:w-96 bg-[#060a1d]/95 backdrop-blur-2xl border-l border-white/15 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-4 bg-[#09102c] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Sauvegardes Cloud
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {saves.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSavesDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Actions Strip */}
              <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentUser ? `Compte : ${currentUser.username}` : 'Mode Invité (local)'}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Clear All Saves button */}
                  {saves.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClearAll(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs border border-rose-500/20 transition-colors cursor-pointer"
                      title="Supprimer toutes les sauvegardes de ce jeu"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Tout effacer</span>
                    </button>
                  )}

                  {/* Import Save Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                    title="Importer un fichier de sauvegarde depuis votre PC"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Importer</span>
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={handleManualUpload} 
                  />
                </div>
              </div>

              {/* Confirm Clear All Banner */}
              {isConfirmingClearAll && (
                <div className="p-3 bg-rose-950/90 border-b border-rose-500/40 flex flex-col gap-2 animate-in fade-in duration-150">
                  <p className="text-xs font-semibold text-rose-200">
                    Voulez-vous supprimer TOUTES les {saves.length} sauvegardes de ce jeu ?
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClearAll(false)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllSaves}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      Oui, tout supprimer
                    </button>
                  </div>
                </div>
              )}

              {/* Drawer Saves List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {saves.length === 0 ? (
                  <div className="py-12 text-center space-y-3 text-slate-400">
                    <FolderDown className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold text-slate-300">
                      Aucune sauvegarde pour ce jeu
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Dès que vous sauvegardez dans le jeu (ou téléchargez un fichier de progression), il sera automatiquement capturé et stocké ici.
                    </p>
                  </div>
                ) : (
                  saves.map((save) => {
                    const sizeLabel = save.fileSize > 1024 * 1024 
                      ? `${(save.fileSize / (1024 * 1024)).toFixed(2)} Mo`
                      : `${(save.fileSize / 1024).toFixed(1)} Ko`;
                    const dateFormatted = new Date(save.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div 
                        key={save.id}
                        className="p-3 rounded-xl bg-[#0a1233]/80 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2 group"
                      >
                        {editingSaveId === save.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editNameInput}
                              onChange={(e) => setEditNameInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(save.id);
                                if (e.key === 'Escape') setEditingSaveId(null);
                              }}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-cyan-400 text-white text-xs focus:outline-none"
                              autoFocus
                              placeholder="Nom de la sauvegarde..."
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(save.id)}
                              className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
                              title="Valider le nouveau nom"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSaveId(null)}
                              className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 overflow-hidden">
                              <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                                {save.customName || save.fileName}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>{dateFormatted}</span>
                                <span>·</span>
                                <span className="text-cyan-400/80">{sizeLabel}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartRename(save)}
                              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer shrink-0"
                              title="Renommer cette sauvegarde"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleStartRename(save)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Renommer la sauvegarde"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Renommer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadSaveFile(save)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium border border-cyan-400/30 transition-all cursor-pointer"
                            title="Télécharger ce fichier de sauvegarde sur votre ordinateur"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => executeDeleteSave(save)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Supprimer cette sauvegarde"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer Notice */}
              <div className="p-3 bg-[#070b20] border-t border-white/10 text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Pour recharger une sauvegarde dans le jeu, téléchargez le fichier puis glissez-le dans la fenêtre de jeu ou utilisez le menu de chargement du jeu.</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Safety Helper */}
        <div className="px-4 py-2 bg-[#050818] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">● Session Active</span>
            <span>·</span>
            <span>{game.studio}</span>
            {hasEmbedCode && (
              <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {customHtml ? 'Code Source Local Dédié' : 'Balise HTML / WebGL'}
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
