import React, { useState, useRef, useEffect } from 'react';
import { UserStatus, StatusPreference } from '../types';
import { Check, ChevronDown, Sparkles, Activity, Shield } from 'lucide-react';

interface StatusDropdownProps {
  currentStatus: UserStatus;
  statusPreference?: StatusPreference;
  currentGameTitle?: string;
  onSelectStatus: (status: UserStatus, preference: StatusPreference) => void;
  className?: string;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  statusPreference = 'auto',
  currentGameTitle,
  onSelectStatus,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusDot = (st: UserStatus) => {
    switch (st) {
      case 'in-game':
        return <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(76,230,255,0.9)]" />;
      case 'online':
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />;
      case 'away':
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />;
      case 'dnd':
        return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] flex items-center justify-center"><span className="w-1.5 h-0.5 bg-white rounded-full"></span></span>;
      case 'offline':
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />;
    }
  };

  const getStatusLabel = () => {
    if (currentStatus === 'in-game' && currentGameTitle) {
      return `En jeu : ${currentGameTitle}`;
    }
    switch (currentStatus) {
      case 'online':
        return statusPreference === 'auto' ? 'En ligne (Auto)' : 'En ligne';
      case 'away':
        return statusPreference === 'auto' ? 'Inactif (Auto)' : 'Inactif';
      case 'dnd':
        return 'Ne pas déranger';
      case 'offline':
        return 'Invisible';
      case 'in-game':
        return 'En session de jeu';
      default:
        return 'En ligne';
    }
  };

  const options: {
    status: UserStatus;
    pref: StatusPreference;
    title: string;
    desc: string;
    dotColor: string;
  }[] = [
    {
      status: 'online',
      pref: 'online',
      title: 'En ligne',
      desc: 'Visible pour tous les membres de la communauté',
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
    },
    {
      status: 'away',
      pref: 'away',
      title: 'Inactif / Absent',
      desc: 'Signale que vous êtes éloigné de votre écran',
      dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
    },
    {
      status: 'dnd',
      pref: 'dnd',
      title: 'Ne pas déranger',
      desc: 'Occupé ou concentré sur une session',
      dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
    },
    {
      status: 'offline',
      pref: 'offline',
      title: 'Invisible (Hors-ligne)',
      desc: 'Vous apparaissez hors-ligne mais pouvez continuer à jouer',
      dotColor: 'bg-slate-500'
    },
    {
      status: currentStatus === 'in-game' ? 'in-game' : 'online',
      pref: 'auto',
      title: 'Automatique (Style Discord)',
      desc: 'Détecte l\'activité, le jeu lancé et l\'inactivité après 2min30',
      dotColor: 'bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse'
    }
  ];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-all cursor-pointer group shadow-sm"
        title="Modifier mon statut de présence (En ligne, Inactif, Invisible ou Auto)"
      >
        {getStatusDot(currentStatus)}
        <span className="text-[11px] font-medium text-slate-300 truncate max-w-[120px] group-hover:text-white">
          {getStatusLabel()}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-white/15 bg-[#070c1e]/95 backdrop-blur-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10 flex items-center justify-between">
            <span>Statut de présence</span>
            <span className="text-cyan-400">ONL Network</span>
          </div>

          {options.map((opt) => {
            const isSelected = statusPreference === opt.pref;
            return (
              <button
                key={opt.pref}
                type="button"
                onClick={() => {
                  onSelectStatus(opt.status, opt.pref);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-cyan-500/15 border border-cyan-400/30' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={`w-3 h-3 rounded-full shrink-0 mt-1 ${opt.dotColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">{opt.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
