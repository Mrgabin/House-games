import React, { useState, useEffect } from 'react';
import { User, UserProfileCustomization, Game } from '../types';
import { StorageService } from '../services/storage';
import { X, UserCheck, Sparkles, Palette, FileText, Bookmark, Shield } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: User | null;
  games: Game[];
  onClose: () => void;
  onUpdateUser?: (updated: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  games,
  onClose,
  onUpdateUser
}) => {
  const [custom, setCustom] = useState<UserProfileCustomization>({
    bannerGradient: 'from-violet-950 via-cyan-950 to-slate-950',
    bio: '',
    themeAccent: 'cyan',
    featuredGameId: undefined
  });
  const [username, setUsername] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      const c = StorageService.getProfileCustomization(currentUser.id);
      setCustom(c);
      setUsername(currentUser.username);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateProfileCustomization(currentUser.id, custom);

    // Also update username if changed in users list
    const users = StorageService.getUsers();
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, username: username.trim() || u.username } : u);
    localStorage.setItem('vesper_vault_users_v1', JSON.stringify(updatedUsers));

    const updatedCurrent = { ...currentUser, username: username.trim() || currentUser.username };
    localStorage.setItem('vesper_vault_session_v1', JSON.stringify(updatedCurrent));

    if (onUpdateUser) {
      onUpdateUser(updatedCurrent);
    }

    setSuccessMsg("Profil personnalisé avec succès !");
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1500);
  };

  const gradients = [
    { label: 'Cyber Violet', value: 'from-violet-950 via-purple-900 to-slate-950' },
    { label: 'Néon Cyan', value: 'from-cyan-950 via-blue-950 to-slate-950' },
    { label: 'Matrix Émeraude', value: 'from-emerald-950 via-teal-950 to-slate-950' },
    { label: 'Sunset Cyber', value: 'from-rose-950 via-purple-950 to-slate-950' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-[#040817] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(76,230,255,0.15)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner header */}
        <div className={`h-32 bg-gradient-to-r ${custom.bannerGradient} p-4 flex items-end justify-between relative border-b border-white/10`}>
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${currentUser.avatarBg || 'bg-violet-600'} flex items-center justify-center text-xl font-bold text-white shadow-xl border-2 border-white/20 uppercase`}>
              {currentUser.username.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit'] drop-shadow">
                {currentUser.username}
              </h2>
              <p className="text-xs font-mono text-cyan-200">
                {currentUser.email} {currentUser.isAdmin && '· ADMIN'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMsg && (
            <p className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-center">
              {successMsg}
            </p>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
              Nom d'utilisateur Steam-Style
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Banner Gradient Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thème de Bannière du Profil</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {gradients.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setCustom({ ...custom, bannerGradient: g.value })}
                  className={`p-3 rounded-xl bg-gradient-to-r ${g.value} border text-left text-xs font-semibold text-white transition-all cursor-pointer ${
                    custom.bannerGradient === g.value ? 'border-cyan-400 shadow-[0_0_15px_rgba(76,230,255,0.4)]' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bio / Status Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Statut / Biographie Personnelle</span>
            </label>
            <textarea
              rows={3}
              value={custom.bio}
              onChange={(e) => setCustom({ ...custom, bio: e.target.value })}
              placeholder="Décrivez votre style de joueur, vos jeux favoris ou votre devise..."
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono resize-none"
            />
          </div>

          {/* Featured Game Showcase */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Jeu Phare en Vitrine (Showcase)</span>
            </label>
            <select
              value={custom.featuredGameId || ''}
              onChange={(e) => setCustom({ ...custom, featuredGameId: e.target.value || undefined })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#030612] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="">Aucun jeu en vitrine</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.category})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(76,230,255,0.4)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enregistrer le Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
