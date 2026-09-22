import { TennisSet, Match, Player, StandingRow, LeagueSettings, H2HRecord } from '../types';

/**
 * Validates whether a single tennis set has concluded with a valid tennis score.
 */
export function validateSet(set: TennisSet): {
  isValid: boolean;
  winner: 1 | 2 | null;
  reason?: string;
} {
  const { games1, games2, tiebreak1, tiebreak2, isSuperTiebreak } = set;

  // Case 1: Super Tiebreak (10 points, win by 2)
  if (isSuperTiebreak) {
    if (games1 < 10 && games2 < 10) {
      return { isValid: false, winner: null, reason: 'Super tie-break gra się do min. 10 punktów' };
    }
    const diff = Math.abs(games1 - games2);
    if (diff < 2) {
      return { isValid: false, winner: null, reason: 'Super tie-break wymaga min. 2 punktów przewagi (np. 10:8, 12:10)' };
    }
    return { isValid: true, winner: games1 > games2 ? 1 : 2 };
  }

  // Case 2: Standard tennis set
  // Cannot have negative games
  if (games1 < 0 || games2 < 0) {
    return { isValid: false, winner: null, reason: 'Liczba gemów nie może być ujemna' };
  }

  const maxGames = Math.max(games1, games2);
  const minGames = Math.min(games1, games2);
  const diff = maxGames - minGames;

  // Regular win with 6 games: 6:0, 6:1, 6:2, 6:3, 6:4
  if (maxGames === 6) {
    if (diff >= 2) {
      return { isValid: true, winner: games1 > games2 ? 1 : 2 };
    }
    return { isValid: false, winner: null, reason: 'Przy stanie 6:5 set nie jest zakończony (gra do 7:5)' };
  }

  // Win with 7 games: 7:5 or 7:6 (tiebreak)
  if (maxGames === 7) {
    if (minGames === 5) {
      return { isValid: true, winner: games1 > games2 ? 1 : 2 };
    }
    if (minGames === 6) {
      // Tie-break was played!
      const tb1 = tiebreak1 ?? 0;
      const tb2 = tiebreak2 ?? 0;
      const maxTb = Math.max(tb1, tb2);
      const minTb = Math.min(tb1, tb2);
      const tbDiff = maxTb - minTb;

      if (maxTb < 7) {
        return {
          isValid: false,
          winner: null,
          reason: 'W tie-breaku przy stanie 6:6 gra się do 7 punktów'
        };
      }
      if (tbDiff < 2) {
        return {
          isValid: false,
          winner: null,
          reason: 'Tie-break wymaga min. 2 punktów przewagi (np. 7:5, 8:6)'
        };
      }

      // Tie-break winner must correspond to set winner
      const setWinner = games1 > games2 ? 1 : 2;
      const tbWinner = tb1 > tb2 ? 1 : 2;
      if (setWinner !== tbWinner) {
        return {
          isValid: false,
          winner: null,
          reason: 'Zwycięzca tie-breaka musi być zwycięzcą seta 7:6'
        };
      }

      return { isValid: true, winner: setWinner };
    }

    return { isValid: false, winner: null, reason: 'Wynik 7 z mniej niż 5 gemami przeciwnika jest niemożliwy' };
  }

  if (maxGames < 6) {
    return { isValid: false, winner: null, reason: 'Set kończy się przy zdobyciu min. 6 gemów z przewagą 2 gemów' };
  }

  return { isValid: false, winner: null, reason: 'Nieprawidłowy wynik tenisowy seta' };
}

/**
 * Validates a complete match (best of 3 sets: first to 2 sets wins).
 */
