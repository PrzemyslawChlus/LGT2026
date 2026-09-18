import {
  validateSet,
  validateMatch,
  calculateStandings,
  formatSetScore,
  formatMatchScore,
  getTwoMonthsLaterDate,
  checkRematchEligibility,
  formatDatePl,
} from '../src/utils/tennisRules';
import { Player, Match, LeagueSettings } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail ?? '');
    failed++;
  }
}

console.log('\n🎾 TEST SUITE 1: Walidacja wyników tenisowych (validateSet)');

// Standard sets
assert(validateSet({ games1: 6, games2: 4 }).isValid === true, '6:4 jest prawidłowym wynikiem seta');
assert(validateSet({ games1: 6, games2: 0 }).isValid === true, '6:0 jest prawidłowym wynikiem seta (bajgiel)');
assert(validateSet({ games1: 7, games2: 5 }).isValid === true, '7:5 jest prawidłowym wynikiem seta');
assert(validateSet({ games1: 5, games2: 7 }).isValid === true, '5:7 jest prawidłowym wynikiem seta (wygrana gracza 2)');
assert(validateSet({ games1: 6, games2: 5 }).isValid === false, '6:5 jest nieprawidłowe (gra toczy się dalej)');
assert(validateSet({ games1: 6, games2: 6 }).isValid === false, '6:6 bez tie-breaka jest nieprawidłowe');
assert(validateSet({ games1: 7, games2: 6, tiebreak1: 7, tiebreak2: 4 }).isValid === true, '7:6 (7:4) tie-break jest prawidłowy');
assert(validateSet({ games1: 7, games2: 6, tiebreak1: 4, tiebreak2: 7 }).isValid === false, '7:6 gdy tie-break wygrał gracz 2 jest odrzucany');
assert(validateSet({ games1: 7, games2: 6, tiebreak1: 6, tiebreak2: 5 }).isValid === false, '7:6 z tie-breakiem poniżej 7 punktów jest odrzucany');
assert(validateSet({ games1: 7, games2: 6, tiebreak1: 8, tiebreak2: 7 }).isValid === false, 'Tie-break z różnicą tylko 1 pkt jest odrzucany');
assert(validateSet({ games1: 7, games2: 6, tiebreak1: 9, tiebreak2: 7 }).isValid === true, 'Tie-break 9:7 przy grze na przewagi jest prawidłowy');

// Super tie-break
assert(validateSet({ games1: 10, games2: 8, isSuperTiebreak: true }).isValid === true, 'Super tie-break 10:8 jest prawidłowy');
assert(validateSet({ games1: 12, games2: 10, isSuperTiebreak: true }).isValid === true, 'Super tie-break 12:10 na przewagi jest prawidłowy');
assert(validateSet({ games1: 9, games2: 7, isSuperTiebreak: true }).isValid === false, 'Super tie-break poniżej 10 punktów jest odrzucany');
assert(validateSet({ games1: 10, games2: 9, isSuperTiebreak: true }).isValid === false, 'Super tie-break z przewagą 1 pkt jest odrzucany');

console.log('\n🏆 TEST SUITE 2: Walidacja całego meczu (validateMatch)');

const match2_0 = validateMatch([
  { games1: 6, games2: 2 },
  { games1: 6, games2: 3 },
]);
assert(match2_0.isValid === true && match2_0.winner === 1, 'Mecz 2:0 wygrywa gracz 1');

const match2_1 = validateMatch([
  { games1: 6, games2: 4 },
  { games1: 3, games2: 6 },
  { games1: 10, games2: 7, isSuperTiebreak: true },
]);
assert(match2_1.isValid === true && match2_1.winner === 1, 'Mecz 2:1 z super tie-breakiem jest prawidłowy');

const matchUnfinished = validateMatch([
  { games1: 6, games2: 4 },
]);
assert(matchUnfinished.isValid === false, 'Mecz z tylko 1 setem jest niekompletny');

const matchExtraSet = validateMatch([
  { games1: 6, games2: 2 },
  { games1: 6, games2: 1 },
  { games1: 6, games2: 0 },
]);
assert(matchExtraSet.isValid === false, 'Mecz z niepotrzebnym 3. setem po 2:0 jest odrzucany');

console.log('\n📊 TEST SUITE 3: Punktacja i Tabela Ligowa (calculateStandings)');

const settings: LeagueSettings = {
  leagueName: 'Liga Gentlemanów Tenisa',
  season: 'Sezon 2026',
  points2_0: 3,
  points2_1: 2,
  points1_2: 1,
  points0_2: 0,
  superTiebreakDecider: true,
};

