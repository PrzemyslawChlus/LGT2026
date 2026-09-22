import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, Calendar, Clock, MapPin, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Match, Player, TennisSet, CourtSurface, LeagueSettings } from '../types';
import { validateMatch, validateSet, checkRematchEligibility, formatDatePl } from '../utils/tennisRules';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: Match) => void;
  onDelete?: (matchId: string) => void;
  players: Player[];
  matches: Match[];
  editingMatch?: Match | null;
  initialPlayer1Id?: string;
  initialPlayer2Id?: string;
  initialScheduled?: boolean;
  settings: LeagueSettings;
}

interface FormSetState {
  games1: string;
  games2: string;
  tiebreak1: string;
  tiebreak2: string;
  isSuperTiebreak?: boolean;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  players,
  matches,
  editingMatch,
  initialPlayer1Id,
  initialPlayer2Id,
  initialScheduled = false,
  settings,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isScheduled, setIsScheduled] = useState<boolean>(() => {
    if (initialScheduled !== undefined) return initialScheduled;
    if (editingMatch) return editingMatch.status === 'scheduled';
    return false;
  });
  const [player1Id, setPlayer1Id] = useState<string>(
    editingMatch?.player1Id || initialPlayer1Id || (players[0]?.id ?? '')
  );
  const [player2Id, setPlayer2Id] = useState<string>(
    editingMatch?.player2Id || initialPlayer2Id || (players[1]?.id ?? '')
  );
  const [date, setDate] = useState<string>(
    editingMatch?.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(editingMatch?.time || '18:00');
  const [courtName, setCourtName] = useState<string>(editingMatch?.courtName || '');
  const [surface, setSurface] = useState<CourtSurface>(editingMatch?.surface || 'clay');
  const [notes, setNotes] = useState<string>(editingMatch?.notes || '');
  const [formError, setFormError] = useState<string | null>(null);

  // Sprawdzenie reguły 2 miesięcy odstępu pomiędzy meczami ligowymi z tym samym rywalem
  const rematchCheck = checkRematchEligibility(player1Id, player2Id, date, matches || [], editingMatch?.id);
  const isFriendlyMatch = Boolean(editingMatch?.isFriendly || rematchCheck.isFriendly);

  const isEditingCompleted = Boolean(
    editingMatch && editingMatch.status === 'completed' && editingMatch.sets && editingMatch.sets.length > 0
  );

  // Sets state: strictly blank by default when entering a match result
  const [set1, setSet1] = useState<FormSetState>(() => {
    if (isEditingCompleted && editingMatch?.sets[0]) {
      const s = editingMatch.sets[0];
      return {
        games1: String(s.games1),
        games2: String(s.games2),
        tiebreak1: s.tiebreak1 !== undefined ? String(s.tiebreak1) : '',
        tiebreak2: s.tiebreak2 !== undefined ? String(s.tiebreak2) : '',
        isSuperTiebreak: false,
      };
    }
    return { games1: '', games2: '', tiebreak1: '', tiebreak2: '', isSuperTiebreak: false };
  });

  const [set2, setSet2] = useState<FormSetState>(() => {
    if (isEditingCompleted && editingMatch?.sets[1]) {
      const s = editingMatch.sets[1];
      return {
        games1: String(s.games1),
        games2: String(s.games2),
        tiebreak1: s.tiebreak1 !== undefined ? String(s.tiebreak1) : '',
        tiebreak2: s.tiebreak2 !== undefined ? String(s.tiebreak2) : '',
        isSuperTiebreak: false,
      };
    }
    return { games1: '', games2: '', tiebreak1: '', tiebreak2: '', isSuperTiebreak: false };
  });

  const [set3, setSet3] = useState<FormSetState>(() => {
    if (isEditingCompleted && editingMatch?.sets[2]) {
      const s = editingMatch.sets[2];
      return {
        games1: String(s.games1),
        games2: String(s.games2),
        tiebreak1: s.tiebreak1 !== undefined ? String(s.tiebreak1) : '',
        tiebreak2: s.tiebreak2 !== undefined ? String(s.tiebreak2) : '',
        isSuperTiebreak: s.isSuperTiebreak ?? settings.superTiebreakDecider,
      };
    }
    return {
      games1: '',
      games2: '',
      tiebreak1: '',
      tiebreak2: '',
      isSuperTiebreak: settings.superTiebreakDecider,
    };
  });

  const [useSuperTiebreak, setUseSuperTiebreak] = useState<boolean>(
    editingMatch?.sets[2]?.isSuperTiebreak ?? settings.superTiebreakDecider
  );

  // Sync player 2 if same as player 1
  useEffect(() => {
    if (player1Id === player2Id && players.length > 1) {
      const different = players.find((p) => p.id !== player1Id);
      if (different) setPlayer2Id(different.id);
    }
  }, [player1Id, player2Id, players]);

  const p1 = players.find((p) => p.id === player1Id);
  const p2 = players.find((p) => p.id === player2Id);

  // Helper to parse string form sets into TennisSet
  const parseFormSet = (s: FormSetState, defaultSuper: boolean = false): { parsed: TennisSet | null; reason?: string } => {
    const trimmed1 = s.games1.trim();
    const trimmed2 = s.games2.trim();
    if (trimmed1 === '' || trimmed2 === '') {
      return { parsed: null, reason: 'Wpisz gemy dla obu graczy' };
    }
    const g1 = parseInt(trimmed1, 10);
    const g2 = parseInt(trimmed2, 10);
    if (isNaN(g1) || isNaN(g2)) {
      return { parsed: null, reason: 'Nieprawidłowy format gemów' };
    }
    const tb1 = s.tiebreak1.trim() !== '' ? parseInt(s.tiebreak1, 10) : undefined;
    const tb2 = s.tiebreak2.trim() !== '' ? parseInt(s.tiebreak2, 10) : undefined;

    return {
      parsed: {
        games1: g1,
        games2: g2,
        tiebreak1: tb1 !== undefined && !isNaN(tb1) ? tb1 : undefined,
        tiebreak2: tb2 !== undefined && !isNaN(tb2) ? tb2 : undefined,
        isSuperTiebreak: s.isSuperTiebreak ?? defaultSuper,
      },
    };
  };

  // Determine set validations
  const p1Set = parseFormSet(set1, false);
  const val1 = p1Set.parsed ? validateSet(p1Set.parsed) : { isValid: false, winner: null, reason: p1Set.reason };

  const p2Set = parseFormSet(set2, false);
  const val2 = p2Set.parsed ? validateSet(p2Set.parsed) : { isValid: false, winner: null, reason: p2Set.reason };

  const needThirdSet = val1.isValid && val2.isValid && val1.winner !== val2.winner;

  const p3Set = parseFormSet(set3, useSuperTiebreak);
  const val3 = needThirdSet
    ? p3Set.parsed
      ? validateSet({ ...p3Set.parsed, isSuperTiebreak: useSuperTiebreak })
      : { isValid: false, winner: null, reason: p3Set.reason }
    : { isValid: false, winner: null, reason: undefined };

  // Compile active sets
  const currentSets: TennisSet[] = [];
  if (p1Set.parsed && val1.isValid) currentSets.push(p1Set.parsed);
  if (p2Set.parsed && val2.isValid) currentSets.push(p2Set.parsed);
  if (needThirdSet && p3Set.parsed && val3.isValid) {
    currentSets.push({
      ...p3Set.parsed,
      isSuperTiebreak: useSuperTiebreak,
    });
  }

  const matchValidation = (() => {
    if (!p1Set.parsed || !val1.isValid) {
      return { isValid: false, winner: null, score1: 0, score2: 0, reason: `Set 1: ${val1.reason || 'Uzupełnij wynik'}` };
    }
    if (!p2Set.parsed || !val2.isValid) {
      return { isValid: false, winner: null, score1: val1.winner === 1 ? 1 : 0, score2: val1.winner === 2 ? 1 : 0, reason: `Set 2: ${val2.reason || 'Uzupełnij wynik'}` };
    }
    if (needThirdSet) {
      if (!p3Set.parsed || !val3.isValid) {
        return { isValid: false, winner: null, score1: 1, score2: 1, reason: `Set 3: ${val3.reason || 'Uzupełnij wynik 3. seta'}` };
      }
    }
    return validateMatch(currentSets);
  })();

  const handleQuickScoreSet1 = (g1: number, g2: number, tb1?: number, tb2?: number) => {
    setSet1({
      games1: String(g1),
      games2: String(g2),
      tiebreak1: tb1 !== undefined ? String(tb1) : '',
      tiebreak2: tb2 !== undefined ? String(tb2) : '',
      isSuperTiebreak: false,
    });
  };

  const handleQuickScoreSet2 = (g1: number, g2: number, tb1?: number, tb2?: number) => {
    setSet2({
      games1: String(g1),
      games2: String(g2),
      tiebreak1: tb1 !== undefined ? String(tb1) : '',
      tiebreak2: tb2 !== undefined ? String(tb2) : '',
      isSuperTiebreak: false,
    });
  };

  const handleQuickScoreSet3 = (g1: number, g2: number, tb1?: number, tb2?: number, isSuper?: boolean) => {
    const superFlag = isSuper ?? useSuperTiebreak;
    setUseSuperTiebreak(superFlag);
    setSet3({
      games1: String(g1),
      games2: String(g2),
      tiebreak1: tb1 !== undefined ? String(tb1) : '',
      tiebreak2: tb2 !== undefined ? String(tb2) : '',
      isSuperTiebreak: superFlag,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (player1Id === player2Id) {
      setFormError('Wybierz dwóch różnych zawodników do tego meczu.');
      return;
    }

    if (!isScheduled && !matchValidation.isValid) {
      setFormError(`Błąd w wyniku meczu: ${matchValidation.reason}`);
      return;
    }

    const winner = !isScheduled
      ? matchValidation.winner === 1
        ? player1Id
        : player2Id
      : undefined;

    const friendlyReason = editingMatch?.friendlyReason || rematchCheck.reason;

    const matchToSave: Match = {
      id: editingMatch?.id || `m_${Date.now()}`,
      player1Id,
      player2Id,
      date,
      time: isScheduled ? time : undefined,
      courtName: courtName.trim() || undefined,
      surface,
      sets: isScheduled ? [] : currentSets,
      winnerId: winner,
      status: isScheduled ? 'scheduled' : 'completed',
      notes: notes.trim() || undefined,
      createdAt: editingMatch?.createdAt || Date.now(),
      matchType: isFriendlyMatch ? 'friendly' : 'league',
      isFriendly: isFriendlyMatch,
      friendlyReason: isFriendlyMatch ? friendlyReason : undefined,
    };

    if (!isScheduled) {
      // Trigger festive celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#84cc16', '#10b981', '#064e3b', '#facc15'],
      });
    }

    onSave(matchToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-emerald-700/60 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black">
              🎾
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">
                {editingMatch ? 'Edycja meczu' : isScheduled ? 'Zaplanuj spotkanie ligowe' : 'Wpisz wynik meczu'}
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-300">
                Reguły tenisowe: do 2 wygranych setów (best-of-3)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto overflow-x-hidden flex-1 text-sm overscroll-contain">
          {/* Status Choice */}
          <div className="flex p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsScheduled(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isScheduled ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Mecz zakończony (Wpisz wynik)
            </button>
            <button
              type="button"
              onClick={() => setIsScheduled(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isScheduled ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Mecz zaplanowany (Ustal termin)
            </button>
          </div>

          {/* Player Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            {/* Player 1 */}
            <div className="min-w-0 w-full">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Zawodnik 1 (Gospodarz):
              </label>
              <select
                id="select-match-p1"
                value={player1Id}
                onChange={(e) => setPlayer1Id(e.target.value)}
                className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none text-base box-border"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === player2Id}>
                    {p.name} {p.id === player2Id ? '(wybrany jako przeciwnik)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Player 2 */}
            <div className="min-w-0 w-full">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Zawodnik 2 (Gość):
              </label>
              <select
                id="select-match-p2"
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none text-base box-border"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === player1Id}>
                    {p.name} {p.id === player1Id ? '(wybrany jako gospodarz)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time, Surface & Court */}
          <div className="space-y-3.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              {/* Date */}
              <div className="min-w-0 w-full">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Data meczu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none box-border [color-scheme:light]"
                  required
                />
              </div>

              {/* Time (if scheduled) OR Surface (if completed) */}
              {isScheduled ? (
                <div className="min-w-0 w-full">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Godzina rozpoczęcia
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none box-border [color-scheme:light]"
                  />
                </div>
              ) : (
                <div className="min-w-0 w-full">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nawierzchnia kortu
                  </label>
                  <select
                    value={surface}
                    onChange={(e) => setSurface(e.target.value as CourtSurface)}
                    className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer box-border"
                  >
                    <option value="clay">Mączka (cegła)</option>
                    <option value="hard">Kort twardy (hard)</option>
                    <option value="grass">Trawa</option>
                    <option value="carpet">Hala / Dywan / Sztuczna trawa</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              {/* Surface (if scheduled) */}
              {isScheduled && (
                <div className="min-w-0 w-full">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nawierzchnia kortu
                  </label>
                  <select
                    value={surface}
                    onChange={(e) => setSurface(e.target.value as CourtSurface)}
                    className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer box-border"
                  >
                    <option value="clay">Mączka (cegła)</option>
                    <option value="hard">Kort twardy (hard)</option>
                    <option value="grass">Trawa</option>
                    <option value="carpet">Hala / Dywan / Sztuczna trawa</option>
                  </select>
                </div>
              )}

              {/* Court name */}
              <div className={isScheduled ? 'min-w-0 w-full' : 'min-w-0 w-full sm:col-span-2'}>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kort / Miejsce (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. WKT Mera kort 2, Legia, TenisPoint"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full min-w-0 max-w-full block h-11 px-3 py-2 rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none box-border"
                />
              </div>
            </div>
          </div>

          {/* Baner reguły 2 miesięcy odstępu (Mecz Towarzyski) */}
          {isFriendlyMatch && (
            <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1.5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] uppercase tracking-wider font-black">
                  Mecz Towarzyski
                </span>
                <span className="font-extrabold text-stone-900">
                  Reguła 2 miesięcy odstępu
                </span>
              </div>
              <p className="text-stone-800 leading-relaxed text-xs">
                {rematchCheck.reason || 'Z tym rywalem rozegrano już mecz w odstępie krótszym niż 2 miesiące kalendarzowe.'}
              </p>
              <div className="text-[11px] text-amber-950 font-medium pt-0.5">
                ℹ️ Zgodnie z zasadami ligi, ten mecz zostanie zarejestrowany z etykietą <strong>„Towarzyski”</strong> i nie będzie wliczał się do punktacji tabeli ligowej.
              </div>
            </div>
          )}

          {/* MATCH SCORES SECTION (If completed) */}
          {!isScheduled && (
            <div className="space-y-4 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-700" />
                  Punktacja setów (pierwszy do 2 setów wygrywa)
                </span>
                <span className="text-[11px] text-stone-500">
                  {p1?.name.split(' ')[0]} vs {p2?.name.split(' ')[0]}
                </span>
              </div>

              {/* SET 1 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                    Set 1
                  </span>
                  <div className="flex items-center gap-1">
                    {val1.isValid ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Wygrał {val1.winner === 1 ? p1?.name : p2?.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                        {val1.reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Input Stepper */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-stone-700 mb-1 break-words leading-tight max-w-[130px]">
                      {p1?.name}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="-"
                      value={set1.games1}
                      onChange={(e) =>
                        setSet1({ ...set1, games1: e.target.value.replace(/\D/g, '').slice(0, 2) })
                      }
                      className="w-14 h-12 text-center text-xl font-black rounded-xl border-2 border-stone-300 focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <span className="text-xl font-bold text-stone-400 self-center mt-4">:</span>

                  <div className="text-center">
                    <span className="block text-xs font-semibold text-stone-700 mb-1 break-words leading-tight max-w-[130px]">
                      {p2?.name}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="-"
                      value={set1.games2}
                      onChange={(e) =>
                        setSet1({ ...set1, games2: e.target.value.replace(/\D/g, '').slice(0, 2) })
                      }
                      className="w-14 h-12 text-center text-xl font-black rounded-xl border-2 border-stone-300 focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  {/* Tie-break inputs if 7:6 or 6:7 */}
                  {((set1.games1 === '7' && set1.games2 === '6') || (set1.games1 === '6' && set1.games2 === '7')) && (
                    <div className="border-l border-stone-200 pl-3 text-center">
                      <span className="block text-[11px] font-bold text-emerald-800 mb-1">Tie-break</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="P1"
                          value={set1.tiebreak1}
                          onChange={(e) =>
                            setSet1({ ...set1, tiebreak1: e.target.value.replace(/\D/g, '').slice(0, 2) })
                          }
                          className="w-11 h-9 text-center text-xs font-bold rounded-lg border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none"
                        />
                        <span className="text-stone-400 text-xs">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="P2"
                          value={set1.tiebreak2}
                          onChange={(e) =>
                            setSet1({ ...set1, tiebreak2: e.target.value.replace(/\D/g, '').slice(0, 2) })
                          }
                          className="w-11 h-9 text-center text-xs font-bold rounded-lg border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fast Preset buttons */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-stone-400 font-medium mr-1">Szybki wybór:</span>
                  {[
                    [6, 0],
                    [6, 1],
                    [6, 2],
                    [6, 3],
                    [6, 4],
                    [7, 5],
                    [7, 6, 7, 4],
                  ].map(([g1, g2, tb1, tb2], idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickScoreSet1(g1, g2, tb1, tb2)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-lime-100 text-stone-700 font-mono border border-stone-200 transition-colors cursor-pointer"
                    >
                      {g1}:{g2}
                    </button>
                  ))}
                  <span className="text-stone-300">|</span>
                  {[
                    [4, 6],
                    [3, 6],
                    [2, 6],
                    [5, 7],
                    [6, 7, 4, 7],
                  ].map(([g1, g2, tb1, tb2], idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickScoreSet1(g1, g2, tb1, tb2)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-stone-700 font-mono border border-stone-200 transition-colors cursor-pointer"
                    >
                      {g1}:{g2}
                    </button>
                  ))}
                </div>
              </div>

              {/* SET 2 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                    Set 2
                  </span>
                  <div className="flex items-center gap-1">
                    {val2.isValid ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Wygrał {val2.winner === 1 ? p1?.name : p2?.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                        {val2.reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Input Stepper */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-stone-700 mb-1 break-words leading-tight max-w-[130px]">
                      {p1?.name}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="-"
                      value={set2.games1}
                      onChange={(e) =>
                        setSet2({ ...set2, games1: e.target.value.replace(/\D/g, '').slice(0, 2) })
                      }
                      className="w-14 h-12 text-center text-xl font-black rounded-xl border-2 border-stone-300 focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <span className="text-xl font-bold text-stone-400 self-center mt-4">:</span>

                  <div className="text-center">
                    <span className="block text-xs font-semibold text-stone-700 mb-1 break-words leading-tight max-w-[130px]">
                      {p2?.name}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="-"
                      value={set2.games2}
                      onChange={(e) =>
                        setSet2({ ...set2, games2: e.target.value.replace(/\D/g, '').slice(0, 2) })
                      }
                      className="w-14 h-12 text-center text-xl font-black rounded-xl border-2 border-stone-300 focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  {/* Tie-break inputs if 7:6 or 6:7 */}
                  {((set2.games1 === '7' && set2.games2 === '6') || (set2.games1 === '6' && set2.games2 === '7')) && (
                    <div className="border-l border-stone-200 pl-3 text-center">
                      <span className="block text-[11px] font-bold text-emerald-800 mb-1">Tie-break</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="P1"
                          value={set2.tiebreak1}
                          onChange={(e) =>
                            setSet2({ ...set2, tiebreak1: e.target.value.replace(/\D/g, '').slice(0, 2) })
                          }
                          className="w-11 h-9 text-center text-xs font-bold rounded-lg border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none"
                        />
                        <span className="text-stone-400 text-xs">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="P2"
                          value={set2.tiebreak2}
                          onChange={(e) =>
                            setSet2({ ...set2, tiebreak2: e.target.value.replace(/\D/g, '').slice(0, 2) })
                          }
                          className="w-11 h-9 text-center text-xs font-bold rounded-lg border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fast Preset buttons */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-stone-400 font-medium mr-1">Szybki wybór:</span>
                  {[
                    [6, 1],
                    [6, 2],
                    [6, 3],
                    [6, 4],
                    [7, 5],
                    [7, 6, 7, 5],
                  ].map(([g1, g2, tb1, tb2], idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickScoreSet2(g1, g2, tb1, tb2)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-lime-100 text-stone-700 font-mono border border-stone-200 transition-colors cursor-pointer"
                    >
                      {g1}:{g2}
                    </button>
                  ))}
                  <span className="text-stone-300">|</span>
                  {[
                    [4, 6],
                    [3, 6],
                    [2, 6],
                    [5, 7],
                    [6, 7, 5, 7],
                  ].map(([g1, g2, tb1, tb2], idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickScoreSet2(g1, g2, tb1, tb2)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-stone-700 font-mono border border-stone-200 transition-colors cursor-pointer"
                    >
                      {g1}:{g2}
                    </button>
                  ))}
                </div>
              </div>

              {/* SET 3 (Only shown/enabled if 1:1 in sets) */}
              {needThirdSet ? (
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border-2 border-amber-300 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950 text-xs uppercase tracking-wide">
                        Set 3 (Decydujący)
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        Stan 1:1 w setach
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-100/80 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setUseSuperTiebreak(true);
                          setSet3((prev) => ({
                            ...prev,
                            isSuperTiebreak: true,
                          }));
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          useSuperTiebreak ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:text-black'
                        }`}
                      >
                        Super Tie-break (do 10 pkt)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseSuperTiebreak(false);
                          setSet3((prev) => ({
                            ...prev,
                            isSuperTiebreak: false,
                          }));
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          !useSuperTiebreak ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:text-black'
                        }`}
                      >
                        Pełny Set (do 6 gemów)
                      </button>
                    </div>
                  </div>

                  {/* Score inputs for set 3 */}
                  <div className="flex items-center justify-center gap-4 py-1">
                    <div className="text-center">
                      <span className="block text-xs font-semibold text-stone-700 mb-1 break-words leading-tight max-w-[130px]">
                        {p1?.name}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="-"
                        value={set3.games1}
                        onChange={(e) =>
                          setSet3({ ...set3, games1: e.target.value.replace(/\D/g, '').slice(0, 2) })
                        }
                        className="w-14 h-12 text-center text-xl font-black rounded-xl border-2 border-amber-300 focus:border-amber-600 focus:outline-none bg-white"
                      />
                    </div>

                    <span className="text-xl font-bold text-stone-400 self-center mt-4">:</span>

                    <div className="text-center">
                      <span className="block text-xs font-semibold text-stone-700 mb-1 break-words leading-tight max-w-[130px]">
                        {p2?.name}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="-"
                        value={set3.games2}
                        onChange={(e) =>
                          setSet3({ ...set3, games2: e.target.value.replace(/\D/g, '').slice(0, 2) })
                        }
                        className="w-14 h-12 text-center text-xl font-black rounded-xl border-2 border-amber-300 focus:border-amber-600 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Tie-break inputs if full set and 7:6 or 6:7 */}
                  {!useSuperTiebreak && ((set3.games1 === '7' && set3.games2 === '6') || (set3.games1 === '6' && set3.games2 === '7')) && (
                    <div className="flex items-center justify-center gap-1 pt-1">
                      <span className="text-[11px] font-bold text-amber-900 mr-1">Tie-break:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="P1"
                        value={set3.tiebreak1}
                        onChange={(e) =>
                          setSet3({ ...set3, tiebreak1: e.target.value.replace(/\D/g, '').slice(0, 2) })
                        }
                        className="w-11 h-9 text-center text-xs font-bold rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:outline-none"
                      />
                      <span className="text-stone-400 text-xs">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="P2"
                        value={set3.tiebreak2}
                        onChange={(e) =>
                          setSet3({ ...set3, tiebreak2: e.target.value.replace(/\D/g, '').slice(0, 2) })
                        }
                        className="w-11 h-9 text-center text-xs font-bold rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Presets for Set 3 */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 text-[11px]">
                    <span className="text-stone-400 font-medium mr-1">Szybki wybór:</span>
                    {useSuperTiebreak ? (
                      <>
                        {[[10, 8], [10, 7], [10, 5], [10, 4], [12, 10]].map(([g1, g2], idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickScoreSet3(g1, g2, undefined, undefined, true)}
                            className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-stone-800 font-mono border border-amber-200 transition-colors cursor-pointer"
                          >
                            [{g1}:{g2}]
                          </button>
                        ))}
                        <span className="text-stone-300">|</span>
                        {[[8, 10], [7, 10], [5, 10], [10, 12]].map(([g1, g2], idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickScoreSet3(g1, g2, undefined, undefined, true)}
                            className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-stone-800 font-mono border border-amber-200 transition-colors cursor-pointer"
                          >
                            [{g1}:{g2}]
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[[6, 4], [6, 3], [6, 2], [7, 5]].map(([g1, g2], idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickScoreSet3(g1, g2, undefined, undefined, false)}
                            className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-stone-800 font-mono border border-amber-200 transition-colors cursor-pointer"
                          >
                            {g1}:{g2}
                          </button>
                        ))}
                        <span className="text-stone-300">|</span>
                        {[[4, 6], [3, 6], [2, 6], [5, 7]].map(([g1, g2], idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickScoreSet3(g1, g2, undefined, undefined, false)}
                            className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-stone-800 font-mono border border-amber-200 transition-colors cursor-pointer"
                          >
                            {g1}:{g2}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ) : val1.isValid && val2.isValid ? (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs font-semibold text-emerald-900">
                  🎉 Wynik meczu to 2:0! Trzeci set nie jest potrzebny.
                </div>
              ) : null}

              {/* Match Winner Summary Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  matchValidation.isValid
                    ? 'bg-emerald-950 text-white border-emerald-800'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                {matchValidation.isValid ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-lime-400" />
                    <div>
                      <span className="text-xs text-lime-400 font-bold uppercase tracking-wider block">
                        Zwycięzca meczu:
                      </span>
                      <strong className="text-base font-black">
                        {matchValidation.winner === 1 ? p1?.name : p2?.name} (
                        {matchValidation.score1}:{matchValidation.score2} w setach)
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-medium">{matchValidation.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes / Match Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Komentarz / Notatka z meczu (opcjonalnie)
            </label>
            <textarea
              rows={2}
              placeholder="np. Zacięty mecz w upale, obrona dwóch piłek meczowych..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-base focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              {editingMatch && onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(editingMatch.id);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Potwierdź usunięcie</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Usuń ten mecz</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={!isScheduled && !matchValidation.isValid}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  isScheduled || matchValidation.isValid
                    ? 'bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-emerald-950 shadow-lime-500/20'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isScheduled ? 'Zapisz zaplanowane spotkanie' : 'Zatwierdź wynik meczu'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
