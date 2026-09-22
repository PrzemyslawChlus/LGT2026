# Pakiet Dokumentacji i Specyfikacji Projektu: Liga Gentlemanów w Tenisie (LGT 2026)

**Data wygenerowania:** Marzec 2026  
**Status produkcyjny:** Wdrożony i aktywny pod adresem [https://lgt2026.pl](https://lgt2026.pl)  
**Katalog źródłowy:** `/LGT-Docs/`

---

## Zawartość Pakietu:

1. **`DOKUMENTACJA_APLIKACJI.md`**  
   Kompletna dokumentacja techniczna i funkcjonalna:
   - Architektura systemu (React 19, TypeScript, Express, Cloud Run, Firebase Hosting, Firestore)
   - Przepływ domenowy z certyfikatem SSL dla `lgt2026.pl`
   - Role użytkowników (Komisarz, Dżentelmen, Gość)
   - Model bazy danych NoSQL w Firestore
   - Reguły punktacji ligowej (3:0, 2:1, 1:2, 0:3) oraz mecze sparingowe
   - Autoryzacja i bezpieczeństwo (e-mail, hasła $\ge 6$ znaków, prefiks `+48`)

2. **`SPECYFIKACJA_ODTWORZENIA_PROJEKTU.md`**  
   Precyzyjny Master Prompt i specyfikacja inżynieryjna:
   - Pozwala dowolnemu agentowi AI lub programiście postawić całą aplikację od zera
   - Zawiera pełne definicje typów (`src/types.ts`)
   - Zawiera implementację algorytmu 2 miesięcy kalendarzowych na mecze rewanżowe
   - Zawiera kod walidacji setów, tie-breaków i super tie-breaków
   - Zawiera konfigurację środowiska i deploymentu

3. **`TESTY_AUTOMATYCZNE_PO_DEPLOYU.md`**  
   Instrukcja suity testowej uruchamianej po każdym deployu:
   - Polecenie `npm run test:deploy`
   - Raport z 32 testów automatycznych
   - Weryfikacja Cloud Run, Firebase, silnika tenisowego, tabeli i domeny SSL

---

## Polecenia szybkiego startu:

```bash
# Uruchomienie testów weryfikacyjnych post-deploy:
npm run test:deploy

# Uruchomienie deweloperskie aplikacji:
npm run dev

# Zbudowanie wersji produkcyjnej:
npm run build
```
