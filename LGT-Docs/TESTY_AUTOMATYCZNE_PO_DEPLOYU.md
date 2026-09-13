# Przewodnik po Testach Automatycznych Post-Deploy (LGT 2026)

**Plik skryptu:** `scripts/verify-post-deploy.ts`  
**Polecenie:** `npm run test:deploy`  
**Czas wykonania:** ~2-3 sekundy  
**Status bieżący:** 32 PASSED, 0 FAILED  

---

## 1. Cel i Rola Testów Post-Deploy

Wdrożenie nowej wersji aplikacji na Cloud Run / Firebase Hosting wymaga natychmiastowego potwierdzenia, że:
1. Istotne reguły biznesowe (punktacja 3:0, 2:1, 1:2, 0:3, sparingi, reguła 2 miesięcy kalendarzowych) nie zostały przypadkowo naruszone.
2. Zabezpieczenia autoryzacji (wymóg hasła $\ge 6$ znaków, logowanie wyłącznie e-mailem) działają niezawodnie.
3. Pliki konfiguracyjne routingu Cloud Run i Firebase Hosting są na swoim miejscu.
4. Publiczna domena produkcyjna (`https://lgt2026.pl`) odpowiada kodem HTTP 200 z poprawnym certyfikatem SSL.

---

## 2. Zestaw Modułów Testowych

Suita składa się z 7 zautomatyzowanych modułów weryfikacyjnych:

### Moduł 1: Artefakty Produkcyjne i Konfiguracja Wdrożenia
- Weryfikacja obecności i poprawności pliku `firebase.json`.
- Sprawdzenie, czy reguła rewrite kieruje ruch `/**` do serwisu Cloud Run `liga-gentleman-w-tenisa` w regionie `europe-west2`.
- Sprawdzenie pliku `firestore.rules` (wersja 2 reguł bazy danych).

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

### Moduł 7: Dostępność Sieciowa i Certyfikat SSL (Smoke Test)
- Wykonanie zapytania HTTP GET do domeny produkcyjnej `https://lgt2026.pl`.
- Weryfikacja statusu HTTP (200 OK).
- Potwierdzenie aktywnego szyfrowania SSL/TLS.

---

## 3. Instrukcja Uruchomienia

### Uruchomienie lokalne / w kontenerze:
```bash
npm run test:deploy
```

### Uruchomienie z testem konkretnego adresu URL (np. w pipeline CI/CD):
```bash
DEPLOY_URL=https://lgt2026.pl npm run test:deploy
```

### Przykładowe wyjście z pomyślnego uruchomienia:
```text
================================================================
🎾 LIGA GENTLEMANÓW W TENISIE — SUITA TESTÓW AUTOMATYCZNYCH (POST-DEPLOY)
================================================================

📦 MODUŁ 1: Weryfikacja artefaktów produkcyjnych i konfiguracji
  ✅ PASS: Plik konfiguracyjny firebase.json istnieje
  ✅ PASS: firebase.json zawiera sekcję hosting
  ✅ PASS: firebase.json posiada rewrite do Cloud Run (liga-gentleman-w-tenisa w europe-west2)
  ✅ PASS: Reguły bazy danych firestore.rules istnieją
  ✅ PASS: firestore.rules używają wersji 2
  ✅ PASS: firestore.rules definiują główny root bazy

🔒 MODUŁ 2: Weryfikacja autoryzacji i reguł bezpieczeństwa
  ✅ PASS: Blokada hasła < 6 znaków działa prawidłowo (wymóg min. 6 znaków spełniony)

🎾 MODUŁ 3: Silnik tenisowy i walidacja wyników setów
  ✅ PASS: Prawidłowy set 6:4
  ✅ PASS: Prawidłowy set 6:0 (bajgiel)
  ✅ PASS: Prawidłowy set 7:5
  ✅ PASS: Set 6:5 odrzucony (gra do 7)
  ✅ PASS: Set 7:6 (7:5) tie-break zatwierdzony
  ✅ PASS: Tie-break z różnicą tylko 1 pkt odrzucony
  ✅ PASS: Super tie-break 10:8 zatwierdzony
  ✅ PASS: Super tie-break poniżej 10 pkt odrzucony

🏆 MODUŁ 4: Walidacja całego meczu
  ✅ PASS: Mecz 2:0 wygrywa Gracz 1
  ✅ PASS: Mecz 2:1 z super tie-breakiem wygrywa Gracz 1
  ✅ PASS: Prawidłowe formatowanie wyniku meczu (6:4, 6:7 (4), [10:8])

📅 MODUŁ 5: Reguła 2 miesięcy kalendarzowych na mecze rewanżowe
  ✅ PASS: 15 maja + 2 miesiące = 15 lipca
  ✅ PASS: 31 maja + 2 miesiące = 31 lipca
  ✅ PASS: 31 grudnia + 2 miesiące = 28 lutego (rok nieprzestępny)
  ✅ PASS: Rewanż przed upływem 2 miesięcy kalendarzowych oznaczony jako Towarzyski
  ✅ PASS: Następny mecz ligowy dopuszczony od 2026-07-10
  ✅ PASS: Rewanż po równo 2 miesiącach kalendarzowych dopuszczony jako Ligowy

📊 MODUŁ 6: Punktacja (3:0, 2:1, 1:2, 0:3) oraz Tabela
  ✅ PASS: Zawodnik Jeden ma 3 pkt (2:0 w lidze, sparing zignorowany)
  ✅ PASS: Zawodnik Dwa ma 2 pkt (0 za 0:2 i 2 za 2:1)
  ✅ PASS: Zawodnik Trzy ma 1 pkt (1 za 1:2)
  ✅ PASS: Zawodnik Jeden na 1. miejscu tabeli
  ✅ PASS: Zawodnik Dwa na 2. miejscu tabeli
  ✅ PASS: Zawodnik Trzy na 3. miejscu tabeli

🌐 MODUŁ 7: Weryfikacja dostępności HTTP & SSL
  Sprawdzanie dostępności publicznej: https://lgt2026.pl...
  ✅ PASS: Adres https://lgt2026.pl zwraca status HTTP 200
  ✅ PASS: Protokół SSL/TLS aktywny dla https://lgt2026.pl

================================================================
WYNIK KOŃCOWY TESTÓW: 32 PASSED, 0 FAILED, 0 SKIPPED
================================================================
```
