# Pakiet Dokumentacji i Specyfikacji Projektu: Liga Gentlemanów w Tenisie (LGT 2026)

**Wydanie bieżące:** `v2026.20260922.2205`  
**Status produkcyjny:** Wdrożony i aktywny pod adresem [https://lgt2026.pl](https://lgt2026.pl)  
**Katalog źródłowy:** `/LGT-Docs/`

---

## Zawartość Pakietu:

1. **`CHANGELOG.md`**  
   Pełny, chronologiczny rejestr wydań, zmian i nowych funkcjonalności (format Keep a Changelog):
   - Wersja najnowsza (`v2026.20260922.2205`): weryfikacja zaległych meczów przy logowaniu, automatyczne powiadomienia push 2h po planowanym terminie, oryginalny dźwięk uderzenia piłki tenisowej (forehand), automatyzacja CI/CD z GitHubem.
   - Wersje wcześniejsze (`v2026.20260920.1830`, `v2026.20260901.1200`): moduł rekomendacji rywali, proaktywny monitor wersji PWA, silnik ligowy.

2. **`DOKUMENTACJA_APLIKACJI.md`**  
   Kompletna dokumentacja techniczna i funkcjonalna:
   - Architektura systemu (React 19, TypeScript, Express, Cloud Run, Firebase Hosting, Firestore)
   - Przepływ domenowy z certyfikatem SSL dla `lgt2026.pl`
   - Role użytkowników (Komisarz, Dżentelmen, Gość)
   - Model bazy danych NoSQL w Firestore (rozszerzony o statusy powiadomień, zaległych meczów i audyt)
   - Reguły punktacji ligowej (3:0, 2:1, 1:2, 0:3) oraz mecze sparingowe
   - System powiadomień Web Push z dźwiękiem uderzenia rakietą
   - Procedury porządkowania terminarza i weryfikacji zaległych meczów
   - Autoryzacja i bezpieczeństwo (e-mail, hasła $\ge 6$ znaków, prefiks `+48`)

3. **`SPECYFIKACJA_ODTWORZENIA_PROJEKTU.md`**  
   Precyzyjny Master Prompt i specyfikacja inżynieryjna poziomu L4:
   - Pozwala dowolnemu agentowi AI lub programiście postawić całą aplikację od zera
   - Zawiera pełne, aktualne definicje typów (`src/types.ts`)
   - Zawiera implementację algorytmu 2 miesięcy kalendarzowych na mecze rewanżowe
   - Zawiera kod walidacji setów, tie-breaków, super tie-breaków oraz detekcji zaległych meczów
   - Zawiera specyfikację komponentów modali i szuflad powiadomień
   - Zawiera konfigurację środowiska, workflow GitHub Actions oraz deploymentu

4. **`TESTY_AUTOMATYCZNE_PO_DEPLOYU.md`**  
   Instrukcja suity testowej uruchamianej po każdym deployu:
   - Polecenie `npm run test:deploy`
   - Zestaw 36 testów automatycznych (architektura, bezpieczeństwo, silnik tenisowy, rewanże, punktacja, SSL, zaległe mecze, powiadomienia i audio)
   - Weryfikacja Cloud Run, Firebase, silnika tenisowego, tabeli i domeny SSL

---

## Polecenia szybkiego startu:

```bash
# Uruchomienie testów weryfikacyjnych post-deploy:
npm run test:deploy

# Uruchomienie deweloperskie aplikacji (port 3000):
npm run dev

# Zbudowanie wersji produkcyjnej:
npm run build

# Synchronizacja i wdrożenie produkcyjne przez GitHub Actions:
npm run push:github -- "feat: opis zmian"

# Wykonanie kopii zapasowej danych do pliku JSON:
npm run backup
```
