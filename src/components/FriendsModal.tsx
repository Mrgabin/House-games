import React, { useState, useEffect } from 'react';
import { User, Game } from '../types';
import { 
  X, 
  Users, 
  UserPlus, 
  Search, 
  UserCheck, 
  Gamepad2, 
  ExternalLink, 
  Trash2, 
  Check, 
  Clock, 
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';
import { FirebaseService } from '../services/firebase';
import { StorageService } from '../services/storage';

interface FriendsModalProps {
  isOpen: boolean;
  currentUser: User | null;
  games: Game[];
  onClose: () => void;
  onOpenUserProfile: (user: User) => void;
  onFriendListUpdated: (updatedUser: User) => void;
  onShowToast: (msg: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  currentUser,
  games,
  onClose,
  onOpenUserProfile,
  onFriendListUpdated,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendsList, setFriendsList] = useState<User[]>([]);

  // Load and refresh friends details
  useEffect(() => {
    if (!currentUser) return;
    const allUsers = StorageService.getUsers();
    const myFriendIds = currentUser.friends || [];
    const loadedFriends = allUsers.filter(u => myFriendIds.includes(u.id));
    setFriendsList(loadedFriends);
  }, [currentUser?.friends]);

  // Handle Search in Firestore & Local storage
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // First try Firestore
        let results = await FirebaseService.searchUsers(searchQuery);
        if (results.length === 0) {
          // Fallback local storage
          results = StorageService.searchUsers(searchQuery);
        }
        // Exclude current user from search
        setSearchResults(results.filter(u => u.id !== currentUser?.id));
      } catch (e) {
        console.warn("Recherche joueurs erreur:", e);
        const local = StorageService.searchUsers(searchQuery);
        setSearchResults(local.filter(u => u.id !== currentUser?.id));
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  if (!isOpen) return null;

  const handleAddFriend = async (targetUser: User) => {
    if (!currentUser) {
      onShowToast("Veuillez vous connecter pour ajouter des amis.");
      return;
    }

    // 1. Local storage update
    const updatedUser = StorageService.addFriend(currentUser.id, targetUser.id);
    if (updatedUser) {
      onFriendListUpdated(updatedUser);
    }

    // 2. Firebase Firestore update
    try {
      const newFriends = [...(currentUser.friends || []), targetUser.id];
      await FirebaseService.updateUserProfile(currentUser.id, { friends: newFriends });
    } catch (e) {
      console.warn("Erreur ajout ami Firebase:", e);
    }

    // 3. Update local state
    setFriendsList(prev => [...prev.filter(f => f.id !== targetUser.id), targetUser]);
    onShowToast(`"${targetUser.username}" ajouté à votre liste d'amis !`);
  };

  const handleRemoveFriend = async (targetUserId: string, targetName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Retirer ${targetName} de votre liste d'amis ?`)) return;

    // 1. Local storage update
    const updatedUser = StorageService.removeFriend(currentUser.id, targetUserId);
    if (updatedUser) {
      onFriendListUpdated(updatedUser);
    }

    // 2. Firebase Firestore update
    try {
      const newFriends = (currentUser.friends || []).filter(id => id !== targetUserId);
      await FirebaseService.updateUserProfile(currentUser.id, { friends: newFriends });
    } catch (e) {
      console.warn("Erreur suppression ami Firebase:", e);
    }

    setFriendsList(prev => prev.filter(f => f.id !== targetUserId));
    onShowToast(`${targetName} a été retiré de votre liste d'amis.`);
  };

  const isAlreadyFriend = (userId: string) => {
    return (currentUser?.friends || []).includes(userId);
  };

  const getStatusBadge = (status?: string, currentGame?: string) => {
    if (currentGame) {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(76,230,255,0.8)]" />
          <span>En jeu : <span className="text-white">{currentGame}</span></span>
        </span>
      );
    }
    switch (status) {
      case 'in-game':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>En session de jeu</span>
          </span>
        );
      case 'online':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>En ligne</span>
          </span>
        );
      case 'away':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Absent</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Hors-ligne</span>
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#070c1e] text-slate-100 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#040816]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                Communauté & Liste d'Amis ONL
              </h2>
              <p className="text-xs text-slate-400">
                Suivez vos amis en ligne, découvrez à quoi ils jouent et ajoutez de nouveaux joueurs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-white/10 bg-black/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'friends'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mes Amis ({friendsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Chercher un joueur</span>
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            {friendsList.length === 0 ? (
              <div className="py-12 text-center space-y-3 text-slate-400">
                <Users className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-300">
                  Votre liste d'amis est vide
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Recherchez d'autres joueurs par leur pseudo pour les ajouter et voir leurs jeux préférés !
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold hover:bg-cyan-500/30 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Chercher des joueurs</span>
                </button>
              </div>
            ) : (
              friendsList.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-slate-900">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${friend.avatarBg || 'bg-cyan-600'} flex items-center justify-center font-bold text-white text-base uppercase`}>
                          {friend.username.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{friend.username}</span>
                        {friend.isAdmin && (
                          <span className="text-[9px] font-mono text-purple-300 px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {getStatusBadge(friend.status, friend.currentGameTitle)}
                      </div>
                      {friend.bio && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5 font-mono">
                          "{friend.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Friend actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenUserProfile(friend);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-cyan-300 font-medium transition-colors cursor-pointer"
                      title="Voir le profil et la vitrine de cet ami"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Voir Profil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Retirer de mes amis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Search Players */}
        {activeTab === 'search' && (
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par pseudo ou adresse email (ex: Gabin, Cyber, Neo)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="space-y-2.5">
              {isSearching ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Recherche en cours dans la base de données...
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Aucun joueur trouvé avec "{searchQuery}".
                </div>
              ) : (
                searchResults.map((user) => {
                  const alreadyFriend = isAlreadyFriend(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-slate-900">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full ${user.avatarBg || 'bg-cyan-600'} flex items-center justify-center font-bold text-white text-sm uppercase`}>
                              {user.username.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{user.username}</span>
                            {user.isAdmin && (
                              <span className="text-[9px] font-mono text-purple-300 px-1 py-0.2 rounded bg-purple-500/20">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenUserProfile(user);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 transition-colors cursor-pointer"
                        >
                          Profil
                        </button>

                        {alreadyFriend ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Déjà ami</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddFriend(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Ajouter</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
