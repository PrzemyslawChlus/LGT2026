# Przewodnik po Testach Automatycznych Post-Deploy (LGT 2026)

**Plik skryptu:** `scripts/verify-post-deploy.ts`  
**Polecenie:** `npm run test:deploy`  
**Czas wykonania:** ~2-3 sekundy  
**Status bieżący:** 48 PASSED, 0 FAILED, 0 SKIPPED  
**Wersja:** `v2026.20260923.2320`  
**Changelog:** Pełny wykaz zmian w [`CHANGELOG.md`](./CHANGELOG.md)

---

## 1. Cel i Rola Testów Post-Deploy

Wdrożenie nowej wersji aplikacji na Cloud Run / Firebase Hosting wymaga natychmiastowego potwierdzenia, że:
1. Istotne reguły biznesowe (punktacja 3:0, 2:1, 1:2, 0:3, sparingi, reguła 2 miesięcy kalendarzowych) nie zostały przypadkowo naruszone.
2. Zabezpieczenia autoryzacji (wymóg hasła $\ge 6$ znaków, logowanie wyłącznie e-mailem) działają niezawodnie.
3. Pliki konfiguracyjne routingu Cloud Run i Firebase Hosting są na swoim miejscu.
4. Nowe funkcjonalności (weryfikacja minionych meczów, automatyczny push 2h po terminie, zasoby audio forehandu) działają bezbłędnie.
5. Publiczna domena produkcyjna (`https://lgt2026.pl`) odpowiada kodem HTTP 200 z poprawnym certyfikatem SSL.

---

## 2. Zestaw Modułów Testowych

Suita składa się z 8 zautomatyzowanych modułów weryfikacyjnych (41 testów jednostkowych i integracyjnych):

### Moduł 1: Artefakty Produkcyjne i Konfiguracja Wdrożenia
- Weryfikacja obecności i poprawności pliku `firebase.json`.
- Sprawdzenie, czy reguła rewrite kieruje ruch `/**` do serwisu Cloud Run `liga-gentleman-w-tenisa` w regionie `europe-west2`.
- Sprawdzenie pliku `firestore.rules` (wersja 2 reguł bazy danych Firestore).

### Moduł 2: Bezpieczeństwo i Logika Autoryzacji
- **Test hasła minimalnego:** Próba ustawienia hasła poniżej 6 znaków (np. 5-znakowego) musi rzucić wyjątkiem z informacją o błędzie.
- **Weryfikacja formatu:** Wymuszenie adresu e-mail jako jedynego identyfikatora logowania.

### Moduł 3: Silnik Tenisowy (Reguły Setów)
- Zatwierdzanie standardowych setów: 6:4, 6:0, 7:5.
- Odrzucanie błędnych wyników: 6:5, 6:6 bez tie-breaka.
- Walidacja tie-breaków: zatwierdzanie 7:6 (7:5) oraz 7:6 (9:7), odrzucanie tie-breaka z różnicą tylko 1 punktu.
- Walidacja super tie-breaków do 10 punktów (odrzucanie wyników poniżej 10 pkt lub bez 2 pkt przewagi).

### Moduł 4: Walidacja Całego Meczu
- Prawidłowe rozstrzygnięcie meczu 2:0 (dwa wygrane sety).
- Prawidłowe rozstrzygnięcie meczu 2:1 (po decydującym super tie-breaku).
- Formatowanie wyniku w notacji tenisowej: np. `6:4, 6:7 (4), [10:8]`.

### Moduł 5: Reguła 2 Miesięcy Kalendarzowych dla Rewanży
- Weryfikacja kalkulatora daty rewanżu `getTwoMonthsLaterDate`:
  - `2026-05-15` $\rightarrow$ `2026-07-15`
  - `2026-05-31` $\rightarrow$ `2026-07-31`
  - `2026-12-31` $\rightarrow$ `2027-02-28` (automatyczna korekta dla lutego)
- Test meczu rozegranego po 20 dniach: automatyczne zakwalifikowanie jako **Sparing Towarzyski** (`isFriendly: true`) z wyznaczeniem terminu meczu ligowego.
- Test meczu po upływie 2 miesięcy kalendarzowych: automatyczna zgoda na mecz **Ligowy** (`isFriendly: false`).

### Moduł 6: Tabela Ligowa i Algorytm Punktacji
- Symulacja mini-sezonu z 3 zawodnikami i 3 meczami (w tym jednym sparingiem towarzyskim).
- Weryfikacja punktów:
  - Wygrana 2:0 = 3 pkt
  - Wygrana 2:1 = 2 pkt
  - Porażka 1:2 = 1 pkt
  - Porażka 0:2 = 0 pkt
  - Sparing towarzyski = ignorowany w tabeli ligowej (0 pkt).
- Weryfikacja prawidłowego wyliczenia pozycji w rankingu (1., 2., 3. miejsce).

### Moduł 7: Weryfikacja Zaległych Meczów, Powiadomień i Dźwięku Tenisowego
- Weryfikacja obecności i minimalnego rozmiaru plików audio `/public/tennis-hit.mp3` oraz `/public/tennis-hit.wav`.
- Detekcja minionego terminu meczu (`isScheduledMatchOverdue(pastMatch, 0) === true`).
- Kwalifikacja do automatycznego powiadomienia push 2h po terminie (`isScheduledMatchOverdue(pastMatch, 2) === true`).
- Prawidłowe odrzucenie meczów przyszłych z obu powyższych warunków.
- Weryfikacja generatora powiadomień `buildMatchOverdueReminderNotification` (typ `match_overdue_reminder`, przypisanie obu graczy, skojarzenie z ID meczu).

### Moduł 8: Weryfikacja Dostępności HTTP & SSL
- Odpytanie produkcyjnego adresu URL (`https://lgt2026.pl`).
- Weryfikacja odpowiedzi z kodem HTTP 200 OK.
- Sprawdzenie aktywnego i ważnego szyfrowania SSL/TLS (HTTPS).

---

## 3. Uruchamianie Testów

```bash
# Uruchomienie pełnego zestawu 41 testów:
npm run test:deploy
```

Przykładowe podsumowanie w konsoli:
```text
================================================================
WYNIK KOŃCOWY TESTÓW: 41 PASSED, 0 FAILED, 0 SKIPPED
================================================================
```
W przypadku wykrycia jakiejkolwiek niezgodności proces kończy się kodem wyjścia `1`, co wstrzymuje automatyczne wdrożenia w potokach CI/CD.
