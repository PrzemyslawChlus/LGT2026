# Dokumentacja Techniczno-Użytkowa: Liga Gentlemanów w Tenisie Ziemnym (LGT 2026)

**Wersja:** 1.0.0 (Produkcyjna)  
**Domena główna:** [https://lgt2026.pl](https://lgt2026.pl)  
**Środowisko:** Google Cloud Run + Firebase Hosting + Google Cloud Firestore  
**Data publikacji dokumentacji:** Marzec 2026  

---

## 1. Wprowadzenie i Cel Systemu

Aplikacja **Liga Gentlemanów w Tenisie** (LGT) to profesjonalna platforma dedykowana amatorskim i półprofesjonalnym rozgrywkom tenisowym gentlemenów. System łączy sportową rywalizację, precyzyjną matematykę tenisową oraz dbałość o kulturę gry i zasady Fair Play.

System rozwiązuje kluczowe wyzwania organizacyjne ligi:
- Automatyczne liczenie punktów, setów, gemów i małych punktów według oficjalnych wytycznych.
- Egzekwowanie unikalnej zasady **2 miesięcy kalendarzowych** pomiędzy meczami ligowymi tej samej pary rywali (zapobieganie „nabijaniu punktów” i wymuszenie rotacji z innymi graczami).
- Obsługę sparingów towarzyskich bez wypaczania tabeli ligowej.
- Wygodne umawianie spotkań dzięki bezpośrednim linkom telefonicznym i WhatsApp.
- Dostępność jako aplikacja mobilna PWA (Progressive Web App) z instalacją na telefonach Android i iOS.

---

## 2. Architektura Systemowa i Stos Technologiczny

Aplikacja została zbudowana w architekturze **Full-Stack Jamstack / Single-Page Application z mikrousługą SSR/API**:

| Warstwa | Technologia | Zastosowanie |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript 5.8 | Nowoczesny, reaktywny interfejs użytkownika |
| **Styling & UI** | Tailwind CSS v4, Lucide React, Motion | Spójna szata graficzna w stylu „Gentleman Tennis Club” (butelkowa zieleń, ciepły kamień, złoto) |
| **Baza Danych** | Google Cloud Firestore | Replikowana w czasie rzeczywistym baza dokumentowa NoSQL z regułami bezpieczeństwa |
| **Backend & Proxy** | Node.js 22, Express 4.21, Vite 6 | Serwer proxy, middleware SPA i kompilacja TypeScript |
| **Hosting & SSL** | Firebase Hosting + Cloud Run | Hosting w domenie `lgt2026.pl` z certyfikatem SSL Let's Encrypt / Google Trust Services |
| **PWA** | Web App Manifest, Service Worker | Instalacja na ekranie głównym smartfona bez sklepów App Store / Google Play |

### Schemat Przepływu Ruchu Sieciowego
```
[Użytkownik / Przeglądarka / PWA]
             │
             ▼ https://lgt2026.pl (Port 443, SSL/TLS)
    [Firebase Hosting CDN]
             │
      (Rewrite /**)
             ▼
   [Cloud Run Service: liga-gentleman-w-tenisa]
             │ (europe-west2)
             ├─► Serwowanie skompilowanego SPA (HTML/JS/CSS)
             └─► Połączenie klienta z Google Cloud Firestore (Kolekcje ligi)
```

---

## 3. Role i Uprawnienia (RBAC)

1. **Komisarz Ligi / Administrator (`role: 'admin'`):**
   - Pełny wgląd i modyfikacja wszystkich danych.
   - Weryfikacja i akceptacja nowych wniosków rejestracyjnych graczy.
   - Bezpośrednia zmiana haseł graczy (funkcja ratunkowa w przypadku zapomnienia hasła).
   - Nadawanie i odbieranie uprawnień komisarza innym członkom.
   - Dostęp do audytu, tworzenia kopii zapasowych JSON oraz czyszczenia bazy.
   - Ochrona konta głównego komisarza (`przemyslaw.chlus@gmail.com` / `przemyslaw.chlus@comp-plus.pl`) przed przypadkowym usunięciem lub degradacją.

2. **Dżentelmen / Gracz (`role: 'player'`):**
   - Wprowadzanie wyników rozegranych meczów ze swoim udziałem.
   - Potwierdzanie wyników wprowadzonych przez rywala.
   - Edycja własnego profilu (styl gry, ulubione korty, telefon kontaktowy, zmiana własnego hasła).
   - Wgląd w tabelę, terminarz, statystyki rywali i macierz H2H.
   - Dostęp do szybkich akcji kontaktu z rywalami (Połączenie telefoniczne, czat WhatsApp).

3. **Gość / Przed Logowaniem:**
   - Ekran logowania adresem e-mail oraz bezpiecznym hasłem (min. 6 znaków).
   - Formularz rejestracji do ligi z nienaruszalnym prefiksem `+48` i deklaracją Kodeksu Fair Play.
   - Dostęp do procedury przypomnienia/resetu hasła z kontaktem do Komisarza.

---

## 4. Model Danych (Struktura Firestore)

System operuje na 5 głównych kolekcjach bazy Firestore:

### 4.1. Kolekcja `users`
Przechowuje konta autoryzacyjne zawodników i administratorów.
- `id` (string): Unikalny identyfikator konta (`u_{timestamp}`)
- `email` (string, unikalny, lowercase): Adres e-mail używany do logowania
- `name` (string): Imię i nazwisko
- `nickname` (string, opcjonalny): Przydomek kortowy
- `phone` (string): Numer telefonu w standardzie `+48 XXX XXX XXX`
- `role` ('admin' | 'player'): Rola systemowa
- `passwordHash` (string): Hasło dostępowe (min. 6 znaków)
- `status` ('pending' | 'active' | 'suspended'): Status zatwierdzenia konta przez komisarza
- `playStyle` (string): Styl gry zawodnika (np. *Praworęczny, jednoręczny bekhend*)
- `preferredCourts` (string): Ulubione obiekty tenisowe
- `registeredAt` (number): Timestamp utworzenia konta

### 4.2. Kolekcja `players`
Reprezentacja zawodnika w rozgrywkach ligowych:
- `id` (string): Identyfikator powiązany z użytkownikiem
- `name` (string): Imię i nazwisko
- `phone` (string): Telefon kontaktowy
- `status` ('active' | 'inactive' | 'injured'): Gotowość do gry
- `avatarColor` (string): Kolor herbu w tabeli

### 4.3. Kolekcja `matches`
Zarejestrowane spotkania tenisowe:
- `id` (string): Identyfikator meczu
- `player1Id` (string): Gospodarz meczu
- `player2Id` (string): Gość meczu
- `date` (string, ISO: `YYYY-MM-DD`): Data rozegrania
- `sets` (Array): Tablica setów `[{ games1: number, games2: number, tiebreak1?: number, tiebreak2?: number, isSuperTiebreak?: boolean }]`
- `winnerId` (string): Zwycięzca meczu
- `isFriendly` (boolean): Flaga czy mecz jest sparingiem towarzyskim (niepunktowanym do tabeli)
- `court` (string, opcjonalne): Obiekt, na którym grano
- `notes` (string, opcjonalne): Komentarz pomeczowy
- `status` ('completed' | 'pending_confirmation')
- `confirmedByPlayer1`, `confirmedByPlayer2` (boolean)

### 4.4. Kolekcja `settings`
Konfiguracja zasad ligi:
- `leagueName`: Nazwa ligi (np. *Liga Gentlemanów Tenisa*)
- `season`: Identyfikator sezonu (*Sezon 2026*)
- `points2_0`: Punkty za zwycięstwo 2:0 (domyślnie: **3 pkt**)
- `points2_1`: Punkty za zwycięstwo 2:1 (domyślnie: **2 pkt**)
- `points1_2`: Punkty za porażkę 1:2 (domyślnie: **1 pkt**)
- `points0_2`: Punkty za porażkę 0:2 (domyślnie: **0 pkt**)
- `superTiebreakDecider`: Czy 3. set jest super tie-breakiem do 10 pkt (domyślnie: **true**)
- `minDaysBetweenMatches`: Wymóg odstępu rewanżów (domyślnie: **2 miesiące kalendarzowe**)

### 4.5. Kolekcja `audit_logs`
Rejestr zdarzeń komisarza (dodanie meczu, zmiana hasła, usunięcie konta, reset ligi).

---

## 5. Kluczowe Reguły Biznesowe i Silnik Tenisowy

### 5.1. System Punktacji Meczowej
Liga nagradza zaangażowanie i walkę o każdego seta:
- **Zwycięstwo 2:0 w setach:** Zwycięzca otrzymuje **3 punkty**, przegrany **0 punktów**.
- **Zwycięstwo 2:1 w setach:** Zwycięzca otrzymuje **2 punkty**, przegrany otrzymuje **1 punkt** za wywalczenie jednego seta.
- **Mecze Towarzyskie (sparingi):** Otrzymują **0 punktów** w tabeli ligowej, nie wpływając na bilans ligowy.

### 5.2. Reguła 2 Miesięcy Kalendarzowych (Rewanże)
Zgodnie z Kodeksem Ligi Gentlemanów:
> *„Mecz rewanżowy pomiędzy tymi samymi zawodnikami w ramach ligi może odbyć się najwcześniej po upływie dwóch pełnych miesięcy kalendarzowych od daty poprzedniego meczu ligowego.”*

**Algorytm wyliczania terminu (`getTwoMonthsLaterDate`):**
- Data bazowa: $YYYY-MM-DD$
- Miesiąc docelowy: $M + 2$
- Jeśli dzień miesiąca przekracza liczbę dni w miesiącu docelowym (np. 31 grudnia + 2 miesiące), data jest automatycznie korygowana do ostatniego dnia danego miesiąca (28/29 lutego).
- Wszelkie spotkania rozegrane przed tą datą są automatycznie kwalifikowane jako **Sparing Towarzyski** z wyraźną informacją w formularzu oraz na liście meczów.

### 5.3. Walidacja Wyników Tenisowych (`tennisRules.ts`)
Formularz chroni przed wprowadzeniem błędnych wyników:
- Prawidłowy set standardowy: wygrana do 6 (z przewagą min. 2 gemów: 6:0, 6:1, 6:2, 6:3, 6:4), lub wygrana 7:5, lub tie-break 7:6.
- Tie-break w secie: gra do 7 punktów z przewagą 2 punktów (np. 7:4, 7:5, 9:7).
- Super tie-break (zamiast 3. seta): gra do 10 punktów z przewagą 2 punktów (np. 10:8, 12:10). Wynik poniżej 10 lub różnica 1 pkt jest natychmiast blokowana.

---

## 6. Procedura Wdrażania (Deploy) i Utrzymania

### 6.1. Zbudowanie Aplikacji
```bash
npm run build
```
Generuje zoptymalizowany pakiet statyczny w katalogu `/dist`.

### 6.2. Testy Automatyczne Post-Deploy
```bash
npm run test:deploy
```
Uruchamia 32 testy weryfikujące:
- Spójność konfiguracji Cloud Run i Firebase Hosting
- Obliczenia tabeli i silnika tenisowego
- Regułę 2 miesięcy kalendarzowych
- Ochronę haseł $\ge 6$ znaków
- Odpowiedź HTTP 200 oraz certyfikat SSL dla domeny `https://lgt2026.pl`.

### 6.3. Kopia Zapasowa Danych (Backup)
```bash
npm run backup
```
Eksportuje aktualny stan użytkowników, meczów, graczy i ustawień do bezpiecznego pliku JSON ze stemplem czasowym.
