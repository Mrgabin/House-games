import React, { useState, useEffect, useMemo } from 'react';
import { Game, GameCategory, User, ActiveView, DayPlaytimeBreakdown } from './types';
import { StorageService } from './services/storage';
import { FirebaseService } from './services/firebase';
import { CelestialBackground } from './components/CelestialBackground';
import { Navbar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { GameCard } from './components/GameCard';
import { GameDetailsModal } from './components/GameDetailsModal';
import { PlayablePlayerModal } from './components/PlayablePlayerModal';
import { AuthModal } from './components/AuthModal';
import { AdminModal } from './components/AdminModal';
import { ChangelogModal } from './components/ChangelogModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { FriendsModal } from './components/FriendsModal';
import { PublicProfileModal } from './components/PublicProfileModal';
import { calculateGlobalLevel } from './utils/level';
import { 
  Search, 
  Heart, 
  Gamepad2, 
  Sparkles, 
  Shield, 
  PlusCircle, 
  SlidersHorizontal,
  Flame,
  Database,
  Lock,
  Unlock,
  Clock,
  Users
} from 'lucide-react';

const CATEGORIES: GameCategory[] = [
  'Tous',
  'Action',
  'Course',
  'Cyberpunk',
  'Survie',
  'Arcade',
  'Stratégie'
];

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('catalog');
  
  // Filters and Search
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('recent');
  const [adminVisibilityFilter, setAdminVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');

  // Modals state
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<Game | null>(null);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(true);

  // Playtimes & Real Weekly Breakdowns state
  const [userPlaytimes, setUserPlaytimes] = useState<Record<string, number>>({});
  const [userPlaytimeBreakdowns, setUserPlaytimeBreakdowns] = useState<Record<string, DayPlaytimeBreakdown>>({});
  const [viewingProfilePlaytimes, setViewingProfilePlaytimes] = useState<Record<string, number>>({});

  // Dynamic Global ONL Level (30 min = 1 XP, 10 XP = 1 Niveau)
  const currentUserLevelInfo = useMemo(() => calculateGlobalLevel(userPlaytimes), [userPlaytimes]);

  // Support direct profile links: ?profile=userId or ?user=userId
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const profileId = params.get('profile') || params.get('user');
      if (profileId) {
        const localUsers = StorageService.getUsers();
        const found = localUsers.find(
          u => u.id === profileId || u.username.toLowerCase() === profileId.toLowerCase()
        );
        if (found) {
          setViewingProfileUser(found);
        } else {
          FirebaseService.getUserProfile(profileId).then(fbUser => {
            if (fbUser) setViewingProfileUser(fbUser);
          });
        }
      }
    } catch (e) {
      console.warn("Erreur lecture URL profile param:", e);
    }
  }, []);

  // Fetch or sync playtimes for whichever user is being viewed in PublicProfileModal
  useEffect(() => {
    if (!viewingProfileUser) {
      setViewingProfilePlaytimes({});
      return;
    }

    if (currentUser && viewingProfileUser.id === currentUser.id) {
      setViewingProfilePlaytimes(userPlaytimes);
      return;
    }

    // Load initial local playtimes for target user
    const localMap = StorageService.getUserPlaytimes(viewingProfileUser.id);
    setViewingProfilePlaytimes(localMap);

    let active = true;
    // Fetch live from Firestore
    FirebaseService.getUserPlaytimes(viewingProfileUser.id).then((fbMap) => {
      if (active && fbMap && Object.keys(fbMap).length > 0) {
        setViewingProfilePlaytimes(fbMap);
      }
    });

    return () => {
      active = false;
    };
  }, [viewingProfileUser?.id, currentUser?.id, userPlaytimes]);

  // Subscribe to real-time Firebase Firestore updates on mount
  useEffect(() => {
    // 1. Restore local session
    const localUser = StorageService.getCurrentUser();
    if (localUser) {
      setCurrentUser(localUser);
    }
    const favs = StorageService.getFavorites();
    setFavorites(favs);

    // 2. Real-time Firebase Auth listener
    const unsubscribeAuth = FirebaseService.subscribeAuthState((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
      }
    });

    // 3. Real-time Firestore synchronization on 'games' collection
    const unsubscribeGames = FirebaseService.subscribeGames((liveGames) => {
      setGames(liveGames);
      setIsFirebaseSyncing(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeGames();
    };
  }, []);

  // Sync user playtimes and real day breakdown whenever user logs in or games change
  useEffect(() => {
    if (currentUser) {
      const local = StorageService.getUserPlaytimes(currentUser.id);
      setUserPlaytimes(local);

      // Load initial breakdown from local
      const breakdownMap: Record<string, DayPlaytimeBreakdown> = {};
      games.forEach(g => {
        breakdownMap[g.id] = StorageService.getUserPlaytimeRecord(currentUser.id, g.id).dayBreakdown;
      });
      setUserPlaytimeBreakdowns(breakdownMap);

      const unsub = FirebaseService.subscribeUserPlaytimes(currentUser.id, (map, fbBreakdowns) => {
        setUserPlaytimes(prev => ({ ...prev, ...map }));
        if (fbBreakdowns) {
          setUserPlaytimeBreakdowns(prev => ({ ...prev, ...fbBreakdowns }));
        }
      });
      return () => unsub();
    } else {
      setUserPlaytimes({});
      setUserPlaytimeBreakdowns({});
    }
  }, [currentUser?.id, games.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Handlers for Favorites
  const handleToggleFavorite = (gameId: string) => {
    const result = StorageService.toggleFavorite(gameId);
    setFavorites(result.favorites);

    const game = games.find(g => g.id === gameId);
    const title = game ? game.title : 'Jeu';
    showToast(result.isFavorite ? `"${title}" ajouté à vos favoris !` : `"${title}" retiré des favoris.`);

    if (currentUser) {
      FirebaseService.syncUserProfile({
        ...currentUser,
        favorites: result.favorites
      });
    }
  };

  // Profile Settings Handler
  const handleSaveProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = StorageService.updateUserProfile(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
    }
    try {
      await FirebaseService.updateUserProfile(currentUser.id, updates);
      showToast("Profil ONL mis à jour avec succès !");
    } catch (e) {
      console.warn("Erreur mise à jour profil Firebase:", e);
      showToast("Profil mis à jour.");
    }
  };

  // Handlers for Admin Games Management (writes directly to Firebase Firestore)
  const handleAddGame = async (newGameData: any) => {
    try {
      showToast('Enregistrement dans Firebase Firestore...');
      await FirebaseService.addGame(newGameData);
      showToast(`"${newGameData.title}" enregistré dans Firebase avec succès !`);
    } catch (e) {
      console.error('Erreur ajout Firebase:', e);
      const created = StorageService.addGame(newGameData);
      setGames(prev => [created, ...prev]);
      showToast(`"${created.title}" ajouté.`);
    }
  };

  const handleEditGame = (game: Game) => {
    setGameToEdit(game);
    setIsAdminModalOpen(true);
  };

  const handleUpdateGame = async (gameId: string, updatedData: Partial<Game>) => {
    try {
      showToast('Enregistrement en temps réel dans Firebase...');
      await FirebaseService.updateGame(gameId, updatedData);
      showToast(`"${updatedData.title || 'Jeu'}" mis à jour en direct !`);
      if (selectedGameForDetails && selectedGameForDetails.id === gameId) {
        setSelectedGameForDetails(prev => prev ? { ...prev, ...updatedData } as Game : null);
      }
    } catch (e) {
      console.error('Erreur mise à jour Firebase:', e);
      StorageService.updateGame(gameId, updatedData);
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, ...updatedData } as Game : g));
      showToast('Modifications enregistrées localement.');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    const gameToDelete = games.find(g => g.id === gameId);
    try {
      await FirebaseService.deleteGame(gameId);
      showToast(`"${gameToDelete?.title || 'Jeu'}" supprimé de Firebase.`);
    } catch (e) {
      console.error('Erreur suppression Firebase:', e);
      StorageService.deleteGame(gameId);
      setGames(prev => prev.filter(g => g.id !== gameId));
    }

    setFavorites(prev => prev.filter(id => id !== gameId));
    if (selectedGameForDetails?.id === gameId) {
      setSelectedGameForDetails(null);
    }
    if (playingGame?.id === gameId) {
      setPlayingGame(null);
    }
  };

  const handleResetDefaults = () => {
    showToast('La bibliothèque est synchronisée avec Firebase.');
  };

  // Handler for playtime recording with real weekly breakdown
  const handleRecordPlaytime = async (gameId: string, additionalSeconds: number) => {
    if (!currentUser || additionalSeconds <= 0) return;
    const { totalSeconds, dayBreakdown } = StorageService.recordPlaytime(currentUser.id, gameId, additionalSeconds);
    setUserPlaytimes(prev => ({ ...prev, [gameId]: totalSeconds }));
    setUserPlaytimeBreakdowns(prev => ({ ...prev, [gameId]: dayBreakdown }));
    try {
      await FirebaseService.recordPlaytime(currentUser.id, gameId, additionalSeconds);
    } catch (e) {
      console.warn("Erreur enregistrement temps de jeu Firebase:", e);
    }
  };

  const handleCopyFirebaseId = (id: string) => {
    showToast(`ID Firebase copié : ${id}`);
  };

  // Handlers for Auth
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setFavorites(user.favorites);
    FirebaseService.syncUserProfile(user);
    showToast(`Connecté en tant que ${user.username} ${user.isAdmin ? '(Admin)' : ''}`);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setFavorites(StorageService.getFavorites());
    if (activeView === 'admin') {
      setActiveView('catalog');
    }
    showToast('Vous avez été déconnecté.');
  };

  // Featured Game for the Hero Spotlight
  const featuredGame = useMemo(() => {
    const visibleGames = currentUser?.isAdmin ? games : games.filter(g => !g.isPrivate);
    if (visibleGames.length === 0) return null;
    return visibleGames.find(g => g.isFeatured) || visibleGames[0];
  }, [games, currentUser?.isAdmin]);

  // Filtered & Sorted Games List
  const displayGames = useMemo(() => {
    let result = [...games];

    // Privacy Filter: Non-admins never see private test games
    if (!currentUser?.isAdmin) {
      result = result.filter(g => !g.isPrivate);
    } else {
      if (adminVisibilityFilter === 'public') {
        result = result.filter(g => !g.isPrivate);
      } else if (adminVisibilityFilter === 'private') {
        result = result.filter(g => g.isPrivate);
      }
    }

    // View filter
    if (activeView === 'favorites') {
      result = result.filter(g => favorites.includes(g.id));
    }

    // Category filter
    if (selectedCategory !== 'Tous') {
      result = result.filter(g => g.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.studio.toLowerCase().includes(q) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'popular') {
      result.sort((a, b) => b.playCount - a.playCount);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [games, activeView, favorites, selectedCategory, searchQuery, sortBy, currentUser?.isAdmin, adminVisibilityFilter]);

  return (
    <div className="relative min-h-screen bg-[#02030a] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-purple-500 selection:text-white">
      
      {/* Three.js Celestial Cyber Background */}
      <CelestialBackground />

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#08122c]/95 border border-cyan-400/40 text-cyan-200 text-xs font-semibold shadow-[0_0_25px_rgba(76,230,255,0.4)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar with ONL Friends & Profile */}
      <Navbar
        currentUser={currentUser}
        currentUserLevel={currentUserLevelInfo.level}
        activeView={activeView}
        favoritesCount={favorites.length}
        friendsCount={currentUser?.friends?.length || 0}
        onSelectView={(view) => setActiveView(view)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        onOpenProfile={() => {
          if (currentUser) setViewingProfileUser(currentUser);
          else setIsAuthModalOpen(true);
        }}
        onOpenProfileSettings={() => {
          if (currentUser) setIsProfileSettingsOpen(true);
          else setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main App Container - Clean Framing */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Hero Spotlight (shown in catalog view when games exist and no active search) */}
        {activeView === 'catalog' && !searchQuery && featuredGame && (
          <HeroSpotlight
            game={featuredGame}
            isFavorite={favorites.includes(featuredGame.id)}
            onPlay={(g) => setPlayingGame(g)}
            onOpenDetails={(g) => setSelectedGameForDetails(g)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Section Header & View Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>ONL NETWORK</span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-400" />
                Firebase Synchro Temps Réel
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
              {activeView === 'favorites' ? 'Mes Jeux Favoris' : 'Bibliothèque de Jeux ONL'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeView === 'favorites'
                ? `${displayGames.length} jeu${displayGames.length > 1 ? 'x' : ''} sauvegardé${displayGames.length > 1 ? 's' : ''}`
                : 'Tous les jeux et portages WebGL sont synchronisés en direct.'}
            </p>
          </div>

          {/* Quick Admin Action & Admin Test Mode Filter Strip */}
          {currentUser?.isAdmin && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-auto">
              
              {/* Admin Test Visibility Toggle */}
              <div className="flex items-center gap-1 p-1 bg-[#0a1028]/80 border border-purple-500/30 rounded-xl text-xs backdrop-blur-md">
                <span className="text-[10px] font-mono text-purple-300 px-2 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin :</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAdminVisibilityFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    adminVisibilityFilter === 'all'
                      ? 'bg-purple-600/50 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setAdminVisibilityFilter('public')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    adminVisibilityFilter === 'public'
                      ? 'bg-emerald-500/30 text-emerald-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Publics
                </button>
                <button
                  type="button"
                  onClick={() => setAdminVisibilityFilter('private')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    adminVisibilityFilter === 'private'
                      ? 'bg-amber-500/30 text-amber-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Privés ({games.filter(g => g.isPrivate).length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Ajouter un jeu</span>
              </button>
            </div>
          )}

        </div>

        {/* Interactive Filter Bar & Search */}
        {(games.length > 0 || searchQuery) && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-[#070c1e]/70 border border-white/10 backdrop-blur-md mb-8">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none" role="tablist">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/40 text-cyan-200 border border-cyan-400/40 shadow-[0_0_12px_rgba(76,230,255,0.2)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un jeu..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="recent" className="bg-[#070c1e] text-slate-200">Récents</option>
                  <option value="popular" className="bg-[#070c1e] text-slate-200">Populaires</option>
                  <option value="rating" className="bg-[#070c1e] text-slate-200">Mieux notés</option>
                </select>
              </div>
            </div>

          </div>
        )}

        {/* Game Cards Grid */}
        {displayGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite={favorites.includes(game.id)}
                isAdmin={currentUser?.isAdmin}
                userPlaytimeSeconds={currentUser ? (userPlaytimes[game.id] || 0) : 0}
                onPlay={(g) => setPlayingGame(g)}
                onOpenDetails={(g) => setSelectedGameForDetails(g)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border border-white/5 bg-[#050818]/60 p-8 space-y-4">
            <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              {activeView === 'favorites' ? 'Aucun favori pour le moment' : 'Aucun jeu correspondant'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeView === 'favorites'
                ? 'Cliquez sur le cœur d\'un jeu pour l\'ajouter à votre collection.'
                : 'Essayez de modifier votre recherche ou de sélectionner une autre catégorie.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.isAdmin) {
                    setIsAdminModalOpen(true);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(160,88,255,0.4)] transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{currentUser?.isAdmin ? 'Ajouter un jeu maintenant' : 'Accéder en tant qu\'Admin'}</span>
              </button>

              {activeView === 'favorites' && (
                <button
                  type="button"
                  onClick={() => setActiveView('catalog')}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Retour au catalogue
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#02030a]/80 backdrop-blur-md mt-20 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(76,230,255,0.8)]" />
            <span className="font-['Outfit'] font-bold text-slate-200">ONL</span>
            <span className="text-slate-600">·</span>
            <span>Plateforme de Jeux Web & Portages PC</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Mises à jour (v1.8)</span>
            </button>

            <span className="text-slate-600">·</span>

            <div className="text-[11px] text-slate-500 font-mono">
              Firebase Firestore Synchronisé
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Game Details Modal with Real Weekly Playtime Breakdown */}
      <GameDetailsModal
        game={selectedGameForDetails}
        currentUser={currentUser}
        isFavorite={selectedGameForDetails ? favorites.includes(selectedGameForDetails.id) : false}
        isAdmin={currentUser?.isAdmin}
        userPlaytimeSeconds={currentUser && selectedGameForDetails ? (userPlaytimes[selectedGameForDetails.id] || 0) : 0}
        userPlaytimeBreakdown={currentUser && selectedGameForDetails ? userPlaytimeBreakdowns[selectedGameForDetails.id] : undefined}
        onClose={() => setSelectedGameForDetails(null)}
        onPlay={(game) => setPlayingGame(game)}
        onToggleFavorite={handleToggleFavorite}
        onDeleteGame={handleDeleteGame}
        onEditGame={currentUser?.isAdmin ? handleEditGame : undefined}
        onCopyFirebaseId={handleCopyFirebaseId}
      />

      {/* 2. Playable Game Web Player with Rename & Delete Saves */}
      <PlayablePlayerModal
        game={playingGame}
        currentUser={currentUser}
        onClose={() => setPlayingGame(null)}
        onRecordPlaytime={handleRecordPlaytime}
      />

      {/* 3. Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 4. Admin Management Console */}
      <AdminModal
        isOpen={isAdminModalOpen}
        games={games}
        gameToEdit={gameToEdit}
        onClose={() => {
          setIsAdminModalOpen(false);
          setGameToEdit(null);
        }}
        onAddGame={handleAddGame}
        onUpdateGame={handleUpdateGame}
        onDeleteGame={handleDeleteGame}
        onResetDefaults={handleResetDefaults}
      />

      {/* 5. Changelog Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* 6. ONL Profile Settings Modal */}
      {currentUser && (
        <ProfileSettingsModal
          isOpen={isProfileSettingsOpen}
          currentUser={currentUser}
          games={games}
          playtimeSecondsMap={userPlaytimes}
          onClose={() => setIsProfileSettingsOpen(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}

      {/* 7. ONL Friends Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        currentUser={currentUser}
        games={games}
        onClose={() => setIsFriendsModalOpen(false)}
        onOpenUserProfile={(user) => setViewingProfileUser(user)}
        onFriendListUpdated={(user) => setCurrentUser(user)}
        onShowToast={showToast}
      />

      {/* 8. ONL Public Profile Modal with Showcase */}
      <PublicProfileModal
        isOpen={Boolean(viewingProfileUser)}
        user={viewingProfileUser}
        currentUser={currentUser}
        games={games}
        playtimeSecondsMap={viewingProfilePlaytimes}
        onClose={() => setViewingProfileUser(null)}
        onOpenSettings={() => {
          setViewingProfileUser(null);
          setIsProfileSettingsOpen(true);
        }}
        onPlayGame={(g) => {
          setViewingProfileUser(null);
          setPlayingGame(g);
        }}
        onOpenGameDetails={(g) => {
          setViewingProfileUser(null);
          setSelectedGameForDetails(g);
        }}
        onOpenCommunity={() => {
          setViewingProfileUser(null);
          setIsFriendsModalOpen(true);
        }}
        onShowToast={showToast}
        onAddFriend={async (targetUser) => {
          if (!currentUser) {
            showToast("Veuillez vous connecter pour ajouter des amis.");
            return;
          }
          const updated = StorageService.addFriend(currentUser.id, targetUser.id);
          if (updated) setCurrentUser(updated);
          try {
            await FirebaseService.updateUserProfile(currentUser.id, {
              friends: [...(currentUser.friends || []), targetUser.id]
            });
          } catch (e) {}
          showToast(`"${targetUser.username}" ajouté à vos amis !`);
        }}
      />

    </div>
  );
}