export function validateMatch(sets: TennisSet[]): {
  isValid: boolean;
  winner: 1 | 2 | null;
  score1: number;
  score2: number;
  reason?: string;
} {
  if (!sets || sets.length === 0) {
    return { isValid: false, winner: null, score1: 0, score2: 0, reason: 'Brak wprowadzonych setów' };
  }

  let setsWon1 = 0;
  let setsWon2 = 0;

  for (let i = 0; i < sets.length; i++) {
    const setValidation = validateSet(sets[i]);
    if (!setValidation.isValid) {
      return {
        isValid: false,
        winner: null,
        score1: setsWon1,
        score2: setsWon2,
        reason: `Set ${i + 1}: ${setValidation.reason}`
      };
    }

    if (setValidation.winner === 1) setsWon1++;
    if (setValidation.winner === 2) setsWon2++;

    // If a player already won 2 sets, match is finished!
    if (setsWon1 === 2 || setsWon2 === 2) {
      if (i < sets.length - 1) {
        return {
          isValid: false,
          winner: null,
          score1: setsWon1,
          score2: setsWon2,
          reason: 'Mecz kończy się po zdobyciu 2 setów. Kolejny set jest zbędny.'
        };
      }
      return {
        isValid: true,
        winner: setsWon1 === 2 ? 1 : 2,
        score1: setsWon1,
        score2: setsWon2
      };
    }
  }

  // If we exhausted sets but neither reached 2 sets
  return {
    isValid: false,
    winner: null,
    score1: setsWon1,
    score2: setsWon2,
    reason: `Mecz trwa do 2 wygranych setów (obecny stan: ${setsWon1}:${setsWon2})`
  };
}

/**
 * Formats a single set score, e.g. "6:4", "7:6(4)", "[10:7]"
 */
export function formatSetScore(set: TennisSet): string {
  if (set.isSuperTiebreak) {
    return `[${set.games1}:${set.games2}]`;
  }
  if ((set.games1 === 7 && set.games2 === 6) || (set.games1 === 6 && set.games2 === 7)) {
    const minTb = Math.min(set.tiebreak1 ?? 0, set.tiebreak2 ?? 0);
    return `${set.games1}:${set.games2} (${minTb})`;
  }
  return `${set.games1}:${set.games2}`;
}

/**
 * Formats all sets into a clean string, e.g. "6:4, 3:6, 7:6 (5)"
 */
export function formatMatchScore(sets: TennisSet[]): string {
  return sets.map(formatSetScore).join(', ');
}

/**
 * Calculates league standings according to settings.
 * Ranking criteria:
 * 1. Points
 * 2. Set difference (+ / -)
 * 3. Game difference (+ / -)
 * 4. Games won
 * 5. Matches won
 * 6. Head-to-Head between tied players
 */
export function calculateStandings(
  players: Player[],
  matches: Match[],
  settings: LeagueSettings
): StandingRow[] {
  // Tylko zakończone mecze ligowe wliczają się do tabeli i punktacji (mecze towarzyskie nie dają punktów)
  const completedMatches = matches.filter(
    (m) => m.status === 'completed' && m.matchType !== 'friendly' && !m.isFriendly
  );

  const rows: StandingRow[] = players.map((player) => {
    let played = 0;
    let won = 0;
    let lost = 0;
    let setsWon = 0;
    let setsLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;
    let points = 0;
    const form: ('W' | 'L')[] = [];

    // Find all matches for this player sorted by date/creation ASC
    const playerMatches = completedMatches
      .filter((m) => m.player1Id === player.id || m.player2Id === player.id)
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const match of playerMatches) {
      played++;
      const isPlayer1 = match.player1Id === player.id;
      const isWinner = match.winnerId === player.id;

      let pSetsWon = 0;
      let pSetsLost = 0;

      for (const set of match.sets) {
        const myGames = isPlayer1 ? set.games1 : set.games2;
        const oppGames = isPlayer1 ? set.games2 : set.games1;

        if (set.isSuperTiebreak) {
          // Super tiebreak counts as 1 set
          if (myGames > oppGames) {
            pSetsWon++;
            gamesWon += 1; // or tiebreak points; standard is counting 1 game or score
          } else {
            pSetsLost++;
            gamesLost += 1;
          }
        } else {
          gamesWon += myGames;
          gamesLost += oppGames;
          if (myGames > oppGames) pSetsWon++;
          else pSetsLost++;
        }
      }

      setsWon += pSetsWon;
      setsLost += pSetsLost;

      if (isWinner) {
        won++;
        form.push('W');
        if (pSetsLost === 0) {
          points += settings.points2_0; // e.g. 3 pts
        } else {
          points += settings.points2_1; // e.g. 2 pts
        }
      } else {
        lost++;
        form.push('L');
        if (pSetsWon === 1) {
          points += settings.points1_2; // e.g. 1 pt
        } else {
          points += settings.points0_2; // e.g. 0 pts
        }
      }
    }

    return {
      rank: 0,
      player,
      played,
      won,
      lost,
      setsWon,
      setsLost,
      setDiff: setsWon - setsLost,
      gamesWon,
      gamesLost,
      gameDiff: gamesWon - gamesLost,
      points,
      form: form.slice(-5).reverse(), // Last 5 matches, most recent first
    };
  });

  // Sort standings
  rows.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Set Diff
    if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
    // 3. Game Diff
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    // 4. Sets Won
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    // 5. Matches Won
    if (b.won !== a.won) return b.won - a.won;
    // 6. Direct Head-to-Head if 2 tied
    const h2h = completedMatches.find(
      (m) =>
        (m.player1Id === a.player.id && m.player2Id === b.player.id) ||
        (m.player1Id === b.player.id && m.player2Id === a.player.id)
    );
    if (h2h && h2h.winnerId) {
      if (h2h.winnerId === a.player.id) return -1;
      if (h2h.winnerId === b.player.id) return 1;
    }
    // Alphabetical fallback
    return a.player.name.localeCompare(b.player.name);
  });

  // Assign ranks
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

