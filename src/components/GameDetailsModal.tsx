import React, { useState, useEffect, useRef } from 'react';
import { Game, DayPlaytimeBreakdown, User, GameSave } from '../types';
import { StorageService } from '../services/storage';
import { FirebaseService } from '../services/firebase';
import { idbSaves } from '../services/indexedDbSaves';
import { downloadSaveFile } from '../utils/download';
import { calculateLevelFromSeconds } from '../utils/level';
import { 
  X, 
  Play, 
  Heart, 
  Star, 
  Keyboard, 
  Trash2, 
  Edit, 
  Lock, 
  Copy, 
  Check, 
  Clock, 
  Database, 
  ShieldAlert, 
  BarChart2, 
  Calendar, 
  Flame,
  FolderDown,
  Download,
  Edit2,
  Upload
} from 'lucide-react';
import { GameArtwork } from './GameArtwork';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface GameDetailsModalProps {
  game: Game | null;
  currentUser?: User | null;
  isFavorite: boolean;
  isAdmin?: boolean;
  userPlaytimeSeconds?: number;
  userPlaytimeBreakdown?: DayPlaytimeBreakdown;
  onClose: () => void;
  onPlay: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onDeleteGame?: (gameId: string) => void;
  onEditGame?: (game: Game) => void;
  onCopyFirebaseId?: (id: string) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  currentUser,
  isFavorite,
  isAdmin = false,
  userPlaytimeSeconds = 0,
  userPlaytimeBreakdown,
  onClose,
  onPlay,
  onToggleFavorite,
  onDeleteGame,
  onEditGame,
  onCopyFirebaseId
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [editingSaveId, setEditingSaveId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [saveActionToast, setSaveActionToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and subscribe to saves for this game
  useEffect(() => {
    if (!game) return;

    const refreshSaves = () => {
      const localSaves = StorageService.getGameSaves(game.id, currentUser?.id);
      setSaves(localSaves);
    };

    refreshSaves();
    const unsubIdb = idbSaves.subscribe(refreshSaves);

    if (currentUser) {
      const unsub = FirebaseService.subscribeGameSaves(currentUser.id, game.id, (cloudSaves) => {
        setSaves(cloudSaves);
      });
      return () => {
        unsub();
        unsubIdb();
      };
    }

    return () => unsubIdb();
  }, [game?.id, currentUser?.id]);

  if (!game) return null;

  const handleDownloadSave = (save: GameSave) => {
    const fileDataToUse = save.fileData || idbSaves.getById(save.id)?.fileData;
    if (fileDataToUse) {
      downloadSaveFile(save.customName || save.fileName, fileDataToUse);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !game) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const fileData = evt.target?.result as string;
      if (fileData) {
        const fileName = file.name;
        const fileSize = file.size;
        const saveId = `save-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const newSaveData = {
          id: saveId,
          gameId: game.id,
          gameTitle: game.title,
          userId: currentUser?.id || 'guest',
          fileName,
          fileData,
          fileSize
        };

        const savedLocal = StorageService.saveGameSave(newSaveData);
        setSaves(prev => [savedLocal, ...prev.filter(s => s.id !== savedLocal.id)]);

        if (currentUser) {
          try {
            await FirebaseService.saveGameSave(newSaveData);
          } catch (err) {
            console.warn("Erreur sauvegarde cloud Firebase:", err);
          }
        }

        setSaveActionToast(`Sauvegarde "${fileName}" importée avec succès !`);
        setTimeout(() => setSaveActionToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartRename = (save: GameSave) => {
    setEditingSaveId(save.id);
    setEditNameInput(save.customName || save.fileName);
  };

  const handleSaveRename = async (saveId: string) => {
    if (!editNameInput.trim()) return;
    const newName = editNameInput.trim();
    StorageService.updateGameSaveName(saveId, newName);
    if (currentUser) {
      try {
        await FirebaseService.updateGameSaveName(currentUser.id, saveId, newName);
      } catch (e) {}
    }
    setSaves(prev => prev.map(s => s.id === saveId ? { ...s, fileName: newName, customName: newName } : s));
    setEditingSaveId(null);
    setSaveActionToast(`Sauvegarde renommée : "${newName}"`);
    setTimeout(() => setSaveActionToast(null), 3000);
  };

  const executeDeleteSave = async (save: GameSave) => {
    StorageService.deleteGameSave(save.id, save.fileName, save.gameId);
    if (currentUser) {
      try {
        await FirebaseService.deleteGameSave(currentUser.id, save.id);
      } catch (e) {}
    }
    setSaves(prev => prev.filter(s => s.id !== save.id && s.fileName !== save.fileName));
    setSaveActionToast(`Sauvegarde "${save.customName || save.fileName}" supprimée avec succès !`);
    setTimeout(() => setSaveActionToast(null), 3000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(game.id).then(() => {
      setCopiedId(true);
      if (onCopyFirebaseId) {
        onCopyFirebaseId(game.id);
      }
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const formatPlaytime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m} min`;
    return `${sec} secondes`;
  };

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

          {/* Dark Cinematic Cyber Scrim Overlay */}
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

          {/* Private Mode Banner Indicator */}
          {game.isPrivate && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 text-xs font-bold shadow-lg backdrop-blur-md">
              <Lock className="w-3.5 h-3.5" />
              <span>Mode Privé (Visible uniquement par l'Admin)</span>
            </div>
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
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 flex-wrap">
                <span className="font-semibold uppercase tracking-wider text-purple-300">{game.category}</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-slate-400">{game.performanceBadge}</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-slate-400 font-mono">{game.releaseYear}</span>
                {game.isPrivate && (
                  <>
                    <span aria-hidden="true" className="text-white/20">·</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Test Admin Privé
                    </span>
                  </>
                )}
              </div>

              {/* Favorite Button */}
              <button
                type="button"
                onClick={() => onToggleFavorite(game.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
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

          {/* Personal Playtime Card (If User logged in and played) */}
          {userPlaytimeSeconds > 0 && (() => {
            const levelInfo = calculateLevelFromSeconds(userPlaytimeSeconds);
            return (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Votre temps de jeu sur ce titre</p>
                      <p className="text-[11px] text-slate-400">Enregistré et synchronisé avec votre compte</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-cyan-300 tabular-nums block">
                      {formatPlaytime(userPlaytimeSeconds)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {levelInfo.totalXp} XP gagnés
                    </span>
                  </div>
                </div>

                {/* Specific Game Level Banner */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-purple-300">
                      Niveau {levelInfo.level} sur ce jeu
                    </span>
                    <span className="text-slate-400">
                      {levelInfo.xpInLevel} / 10 XP vers Niveau {levelInfo.level + 1}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, levelInfo.progressPercent)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block">
                    Règle ONL : 30 min de jeu = 1 XP • 10 XP = 1 Niveau
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Recharts Real Playtime Analytics Visualization */}
          {(() => {
            const daysOrder: (keyof DayPlaytimeBreakdown)[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            const fullDayLabels: Record<keyof DayPlaytimeBreakdown, string> = {
              Lun: 'Lundi',
              Mar: 'Mardi',
              Mer: 'Mercredi',
              Jeu: 'Jeudi',
              Ven: 'Vendredi',
              Sam: 'Samedi',
              Dim: 'Dimanche'
            };

            const chartData = daysOrder.map(day => {
              const sec = userPlaytimeBreakdown ? (userPlaytimeBreakdown[day] || 0) : 0;
              const hours = Math.round((sec / 3600) * 100) / 100;
              return {
                day,
                fullName: fullDayLabels[day],
                heures: hours,
                seconds: sec
              };
            });

            const totalWeeklySeconds = chartData.reduce((acc, curr) => acc + curr.seconds, 0);
            const mostActiveDay = [...chartData].sort((a, b) => b.seconds - a.seconds)[0];

            return (
              <div className="rounded-xl border border-cyan-500/30 bg-[#040817] p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <span>Statistiques Réelles de Temps de Jeu (Cette Semaine)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Données Réelles Enregistrées
                  </span>
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Total Semaine</span>
                    <span className="font-bold text-white text-xs">
                      {totalWeeklySeconds > 0 ? formatPlaytime(totalWeeklySeconds) : '0 min'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Jour le plus actif</span>
                    <span className="font-bold text-cyan-300 text-xs truncate block">
                      {mostActiveDay && mostActiveDay.seconds > 0 ? `${mostActiveDay.fullName}` : 'Aucun'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Moyenne / jour</span>
                    <span className="font-bold text-purple-300 text-xs">
                      {totalWeeklySeconds > 0 ? formatPlaytime(Math.round(totalWeeklySeconds / 7)) : '0 min'}
                    </span>
                  </div>
                </div>

                <div className="h-36 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#070c1e', borderColor: '#4ce6ff', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        formatter={(val: any, name: any, item: any) => [
                          item?.payload?.seconds > 0 ? formatPlaytime(item.payload.seconds) : '0 minute',
                          'Temps joué'
                        ]}
                        labelFormatter={(label: any) => {
                          const found = chartData.find(c => c.day === label);
                          return found ? found.fullName : label;
                        }}
                      />
                      <Bar dataKey="heures" fill="#4ce6ff" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.seconds === mostActiveDay?.seconds && entry.seconds > 0 ? '#4ce6ff' : (entry.seconds > 0 ? '#a855f7' : '#1e293b')} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {totalWeeklySeconds === 0 && (
                  <p className="text-[11px] text-slate-400 text-center font-mono">
                    Lancez une partie pour enregistrer vos vraies sessions de jeu en direct !
                  </p>
                )}
              </div>
            );
          })()}

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

          {/* Saved Games Management Section */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider">
                <FolderDown className="w-4 h-4 text-cyan-400" />
                <span>Sauvegardes du jeu ({saves.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  {currentUser ? `Profil : ${currentUser.username}` : 'Stockage Local'}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                  title="Importer un fichier de sauvegarde depuis votre PC"
                >
                  <Upload className="w-3 h-3" />
                  <span>Importer</span>
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleManualUpload} 
                />
              </div>
            </div>

            {saveActionToast && (
              <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>{saveActionToast}</span>
              </div>
            )}

            {saves.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-1">
                Aucune sauvegarde enregistrée pour ce jeu. Vos fichiers de progression apparaîtront ici dès que vous sauvegarderez en jeu ou importerez un fichier.
              </p>
            ) : (
              <div className="space-y-2">
                {saves.map(save => {
                  const sizeLabel = save.fileSize > 1024 * 1024 
                    ? `${(save.fileSize / (1024 * 1024)).toFixed(2)} Mo`
                    : `${(save.fileSize / 1024).toFixed(1)} Ko`;
                  const dateFormatted = new Date(save.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <div key={save.id} className="p-3 rounded-xl bg-[#070c1e] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {editingSaveId === save.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(save.id);
                              if (e.key === 'Escape') setEditingSaveId(null);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-cyan-400 text-white text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(save.id)}
                            className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSaveId(null)}
                            className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">
                            {save.customName || save.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{dateFormatted}</span>
                            <span>·</span>
                            <span className="text-cyan-400">{sizeLabel}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartRename(save)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-xs transition-colors cursor-pointer"
                          title="Renommer la sauvegarde"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Renommer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSave(save)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium border border-cyan-400/30 transition-all cursor-pointer"
                          title="Télécharger le fichier"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => executeDeleteSave(save)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
                          title="Supprimer cette sauvegarde"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <span className="text-slate-400 block text-[11px]">Mode de lancement</span>
              <span className="font-semibold text-emerald-400 block mt-0.5 truncate">
                {game.embedCode?.trim() ? 'Balise HTML Source' : 'URL Web Playable'}
              </span>
            </div>
          </div>

          {/* Admin Dedicated Firebase ID Box (ADMIN ONLY) */}
          {isAdmin && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Database className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-[11px] text-purple-300 font-semibold block">
                    Identifiant Firebase Firestore (Document ID) :
                  </span>
                  <span className="font-mono text-slate-300 text-xs truncate block select-all">
                    {game.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                title="Copier l'identifiant pour le retrouver dans la console Firebase"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier ID</span>
                  </>
                )}
              </button>
            </div>
          )}

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
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlay(game);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(160,88,255,0.4)] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Jouer maintenant</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
