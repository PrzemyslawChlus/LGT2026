import React, { useState, useRef, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Users,
  Table,
  PlusCircle,
  Download,
  Flame,
  LogOut,
  User as UserIcon,
  UserCog,
  ChevronDown,
  BookOpen,
  Settings,
  FolderArchive,
  Target,
} from 'lucide-react';
import { LeagueSettings, User, ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewMatch: () => void;
  settings: LeagueSettings;
  stats: {
    totalPlayers: number;
    completedMatches: number;
    scheduledMatches: number;
  };
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  isPwaInstalled: boolean;
  currentUser: User | null;
  onLogout: () => void;
  onOpenMyProfile: () => void;
  onEditMyProfile?: () => void;
  pendingApprovalsCount?: number;
  syncStatus?: 'syncing' | 'live' | 'offline';
  onScrollToSuggester?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewMatch,
  settings,
  stats,
  canInstallPwa,
  onInstallPwa,
  isPwaInstalled,
  currentUser,
  onLogout,
  onOpenMyProfile,
  onEditMyProfile,
  pendingApprovalsCount = 0,
  syncStatus = 'live',
  onScrollToSuggester,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-800/80 shadow-md sticky top-0 z-30">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & League Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm border border-amber-400/40 shrink-0 bg-emerald-950 flex items-center justify-center p-0.5">
              <img
                src="/logo.svg"
                alt="Liga Gentlemanów Tenisa Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-stone-100 font-display leading-tight truncate">
                  {settings.leagueName}
                </h1>

                <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Gentlemen's Tour
                </span>

                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 shrink-0"
                  title="Współdzielona baza w chmurze Firestore — synchronizacja na żywo"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'live'
                        ? 'bg-lime-400 animate-pulse'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-400 animate-spin'
                        : 'bg-stone-400'
                    }`}
                  />
                  <span className="hidden sm:inline">Chmura: </span>
                  <span>{syncStatus === 'live' ? 'Live' : syncStatus === 'syncing' ? 'Sync...' : 'Offline'}</span>
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-emerald-300/80 font-medium truncate mt-0.5">
                <span>{settings.season}</span>
                <span className="text-emerald-400/40 mx-1.5">•</span>
                <span>
                  {stats.completedMatches}{' '}
                  {stats.completedMatches === 1
                    ? 'mecz'
                    : stats.completedMatches >= 2 && stats.completedMatches <= 4
                    ? 'mecze'
                    : 'meczów'}
                </span>
                <span className="hidden sm:inline">
                  <span className="text-emerald-400/40 mx-1.5">•</span>
                  <span>{stats.totalPlayers} graczy</span>
                </span>
              </p>
            </div>
          </div>

          {/* Action Area & User Profile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* PWA Install Button (subtle) */}
            {canInstallPwa && !isPwaInstalled && (
              <button
                id="install-pwa-header-btn"
                onClick={onInstallPwa}
                className="inline-flex items-center justify-center gap-1 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-lime-300 border border-lime-400/30 transition-colors cursor-pointer"
                title="Zainstaluj aplikację na telefonie"
              >
                <Download className="w-3.5 h-3.5 text-lime-400" />
                <span className="hidden sm:inline">Aplikacja</span>
              </button>
            )}

            {/* Quick Opponent Suggester CTA */}
            {onScrollToSuggester && (
              <button
                id="header-suggester-btn"
                type="button"
                onClick={onScrollToSuggester}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-amber-400/20 to-lime-400/20 hover:from-amber-400/30 hover:to-lime-400/30 text-amber-300 hover:text-white border border-amber-400/40 shadow-xs transition-all cursor-pointer"
                title="Zobacz rekomendowanego rywala i zagraj z kimś nowym!"
              >
                <Target className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Kogo wyzwać?</span>
              </button>
            )}

            {/* Desktop only primary Add button (mobile uses floating FAB & bottom nav) */}
            <button
              id="add-match-btn"
              onClick={onOpenNewMatch}
              className="hidden md:inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-emerald-950 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
              <span>Wpisz wynik</span>
            </button>

            {/* Refined User Profile Chip with Dropdown Popover */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  id="user-profile-menu-trigger"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isMenuOpen
                      ? 'bg-emerald-900 border-amber-400/80 ring-2 ring-amber-400/20'
                      : 'bg-emerald-900/80 hover:bg-emerald-900 border-emerald-800/80 hover:border-amber-400/40'
                  }`}
                  title="Menu profilu dżentelmena"
                >
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400 text-emerald-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    {currentUser.role === 'admin' && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-lime-400 border-2 border-emerald-950 rounded-full"
                        title="Komisarz Ligi"
                      />
                    )}
                  </div>

                  <div className="hidden sm:block text-left min-w-0">
                    <span className="block font-bold text-white text-xs leading-tight truncate max-w-[120px] md:max-w-[150px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-amber-300 font-semibold block leading-tight mt-0.5">
                      {currentUser.role === 'admin' ? 'Komisarz Ligi' : 'Dżentelmen'}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-emerald-300 transition-transform duration-200 ${
                      isMenuOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    id="user-profile-dropdown"
                    className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-stone-200 text-stone-900 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden"
                  >
                    {/* User Card Header */}
                    <div className="p-3.5 bg-stone-50 border-b border-stone-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 font-black text-base flex items-center justify-center shadow-xs shrink-0">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-stone-900 text-sm truncate">
                            {currentUser.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {currentUser.role === 'admin' ? 'Komisarz Ligi' : 'Zweryfikowany Gracz'}
                            </span>
                          </div>
                          {currentUser.email && (
                            <div className="text-[11px] text-stone-400 truncate mt-0.5">
                              {currentUser.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="p-1.5 space-y-0.5 text-xs">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenMyProfile();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors text-left cursor-pointer min-h-[44px]"
                      >
                        <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="font-bold block text-stone-900">Mój profil i statystyki</span>
                          <span className="text-[10px] text-stone-400 block">Zobacz swoje mecze, H2H i bilans</span>
                        </div>
                      </button>

                      {onEditMyProfile && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onEditMyProfile();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors text-left cursor-pointer min-h-[44px]"
                        >
                          <UserCog className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold block text-stone-900">Edytuj moje dane</span>
                            <span className="text-[10px] text-stone-400 block">Telefon, styl gry, hasło konta</span>
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setActiveTab('rules');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors text-left cursor-pointer min-h-[44px]"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="font-bold block text-stone-900">Regulamin i zasady ligi</span>
                          <span className="text-[10px] text-stone-400 block">Punktacja, format setów, tie-break</span>
                        </div>
                      </button>

                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              setActiveTab('settings');
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors text-left cursor-pointer min-h-[44px]"
                          >
                            <div className="flex items-center gap-3">
                              <Settings className="w-4 h-4 text-emerald-700 shrink-0" />
                              <div>
                                <span className="font-bold block text-stone-900">Ustawienia ligi</span>
                                <span className="text-[10px] text-stone-400 block">Zasady, punktacja, gracze</span>
                              </div>
                            </div>
                            {pendingApprovalsCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white leading-none">
                                {pendingApprovalsCount}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              setActiveTab('settings');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors text-left cursor-pointer min-h-[44px]"
                          >
                            <FolderArchive className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div>
                              <span className="font-bold block text-stone-900">Dokumentacja i Pliki</span>
                              <span className="text-[10px] text-stone-400 block">Katalog /LGT-Docs/, specyfikacja</span>
                            </div>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Logout Footer */}
                    <div className="pt-1 mt-1 border-t border-stone-200 p-1.5">
                      <button
                        id="logout-dropdown-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors font-semibold text-left cursor-pointer text-xs min-h-[40px]"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Wyloguj się z ligi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs (visible on tablet and desktop, hidden on mobile in favor of bottom nav) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 mt-3 overflow-x-auto no-scrollbar pt-1 border-t border-emerald-900/60 text-sm font-medium">
          <button
            id="tab-standings"
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Tabela</span>
          </button>

          <button
            id="tab-matches"
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Mecze & Wyniki</span>
            {stats.scheduledMatches > 0 && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'matches' ? 'bg-emerald-950 text-lime-300' : 'bg-lime-400 text-emerald-950'
                }`}
              >
                {stats.scheduledMatches}
              </span>
            )}
          </button>

          <button
            id="tab-h2h"
            onClick={() => setActiveTab('h2h')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'h2h'
                ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kto z kim / Umawianie</span>
          </button>

          <button
            id="tab-players"
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'players'
                ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kontakty graczy</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'players' ? 'bg-emerald-950 text-lime-300' : 'bg-emerald-800 text-emerald-300'
              }`}
            >
              {stats.totalPlayers}
            </span>
          </button>

          <button
            id="tab-rules"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                : 'text-emerald-200/90 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Zasady ligi</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ml-auto ${
                activeTab === 'settings'
                  ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ustawienia</span>
              {pendingApprovalsCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse leading-none"
                  title={`${pendingApprovalsCount} oczekujących graczy do zatwierdzenia`}
                >
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
