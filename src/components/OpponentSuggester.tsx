import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Trophy,
  Sparkles,
  Calendar,
  Phone,
  MessageSquare,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Award,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { Player, Match, StandingRow, LeagueSettings, User } from '../types';
import { getOpponentSuggestions, createInvitationMessage, OpponentSuggestion } from '../utils/opponentSuggester';
import { formatDatePl, SURFACE_NAMES } from '../utils/tennisRules';

interface OpponentSuggesterProps {
  players: Player[];
  matches: Match[];
  standings: StandingRow[];
  settings: LeagueSettings;
  currentUser: User | null;
  currentUserPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onOpenNewMatchBetween: (player1Id: string, player2Id: string, isScheduled?: boolean) => void;
}

export const OpponentSuggester: React.FC<OpponentSuggesterProps> = ({
  players,
  matches,
  standings,
  settings,
  currentUser,
  currentUserPlayer,
  onSelectPlayer,
  onOpenNewMatchBetween,
}) => {
  // Active selected target player for whom suggestions are generated
  const [selectedTargetId, setSelectedTargetId] = useState<string>(() => {
    if (currentUserPlayer) return currentUserPlayer.id;
    return players[0]?.id || '';
  });

  // Current suggestion index (for cycling / shuffling through candidates)
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  // Toggle to view all unplayed opponents in an expanded tray
  const [showAllUnplayed, setShowAllUnplayed] = useState(false);

  // Domyślnie komponent jest zwinięty dla każdego użytkownika (kompaktowy widok z proponowanym rywalem)
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Czyszczenie ewentualnego starego klucza z localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('tennis_suggester_collapsed');
    } catch {}
  }, []);

  // WhatsApp vs SMS popup/action selector
  const [contactOpponent, setContactOpponent] = useState<OpponentSuggestion | null>(null);

  // Synchronize target player when currentUserPlayer changes
  useEffect(() => {
    if (currentUserPlayer && (!selectedTargetId || selectedTargetId === players[0]?.id)) {
      setSelectedTargetId(currentUserPlayer.id);
    }
  }, [currentUserPlayer, players, selectedTargetId]);

  // Compute suggestions and exploration stats
  const { suggestions, stats } = useMemo(() => {
    if (!selectedTargetId) return { suggestions: [], stats: null };
    return getOpponentSuggestions(selectedTargetId, players, matches, standings);
  }, [selectedTargetId, players, matches, standings]);

  const activeTargetPlayer = useMemo(() => {
    return players.find((p) => p.id === selectedTargetId) || currentUserPlayer || players[0];
  }, [selectedTargetId, players, currentUserPlayer]);

  // Safely wrap suggestion index
  const safeIndex = suggestions.length > 0 ? suggestionIndex % suggestions.length : 0;
  const currentSuggestion: OpponentSuggestion | undefined = suggestions[safeIndex];

  // Unplayed candidates list
  const unplayedCandidates = useMemo(() => {
    return suggestions.filter((s) => s.priority === 'unplayed');
  }, [suggestions]);

  // Next candidate handler
  const handleNextSuggestion = () => {
    if (suggestions.length <= 1) return;
    setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
  };

  // Randomize candidate
  const handleRandomizeCandidate = () => {
    if (suggestions.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * suggestions.length);
    if (nextIdx === safeIndex) {
      nextIdx = (nextIdx + 1) % suggestions.length;
    }
    setSuggestionIndex(nextIdx);
  };

  // Open match modal with both players pre-filled
  const handleChallengeOpponent = (opponentId: string, isScheduled: boolean = true) => {
    if (!activeTargetPlayer) return;
    onOpenNewMatchBetween(activeTargetPlayer.id, opponentId, isScheduled);
  };

  // Generate invitation message for active suggestion
  const getMessageText = (suggestion: OpponentSuggestion) => {
    const challengerName = activeTargetPlayer?.name || 'Kolega z ligi';
    const isRematch = suggestion.priority === 'rematch_eligible';
    return createInvitationMessage(challengerName, suggestion.opponent.name, settings.leagueName, isRematch);
  };

  const handleSendWhatsApp = (suggestion: OpponentSuggestion) => {
    const text = getMessageText(suggestion);
    const cleanPhone = suggestion.opponent.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendSms = (suggestion: OpponentSuggestion) => {
    const text = getMessageText(suggestion);
    const cleanPhone = suggestion.opponent.phone.replace(/[\s-]/g, '');
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  if (!activeTargetPlayer || players.length < 2) {
    return null;
  }

  return (
    <section
      id="opponent-suggester-hero"
      aria-label="Propozycja kolejnego przeciwnika"
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-2 border-amber-400/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white transition-all duration-300"
    >
      {/* Decorative Tennis Court Accent Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full border-8 border-lime-400/40" />
        <div className="absolute right-24 top-1/2 -translate-y-1/2 w-64 h-96 border-2 border-white" />
        <div className="absolute left-1/3 bottom-0 w-px h-full bg-white/20" />
      </div>

      {/* Top Banner Bar */}
      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-3.5 border-b border-emerald-800/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-950/70 backdrop-blur-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-lime-400 to-amber-400 text-emerald-950 font-black flex items-center justify-center shrink-0 shadow-md ring-2 ring-lime-300/40">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-lime-400/20 text-lime-300 border border-lime-400/30">
                <Sparkles className="w-3 h-3" />
                Wyzwanie Dżentelmena
              </span>
              {stats && (
                <span className="text-[11px] sm:text-xs text-stone-300 font-medium">
                  {stats.unplayedOpponentsCount > 0 ? (
                    <strong className="text-amber-300 font-bold">
                      {stats.unplayedOpponentsCount} niezagranych {stats.unplayedOpponentsCount === 1 ? 'rywal' : 'rywali'}
                    </strong>
                  ) : (
                    <span className="text-emerald-300 font-bold">Zagrałeś ze wszystkimi w lidze!</span>
                  )}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg md:text-xl font-black text-stone-100 font-display tracking-tight leading-tight mt-0.5 truncate">
              Kogo dziś wyzwiesz na kort?
            </h2>
          </div>
        </div>

        {/* Right side controls: Switch player & collapse */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Target Player Switcher */}
          <div className="flex items-center gap-1.5 bg-emerald-900/90 hover:bg-emerald-800/90 border border-emerald-700/80 rounded-xl px-2.5 py-1.5 transition-colors">
            <Users className="w-3.5 h-3.5 text-stone-300" />
            <span className="text-xs text-stone-300 font-medium hidden md:inline">Dla gracza:</span>
            <select
              id="suggester-target-player-select"
              value={selectedTargetId}
              onChange={(e) => {
                setSelectedTargetId(e.target.value);
                setSuggestionIndex(0);
              }}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer pr-1"
              aria-label="Wybierz gracza dla rekomendacji rywala"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id} className="bg-stone-900 text-stone-100">
                  {p.name} {p.id === currentUserPlayer?.id ? '(Ty)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Minimize / Expand Button */}
          <button
            id="suggester-collapse-toggle"
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title={isCollapsed ? 'Rozwiń propozycję rywala' : 'Zwiń do podsumowania'}
          >
            {isCollapsed ? (
              <>
                <span className="hidden sm:inline">Rozwiń</span>
                <ChevronDown className="w-4 h-4 text-lime-400" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Zwiń</span>
                <ChevronUp className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 p-4 sm:p-5">
        {/* COLLAPSED MODE: Very compact proposed opponent view (no court preferences, no match history / unplayed badges) */}
        {isCollapsed ? (
          currentSuggestion ? (
            <div className="space-y-2.5">
              <div
                id="suggester-collapsed-card"
                className="bg-stone-950/70 border border-emerald-700/60 hover:border-lime-400/40 rounded-2xl p-3 sm:p-4 transition-all shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Opponent Avatar, Name & Table rank (without unplayed badges or court preferences) */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Clean Avatar (no unplayed star) */}
                    <div
                      onClick={() => onSelectPlayer(currentSuggestion.opponent)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0 cursor-pointer ${currentSuggestion.opponent.avatarColor} text-white font-black flex items-center justify-center text-lg shadow-sm ring-2 ring-amber-400/70 hover:scale-105 transition-transform`}
                      title="Zobacz pełny profil gracza"
                    >
                      {currentSuggestion.opponent.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectPlayer(currentSuggestion.opponent)}
                          className="font-black text-stone-100 text-sm sm:text-base hover:text-amber-300 transition-colors text-left truncate cursor-pointer font-display"
                        >
                          {currentSuggestion.opponent.name}
                        </button>

                        {currentSuggestion.opponent.nickname && (
                          <span className="text-xs text-amber-300/90 italic truncate">
                            „{currentSuggestion.opponent.nickname}”
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          #{currentSuggestion.opponentRank} ({currentSuggestion.opponentPoints} pkt)
                        </span>
                      </div>

                      {/* Brief motivational headline in 1 line */}
                      <p className="text-xs text-stone-300 truncate mt-0.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                        <span className="text-lime-300 font-semibold">{currentSuggestion.headline}</span>
                        <span className="text-stone-400 hidden sm:inline truncate">— {currentSuggestion.reasonText}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
                    {/* Primary CTA: Schedule */}
                    <button
                      id="suggester-collapsed-btn-challenge"
                      type="button"
                      onClick={() => handleChallengeOpponent(currentSuggestion.opponent.id, true)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-emerald-950 font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                      title="Zaproponuj termin spotkania"
                    >
                      <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Zaproponuj termin</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(currentSuggestion)}
                      className="p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-lime-300 hover:text-white border border-emerald-600/70 transition-colors cursor-pointer"
                      title="Napisz na WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* SMS */}
                    <button
                      type="button"
                      onClick={() => handleSendSms(currentSuggestion)}
                      className="px-2.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer"
                      title="Wyślij SMS"
                    >
                      SMS
                    </button>

                    {/* Phone */}
                    <a
                      href={`tel:${currentSuggestion.opponent.phone.replace(/[\s-]/g, '')}`}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center cursor-pointer"
                      title={`Zadzwoń do ${currentSuggestion.opponent.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    {/* Next Opponent button */}
                    <button
                      type="button"
                      onClick={handleNextSuggestion}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 text-stone-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                      title={`Kolejna propozycja (${safeIndex + 1}/${suggestions.length})`}
                    >
                      <span className="hidden lg:inline">Kolejny</span>
                      <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom bar in collapsed state: candidate count + expand trigger */}
              <div className="flex items-center justify-between px-1 text-xs text-stone-400">
                <span className="text-[11px]">
                  Propozycja <strong className="text-stone-300">{safeIndex + 1}</strong> z {suggestions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-400 hover:text-lime-300 cursor-pointer transition-colors"
                >
                  <span>Rozwiń tempo ligi i zasady</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-stone-400">
              Brak dostępnych propozycji rywali do wyświetlenia.
            </div>
          )
        ) : (
          /* EXPANDED MODE: Full detailed view */
          <div className="space-y-4">
            {/* Dynamic League Pacing & Mobilization / Praise Banner */}
            {stats?.pace && (
              <div
                id="suggester-pace-banner"
                className={`rounded-2xl p-3.5 sm:p-4 border transition-all shadow-md relative overflow-hidden ${
                  stats.pace.status === 'behind'
                    ? 'bg-gradient-to-r from-amber-950/90 via-orange-950/75 to-stone-900/90 border-amber-400/60 text-amber-100'
                    : stats.pace.status === 'ahead'
                    ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-stone-900/90 border-lime-400/60 text-emerald-100'
                    : 'bg-stone-950/60 border-emerald-800/60 text-stone-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        stats.pace.status === 'behind'
                          ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300/60'
                          : stats.pace.status === 'ahead'
                          ? 'bg-lime-400 text-emerald-950 ring-2 ring-lime-300/60'
                          : 'bg-emerald-800/80 text-lime-300 ring-1 ring-emerald-700'
                      }`}
                    >
                      {stats.pace.status === 'behind' ? (
                        <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                      ) : stats.pace.status === 'ahead' ? (
                        <Award className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Scale className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            stats.pace.status === 'behind'
                              ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40'
                              : stats.pace.status === 'ahead'
                              ? 'bg-lime-400/25 text-lime-300 border border-lime-400/40'
                              : 'bg-emerald-900/40 text-stone-300 border border-emerald-700/50'
                          }`}
                        >
                          {stats.pace.status === 'behind'
                            ? 'Mobilizacja Ligowa'
                            : stats.pace.status === 'ahead'
                            ? 'Wzorowe Tempo'
                            : 'Równe Tempo'}
                        </span>
                        <h3 className="font-extrabold text-xs sm:text-sm text-stone-100 font-display">
                          {stats.pace.title}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed mt-0.5">
                        {stats.pace.message}
                      </p>
                    </div>
                  </div>

                  {/* Pacing Visual Pill (Monthly League Average) */}
                  <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-stone-950/80 border border-stone-700/80 rounded-xl px-3 py-2 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        {activeTargetPlayer.id === currentUserPlayer?.id
                          ? 'Twoje tempo'
                          : activeTargetPlayer.name.split(' ')[0]}
                      </div>
                      <div
                        className={`text-base font-black font-mono leading-none ${
                          stats.pace.status === 'behind'
                            ? 'text-amber-400'
                            : stats.pace.status === 'ahead'
                            ? 'text-lime-400'
                            : 'text-stone-200'
                        }`}
                      >
                        {stats.pace.playerMatchesPerMonth.toFixed(1)}{' '}
                        <span className="text-[11px] font-normal text-stone-400">m./mies.</span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        łącznie: {stats.pace.playerMatches} m.
                      </div>
                    </div>

                    <div className="h-8 w-px bg-stone-700" />

                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        Śr. miesięczna ligi
                      </div>
                      <div className="text-base font-black font-mono text-stone-200 leading-none">
                        ~{stats.pace.avgLeagueMatchesMonthly.toFixed(1)}{' '}
                        <span className="text-[11px] font-normal text-stone-400">m./mies.</span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        czas: {stats.pace.elapsedMonths <= 1 ? '1 mc' : `${stats.pace.elapsedMonths.toFixed(1)} mc.`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtitle / Exploration Rate Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-stone-300">
              <p className="leading-relaxed text-xs">
                <strong className="text-lime-300">Zasada Dżentelmena:</strong> Gramy z każdym rywalem w lidze!{' '}
                <span className="text-stone-300">
                  Poniżej rekomendowany przeciwnik dopasowany do Twojego tempa i tabeli.
                </span>
              </p>

              {/* League Exploration Progress Badge */}
              {stats && (
                <div className="shrink-0 bg-stone-950/60 border border-stone-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <div className="w-16 sm:w-20 bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-lime-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.explorationRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    {stats.playedOpponentsCount}/{stats.totalOpponents} ({stats.explorationRate}%)
                  </span>
                </div>
              )}
            </div>

          {/* Featured Opponent Highlight Card */}
          {currentSuggestion ? (
            <div
              id="suggester-featured-card"
              className="bg-stone-950/70 border-2 border-emerald-700/70 hover:border-amber-400/60 rounded-2xl p-4 sm:p-5 transition-all shadow-md relative group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Opponent Avatar & Details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Avatar */}
                  <div
                    onClick={() => onSelectPlayer(currentSuggestion.opponent)}
                    className="relative cursor-pointer shrink-0 group/avatar"
                    title="Zobacz pełny profil i H2H gracza"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${currentSuggestion.opponent.avatarColor} text-white font-black flex items-center justify-center text-xl sm:text-2xl shadow-md ring-2 ring-amber-400/80 group-hover/avatar:scale-105 transition-transform`}
                    >
                      {currentSuggestion.opponent.name.charAt(0)}
                    </div>
                    {currentSuggestion.priority === 'unplayed' && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-lime-400 text-emerald-950 font-black text-[10px] flex items-center justify-center shadow-xs ring-2 ring-stone-900"
                        title="Z tym graczem jeszcze nie grałeś!"
                      >
                        ★
                      </span>
                    )}
                  </div>

                  {/* Name, Badges & Motivating Reason */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectPlayer(currentSuggestion.opponent)}
                        className="font-black text-stone-100 text-base sm:text-lg hover:text-amber-300 transition-colors text-left truncate cursor-pointer font-display"
                      >
                        {currentSuggestion.opponent.name}
                      </button>

                      {currentSuggestion.opponent.nickname && (
                        <span className="text-xs text-amber-300 font-semibold italic">
                          „{currentSuggestion.opponent.nickname}”
                        </span>
                      )}

                      {/* Dynamic Priority Badge */}
                      {currentSuggestion.priority === 'unplayed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-lime-400 text-emerald-950 shadow-xs">
                          <Flame className="w-3 h-3 fill-emerald-950" />
                          0 Meczów • Nowy Rywal!
                        </span>
                      )}

                      {currentSuggestion.priority === 'rematch_eligible' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
                          <ShieldCheck className="w-3 h-3" />
                          Rewanż o punkty ligowe
                        </span>
                      )}

                      {currentSuggestion.priority === 'long_time' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-stone-300 bg-stone-800 border border-stone-700">
                          <Clock className="w-3 h-3 text-stone-400" />
                          Sparing towarzyski
                        </span>
                      )}
                    </div>

                    {/* Standings & Preferences row */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-stone-300 mt-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        #{currentSuggestion.opponentRank} w tabeli ({currentSuggestion.opponentPoints} pkt)
                      </span>

                      {/* Opponent pace status badge */}
                      {currentSuggestion.opponentPaceBadge && (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-md border ${
                            currentSuggestion.opponentPaceStatus === 'behind'
                              ? 'text-amber-300 bg-amber-400/15 border-amber-400/35'
                              : currentSuggestion.opponentPaceStatus === 'ahead'
                              ? 'text-lime-300 bg-lime-400/15 border-lime-400/35'
                              : 'text-stone-300 bg-stone-800/80 border-stone-700'
                          }`}
                          title="Liczba rozegranych meczów rywala w odniesieniu do średniej ligi"
                        >
                          <Scale className="w-3 h-3" />
                          {currentSuggestion.opponentPaceBadge}
                        </span>
                      )}

                      {currentSuggestion.opponent.preferredSurfaces?.length > 0 && (
                        <span className="text-stone-300">
                          Nawierzchnia:{' '}
                          <strong className="text-stone-200">
                            {currentSuggestion.opponent.preferredSurfaces.join(', ')}
                          </strong>
                        </span>
                      )}

                      {currentSuggestion.opponent.preferredCourts && (
                        <span className="text-stone-400 truncate max-w-xs">
                          Korty: {currentSuggestion.opponent.preferredCourts}
                        </span>
                      )}
                    </div>

                    {/* Strong Motivational Reason */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 text-xs sm:text-sm text-stone-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-lime-300 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong className="text-lime-300">{currentSuggestion.headline}</strong>{' '}
                        <span>{currentSuggestion.reasonText}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Direct Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
                  {/* Primary CTA: Schedule Match */}
                  <button
                    id="suggester-btn-challenge"
                    type="button"
                    onClick={() => handleChallengeOpponent(currentSuggestion.opponent.id, true)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 active:from-lime-500 active:to-lime-600 text-emerald-950 font-black text-xs sm:text-sm shadow-md shadow-lime-500/20 active:scale-95 transition-all cursor-pointer"
                    title="Otwórz formularz i zaproponuj termin meczu"
                  >
                    <Calendar className="w-4 h-4 stroke-[2.5]" />
                    <span>Zaproponuj termin</span>
                  </button>

                  {/* Secondary CTA: WhatsApp / SMS */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id="suggester-btn-whatsapp"
                      type="button"
                      onClick={() => handleSendWhatsApp(currentSuggestion)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/70 text-lime-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                      title="Napisz wiadomość na WhatsApp z gotowym zaproszeniem na mecz"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      id="suggester-btn-sms"
                      type="button"
                      onClick={() => handleSendSms(currentSuggestion)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer"
                      title="Wyślij SMS z propozycją spotkania na korcie"
                    >
                      <span>SMS</span>
                    </button>

                    {/* Direct phone call */}
                    <a
                      id="suggester-btn-call"
                      href={`tel:${currentSuggestion.opponent.phone.replace(/[\s-]/g, '')}`}
                      className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center cursor-pointer"
                      title={`Zadzwoń do ${currentSuggestion.opponent.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Card Footer: Cycling controls & Counter */}
              <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-300">
                    Propozycja {safeIndex + 1} z {suggestions.length}
                  </span>
                  {currentSuggestion.hasScheduledMatch && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                      <Calendar className="w-3 h-3" />
                      Mecz już zaplanowany na {formatDatePl(currentSuggestion.scheduledMatchDate || '')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Next candidate button */}
                  <button
                    id="suggester-btn-next"
                    type="button"
                    onClick={handleNextSuggestion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 text-stone-200 hover:text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    <span>Kolejny rywal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Shuffle button */}
                  <button
                    id="suggester-btn-shuffle"
                    type="button"
                    onClick={handleRandomizeCandidate}
                    className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white cursor-pointer transition-colors"
                    title="Wylosuj innego przeciwnika"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle unplayed tray */}
                  {unplayedCandidates.length > 0 && (
                    <button
                      id="suggester-btn-toggle-unplayed"
                      type="button"
                      onClick={() => setShowAllUnplayed((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 font-bold text-xs cursor-pointer transition-colors ml-1"
                    >
                      <span>
                        {showAllUnplayed ? 'Ukryj niezagranych' : `Wszyscy niezagrani (${unplayedCandidates.length})`}
                      </span>
                      {showAllUnplayed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-stone-950/50 rounded-2xl p-6 text-center text-stone-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-stone-200">Wspaniały wynik!</p>
              <p className="text-xs mt-1">
                Rozegrałeś mecze ze wszystkimi aktywnymi uczestnikami ligi. Czekaj na terminy kolejnych rewanżów ligowych.
              </p>
            </div>
          )}

          {/* Expanded Tray: All unplayed rivals with 1-click challenge */}
          {showAllUnplayed && unplayedCandidates.length > 0 && (
            <div
              id="suggester-unplayed-grid"
              className="mt-4 pt-4 border-t border-emerald-800/60 space-y-2.5 animate-in fade-in duration-300"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Zawodnicy, z którymi jeszcze nie grałeś w tym sezonie:
                </h3>
                <span className="text-xs text-stone-400 font-medium">
                  Kliknij „Rzuć wyzwanie”, aby umówić mecz
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {unplayedCandidates.map((cand) => (
                  <div
                    key={cand.opponent.id}
                    className="bg-stone-950/80 border border-stone-800 hover:border-amber-400/50 rounded-xl p-3 flex items-center justify-between gap-2.5 transition-all shadow-xs"
                  >
                    <div
                      onClick={() => onSelectPlayer(cand.opponent)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group/item"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg ${cand.opponent.avatarColor} text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0`}
                      >
                        {cand.opponent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-stone-200 group-hover/item:text-amber-300 truncate leading-tight">
                          {cand.opponent.name}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          #{cand.opponentRank} w tabeli • {cand.opponentPoints} pkt • {cand.opponentMatchesPerMonth.toFixed(1)} m./mc ({cand.opponentTotalMatches} m.)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChallengeOpponent(cand.opponent.id, true)}
                      className="px-2.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-[11px] shrink-0 active:scale-95 transition-transform cursor-pointer shadow-xs"
                      title="Zaproponuj termin meczu"
                    >
                      Wyzwanie
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </section>
  );
};
