import React from 'react';
import { Game } from '../types';
import { Play, Info, Heart, Star, Flame } from 'lucide-react';
import { GameArtwork } from './GameArtwork';

interface HeroSpotlightProps {
  game: Game;
  isFavorite: boolean;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  game,
  isFavorite,
  onPlay,
  onOpenDetails,
  onToggleFavorite
}) => {
  return (
    <section className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-[#070c1e]/80 to-[#030612]/90 backdrop-blur-xl overflow-hidden shadow-2xl p-6 sm:p-8 lg:p-10 mb-10">
      
      {/* Background ambient glow */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(177, 116, 255, 0.8) 0%, rgba(76, 230, 255, 0.4) 50%, transparent 70%)' }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Text & CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
          
          {/* Quiet Unboxed Metadata kicker */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-purple-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Jeu du Moment
            </span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span>{game.category}</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-slate-400">{game.performanceBadge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-['Outfit'] font-bold tracking-tight text-white text-balance leading-[1.1]">
            {game.title}
          </h1>

          {/* Subtitle / Tagline */}
          <p className="text-base text-cyan-200/90 font-medium">
            {game.tagline}
          </p>

          {/* Description */}
          <p className="text-sm text-slate-300/80 leading-relaxed max-w-xl">
            {game.description}
          </p>

          {/* Rating & Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{game.rating.toFixed(1)} / 5.0</span>
            </div>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span>{(game.playCount).toLocaleString('fr-FR')} parties jouées</span>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span>Par {game.studio}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => onPlay(game)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-300 hover:from-cyan-300 hover:to-teal-200 rounded-xl transition-all shadow-[0_0_24px_rgba(76,230,255,0.4)] hover:shadow-[0_0_32px_rgba(76,230,255,0.6)] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jouer maintenant</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDetails(game)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-purple-400" />
              <span>Détails & Commandes</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(game.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-rose-300 hover:bg-white/10'
              }`}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

        </div>

        {/* Right Column: Hero Artwork */}
        <div className="lg:col-span-5 relative group">
          <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-[0_0_40px_rgba(177,116,255,0.15)] group-hover:border-purple-500/50 transition-all duration-300">
            <GameArtwork
              title={game.title}
              category={game.category}
              coverGradient={game.coverGradient}
              coverPattern={game.coverPattern}
              coverIcon={game.coverIcon}
              coverUrl={game.coverUrl}
              aspectRatio="16:9"
              className="w-full h-full"
            />

            {/* Overlay quick play trigger */}
            <div 
              onClick={() => onPlay(game)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-xs"
            >
              <div className="p-4 rounded-full bg-cyan-400/90 text-slate-950 shadow-[0_0_20px_rgba(76,230,255,0.8)] transform scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};
