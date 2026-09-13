/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Player, Match, LeagueSettings, User, ActiveTab } from './types';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_SETTINGS } from './data/initialData';
import { calculateStandings } from './utils/tennisRules';
import { getCurrentSession, clearCurrentSession, getStoredUsers, updateUsersCache, updateUserProfile } from './utils/auth';
import {
  ensureInitialSeed,
  subscribeToPlayers,
  subscribeToMatches,
  subscribeToSettings,
  subscribeToUsers,
  savePlayerToFirestore,
  deletePlayerFromFirestore,
  saveMatchToFirestore,
  deleteMatchFromFirestore,
  deleteUserFromFirestore,
  saveSettingsToFirestore,
  importDataToFirestore,
  resetLeagueDataInFirestore,
} from './lib/firebase';
import { Header } from './components/Header';
import { StandingsTable } from './components/StandingsTable';
import { MatchesList } from './components/MatchesList';
import { H2HMatrix } from './components/H2HMatrix';
import { PlayersDirectory } from './components/PlayersDirectory';
import { LeagueRules } from './components/LeagueRules';
import { SettingsModal } from './components/SettingsModal';
import { MatchModal } from './components/MatchModal';
import { PlayerModal } from './components/PlayerModal';
import { PlayerEditModal } from './components/PlayerEditModal';
import { AdminAddUserModal } from './components/AdminAddUserModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthView } from './components/AuthView';
import { VersionNotification } from './components/VersionNotification';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function App() {
  // Load data from localStorage or initial seed
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem('tennis_league_players');
      if (saved) {
        const parsed: Player[] = JSON.parse(saved);
        if (parsed.some((p) => p.id === 'p2' || p.name === 'Michał Kowalski' || p.name === 'Piotr Wiśniewski')) {
          localStorage.setItem('tennis_league_players', JSON.stringify(INITIAL_PLAYERS));
          return INITIAL_PLAYERS;
        }
        return parsed;
      }
      return INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem('tennis_league_matches');
      if (saved) {
        const parsed: Match[] = JSON.parse(saved);
        if (parsed.some((m) => m.id === 'm1' || m.id === 'm2')) {
          localStorage.setItem('tennis_league_matches', JSON.stringify(INITIAL_MATCHES));
          return INITIAL_MATCHES;
        }
        return parsed;
      }
      return INITIAL_MATCHES;
    } catch {
      return INITIAL_MATCHES;
    }
  });

  const [settings, setSettings] = useState<LeagueSettings>(() => {
    try {
      const saved = localStorage.getItem('tennis_league_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.leagueName === 'Warszawska Amatorska Liga Tenisowa' || !parsed.leagueName) {
          return { ...parsed, leagueName: 'Liga Gentlemanów Tenisa' };
        }
        return parsed;
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('standings');

  // Cloud Firestore synchronization status
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'live' | 'offline'>('syncing');

  // Modals state
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchInitialP1, setMatchInitialP1] = useState<string | undefined>(undefined);
  const [matchInitialP2, setMatchInitialP2] = useState<string | undefined>(undefined);
  const [matchInitialScheduled, setMatchInitialScheduled] = useState<boolean>(false);

  const [selectedPlayerDetail, setSelectedPlayerDetail] = useState<Player | null>(null);

  const [isPlayerEditOpen, setIsPlayerEditOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  const [isAdminAddUserOpen, setIsAdminAddUserOpen] = useState(false);

  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // User authentication session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = getCurrentSession();
    if (session) {
      if (session.email === 'komisarz@gentlemani.pl' || session.email.endsWith('@gentlemani.pl')) {
        clearCurrentSession();
        return null;
      }
      return session;
    }
    return null;
  });

  // Protect settings tab: non-admin users cannot stay on settings tab
  useEffect(() => {
    if (activeTab === 'settings' && currentUser && currentUser.role !== 'admin') {
      setActiveTab('standings');
    }
  }, [activeTab, currentUser]);

  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);
  };

  // Find player profile associated with the currently logged-in account
  const currentUserPlayer = useMemo(() => {
    if (!currentUser) return null;
    return (
      players.find(
        (pl) =>
          (currentUser.playerId && pl.id === currentUser.playerId) ||
          (currentUser.email && pl.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          pl.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      ) || null
    );
  }, [currentUser, players]);

  const handleOpenMyProfile = () => {
    if (currentUserPlayer) {
      setSelectedPlayerDetail(currentUserPlayer);
    }
  };

  const handleEditMyProfile = () => {
    if (!currentUser) return;
    if (currentUserPlayer) {
      setPlayerToEdit(currentUserPlayer);
      setIsPlayerEditOpen(true);
    } else {
      // Fallback: create temporary player profile from currentUser
      const tempPlayer: Player = {
        id: currentUser.playerId || `p_${Date.now()}`,
        name: currentUser.name,
        nickname: currentUser.nickname,
        phone: currentUser.phone || '+48 ',
        email: currentUser.email,
        avatarColor: 'bg-emerald-700',
        playStyle: currentUser.playStyle?.trim() || undefined,
        preferredCourts: currentUser.preferredCourts?.trim() || undefined,
        preferredTimes: currentUser.preferredTimes?.trim() || undefined,
        preferredSurfaces: ['Mączka'],
        status: 'active',
      };
      setPlayerToEdit(tempPlayer);
      setIsPlayerEditOpen(true);
    }
  };

  // Real-time synchronization with Firestore across all devices
  useEffect(() => {
    ensureInitialSeed();

    const unsubPlayers = subscribeToPlayers((firestorePlayers) => {
      if (firestorePlayers && firestorePlayers.length > 0) {
        setPlayers(firestorePlayers);
        setSyncStatus('live');
      }
    });

    const unsubMatches = subscribeToMatches((firestoreMatches) => {
      setMatches(firestoreMatches);
      setSyncStatus('live');
    });

    const unsubSettings = subscribeToSettings((firestoreSettings) => {
      if (firestoreSettings) {
        setSettings(firestoreSettings);
        setSyncStatus('live');
      }
    });

    const unsubUsers = subscribeToUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        updateUsersCache(firestoreUsers);
      }
    });

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubSettings();
      unsubUsers();
    };
  }, []);

  // Sync to localStorage as offline fast cache
  useEffect(() => {
    try {
      localStorage.setItem('tennis_league_players', JSON.stringify(players));
    } catch (err) {
      console.warn('Failed to save players to localStorage', err);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem('tennis_league_matches', JSON.stringify(matches));
    } catch (err) {
      console.warn('Failed to save matches to localStorage', err);
    }
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem('tennis_league_settings', JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save settings to localStorage', err);
    }
  }, [settings]);

  // Handle PWA installation events
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Prevent background page scrolling when any modal is open (strictly 1 active scroll)
  const isAnyModalOpen =
    isMatchModalOpen ||
    !!selectedPlayerDetail ||
    isPlayerEditOpen ||
    isPwaModalOpen ||
    isAdminAddUserOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isAnyModalOpen]);

  const handleTriggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          setIsPwaInstalled(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      setIsPwaModalOpen(true);
    }
  };

  // Calculate standings
  const standings = useMemo(() => {
    return calculateStandings(players, matches, settings);
  }, [players, matches, settings]);

  // Statistics
  const stats = useMemo(() => {
    const completed = matches.filter((m) => m.status === 'completed').length;
    const scheduled = matches.filter((m) => m.status === 'scheduled').length;
    return {
      totalPlayers: players.length,
      completedMatches: completed,
      scheduledMatches: scheduled,
    };
  }, [players, matches]);

  // Pending user registrations for admin approval
  const pendingApprovalsCount = useMemo(() => {
    try {
      const users = getStoredUsers();
      return users.filter((u) => u.status === 'pending').length;
    } catch {
      return 0;
    }
  }, [activeTab, players]);

  // Handlers for matches
  const handleOpenNewMatch = () => {
    setEditingMatch(null);
    setMatchInitialP1(currentUserPlayer?.id || players[0]?.id);
    setMatchInitialP2(undefined);
    setMatchInitialScheduled(false);
    setIsMatchModalOpen(true);
  };

  const handleOpenNewMatchBetween = (p1Id: string, p2Id: string, isScheduled: boolean = false) => {
    setEditingMatch(null);
    setMatchInitialP1(p1Id);
    setMatchInitialP2(p2Id);
    setMatchInitialScheduled(isScheduled);
    setIsMatchModalOpen(true);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatches((prev) => {
      const updated = prev.filter((m) => m.id !== matchId);
      try {
        localStorage.setItem('tennis_league_matches', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save matches to localStorage', err);
      }
      return updated;
    });
    deleteMatchFromFirestore(matchId).catch((err) => {
      console.warn('Could not delete match from Firestore:', err);
    });
  };

  const handleCompleteScheduledMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleSaveMatch = (matchToSave: Match) => {
    setMatches((prev) => {
      const exists = prev.some((m) => m.id === matchToSave.id);
      if (exists) {
        return prev.map((m) => (m.id === matchToSave.id ? matchToSave : m));
      }
      return [matchToSave, ...prev];
    });
    saveMatchToFirestore(matchToSave).catch((err) => {
      console.warn('Could not sync match to Firestore:', err);
    });
  };

  // Handlers for players
  const handleAddNewPlayer = () => {
    if (currentUser?.role === 'admin') {
      setIsAdminAddUserOpen(true);
    } else {
      setPlayerToEdit(null);
      setIsPlayerEditOpen(true);
    }
  };

  const handleEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setIsPlayerEditOpen(true);
  };

  const handleSavePlayer = (player: Player, newPassword?: string) => {
    setPlayers((prev) => {
      const exists = prev.some((p) => p.id === player.id);
      if (exists) {
        return prev.map((p) => (p.id === player.id ? player : p));
      }
      return [...prev, player];
    });
    savePlayerToFirestore(player).catch((err) => {
      console.warn('Could not sync player to Firestore:', err);
    });

    // Synchronize linked user profile if exists
    try {
      const users = getStoredUsers();
      const matchedUser = users.find(
        (u) =>
          u.playerId === player.id ||
          (player.email && u.email?.toLowerCase() === player.email.toLowerCase()) ||
          (currentUser && u.id === currentUser.id && (u.playerId === player.id || player.name.toLowerCase() === u.name.toLowerCase()))
      );

      if (matchedUser) {
        const updated = updateUserProfile(matchedUser.id, {
          name: player.name,
          nickname: player.nickname,
          phone: player.phone,
          playStyle: player.playStyle,
          preferredCourts: player.preferredCourts,
          preferredTimes: player.preferredTimes,
          newPassword: newPassword,
        });

        if (currentUser && currentUser.id === matchedUser.id) {
          setCurrentUser(updated);
        }
      }
    } catch (err) {
      console.warn('Could not sync user profile in auth registry:', err);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    // 1. Delete all matches of this player from state and Firestore
    const matchesToDelete = matches.filter((m) => m.player1Id === playerId || m.player2Id === playerId);
    matchesToDelete.forEach((m) => {
      deleteMatchFromFirestore(m.id).catch((err) => {
        console.warn('Could not delete match from Firestore:', err);
      });
    });
    setMatches((prev) => prev.filter((m) => m.player1Id !== playerId && m.player2Id !== playerId));

    // 2. Delete player from state and Firestore
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    deletePlayerFromFirestore(playerId).catch((err) => {
      console.warn('Could not delete player from Firestore:', err);
    });

    // 3. Remove linked user account if exists (except Commissioner)
    try {
      const users = getStoredUsers();
      const linkedUser = users.find((u) => u.playerId === playerId);
      if (linkedUser && linkedUser.email?.toLowerCase() !== 'przemyslaw.chlus@gmail.com') {
        deleteUserFromFirestore(linkedUser.id).catch(() => {});
      }
    } catch (err) {
      console.warn('Could not clean linked user on delete:', err);
    }

    if (selectedPlayerDetail?.id === playerId) {
      setSelectedPlayerDetail(null);
    }
  };

  // Handlers for export / import / reset
  const handleExportData = () => {
    if (currentUser?.role !== 'admin') {
      alert('Tylko administrator ligi może eksportować dane.');
      return;
    }
    const backup = {
      players,
      matches,
      settings,
      exportDate: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liga-tenisowa-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Tylko administrator ligi może importować dane.');
      return;
    }
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.players) && Array.isArray(parsed.matches)) {
        setPlayers(parsed.players);
        setMatches(parsed.matches);
        if (parsed.settings) setSettings(parsed.settings);
        importDataToFirestore(parsed.players, parsed.matches, parsed.settings).catch((err) => {
          console.warn('Could not import data into Firestore:', err);
        });
      } else {
        alert('Plik ma nieprawidłowy format danych ligowych.');
      }
    } catch {
      alert('Błąd podczas parsowania pliku JSON.');
    }
  };

  const handleResetData = () => {
    if (currentUser?.role !== 'admin') {
      alert('Tylko administrator ligi może zresetować dane.');
      return;
    }
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem('tennis_league_players');
    localStorage.removeItem('tennis_league_matches');
    localStorage.removeItem('tennis_league_settings');
    resetLeagueDataInFirestore().catch((err) => {
      console.warn('Could not reset data in Firestore:', err);
    });
  };

  // If user is not authenticated, block all access to the app and show AuthView
  if (!currentUser) {
    return (
      <>
        <AuthView
          onLoginSuccess={(user) => setCurrentUser(user)}
          players={players}
          onPlayerCreated={(newPlayer) => {
            handleSavePlayer(newPlayer);
          }}
        />
        <VersionNotification />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-lime-300 selection:text-emerald-950 overflow-x-hidden">
      {/* Top Application Header with Navigation Tabs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMatch={handleOpenNewMatch}
        settings={settings}
        stats={stats}
        canInstallPwa={true}
        onInstallPwa={handleTriggerPwaInstall}
        isPwaInstalled={isPwaInstalled}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenMyProfile={handleOpenMyProfile}
        onEditMyProfile={handleEditMyProfile}
        pendingApprovalsCount={pendingApprovalsCount}
        syncStatus={syncStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 pb-24 sm:py-6 space-y-5 sm:space-y-6 min-w-0">
        {activeTab === 'standings' && (
          <StandingsTable
            standings={standings}
            settings={settings}
            onSelectPlayer={(p) => setSelectedPlayerDetail(p)}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesList
            matches={matches}
            players={players}
            onOpenNewMatch={handleOpenNewMatch}
            onEditMatch={handleEditMatch}
            onDeleteMatch={handleDeleteMatch}
            onCompleteScheduledMatch={handleCompleteScheduledMatch}
            onSelectPlayer={(p) => setSelectedPlayerDetail(p)}
          />
        )}

        {activeTab === 'h2h' && (
          <H2HMatrix
            players={players}
            matches={matches}
            currentUser={currentUser}
            onOpenNewMatchBetween={handleOpenNewMatchBetween}
            onSelectPlayer={(p) => setSelectedPlayerDetail(p)}
          />
        )}

        {activeTab === 'players' && (
          <PlayersDirectory
            players={players}
            matches={matches}
            currentUser={currentUser}
            onSelectPlayer={(p) => setSelectedPlayerDetail(p)}
            onEditPlayer={handleEditPlayer}
            onAddNewPlayer={handleAddNewPlayer}
            onScheduleWithPlayer={(p) => {
              handleOpenNewMatchBetween(currentUserPlayer?.id || players[0]?.id || '', p.id, false);
            }}
          />
        )}

        {activeTab === 'rules' && (
          <LeagueRules
            settings={settings}
            currentUser={currentUser}
            onGoToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          currentUser?.role === 'admin' ? (
            <SettingsModal
              settings={settings}
              onSaveSettings={(newSettings) => {
                if (currentUser?.role !== 'admin') {
                  alert('Tylko administrator ligi może modyfikować ustawienia.');
                  return;
                }
                setSettings(newSettings);
                saveSettingsToFirestore(newSettings).catch((err) => {
                  console.warn('Could not save settings to Firestore:', err);
                });
              }}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetData={handleResetData}
              currentUser={currentUser}
              onLogout={handleLogout}
              onEditMyProfile={handleEditMyProfile}
              onPlayerCreated={(newPlayer) => {
                handleSavePlayer(newPlayer);
              }}
            />
          ) : null
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-200/90 border-t border-stone-300 pt-6 pb-24 sm:pb-6 text-center text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Liga Gentlemanów Tenisa" className="w-7 h-7 object-contain" />
            <span className="font-bold text-stone-800">
              {settings.leagueName}
            </span>
            <span className="text-stone-400">•</span>
            <span>Tenis • Klasa • Fair Play</span>
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <span>Reguły: Best-of-3 (do 2 wygranych setów)</span>
            <span>•</span>
            <button
              onClick={handleTriggerPwaInstall}
              className="hover:text-emerald-800 font-semibold cursor-pointer underline"
            >
              Zainstaluj na ekranie telefonu
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation Bar & FAB Action */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scheduledCount={stats.scheduledMatches}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenNewMatch={handleOpenNewMatch}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Match Modal (New / Edit / Complete) */}
      {isMatchModalOpen && (
        <MatchModal
          isOpen={isMatchModalOpen}
          onClose={() => setIsMatchModalOpen(false)}
          onSave={handleSaveMatch}
          onDelete={handleDeleteMatch}
          players={players}
          matches={matches}
          editingMatch={editingMatch}
          initialPlayer1Id={matchInitialP1}
          initialPlayer2Id={matchInitialP2}
          initialScheduled={matchInitialScheduled}
          settings={settings}
        />
      )}

      {/* Player Detail & H2H Modal */}
      {selectedPlayerDetail && (
        <PlayerModal
          player={selectedPlayerDetail}
          players={players}
          matches={matches}
          currentUser={currentUser}
          onClose={() => setSelectedPlayerDetail(null)}
          onEditPlayer={(p) => {
            setSelectedPlayerDetail(null);
            handleEditPlayer(p);
          }}
          onOpenNewMatchWith={(p) => {
            setSelectedPlayerDetail(null);
            handleOpenNewMatchBetween(currentUserPlayer?.id || players[0]?.id || '', p.id, false);
          }}
          onSelectOtherPlayer={(other) => setSelectedPlayerDetail(other)}
        />
      )}

      {/* Player Add / Edit Modal */}
      {isPlayerEditOpen && (
        <PlayerEditModal
          isOpen={isPlayerEditOpen}
          onClose={() => setIsPlayerEditOpen(false)}
          onSave={handleSavePlayer}
          onDelete={handleDeletePlayer}
          playerToEdit={playerToEdit}
          currentUser={currentUser}
        />
      )}

      {/* Admin Add User and Player Modal */}
      {isAdminAddUserOpen && (
        <AdminAddUserModal
          isOpen={isAdminAddUserOpen}
          onClose={() => setIsAdminAddUserOpen(false)}
          currentUser={currentUser}
          onPlayerCreated={(newPlayer) => {
            setPlayers((prev) => {
              const exists = prev.some((p) => p.id === newPlayer.id);
              if (exists) {
                return prev.map((p) => (p.id === newPlayer.id ? newPlayer : p));
              }
              return [...prev, newPlayer];
            });
          }}
        />
      )}

      {/* PWA Install Instructions Modal */}
      {isPwaModalOpen && (
        <PwaInstallModal
          isOpen={isPwaModalOpen}
          onClose={() => setIsPwaModalOpen(false)}
          onPromptInstall={handleTriggerPwaInstall}
          canDirectInstall={!!deferredPrompt}
        />
      )}

      {/* Proactive Version Update Notification */}
      <VersionNotification />
    </div>
  );
}
