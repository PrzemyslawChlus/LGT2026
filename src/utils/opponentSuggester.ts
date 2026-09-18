import { Player, Match, StandingRow } from '../types';
import { checkRematchEligibility, formatDatePl } from './tennisRules';

export type SuggestionPriority = 'unplayed' | 'rematch_eligible' | 'long_time' | 'recently_played';
export type PaceStatus = 'behind' | 'on_pace' | 'ahead';

export interface LeaguePaceInfo {
  status: PaceStatus;
  playerMatches: number;
  playerMatchesPerMonth: number;
  avgLeagueMatches: number; // e.g. 2.4 total per player
  avgLeagueMatchesMonthly: number; // e.g. 1.2 m./month
  diffFromAvg: number; // playerMatches - avgLeagueMatches
  diffFromMonthlyAvg: number; // playerMatchesPerMonth - avgLeagueMatchesMonthly
  elapsedDays: number;
  elapsedMonths: number;
  elapsedWeeks: number;
  avgMatchesPerWeek: number;
  messageType: 'mobilize' | 'praise' | 'neutral';
  title: string;
  message: string;
  badgeText: string;
}

export interface OpponentSuggestion {
  opponent: Player;
  priority: SuggestionPriority;
  score: number; // Higher is better recommendation
  completedMatchesCount: number;
  hasScheduledMatch: boolean;
  scheduledMatchDate?: string;
  lastMatchDate?: string;
  lastMatchResult?: 'win' | 'loss' | 'none';
  daysSinceLastMatch?: number;
  isRematchEligibleForPoints: boolean;
  nextAllowedLeagueDate?: string;
  rankDiff: number;
  targetRank: number;
  opponentRank: number;
  opponentPoints: number;
  opponentTotalMatches: number;
  opponentMatchesPerMonth: number;
  opponentPaceStatus: PaceStatus;
  opponentPaceBadge: string;
  sharedSurfaces: string[];
  sharedCourts: boolean;
  headline: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'stone';
  reasonText: string;
  recommendedActionText: string;
}

export interface LeagueExplorationStats {
  targetPlayer: Player;
  totalOpponents: number;
  playedOpponentsCount: number;
  unplayedOpponentsCount: number;
  explorationRate: number; // 0 to 100 percentage
  rematchEligibleCount: number;
  avgLeagueMatches: number;
  avgLeagueMatchesMonthly: number;
  pace: LeaguePaceInfo;
}

/**
 * Formats elapsed months in Polish (e.g., 1 miesiąca, 2 miesięcy, 3.5 miesiąca).
 */
export function formatElapsedMonthsPl(months: number): string {
  if (months <= 1) return '1 miesiąca';
  const rounded = Math.round(months);
  if (Math.abs(months - rounded) < 0.15) {
    return `${rounded} miesięcy`;
  }
  return `${months.toFixed(1)} miesiąca`;
}

/**
 * Calculates days between a YYYY-MM-DD date and today (or reference date).
 */
