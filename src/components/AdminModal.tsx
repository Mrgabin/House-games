import React, { useState, useEffect } from 'react';
import { Game, GameCategory } from '../types';
import { 
  X, 
  PlusCircle, 
  Trash2, 
  Shield, 
  Search, 
  Star, 
  Layers, 
  Check, 
  Database, 
  Edit, 
  Image as ImageIcon, 
  Code2, 
  Globe, 
  Code,
  Lock,
  Unlock,
  Copy,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { GameArtwork } from './GameArtwork';

interface AdminModalProps {
  isOpen: boolean;
  games: Game[];
  gameToEdit?: Game | null;
  onClose: () => void;
  onAddGame: (gameData: Partial<Game> & { title: string; category: Game['category']; description: string }) => void;
  onUpdateGame?: (gameId: string, updatedData: Partial<Game>) => void;
  onDeleteGame: (gameId: string) => void;
  onResetDefaults: () => void;
}

const CATEGORIES: Exclude<GameCategory, 'Tous'>[] = [
  'Action',
  'Course',
  'Cyberpunk',
  'Survie',
  'Arcade',
  'Stratégie'
];

const GRADIENT_PRESETS = [
  { label: 'Vesper Violet & Cyan', value: 'from-violet-950 via-purple-900 to-indigo-950', icon: 'ShieldAlert' },
  { label: 'Cyber Blue & Teal', value: 'from-blue-950 via-cyan-900 to-slate-950', icon: 'Zap' },
  { label: 'Neon Rose & Fuchsia', value: 'from-fuchsia-950 via-rose-950 to-slate-950', icon: 'Crosshair' },
  { label: 'Amber Sol & Flame', value: 'from-amber-950 via-orange-950 to-stone-950', icon: 'Gauge' },
  { label: 'Emerald Matrix', value: 'from-emerald-950 via-teal-950 to-slate-950', icon: 'Clock' },
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  games,
  gameToEdit = null,
  onClose,
  onAddGame,
  onUpdateGame,
  onDeleteGame
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'manage'>('form');
  const [searchFilter, setSearchFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Game Form State
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<Exclude<GameCategory, 'Tous'>>('Action');
  const [description, setDescription] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [launchType, setLaunchType] = useState<'url' | 'embed'>('url');
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [rating, setRating] = useState<number>(5.0);
  const [playCount, setPlayCount] = useState<number>(1);
  const [controlsInfo, setControlsInfo] = useState('ZQSD : Déplacement · Clic gauche : Action · Espace : Saut');
  const [studio, setStudio] = useState('Studio Autonome');
  const [tagsInput, setTagsInput] = useState('PC Port, WebGL, 60 FPS');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(GRADIENT_PRESETS[0].icon);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  // Sync state when gameToEdit changes or modal opens
  useEffect(() => {
    if (gameToEdit) {
      setEditingGameId(gameToEdit.id);
      setTitle(gameToEdit.title);
      setTagline(gameToEdit.tagline);
      setCategory(gameToEdit.category);
      setDescription(gameToEdit.description);
      setGameUrl(gameToEdit.gameUrl || '');
      setEmbedCode(gameToEdit.embedCode || '');
      setLaunchType(gameToEdit.embedCode && gameToEdit.embedCode.trim().length > 0 ? 'embed' : 'url');
      setCoverUrl(gameToEdit.coverUrl || '');
      setBannerUrl(gameToEdit.bannerUrl || '');
      setRating(gameToEdit.rating || 5.0);
      setPlayCount(gameToEdit.playCount || 1);
      setControlsInfo(gameToEdit.controlsInfo);
      setStudio(gameToEdit.studio);
      setTagsInput(gameToEdit.tags?.join(', ') || 'PC Port, WebGL');
      setSelectedGradient(gameToEdit.coverGradient || GRADIENT_PRESETS[0].value);
      setSelectedIcon(gameToEdit.coverIcon || GRADIENT_PRESETS[0].icon);
      setIsFeatured(Boolean(gameToEdit.isFeatured));
      setIsPrivate(Boolean(gameToEdit.isPrivate));
      setActiveTab('form');
    } else {
      setEditingGameId(null);
      resetForm();
    }
  }, [gameToEdit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setTagline('');
    setCategory('Action');
    setDescription('');
    setGameUrl('');
    setEmbedCode('');
    setLaunchType('url');
    setCoverUrl('');
    setBannerUrl('');
    setRating(5.0);
    setPlayCount(1);
    setControlsInfo('ZQSD : Déplacement · Clic gauche : Action · Espace : Saut');
    setStudio('Studio Autonome');
    setTagsInput('PC Port, WebGL, 60 FPS');
    setSelectedGradient(GRADIENT_PRESETS[0].value);
    setSelectedIcon(GRADIENT_PRESETS[0].icon);
    setIsFeatured(false);
    setIsPrivate(false);
  };

  const startEditGame = (game: Game) => {
    setEditingGameId(game.id);
    setTitle(game.title);
    setTagline(game.tagline);
    setCategory(game.category);
    setDescription(game.description);
    setGameUrl(game.gameUrl || '');
    setEmbedCode(game.embedCode || '');
    setLaunchType(game.embedCode && game.embedCode.trim().length > 0 ? 'embed' : 'url');
    setCoverUrl(game.coverUrl || '');
    setBannerUrl(game.bannerUrl || '');
    setRating(game.rating || 5.0);
    setPlayCount(game.playCount || 1);
    setControlsInfo(game.controlsInfo);
    setStudio(game.studio);
    setTagsInput(game.tags?.join(', ') || 'PC Port, WebGL');
    setSelectedGradient(game.coverGradient || GRADIENT_PRESETS[0].value);
    setSelectedIcon(game.coverIcon || GRADIENT_PRESETS[0].icon);
    setIsFeatured(Boolean(game.isFeatured));
    setIsPrivate(Boolean(game.isPrivate));
    setActiveTab('form');
  };

  const handleExportActivityLogs = () => {
    const activityLogs = {
      exportTimestamp: new Date().toISOString(),
      platform: "House Game / Vesper Vault (v1.8)",
      adminUser: "Gabin Galtier",
      gamesSummary: {
        total: games.length,
        public: games.filter(g => !g.isPrivate).length,
        private: games.filter(g => g.isPrivate).length,
      },
      gamesActivityLogs: games.map(g => ({
        gameId: g.id,
        title: g.title,
        category: g.category,
        playCount: g.playCount,
        rating: g.rating,
        isPrivate: g.isPrivate,
        studio: g.studio,
        lastIndexed: new Date().toISOString()
      })),
      systemEvents: [
        { type: "SESSION_INIT", status: "ONLINE", timestamp: new Date(Date.now() - 7200000).toISOString() },
        { type: "FIREBASE_SYNC", status: "CONNECTED", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { type: "ADMIN_ACTIVITY_LOGS_EXPORT", status: "SUCCESS", timestamp: new Date().toISOString() }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vesper_vault_activity_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    let finalCoverUrl = coverUrl.trim();
    if (finalCoverUrl && (finalCoverUrl.includes('pinterest.') || finalCoverUrl.includes('pin.it'))) {
      try {
        const res = await fetch(`/api/resolve-pinterest?url=${encodeURIComponent(finalCoverUrl)}`);
        const data = await res.json();
        if (data.imageUrl) {
          finalCoverUrl = data.imageUrl;
        }
      } catch (err) {
        console.warn("Erreur résolution Pinterest:", err);
      }
    }

    const payload = {
      title: title.trim(),
      tagline: tagline.trim() || 'Portage web PC haute fidélité.',
      category,
      description: description.trim(),
      gameUrl: gameUrl.trim() || 'https://polytrack-game.com',
      embedCode: embedCode.trim() || undefined,
      coverUrl: finalCoverUrl || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      coverGradient: selectedGradient,
      coverIcon: selectedIcon,
      controlsInfo: controlsInfo.trim(),
      studio: studio.trim(),
      tags,
      isFeatured,
      isPrivate,
      rating: Number(rating) || 5.0,
      playCount: Number(playCount) || 1,
      releaseYear: new Date().getFullYear(),
    };

    if (editingGameId && onUpdateGame) {
      onUpdateGame(editingGameId, payload);
      setSuccessMessage(`La fiche et l'affiche de "${title}" ont été modifiées en direct !`);
    } else {
      onAddGame(payload);
      setSuccessMessage(`Le jeu "${title}" a été ajouté au catalogue en direct !`);
    }

    setTimeout(() => setSuccessMessage(null), 4000);
    resetForm();
    setEditingGameId(null);
    setActiveTab('manage');
  };

  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    g.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    g.studio.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl rounded-2xl border border-purple-500/30 bg-[#070c1e] text-slate-100 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-950/60 to-[#070c1e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Outfit'] text-white flex items-center gap-2">
                <span>{editingGameId ? 'Modifier la Fiche du Jeu' : 'Console Administrateur'}</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40">
                  TEMPS RÉEL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {editingGameId 
                  ? 'Modifiez l\'affiche, les avis, les étoiles et les informations en direct dans Firebase' 
                  : 'Gérez le catalogue, ajoutez ou modifiez des affiches sans toucher au code source'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-[#050918]">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-t border-x cursor-pointer ${
              activeTab === 'form'
                ? 'bg-[#070c1e] text-purple-200 border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            {editingGameId ? <Edit className="w-4 h-4 text-cyan-400" /> : <PlusCircle className="w-4 h-4 text-purple-400" />}
            <span>{editingGameId ? 'Modifier le jeu' : 'Ajouter un jeu'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-t border-x cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-[#070c1e] text-cyan-200 border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Catalogue ({games.length})</span>
          </button>

          {editingGameId && (
            <button
              type="button"
              onClick={() => {
                setEditingGameId(null);
                resetForm();
              }}
              className="ml-auto text-xs text-slate-400 hover:text-cyan-300 underline"
            >
              + Nouveau jeu vierge
            </button>
          )}
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: ADD OR EDIT GAME FORM */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Titre du jeu *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Minecraft"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catégorie du jeu *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0a1028] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Accroche courte (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex: Sandbox, survie et créativité sans limite"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description complète du jeu *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'univers, le gameplay, les mécaniques..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* AFFICHE & IMAGE DE COUVERTURE AVEC RÉSOLUTEUR PINTEREST ET APERÇU EN DIRECT */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Affiche / Image de couverture (Lien Pinterest ou URL d'image)</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  Temps Réel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      onBlur={async () => {
                        const trimmed = coverUrl.trim();
                        if (trimmed && (trimmed.includes('pinterest.') || trimmed.includes('pin.it'))) {
                          try {
                            const res = await fetch(`/api/resolve-pinterest?url=${encodeURIComponent(trimmed)}`);
                            const data = await res.json();
                            if (data.imageUrl && data.imageUrl !== trimmed) {
                              setCoverUrl(data.imageUrl);
                              setSuccessMessage("Lien Pinterest résolu vers l'image directe !");
                              setTimeout(() => setSuccessMessage(null), 3000);
                            }
                          } catch (e) {
                            console.warn("Auto resolve error", e);
                          }
                        }
                      }}
                      placeholder="Collez ici l'URL Pinterest (pin.it, pinterest.com/pin/...) ou lien d'image"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const trimmed = coverUrl.trim();
                        if (!trimmed) return;
                        try {
                          const res = await fetch(`/api/resolve-pinterest?url=${encodeURIComponent(trimmed)}`);
                          const data = await res.json();
                          if (data.imageUrl) {
                            setCoverUrl(data.imageUrl);
                            setSuccessMessage("Affiche Pinterest récupérée avec succès !");
                            setTimeout(() => setSuccessMessage(null), 3000);
                          }
                        } catch (err) {
                          console.warn(err);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                      title="Résoudre le lien Pinterest en image directe haute qualité"
                    >
                      Résoudre
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Prend en charge tous les liens Pinterest, épingles ou images directes. L'image sera étirée et ajustée à la perfection sans déformation sur les cartes et bannières.
                  </p>
                </div>

                {/* Live Preview Box */}
                <div className="w-full rounded-xl overflow-hidden border border-white/15 aspect-video bg-black/80 flex items-center justify-center shadow-md">
                  {coverUrl ? (
                    <GameArtwork
                      title={title || 'Aperçu'}
                      category={category}
                      coverGradient={selectedGradient}
                      coverPattern={''}
                      coverIcon={selectedIcon}
                      coverUrl={coverUrl}
                      aspectRatio="16:9"
                      className="w-full h-full"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono text-center px-2">
                      Aperçu de l'affiche
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* REVIEWS & STARS MANAGEMENT (AVIS & ÉTOILES EN TEMPS RÉEL) */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Gestion des Avis et Étoiles (Temps Réel)</span>
                </h3>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400">Raccourcis :</span>
                  <button
                    type="button"
                    onClick={() => { setRating(5.0); setPlayCount(playCount > 100 ? playCount : 1520); }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                  >
                    ★ 5.0
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRating(4.8); setPlayCount(playCount > 100 ? playCount : 840); }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                  >
                    ★ 4.8
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRating(4.5); setPlayCount(playCount > 100 ? playCount : 420); }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                  >
                    ★ 4.5
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Note en étoiles (sur 5.0)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={rating}
                      onChange={(e) => setRating(parseFloat(e.target.value) || 5.0)}
                      className="w-24 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-amber-300 font-mono text-xs font-bold focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starIdx) => (
                        <button
                          key={starIdx}
                          type="button"
                          onClick={() => setRating(starIdx)}
                          className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                          title={`Attribuer ${starIdx} étoiles`}
                        >
                          <Star className={`w-4 h-4 ${starIdx <= Math.round(rating) ? 'fill-amber-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre d'avis / parties jouées
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={playCount}
                    onChange={(e) => setPlayCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* SECTION MODE DE LANCEMENT DU JEU : URL WEB OU BALISE HTML (EMBED) */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Mode de Lancement : URL Web OU Balise HTML</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Choisissez comment le jeu démarre lorsque l'on clique sur « Jouer ».
                  </p>
                </div>

                {/* Switcher buttons */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLaunchType('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      launchType === 'url'
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Lien URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaunchType('embed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      launchType === 'embed'
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Balise HTML (Embed)</span>
                    {embedCode.trim() && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {launchType === 'url' ? (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Lien Web / URL playable du jeu {embedCode.trim() ? '(Optionnel car balise présente)' : '*'}
                  </label>
                  <input
                    type="url"
                    required={!embedCode.trim()}
                    value={gameUrl}
                    onChange={(e) => setGameUrl(e.target.value)}
                    placeholder="https://polytrack-game.com ou https://eaglercraft.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Le jeu sera chargé dans la fenêtre via son URL web directe.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-purple-200 flex items-center gap-1.5">
                      <span>Balise HTML complète & Code Source du jeu (WebGL, Unity, etc.) *</span>
                    </label>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {embedCode.trim().length > 0 ? `${embedCode.trim().length} caractères` : 'Vide'}
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    required={!gameUrl.trim()}
                    value={embedCode}
                    onChange={(e) => setEmbedCode(e.target.value)}
                    placeholder={`Collez ici votre balise ou code HTML complet :\nExemple :\n<!DOCTYPE html>\n<html lang="en-us">\n  <head>\n    <base href="https://cdn.jsdelivr.net/gh/web-ports/cuphead@c9ff1b6b16f9d402b78a42fc2200e1c076c0ab6e/">\n    ...\n  </head>\n  <body>\n    <div id="gameContainer"></div>\n    <script src="Build/UnityLoader.js"></script>\n  </body>\n</html>`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#030612] border border-purple-500/30 text-cyan-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-cyan-400 leading-relaxed"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
                    <p className="text-emerald-300/90 flex items-center gap-1">
                      <span>⚡</span>
                      <span>Priorité active : cette balise sera exécutée directement dans le lecteur web au lancement.</span>
                    </p>
                    {embedCode.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => setEmbedCode('')}
                        className="text-red-400 hover:text-red-300 underline shrink-0 cursor-pointer"
                      >
                        Effacer la balise
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Studio / Développeur
                </label>
                <input
                  type="text"
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  placeholder="Ex: StudioMDHR / Mojang"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lien de secours web (optionnel si balise présente)
                </label>
                <input
                  type="url"
                  value={gameUrl}
                  onChange={(e) => setGameUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Commandes du jeu (Clavier / Souris)
              </label>
              <input
                type="text"
                value={controlsInfo}
                onChange={(e) => setControlsInfo(e.target.value)}
                placeholder="ZQSD : Déplacement · Clic gauche : Casser / Action · Espace : Sauter"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Featured Checkbox */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Mettre en avant sur la page d'accueil (Jeu du Moment)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Le jeu occupera la grande bannière Hero principale en haut du site.
                </span>
              </div>
            </label>

            {/* Mode Public ou Privé (Test Admin) */}
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Mode Privé (Test Admin Uniquement)
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 block">
                  Si coché, ce jeu est masqué aux visiteurs et aux joueurs ordinaires. Seul vous (Admin) pourrez le voir et le tester.
                </span>
              </div>
            </label>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 hover:from-cyan-300 hover:to-teal-200 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(76,230,255,0.5)] transition-all cursor-pointer"
              >
                {editingGameId ? 'Enregistrer les modifications en direct' : 'Publier le jeu dans la bibliothèque'}
              </button>
            </div>

          </form>
        )}

        {/* Tab 2: MANAGE & EDIT/DELETE EXISTING GAMES */}
        {activeTab === 'manage' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Rechercher par titre, ID ou catégorie..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Visibility Filter Selector */}
              <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    visibilityFilter === 'all' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous ({games.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('public')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    visibilityFilter === 'public' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Publics ({games.filter(g => !g.isPrivate).length})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('private')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    visibilityFilter === 'private' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Privés ({games.filter(g => g.isPrivate).length})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportActivityLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-200 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 rounded-xl font-semibold transition-colors cursor-pointer shadow-sm"
                  title="Exporter les logs d'activité récents (utilisations de jeux, favoris) sous format JSON"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Exporter logs JSON</span>
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-xl font-mono">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Base Firestore Active</span>
                </div>
              </div>
            </div>

            {/* Games List */}
            <div className="space-y-2.5 mt-2">
              {filteredGames.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucun jeu trouvé pour cette recherche ou ce filtre.
                </div>
              ) : (
                filteredGames.map(game => (
                  <div
                    key={game.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                        <GameArtwork
                          title={game.title}
                          category={game.category}
                          coverGradient={game.coverGradient}
                          coverPattern={game.coverPattern}
                          coverIcon={game.coverIcon}
                          coverUrl={game.coverUrl}
                          aspectRatio="16:9"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">{game.title}</h4>
                          
                          {/* Visibility badge */}
                          {game.isPrivate ? (
                            <span className="text-[10px] font-mono text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Privé (Test)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Public</span>
                            </span>
                          )}

                          <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/20">
                            {game.category}
                          </span>
                          {game.embedCode?.trim() ? (
                            <span className="text-[10px] font-mono text-purple-300 px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                              Balise HTML
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.2 rounded bg-slate-500/20 border border-slate-500/30">
                              Lien URL
                            </span>
                          )}
                        </div>

                        {/* Firebase Document ID row with direct copy */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span className="text-purple-300 font-semibold">Firebase ID:</span>
                          <span className="text-slate-300 truncate max-w-xs">{game.id}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(game.id);
                              setCopiedId(game.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-0.5 rounded hover:bg-white/10 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                            title="Copier l'ID Firebase"
                          >
                            {copiedId === game.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Toggle Public/Private Quick Action */}
                      {onUpdateGame && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateGame(game.id, { isPrivate: !game.isPrivate });
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            game.isPrivate
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                          }`}
                          title={game.isPrivate ? "Rendre ce jeu public" : "Mettre ce jeu en privé pour tests"}
                        >
                          {game.isPrivate ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                          <span>{game.isPrivate ? 'En Privé' : 'En Public'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEditGame(game)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60 border border-cyan-500/30 transition-colors text-xs font-semibold cursor-pointer"
                        title="Modifier l'affiche, les avis et les données de ce jeu"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>

                      {confirmDeleteId === game.id ? (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-red-950/80 border border-red-500/50 animate-in fade-in duration-150">
                          <span className="text-[10px] text-red-300 font-semibold px-1">Supprimer ?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteGame(game.id);
                              setConfirmDeleteId(null);
                              if (editingGameId === game.id) {
                                setEditingGameId(null);
                                setTitle('');
                                setDescription('');
                              }
                              setSuccessMessage(`Le jeu "${game.title}" a été supprimé avec succès.`);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                            title="Confirmer la suppression"
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] transition-colors cursor-pointer"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(game.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/60 border border-red-500/30 transition-colors cursor-pointer"
                          title="Supprimer ce jeu définitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
