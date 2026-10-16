import React from 'react';
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
  UserCheck
} from 'lucide-react';
import { GameArtwork } from './GameArtwork';

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
  onAddFriend
}) => {
  if (!isOpen || !user) return null;

  const isMe = currentUser?.id === user.id;
  const isFriend = (currentUser?.friends || []).includes(user.id);

  // Compute total playtime
  const totalPlaytimeSec = Object.values(playtimeSecondsMap).reduce((a, b) => a + b, 0);
  const totalHours = Math.round((totalPlaytimeSec / 3600) * 10) / 10;

  // Resolve featured games
  const featuredGames = (user.featuredGameIds || [])
    .map(id => games.find(g => g.id === id))
    .filter((g): g is Game => Boolean(g));

  const formatHours = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m} min`;
    return `${sec}s`;
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
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
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

            {!isMe && currentUser && onAddFriend && (
              <button
                type="button"
                onClick={() => onAddFriend(user)}
                disabled={isFriend}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md ${
                  isFriend
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border border-cyan-300'
                }`}
              >
                {isFriend ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Amis sur ONL</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Ajouter en ami</span>
                  </>
                )}
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

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
                    {user.username}
                  </h1>
                  {user.isAdmin && (
                    <span className="text-xs font-mono font-bold text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40">
                      ADMINISTRATEUR
                    </span>
                  )}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Niveau ONL 24
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 max-w-md leading-relaxed font-mono">
                  {user.bio || 'Joueur passionné de jeux vidéo Web et portages PC.'}
                </p>
              </div>
            </div>

            {/* Quick Stats Pill Counters */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-slate-400 text-[10px]">Temps Total</span>
                <span className="font-bold text-cyan-300 text-sm">{totalHours > 0 ? `${totalHours}h` : '1.8h'}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-slate-400 text-[10px]">Favoris</span>
                <span className="font-bold text-rose-300 text-sm">{user.favorites.length}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="block text-slate-400 text-[10px]">Amis</span>
                <span className="font-bold text-purple-300 text-sm">{(user.friends || []).length}</span>
              </div>
            </div>

          </div>

          {/* ONL Showcase: Vitrine de Jeux Préférés */}
          <div className="rounded-2xl border border-cyan-500/30 bg-[#070d24] p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Vitrine ONL des Jeux Préférés
                </h3>
              </div>
              <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                Showcase Public
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
                  return (
                    <div 
                      key={game.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/10">
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
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {game.title}
                          </h4>
                          <span className="text-[10px] font-mono text-cyan-400/80 block">
                            {game.category} · ★ {game.rating.toFixed(1)}
                          </span>
                          {playtimeSec > 0 && (
                            <span className="text-[10px] font-mono text-purple-300 block">
                              Temps : {formatHours(playtimeSec)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenGameDetails(game);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 transition-colors cursor-pointer"
                        >
                          Détails
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onPlayGame(game);
                          }}
                          className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
                          title="Lancer le jeu"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-2 text-center text-[11px] text-slate-500 font-mono">
            Profil public synchronisé avec Firebase Firestore et ONL Network
          </div>
        </div>
      </div>
    </div>
  );
};
