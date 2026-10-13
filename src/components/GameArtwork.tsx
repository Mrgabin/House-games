import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  Crosshair, 
  Plane, 
  Gauge, 
  Clock, 
  Cpu, 
  Sparkles, 
  Gamepad2, 
  LucideIcon 
} from 'lucide-react';

interface GameArtworkProps {
  title: string;
  category: string;
  coverGradient?: string;
  coverPattern?: string;
  coverIcon?: string;
  coverUrl?: string;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | 'square' | 'banner';
}

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldAlert,
  Zap,
  Crosshair,
  Plane,
  Gauge: Gamepad2, // Always render a sleek gamepad instead of a car speedometer
  Clock,
  Cpu,
  Sparkles,
  Gamepad2
};

// Global cache for resolved Pinterest URLs
const RESOLVED_CACHE = new Map<string, string>();

export const GameArtwork: React.FC<GameArtworkProps> = ({
  title,
  category,
  coverGradient = 'from-violet-950 via-purple-900 to-slate-950',
  coverPattern,
  coverIcon = 'Gamepad2',
  coverUrl,
  className = '',
  aspectRatio = '16:9'
}) => {
  const [imageError, setImageError] = useState(false);
  const [tryProxy, setTryProxy] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  
  // Only set initial URL if it's already a direct image
  const isDirectImage = Boolean(
    coverUrl && (coverUrl.includes('i.pinimg.com') || coverUrl.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i))
  );

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    isDirectImage ? coverUrl! : (coverUrl ? RESOLVED_CACHE.get(coverUrl) || null : null)
  );

  const IconComponent = ICON_MAP[coverIcon] || Gamepad2;

  useEffect(() => {
    setImageError(false);
    setTryProxy(false);

    if (!coverUrl) {
      setResolvedUrl(null);
      setIsResolving(false);
      return;
    }

    // Direct image URL
    if (coverUrl.includes('i.pinimg.com') || coverUrl.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i)) {
      setResolvedUrl(coverUrl);
      setIsResolving(false);
      return;
    }

    // Cache hit
    if (RESOLVED_CACHE.has(coverUrl)) {
      setResolvedUrl(RESOLVED_CACHE.get(coverUrl)!);
      setIsResolving(false);
      return;
    }

    // If it's a Pinterest page/pin URL, resolve via backend
    if (coverUrl.includes('pinterest.') || coverUrl.includes('pin.it')) {
      setIsResolving(true);
      fetch(`/api/resolve-pinterest?url=${encodeURIComponent(coverUrl)}`)
        .then(res => res.json())
        .then(data => {
          setIsResolving(false);
          if (data.imageUrl && data.imageUrl !== coverUrl) {
            RESOLVED_CACHE.set(coverUrl, data.imageUrl);
            setResolvedUrl(data.imageUrl);
          } else {
            // Try proxying if no direct match
            setResolvedUrl(`/api/proxy-image?url=${encodeURIComponent(coverUrl)}`);
          }
        })
        .catch(() => {
          setIsResolving(false);
          setResolvedUrl(`/api/proxy-image?url=${encodeURIComponent(coverUrl)}`);
        });
    } else {
      setResolvedUrl(coverUrl);
      setIsResolving(false);
    }
  }, [coverUrl]);

  const aspectClass = 
    aspectRatio === 'banner' ? 'w-full h-full' :
    aspectRatio === '16:9' ? 'aspect-video' :
    aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-square';

  const currentSrc = tryProxy && resolvedUrl && !resolvedUrl.startsWith('/api/')
    ? `/api/proxy-image?url=${encodeURIComponent(resolvedUrl)}`
    : resolvedUrl;

  const handleImgError = () => {
    if (!tryProxy && resolvedUrl && !resolvedUrl.startsWith('/api/')) {
      // Try backend proxy once before falling back
      setTryProxy(true);
    } else {
      setImageError(true);
    }
  };

  return (
    <div className={`relative w-full ${aspectClass} overflow-hidden bg-slate-950 ${className}`}>
      {/* 1. Loading shimmer while Pinterest URL is resolving */}
      {isResolving && !imageError ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <span className="mt-2 text-[10px] font-mono text-cyan-300/80 tracking-wider">
            Chargement de l'affiche Pinterest...
          </span>
        </div>
      ) : currentSrc && !imageError ? (
        /* 2. Real Poster Image - Fully stretched & fitted with object-cover */
        <img
          src={currentSrc}
          alt={`Affiche de ${title}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImgError}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        /* 3. Sleek Cyber Gaming Artwork Fallback (Never a car speedometer) */
        <div 
          className={`relative w-full h-full bg-gradient-to-br ${coverGradient} flex flex-col justify-between p-4 transition-transform duration-500 group-hover:scale-105`}
          style={{ backgroundImage: coverPattern }}
        >
          {/* Subtle Grid overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top category label */}
          <div className="relative z-10 flex items-center justify-between text-xs text-white/70">
            <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300/90 font-medium">
              {category}
            </span>
            <span className="font-mono text-[10px] text-white/40 font-mono">HOUSE GAME</span>
          </div>

          {/* Centered Thematic Vector Icon with cyber aura */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md shadow-[0_0_24px_rgba(177,116,255,0.25)] transition-transform duration-300 group-hover:scale-110">
              <IconComponent className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(76,230,255,0.6)]" />
            </div>
            <span className="mt-2 text-xs font-semibold text-white/90 text-center tracking-wide line-clamp-1">
              {title}
            </span>
          </div>

          {/* Bottom subtle bar */}
          <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>60 FPS</span>
            <span>PORT WEB PC</span>
          </div>

          {/* Bottom gradient contrast scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
};
