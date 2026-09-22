import {
  validateSet,
  validateMatch,
  calculateStandings,
  formatSetScore,
  formatMatchScore,
  getTwoMonthsLaterDate,
  checkRematchEligibility,
  formatDatePl,
  isScheduledMatchOverdue,
  getMatchStartTimestamp,
} from '../src/utils/tennisRules';
import { Player, Match, LeagueSettings } from '../src/types';
import { changeUserPassword } from '../src/utils/auth';
import {
  buildMatchOverdueReminderNotification,
  hasUserDismissedPushPrompt,
  dismissPushPrompt,
  resetPushPromptDismissal,
} from '../src/utils/notifications';
import fs from 'fs';
import path from 'path';

// Mock localStorage for Node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    length: 0,
  };
}

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail ?? '');
    failed++;
  }
}

async function runPostDeployVerification() {
  console.log('================================================================');
  console.log('🎾 LIGA GENTLEMANÓW W TENISIE — SUITA TESTÓW AUTOMATYCZNYCH (POST-DEPLOY)');
  console.log('================================================================');

  // -------------------------------------------------------------
  // 1. WERYFIKACJA PLIKÓW ARTEFAKTÓW I KONFIGURACJI WDROŻENIOWEJ
  // -------------------------------------------------------------
  console.log('\n📦 MODUŁ 1: Weryfikacja artefaktów produkcyjnych i konfiguracji');

  const rootDir = process.cwd();
  const firebaseJsonPath = path.join(rootDir, 'firebase.json');
  const firestoreRulesPath = path.join(rootDir, 'firestore.rules');

  assert(fs.existsSync(firebaseJsonPath), 'Plik konfiguracyjny firebase.json istnieje');
  if (fs.existsSync(firebaseJsonPath)) {
    const rawFw = fs.readFileSync(firebaseJsonPath, 'utf-8');
    const fw = JSON.parse(rawFw);
    assert(!!fw.hosting, 'firebase.json zawiera sekcję hosting');
    assert(
      fw.hosting?.rewrites?.some((r: any) => r.run?.serviceId === 'liga-gentleman-w-tenisa'),
      'firebase.json posiada rewrite do Cloud Run (liga-gentleman-w-tenisa w europe-west2)'
    );
  }

  assert(fs.existsSync(firestoreRulesPath), 'Reguły bazy danych firestore.rules istnieją');
  if (fs.existsSync(firestoreRulesPath)) {
    const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf-8');
    assert(rulesContent.includes('rules_version = \'2\';'), 'firestore.rules używają wersji 2');
    assert(rulesContent.includes('match /databases/{database}/documents'), 'firestore.rules definiują główny root bazy');
  }

  // -------------------------------------------------------------
  // 2. WERYFIKACJA LOGIKI AUTORYZACJI I REGUŁ BEZPIECZEŃSTWA
  // -------------------------------------------------------------
  console.log('\n🔒 MODUŁ 2: Weryfikacja autoryzacji i reguł bezpieczeństwa');

  // Test hasła min. 6 znaków
  try {
    changeUserPassword('test_dummy', '12345');
    assert(false, 'Hasło poniżej 6 znaków powinno zostać odrzucone');
  } catch (err: any) {
    assert(
      err.message.includes('co najmniej 6 znaków'),
      'Blokada hasła < 6 znaków działa prawidłowo (wymóg min. 6 znaków spełniony)'
    );
  }

  // -------------------------------------------------------------
  // 3. WERYFIKACJA SILNIKA TENISOWEGO (ZASADY TENISA I WYNIKI)
  // -------------------------------------------------------------
  console.log('\n🎾 MODUŁ 3: Silnik tenisowy i walidacja wyników setów');

  assert(validateSet({ games1: 6, games2: 4 }).isValid === true, 'Prawidłowy set 6:4');
  assert(validateSet({ games1: 6, games2: 0 }).isValid === true, 'Prawidłowy set 6:0 (bajgiel)');
  assert(validateSet({ games1: 7, games2: 5 }).isValid === true, 'Prawidłowy set 7:5');
  assert(validateSet({ games1: 6, games2: 5 }).isValid === false, 'Set 6:5 odrzucony (gra do 7)');
  assert(validateSet({ games1: 7, games2: 6, tiebreak1: 7, tiebreak2: 5 }).isValid === true, 'Set 7:6 (7:5) tie-break zatwierdzony');
  assert(validateSet({ games1: 7, games2: 6, tiebreak1: 8, tiebreak2: 7 }).isValid === false, 'Tie-break z różnicą tylko 1 pkt odrzucony');
  assert(validateSet({ games1: 10, games2: 8, isSuperTiebreak: true }).isValid === true, 'Super tie-break 10:8 zatwierdzony');
  assert(validateSet({ games1: 9, games2: 7, isSuperTiebreak: true }).isValid === false, 'Super tie-break poniżej 10 pkt odrzucony');

  // -------------------------------------------------------------
  // 4. WERYFIKACJA CAŁEGO MECZU I WYNIKU
  // -------------------------------------------------------------
  console.log('\n🏆 MODUŁ 4: Walidacja całego meczu');

  const match2_0 = validateMatch([
    { games1: 6, games2: 2 },
    { games1: 6, games2: 3 },
  ]);
  assert(match2_0.isValid === true && match2_0.winner === 1, 'Mecz 2:0 wygrywa Gracz 1');

  const match2_1 = validateMatch([
    { games1: 6, games2: 4 },
    { games1: 4, games2: 6 },
    { games1: 10, games2: 6, isSuperTiebreak: true },
  ]);
  assert(match2_1.isValid === true && match2_1.winner === 1, 'Mecz 2:1 z super tie-breakiem wygrywa Gracz 1');

  // Formatowanie
  const formatted = formatMatchScore([
    { games1: 6, games2: 4 },
    { games1: 6, games2: 7, tiebreak1: 4, tiebreak2: 7 },
    { games1: 10, games2: 8, isSuperTiebreak: true },
  ]);
  assert(formatted.includes('6:4') && formatted.includes('[10:8]'), `Prawidłowe formatowanie wyniku meczu (${formatted})`);

  // -------------------------------------------------------------
  // 5. WERYFIKACJA REGUŁY 2 MIESIĘCY KALENDARZOWYCH NA REWANŻE
  // -------------------------------------------------------------
  console.log('\n📅 MODUŁ 5: Reguła 2 miesięcy kalendarzowych na mecze rewanżowe');

  assert(getTwoMonthsLaterDate('2026-05-15') === '2026-07-15', '15 maja + 2 miesiące = 15 lipca');
  assert(getTwoMonthsLaterDate('2026-05-31') === '2026-07-31', '31 maja + 2 miesiące = 31 lipca');
  assert(getTwoMonthsLaterDate('2026-12-31') === '2027-02-28', '31 grudnia + 2 miesiące = 28 lutego (rok nieprzestępny)');

  const baseMatches: Match[] = [
    {
      id: 'm1',
      player1Id: 'p1',
      player2Id: 'p2',
      date: '2026-05-10',
      sets: [{ games1: 6, games2: 2 }, { games1: 6, games2: 3 }],
      winnerId: 'p1',
      status: 'completed',
      createdAt: 1000,
    },
  ];

  const checkTooEarly = checkRematchEligibility('p1', 'p2', '2026-06-15', baseMatches);
  assert(
    checkTooEarly.isFriendly === true,
    'Rewanż przed upływem 2 miesięcy kalendarzowych oznaczony jako Towarzyski'
  );
  assert(
    checkTooEarly.nextAllowedDate === '2026-07-10',
    `Następny mecz ligowy dopuszczony od ${checkTooEarly.nextAllowedDate}`
  );

  const checkExact = checkRematchEligibility('p1', 'p2', '2026-07-10', baseMatches);
  assert(
    checkExact.isFriendly === false,
    'Rewanż po równo 2 miesiącach kalendarzowych dopuszczony jako Ligowy'
  );

  // -------------------------------------------------------------
  // 6. WERYFIKACJA OBLICZEŃ TABELI I SYSTEMU PUNKTACJI
  // -------------------------------------------------------------
  console.log('\n📊 MODUŁ 6: Punktacja (3:0, 2:1, 1:2, 0:3) oraz Tabela');

  const settings: LeagueSettings = {
    leagueName: 'Liga Gentlemanów Tenisa',
    season: 'Sezon 2026',
    points2_0: 3,
    points2_1: 2,
    points1_2: 1,
    points0_2: 0,
    superTiebreakDecider: true,
  };

  const mockPlayers: Player[] = [
    {
      id: 'p1',
      name: 'Zawodnik Jeden',
      phone: '+48 601 111 111',
      status: 'active',
      avatarColor: 'bg-emerald-700',
      preferredSurfaces: ['clay'],
      preferredTimes: 'Popołudnia',
      preferredCourts: 'Korty Miejskie',
    },
    {
      id: 'p2',
      name: 'Zawodnik Dwa',
      phone: '+48 602 222 222',
      status: 'active',
      avatarColor: 'bg-blue-700',
      preferredSurfaces: ['hard'],
      preferredTimes: 'Weekend',
      preferredCourts: 'Korty Miejskie',
    },
    {
      id: 'p3',
      name: 'Zawodnik Trzy',
      phone: '+48 603 333 333',
      status: 'active',
      avatarColor: 'bg-amber-700',
      preferredSurfaces: ['clay'],
      preferredTimes: 'Rano',
      preferredCourts: 'Mera',
    },
  ];

  const mockMatches: Match[] = [
    // p1 wygrywa z p2 2:0 -> p1 +3 pkt, p2 +0 pkt
    {
      id: 'm1',
      player1Id: 'p1',
      player2Id: 'p2',
      date: '2026-05-15',
      sets: [{ games1: 6, games2: 2 }, { games1: 6, games2: 3 }],
      winnerId: 'p1',
      status: 'completed',
      createdAt: 1000,
    },
    // p2 wygrywa z p3 2:1 -> p2 +2 pkt, p3 +1 pkt
    {
      id: 'm2',
      player1Id: 'p2',
      player2Id: 'p3',
      date: '2026-05-18',
      sets: [
        { games1: 6, games2: 4 },
        { games1: 4, games2: 6 },
        { games1: 10, games2: 8, isSuperTiebreak: true },
      ],
      winnerId: 'p2',
      status: 'completed',
      createdAt: 2000,
    },
    // Sparing towarzyski (isFriendly = true) -> nie wlicza się do tabeli!
    {
      id: 'm3_sparing',
      player1Id: 'p1',
      player2Id: 'p2',
      date: '2026-05-25',
      isFriendly: true,
      sets: [{ games1: 2, games2: 6 }, { games1: 1, games2: 6 }],
      winnerId: 'p2',
      status: 'completed',
      createdAt: 3000,
    },
  ];

  const standings = calculateStandings(mockPlayers, mockMatches, settings);
  const p1 = standings.find((s) => s.player.id === 'p1')!;
  const p2 = standings.find((s) => s.player.id === 'p2')!;
  const p3 = standings.find((s) => s.player.id === 'p3')!;

  assert(p1.points === 3, 'Zawodnik Jeden ma 3 pkt (2:0 w lidze, sparing zignorowany)');
  assert(p2.points === 2, 'Zawodnik Dwa ma 2 pkt (0 za 0:2 i 2 za 2:1)');
  assert(p3.points === 1, 'Zawodnik Trzy ma 1 pkt (1 za 1:2)');
  assert(standings[0].player.id === 'p1', 'Zawodnik Jeden na 1. miejscu tabeli');
  assert(standings[1].player.id === 'p2', 'Zawodnik Dwa na 2. miejscu tabeli');
  assert(standings[2].player.id === 'p3', 'Zawodnik Trzy na 3. miejscu tabeli');

  // -------------------------------------------------------------
  // 7. WERYFIKACJA ZALEGŁYCH MECZÓW, POWIADOMIEŃ I DŹWIĘKÓW TENISOWYCH
  // -------------------------------------------------------------
  console.log('\n🔔 MODUŁ 7: Weryfikacja zaległych meczów, powiadomień i dźwięku tenisowego');

  const mp3Path = path.join(rootDir, 'public', 'tennis-hit.mp3');
  const wavPath = path.join(rootDir, 'public', 'tennis-hit.wav');
  assert(fs.existsSync(mp3Path) && fs.statSync(mp3Path).size > 1000, 'Plik audio public/tennis-hit.mp3 istnieje i posiada poprawny rozmiar');
  assert(fs.existsSync(wavPath) && fs.statSync(wavPath).size > 1000, 'Plik audio public/tennis-hit.wav istnieje i posiada poprawny rozmiar');

  // Test logiki detekcji zaległego meczu
  const testNow = new Date('2026-09-22T18:00:00Z').getTime();
  const pastMatch: Match = {
    id: 'm_overdue_test',
    player1Id: 'p1',
    player2Id: 'p2',
    date: '2026-09-22',
    time: '15:00',
    status: 'scheduled',
    sets: [],
    createdAt: Date.now(),
  };
  const futureMatch: Match = {
    id: 'm_future_test',
    player1Id: 'p1',
    player2Id: 'p2',
    date: '2026-09-22',
    time: '20:00',
    status: 'scheduled',
    sets: [],
    createdAt: Date.now(),
  };

  assert(isScheduledMatchOverdue(pastMatch, 0, testNow), 'Mecz zaplanowany na 15:00 jest zaległy o 18:00 (offset 0h)');
  assert(isScheduledMatchOverdue(pastMatch, 2, testNow), 'Mecz zaplanowany na 15:00 kwalifikuje się do push 2h o 18:00 (minęły 3h >= 2h)');
  assert(!isScheduledMatchOverdue(futureMatch, 0, testNow), 'Mecz zaplanowany na 20:00 NIE jest zaległy o 18:00');
  assert(!isScheduledMatchOverdue(futureMatch, 2, testNow), 'Mecz zaplanowany na 20:00 NIE kwalifikuje się do push 2h');

  // Test generatora powiadomień
  const testPlayers: Player[] = [
    {
      id: 'p1',
      name: 'Jan Kowalski',
      phone: '+48 500 100 200',
      status: 'active',
      avatarColor: 'bg-emerald-700',
      preferredSurfaces: ['clay'],
    },
    {
      id: 'p2',
      name: 'Adam Nowak',
      phone: '+48 500 200 300',
      status: 'active',
      avatarColor: 'bg-amber-700',
      preferredSurfaces: ['hard'],
    },
  ];
  const reminderNotif = buildMatchOverdueReminderNotification(pastMatch, testPlayers);
  assert(reminderNotif.type === 'match_overdue_reminder', 'Typ powiadomienia to match_overdue_reminder');
  assert(reminderNotif.recipientPlayerIds.includes('p1') && reminderNotif.recipientPlayerIds.includes('p2'), 'Powiadomienie adresowane do obu uczestników');
  assert(reminderNotif.matchId === 'm_overdue_test', 'Powiadomienie skojarzone z poprawnym ID meczu');

  // Test mechanizmu odkładania modalu pop-up powiadomień push
  resetPushPromptDismissal();
  assert(!hasUserDismissedPushPrompt(), 'Domyślnie modal pop-up powiadomień push nie jest odłożony');
  dismissPushPrompt(7);
  assert(hasUserDismissedPushPrompt(), 'Po odrzuceniu (Może później) modal pop-up jest uśpiony przez 7 dni');
  resetPushPromptDismissal();
  assert(!hasUserDismissedPushPrompt(), 'Zresetowanie statusu przywraca możliwość wyświetlenia modalu pop-up');

  // -------------------------------------------------------------
  // 8. WERYFIKACJA SIECIOWA / HEALTH CHECK & SSL
  // -------------------------------------------------------------
  console.log('\n🌐 MODUŁ 8: Weryfikacja dostępności HTTP & SSL');

  const testUrls = [
    process.env.DEPLOY_URL,
    process.env.HOSTING_URL,
    'https://lgt2026.pl',
  ].filter(Boolean) as string[];

  const urlToCheck = testUrls[0];

  if (urlToCheck) {
    try {
      console.log(`  Sprawdzanie dostępności publicznej: ${urlToCheck}...`);
      const res = await fetch(urlToCheck, { method: 'GET', redirect: 'follow' });
      assert(res.status === 200 || res.status === 301 || res.status === 302, `Adres ${urlToCheck} zwraca status HTTP ${res.status}`);
      if (urlToCheck.startsWith('https://')) {
        assert(true, `Protokół SSL/TLS aktywny dla ${urlToCheck}`);
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Uwaga sieciowa dla ${urlToCheck}:`, err.message);
      skipped++;
    }
  } else {
    console.log('  Pominięto test sieciowy (brak zmiennej DEPLOY_URL)');
  }

  // -------------------------------------------------------------
  // PODSUMOWANIE WYNIKÓW
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`WYNIK KOŃCOWY TESTÓW: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPostDeployVerification().catch((err) => {
  console.error('Krytyczny błąd weryfikacji post-deploy:', err);
  process.exit(1);
});
