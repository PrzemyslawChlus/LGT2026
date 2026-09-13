# Master Blueprint & Specyfikacja Odtworzenia Projektu (Dla Agenta AI)

> **DLA MODELU / AGENTA KODUJĄCEGO AI:**  
> Niniejszy dokument stanowi samowystarczalną specyfikację techniczną poziomu L4. Posiadasz w nim kompletny schemat architektury, typów, reguł biznesowych, algorytmów oraz komponentów, który pozwala odtworzyć aplikację **Liga Gentlemanów w Tenisie (LGT)** od absolutnego zera do stanu produkcyjnego bez żadnych dodatkowych informacji.

---

## 1. Cel i Profil Projektu

- **Nazwa:** Liga Gentlemanów w Tenisie Ziemnym (LGT 2026)
- **Typ aplikacji:** Responsywna aplikacja webowa + PWA (Progressive Web App)
- **Stos bazowy:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Express backend proxy + Google Cloud Firestore
- **Estetyka:** Tradycyjny styl klubu tenisowego dla dżentelmenów. Dominujące barwy: głęboka butelkowa zieleń (`emerald-950`, `emerald-800`), ciepły kamień/kość słoniowa (`stone-100`, `stone-50`, `stone-900`), akcenty złota i bursztynu (`amber-500`, `amber-600`).
- **Standardy:** Rygorystyczny TypeScript (`strict: true`), zero ostrzeżeń lintera, zero mockowanych atrap (pełna trwałość w Firestore + fallback LocalStorage).

---

## 2. Pliki Konfiguracyjne i Zależności

### 2.1. `package.json`
```json
{
  "name": "liga-gentlemanow-tenisa",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "test": "tsx scripts/verify-prod.ts",
    "test:deploy": "tsx scripts/verify-post-deploy.ts",
    "backup": "tsx scripts/backup-to-json.ts",
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
      allow read, write: if true; // Zabezpieczone dodatkowo w warstwie logiki aplikacji
    }
  }
}
```

---

## 3. Schemat Danych i Typów (`src/types.ts`)

