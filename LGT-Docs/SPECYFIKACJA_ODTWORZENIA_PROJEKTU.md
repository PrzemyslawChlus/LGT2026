# Master Blueprint & Specyfikacja Odtworzenia Projektu (Dla Agenta AI)

> **DLA MODELU / AGENTA KODUJĄCEGO AI:**  
> Niniejszy dokument stanowi samowystarczalną specyfikację techniczną poziomu L4. Posiadasz w nim kompletny schemat architektury, typów, reguł biznesowych, algorytmów oraz komponentów, który pozwala odtworzyć aplikację **Liga Gentlemanów w Tenisie (LGT 2026)** od absolutnego zera do stanu produkcyjnego bez żadnych dodatkowych informacji.
>
> **Wersja:** `v2026.20260922.2205`  
> **Changelog:** Pełna historia zmian znajduje się w pliku [`CHANGELOG.md`](./CHANGELOG.md).

---

## 1. Cel i Profil Projektu

- **Nazwa:** Liga Gentlemanów w Tenisie Ziemnym (LGT 2026)
- **Typ aplikacji:** Responsywna aplikacja webowa + PWA (Progressive Web App)
- **Stos bazowy:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Express backend proxy + Google Cloud Firestore + GitHub Actions CI/CD
- **Estetyka:** Tradycyjny styl klubu tenisowego dla dżentelmenów. Dominujące barwy: głęboka butelkowa zieleń (`emerald-950`, `emerald-800`), ciepły kamień/kość słoniowa (`stone-100`, `stone-50`, `stone-900`), akcenty złota i bursztynu (`amber-500`, `amber-600`).
- **Standardy:** Rygorystyczny TypeScript (`strict: true`), zero błędów kompilacji, autentyczne audio (forehand na korcie krytym), powiadomienia Web Push, pełna trwałość danych w Firestore z fallbackiem LocalStorage.

---

## 2. Pliki Konfiguracyjne i Zależności

### 2.1. `package.json`
```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "test": "tsx scripts/verify-prod.ts",
    "test:deploy": "tsx scripts/verify-post-deploy.ts",
    "backup": "tsx scripts/backup-to-json.ts",
    "push:github": "tsx scripts/push-to-github.ts",
    "sync:github": "tsx scripts/push-to-github.ts",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "canvas-confetti": "^1.9.4",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "firebase": "^12.18.0",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.9.0",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2"
  }
}
```

### 2.2. `firebase.json` (Integracja Cloud Run & Hosting)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "run": {
          "serviceId": "liga-gentleman-w-tenisa",
          "region": "europe-west2"
        }
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### 2.3. `firestore.rules` (Bezpieczeństwo Danych)
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 3. Schemat Danych i Typów (`src/types.ts`)

```typescript
export type PlayerStatus = 'active' | 'inactive' | 'injured';
export type MatchType = 'league' | 'friendly';
export type MatchStatus = 'scheduled' | 'completed';
export type SurfaceType = 'clay' | 'hard' | 'grass' | 'carpet';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  status: PlayerStatus;
  avatarColor?: string;
  preferredSurfaces?: string[];
  preferredTimes?: string;
  preferredCourts?: string;
  playStyle?: string;
}

export interface SetScore {
  games1: number;
  games2: number;
  tiebreak1?: number;
  tiebreak2?: number;
  isSuperTiebreak?: boolean;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  sets: SetScore[];
  winnerId?: string;
  isFriendly?: boolean;
  friendlyReason?: string;
  court?: string;
  courtName?: string;
  surface?: SurfaceType;
  notes?: string;
  status: MatchStatus;
  confirmedByPlayer1?: boolean;
  confirmedByPlayer2?: boolean;
  createdAt?: number;
  overduePushSent?: boolean;
  overdueNotifiedAt?: number;
}

export interface StandingRow {
  rank: number;
  player: Player;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  form: ('W' | 'L')[];
}

export type NotificationType =
  | 'match_scheduled'
  | 'match_completed'
  | 'match_overdue_reminder'
  | 'system'
  | 'test';

export interface LeagueNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  recipientPlayerIds: string[];
  matchId?: string;
  createdAt: number;
  readBy?: string[];
  url?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  notifyScheduled: boolean;
  notifyResults: boolean;
  notifyOverdue: boolean;
  soundEnabled: boolean;
  selectedPlayerId?: string;
}

export interface LeagueSettings {
  leagueName: string;
  season: string;
  points2_0: number; // 3 pkt
  points2_1: number; // 2 pkt
  points1_2: number; // 1 pkt
  points0_2: number; // 0 pkt
  superTiebreakDecider: boolean; // true
  minDaysBetweenMatches?: number;
  startDate?: string;
  endDate?: string;
  allowFriendlyMatches?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'player';
  status: 'active' | 'pending' | 'suspended';
  phone?: string;
  nickname?: string;
  playStyle?: string;
  preferredCourts?: string;
}
```

