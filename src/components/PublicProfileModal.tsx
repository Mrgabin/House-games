import React, { useState } from 'react';
import { User, Game } from '../types';
import { 
  X, 
  Settings, 
  Gamepad2, 
  Heart, 
  Clock, 
  Users, 
  Play, 
  ShieldCheck, 
  ExternalLink,
  Award,
  Sparkles,
  UserPlus,
  UserCheck,
  Share2,
  Check,
  Zap,
  Flame,
  TrendingUp,
  Compass
} from 'lucide-react';
import { GameArtwork } from './GameArtwork';
import { calculateGlobalLevel, calculateLevelFromSeconds, formatPlaytime } from '../utils/level';
import { StatusDropdown } from './StatusDropdown';
import { UserStatus, StatusPreference } from '../types';

interface PublicProfileModalProps {
  isOpen: boolean;
  user: User | null;
  currentUser: User | null;
  games: Game[];
  playtimeSecondsMap: Record<string, number>;
  onClose: () => void;
  onOpenSettings?: () => void;
  onPlayGame: (game: Game) => void;
  onOpenGameDetails: (game: Game) => void;
  onAddFriend?: (user: User) => void;
  onSendFriendRequest?: (user: User) => void;
  onAcceptFriendRequest?: (user: User) => void;
  onCancelFriendRequest?: (user: User) => void;
  onUpdateStatus?: (status: UserStatus, preference: StatusPreference) => void;
  onOpenCommunity?: () => void;
  onShowToast?: (msg: string) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  isOpen,
  user,
  currentUser,
  games,
  playtimeSecondsMap,
  onClose,
  onOpenSettings,
  onPlayGame,
  onOpenGameDetails,
  onAddFriend,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onCancelFriendRequest,
  onUpdateStatus,
  onOpenCommunity,
  onShowToast
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !user) return null;

  const isMe = currentUser?.id === user.id;
  const isFriend = (currentUser?.friends || []).includes(user.id);
  const hasSent = (currentUser?.friendRequestsSent || []).includes(user.id);
  const hasReceived = (currentUser?.friendRequestsReceived || []).includes(user.id);

  // Compute Global ONL Level dynamically: 30 min = 1 XP, 10 XP = 1 Niveau
  const globalLevelInfo = calculateGlobalLevel(playtimeSecondsMap);

  // Resolve featured games: User's explicitly chosen showcase games,
  // falling back to their favorites if none selected, or most played
  let featuredGameIds = user.featuredGameIds && user.featuredGameIds.length > 0 
    ? user.featuredGameIds 
    : (user.favorites || []);

  // If still empty, check if they have playtime on games
  if (featuredGameIds.length === 0) {
    const playedIds = Object.keys(playtimeSecondsMap).filter(id => (playtimeSecondsMap[id] || 0) > 0);
    featuredGameIds = playedIds.slice(0, 4);
  }

  const featuredGames = featuredGameIds
    .map(id => games.find(g => g.id === id))
    .filter((g): g is Game => Boolean(g));

  const handleCopyProfileLink = () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(user.id)}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (onShowToast) {
        onShowToast("Lien de la page de profil copié dans le presse-papier !");
      }
    } catch (e) {
      console.warn("Erreur copie lien:", e);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#050816] text-slate-100 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Section */}
        <div className="relative w-full h-44 sm:h-52 bg-slate-950 overflow-hidden">
          {user.bannerUrl ? (
            <img 
              src={user.bannerUrl} 
              alt="Bannière profil" 
              className="w-full h-full object-cover object-center" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-950 via-[#0a1028] to-cyan-950 flex items-center justify-center">
              <span className="text-white/20 font-mono text-sm tracking-widest uppercase">ONL Profile Deck</span>
            </div>
          )}

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/50 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-black/70 text-slate-300 hover:text-white border border-white/15 hover:bg-black/90 transition-all backdrop-blur-md cursor-pointer shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Profile Quick Action in Banner */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap">
            {isMe && onUpdateStatus && currentUser && (
              <StatusDropdown
                currentStatus={currentUser.status || 'online'}
                statusPreference={currentUser.statusPreference || 'auto'}
                currentGameTitle={currentUser.currentGameTitle}
                onSelectStatus={onUpdateStatus}
              />
            )}

            {isMe && onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-purple-950/80 text-cyan-300 hover:text-white border border-cyan-400/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Modifier mon profil</span>
              </button>
            )}

            {!isMe && currentUser && (
              isFriend ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-md bg-emerald-500/25 text-emerald-200 border border-emerald-500/40">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Amis sur ONL</span>
                </div>
              ) : hasReceived ? (
                <button
                  type="button"
                  onClick={() => onAcceptFriendRequest ? onAcceptFriendRequest(user) : onAddFriend && onAddFriend(user)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all cursor-pointer shadow-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300"
                  title="Valider la demande d'ami reçue"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Valider la demande</span>
                </button>
              ) : hasSent ? (
                <button
                  type="button"
                  onClick={() => onCancelFriendRequest && onCancelFriendRequest(user)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/20"
                  title="Annuler la demande d'ami envoyée"
                >
                  <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Demande envoyée · Annuler</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSendFriendRequest ? onSendFriendRequest(user) : onAddFriend && onAddFriend(user)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all cursor-pointer shadow-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-300"
                  title="Envoyer une demande d'ami"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Demander en ami</span>
                </button>
              )
            )}

            {/* Share / Copy Profile Page URL button */}
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/70 hover:bg-white/15 text-slate-300 hover:text-white border border-white/15 text-xs font-medium backdrop-blur-md transition-all cursor-pointer shadow-md"
              title="Copier le lien direct vers cette page ONL"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Lien copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Partager la page</span>
                </>
              )}
            </button>

            {onOpenCommunity && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCommunity();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/70 hover:bg-white/15 text-slate-300 hover:text-cyan-300 border border-white/15 text-xs font-medium backdrop-blur-md transition-all cursor-pointer shadow-md"
                title="Découvrir d'autres joueurs et profils ONL"
              >
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Autres profils</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Header Bar */}
        <div className="relative px-6 pb-6 pt-0 -mt-16 sm:-mt-20 z-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            
            {/* Avatar & Badges */}
            <div className="flex items-end gap-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-[#050816] ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(76,230,255,0.6)] bg-slate-900 shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${user.avatarBg || 'bg-cyan-600'} flex items-center justify-center text-3xl font-bold text-white uppercase`}>
                    {user.username.charAt(0)}
                  </div>
                )}
                {/* Online Indicator */}
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#050816] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
                    {user.username}
                  </h1>
                  {user.isAdmin && (
                    <span className="text-xs font-mono font-bold text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40">
                      ADMINISTRATEUR
                    </span>
                  )}
                  {/* Real Computed Global ONL Level */}
                  <div 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_15px_rgba(76,230,255,0.35)]"
                    title={`Calcul du niveau : 30 min de jeu = 1 XP | 10 XP = 1 Niveau ONL. Total : ${globalLevelInfo.totalXp} XP (${globalLevelInfo.formattedPlaytime} accumulées sur tous les jeux)`}
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-cyan-200">
                      Niveau ONL {globalLevelInfo.level}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {globalLevelInfo.rankTitle}
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 max-w-md leading-relaxed font-mono">
                  {user.bio || 'Joueur passionné de jeux vidéo Web et portages PC.'}
                </p>

                {/* Level Progress Bar & Micro Info */}
                <div className="pt-1 max-w-md space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Flame className="w-3 h-3 text-cyan-400" />
                      Progression Niveau {globalLevelInfo.level + 1}
                    </span>
                    <span>
                      {globalLevelInfo.xpInLevel} / 10 XP ({globalLevelInfo.xpToNextLevel} XP restant)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                      style={{ width: `${Math.max(5, globalLevelInfo.progressPercent)}%` }}
                    />
                  </div>
                  <span className="block text-[9px] font-mono text-slate-500">
                    Règle ONL : 30 min = 1 XP • 10 XP = +1 Niveau • Toutes les heures s'accumulent
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill Counters */}
            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center min-w-[70px]">
                <span className="block text-slate-400 text-[10px]">Temps Total</span>
                <span className="font-bold text-cyan-300 text-sm">
                  {globalLevelInfo.formattedPlaytime}
                </span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center min-w-[65px]">
                <span className="block text-slate-400 text-[10px]">XP Total</span>
                <span className="font-bold text-amber-300 text-sm">
                  {globalLevelInfo.totalXp} XP
                </span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center min-w-[60px]">
                <span className="block text-slate-400 text-[10px]">Favoris</span>
                <span className="font-bold text-rose-300 text-sm">{(user.favorites || []).length}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center min-w-[60px]">
                <span className="block text-slate-400 text-[10px]">Amis</span>
                <span className="font-bold text-purple-300 text-sm">{(user.friends || []).length}</span>
              </div>
            </div>

          </div>

          {/* ONL Showcase: Vitrine de Jeux Préférés */}
          <div className="rounded-2xl border border-cyan-500/30 bg-[#070d24] p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Vitrine ONL des Jeux Préférés
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Heures passées et niveau spécifique par jeu (00h30 = 1 XP • 10 XP = 1 Niveau)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-purple-300 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Showcase Public</span>
              </span>
            </div>

            {featuredGames.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-black/40 border border-white/5 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">
                  Aucun jeu n'a encore été placé dans la vitrine de ce profil.
                </p>
                {isMe && onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all cursor-pointer"
                  >
                    <span>Choisir mes jeux favoris</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {featuredGames.map((game) => {
                  const playtimeSec = playtimeSecondsMap[game.id] || 0;
                  const gameLevelInfo = calculateLevelFromSeconds(playtimeSec);

                  return (
                    <div 
                      key={game.id}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group flex flex-col justify-between gap-3 shadow-md hover:border-cyan-500/40"
                    >
                      {/* Top Part: Cover + Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/15 shadow-sm">
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

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                              {game.title}
                            </h4>
                            {/* Specific Game Level Badge */}
                            <span 
                              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shrink-0 bg-gradient-to-r from-purple-500/25 to-indigo-500/25 text-purple-200 border border-purple-400/40 shadow-sm"
                              title={`Niveau ${gameLevelInfo.level} sur ${game.title} (${gameLevelInfo.totalXp} XP)`}
                            >
                              Niveau {gameLevelInfo.level}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span>{game.category}</span>
                            <span>·</span>
                            <span className="text-amber-300">★ {game.rating.toFixed(1)}</span>
                          </div>

                          {/* Hours Spent on Game - ALWAYS VISIBLE AS REQUESTED */}
                          <div className="flex items-center gap-1.5 text-xs font-mono pt-0.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-semibold text-white">
                              {gameLevelInfo.formattedPlaytime}
                            </span>
                            <span className="text-[10px] text-slate-400">de jeu passées</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Part: Game Level XP Progress Bar & Action Buttons */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-purple-300">
                            XP : <span className="font-bold text-white">{gameLevelInfo.totalXp} XP</span>
                          </span>
                          <span>
                            {gameLevelInfo.xpInLevel} / 10 XP (Niv. {gameLevelInfo.level + 1})
                          </span>
                        </div>

                        {/* Mini XP bar */}
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(6, gameLevelInfo.progressPercent)}%` }}
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenGameDetails(game);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 transition-colors cursor-pointer"
                          >
                            Détails & Stats
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onPlayGame(game);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Lancer le jeu"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Jouer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Note with quick link */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Profil et vitrine synchronisés sur Firebase Firestore</span>
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              <span>Copier l'adresse de cette vitrine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