const players: Player[] = [
  { id: 'p1', name: 'Gracz A', phone: '111', avatarColor: 'bg-emerald-700', status: 'active', preferredSurfaces: ['Mączka'], preferredTimes: 'Dni robocze', preferredCourts: 'Korty Ligi' },
  { id: 'p2', name: 'Gracz B', phone: '222', avatarColor: 'bg-blue-700', status: 'active', preferredSurfaces: ['Twardy'], preferredTimes: 'Weekend', preferredCourts: 'Korty Ligi' },
  { id: 'p3', name: 'Gracz C', phone: '333', avatarColor: 'bg-amber-700', status: 'active', preferredSurfaces: ['Mączka'], preferredTimes: 'Wieczory', preferredCourts: 'Korty Ligi' },
];

const matches: Match[] = [
  // Gracz A pokonuje Gracza B 2:0 (3 pkt dla A, 0 pkt dla B)
  {
    id: 'm1',
    player1Id: 'p1',
    player2Id: 'p2',
    date: '2026-05-01',
    sets: [{ games1: 6, games2: 3 }, { games1: 6, games2: 4 }],
    winnerId: 'p1',
    status: 'completed',
    createdAt: 1000,
  },
  // Gracz B pokonuje Gracza C 2:1 (2 pkt dla B, 1 pkt dla C)
  {
    id: 'm2',
    player1Id: 'p2',
    player2Id: 'p3',
    date: '2026-05-02',
    sets: [
      { games1: 4, games2: 6 },
      { games1: 6, games2: 2 },
      { games1: 10, games2: 7, isSuperTiebreak: true },
    ],
    winnerId: 'p2',
    status: 'completed',
    createdAt: 2000,
  },
];

const standings = calculateStandings(players, matches, settings);

const rowA = standings.find(r => r.player.id === 'p1');
const rowB = standings.find(r => r.player.id === 'p2');
const rowC = standings.find(r => r.player.id === 'p3');

assert(rowA?.points === 3, 'Gracz A zdobył 3 punkty za wygraną 2:0');
assert(rowB?.points === 2, 'Gracz B zdobył 2 punkty za 2:1 (oraz 0 za 0:2)');
assert(rowC?.points === 1, 'Gracz C zdobył 1 punkt za porażkę 1:2');
assert(standings[0].player.id === 'p1', 'Liderem tabeli jest Gracz A (1. miejsce)');
assert(standings[1].player.id === 'p2', '2. miejsce zajmuje Gracz B');
assert(standings[2].player.id === 'p3', '3. miejsce zajmuje Gracz C');

console.log('\n🎨 TEST SUITE 4: Formatowanie wyników (formatMatchScore)');
const formattedScore = formatMatchScore([
  { games1: 6, games2: 4 },
  { games1: 6, games2: 7, tiebreak1: 5, tiebreak2: 7 },
  { games1: 10, games2: 8, isSuperTiebreak: true },
]);
assert(formattedScore === '6:4, 6:7 (5), [10:8]', `Prawidłowe formatowanie wyniku: ${formattedScore}`);

console.log('\n📅 TEST SUITE 5: Reguła 2 miesięcy kalendarzowych i rewanże');

// 5.1 Test getTwoMonthsLaterDate
const date1 = getTwoMonthsLaterDate('2026-05-15');
assert(date1 === '2026-07-15', `15 maja + 2 miesiące = 15 lipca (wynik: ${date1})`);

const date2 = getTwoMonthsLaterDate('2026-05-31');
assert(date2 === '2026-07-31', `31 maja + 2 miesiące = 31 lipca (wynik: ${date2})`);

const date3 = getTwoMonthsLaterDate('2026-12-31');
assert(date3 === '2027-02-28', `31 grudnia + 2 miesiące = 28 lutego (wynik: ${date3})`);

// 5.2 Test checkRematchEligibility
const baseMatches: Match[] = [
  {
    id: 'm-prev-1',
    player1Id: 'p1',
    player2Id: 'p2',
    date: '2026-05-10',
    sets: [{ games1: 6, games2: 4 }, { games1: 6, games2: 3 }],
    winnerId: 'p1',
    status: 'completed',
    createdAt: 1000,
  }
];

// Test: Pierwszy mecz pomiędzy p1 a p3 (nowi rywale)
const checkNew = checkRematchEligibility('p1', 'p3', '2026-05-15', baseMatches);
assert(!checkNew.isFriendly, 'Pierwszy mecz pomiędzy graczami jest zawsze ligowy');

// Test: Mecz po 20 dniach (2026-05-30) pomiędzy p1 a p2 -> powinien być Towarzyski
const checkTooEarly = checkRematchEligibility('p1', 'p2', '2026-05-30', baseMatches);
assert(checkTooEarly.isFriendly, 'Mecz po 20 dniach od poprzedniego zostaje oznaczony jako Towarzyski');
assert(checkTooEarly.nextAllowedDate === '2026-07-10', `Następny dozwolony mecz ligowy od 2026-07-10 (jest: ${checkTooEarly.nextAllowedDate})`);

