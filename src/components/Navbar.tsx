import React from 'react';
import { User, ActiveView, UserStatus, StatusPreference } from '../types';
import { 
  User as UserIcon, 
  Shield, 
  Heart, 
  Sparkles, 
  LogOut, 
  PlusCircle, 
  Users, 
  Settings,
  Gamepad2,
  Zap,
  Bell
} from 'lucide-react';
import { StatusDropdown } from './StatusDropdown';

interface NavbarProps {
  currentUser: User | null;
  currentUserLevel?: number;
  activeView: ActiveView;
  favoritesCount: number;
  friendsCount?: number;
  pendingRequestsCount?: number;
  onSelectView: (view: ActiveView) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenChangelog: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onOpenProfileSettings: () => void;
  onUpdateStatus?: (status: UserStatus, preference: StatusPreference) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentUserLevel = 0,
  activeView,
  favoritesCount,
  friendsCount = 0,
  pendingRequestsCount = 0,
  onSelectView,
  onOpenAuth,
  onOpenAdmin,
  onOpenChangelog,
  onOpenFriends,
  onOpenProfile,
  onOpenProfileSettings,
  onUpdateStatus,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#02030a]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3">
        
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
            ONL
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
            Vault
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
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

          {/* ONL Community & Friends Hub Trigger */}
          <button
            type="button"
            onClick={onOpenFriends}
            className="whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 cursor-pointer"
            title="Explorer les profils de la communauté, vitrines de jeux et amis"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Communauté & Joueurs</span>
            {pendingRequestsCount > 0 ? (
              <span className="ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" title={`${pendingRequestsCount} demande(s) d'ami(s) à valider`}>
                {pendingRequestsCount} demande{pendingRequestsCount > 1 ? 's' : ''}
              </span>
            ) : friendsCount > 0 ? (
              <span className="ml-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {friendsCount}
              </span>
            ) : null}
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

          <button
            type="button"
            onClick={onOpenChangelog}
            className="text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Mises à jour</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              v2.0
            </span>
          </button>
        </nav>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Mobile Amis Button with Request Badge */}
          <button
            type="button"
            onClick={onOpenFriends}
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:text-white cursor-pointer relative"
            title="Ouvrir la liste d'amis et demandes"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            {pendingRequestsCount > 0 ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            ) : friendsCount > 0 ? (
              <span className="font-mono text-[10px]">{friendsCount}</span>
            ) : null}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* If Admin, quick add game shortcut */}
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-200 bg-purple-950/60 border border-purple-500/40 rounded-lg hover:bg-purple-900/60 transition-colors whitespace-nowrap shrink-0 shadow-[0_0_14px_rgba(177,116,255,0.2)]"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ajouter jeu</span>
                </button>
              )}

              {/* Status Selector Dropdown (Discord Style & Manual) */}
              {onUpdateStatus && (
                <StatusDropdown
                  currentStatus={currentUser.status || 'online'}
                  statusPreference={currentUser.statusPreference || 'auto'}
                  currentGameTitle={currentUser.currentGameTitle}
                  onSelectStatus={onUpdateStatus}
                  className="hidden sm:block"
                />
              )}

              {/* ONL User Avatar & Profile Trigger */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-all cursor-pointer group"
                title="Voir mon profil public ONL"
              >
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden shrink-0 border border-cyan-400/50 bg-slate-900">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${currentUser.avatarBg || 'bg-violet-600'} flex items-center justify-center text-[11px] font-bold text-white uppercase`}>
                      {currentUser.username.charAt(0)}
                    </div>
                  )}
                  {/* Dynamic Status Indicator Dot */}
                  <span 
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-black ${
                      currentUser.status === 'in-game'
                        ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(76,230,255,0.9)]'
                        : currentUser.status === 'away'
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        : currentUser.status === 'offline'
                        ? 'bg-slate-500'
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    }`} 
                  />
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="font-medium text-slate-200 truncate max-w-[100px] group-hover:text-cyan-300 transition-colors">
                    {currentUser.username}
                  </span>
                  <span 
                    className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1 font-bold shadow-sm"
                    title={`Niveau ONL ${currentUserLevel} (calculé : 30 min = 1 XP, 10 XP = 1 Niveau)`}
                  >
                    <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                    <span>Niv. {currentUserLevel}</span>
                  </span>
                  {currentUser.isAdmin && (
                    <span className="text-[9px] font-mono text-purple-300 px-1 py-0.2 rounded bg-purple-500/20 border border-purple-500/40">
                      ADMIN
                    </span>
                  )}
                </div>
              </button>

              {/* Edit Profile Settings Shortcut */}
              <button
                type="button"
                onClick={onOpenProfileSettings}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                title="Personnaliser mon profil (Avatar, Bannière, Vitrine)"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogout}
                title="Se déconnecter"
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all shadow-[0_0_20px_rgba(160,88,255,0.3)] whitespace-nowrap shrink-0 cursor-pointer"
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
