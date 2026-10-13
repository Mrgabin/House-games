import React from 'react';
import { Game } from '../types';
import { Play, Heart, Star, Trash2, Edit } from 'lucide-react';
import { GameArtwork } from './GameArtwork';

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  isAdmin?: boolean;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onDeleteGame?: (gameId: string) => void;
  onEditGame?: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isFavorite,
  isAdmin = false,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onDeleteGame,
  onEditGame
}) => {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#070c1e]/65 hover:bg-[#070c1e]/85 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(177,116,255,0.18)] hover:-translate-y-1">
      
      {/* Visual Cover Area */}
      <div className="relative cursor-pointer overflow-hidden" onClick={() => onOpenDetails(game)}>
        <GameArtwork
          title={game.title}
          category={game.category}
          coverGradient={game.coverGradient}
          coverPattern={game.coverPattern}
          coverIcon={game.coverIcon}
          coverUrl={game.coverUrl}
          aspectRatio="16:9"
        />

        {/* Favorite Quick Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
            isFavorite
              ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'bg-black/50 text-slate-300 border border-white/10 hover:text-rose-300 hover:bg-black/70'
          }`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Admin Quick Action Buttons (Edit & Delete) */}
        {isAdmin && (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
            {onEditGame && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGame(game);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0a1028]/90 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-950 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg text-[11px] font-semibold"
                title="Modifier l'affiche, les avis et les données de ce jeu"
              >
                <Edit className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Modifier</span>
              </button>
            )}

            {onDeleteGame && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Voulez-vous vraiment supprimer définitivement "${game.title}" de la bibliothèque ?`)) {
                    onDeleteGame(game.id);
                  }
                }}
                className="p-2 rounded-xl bg-black/70 text-red-400 border border-red-500/30 hover:bg-red-950/90 hover:text-red-200 transition-colors backdrop-blur-md cursor-pointer shadow-md"
                title="Supprimer ce jeu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Hover Quick Play Pill */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/90 text-slate-950 text-xs font-bold shadow-[0_0_20px_rgba(76,230,255,0.7)] transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Jouer</span>
          </div>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        
        {/* Unboxed Metadata Line with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <span className="font-semibold text-cyan-400/90">{game.category}</span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span>PC Port</span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="font-mono text-[11px] text-slate-500">{game.releaseYear}</span>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onOpenDetails(game)}
          className="text-base font-bold text-white tracking-tight cursor-pointer group-hover:text-cyan-300 transition-colors line-clamp-1"
        >
          {game.title}
        </h3>

        {/* Tagline */}
        <p className="mt-1 text-xs text-slate-300/70 line-clamp-2 flex-1">
          {game.tagline}
        </p>

        {/* Footer info: Rating, play count & Play action */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-mono text-amber-300/90">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold">{game.rating.toFixed(1)}</span>
            <span className="text-slate-500 font-normal">({(game.playCount).toLocaleString('fr-FR')})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenDetails(game)}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Détails
            </button>
            <button
              type="button"
              onClick={() => onPlay(game)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 hover:border-purple-400 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Lancer</span>
            </button>
          </div>
        </div>

      </div>

    </article>
  );
};