// Test: Mecz po 1 miesiącu i 25 dniach (2026-07-05) -> nadal Towarzyski
const checkStillEarly = checkRematchEligibility('p1', 'p2', '2026-07-05', baseMatches);
assert(checkStillEarly.isFriendly, 'Mecz przed upływem pełnych 2 miesięcy kalendarzowych (5 lipca) jest Towarzyski');

// Test: Mecz po dokładnie 2 miesiącach (2026-07-10) -> dozwolony Ligowy
const checkExact = checkRematchEligibility('p1', 'p2', '2026-07-10', baseMatches);
assert(!checkExact.isFriendly, 'Mecz po dokładnie 2 miesiącach kalendarzowych (10 lipca) jest w pełni ligowy');

// Test: Mecz po 3 miesiącach (2026-08-15) -> dozwolony Ligowy
const checkLater = checkRematchEligibility('p1', 'p2', '2026-08-15', baseMatches);
assert(!checkLater.isFriendly, 'Mecz po ponad 2 miesiącach (15 sierpnia) jest w pełni ligowy');

// 5.3 Test: Wpływ meczu Towarzyskiego na tabelę ligową (brak punktów)
const matchesWithFriendly: Match[] = [
  ...baseMatches,
  {
    id: 'm-friendly-1',
    player1Id: 'p1',
    player2Id: 'p2',
    date: '2026-05-25',
    sets: [{ games1: 3, games2: 6 }, { games1: 2, games2: 6 }],
    winnerId: 'p2',
    status: 'completed',
    isFriendly: true,
    matchType: 'friendly',
    friendlyReason: 'Odstęp krótszy niż 2 miesiące',
    createdAt: 2000,
  }
];

const standingsWithFriendly = calculateStandings(players, matchesWithFriendly, settings);
const p1Row = standingsWithFriendly.find(r => r.player.id === 'p1');
const p2Row = standingsWithFriendly.find(r => r.player.id === 'p2');

assert(p1Row?.points === 3, `P1 ma nadal 3 pkt (porażka w sparingu nie odjęła mu pozycji lidera, ma: ${p1Row?.points})`);
assert(p2Row?.points === 0, `P2 ma nadal 0 pkt (wygrana w sparingu nie dała mu punktów ligowych, ma: ${p2Row?.points})`);
assert(p1Row?.played === 1, `P1 ma 1 mecz ligowy (mecz towarzyski nie wlicza się do rozegranych meczów ligowych, ma: ${p1Row?.played})`);

console.log('\n🎯 TEST SUITE 6: Proponowanie kolejnego rywala (getOpponentSuggestions)');
const testPlayers: Player[] = [
  { id: 'u1', name: 'Gracz Główny', phone: '+48 111 222 333', avatarColor: 'bg-emerald-700', preferredSurfaces: ['Mączka'], status: 'active' },
  { id: 'u2', name: 'Stary Znajomy', phone: '+48 222 333 444', avatarColor: 'bg-blue-700', preferredSurfaces: ['Mączka'], status: 'active' },
  { id: 'u3', name: 'Nowy Rywal', phone: '+48 333 444 555', avatarColor: 'bg-amber-700', preferredSurfaces: ['Mączka'], status: 'active' },
  { id: 'u4', name: 'Rywal do Rewanżu', phone: '+48 444 555 666', avatarColor: 'bg-purple-700', preferredSurfaces: ['Mączka'], status: 'active' },
];

const testMatches: Match[] = [
  // Z u2 graliśmy 5 dni temu
  {
    id: 'm-u1-u2',
    player1Id: 'u1',
    player2Id: 'u2',
    date: '2026-09-10',
    sets: [{ games1: 6, games2: 4 }, { games1: 6, games2: 3 }],
    winnerId: 'u1',
    status: 'completed',
    createdAt: 100,
  },
  // Z u4 graliśmy 3 miesiące temu (2026-06-01) - kwalifikuje się do rewanżu ligowego!
  {
    id: 'm-u1-u4',
    player1Id: 'u1',
    player2Id: 'u4',
    date: '2026-06-01',
    sets: [{ games1: 4, games2: 6 }, { games1: 5, games2: 7 }],
    winnerId: 'u4',
    status: 'completed',
    createdAt: 50,
  },
  // Z u3 NIE graliśmy ani razu!
];

const testStandings = calculateStandings(testPlayers, testMatches, settings);
const { suggestions, stats: explorationStats } = (await import('../src/utils/opponentSuggester')).getOpponentSuggestions(
  'u1',
  testPlayers,
  testMatches,
  testStandings,
  '2026-09-15'
);

