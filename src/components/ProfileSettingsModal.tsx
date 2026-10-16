import React, { useState } from 'react';
import { User, Game } from '../types';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Save, 
  Check, 
  Gamepad2, 
  User as UserIcon, 
  Eye, 
  Layers,
  Palette,
  Clock,
  Zap
} from 'lucide-react';
import { calculateLevelFromSeconds } from '../utils/level';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  currentUser: User;
  games: Game[];
  playtimeSecondsMap?: Record<string, number>;
  onClose: () => void;
  onSaveProfile: (updates: Partial<User>) => void;
}

const AVATAR_PRESETS = [
  { label: 'Cyber Ninja', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80' },
  { label: 'Neon Hacker', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { label: 'Synth Pilot', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' },
  { label: 'Valkyrie Cyber', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { label: 'Pixel Samurai', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { label: 'Android Agent', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
];

const BANNER_PRESETS = [
  { label: 'Cyber City Tokyo', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Neon Grid Synthwave', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Retro Gaming Deck', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Deep Cyber Space', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80' },
];

const COLOR_PRESETS = [
  'bg-violet-600',
  'bg-cyan-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-amber-600'
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  currentUser,
  games,
  playtimeSecondsMap = {},
  onClose,
  onSaveProfile
}) => {
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [avatarBg, setAvatarBg] = useState(currentUser.avatarBg || 'bg-cyan-600');
  const [bannerUrl, setBannerUrl] = useState(currentUser.bannerUrl || '');
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState<string[]>(
    currentUser.featuredGameIds || []
  );
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const toggleFeaturedGame = (gameId: string) => {
    setSelectedFeaturedIds(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      }
      if (prev.length >= 4) {
        // limit to 4 games max in ONL showcase
        return [...prev.slice(1), gameId];
      }
      return [...prev, gameId];
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      username: username.trim() || currentUser.username,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      avatarBg,
      bannerUrl: bannerUrl.trim() || undefined,
      featuredGameIds: selectedFeaturedIds
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#070c1e] text-slate-100 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#040816]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                Personnaliser mon Profil ONL
              </h2>
              <p className="text-xs text-slate-400">
                Avatar, bannière cyberpunk, statut et vitrine publique des jeux préférés
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="relative w-full h-36 sm:h-44 bg-slate-950 overflow-hidden border-b border-white/10">
          {bannerUrl ? (
            <img 
              src={bannerUrl} 
              alt="Bannière" 
              className="w-full h-full object-cover object-center" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-950 via-slate-900 to-cyan-950 flex items-center justify-center text-xs text-slate-500">
              Aucune bannière définie (Dégradé par défaut)
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c1e] via-black/30 to-transparent pointer-events-none" />

          {/* Avatar and Info overlay */}
          <div className="absolute bottom-3 left-4 sm:left-6 flex items-end gap-3.5 z-10">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(76,230,255,0.5)] bg-slate-900 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full ${avatarBg} flex items-center justify-center text-2xl font-bold text-white uppercase`}>
                  {username ? username.charAt(0) : 'J'}
                </div>
              )}
            </div>
            <div className="mb-1">
              <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">
                {username || 'Joueur ONL'}
              </h3>
              <p className="text-xs text-cyan-300 font-mono drop-shadow line-clamp-1">
                {bio || 'Aucune biographie rédigée'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pseudo de joueur (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre pseudo ONL..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                maxLength={40}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Statut / Bio / Devise de profil
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex: Pro gamer WebGL | Recordman Polytrack"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                maxLength={120}
              />
            </div>
          </div>

          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider">
              1. Choisir un Avatar
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.url}
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                    avatarUrl === preset.url
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 shadow-[0_0_15px_rgba(76,230,255,0.4)]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[9px] text-center text-slate-200 py-0.5 truncate px-1">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Avatar URL or Color Fallback */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Ou collez l'URL d'une image personnalisée pour votre avatar..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <span className="text-[11px] text-slate-400">Fond :</span>
                {COLOR_PRESETS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => {
                      setAvatarBg(color);
                      setAvatarUrl('');
                    }}
                    className={`w-6 h-6 rounded-lg ${color} transition-transform cursor-pointer ${
                      avatarBg === color && !avatarUrl ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Banner Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider">
              2. Bannière de Profil Cyberpunk
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BANNER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.url}
                  onClick={() => setBannerUrl(preset.url)}
                  className={`group relative rounded-xl overflow-hidden h-20 border-2 transition-all cursor-pointer ${
                    bannerUrl === preset.url
                      ? 'border-purple-400 ring-2 ring-purple-400/50 scale-102 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 text-[10px] font-semibold text-white">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Ou collez l'URL d'une bannière personnalisée (1200x400 recommandé)..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Showcase Section: Select Favorite Games */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>3. Vitrine de Jeux Préférés (Affichage ONL public)</span>
              </label>
              <span className="text-[11px] font-mono text-purple-300">
                {selectedFeaturedIds.length} / 4 jeux choisis
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sélectionnez jusqu'à 4 titres majeurs qui seront mis en valeur sur votre profil pour vos amis :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {games.map((g) => {
                const isSelected = selectedFeaturedIds.includes(g.id);
                const sec = playtimeSecondsMap[g.id] || 0;
                const levelInfo = calculateLevelFromSeconds(sec);

                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => toggleFeaturedGame(g.id)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold truncate block">{g.title}</span>
                      {isSelected && (
                        <span className="p-0.5 rounded-full bg-purple-500 text-white shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-purple-300 font-semibold">
                          Niv. {levelInfo.level}
                        </span>
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {levelInfo.formattedPlaytime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{g.category}</span>
                        <span className="text-amber-400">★ {g.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(76,230,255,0.5)] transition-all cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Enregistrer mon profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