```typescript
export type PlayerStatus = 'active' | 'inactive' | 'injured';
export type MatchType = 'league' | 'friendly';
export type MatchStatus = 'completed' | 'pending_confirmation';

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
  sets: SetScore[];
  winnerId: string;
  isFriendly?: boolean;
  court?: string;
  notes?: string;
  status?: MatchStatus;
  confirmedByPlayer1?: boolean;
  confirmedByPlayer2?: boolean;
  createdAt?: number;
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

export interface LeagueSettings {
  leagueName: string;
  season: string;
  points2_0: number; // domyślnie 3
  points2_1: number; // domyślnie 2
  points1_2: number; // domyślnie 1
  points0_2: number; // domyślnie 0
  superTiebreakDecider: boolean; // domyślnie true
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
Mecz rewanżowy pomiędzy graczem A i B może być ligowy wyłącznie po upływie dwóch miesięcy kalendarzowych.
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

  // Korekta dni w miesiącu docelowym (np. 31 grudnia + 2 msc -> 28 lutego)
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
  // Szukamy wyłącznie zakończonych meczów ligowych pomiędzy tymi graczami
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

### 4.2. Walidacja Wyników Seta
- Zwykły set: 6:0 do 6:4, 7:5, lub 7:6 (wymaga tie-breaka min. 7:X z różnicą 2).
- Super tie-break (jako 3. set): min. 10 punktów, min. 2 punkty przewagi.
- Odrzucenie: 6:5, 6:6 bez tie-breaka, wygrana z przewagą 1 punktu.

### 4.3. Punktacja i Klasyfikacja w Tabeli (`calculateStandings`)
- Zwycięstwo 2:0: **3 punkty** (przegrany 0)
- Zwycięstwo 2:1: **2 punkty** (przegrany 1)
- Mecze z `isFriendly === true`: **0 punktów**, nie wpływają na tabelę.
- **Kolejność sortowania tabeli:**
  1. Liczba punktów (malejąco)
  2. Bilans setów (`setDiff`)
  3. Bilans gemów (`gameDiff`)
  4. Bezpośredni pojedynek (H2H)
  5. Liczba rozegranych meczów

---

## 5. Autoryzacja i Bezpieczeństwo (`src/utils/auth.ts`)

### 5.1. Kluczowe Wymagania:
1. **Logowanie wyłącznie adresem e-mail:** Wyszukiwanie użytkownika następuje po `email.toLowerCase()`. Wszelkie logowanie nazwiskiem zostało wyłączone.
2. **Hasła min. 6 znaków:**
   - W formularzu rejestracji (`regPassword.length >= 6`)
   - W profilu gracza przy zmianie własnego hasła (`newPassword.length >= 6`)
   - W panelu komisarza przy resecie hasła (`newPasswordInput.length >= 6`)
   - W metodach `registerUser`, `changeUserPassword`, `updateUserProfile`.
3. **Numer telefonu z nienaruszalnym prefiksem `+48`:**
   - Element `+48` jest sztywnym segmentem kontrolki.
   - Użytkownik wpisuje 9 cyfr formatowanych jako `XXX XXX XXX`.
   - Wklejenie tekstu z `+48` usuwa powielony prefiks.
4. **Ochrona Komisarza Ligi:**
   - Konto `przemyslaw.chlus@gmail.com` / `przemyslaw.chlus@comp-plus.pl` jest chronione przed usunięciem lub degradacją roli do zwykłego gracza.

---

## 6. Architektura Widoków i Komponentów UI

```
src/
├── App.tsx                    # Główny stan, synchronizacja z Firestore, nawigacja
├── components/
│   ├── Header.tsx             # Górny pasek, logo, stan sesji, przycisk PWA
│   ├── Navigation.tsx         # Przełącznik widoków (Tabela, Mecze, H2H, Gracze, Konta)
│   ├── StandingsTable.tsx     # Tabela ligowa z formą, bilansami i herbami
│   ├── MatchesSchedule.tsx    # Terminarz i baza wyników (odznaki: Liga / Sparing)
│   ├── AddMatchModal.tsx      # Modal zgłaszania meczu z auto-detekcją 2 msc i walidacją
│   ├── H2HMatrix.tsx          # Macierz rywalizacji każdy-z-każdym
│   ├── PlayersDirectory.tsx   # Karty graczy z szybkimi linkami tel: i wa.me
│   ├── PlayerModal.tsx        # Karta profilowa ze statystykami i historią
│   ├── PlayerEditModal.tsx    # Edycja profilu (styl gry, korty, zmiana hasła)
│   ├── AdminAccountsManager.tsx # Panel komisarza (hasła, aktywacja, audit log, backup)
│   ├── SettingsModal.tsx      # Parametry punktacji i sezonu
│   ├── AuthView.tsx           # Logowanie i Rejestracja z Kodeksem Fair Play
│   └── PwaInstallModal.tsx    # Instrukcja instalacji PWA (iOS / Android)
├── utils/
│   ├── tennisRules.ts         # Silnik tenisowy i reguła 2 miesięcy
│   ├── auth.ts                # Autoryzacja, sesja, profile i Firestore sync
│   └── firestoreSync.ts       # Reaktywne subskrypcje onSnapshot do Firestore
├── data/
│   └── initialData.ts         # Początkowe dane ligi i zawodników
└── types.ts                   # Centralny rejestr typów
```

---

## 7. Procedura Odtworzenia Krok po Kroku

Jeżeli stawiasz aplikację w nowym środowisku:
1. Skopiuj `package.json` i wykonaj `npm install`.
2. Utwórz pliki `src/types.ts` i `src/utils/tennisRules.ts`.
3. Utwórz `src/utils/auth.ts` z obsługą Firestore i fallbacku LocalStorage.
4. Zaimplementuj komponenty UI z `src/components/`.
5. Skonfiguruj `firebase.json` z rewrites do Cloud Run.
6. Uruchom `npm run test:deploy`, aby zweryfikować 32 asercje poprawności.
7. Zbuduj za pomocą `npm run build` i zdeployuj na Cloud Run.
