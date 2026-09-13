import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, Phone, MessageSquare, Calendar, Clock, PlusCircle, CheckCircle2, ChevronRight, Sparkles, MapPin, User as UserIcon } from 'lucide-react';
import { Player, Match, User } from '../types';
import { formatMatchScore, checkRematchEligibility, formatDatePl } from '../utils/tennisRules';

interface H2HMatrixProps {
  players: Player[];
  matches: Match[];
  currentUser?: User | null;
  onOpenNewMatchBetween: (player1Id: string, player2Id: string, isScheduled?: boolean) => void;
  onSelectPlayer: (player: Player) => void;
}

export const H2HMatrix: React.FC<H2HMatrixProps> = ({
  players,
  matches,
  currentUser,
  onOpenNewMatchBetween,
  onSelectPlayer,
}) => {
  const [activeView, setActiveView] = useState<'planner' | 'grid'>('planner');

  // Find player profile associated with the currently logged-in account
  const userPlayer = useMemo(() => {
    if (!currentUser) return null;
    return (
      players.find(
        (p) =>
          (currentUser.playerId && p.id === currentUser.playerId) ||
          p.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
      ) || null
    );
  }, [currentUser, players]);

  // Selected player in the schedule assistant defaults to the logged-in user's player profile
  const [selectedMyId, setSelectedMyId] = useState<string>(() => {
    return userPlayer?.id || players[0]?.id || '';
  });

  // Whenever userPlayer is loaded or updated, sync selectedMyId to the logged-in player
  useEffect(() => {
    if (userPlayer) {
      setSelectedMyId(userPlayer.id);
    } else if (players.length > 0 && !players.some((p) => p.id === selectedMyId)) {
      setSelectedMyId(players[0].id);
    }
  }, [userPlayer?.id, players]);

  const myPlayer = players.find((p) => p.id === selectedMyId) || userPlayer || players[0];

  // Helper to find all matches between 2 players
  const getDirectMatches = (p1Id: string, p2Id: string): Match[] => {
    return matches
      .filter(
        (m) =>
          (m.player1Id === p1Id && m.player2Id === p2Id) ||
          (m.player1Id === p2Id && m.player2Id === p1Id)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const findMatch = (p1Id: string, p2Id: string): Match | undefined => {
    return getDirectMatches(p1Id, p2Id)[0];
  };

  // For the selected player, split all other players into "unplayed", "scheduled", and "played"
  const otherPlayers = players.filter((p) => p.id !== selectedMyId);
  const unplayedOpponents: Player[] = [];
  const scheduledOpponents: { opponent: Player; match: Match }[] = [];
  const completedOpponents: { opponent: Player; lastMatch: Match; totalMatches: number; wonCount: number; lostCount: number }[] = [];

  const todayStr = new Date().toISOString().split('T')[0];

  otherPlayers.forEach((opp) => {
    const oppMatches = getDirectMatches(selectedMyId, opp.id);
    const scheduledMatch = oppMatches.find((m) => m.status === 'scheduled');
    const completedList = oppMatches.filter((m) => m.status === 'completed');

    if (scheduledMatch) {
      scheduledOpponents.push({ opponent: opp, match: scheduledMatch });
    }

    if (completedList.length > 0) {
      const wonCount = completedList.filter((m) => m.winnerId === selectedMyId).length;
      completedOpponents.push({
        opponent: opp,
        lastMatch: completedList[0],
        totalMatches: completedList.length,
        wonCount,
        lostCount: completedList.length - wonCount,
      });
    } else if (!scheduledMatch) {
      unplayedOpponents.push(opp);
    }
  });

  const totalPossibleMatches = otherPlayers.length;
  const completedCount = completedOpponents.length;
  const completionPercentage = totalPossibleMatches > 0 ? Math.round((completedCount / totalPossibleMatches) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Header */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-stone-900 text-base sm:text-lg flex items-center gap-2">
            <span>Umawianie Meczów & Terminarz</span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Każdy z Każdym
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Szybko sprawdź z kim jeszcze nie grałeś i skontaktuj się, by zarezerwować kort!
          </p>
        </div>

        {/* View Switcher */}
        <div className="grid grid-cols-2 sm:flex items-center p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveView('planner')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
              activeView === 'planner'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Mój Asystent
          </button>
          <button
            onClick={() => setActiveView('grid')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
              activeView === 'grid'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Macierz (Siatka)
          </button>
        </div>
      </div>

      {/* VIEW 1: PERSONAL MATCH PLANNER */}
      {activeView === 'planner' && (
        <div className="space-y-6">
          {/* Player Selection & Progress Box */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Profile Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {userPlayer && myPlayer.id === userPlayer.id ? (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>Twój profil zawodnika:</span>
                      <span className="text-[10px] bg-lime-400/20 text-lime-300 px-2 py-0.5 rounded-full font-bold border border-lime-400/30">
                        Zalogowano ({currentUser?.name})
                      </span>
                    </span>
                  ) : (
                    <span>Wybierz profil zawodnika:</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${myPlayer.avatarColor} text-white font-black text-lg flex items-center justify-center shadow-md border-2 border-lime-400/40 shrink-0`}>
                    {myPlayer.name.charAt(0)}
                  </div>
                  <select
                    id="select-my-player"
                    value={selectedMyId}
                    onChange={(e) => setSelectedMyId(e.target.value)}
                    className="bg-emerald-900/90 text-white font-bold text-base sm:text-lg px-4 py-2.5 rounded-2xl border border-emerald-700/80 focus:outline-none focus:ring-2 focus:ring-lime-400 cursor-pointer shadow-inner max-w-full"
                  >
                    {players.map((p) => {
                      const isMe = userPlayer && p.id === userPlayer.id;
                      return (
                        <option key={p.id} value={p.id} className="bg-stone-900 text-white">
                          {p.name} {p.nickname ? `(„${p.nickname}”)` : ''} {isMe ? '⭐ (Twój profil)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-xs text-emerald-300/80">
                    Preferowane godziny: <span className="text-white font-medium">{myPlayer.preferredTimes || 'Brak danych'}</span>
                  </p>
                  {userPlayer && myPlayer.id !== userPlayer.id && (
                    <button
                      type="button"
                      onClick={() => setSelectedMyId(userPlayer.id)}
                      className="text-[11px] font-bold text-lime-400 hover:text-lime-300 underline cursor-pointer"
                    >
                      ↺ Pokaż mój profil ({userPlayer.name})
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Stat */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[240px]">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 mb-2">
                  <span>Postęp meczów w lidze</span>
                  <span className="font-black text-lime-300 text-sm">{completionPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-stone-300 mt-2 font-medium">
                  <span>Rozegrano: <strong className="text-white font-bold">{completedCount}</strong> z {totalPossibleMatches}</span>
                  <span>Pozostało: <strong className="text-lime-300 font-bold">{unplayedOpponents.length + scheduledOpponents.length}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Scheduled Matches First */}
          {scheduledOpponents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">Zaplanowane spotkania ({scheduledOpponents.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduledOpponents.map(({ opponent, match }) => (
                  <div
                    key={match.id}
                    className="bg-amber-50/60 rounded-2xl p-4 border border-amber-300 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${opponent.avatarColor} text-white font-bold flex items-center justify-center shrink-0`}>
                        {opponent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 break-words leading-tight">{opponent.name}</h4>
                        <p className="text-xs text-amber-900 font-medium mt-0.5">
                          {match.date} {match.time && `o ${match.time}`} • {match.courtName || 'Kort do ustalenia'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenNewMatchBetween(selectedMyId, opponent.id, false)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                    >
                      Wpisz wynik
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Unplayed Opponents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  Rywale do rozegrania w tym sezonie ({unplayedOpponents.length})
                </h3>
              </div>
              <span className="text-xs text-stone-500">
                Skontaktuj się i zaproponuj termin meczu
              </span>
            </div>

            {unplayedOpponents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unplayedOpponents.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top: Opponent Name & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          onClick={() => onSelectPlayer(opp)}
                          className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
                        >
                          <div className={`w-10 h-10 rounded-xl ${opp.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                            {opp.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors break-words leading-tight">
                              {opp.name}
                            </h4>
                            {opp.playStyle && (
                              <span className="text-xs text-stone-400 block truncate">
                                {opp.playStyle}
                              </span>
                            )}
                          </div>
                        </div>

                        {opp.status === 'injured' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold shrink-0">
                            Kontuzja
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                            Gotowy do gry
                          </span>
                        )}
                      </div>

                      {/* Opponent Availability Details */}
                      {(() => {
                        const hasTimes = Boolean(opp.preferredTimes?.trim());
                        const hasCourts = Boolean(opp.preferredCourts?.trim());
                        if (!hasTimes && !hasCourts) return null;

                        return (
                          <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl mb-3 border border-stone-200/40">
                            {hasTimes && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span className="truncate">{opp.preferredTimes}</span>
                              </div>
                            )}
                            {hasCourts && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span className="truncate">{opp.preferredCourts}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action Bar: Call, WhatsApp, Match Score / Schedule */}
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${opp.phone.replace(/\s+/g, '')}`}
                          className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors"
                          title="Zadzwoń do rywala"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Zadzwoń</span>
                        </a>

                        <a
                          href={`https://wa.me/${opp.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Cześć ${opp.name.split(' ')[0]}! Gramy w Lidze Tenisowej. Kiedy masz czas zagrać nasz mecz?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-200 text-xs font-bold transition-colors"
                          title="Napisz na WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onOpenNewMatchBetween(selectedMyId, opp.id, true)}
                          className="min-h-[40px] inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span>Termin</span>
                        </button>
                        <button
                          onClick={() => onOpenNewMatchBetween(selectedMyId, opp.id, false)}
                          className="min-h-[40px] inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                          <span>Wynik</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-950 text-base">Gratulacje! Rozegrałeś mecze ze wszystkimi rywalami!</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Komplet spotkań w tej edycji ligi został wypełniony. Sprawdź tabelę, aby zobaczyć swoją ostateczną lokatę!
                </p>
              </div>
            )}
          </div>

          {/* Section: Already Completed Matches */}
          {completedOpponents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">
                  Rozegrane mecze ({completedOpponents.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedOpponents.map(({ opponent, lastMatch, totalMatches, wonCount, lostCount }) => {
                  const rematchStatus = checkRematchEligibility(selectedMyId, opponent.id, todayStr, matches);
                  const isLastFriendly = lastMatch.isFriendly || lastMatch.matchType === 'friendly';
                  const isWon = lastMatch.winnerId === selectedMyId;

                  return (
                    <div
                      key={opponent.id}
                      className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Opponent info & last match result badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div
                            onClick={() => onSelectPlayer(opponent)}
                            className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
                          >
                            <div className={`w-10 h-10 rounded-xl ${opponent.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                              {opponent.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors break-words leading-tight">
                                {opponent.name}
                              </h4>
                              <span className="text-xs text-stone-500 font-semibold block">
                                Bilans: {wonCount}W - {lostCount}P {totalMatches > 1 ? `(${totalMatches} mecze)` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isWon ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'
                              }`}
                            >
                              {isWon ? 'Wygrana' : 'Porażka'}
                            </span>
                            {isLastFriendly && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                                Towarzyski
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Last match score info */}
                        <div className="bg-stone-50 p-2.5 rounded-xl text-xs text-stone-600 mb-3 border border-stone-200/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-stone-500">Ostatni mecz ({lastMatch.date}):</span>
                            <span className="font-mono font-bold text-stone-900">
                              {formatMatchScore(lastMatch.sets)}
                            </span>
                          </div>
                          <div className="pt-1 border-t border-stone-200/60">
                            {rematchStatus.isFriendly ? (
                              <p className="text-[11px] text-amber-900 font-medium">
                                ⏳ Kolejny mecz ligowy możliwy od: <strong>{formatDatePl(rematchStatus.nextAllowedDate || '')}</strong> (wcześniejszy mecz będzie Towarzyski).
                              </p>
                            ) : (
                              <p className="text-[11px] text-emerald-800 font-semibold">
                                ✅ Minęły 2 miesiące kalendarzowe — możecie rozegrać kolejny mecz ligowy!
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                        <button
                          onClick={() => onOpenNewMatchBetween(selectedMyId, opponent.id, false)}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            rematchStatus.isFriendly
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{rematchStatus.isFriendly ? 'Mecz towarzyski' : 'Rewanż ligowy'}</span>
                        </button>

                        <button
                          onClick={() => onOpenNewMatchBetween(selectedMyId, opponent.id, true)}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-stone-600" />
                          <span>Zaplanuj</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 15x15 GRID MATRIX */}
      {activeView === 'grid' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 overflow-hidden">
          <div className="mb-3">
            <h3 className="font-bold text-stone-900 text-base">Siatka Spotkań Ligi (Każdy z Każdym)</h3>
            <p className="text-xs text-stone-500">
              Zielone pole = wygrana gracza z wiersza • Czerwone = porażka • Zegar = mecz zaplanowany • Plus = kliknij, by wpisać wynik lub umówić mecz
            </p>
          </div>

          <div className="overflow-x-auto w-full max-w-full overscroll-x-contain">
            <table className="border-collapse text-center text-xs">
              <thead>
                <tr>
                  <th className="p-2.5 text-left font-bold text-stone-600 bg-stone-100 rounded-tl-xl sticky left-0 z-20 min-w-[160px] sm:min-w-[200px] whitespace-nowrap">
                    Zawodnik
                  </th>
                  {players.map((p) => (
                    <th
                      key={p.id}
                      className="p-2 font-bold text-stone-700 bg-stone-100 min-w-[54px] max-w-[64px] border-b border-stone-200"
                      title={p.name}
                    >
                      <div className="truncate text-[11px] font-mono">
                        {p.name.split(' ')[0].slice(0, 4)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((rowPlayer) => {
                  const isUserRow = userPlayer && rowPlayer.id === userPlayer.id;
                  return (
                    <tr key={rowPlayer.id} className={`border-b border-stone-100 ${isUserRow ? 'bg-lime-50/60' : 'hover:bg-stone-50/60'}`}>
                      <td
                        onClick={() => onSelectPlayer(rowPlayer)}
                        className={`p-2.5 text-left font-bold ${isUserRow ? 'text-emerald-950 bg-lime-50 border-r-2 border-r-lime-600' : 'text-stone-900 bg-white hover:text-emerald-700 border-r border-stone-200'} transition-colors sticky left-0 z-10 whitespace-nowrap cursor-pointer`}
                        title={rowPlayer.name}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{rowPlayer.name}</span>
                          {isUserRow && (
                            <span className="text-[9px] bg-emerald-800 text-lime-300 px-1.5 py-0.5 rounded font-extrabold uppercase">
                              Ty
                            </span>
                          )}
                        </div>
                      </td>

                    {players.map((colPlayer) => {
                      if (rowPlayer.id === colPlayer.id) {
                        return (
                          <td key={colPlayer.id} className="p-2 bg-stone-200/60 text-stone-400 font-mono">
                            -
                          </td>
                        );
                      }

                      const match = findMatch(rowPlayer.id, colPlayer.id);

                      if (!match) {
                        return (
                          <td
                            key={colPlayer.id}
                            onClick={() => onOpenNewMatchBetween(rowPlayer.id, colPlayer.id)}
                            className="p-2 hover:bg-lime-100 transition-colors cursor-pointer border border-stone-100 text-stone-300 hover:text-emerald-700 font-bold"
                            title={`Wpisz wynik: ${rowPlayer.name} vs ${colPlayer.name}`}
                          >
                            +
                          </td>
                        );
                      }

                      if (match.status === 'scheduled') {
                        return (
                          <td
                            key={colPlayer.id}
                            onClick={() => onOpenNewMatchBetween(rowPlayer.id, colPlayer.id)}
                            className="p-2 bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer font-bold"
                            title={`Mecz zaplanowany: ${match.date}`}
                          >
                            ⏳
                          </td>
                        );
                      }

                      // Completed match: check rowPlayer result
                      const rowPlayerWon = match.winnerId === rowPlayer.id;
                      const setsWon = match.sets.filter((s) =>
                        match.player1Id === rowPlayer.id ? s.games1 > s.games2 : s.games2 > s.games1
                      ).length;
                      const setsLost = match.sets.filter((s) =>
                        match.player1Id === rowPlayer.id ? s.games2 > s.games1 : s.games1 > s.games2
                      ).length;

                      return (
                        <td
                          key={colPlayer.id}
                          className={`p-1.5 border font-bold text-[11px] font-mono ${
                            rowPlayerWon
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-200'
                              : 'bg-rose-100 text-rose-950 border-rose-200'
                          }`}
                          title={`${rowPlayer.name} vs ${colPlayer.name}: ${formatMatchScore(match.sets)}`}
                        >
                          {setsWon}:{setsLost}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
