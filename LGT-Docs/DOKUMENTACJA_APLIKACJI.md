# Dokumentacja Techniczno-Użytkowa: Liga Gentlemanów w Tenisie Ziemnym (LGT 2026)

**Wersja:** `v2026.20260922.2205` (Produkcyjna)  
**Domena główna:** [https://lgt2026.pl](https://lgt2026.pl)  
**Środowisko:** Google Cloud Run + Firebase Hosting + Google Cloud Firestore + GitHub Actions CI/CD  
**Data aktualizacji:** Wrzesień 2026  
**Changelog:** Zobacz pełny wykaz zmian w [`CHANGELOG.md`](./CHANGELOG.md)

---

## 1. Wprowadzenie i Cel Systemu

Aplikacja **Liga Gentlemanów w Tenisie** (LGT) to profesjonalna platforma dedykowana amatorskim i półprofesjonalnym rozgrywkom tenisowym gentlemenów. System łączy sportową rywalizację, precyzyjną matematykę tenisową oraz dbałość o kulturę gry i zasady Fair Play.

System rozwiązuje kluczowe wyzwania organizacyjne ligi:
- **Automatyczne liczenie tabeli:** Punkty, sety, gemy i małe punkty według oficjalnych wytycznych.
- **Zasada 2 miesięcy kalendarzowych:** Egzekwowanie odstępu pomiędzy meczami ligowymi tej samej pary rywali (zapobieganie „nabijaniu punktów” i wymuszenie rotacji z innymi graczami).
- **Obsługa sparingów towarzyskich:** Gry rewanżowe przed upływem 2 miesięcy nie wypaczają tabeli ligowej (`0 pkt`).
- **Porządkowanie terminarza i weryfikacja meczów:** Automatyczne odpytywanie uczestników przy logowaniu po upłynięciu terminu oraz automatyczne usuwanie niedoszłych spotkań.
- **Powiadomienia Push z autentycznym dźwiękiem:** Dźwięk uderzenia piłki forehandem na korcie krytym oraz automatyczne przypomnienie push 2h po planowanym terminie, jeśli nie wprowadzono wyniku.
- **Mobilizacja do gry:** Moduł inteligentnych rekomendacji nowych rywali (`OpponentSuggester`).
- **Aplikacja mobilna PWA:** Instalacja na ekranie głównym urządzeń Android i iOS z proaktywnym monitorem nowych wydań.

---

## 2. Architektura Systemowa i Stos Technologiczny

Aplikacja została zbudowana w architekturze **Full-Stack Jamstack / Single-Page Application z mikrousługą SSR/API oraz automatyzacją CI/CD**:

| Warstwa | Technologia | Zastosowanie |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript 5.8 | Reaktywny, silnie typowany interfejs użytkownika |
| **Styling & UI** | Tailwind CSS v4, Lucide React, Motion | Spójna szata graficzna w stylu „Gentleman Tennis Club” (butelkowa zieleń, ciepły kamień, złoto) |
| **Baza Danych** | Google Cloud Firestore | Replikowana w czasie rzeczywistym baza NoSQL (`users`, `players`, `matches`, `notifications`, `settings`, `audit_logs`) |
| **Powiadomienia & Audio** | Web Push API, Service Worker, HTMLAudioElement / Web Audio | Autentyczny dźwięk uderzenia piłki tenisowej (`/tennis-hit.mp3`, `/tennis-hit.wav`) |
| **PWA & Offline** | Web App Manifest, Cache Storage | Działanie offline, instalacja jako aplikacja mobilna |
| **Backend & Proxy** | Node.js 22, Express 4.21, Vite 6 | Serwer proxy, middleware SPA i kompilacja TypeScript |
| **Hosting & SSL** | Firebase Hosting CDN + Cloud Run | Hosting w domenie `lgt2026.pl` z certyfikatem SSL Let's Encrypt / Google Trust Services |
| **CI / CD** | GitHub Actions (`.github/workflows/deploy.yml`) | Automatyczny build i deploy do Firebase Hosting po każdym pushu na branch `main` |

### Schemat Przepływu Ruchu i Wdrażania
```
[Developer / Agent AI] ──► [git push origin main] ──► [GitHub Actions CI/CD]
                                                            │
                                                            ▼ (Build & Deploy)
[Użytkownik / Przeglądarka / PWA]                     [Firebase Hosting CDN]
             │                                              │
             ▼ https://lgt2026.pl (SSL/TLS)                │
    [Firebase Hosting CDN] ◄────────────────────────────────┘
             │
      (Rewrite /**)
             ▼
   [Cloud Run Service: liga-gentleman-w-tenisa] (europe-west2)
             │
             ├─► Serwowanie SPA i zasobów (PWA, audio, ikony)
             └─► Połączenie klienta z Google Cloud Firestore w czasie rzeczywistym
```

---

## 3. Role i Uprawnienia (RBAC)

1. **Komisarz Ligi / Administrator (`role: 'admin'`):**
   - Pełny wgląd i modyfikacja wszystkich danych.
   - Weryfikacja i akceptacja nowych wniosków rejestracyjnych graczy.
   - Bezpośrednia zmiana haseł graczy (funkcja ratunkowa w przypadku zapomnienia hasła).
   - Nadawanie i odbieranie uprawnień komisarza innym członkom.
   - Dostęp do audytu (`audit_logs`), tworzenia kopii zapasowych JSON oraz czyszczenia bazy.
   - Ochrona konta głównego komisarza (`przemyslaw.chlus@gmail.com` / `przemyslaw.chlus@comp-plus.pl`) przed przypadkowym usunięciem lub degradacją.

2. **Dżentelmen / Gracz (`role: 'player'`):**
   - Wprowadzanie wyników rozegranych meczów ze swoim udziałem.
   - Weryfikacja zaległych meczów przy logowaniu ("Czy mecz się odbył?").
   - Otrzymywanie powiadomień push o zaplanowanych spotkaniach, wynikach i przypomnieniach 2h po terminie.
   - Edycja własnego profilu (styl gry, ulubione korty, telefon kontaktowy, zmiana własnego hasła).
   - Wgląd w tabelę, terminarz, statystyki rywali, historię H2H oraz rekomendacje nowych rywali.
   - Szybkie akcje kontaktu z rywalami (połączenie telefoniczne, czat WhatsApp).

3. **Gość / Przed Logowaniem:**
   - Ekran logowania adresem e-mail oraz hasłem (min. 6 znaków).
   - Formularz rejestracji do ligi z nienaruszalnym prefiksem kraju `+48` i deklaracją Kodeksu Fair Play.
   - Procedura przypomnienia/resetu hasła z bezpośrednim kontaktem do Komisarza Ligi.

---

## 4. Model Danych (Struktura Firestore)

System operuje na 6 głównych kolekcjach bazy Firestore:

### 4.1. Kolekcja `users`
Przechowuje konta autoryzacyjne zawodników i administratorów.
- `id` (string): Identyfikator konta (`u_{timestamp}`)
- `email` (string, unikalny, lowercase): Adres e-mail logowania
- `name` (string): Imię i nazwisko
- `nickname` (string, opcjonalny): Przydomek kortowy
- `phone` (string): Numer telefonu w standardzie `+48 XXX XXX XXX`
- `role` ('admin' | 'player'): Rola systemowa
- `passwordHash` (string): Hasło dostępowe (min. 6 znaków)
- `status` ('pending' | 'active' | 'suspended'): Status konta
- `playStyle` (string): Styl gry zawodnika
- `preferredCourts` (string): Ulubione obiekty tenisowe
- `registeredAt` (number): Timestamp utworzenia konta

### 4.2. Kolekcja `players`
Reprezentacja zawodnika w tabeli i terminarzu ligowym:
- `id` (string): Identyfikator powiązany z użytkownikiem
- `name` (string): Imię i nazwisko
- `nickname` (string, opcjonalny): Przydomek
- `phone` (string): Telefon kontaktowy
- `status` ('active' | 'inactive' | 'injured'): Gotowość do gry
- `avatarColor` (string): Kolor herbu w tabeli

### 4.3. Kolekcja `matches`
Zarejestrowane spotkania tenisowe (zarówno zaplanowane, jak i zakończone):
- `id` (string): Identyfikator meczu
- `player1Id`, `player2Id` (string): Identyfikatory zawodników
- `date` (string, ISO: `YYYY-MM-DD`): Data spotkania
- `time` (string, opcjonalny, np. `"18:00"`): Godzina rozpoczęcia
- `courtName` (string, opcjonalny): Nazwa obiektu/kortu
- `surface` (string, opcjonalny: `'clay'` | `'hard'` | `'grass'` | `'carpet'`): Nawierzchnia
- `status` ('scheduled' | 'completed'): Status meczu
- `sets` (Array): Tablica setów `[{ games1: number, games2: number, tiebreak1?: number, tiebreak2?: number, isSuperTiebreak?: boolean }]`
- `winnerId` (string, opcjonalny): Zwycięzca meczu (dla `status === 'completed'`)
- `isFriendly` (boolean): Flaga sparingu towarzyskiego (niepunktowanego do tabeli)
- `friendlyReason` (string, opcjonalny): Uzasadnienie (np. odstęp poniżej 2 miesięcy)
- `notes` (string, opcjonalny): Komentarz pomeczowy
- `overduePushSent` (boolean, opcjonalny): Flaga oznaczająca wysłanie powiadomienia push 2h po terminie
- `overdueNotifiedAt` (number, opcjonalny): Timestamp wysłania powiadomienia o zaległym meczu

### 4.4. Kolekcja `notifications`
Powiadomienia ligowe i push:
- `id` (string): Unikalny identyfikator powiadomienia
- `title` (string): Tytuł powiadomienia
- `body` (string): Treść powiadomienia
- `type` ('match_scheduled' | 'match_completed' | 'match_overdue_reminder' | 'system' | 'test')
- `recipientPlayerIds` (string[]): Lista identyfikatorów graczy, do których skierowane jest powiadomienie
- `matchId` (string, opcjonalny): Powiązany mecz
- `createdAt` (number): Timestamp utworzenia
- `url` (string, opcjonalny): Adres docelowy po kliknięciu (np. `"#matches"`)
- `readBy` (string[]): Lista ID użytkowników, którzy oznaczyli powiadomienie jako przeczytane

### 4.5. Kolekcja `settings`
Konfiguracja reguł ligi:
- `leagueName`: Nazwa ligi (*Liga Gentlemanów Tenisa*)
- `season`: Identyfikator sezonu (*Sezon 2026*)
- `points2_0`: Punkty za 2:0 (**3 pkt**)
- `points2_1`: Punkty za 2:1 (**2 pkt**)
- `points1_2`: Punkty za 1:2 (**1 pkt**)
- `points0_2`: Punkty za 0:2 (**0 pkt**)
- `superTiebreakDecider`: Czy 3. set jest super tie-breakiem do 10 pkt (**true**)
- `minDaysBetweenMatches`: Wymóg odstępu rewanżów (**2 miesiące kalendarzowe**)

### 4.6. Kolekcja `audit_logs`
Rejestr operacji Komisarza Ligi (tworzenie, edycja meczów, resetowanie danych, zmiany haseł).

---

## 5. Kluczowe Moduły i Logika Biznesowa

### 5.1. Weryfikacja Zaległych Meczów przy Logowaniu
Aby zapobiec bałaganowi w terminarzu, aplikacja weryfikuje przeszłe spotkania:
1. Podczas logowania lub przywrócenia sesji gracza sprawdzana jest lista meczów, w których uczestniczy.
2. Jeśli istnieje mecz o statusie `scheduled`, którego data i godzina minęły (`isScheduledMatchOverdue(m, 0)`), wyświetlane jest okno modalne **„Czy zaplanowany mecz się odbył?”** (`OverdueMatchPromptModal`).
3. **Decyzje użytkownika:**
   - **„Tak, mecz się odbył”:** Okno zamyka się i natychmiast otwiera formularz wprowadzania wyniku dla tego meczu.
   - **„Nie, mecz się nie odbył”:** Mecz zostaje trwale usunięty z bazy Firestore i terminarza ligi. Wystarczy odpowiedź **jednego z dwóch uczestników**, by uporządkować kalendarz obu graczy.
   - **„Przełóż na inny termin”:** Przenosi do edycji terminu meczu.
   - **„Odpowiedz później”:** Odkłada zapytanie na czas bieżącej sesji.
4. **W terminarzu:** Zaległe spotkania są wyróżnione pulsującą plakietką *„Termin minął”* oraz szybkim przyciskiem *„Nie odbył się (usuń)”*.

### 5.2. Automatyczne Powiadomienie Push 2h po Planowanym Terminie
1. Monitor w tle sprawdza co minutę mecze w statusie `scheduled`.
2. Jeśli od planowanej godziny spotkania minęły co najmniej 2 godziny (`isScheduledMatchOverdue(m, 2)`), a wynik nie został jeszcze wprowadzony:
   - Tworzone jest powiadomienie typu `match_overdue_reminder` skierowane do obu uczestników.
   - Mecz otrzymuje flagę `overduePushSent: true` i `overdueNotifiedAt: Date.now()`.
   - Zarejestrowani uczestnicy otrzymują powiadomienie push z dźwiękiem uderzenia piłki forehandem.
3. **Gdy wynik został wprowadzony wcześniej:** Mecz posiada już status `completed`, dzięki czemu warunek nie zostaje spełniony i powiadomienie w ogóle nie jest wysyłane.

### 5.3. Autentyczny Dźwięk Powiadomienia Tenisowego
- Wykorzystuje oryginalne, studyjnie zmasterowane nagranie uderzenia rakiety tenisowej w piłkę (czysty forehand na korcie krytym).
- Pliki `/public/tennis-hit.mp3` i `/public/tennis-hit.wav` są buforowane w pamięci podręcznej Service Workera.
- Odtwarzanie realizowane przez `HTMLAudioElement` z natychmiastową responsywnością oraz awaryjnym syntezatorem Web Audio API.

### 5.4. Reguła 2 Miesięcy Kalendarzowych (Rewanże)
- Funkcja `getTwoMonthsLaterDate(matchDate)` dodaje 2 miesiące kalendarzowe z korektą na krótsze miesiące (np. 31 grudnia $\rightarrow$ 28 lutego).
- Mecz rozegrany przed upływem tego terminu automatycznie otrzymuje status **Sparing Towarzyski** (`isFriendly: true`), daje 0 punktów do tabeli i nie wypacza rywalizacji.

### 5.5. Matematyczny Silnik Tenisowy (`tennisRules.ts`)
- Standardowy set: gra do 6 z przewagą 2 gemów (6:0 .. 6:4), 7:5 lub tie-break 7:6.
- Tie-break: gra do 7 punktów z przewagą 2 punktów.
- Super tie-break (zamiast 3. seta): gra do 10 punktów z przewagą 2 punktów.
- Wyniki niespełniające zasad tenisa są natychmiast odrzucane z precyzyjnym komunikatem w języku polskim.

### 5.6. Moduł Mobilizacji do Gry z Nowymi Rywalami (`OpponentSuggester`)
- Analizuje bazę graczy i historię rozegranych meczów zalogowanego użytkownika.
- Wskazuje dżentelmenów, z którymi gracz jeszcze nie rozegrał spotkania ligowego lub u których minęły 2 miesiące kalendarzowe od ostatniego meczu.
- Umożliwia nawiązanie kontaktu jednym kliknięciem (połączenie telefoniczne, czat WhatsApp, planowanie meczu).

### 5.7. Proaktywny Monitor Wersji PWA (`VersionNotification`)
- Odpytuje plik `/version.json` w celu wykrycia nowych wdrożeń produkcyjnych.
- W przypadku wykrycia nowej kompilacji wyświetla dyskretny baner z możliwością natychmiastowego przeładowania aplikacji bez utraty stanu formularzy.

---

## 6. Procedury Wdrażania, CI/CD i Utrzymania

### 6.1. Wypchnięcie Zmian i Publikacja Produkcyjna
Wystarczy jedno polecenie z poziomu terminala:
```bash
npm run push:github -- "feat: opis nowych zmian"
```
Skrypt wykonuje:
1. Automatyczne podbicie wersji aplikacji w `public/version.json` (np. `v2026.20260922.2205`).
2. Pobranie i scalenie najnowszych zmian ze zdalnego repozytorium GitHub.
3. Utworzenie commita i wypchnięcie zmian do `https://github.com/PrzemyslawChlus/LGT2026` (`main`).
4. Uruchomienie GitHub Actions (`.github/workflows/deploy.yml`), który kompiluje aplikację i publikuje ją na **Firebase Hosting** pod adresem `https://lgt2026.pl`.

### 6.2. Testy Automatyczne Post-Deploy
```bash
npm run test:deploy
```
Uruchamia suitę testów sprawdzających architekturę, bezpieczeństwo, silnik tenisowy, rewanże, tabelę, certyfikat SSL, powiadomienia, zaległe mecze i zasoby dźwiękowe.

### 6.3. Kopia Zapasowa Danych (Backup)
```bash
npm run backup
```
Tworzy zrzut JSON aktualnego stanu bazy danych (gracze, mecze, ustawienia) w katalogu `backups/`.
