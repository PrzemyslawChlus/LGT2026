import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  PlayCircle,
  Plus,
  X,
  AlertTriangle,
  Swords,
  ArrowRight,
  ArrowUpDown,
} from 'lucide-react';
import { Match, Player } from '../types';
import {
  formatSetScore,
  SURFACE_NAMES,
} from '../utils/tennisRules';

interface MatchesListProps {
  matches: Match[];
  players: Player[];
  onOpenNewMatch: () => void;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onCompleteScheduledMatch: (match: Match) => void;
  onSelectPlayer: (player: Player) => void;
}

export const MatchesList: React.FC<MatchesListProps> = ({
  matches,
  players,
  onOpenNewMatch,
  onEditMatch,
  onDeleteMatch,
  onCompleteScheduledMatch,
  onSelectPlayer,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'friendly' | 'scheduled'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [selectedSurface, setSelectedSurface] = useState<string>('all');
  const [scheduledSortOrder, setScheduledSortOrder] = useState<'closest' | 'furthest' | 'newest'>('closest');
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  // Global counts for filter tabs
  const scheduledCount = matches.filter((m) => m.status === 'scheduled').length;
  const friendlyCount = matches.filter((m) => m.isFriendly || m.matchType === 'friendly').length;
  const completedCount = matches.filter((m) => m.status === 'completed' && !m.isFriendly && m.matchType !== 'friendly').length;

  // Filter predicate based on player and surface
  const matchesBaseFilter = (m: Match) => {
    if (selectedPlayerId !== 'all' && m.player1Id !== selectedPlayerId && m.player2Id !== selectedPlayerId) {
      return false;
    }
    if (selectedSurface !== 'all' && m.surface !== selectedSurface) {
      return false;
    }
    return true;
  };

  // 1. Scheduled matches (sorted closest date first by default, with custom sort options)
  const scheduledMatchesRaw = matches.filter((m) => m.status === 'scheduled' && matchesBaseFilter(m));
  const scheduledMatches = [...scheduledMatchesRaw].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '12:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || '12:00'}`).getTime();

    if (scheduledSortOrder === 'closest') {
      // W pierwszej kolejności wyświetlane najbliższe mecze (od najbliższego terminu do najdalszego)
      return timeA - timeB || (a.createdAt || 0) - (b.createdAt || 0);
    } else if (scheduledSortOrder === 'furthest') {
      // Od najdalszego terminu do najbliższego
      return timeB - timeA || (b.createdAt || 0) - (a.createdAt || 0);
    } else {
      // Ostatnio dodane (data utworzenia wpisu)
      return (b.createdAt || 0) - (a.createdAt || 0) || timeA - timeB;
    }
  });

  // 2. Completed matches: reverse chronological (newest completed match first)
  const completedMatchesRaw = matches.filter((m) => {
    if (m.status !== 'completed') return false;
    if (!matchesBaseFilter(m)) return false;
    if (statusFilter === 'completed' && (m.isFriendly || m.matchType === 'friendly')) return false;
    if (statusFilter === 'friendly' && !m.isFriendly && m.matchType !== 'friendly') return false;
    return true;
  });

  const completedMatches = [...completedMatchesRaw].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '12:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || '12:00'}`).getTime();
    return timeB - timeA || (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Helper to compute H2H context between any two players
  const getH2HSummary = (player1Id: string, player2Id: string) => {
    const directCompleted = matches.filter(
      (m) =>
        m.status === 'completed' &&
        ((m.player1Id === player1Id && m.player2Id === player2Id) ||
          (m.player1Id === player2Id && m.player2Id === player1Id))
    );
    if (directCompleted.length === 0) {
      return { played: 0, text: 'Pierwsze bezpośrednie starcie w sezonie' };
    }
    const p1Wins = directCompleted.filter((m) => m.winnerId === player1Id).length;
    const p2Wins = directCompleted.filter((m) => m.winnerId === player2Id).length;
    return {
      played: directCompleted.length,
      p1Wins,
      p2Wins,
      text: `Bilans H2H: ${p1Wins} - ${p2Wins} (${directCompleted.length} ${
        directCompleted.length === 1 ? 'mecz' : directCompleted.length < 5 ? 'mecze' : 'meczów'
      })`,
    };
  };

  // Render a specialized card for upcoming/scheduled matches
  const renderScheduledCard = (match: Match) => {
    const p1 = playerMap.get(match.player1Id);
    const p2 = playerMap.get(match.player2Id);
    if (!p1 || !p2) return null;

    const surfaceInfo = match.surface ? SURFACE_NAMES[match.surface] : null;
    const h2h = getH2HSummary(p1.id, p2.id);

    return (
      <div
        key={match.id}
        className="bg-white rounded-2xl shadow-xs border border-amber-300/80 bg-gradient-to-b from-white to-amber-50/20 p-3.5 sm:p-4 flex flex-col justify-between w-full min-w-0 overflow-hidden"
      >
        <div className="w-full min-w-0">
          {/* Header row: Date, Time, Surface, Status */}
          <div className="pb-3 border-b border-stone-100 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span className="flex items-center gap-1.5 font-semibold text-stone-800 text-xs sm:text-sm shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
                  <span>{match.date}</span>
                </span>
                {match.time && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md text-xs font-bold border border-stone-200 shrink-0">
                    <Clock className="w-3 h-3 text-stone-500 shrink-0" />
                    <span>{match.time}</span>
                  </span>
                )}
                {match.isFriendly && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 border border-amber-400 uppercase tracking-wider shrink-0">
                    Towarzyski
                  </span>
                )}
              </div>

              <span className="text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                Zaplanowany
              </span>
            </div>

            {/* Court name and Surface badge */}
            {(match.courtName || surfaceInfo) && (
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500 pt-0.5 min-w-0">
                <div className="min-w-0 flex-1">
                  {match.courtName ? (
                    <span className="flex items-center gap-1 text-stone-600 font-medium truncate" title={match.courtName}>
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{match.courtName}</span>
                    </span>
                  ) : (
                    <span />
                  )}
                </div>

                {surfaceInfo && (
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${surfaceInfo.bg} ${surfaceInfo.text} ${surfaceInfo.border}`}
                  >
                    {surfaceInfo.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Players Matchup Block */}
          <div className="py-3 my-2 bg-stone-50/80 rounded-2xl p-2.5 sm:p-3 border border-stone-200/70 space-y-2.5">
            <div className="flex items-center justify-between gap-2 min-w-0">
              {/* Player 1 */}
              <div
                onClick={() => onSelectPlayer(p1)}
                className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${p1.avatarColor} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                  {p1.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 text-xs sm:text-sm truncate leading-tight">
                    {p1.name}
                  </p>
                  {p1.nickname && (
                    <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium truncate">
                      „{p1.nickname}”
                    </p>
                  )}
                </div>
              </div>

              {/* VS Divider */}
              <div className="shrink-0 px-1">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] sm:text-xs font-black flex items-center justify-center shadow-2xs">
                  VS
                </span>
              </div>

              {/* Player 2 */}
              <div
                onClick={() => onSelectPlayer(p2)}
                className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 justify-end text-right cursor-pointer hover:opacity-85 transition-opacity"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 text-xs sm:text-sm truncate leading-tight">
                    {p2.name}
                  </p>
                  {p2.nickname && (
                    <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium truncate">
                      „{p2.nickname}”
                    </p>
                  )}
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${p2.avatarColor} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                  {p2.name.charAt(0)}
                </div>
              </div>
            </div>

            {/* Direct H2H Info */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1 font-medium truncate">
                <Swords className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{h2h.text}</span>
              </span>
              <span className="font-bold text-amber-900 text-[10px] shrink-0">
                Terminarz Ligi
              </span>
            </div>
          </div>

          {/* Notes if present */}
          {match.notes && (
            <p className="text-xs text-stone-600 italic bg-amber-50/50 p-2 sm:p-2.5 rounded-xl mb-3 border border-amber-200/50 break-words">
              💬 „{match.notes}”
            </p>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 min-w-0">
          <button
            onClick={() => onCompleteScheduledMatch(match)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 active:scale-[0.98] text-emerald-950 text-xs sm:text-sm font-black shadow-xs cursor-pointer min-h-[40px] shrink-0"
          >
            <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950 shrink-0" />
            <span>Wpisz wynik</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
            <button
              onClick={() => onEditMatch(match)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-400 hover:text-emerald-700 hover:bg-stone-100 active:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              title="Edytuj termin lub kort"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setMatchToDelete(match)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              title="Usuń zaplanowany mecz"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render a standard card for completed matches
  const renderCompletedCard = (match: Match) => {
    const p1 = playerMap.get(match.player1Id);
    const p2 = playerMap.get(match.player2Id);
    if (!p1 || !p2) return null;

    const p1Won = match.winnerId === p1.id;
    const p2Won = match.winnerId === p2.id;
    const surfaceInfo = match.surface ? SURFACE_NAMES[match.surface] : null;

    const p1SetsWon = match.sets.filter((s) => s.games1 > s.games2).length;
    const p2SetsWon = match.sets.filter((s) => s.games2 > s.games1).length;

    return (
      <div
        key={match.id}
        className="bg-white rounded-2xl shadow-xs border border-stone-200 hover:shadow-md transition-all p-3.5 sm:p-4 flex flex-col justify-between w-full min-w-0 overflow-hidden"
      >
        <div className="w-full min-w-0">
          {/* Header Meta: Date, Time, Court, Surface, Status */}
          <div className="pb-3 border-b border-stone-100 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span className="flex items-center gap-1.5 font-semibold text-stone-800 text-xs sm:text-sm shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
                  <span>{match.date}</span>
                </span>
                {match.time && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md text-xs font-bold border border-stone-200 shrink-0">
                    <Clock className="w-3 h-3 text-stone-500 shrink-0" />
                    <span>{match.time}</span>
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                {(match.isFriendly || match.matchType === 'friendly') && (
                  <span
                    title={match.friendlyReason || 'Mecz towarzyski – reguła 2 miesięcy odstępu (brak punktów do tabeli)'}
                    className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 border border-amber-400 uppercase tracking-wider shrink-0 cursor-help"
                  >
                    Towarzyski
                  </span>
                )}
                <span className="text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                  {p1SetsWon}:{p2SetsWon} w setach
                </span>
              </div>
            </div>

            {/* Court name & Surface badge */}
            {(match.courtName || surfaceInfo) && (
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500 pt-0.5 min-w-0">
                <div className="min-w-0 flex-1">
                  {match.courtName ? (
                    <span className="flex items-center gap-1 text-stone-500 truncate text-xs" title={match.courtName}>
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{match.courtName}</span>
                    </span>
                  ) : (
                    <span />
                  )}
                </div>

                {surfaceInfo && (
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${surfaceInfo.bg} ${surfaceInfo.text} ${surfaceInfo.border}`}
                  >
                    {surfaceInfo.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Score Board */}
          <div className="py-3 space-y-2 w-full min-w-0">
            {/* Player 1 Row */}
            <div
              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-colors min-w-0 ${
                p1Won ? 'bg-emerald-50/80 font-bold' : 'hover:bg-stone-50'
              }`}
            >
              <div
                onClick={() => onSelectPlayer(p1)}
                className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer flex-1 mr-2"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${p1.avatarColor} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0`}>
                  {p1.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                    <span className={`text-sm sm:text-base font-semibold truncate ${p1Won ? 'text-emerald-950 font-extrabold' : 'text-stone-800'}`}>
                      {p1.name}
                    </span>
                    {p1.nickname && (
                      <span className="text-[11px] sm:text-xs text-stone-400 font-medium">
                        „{p1.nickname}”
                      </span>
                    )}
                  </div>
                  {p1Won && (
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Zwycięzca
                    </span>
                  )}
                </div>
              </div>

              {/* Set Scores for P1 */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {match.sets.map((s, idx) => (
                  <div
                    key={idx}
                    className={`w-8 sm:w-9 md:w-10 text-center py-1 sm:py-1.5 rounded-lg text-sm sm:text-base font-mono font-bold shrink-0 ${
                      s.games1 > s.games2
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {s.isSuperTiebreak ? `[${s.games1}]` : s.games1}
                    {((s.games1 === 7 && s.games2 === 6) || (s.games1 === 6 && s.games2 === 7)) && (
                      <span className="text-[9px] sm:text-[10px] block leading-none opacity-80 mt-0.5">
                        ({s.tiebreak1})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Player 2 Row */}
            <div
              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-colors min-w-0 ${
                p2Won ? 'bg-emerald-50/80 font-bold' : 'hover:bg-stone-50'
              }`}
            >
              <div
                onClick={() => onSelectPlayer(p2)}
                className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer flex-1 mr-2"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${p2.avatarColor} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0`}>
                  {p2.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                    <span className={`text-sm sm:text-base font-semibold truncate ${p2Won ? 'text-emerald-950 font-extrabold' : 'text-stone-800'}`}>
                      {p2.name}
                    </span>
                    {p2.nickname && (
                      <span className="text-[11px] sm:text-xs text-stone-400 font-medium">
                        „{p2.nickname}”
                      </span>
                    )}
                  </div>
                  {p2Won && (
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Zwycięzca
                    </span>
                  )}
                </div>
              </div>

              {/* Set Scores for P2 */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {match.sets.map((s, idx) => (
                  <div
                    key={idx}
                    className={`w-8 sm:w-9 md:w-10 text-center py-1 sm:py-1.5 rounded-lg text-sm sm:text-base font-mono font-bold shrink-0 ${
                      s.games2 > s.games1
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {s.isSuperTiebreak ? `[${s.games2}]` : s.games2}
                    {((s.games1 === 7 && s.games2 === 6) || (s.games1 === 6 && s.games2 === 7)) && (
                      <span className="text-[9px] sm:text-[10px] block leading-none opacity-80 mt-0.5">
                        ({s.tiebreak2})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Match Notes / Commentary */}
          {match.notes && (
            <p className="text-xs sm:text-sm text-stone-600 italic bg-stone-50 p-2.5 sm:p-3 rounded-xl mb-3 border border-stone-200/50 break-words">
              „{match.notes}”
            </p>
          )}

          {/* Friendly match info notice */}
          {(match.isFriendly || match.matchType === 'friendly') && (
            <div className="text-[11px] text-amber-950 bg-amber-50/90 p-2.5 rounded-xl mb-3 border border-amber-200/90 flex items-start gap-1.5">
              <span className="shrink-0 font-extrabold text-amber-800">ℹ️ Mecz Towarzyski:</span>
              <span className="leading-snug text-stone-700">
                {match.friendlyReason || 'Odstęp krótszy niż 2 miesiące kalendarzowe od poprzedniego meczu (brak punktów do tabeli).'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 min-w-0">
          <div className="text-xs text-stone-500 font-medium truncate min-w-0 flex-1 mr-2">
            Wynik: <strong className="text-stone-800 text-xs sm:text-sm">{match.sets.map(formatSetScore).join(', ')}</strong>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
            <button
              onClick={() => onEditMatch(match)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-400 hover:text-emerald-700 hover:bg-stone-100 active:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              title="Edytuj mecz"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setMatchToDelete(match)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              title="Usuń mecz"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 w-full min-w-0 max-w-full">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-stone-200 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-3.5 w-full min-w-0">
        {/* Status Pills */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap md:flex-nowrap items-center gap-1 sm:gap-1.5 p-1 bg-stone-100 rounded-xl w-full xl:w-auto min-w-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center cursor-pointer min-h-[40px] flex items-center justify-center whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Wszystkie ({matches.length})
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'scheduled'
                ? 'bg-amber-400 text-amber-950 font-black shadow-xs ring-1 ring-amber-500'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span>Nadchodzące ({scheduledCount})</span>
            {scheduledCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse shrink-0" />
            )}
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center cursor-pointer min-h-[40px] flex items-center justify-center whitespace-nowrap ${
              statusFilter === 'completed' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ligowe ({completedCount})
          </button>
          <button
            onClick={() => setStatusFilter('friendly')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center cursor-pointer min-h-[40px] flex items-center justify-center gap-1 whitespace-nowrap ${
              statusFilter === 'friendly' ? 'bg-white text-amber-950 shadow-xs ring-1 ring-amber-300' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Towarzyskie ({friendlyCount})</span>
            {friendlyCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
          </button>
        </div>

        {/* Dropdowns Filter & Add Action */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto min-w-0">
          {/* Player Filter */}
          <div className="min-w-0 w-full sm:w-48 xl:w-52">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full max-w-full px-3 py-2 text-xs sm:text-sm font-medium bg-stone-50 hover:bg-stone-100/80 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px] truncate transition-colors cursor-pointer box-border"
            >
              <option value="all">Wszyscy gracze</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.nickname ? `(„${p.nickname}”)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Surface Filter */}
          <div className="min-w-0 w-full sm:w-40 xl:w-44">
            <select
              value={selectedSurface}
              onChange={(e) => setSelectedSurface(e.target.value)}
              className="w-full max-w-full px-3 py-2 text-xs sm:text-sm font-medium bg-stone-50 hover:bg-stone-100/80 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px] truncate transition-colors cursor-pointer box-border"
            >
              <option value="all">Wszystkie nawierzchnie</option>
              <option value="clay">Mączka (cegła)</option>
              <option value="hard">Kort twardy (hard)</option>
              <option value="grass">Trawa</option>
              <option value="carpet">Hala / Dywan</option>
            </select>
          </div>

          {/* Clear filters button if active */}
          {(selectedPlayerId !== 'all' || selectedSurface !== 'all') && (
            <button
              onClick={() => {
                setSelectedPlayerId('all');
                setSelectedSurface('all');
              }}
              title="Wyczyść aktywne filtry"
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 min-h-[40px] text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>Wyczyść</span>
            </button>
          )}

          {/* Add Match Button */}
          <button
            onClick={onOpenNewMatch}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs shrink-0 whitespace-nowrap ml-auto xl:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj mecz</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {statusFilter === 'scheduled' ? (
        /* ================= TAB: NADCHODZĄCE (SCHEDULED ONLY) ================= */
        <div className="space-y-4">
          {/* Header Info Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Clock className="w-5 h-5 text-amber-950" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2 flex-wrap">
                  <span>Terminarz Nadchodzących Meczów</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-300/80 text-amber-950 font-black">
                    {scheduledMatches.length}
                  </span>
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Spotkania zaplanowane w lidze oczekujące na rozegranie i wprowadzenie wyniku.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              {/* Sort Selector for upcoming matches */}
              <div className="flex items-center gap-1.5 bg-white border border-amber-300/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <label htmlFor="scheduled-sort-select" className="text-xs font-bold text-stone-700 whitespace-nowrap">
                  Sortuj:
                </label>
                <select
                  id="scheduled-sort-select"
                  value={scheduledSortOrder}
                  onChange={(e) => setScheduledSortOrder(e.target.value as 'closest' | 'furthest' | 'newest')}
                  className="text-xs font-bold text-stone-900 bg-transparent focus:outline-none cursor-pointer pr-1"
                >
                  <option value="closest">Najbliższe mecze (od najbliższego)</option>
                  <option value="furthest">Najdalsze terminy (od najdalszego)</option>
                  <option value="newest">Ostatnio dodane</option>
                </select>
              </div>

              <button
                onClick={onOpenNewMatch}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Zaplanuj spotkanie</span>
              </button>
            </div>
          </div>

          {/* Scheduled Matches Grid */}
          {scheduledMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
              {scheduledMatches.map((match) => renderScheduledCard(match))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-800">Brak zaplanowanych spotkań</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Wszystkie nowe mecze dodane ze statusem „Zaplanowany” pojawią się tutaj.
              </p>
              <button
                onClick={onOpenNewMatch}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Zaplanuj pierwsze spotkanie</span>
              </button>
            </div>
          )}
        </div>
      ) : statusFilter === 'all' ? (
        /* ================= TAB: WSZYSTKIE ================= */
        <div className="space-y-6">
          {/* Section 1: Nadchodzące mecze */}
          {scheduledMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                    <span>Nadchodzące mecze</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900">
                      {scheduledMatches.length}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                  {/* Sort Selector for upcoming matches */}
                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1 shadow-2xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-semibold text-stone-600 hidden sm:inline">Sortuj:</span>
                    <select
                      value={scheduledSortOrder}
                      onChange={(e) => setScheduledSortOrder(e.target.value as 'closest' | 'furthest' | 'newest')}
                      className="text-xs font-bold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="closest">Najbliższe mecze</option>
                      <option value="furthest">Najdalsze terminy</option>
                      <option value="newest">Ostatnio dodane</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setStatusFilter('scheduled')}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <span>Zobacz terminarz</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                {scheduledMatches.map((match) => renderScheduledCard(match))}
              </div>
            </div>
          )}

          {/* Section 2: Rozegrane mecze (Newest First) */}
          {completedMatches.length > 0 && (
            <div className={`space-y-3 ${scheduledMatches.length > 0 ? 'pt-3 border-t border-stone-200' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                    <span>Rozegrane mecze</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                      {completedMatches.length}
                    </span>
                  </h3>
                  <span className="hidden sm:inline-block text-xs font-medium text-stone-500">
                    • Ostatnio rozegrane spotkania
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                {completedMatches.map((match) => renderCompletedCard(match))}
              </div>
            </div>
          )}

          {/* Empty state if both are empty */}
          {scheduledMatches.length === 0 && completedMatches.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
              <Trophy className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">Brak meczów spełniających kryteria</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Zmień filtry lub dodaj nowy mecz do bazy rozgrywek ligowych.
              </p>
              <button
                onClick={onOpenNewMatch}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj pierwszy mecz</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= TABS: LIGOWE / TOWARZYSKIE ================= */
        <div className="space-y-4">
          {completedMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
              {completedMatches.map((match) => renderCompletedCard(match))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
              <Trophy className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">Brak meczów w tej kategorii</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                {statusFilter === 'friendly'
                  ? 'Brak rozegranych meczów towarzyskich. Mecze towarzyskie to spotkania rozegrane przed upływem 2 miesięcy kalendarzowych z tym samym rywalem.'
                  : 'Brak zarejestrowanych meczów ligowych spełniających wybrane kryteria.'}
              </p>
              <button
                onClick={onOpenNewMatch}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj mecz</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Delete Confirmation Modal */}
      {matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <button
                onClick={() => setMatchToDelete(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-black text-stone-900 mb-1">
              Usunąć ten mecz?
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Czy na pewno chcesz usunąć to spotkanie z bazy ligowej? Wszelkie punkty w tabeli oraz statystyki H2H zostaną natychmiast automatycznie przeliczone.
            </p>

            {/* Match details card */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-stone-900">
                <span className="truncate">{playerMap.get(matchToDelete.player1Id)?.name || 'Gracz 1'}</span>
                <span className="text-stone-400 px-2">vs</span>
                <span className="truncate">{playerMap.get(matchToDelete.player2Id)?.name || 'Gracz 2'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1.5 border-t border-stone-200/60">
                <span>Data: {matchToDelete.date}</span>
                <span className="font-semibold text-stone-700">
                  {matchToDelete.status === 'completed'
                    ? `Wynik: ${matchToDelete.sets?.map(formatSetScore).join(', ') || '-'}`
                    : 'Mecz zaplanowany'}
                </span>
              </div>
              {(matchToDelete.isFriendly || matchToDelete.matchType === 'friendly') && (
                <div className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded inline-block">
                  Mecz Towarzyski
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMatchToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = matchToDelete.id;
                  setMatchToDelete(null);
                  onDeleteMatch(id);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Tak, usuń mecz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