---

## 4. Matematyka Tenisowa i Reguły Gry (`src/utils/tennisRules.ts`)

### 4.1. Zasada 2 Miesięcy Kalendarzowych dla Rewanży
```typescript
export function getTwoMonthsLaterDate(dateString: string): string {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  month += 2;
  if (month > 11) {
    year += Math.floor(month / 12);
    month = month % 12;
  }

  // Korekta liczby dni w miesiącu docelowym (np. 31 grudnia + 2 msc -> 28 lutego)
  const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
  const adjustedDay = Math.min(day, daysInTargetMonth);

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(adjustedDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function checkRematchEligibility(
  player1Id: string,
  player2Id: string,
  matchDate: string,
  matches: Match[]
): { isFriendly: boolean; nextAllowedDate?: string; previousMatch?: Match } {
  const pastLeagueMatches = matches
    .filter(
      (m) =>
        m.status === 'completed' &&
        !m.isFriendly &&
        ((m.player1Id === player1Id && m.player2Id === player2Id) ||
         (m.player1Id === player2Id && m.player2Id === player1Id)) &&
        m.date < matchDate
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  if (pastLeagueMatches.length === 0) {
    return { isFriendly: false };
  }

  const lastMatch = pastLeagueMatches[0];
  const nextAllowed = getTwoMonthsLaterDate(lastMatch.date);

  if (matchDate < nextAllowed) {
    return {
      isFriendly: true,
      nextAllowedDate: nextAllowed,
      previousMatch: lastMatch,
    };
  }

  return { isFriendly: false };
}
```

### 4.2. Detekcja Minionych i Zaległych Meczów (`isScheduledMatchOverdue`)
```typescript
export function getMatchStartTimestamp(match: Pick<Match, 'date' | 'time'>): number {
  if (!match.date) return 0;
  const timeStr = match.time && match.time.trim().length > 0 ? match.time.trim() : '23:59';
  const isoCandidate = `${match.date}T${timeStr}:00`;
  const parsed = Date.parse(isoCandidate);
  if (!isNaN(parsed)) return parsed;
  return new Date(`${match.date} 00:00:00`).getTime();
}

export function isScheduledMatchOverdue(
  match: Match,
  offsetHours: number = 0,
  nowTimestamp: number = Date.now()
): boolean {
  if (match.status !== 'scheduled') return false;
  const startTs = getMatchStartTimestamp(match);
  if (!startTs) return false;
  const thresholdMs = offsetHours * 60 * 60 * 1000;
  return nowTimestamp >= startTs + thresholdMs;
}
```

### 4.3. Punktacja i Klasyfikacja w Tabeli (`calculateStandings`)
- Zwycięstwo 2:0: **3 punkty** (przegrany 0)
- Zwycięstwo 2:1: **2 punkty** (przegrany 1)
- Sparingi (`isFriendly === true`): **0 punktów**, ignorowane przy liczeniu bilansów ligowych.
- Hierarchia sortowania:
  1. Punkty
  2. Różnica setów (`setDiff`)
  3. Różnica gemów (`gameDiff`)
  4. Bezpośredni pojedynek (H2H)
  5. Liczba rozegranych meczów

---

## 5. Przepływy Użytkownika i Kluczowe Interakcje

### 5.1. Weryfikacja Zaległego Meczu przy Logowaniu
1. Gdy użytkownik loguje się lub odświeża sesję, `App.tsx` w `useEffect` sprawdza, czy użytkownik jest uczestnikiem meczu o statusie `scheduled`, którego data minęła (`isScheduledMatchOverdue(m, 0)`).
2. Jeśli tak, otwiera `OverdueMatchPromptModal`.
3. **Decyzje:**
   - **Tak, mecz się odbył:** Przekazuje mecz do `handleCompleteScheduledMatch(match)`, co otwiera `MatchModal` w trybie wpisania wyniku.
   - **Nie, mecz się nie odbył:** Wywołuje `handleDeleteMatch(match.id)` — usuwa mecz z Firestore i stanu. Wystarczy akcja jednego gracza, aby obaj mieli uporządkowany kalendarz.
   - **Przełóż:** Otwiera edycję terminu meczu.