assert(suggestions.length === 3, 'Wygenerowano sugestie dla 3 rywali');
assert(suggestions[0].opponent.id === 'u3', `Najwyższy priorytet ma u3 (Nowy Rywal, z którym nigdy nie grano), otrzymano: ${suggestions[0].opponent.name}`);
assert(suggestions[0].priority === 'unplayed', 'Priorytet pierwszego rywala to unplayed');
assert(suggestions[1].opponent.id === 'u4', `Drugi priorytet ma u4 (Rywal do Rewanżu po upływie 2 miesięcy), otrzymano: ${suggestions[1].opponent.name}`);
assert(suggestions[1].priority === 'rematch_eligible', 'Priorytet drugiego rywala to rematch_eligible');
assert(suggestions[2].opponent.id === 'u2', `Ostatni priorytet ma u2 (grano 5 dni temu - mecz tylko towarzyski), otrzymano: ${suggestions[2].opponent.name}`);
assert(explorationStats?.unplayedOpponentsCount === 1, `Liczba niezagranych rywali to 1 (jest: ${explorationStats?.unplayedOpponentsCount})`);
assert(explorationStats?.playedOpponentsCount === 2, `Liczba zagranych rywali to 2 (jest: ${explorationStats?.playedOpponentsCount})`);
assert(explorationStats?.explorationRate === 67, `Wskaźnik eksploracji ligi to 67% (jest: ${explorationStats?.explorationRate}%)`);
assert(explorationStats?.avgLeagueMatches === 1, `Średnia ligi to 1 mecz/gracza (jest: ${explorationStats?.avgLeagueMatches})`);
assert(typeof explorationStats?.avgLeagueMatchesMonthly === 'number', 'Miesięczna średnia ligi jest liczbą');
assert(explorationStats!.avgLeagueMatchesMonthly > 0, `Miesięczna średnia ligi jest dodatnia (${explorationStats?.avgLeagueMatchesMonthly} m./miesiąc)`);

// Test pacing for u3 (0 meczów - powinien zostać zmobilizowany ze względu na tempo poniżej miesięcznej średniej)
const { stats: statsU3 } = (await import('../src/utils/opponentSuggester')).getOpponentSuggestions(
  'u3',
  testPlayers,
  testMatches,
  testStandings,
  '2026-09-15'
);
assert(statsU3?.pace.status === 'behind', `Gracz u3 bez meczów ma status 'behind', otrzymano: ${statsU3?.pace.status}`);
assert(statsU3?.pace.messageType === 'mobilize', `Gracz u3 otrzymuje komunikat mobilizujący ('mobilize'), otrzymano: ${statsU3?.pace.messageType}`);
assert(statsU3?.pace.playerMatchesPerMonth === 0, `Gracz u3 ma 0 m./miesiąc, otrzymano: ${statsU3?.pace.playerMatchesPerMonth}`);
assert(statsU3?.pace.message.includes('miesięcznej średniej'), 'Komunikat dla gracza u3 odnosi się do miesięcznej średniej');

// Test pacing for gracz z dużą liczbą meczów (powyżej średniej miesięcznej - powinien zostać pochwalony)
const activeTestMatches = [
  ...testMatches,
  {
    id: 'm-extra-1',
    player1Id: 'u1',
    player2Id: 'u2',
    date: '2026-07-01',
    sets: [{ games1: 6, games2: 2 }, { games1: 6, games2: 3 }],
    winnerId: 'u1',
    status: 'completed' as const,
    createdAt: 60,
  },
  {
    id: 'm-extra-2',
    player1Id: 'u1',
    player2Id: 'u4',
    date: '2026-08-01',
    sets: [{ games1: 6, games2: 4 }, { games1: 6, games2: 4 }],
    winnerId: 'u1',
    status: 'completed' as const,
    createdAt: 70,
  }
];
const standingsExtra = calculateStandings(testPlayers, activeTestMatches, settings);
const { stats: statsU1High } = (await import('../src/utils/opponentSuggester')).getOpponentSuggestions(
  'u1',
  testPlayers,
  activeTestMatches,
  standingsExtra,
  '2026-09-15'
);
assert(statsU1High?.pace.status === 'ahead', `Gracz u1 ze znaczną przewagą meczów ma status 'ahead', otrzymano: ${statsU1High?.pace.status}`);
assert(statsU1High?.pace.messageType === 'praise', `Gracz u1 otrzymuje komunikat chwalący ('praise'), otrzymano: ${statsU1High?.pace.messageType}`);
assert(statsU1High!.pace.playerMatchesPerMonth > statsU1High!.pace.avgLeagueMatchesMonthly, 'Gracz u1 ma miesięczne tempo wyższe od średniej miesięcznej ligi');
assert(statsU1High?.pace.message.includes('miesięczna średnia'), 'Komunikat chwalący dla gracza u1 odnosi się do miesięcznej średniej');

console.log(`\n========================================`);
console.log(`PODSUMOWANIE TESTÓW: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
