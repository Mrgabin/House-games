import React, { useState, useEffect, useMemo } from 'react';
import { Game, GameCategory, User, ActiveView } from './types';
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
import { 
  Search, 
  Heart, 
  Gamepad2, 
  Sparkles, 
  Shield, 
  PlusCircle, 
  SlidersHorizontal,
  Flame,
  Database
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

  // Modals state
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<Game | null>(null);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(true);

  // Subscribe to real-time Firebase Firestore updates on mount
  useEffect(() => {
    // 1. Restore local session
    const localUser = StorageService.getCurrentUser();
    if (localUser) {
      setCurrentUser(localUser);
    }
    const favs = StorageService.getFavorites();
    setFavorites(favs);

    // 2. Real-time Firebase Auth listener (detects Google signed-in users automatically)
    const unsubscribeAuth = FirebaseService.subscribeAuthState((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
      }
    });

    // 3. Real-time Firestore synchronization on 'games' collection
    // Any change or deletion made directly in Firebase instantly updates the UI!
    const unsubscribeGames = FirebaseService.subscribeGames((liveGames) => {
      setGames(liveGames);
      setIsFirebaseSyncing(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeGames();
    };
  }, []);

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

  // Handlers for Admin Games Management (writes directly to Firebase Firestore)
  const handleAddGame = async (newGameData: any) => {
    try {
      showToast('Enregistrement dans Firebase Firestore...');
      await FirebaseService.addGame(newGameData);
      showToast(`"${newGameData.title}" enregistré dans Firebase avec succès !`);
    } catch (e) {
      console.error('Erreur ajout Firebase:', e);
      // Fallback local
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
    // Keep empty as requested
    showToast('La bibliothèque est synchronisée avec Firebase.');
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
    if (games.length === 0) return null;
    return games.find(g => g.isFeatured) || games[0];
  }, [games]);

  // Filtered & Sorted Games List
  const displayGames = useMemo(() => {
    let result = [...games];

    // Favorites View Filter
    if (activeView === 'favorites') {
      result = result.filter(g => favorites.includes(g.id));
    }

    // Category Filter
    if (selectedCategory !== 'Tous') {
      result = result.filter(g => g.category === selectedCategory);
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (sortBy === 'popular') {
      result.sort((a, b) => b.playCount - a.playCount);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [games, activeView, favorites, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      
      {/* 3D WebGL Spatial Vesper Planet Background (Clean, permanently Vesper, zero floating widgets) */}
      <CelestialBackground />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <aside 
          aria-live="polite"
          className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#0a1028]/90 border border-purple-500/40 text-purple-200 text-xs font-medium shadow-[0_0_24px_rgba(160,88,255,0.4)] backdrop-blur-md flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </aside>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        favoritesCount={favorites.length}
        onSelectView={(view) => setActiveView(view)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
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
              <span>HOUSE GAME</span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-400" />
                Firebase Synchro Temps Réel
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
              {activeView === 'favorites' ? 'Mes Jeux Favoris' : 'Bibliothèque House Game'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeView === 'favorites'
                ? `${displayGames.length} jeu${displayGames.length > 1 ? 'x' : ''} sauvegardé${displayGames.length > 1 ? 's' : ''}`
                : 'Les jeux ajoutés dans Firebase apparaissent instantanément ici.'}
            </p>
          </div>

          {/* Quick Admin Action if elevated */}
          {currentUser?.isAdmin && (
            <div className="flex items-center gap-2 self-start md:self-auto">
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

        {/* Interactive Filter Bar & Search (only shown if games exist or search is active) */}
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

        {/* Holographic Game Cards Grid */}
        {displayGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite={favorites.includes(game.id)}
                isAdmin={currentUser?.isAdmin}
                onPlay={(g) => setPlayingGame(g)}
                onOpenDetails={(g) => setSelectedGameForDetails(g)}
                onToggleFavorite={handleToggleFavorite}
                onDeleteGame={handleDeleteGame}
                onEditGame={currentUser?.isAdmin ? handleEditGame : undefined}
              />
            ))}
          </div>
        ) : (
          /* Empty State when no games in Firebase */
          <div className="text-center py-20 px-6 rounded-2xl border border-white/10 bg-[#070c1e]/65 backdrop-blur-xl max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-white/15 flex items-center justify-center text-cyan-300 shadow-[0_0_24px_rgba(76,230,255,0.25)]">
              {activeView === 'favorites' ? (
                <Heart className="w-7 h-7 text-rose-400/80" />
              ) : (
                <Gamepad2 className="w-7 h-7 text-cyan-300" />
              )}
            </div>

            <h3 className="text-lg font-bold text-white font-['Outfit']">
              {activeView === 'favorites' ? 'Aucun favori pour le moment' : 'Bibliothèque House Game prête'}
            </h3>

            <p className="text-xs text-slate-300/80 mt-2 leading-relaxed max-w-md mx-auto">
              {activeView === 'favorites'
                ? 'Vos jeux favoris sauvegardés apparaîtront ici.'
                : 'La bibliothèque est connectée en direct à Firebase Firestore. Vous pouvez ajouter vos jeux directement depuis Firebase ou via la Console Admin ci-dessous.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser?.isAdmin) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsAdminModalOpen(true);
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

      {/* Clean Footer (Clutter free) */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#02030a]/80 backdrop-blur-md mt-20 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(76,230,255,0.8)]" />
            <span className="font-['Outfit'] font-bold text-slate-200">House Game</span>
            <span className="text-slate-600">·</span>
            <span>Bibliothèque de jeux Web</span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Firebase Firestore Synchronisé
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Game Details Modal */}
      <GameDetailsModal
        game={selectedGameForDetails}
        isFavorite={selectedGameForDetails ? favorites.includes(selectedGameForDetails.id) : false}
        isAdmin={currentUser?.isAdmin}
        onClose={() => setSelectedGameForDetails(null)}
        onPlay={(game) => setPlayingGame(game)}
        onToggleFavorite={handleToggleFavorite}
        onDeleteGame={handleDeleteGame}
        onEditGame={currentUser?.isAdmin ? handleEditGame : undefined}
      />

      {/* 2. Playable Game Web Player */}
      <PlayablePlayerModal
        game={playingGame}
        onClose={() => setPlayingGame(null)}
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

    </div>
  );
}