export function getDaysDifference(dateStr: string, referenceDateStr?: string): number {
  if (!dateStr) return 999;
  const d1 = new Date(dateStr + 'T00:00:00');
  const d2 = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Normalizes court names for fuzzy overlap matching.
 */
function normalizeCourt(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[,;/+&]|\boraz\b|\bi\b/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/**
 * Computes suggested opponents for a given target player, explicitly prioritizing
 * players with whom the target player has NEVER played or hasn't played in a long time,
 * motivating players to play outside their usual circle of friends.
 */
export function getOpponentSuggestions(
  targetPlayerId: string,
  players: Player[],
  matches: Match[],
  standings: StandingRow[],
  todayStr: string = new Date().toISOString().split('T')[0]
): {
  suggestions: OpponentSuggestion[];
  stats: LeagueExplorationStats | null;
} {
  const targetPlayer = players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { suggestions: [], stats: null };
  }

  // Active opponents only
  const activeOpponents = players.filter((p) => p.id !== targetPlayerId && p.status === 'active');
  const activePlayers = players.filter((p) => p.status === 'active');

  // Count total completed matches for each player in the league
  const playerMatchesCount = new Map<string, number>();
  players.forEach((p) => playerMatchesCount.set(p.id, 0));

  const allCompletedMatches = matches.filter((m) => m.status === 'completed');
  allCompletedMatches.forEach((m) => {
    if (playerMatchesCount.has(m.player1Id)) {
      playerMatchesCount.set(m.player1Id, (playerMatchesCount.get(m.player1Id) || 0) + 1);
    }
    if (playerMatchesCount.has(m.player2Id)) {
      playerMatchesCount.set(m.player2Id, (playerMatchesCount.get(m.player2Id) || 0) + 1);
    }
  });

  // Calculate league average matches per player
  const totalCompletedByActive = activePlayers.reduce(
    (acc, p) => acc + (playerMatchesCount.get(p.id) || 0),
    0
  );
  const avgLeagueMatchesRaw = activePlayers.length > 0 ? totalCompletedByActive / activePlayers.length : 0;
  const avgLeagueMatches = Math.round(avgLeagueMatchesRaw * 10) / 10;

  // Time dimension: calculate elapsed time in season
  const matchDates = allCompletedMatches.map((m) => m.date).filter(Boolean).sort();
  const earliestDate = matchDates[0] || todayStr;
  const elapsedDays = Math.max(1, getDaysDifference(earliestDate, todayStr));
  const elapsedWeeks = Math.max(1, Math.ceil(elapsedDays / 7));
  const avgMatchesPerWeek = elapsedWeeks > 0 ? Math.round((avgLeagueMatches / elapsedWeeks) * 10) / 10 : 0;

  // Monthly pacing calculations (baseline minimum 1.0 month so rate doesn't distort at the beginning of the season)
  const elapsedMonths = Math.max(1, Math.round((elapsedDays / 30.4375) * 10) / 10);
  const avgLeagueMatchesMonthly = Math.round((avgLeagueMatches / elapsedMonths) * 10) / 10;

  // Target player match statistics and monthly pace status
  const targetMatches = playerMatchesCount.get(targetPlayerId) || 0;
  const targetMatchesPerMonth = Math.round((targetMatches / elapsedMonths) * 10) / 10;
  const diffFromAvg = Math.round((targetMatches - avgLeagueMatches) * 10) / 10;
  const diffFromMonthlyAvg = Math.round((targetMatchesPerMonth - avgLeagueMatchesMonthly) * 10) / 10;

  let targetStatus: PaceStatus = 'on_pace';
  let messageType: 'mobilize' | 'praise' | 'neutral' = 'neutral';
  let title = '';
  let message = '';
  let badgeText = '';

  const elapsedMonthsText = formatElapsedMonthsPl(elapsedMonths);
  const avgMonthlyStr = avgLeagueMatchesMonthly.toFixed(1);
  const targetMonthlyStr = targetMatchesPerMonth.toFixed(1);

  if (allCompletedMatches.length <= 1 || avgLeagueMatches < 0.4) {
    targetStatus = 'on_pace';
    messageType = 'neutral';
    title = 'Start sezonu – czas wejść do gry!';
    message = `Liga dopiero się rozkręca (miesięczna średnia ligi: ~${avgMonthlyStr} m./miesiąc). Rozegraj mecz z proponowanym rywalem, aby nadać ton rywalizacji!`;
    badgeText = `Start sezonu: ${targetMonthlyStr} m./mc`;
  } else if (
    targetMatches === 0 ||
    diffFromMonthlyAvg <= -0.4 ||
    (targetMatchesPerMonth < avgLeagueMatchesMonthly * 0.6 && avgLeagueMatchesMonthly >= 0.5)
  ) {
    targetStatus = 'behind';
    messageType = 'mobilize';
    title = 'Tempo poniżej średniej miesięcznej – czas nadrobić zaległości!';
    const diffAbs = Math.abs(diffFromMonthlyAvg).toFixed(1);
    message = `Wypadasz poniżej miesięcznej średniej ligi (~${avgMonthlyStr} m./miesiąc na zawodnika). Twoje tempo to ${targetMonthlyStr} m./miesiąc (łącznie ${targetMatches} ${
      targetMatches === 1 ? 'mecz' : 'meczów'
    } w czasie ${elapsedMonthsText} rozgrywek, o ~${diffAbs} m./mc mniej od średniej). Czas ruszyć na kort, aby nie tracić kontaktu z tabelą!`;
    badgeText = `Poniżej średniej: ${targetMonthlyStr} / ~${avgMonthlyStr} m./mc`;
  } else if (
    diffFromMonthlyAvg >= 0.5 ||
    (targetMatchesPerMonth > avgLeagueMatchesMonthly * 1.35 && targetMatches >= 2 && targetMatchesPerMonth > avgLeagueMatchesMonthly + 0.3)
  ) {
    targetStatus = 'ahead';
    messageType = 'praise';
    title = 'Świetna dyscyplina! Wypadasz wyraźnie powyżej średniej miesięcznej!';
    message = `Wyśmienite tempo! Rozgrywasz średnio ${targetMonthlyStr} m./miesiąc (miesięczna średnia ligi to ~${avgMonthlyStr} m./miesiąc w czasie ${elapsedMonthsText} rozgrywek). Twoje zaangażowanie i regularność na korcie napędzają rywalizację dla wszystkich dżentelmenów!`;
    badgeText = `Wzorowe tempo: ${targetMonthlyStr} m./mc (śr. ~${avgMonthlyStr})`;
  } else {
    targetStatus = 'on_pace';
    messageType = 'neutral';
    title = 'Stabilne tempo miesięczne – trzymasz ligowy rytm!';
    message = `Twoje tempo (${targetMonthlyStr} m./miesiąc, łącznie: ${targetMatches} ${
      targetMatches === 1 ? 'mecz' : 'meczów'
    }) odpowiada miesięcznej średniej ligi (~${avgMonthlyStr} m./miesiąc w czasie ${elapsedMonthsText} rozgrywek). Kontynuuj regularne starty, aby rozegrać pełny cykl każdy z każdym!`;
    badgeText = `Dobre tempo: ${targetMonthlyStr} m./mc (śr. ~${avgMonthlyStr})`;
  }

  const pace: LeaguePaceInfo = {
    status: targetStatus,
    playerMatches: targetMatches,
    playerMatchesPerMonth: targetMatchesPerMonth,
    avgLeagueMatches,
    avgLeagueMatchesMonthly,
    diffFromAvg,
    diffFromMonthlyAvg,
    elapsedDays,
    elapsedMonths,
    elapsedWeeks,
    avgMatchesPerWeek,
    messageType,
    title,
    message,
    badgeText,
  };

  const rankMap = new Map<string, { rank: number; points: number }>();
  standings.forEach((row) => {
    rankMap.set(row.player.id, { rank: row.rank, points: row.points });
  });

  const targetRankData = rankMap.get(targetPlayerId) || { rank: standings.length || 1, points: 0 };
  const targetCourts = normalizeCourt(targetPlayer.preferredCourts);
  const targetSurfaces = (targetPlayer.preferredSurfaces || []).map((s) => s.toLowerCase());

  let playedOpponentsCount = 0;
  let rematchEligibleCount = 0;

  const evaluatedSuggestions: OpponentSuggestion[] = activeOpponents.map((opp) => {
    // 1. Direct matches history
    const directMatches = matches.filter(
      (m) =>
        (m.player1Id === targetPlayerId && m.player2Id === opp.id) ||
        (m.player1Id === opp.id && m.player2Id === targetPlayerId)
    );

    const completedMatches = directMatches.filter((m) => m.status === 'completed');
    const scheduledMatches = directMatches.filter((m) => m.status === 'scheduled');
    const hasScheduledMatch = scheduledMatches.length > 0;
    const nextScheduled = hasScheduledMatch
      ? scheduledMatches.sort((a, b) => a.date.localeCompare(b.date))[0]
      : undefined;

    const completedCount = completedMatches.length;
    if (completedCount > 0) {
      playedOpponentsCount++;
    }

    // Sorted completed matches (most recent first)
    const sortedCompleted = [...completedMatches].sort((a, b) => b.date.localeCompare(a.date));
    const lastMatch = sortedCompleted[0];
    const lastMatchDate = lastMatch?.date;

    let lastMatchResult: 'win' | 'loss' | 'none' = 'none';
    if (lastMatch && lastMatch.winnerId) {
      lastMatchResult = lastMatch.winnerId === targetPlayerId ? 'win' : 'loss';
    }

    const daysSinceLastMatch = lastMatchDate ? getDaysDifference(lastMatchDate, todayStr) : undefined;

    // Check 2-month rematch eligibility
    const rematchCheck = checkRematchEligibility(targetPlayerId, opp.id, todayStr, matches);
    const isRematchEligibleForPoints = !rematchCheck.isFriendly;
    if (completedCount > 0 && isRematchEligibleForPoints) {
      rematchEligibleCount++;
    }

    // Opponent rank and standings
    const oppRankData = rankMap.get(opp.id) || { rank: standings.length || 1, points: 0 };
    const rankDiff = Math.abs(targetRankData.rank - oppRankData.rank);

    // Shared preferences
    const oppSurfaces = (opp.preferredSurfaces || []).map((s) => s.toLowerCase());
    const sharedSurfaces = (targetPlayer.preferredSurfaces || []).filter((s) =>
      oppSurfaces.includes(s.toLowerCase())
    );

    const oppCourts = normalizeCourt(opp.preferredCourts);
    const sharedCourts = targetCourts.some((tc) =>
      oppCourts.some((oc) => tc.includes(oc) || oc.includes(tc))
    );

    // Score calculation:
    // Highest tiers:
    // Tier 1: NEVER PLAYED (base 10,000 points) -> maximum incentive to break the clique!
    // Tier 2: REMATCH ELIGIBLE (base 5,000 points) -> played before, but 2 months elapsed, points at stake!
    // Tier 3: LONG AGO PLAYED (base 2,000 points)
    // Tier 4: RECENTLY PLAYED (base 500 points) -> already met recently, friendly only.
    let priority: SuggestionPriority = 'unplayed';
    let baseScore = 0;
    let headline = '';
    let badgeLabel = '';
    let badgeColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'stone' = 'emerald';
    let reasonText = '';
    let recommendedActionText = '';

    if (completedCount === 0) {
      priority = 'unplayed';
      baseScore = 10000;
      badgeLabel = 'Nowy Rywal';
      badgeColor = 'emerald';
      headline = 'Jeszcze ze sobą nie graliście!';
      reasonText =
        rankDiff <= 3
          ? `Sąsiedzi w tabeli (różnica tylko ${rankDiff} ${rankDiff === 1 ? 'miejsca' : 'miejsc'})! Idealna okazja, aby po raz pierwszy powalczyć o punkty ligowe.`
          : `W tym sezonie nie rozegraliście ani jednego meczu. Przełam ligową rutynę i poznaj styl ${opp.name.split(' ')[0]}!`;
      recommendedActionText = 'Rzuć wyzwanie i zagrajcie pierwszy wspólny mecz';
    } else if (isRematchEligibleForPoints) {
      priority = 'rematch_eligible';
      baseScore = 5000;
      badgeLabel = 'Rewanż Ligowy';
      badgeColor = 'amber';
      headline = 'Gotowi na rewanż o punkty!';
      const daysText = daysSinceLastMatch !== undefined ? `${daysSinceLastMatch} dni temu` : '';
      if (lastMatchResult === 'loss') {
        reasonText = `Ostatni mecz przegrany (${daysText}). Minęły wymagane 2 miesiące – pora na sportowy rewanż o ligowe punkty!`;
      } else if (lastMatchResult === 'win') {
        reasonText = `Wygrałeś poprzednie starcie (${daysText}). Czas na kolejną obronę punktów w oficjalnym meczu ligowym!`;
      } else {
        reasonText = `Minęły już ponad 2 miesiące od ostatniego meczu. Kolejny pojedynek będzie punktowany w tabeli.`;
      }
      recommendedActionText = 'Zaproponuj oficjalny mecz rewanżowy';
    } else if (daysSinceLastMatch !== undefined && daysSinceLastMatch >= 30) {
      priority = 'long_time';
      baseScore = 2000;
      badgeLabel = 'Sparing Towarzyski';
      badgeColor = 'blue';
      headline = 'Mecz towarzyski przed upływem 2 miesięcy';
      reasonText = `Ostatni mecz rozegrano ${formatDatePl(lastMatchDate || '')}. Pełny mecz ligowy możliwy od ${formatDatePl(rematchCheck.nextAllowedDate || '')}, ale możecie zagrać mecz towarzyski!`;
      recommendedActionText = 'Zaproponuj sparing towarzyski';
    } else {
      priority = 'recently_played';
      baseScore = 500;
      badgeLabel = 'Niedawno grane';
      badgeColor = 'stone';
      headline = 'Świeża rywalizacja';
      reasonText = `Graliście ze sobą całkiem niedawno (${formatDatePl(lastMatchDate || '')}).`;
      recommendedActionText = 'Możecie zagrać rekreacyjnie';
    }

    // Opponent total completed matches and monthly pace status
    const oppTotalMatches = playerMatchesCount.get(opp.id) || 0;
    const oppMatchesPerMonth = Math.round((oppTotalMatches / elapsedMonths) * 10) / 10;
    let oppPaceStatus: PaceStatus = 'on_pace';
    let oppPaceBadge = '';

    if (allCompletedMatches.length > 1 && avgLeagueMatches >= 0.4) {
      if (oppTotalMatches === 0 || (avgLeagueMatchesMonthly - oppMatchesPerMonth >= 0.4)) {
        oppPaceStatus = 'behind';
        oppPaceBadge = oppTotalMatches === 0 ? '0 meczów (czeka na start)' : `Zaległości (${oppMatchesPerMonth} m./mc, śr. ~${avgLeagueMatchesMonthly})`;
      } else if (oppMatchesPerMonth - avgLeagueMatchesMonthly >= 0.4) {
        oppPaceStatus = 'ahead';
        oppPaceBadge = `Wysoki rytm (${oppMatchesPerMonth} m./mc, śr. ~${avgLeagueMatchesMonthly})`;
      } else {
        oppPaceStatus = 'on_pace';
        oppPaceBadge = `Tempo w normie (${oppMatchesPerMonth} m./mc)`;
      }
    } else {
      oppPaceBadge = `${oppTotalMatches} m. w lidze`;
    }

    // Secondary score bonuses:
    // Bonus for competitive closeness in table (up to +1500 pts)
    const rankProximityBonus = Math.max(0, 1500 - rankDiff * 150);

    // Bonus for matching surface / court preferences (+300 pts)
    const surfaceBonus = sharedSurfaces.length * 200;
    const courtBonus = sharedCourts ? 200 : 0;

    // Bonus for balancing league pace: gently encourage playing with someone who has fewer matches
    const paceBalancingBonus = oppTotalMatches === 0 ? 300 : (avgLeagueMatchesMonthly > oppMatchesPerMonth ? 150 : 0);

    // Penalty if there is ALREADY a scheduled match pending between them (-8,000 pts)
    const scheduledPenalty = hasScheduledMatch ? -8000 : 0;

    const totalScore =
      baseScore +
      rankProximityBonus +
      surfaceBonus +
      courtBonus +
      paceBalancingBonus +
      scheduledPenalty;

    return {
      opponent: opp,
      priority,
      score: totalScore,
      completedMatchesCount: completedCount,
      hasScheduledMatch,
      scheduledMatchDate: nextScheduled?.date,
      lastMatchDate,
      lastMatchResult,
      daysSinceLastMatch,
      isRematchEligibleForPoints,
      nextAllowedLeagueDate: rematchCheck.nextAllowedDate,
      rankDiff,
      targetRank: targetRankData.rank,
      opponentRank: oppRankData.rank,
      opponentPoints: oppRankData.points,
      opponentTotalMatches: oppTotalMatches,
      opponentMatchesPerMonth: oppMatchesPerMonth,
      opponentPaceStatus: oppPaceStatus,
      opponentPaceBadge: oppPaceBadge,
      sharedSurfaces,
      sharedCourts,
      headline,
      badgeLabel,
      badgeColor,
      reasonText,
      recommendedActionText,
    };
  });

  // Sort descending by score
  evaluatedSuggestions.sort((a, b) => b.score - a.score);

  const totalOpponents = activeOpponents.length;
  const unplayedOpponentsCount = totalOpponents - playedOpponentsCount;
  const explorationRate = totalOpponents > 0 ? Math.round((playedOpponentsCount / totalOpponents) * 100) : 0;

  const stats: LeagueExplorationStats = {
    targetPlayer,
    totalOpponents,
    playedOpponentsCount,
    unplayedOpponentsCount,
    explorationRate,
    rematchEligibleCount,
    avgLeagueMatches,
    avgLeagueMatchesMonthly,
    pace,
  };

  return {
    suggestions: evaluatedSuggestions,
    stats,
  };
}

/**
 * Prepares a polite, stylish WhatsApp or SMS message to challenge an opponent.
 */
export function createInvitationMessage(
  challengerName: string,
  opponentName: string,
  leagueName: string,
  isRematch: boolean = false
): string {
  const firstName = opponentName.split(' ')[0];
  if (isRematch) {
    return `Cześć ${firstName}! Z tej strony ${challengerName} z ${leagueName}. Minęło trochę czasu od naszego ostatniego meczu i mamy zielone światło na oficjalny rewanż ligowy 🎾 Kiedy miałbyś wolną chwilę w tym tygodniu na kort?`;
  }
  return `Cześć ${firstName}! Z tej strony ${challengerName} z ${leagueName}. W tym sezonie jeszcze ze sobą nie graliśmy na korcie 🎾 Chętnie umówiłbym się na mecz ligowy. W jakich dniach i godzinach najchętniej grywasz?`;
}
