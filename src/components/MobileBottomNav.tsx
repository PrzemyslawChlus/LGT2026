import React from 'react';
import { Table, Trophy, Calendar, Users, BookOpen, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  scheduledCount: number;
  pendingApprovalsCount: number;
  onOpenNewMatch: () => void;
  isAdmin?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  scheduledCount,
  onOpenNewMatch,
}) => {
  return (
    <>
      {/* Floating Action Button (FAB) for fast score reporting */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-22 md:right-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          id="mobile-fab-add-match"
          onClick={onOpenNewMatch}
          className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 active:from-lime-500 active:to-lime-600 text-emerald-950 font-black rounded-full shadow-lg shadow-lime-500/30 border border-lime-300/80 active:scale-95 transition-all cursor-pointer"
          title="Wpisz wynik meczu lub ustal termin"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-950 text-lime-400 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="tracking-wide font-extrabold uppercase text-xs">Wpisz wynik</span>
        </button>
      </div>

      {/* Sticky Bottom Navigation Bar (5-item dock) */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 py-1.5 px-2 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[calc(100%-2rem)] md:max-w-xl md:rounded-2xl md:border md:shadow-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] safe-area-inset-bottom"
        role="navigation"
        aria-label="Nawigacja dolna"
      >
        <div className="grid grid-cols-5 items-center justify-between max-w-lg mx-auto">
          {/* 1. Tabela */}
          <button
            id="mobile-nav-standings"
            type="button"
            onClick={() => setActiveTab('standings')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'standings'
                ? 'text-emerald-900 font-extrabold bg-emerald-50/80'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Table className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'standings' ? 'text-emerald-700 stroke-[2.4]' : 'text-stone-400'}`} />
              {activeTab === 'standings' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-700" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1.5 truncate max-w-full">Tabela</span>
          </button>

          {/* 2. Mecze */}
          <button
            id="mobile-nav-matches"
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[52px] relative ${
              activeTab === 'matches'
                ? 'text-emerald-900 font-extrabold bg-emerald-50/80'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'matches' ? 'text-emerald-700 stroke-[2.4]' : 'text-stone-400'}`} />
              {scheduledCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 border border-white shadow-xs">
                  {scheduledCount}
                </span>
              )}
              {activeTab === 'matches' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-700" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1.5 truncate max-w-full">Mecze</span>
          </button>

          {/* 3. Terminarz / Umawianie */}
          <button
            id="mobile-nav-h2h"
            type="button"
            onClick={() => setActiveTab('h2h')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'h2h'
                ? 'text-emerald-900 font-extrabold bg-emerald-50/80'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'h2h' ? 'text-emerald-700 stroke-[2.4]' : 'text-stone-400'}`} />
              {activeTab === 'h2h' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-700" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1.5 truncate max-w-full">Terminarz</span>
          </button>

          {/* 4. Kontakty / Gracze */}
          <button
            id="mobile-nav-players"
            type="button"
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[52px] ${
              activeTab === 'players'
                ? 'text-emerald-900 font-extrabold bg-emerald-50/80'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'players' ? 'text-emerald-700 stroke-[2.4]' : 'text-stone-400'}`} />
              {activeTab === 'players' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-700" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1.5 truncate max-w-full">Gracze</span>
          </button>

          {/* 5. Zasady / Regulamin */}
          <button
            id="mobile-nav-rules"
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[52px] relative ${
              activeTab === 'rules'
                ? 'text-emerald-900 font-extrabold bg-emerald-50/80'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <BookOpen className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'rules' ? 'text-emerald-700 stroke-[2.4]' : 'text-stone-400'}`} />
              {activeTab === 'rules' && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-700" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1.5 truncate max-w-full">Zasady</span>
          </button>
        </div>
      </nav>
    </>
  );
};
