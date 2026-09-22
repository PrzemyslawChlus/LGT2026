import React, { useState } from 'react';
import { Trophy, Search, ChevronRight, Award, ShieldAlert, Sparkles, Phone, MessageSquare, LayoutList, TableProperties } from 'lucide-react';
import { StandingRow, LeagueSettings, Player } from '../types';

interface StandingsTableProps {
  standings: StandingRow[];
  settings: LeagueSettings;
  onSelectPlayer: (player: Player) => void;
  onOpenNewMatchForPlayer?: (player: Player) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  settings,
  onSelectPlayer,
  onOpenNewMatchForPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');

  const filteredStandings = standings.filter((row) =>
    row.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.player.nickname && row.player.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topThree = standings.slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top 3 Podium (Responsive: Compact on Mobile, 3-Card on Desktop) */}
      {standings.length >= 3 && (
        <>
          {/* Mobile-Only Podium Banner (< sm:) */}
          <div className="sm:hidden bg-gradient-to-r from-amber-500/15 via-amber-50 to-white rounded-2xl p-4 border-2 border-amber-300/80 shadow-xs">
            {/* Leader Highlight */}
            <div
              onClick={() => onSelectPlayer(topThree[0].player)}
              className="flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform pb-3 border-b border-amber-200/70"
            >
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-xl ${topThree[0].player.avatarColor} text-white font-black flex items-center justify-center text-xl shadow-sm ring-2 ring-amber-400`}>
                  {topThree[0].player.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center border border-white shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800">Lider Ligi</span>
                </div>
                <h3 className="font-extrabold text-stone-900 text-base break-words leading-snug mt-0.5">
                  {topThree[0].player.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
                  {topThree[0].won}W - {topThree[0].lost}P • Sety: {topThree[0].setDiff > 0 ? `+${topThree[0].setDiff}` : topThree[0].setDiff}
                </p>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-3xl font-black text-amber-600 font-display">{topThree[0].points}</span>
                <span className="block text-xs font-bold text-amber-700 uppercase">PKT</span>
              </div>
            </div>

            {/* 2nd and 3rd Runners-up Quick Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
              {/* 2nd */}
              <div
                onClick={() => onSelectPlayer(topThree[1].player)}
                className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-stone-200 cursor-pointer active:bg-stone-50"
              >
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-bold text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-stone-900 break-words leading-tight">{topThree[1].player.name}</p>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">{topThree[1].won}W-{topThree[1].lost}P</p>
                </div>
                <span className="text-sm font-black text-stone-800 font-display pr-1 shrink-0">{topThree[1].points}p</span>
              </div>

              {/* 3rd */}
              <div
                onClick={() => onSelectPlayer(topThree[2].player)}
                className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-stone-200 cursor-pointer active:bg-stone-50"
              >
                <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-bold text-sm flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-stone-900 break-words leading-tight">{topThree[2].player.name}</p>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">{topThree[2].won}W-{topThree[2].lost}P</p>
                </div>
                <span className="text-sm font-black text-stone-800 font-display pr-1 shrink-0">{topThree[2].points}p</span>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet 3-Card Podium (sm:+) */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 2nd Place */}
            <div
              onClick={() => onSelectPlayer(topThree[1].player)}
              className="order-2 md:order-1 bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-slate-400/80 transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-200/50 via-transparent to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl ${topThree[1].player.avatarColor} text-white font-bold flex items-center justify-center text-lg shadow-sm`}>
                    {topThree[1].player.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center border-2 border-white shadow">
                    2
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">2. Miejsce</span>
                  </div>
                  <h3 className="font-bold text-stone-900 break-words leading-snug group-hover:text-emerald-800 transition-colors">
                    {topThree[1].player.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {topThree[1].won}W - {topThree[1].lost}P • Sety: {topThree[1].setDiff > 0 ? `+${topThree[1].setDiff}` : topThree[1].setDiff}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-stone-900 font-display">{topThree[1].points}</span>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase">Pkt</span>
                </div>
              </div>
            </div>

            {/* 1st Place (Leader) */}
            <div
              onClick={() => onSelectPlayer(topThree[0].player)}
              className="order-1 md:order-2 bg-gradient-to-b from-amber-50/70 to-white rounded-2xl p-4 shadow-md border-2 border-amber-300/80 hover:border-amber-400 transition-all cursor-pointer relative overflow-hidden group scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-300/30 via-transparent to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl ${topThree[0].player.avatarColor} text-white font-black flex items-center justify-center text-xl shadow-md ring-2 ring-amber-300`}>
                    {topThree[0].player.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center border-2 border-white shadow">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Lider tabeli</span>
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-lg break-words leading-snug group-hover:text-amber-800 transition-colors">
                    {topThree[0].player.name}
                  </h3>
                  <p className="text-xs text-stone-600 font-medium">
                    {topThree[0].won}W - {topThree[0].lost}P • Sety: {topThree[0].setDiff > 0 ? `+${topThree[0].setDiff}` : topThree[0].setDiff} • Gemy: {topThree[0].gameDiff > 0 ? `+${topThree[0].gameDiff}` : topThree[0].gameDiff}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-amber-600 font-display">{topThree[0].points}</span>
                  <span className="block text-[10px] font-bold text-amber-700/80 uppercase">Pkt</span>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div
              onClick={() => onSelectPlayer(topThree[2].player)}
              className="order-3 bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-amber-700/40 transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-700/10 via-transparent to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl ${topThree[2].player.avatarColor} text-white font-bold flex items-center justify-center text-lg shadow-sm`}>
                    {topThree[2].player.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-extrabold text-xs flex items-center justify-center border-2 border-white shadow">
                    3
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-800/70">3. Miejsce</span>
                  </div>
                  <h3 className="font-bold text-stone-900 break-words leading-snug group-hover:text-emerald-800 transition-colors">
                    {topThree[2].player.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {topThree[2].won}W - {topThree[2].lost}P • Sety: {topThree[2].setDiff > 0 ? `+${topThree[2].setDiff}` : topThree[2].setDiff}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-stone-900 font-display">{topThree[2].points}</span>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase">Pkt</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Table & Card Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-stone-200 overflow-hidden">
        {/* Table Toolbar with Mobile View Toggle */}
        <div className="p-3 sm:p-4 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-stone-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              <h2 className="font-extrabold text-stone-800 text-sm sm:text-base">Tabela Ligi</h2>
              <span className="text-[11px] text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full font-bold">
                {standings.length} graczy
              </span>
            </div>

            {/* Mobile View Mode Switcher */}
            <div className="flex sm:hidden items-center bg-stone-200/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMobileViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  mobileViewMode === 'cards'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Karty</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  mobileViewMode === 'table'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Arkusz</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj gracza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* 1. Mobile Cards View (< sm: and mobileViewMode === 'cards') */}
        <div className={`divide-y divide-stone-100 ${mobileViewMode === 'cards' ? 'block sm:hidden' : 'hidden'}`}>
          {filteredStandings.map((row) => {
            const isLeader = row.rank === 1;

            return (
              <div
                key={row.player.id}
                onClick={() => onSelectPlayer(row.player)}
                className={`p-4 flex items-center gap-3.5 active:bg-emerald-50/40 transition-colors cursor-pointer min-h-[72px] ${
                  isLeader ? 'bg-amber-50/30' : ''
                }`}
              >
                {/* Rank Badge */}
                <div className="shrink-0 w-8 text-center">
                  {row.rank === 1 ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-sm shadow-xs">
                      1
                    </span>
                  ) : row.rank === 2 ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-bold text-sm">
                      2
                    </span>
                  ) : row.rank === 3 ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-bold text-sm">
                      3
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-stone-500 font-mono">{row.rank}</span>
                  )}
                </div>

                {/* Avatar & Player Info */}
                <div className={`w-12 h-12 rounded-xl ${row.player.avatarColor} text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0`}>
                  {row.player.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-extrabold text-stone-900 text-base leading-snug break-words">
                      {row.player.name}
                    </span>
                    {row.player.nickname && (
                      <span className="text-xs text-stone-400 font-medium">
                        „{row.player.nickname}”
                      </span>
                    )}
                    {row.player.status === 'injured' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold shrink-0">
                        Kontuzja
                      </span>
                    )}
                  </div>

                  {/* Micro stats pills */}
                  <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                    <span className="font-bold text-stone-800">
                      M: {row.played}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-emerald-700">{row.won}W</span>
                    <span className="text-stone-400">-</span>
                    <span className="font-bold text-rose-700">{row.lost}P</span>
                    <span>•</span>
                    <span>S: {row.setsWon}:{row.setsLost}</span>
                  </div>

                  {/* Form pills */}
                  {row.form.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-xs text-stone-400 font-medium">Forma:</span>
                      <div className="flex items-center gap-1">
                        {row.form.map((res, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white ${
                              res === 'W' ? 'bg-emerald-600' : 'bg-stone-300 text-stone-700'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Points Pill & Chevron */}
                <div className="text-right shrink-0 flex items-center gap-2 pl-2">
                  <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-center shadow-xs">
                    <span className="block text-lg font-black text-emerald-950 font-display leading-tight">
                      {row.points}
                    </span>
                    <span className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                      PKT
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300" />
                </div>
              </div>
            );
          })}

          {filteredStandings.length === 0 && (
            <div className="py-8 text-center text-xs text-stone-500">
              Nie znaleziono zawodnika dla „{searchQuery}”.
            </div>
          )}
        </div>

        {/* 2. Full Table View (sm:+ or mobileViewMode === 'table') */}
        <div className={`overflow-x-auto w-full max-w-full overscroll-x-contain ${mobileViewMode === 'table' ? 'block' : 'hidden sm:block'}`}>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100/80 text-stone-600 uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 w-10 sm:w-12 text-center">#</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 sticky left-0 bg-stone-100/95 z-10 min-w-[170px] sm:min-w-[220px] whitespace-nowrap">Zawodnik</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center" title="Rozegrane mecze">M</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center" title="Wygrane - Porażki">W-P</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center" title="Bilans setów">Sety</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center" title="Różnica setów">+/- S</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center" title="Bilans gemów">Gemy</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center" title="Różnica gemów">+/- G</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center bg-emerald-50 text-emerald-950 font-black" title="Punkty ligowe">PKT</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center hidden md:table-cell" title="Ostatnie 5 meczów">Forma</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70">
              {filteredStandings.map((row) => {
                const isLeader = row.rank === 1;

                return (
                  <tr
                    key={row.player.id}
                    onClick={() => onSelectPlayer(row.player)}
                    className={`hover:bg-stone-50/90 transition-colors cursor-pointer group ${
                      isLeader ? 'bg-amber-50/20 font-medium' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center">
                      {row.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] sm:text-xs shadow-xs">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-[11px] sm:text-xs">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-700 text-amber-100 font-bold text-[11px] sm:text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-stone-500 font-semibold text-xs">{row.rank}</span>
                      )}
                    </td>

                    {/* Player Info (Sticky left column so names never disappear when scrolled horizontally) */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 sticky left-0 bg-white group-hover:bg-stone-50/90 transition-colors z-10 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${row.player.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}>
                          {row.player.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors whitespace-nowrap">
                              {row.player.name}
                            </span>
                            {row.player.nickname && (
                              <span className="text-xs text-stone-400 hidden lg:inline whitespace-nowrap">
                                „{row.player.nickname}”
                              </span>
                            )}
                          </div>
                          {row.player.preferredCourts && (
                            <span className="text-[11px] text-stone-500 block truncate hidden sm:block max-w-[220px]">
                              {row.player.preferredCourts}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Matches Played */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center font-semibold text-stone-700">
                      {row.played}
                    </td>

                    {/* W - L */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center whitespace-nowrap">
                      <span className="font-bold text-emerald-700">{row.won}</span>
                      <span className="text-stone-300 mx-0.5 sm:mx-1">-</span>
                      <span className="font-medium text-stone-500">{row.lost}</span>
                    </td>

                    {/* Sets Won : Lost */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center text-stone-600 text-xs font-mono">
                      {row.setsWon}:{row.setsLost}
                    </td>

                    {/* Set Diff */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded ${
                          row.setDiff > 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : row.setDiff < 0
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-stone-500 bg-stone-100'
                        }`}
                      >
                        {row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}
                      </span>
                    </td>

                    {/* Games Won : Lost */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center text-stone-600 text-xs font-mono">
                      {row.gamesWon}:{row.gamesLost}
                    </td>

                    {/* Game Diff */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center">
                      <span
                        className={`text-xs font-semibold ${
                          row.gameDiff > 0
                            ? 'text-emerald-700'
                            : row.gameDiff < 0
                            ? 'text-rose-600'
                            : 'text-stone-400'
                        }`}
                      >
                        {row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center bg-emerald-50/60 font-black text-emerald-950 text-sm sm:text-base font-display">
                      {row.points}
                    </td>

                    {/* Form (Last 5) */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.length === 0 ? (
                          <span className="text-stone-300 text-xs">-</span>
                        ) : (
                          row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-xs ${
                                res === 'W'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-300 text-stone-700'
                              }`}
                              title={res === 'W' ? 'Wygrana' : 'Porażka'}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Arrow / Action */}
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                );
              })}

              {filteredStandings.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-stone-500">
                    Nie znaleziono zawodnika dla „{searchQuery}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Scoring Rules Footer Summary */}
        <div className="p-3 sm:p-3.5 bg-stone-50 border-t border-stone-200 text-[11px] sm:text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="font-bold text-stone-800">Punktacja:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              2:0 = <strong className="text-stone-900">{settings.points2_0} pkt</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-lime-500" />
              2:1 = <strong className="text-stone-900">{settings.points2_1} pkt</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              1:2 = <strong className="text-stone-900">{settings.points1_2} pkt</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-stone-400" />
              0:2 = <strong className="text-stone-900">{settings.points0_2} pkt</strong>
            </span>
          </div>

          <div className="text-stone-400 italic text-[10px] sm:text-xs">
            Dotknij gracza, aby sprawdzić statystyki i H2H.
          </div>
        </div>
      </div>
    </div>
  );
};
