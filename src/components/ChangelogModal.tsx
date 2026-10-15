import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  Terminal, 
  ShieldCheck, 
  Save, 
  Layers, 
  ChevronRight,
  History,
  Rocket
} from 'lucide-react';
import { CHANGELOG_DATA, ChangelogItem } from '../data/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    const cats = ['Toutes'];
    CHANGELOG_DATA.forEach(item => {
      if (!cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    return cats;
  }, []);

  const filteredItems = useMemo(() => {
    return CHANGELOG_DATA.filter(item => {
      const matchCategory = selectedCategory === 'Toutes' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.title.toLowerCase().includes(q) ||
        item.version.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.details.some(d => d.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const getBadgeStyle = (badge: ChangelogItem['badge']) => {
    switch (badge) {
      case 'Majeur':
        return 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40';
      case 'Nouveau':
        return 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40';
      case 'Admin':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40';
      case 'Correctif':
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40';
      case 'Fondation':
        return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-white/10 text-slate-300 border-white/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#02040b]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl my-8 bg-[#070c1e] border border-cyan-500/20 rounded-2xl shadow-[0_0_50px_rgba(76,230,255,0.12)] overflow-hidden flex flex-col max-h-[88vh] z-10"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#070c1e] via-[#0d1633] to-[#070c1e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(76,230,255,0.2)]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-['Outfit'] tracking-wide">
                  Journal des Mises à Jour
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {CHANGELOG_DATA.length} versions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Historique chronologique complet de toutes les évolutions et fonctionnalités de House Game
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-white/10 bg-[#050917]/70 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(76,230,255,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une mise à jour..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
              <p className="text-sm">Aucune mise à jour ne correspond à votre recherche.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div 
                key={item.version} 
                className="relative pl-6 pb-6 last:pb-0 border-l border-cyan-500/20 group"
              >
                {/* Timeline Node */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#070c1e] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(76,230,255,0.8)] group-hover:scale-110 transition-transform">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                </div>

                {/* Card Container */}
                <div className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-500/30 rounded-xl p-4 transition-all">
                  
                  {/* Top Bar: Version, Badge & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-300">
                        {item.version}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(item.badge)}`}>
                        {item.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.date}
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-sm font-bold text-white font-['Outfit'] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-1.5 mb-3">
                    {item.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-[12px] text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Pro-Tip box if available */}
                  {item.tips && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2 text-[11px] text-cyan-200">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Astuce :</strong> {item.tips}</span>
                    </div>
                  )}

                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#050917] flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Dernière version : <strong>v1.7</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