/**
 * Gets Head-to-Head records between two players
 */
export function getH2H(player1Id: string, player2Id: string, matches: Match[]): {
  played: number;
  p1Wins: number;
  p2Wins: number;
  matches: Match[];
} {
  const directMatches = matches.filter(
    (m) =>
      m.status === 'completed' &&
      ((m.player1Id === player1Id && m.player2Id === player2Id) ||
        (m.player1Id === player2Id && m.player2Id === player1Id))
  );

  let p1Wins = 0;
  let p2Wins = 0;

  directMatches.forEach((m) => {
    if (m.winnerId === player1Id) p1Wins++;
    else if (m.winnerId === player2Id) p2Wins++;
  });

  return {
    played: directMatches.length,
    p1Wins,
    p2Wins,
    matches: directMatches.sort((a, b) => b.createdAt - a.createdAt),
  };
}

export const SURFACE_NAMES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  clay: { label: 'Mączka', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  hard: { label: 'Twardy', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  grass: { label: 'Trawa', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  carpet: { label: 'Hala/Dywan', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
};

/**
 * Formats YYYY-MM-DD date into Polish DD.MM.YYYY format
 */
export function formatDatePl(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

/**
 * Oblicza dokładną datę przypadającą minimum 2 miesiące kalendarzowe później.
 * Uwzględnia różne długości miesięcy i lata przestępne (np. 31 maja + 2 mc -> 31 lipca, 31 grudnia + 2 mc -> 28/29 lutego).
 */
export function getTwoMonthsLaterDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1]; // 1-indexed (1..12)
  const day = parts[2];

  let targetYear = year;
  let targetMonth = month + 2; // 1-indexed
  if (targetMonth > 12) {
    targetYear += Math.floor((targetMonth - 1) / 12);
    targetMonth = ((targetMonth - 1) % 12) + 1;
  }

  // Maksymalna liczba dni w miesiącu docelowym
  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, maxDays);

  const mm = String(targetMonth).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}

/**
 * Sprawdza, czy pomiędzy dwoma datami minęły co najmniej 2 miesiące kalendarzowe.
 */
export function hasTwoCalendarMonthsElapsed(earlierDateStr: string, laterDateStr: string): boolean {
  const minRequiredDate = getTwoMonthsLaterDate(earlierDateStr);
  return laterDateStr >= minRequiredDate;
}

export interface RematchCheckResult {
  isFriendly: boolean;
  reason?: string;
  lastMatchDate?: string;
  nextAllowedDate?: string;
  previousMatchCount: number;
}

/**
 * Weryfikuje regułę ligową dotyczącą ponownego meczu z tym samym przeciwnikiem:
 * - Dopuszczone jest rozegranie więcej niż 1 meczu z tym samym rywalem w sezonie.
 * - Od poprzedniego meczu muszą minąć min. 2 miesiące kalendarzowe, aby mecz był ligowy (i dawał punkty).
 * - Jeśli 2 miesiące nie minęły, mecz zostaje sklasyfikowany jako towarzyski (bez punktów ligowych).
 */
export function checkRematchEligibility(
  player1Id: string,
  player2Id: string,
  matchDate: string,
  existingMatches: Match[],
  currentMatchId?: string
): RematchCheckResult {
  if (!player1Id || !player2Id || player1Id === player2Id) {
    return { isFriendly: false, previousMatchCount: 0 };
  }

  // Znajdź wszystkie mecze rozegrane pomiędzy tymi dwoma graczami
  const h2hMatches = existingMatches.filter(
    (m) =>
      m.id !== currentMatchId &&
      ((m.player1Id === player1Id && m.player2Id === player2Id) ||
        (m.player1Id === player2Id && m.player2Id === player1Id))
  );

  if (h2hMatches.length === 0) {
    return { isFriendly: false, previousMatchCount: 0 };
  }

  // Posortuj po dacie malejąco (najnowsze mecze na początku)
  const sortedMatches = [...h2hMatches].sort((a, b) => b.date.localeCompare(a.date));

  // Szukamy poprzedniego meczu w stosunku do daty tworzonego meczu
  const priorMatches = sortedMatches.filter((m) => m.date <= matchDate);

  if (priorMatches.length > 0) {
    const lastPriorMatch = priorMatches[0];
    const nextAllowedDate = getTwoMonthsLaterDate(lastPriorMatch.date);

    if (matchDate < nextAllowedDate) {
      return {
        isFriendly: true,
        reason: `Z tym przeciwnikiem rozegrano już mecz w dniu ${formatDatePl(lastPriorMatch.date)}. Aby mecz liczył się do punktacji ligowej, muszą minąć min. 2 miesiące kalendarzowe (kolejny mecz ligowy możliwy od: ${formatDatePl(nextAllowedDate)}). Ten mecz zostaje zarejestrowany jako Towarzyski.`,
        lastMatchDate: lastPriorMatch.date,
        nextAllowedDate,
        previousMatchCount: h2hMatches.length,
      };
    }
  } else {
    // Jeśli użytkownik wpisuje datę wcześniejszą niż istniejący już w bazie mecz:
    const subsequentMatch = sortedMatches[sortedMatches.length - 1];
    const nextAllowedDate = getTwoMonthsLaterDate(matchDate);
    if (subsequentMatch.date < nextAllowedDate) {
      return {
        isFriendly: true,
        reason: `W terminarzu istnieje już mecz z tym przeciwnikiem z dnia ${formatDatePl(subsequentMatch.date)}. Odstęp pomiędzy meczami ligowymi wynosi mniej niż 2 miesiące kalendarzowe. Ten mecz zostaje zarejestrowany jako Towarzyski.`,
        lastMatchDate: subsequentMatch.date,
        nextAllowedDate,
        previousMatchCount: h2hMatches.length,
      };
    }
  }

  return { isFriendly: false, previousMatchCount: h2hMatches.length };
}

/**
 * Calculates the exact start timestamp (in milliseconds) for a match.
 * If time is not provided, defaults to 12:00 of the match date.
 */
export function getMatchStartTimestamp(match: Match): number {
  if (!match.date) return 0;
  // If time is missing, default to 12:00 so date arithmetic works cleanly
  const timePart = match.time && match.time.trim() ? match.time.trim() : '12:00';
  const parsed = new Date(`${match.date}T${timePart}:00`);
  const ts = parsed.getTime();
  return isNaN(ts) ? 0 : ts;
}

/**
 * Checks whether a scheduled match has passed its scheduled start time plus an optional offset.
 * @param match The match to check
 * @param offsetHours Optional hours offset (e.g. 0 for immediate overdue, 2 for 2 hours overdue)
 * @param now Current timestamp
 */
export function isScheduledMatchOverdue(
  match: Match,
  offsetHours: number = 0,
  now: number = Date.now()
): boolean {
  if (match.status !== 'scheduled') return false;
  const startTs = getMatchStartTimestamp(match);
  if (!startTs) return false;
  return now >= startTs + offsetHours * 60 * 60 * 1000;
}