### 5.2. Automatyczny Push 2h po Terminie Meczów
1. Co 60 sekund proces w tle sprawdza mecze ze statusem `scheduled`, dla których minęło $\ge 2$ godziny od godziny rozpoczęcia (`isScheduledMatchOverdue(m, 2)`).
2. Jeśli mecz nie ma jeszcze wprowadzonego wyniku i `!m.overduePushSent`:
   - Tworzy notyfikację `match_overdue_reminder`.
   - Oznacza w Firestore `overduePushSent: true`.
   - Wywołuje Web Push API i odtwarza studyjny dźwięk forehandu tenisowego (`tennis-hit.mp3`).
3. Jeśli wynik został wprowadzony w ciągu tych 2 godzin, mecz ma `status === 'completed'` i powiadomienie nie jest wysyłane.

---

## 6. Architektura Komponentów UI

```
src/
├── App.tsx                          # Główny stan, synchronizacja z Firestore, monitory zaległości i push
├── components/
│   ├── Header.tsx                   # Logo, status sesji, przycisk instalacji PWA, dzwonek powiadomień
│   ├── MobileBottomNav.tsx          # Dolna nawigacja mobilna
│   ├── StandingsTable.tsx           # Tabela ligowa z bilansami, herbami i formą
│   ├── MatchesList.tsx              # Terminarz i baza wyników, wyróżnienie zaległych spotkań
│   ├── MatchModal.tsx               # Modal wprowadzania wyniku oraz planowania meczów
│   ├── OverdueMatchPromptModal.tsx  # Pytanie przy logowaniu: czy mecz się odbył? (Tak/Nie)
│   ├── OpponentSuggester.tsx        # Widget rekomendacji nowych rywali (zasada 2 miesięcy)
│   ├── NotificationDrawer.tsx       # Szuflada powiadomień, odtwarzacz audio, testy dźwięku i preferencje
│   ├── NotificationToast.tsx        # Pływający baner powiadomień w aplikacji
│   ├── VersionNotification.tsx      # Proaktywne powiadomienie o nowej wersji produkcyjnej
│   ├── H2HMatrix.tsx                # Macierz pojedynków bezpośrednich
│   ├── PlayersDirectory.tsx         # Katalog graczy z szybkimi linkami do połączenia i WhatsApp
│   ├── PlayerModal.tsx              # Profil zawodnika, statystyki, styl gry
│   ├── PlayerEditModal.tsx          # Edycja profilu gracza i zmiana hasła
│   ├── AdminAccountsManager.tsx     # Panel Komisarza: zarządzanie kontami, hasła, audyt, backup
│   ├── SettingsModal.tsx            # Ustawienia ligi i sezonu
│   ├── AuthView.tsx                 # Ekran logowania i rejestracji z Kodeksem Fair Play
│   ├── LgtDocsSection.tsx           # Wbudowana w aplikację przeglądarka dokumentacji i changeloga
│   └── PwaInstallModal.tsx          # Instrukcja instalacji PWA na telefonach
├── utils/
│   ├── tennisRules.ts               # Silnik tenisowy, reguła 2 miesięcy, detekcja zaległych meczów
│   ├── notifications.ts             # Web Push, audio uderzenia tenisowego (tennis-hit), generatory powiadomień
│   ├── auth.ts                      # Logowanie e-mail, min. 6 znaków hasła, prefiks +48, ochrona Komisarza
│   ├── opponentSuggester.ts         # Algorytm dopasowywania rywali
│   ├── versionCheck.ts              # Sprawdzanie public/version.json
│   └── logger.ts                    # Rejestr zdarzeń audytowych
└── types.ts                         # Centralne typy TypeScript
```

---

## 7. Procedura Odtworzenia Krok po Kroku

1. Zainstaluj pakiety z `package.json` (`npm install`).
2. Przygotuj pliki `src/types.ts` i `src/utils/tennisRules.ts`.
3. Umieść pliki audio `tennis-hit.mp3` i `tennis-hit.wav` w `/public`.
4. Zaimplementuj `src/utils/notifications.ts` oraz zarejestruj Service Worker w `public/sw.js`.
5. Zaimplementuj komponenty modali i widoków w `src/components/`.
6. Skonfiguruj `firebase.json` i `firestore.rules`.
7. Uruchom `npm run test:deploy`, aby zweryfikować poprawność reguł biznesowych.
8. Uruchom `npm run push:github`, aby zsynchronizować zmiany z GitHub Actions i wdrożyć na produkcję.
