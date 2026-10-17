import React, { useState, useEffect } from 'react';
import { User, Game } from '../types';
import { 
  X, 
  Users, 
  UserPlus, 
  Search, 
  UserCheck, 
  Gamepad2, 
  Trash2, 
  Check, 
  Clock, 
  Eye, 
  Sparkles, 
  Zap, 
  Compass,
  Bell,
  UserX,
  Send,
  Inbox
} from 'lucide-react';
import { FirebaseService } from '../services/firebase';
import { StorageService } from '../services/storage';
import { calculateGlobalLevel } from '../utils/level';

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
  const [activeTab, setActiveTab] = useState<'explore' | 'friends' | 'requests' | 'search'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [communityList, setCommunityList] = useState<User[]>([]);
  const [userPlaytimesCache, setUserPlaytimesCache] = useState<Record<string, Record<string, number>>>({});

  // Incoming and outgoing requests users
  const [incomingRequesters, setIncomingRequesters] = useState<User[]>([]);
  const [outgoingTargets, setOutgoingTargets] = useState<User[]>([]);

  // Load and refresh friends, community, and pending friend requests
  useEffect(() => {
    if (!isOpen) return;

    // 1. Load community users
    const localUsers = StorageService.getUsers();
    setCommunityList(localUsers);

    // 2. Fetch live users from Firestore
    FirebaseService.getAllCommunityUsers().then(fbUsers => {
      if (fbUsers.length > 0) {
        setCommunityList(fbUsers);
      }
    });

    // 3. Load friends & request relations for current user
    if (currentUser) {
      const myFriendIds = currentUser.friends || [];
      const loadedFriends = localUsers.filter(u => myFriendIds.includes(u.id));
      setFriendsList(loadedFriends);

      const incomingIds = currentUser.friendRequestsReceived || [];
      const loadedIncoming = localUsers.filter(u => incomingIds.includes(u.id));
      setIncomingRequesters(loadedIncoming);

      const outgoingIds = currentUser.friendRequestsSent || [];
      const loadedOutgoing = localUsers.filter(u => outgoingIds.includes(u.id));
      setOutgoingTargets(loadedOutgoing);
    }
  }, [
    isOpen, 
    currentUser?.friends, 
    currentUser?.friendRequestsReceived, 
    currentUser?.friendRequestsSent, 
    currentUser?.id
  ]);

  // Preload playtimes cache for displayed users so levels calculate instantly
  useEffect(() => {
    if (!isOpen) return;
    const cache: Record<string, Record<string, number>> = {};
    communityList.forEach(u => {
      cache[u.id] = StorageService.getUserPlaytimes(u.id);
    });
    setUserPlaytimesCache(cache);
  }, [isOpen, communityList.length]);

  // Handle Search in Firestore & Local storage
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let results = await FirebaseService.searchUsers(searchQuery);
        if (results.length === 0) {
          results = StorageService.searchUsers(searchQuery);
        }
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

  // SEND Friend Request (Does not auto-friend; target must validate)
  const handleSendFriendRequest = async (targetUser: User) => {
    if (!currentUser) {
      onShowToast("Veuillez vous connecter pour envoyer une demande d'ami.");
      return;
    }

    const res = StorageService.sendFriendRequest(currentUser.id, targetUser.id);
    if (res) {
      onFriendListUpdated(res.currentUser);
      setOutgoingTargets(prev => [...prev.filter(u => u.id !== targetUser.id), targetUser]);
    }

    try {
      await FirebaseService.sendFriendRequest(currentUser.id, targetUser.id);
    } catch (e) {
      console.warn("Erreur envoi demande d'ami Firebase:", e);
    }

    onShowToast(`Demande d'ami envoyée à ${targetUser.username} ! En attente de sa validation.`);
  };

  // ACCEPT Friend Request (Validate friend request)
  const handleAcceptFriendRequest = async (requesterUser: User) => {
    if (!currentUser) return;

    const res = StorageService.acceptFriendRequest(currentUser.id, requesterUser.id);
    if (res) {
      onFriendListUpdated(res.currentUser);
      setFriendsList(prev => [...prev.filter(f => f.id !== requesterUser.id), requesterUser]);
      setIncomingRequesters(prev => prev.filter(u => u.id !== requesterUser.id));
    }

    try {
      await FirebaseService.acceptFriendRequest(currentUser.id, requesterUser.id);
    } catch (e) {
      console.warn("Erreur acceptation ami Firebase:", e);
    }

    onShowToast(`Demande acceptée ! ${requesterUser.username} est désormais votre ami sur ONL.`);
  };

  // REJECT Friend Request
  const handleRejectFriendRequest = async (requesterUser: User) => {
    if (!currentUser) return;

    const updatedUser = StorageService.rejectFriendRequest(currentUser.id, requesterUser.id);
    if (updatedUser) {
      onFriendListUpdated(updatedUser);
      setIncomingRequesters(prev => prev.filter(u => u.id !== requesterUser.id));
    }

    try {
      await FirebaseService.rejectFriendRequest(currentUser.id, requesterUser.id);
    } catch (e) {
      console.warn("Erreur rejet ami Firebase:", e);
    }

    onShowToast(`Demande d'ami de ${requesterUser.username} refusée.`);
  };

  // CANCEL Sent Friend Request
  const handleCancelFriendRequest = async (targetUser: User) => {
    if (!currentUser) return;

    const updatedUser = StorageService.cancelFriendRequest(currentUser.id, targetUser.id);
    if (updatedUser) {
      onFriendListUpdated(updatedUser);
      setOutgoingTargets(prev => prev.filter(u => u.id !== targetUser.id));
    }

    try {
      await FirebaseService.cancelFriendRequest(currentUser.id, targetUser.id);
    } catch (e) {
      console.warn("Erreur annulation demande ami Firebase:", e);
    }

    onShowToast(`Demande d'ami pour ${targetUser.username} annulée.`);
  };

  // REMOVE Friend
  const handleRemoveFriend = async (targetUserId: string, targetName: string) => {
    if (!currentUser) return;

    const updatedUser = StorageService.removeFriend(currentUser.id, targetUserId);
    if (updatedUser) {
      onFriendListUpdated(updatedUser);
    }

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

  const hasSentRequestTo = (userId: string) => {
    return (currentUser?.friendRequestsSent || []).includes(userId);
  };

  const hasReceivedRequestFrom = (userId: string) => {
    return (currentUser?.friendRequestsReceived || []).includes(userId);
  };

  const getUserLevelInfo = (userId: string) => {
    const playtimes = userPlaytimesCache[userId] || StorageService.getUserPlaytimes(userId);
    return calculateGlobalLevel(playtimes);
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
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <span>En ligne</span>
          </span>
        );
      case 'away':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
            <span>Inactif / Absent</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Hors-ligne / Invisible</span>
          </span>
        );
    }
  };

  const incomingCount = (currentUser?.friendRequestsReceived || []).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#070c1e] text-slate-100 shadow-2xl overflow-hidden my-6"
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
                Communauté & Joueurs ONL
              </h2>
              <p className="text-xs text-slate-400">
                Gérez vos amis, validez les demandes d'amis et visitez les vitrines des joueurs
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

        {/* Tab Navigation with Dedicated "Demandes d'amis" Tab */}
        <div className="flex items-center border-b border-white/10 bg-black/40 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'explore'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explorer ({communityList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'friends'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mes Amis ({friendsList.length})</span>
          </button>

          {/* Dedicated Tab for Friend Requests to validate */}
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap relative ${
              activeTab === 'requests'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Demandes d'amis</span>
            {incomingCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                {incomingCount} à valider
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                (0)
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'search'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Rechercher</span>
          </button>
        </div>

        {/* TAB 1: Explore All Community Profiles */}
        {activeTab === 'explore' && (
          <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-between text-xs text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Cliquez sur <strong>Visiter la vitrine</strong> pour explorer la page d'un joueur, ses heures et ses niveaux.</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {communityList.map((member) => {
                const isMe = currentUser?.id === member.id;
                const levelInfo = getUserLevelInfo(member.id);
                const isFriend = isAlreadyFriend(member.id);
                const hasSent = hasSentRequestTo(member.id);
                const hasReceived = hasReceivedRequestFrom(member.id);
                const showcaseCount = (member.featuredGameIds && member.featuredGameIds.length > 0)
                  ? member.featuredGameIds.length
                  : (member.favorites || []).length;

                return (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 group shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-slate-900 shadow-sm">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full ${member.avatarBg || 'bg-cyan-600'} flex items-center justify-center font-bold text-white text-base uppercase`}>
                            {member.username.charAt(0)}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070c1e]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {member.username}
                          </h4>
                          {isMe && (
                            <span className="text-[9px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30">
                              VOUS
                            </span>
                          )}
                          {member.isAdmin && (
                            <span className="text-[9px] font-mono text-purple-300 px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                              ADMIN
                            </span>
                          )}
                        </div>

                        {/* Level & Playtime stats */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                            Niveau ONL {levelInfo.level}
                          </span>
                          <span>·</span>
                          <span>{levelInfo.formattedPlaytime}</span>
                        </div>

                        <div className="mt-1">
                          {getStatusBadge(member.status, member.currentGameTitle)}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions with Friend Request Logic */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {showcaseCount > 0 ? `${showcaseCount} jeux en vitrine` : 'Vitrine disponible'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenUserProfile(member);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          title="Visiter la page et la vitrine publique"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Vitrine</span>
                        </button>

                        {!isMe && currentUser && (
                          isFriend ? (
                            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Amis</span>
                            </span>
                          ) : hasReceived ? (
                            <button
                              type="button"
                              onClick={() => handleAcceptFriendRequest(member)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                              title="Valider cette demande d'ami reçue"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Valider</span>
                            </button>
                          ) : hasSent ? (
                            <button
                              type="button"
                              onClick={() => handleCancelFriendRequest(member)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-xs transition-colors cursor-pointer"
                              title="Annuler la demande d'ami envoyée"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>En attente...</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendFriendRequest(member)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                              title="Envoyer une demande d'ami"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-purple-300" />
                              <span>Demander</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Friends List */}
        {activeTab === 'friends' && (
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            {friendsList.length === 0 ? (
              <div className="py-12 text-center space-y-3 text-slate-400">
                <Users className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-300">
                  Votre liste d'amis est vide
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Découvrez les joueurs de la communauté pour leur envoyer une demande d'ami ou visitez leurs vitrines !
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold hover:bg-cyan-500/30 transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explorer les joueurs ONL</span>
                </button>
              </div>
            ) : (
              friendsList.map((friend) => {
                const levelInfo = getUserLevelInfo(friend.id);
                return (
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
                          <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30">
                            Niv. {levelInfo.level}
                          </span>
                          {friend.isAdmin && (
                            <span className="text-[9px] font-mono text-purple-300 px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          {getStatusBadge(friend.status, friend.currentGameTitle)}
                        </div>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs text-cyan-300 font-semibold transition-colors cursor-pointer"
                        title="Voir le profil et la vitrine de cet ami"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visiter la vitrine</span>
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
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: FRIEND REQUESTS (Incoming to validate & Outgoing) */}
        {activeTab === 'requests' && (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Section A: Demandes Reçues (À valider par vous-même) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Demandes d'amis reçues
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-rose-300 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                  {incomingRequesters.length} en attente
                </span>
              </div>

              {incomingRequesters.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                  Aucune demande d'ami en attente de votre validation.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {incomingRequesters.map((requester) => {
                    const levelInfo = getUserLevelInfo(requester.id);
                    return (
                      <div
                        key={requester.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-400/50 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-rose-400/40 bg-slate-900 shadow-md">
                            {requester.avatarUrl ? (
                              <img src={requester.avatarUrl} alt={requester.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full ${requester.avatarBg || 'bg-rose-600'} flex items-center justify-center font-bold text-white text-sm uppercase`}>
                                {requester.username.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white truncate">{requester.username}</span>
                              <span className="text-[10px] font-mono text-cyan-300 px-1.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                                Niv. {levelInfo.level}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              Souhaite devenir votre ami sur ONL
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons to Validate or Reject */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenUserProfile(requester);
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Voir la vitrine avant de valider"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectFriendRequest(requester)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                            title="Refuser cette demande"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-400" />
                            <span>Refuser</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAcceptFriendRequest(requester)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all cursor-pointer"
                            title="Valider et ajouter comme ami"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider la demande</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section B: Demandes Envoyées (En attente de leur validation) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Demandes envoyées
                  </h3>
                </div>
                <span className="text-xs font-mono text-cyan-300">
                  {outgoingTargets.length} en attente de leur accord
                </span>
              </div>

              {outgoingTargets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                  Aucune demande envoyée en attente.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outgoingTargets.map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-slate-900">
                          {target.avatarUrl ? (
                            <img src={target.avatarUrl} alt={target.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full ${target.avatarBg || 'bg-cyan-600'} flex items-center justify-center font-bold text-white text-xs uppercase`}>
                              {target.username.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate block">{target.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            En attente de sa validation...
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelFriendRequest(target)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 text-xs transition-colors cursor-pointer"
                        title="Annuler l'envoi de la demande"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Annuler</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Search Players */}
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
                  const hasSent = hasSentRequestTo(user.id);
                  const hasReceived = hasReceivedRequestFrom(user.id);
                  const levelInfo = getUserLevelInfo(user.id);

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
                            <span className="text-[9px] font-mono text-cyan-300 px-1 rounded bg-cyan-500/20">
                              Niv. {levelInfo.level}
                            </span>
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
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] text-cyan-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Visiter</span>
                        </button>

                        {alreadyFriend ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Amis</span>
                          </span>
                        ) : hasReceived ? (
                          <button
                            type="button"
                            onClick={() => handleAcceptFriendRequest(user)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                            title="Valider la demande"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider</span>
                          </button>
                        ) : hasSent ? (
                          <button
                            type="button"
                            onClick={() => handleCancelFriendRequest(user)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-xs transition-colors cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>En attente...</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendFriendRequest(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Demander</span>
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
