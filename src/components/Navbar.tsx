import React from 'react';
import { User, ActiveView } from '../types';
import { User as UserIcon, Shield, Heart, Sparkles, LogOut, PlusCircle } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeView: ActiveView;
  favoritesCount: number;
  onSelectView: (view: ActiveView) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenChangelog: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  favoritesCount,
  onSelectView,
  onOpenAuth,
  onOpenAdmin,
  onOpenChangelog,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#02030a]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        
        {/* Zone 1: Single text element Brand wordmark */}
        <a 
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('catalog');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 group cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-[0_0_10px_rgba(76,230,255,0.8)]" />
          <span className="font-['Outfit'] font-bold tracking-wider uppercase text-base text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-cyan-300">
            House Game
          </span>
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onSelectView('catalog')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'catalog'
                ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Bibliothèque
          </button>

          <button
            type="button"
            onClick={() => onSelectView('favorites')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeView === 'favorites'
                ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-400 fill-rose-400/40' : ''}`} />
            <span>Mes Favoris</span>
            {favoritesCount > 0 && (
              <span className="ml-1 text-[11px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                {favoritesCount}
              </span>
            )}
          </button>

          {currentUser?.isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'text-purple-300 border-b-2 border-purple-400 font-semibold'
                  : 'text-purple-300 hover:text-purple-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Console Admin</span>
            </button>
          )}

          <a 
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            À propos
          </a>

          <button
            type="button"
            onClick={onOpenChangelog}
            className="text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Mises à jour</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              v1.7
            </span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile Changelog trigger */}
          <button
            type="button"
            onClick={onOpenChangelog}
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-900/40 transition-colors cursor-pointer"
            title="Historique des mises à jour"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>v1.7</span>
          </button>
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* If Admin, quick add game shortcut */}
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-200 bg-purple-950/60 border border-purple-500/40 rounded-lg hover:bg-purple-900/60 transition-colors whitespace-nowrap shrink-0 shadow-[0_0_14px_rgba(177,116,255,0.2)]"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ajouter un jeu</span>
                </button>
              )}

              {/* User badge with admin badge if elevated */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                <div className={`w-5 h-5 rounded-full ${currentUser.avatarBg || 'bg-violet-600'} flex items-center justify-center text-[10px] font-bold text-white uppercase`}>
                  {currentUser.username.charAt(0)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-200 truncate max-w-[120px]">
                    {currentUser.username}
                  </span>
                  {currentUser.isAdmin && (
                    <span className="text-[10px] font-mono text-purple-300 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogout}
                title="Se déconnecter"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all shadow-[0_0_20px_rgba(160,88,255,0.3)] whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Se connecter</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
