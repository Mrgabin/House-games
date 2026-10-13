import React from 'react';
import { Game } from '../types';
import { X, Play, Heart, Star, ExternalLink, Keyboard, Trash2, Edit } from 'lucide-react';
import { GameArtwork } from './GameArtwork';

interface GameDetailsModalProps {
  game: Game | null;
  isFavorite: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onPlay: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onDeleteGame?: (gameId: string) => void;
  onEditGame?: (game: Game) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isFavorite,
  isAdmin = false,
  onClose,
  onPlay,
  onToggleFavorite,
  onDeleteGame,
  onEditGame
}) => {
  if (!game) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#070c1e] text-slate-100 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Cover Banner - Fully Stretched, Dark Cyber Contrast & Fitted */}
        <div className="relative w-full h-64 sm:h-72 md:h-80 overflow-hidden bg-slate-950">
          <GameArtwork
            title={game.title}
            category={game.category}
            coverGradient={game.coverGradient}
            coverPattern={game.coverPattern}
            coverIcon={game.coverIcon}
            coverUrl={game.coverUrl}
            aspectRatio="banner"
            className="w-full h-full object-cover object-center"
          />

          {/* Dark Cinematic Cyber Scrim Overlay (no washed-out/pale banner) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c1e] via-[#070c1e]/40 to-black/40 pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-black/70 text-slate-300 hover:text-white border border-white/15 hover:bg-black/90 transition-all backdrop-blur-md cursor-pointer shadow-lg"
            title="Fermer la fiche"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Admin Edit Shortcut on Banner */}
          {isAdmin && onEditGame && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditGame(game);
              }}
              className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a1028]/85 text-cyan-300 hover:text-white hover:bg-purple-950 border border-cyan-400/50 hover:border-cyan-300 transition-all backdrop-blur-md text-xs font-semibold cursor-pointer shadow-[0_0_20px_rgba(76,230,255,0.4)]"
              title="Modifier l'affiche, les avis, les étoiles et les informations en direct"
            >
              <Edit className="w-4 h-4 text-cyan-400" />
              <span>Modifier l'affiche & les avis</span>
            </button>
          )}

          {/* Quick Play Floating Button on Banner */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onPlay(game);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(76,230,255,0.7)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Lancer le jeu</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header & Title */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span className="font-semibold uppercase tracking-wider text-purple-300">{game.category}</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-slate-400">{game.performanceBadge}</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-slate-400 font-mono">{game.releaseYear}</span>
              </div>

              {/* Favorite Button */}
              <button
                type="button"
                onClick={() => onToggleFavorite(game.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-rose-400' : ''}`} />
                <span>{isFavorite ? 'Dans vos favoris' : 'Favori'}</span>
              </button>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
              {game.title}
            </h2>
            <p className="text-sm font-medium text-cyan-200/90 mt-1">
              {game.tagline}
            </p>
          </div>

          {/* Description */}
          <div className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
            {game.description}
          </div>

          {/* Controls Information Block */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>Configuration des commandes (Clavier & Souris)</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              {game.controlsInfo}
            </p>
          </div>

          {/* Technical Specs, Reviews & Studio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Studio / Créateur</span>
              <span className="font-semibold text-slate-200 truncate block mt-0.5">{game.studio}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Note / Étoiles</span>
              <div className="flex items-center gap-1 text-amber-300 font-semibold mt-0.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{game.rating.toFixed(1)} / 5.0</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Parties & Avis</span>
              <span className="font-semibold text-slate-200 block mt-0.5 font-mono">
                {game.playCount.toLocaleString('fr-FR')} avis
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Compatibilité</span>
              <span className="font-semibold text-emerald-400 block mt-0.5 truncate">
                {game.embedCode?.trim() ? 'Balise HTML WebGL' : 'Navigateur Web'}
              </span>
            </div>
          </div>

          {/* Tags */}
          {game.tags && game.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="text-slate-500 font-mono text-[11px]">Mots-clés :</span>
              {game.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/5 text-[11px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isAdmin && onEditGame && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditGame(game);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60 border border-cyan-500/40 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Modifier la fiche</span>
                </button>
              )}

              {isAdmin && onDeleteGame && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Supprimer définitivement "${game.title}" du site ?`)) {
                      onDeleteGame(game.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-200 hover:bg-red-950/50 border border-red-500/30 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer (Admin)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (game.embedCode?.trim()) {
                    const blob = new Blob([game.embedCode], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } else {
                    window.open(game.gameUrl, '_blank');
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <span>Ouvrir dans un nouvel onglet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlay(game);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(76,230,255,0.5)] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Jouer maintenant</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
