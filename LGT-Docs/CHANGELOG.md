# Dziennik Zmian (Changelog) — Liga Gentlemanów w Tenisie (LGT 2026)

Wszystkie istotne zmiany, nowe funkcjonalności, poprawki bezpieczeństwa i usprawnienia techniczne w projekcie **Liga Gentlemanów w Tenisie** są dokumentowane w niniejszym pliku.

Format oparty jest o zasady [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/), a wersjonowanie powiązane ze stemplem wydań produkcyjnych (`v2026.YYYYMMDD.HHMM`) oraz [Semantic Versioning](https://semver.org/).

---

## [v2026.20260922.2230] — 2026-09-22

### Dodano (Added)
- **Modal Pop-up z prośbą o włączenie powiadomień Push (`PushNotificationPromptModal`):**
  - Eleganckie okno pop-up pytające użytkownika po zalogowaniu o aktywację powiadomień push na urządzeniu.
  - Stylowa estetyka klubu tenisowego (głęboki szmaragd, limonka i złoto) z animowanym dzwonkiem oraz wyróżnieniem 4 kluczowych korzyści:
    - 🎾 **Zaplanowane mecze:** Natychmiastowa informacja, gdy rywal zaproponuje termin lub zmieni godzinę gry.
    - 🏆 **Wyniki i ranking:** Błyskawiczny komunikat o wpisanych wynikach i zmianach w tabeli ligi.
    - ⏰ **Przypomnienia 2h po meczu:** Powiadomienie ułatwiające terminowe uzupełnienie wyniku.
    - 🔊 **Dźwięk uderzenia piłki:** Autentyczny odgłos czystego forehandu tenisowego.
  - **Przycisk odsłuchania dźwięku:** Użytkownik może przetestować autentyczny dźwięk uderzenia piłki bezpośrednio w modalu przed włączeniem powiadomień.
  - **Inteligentne odkładanie (Snooze):** Opcja *„Może później”* odracza ponowne wyświetlenie monitu o 7 dni (`localStorage`), nie narzucając się użytkownikowi.
  - **Kolejkowanie z weryfikacją meczów:** Modal powiadomień push nie nakłada się na prompt zaległego meczu i pojawia się z łagodnym 1.8-sekundowym opóźnieniem po załadowaniu kokpitu.
  - Zintegrowano bezpośrednie wywołanie modalu z szufladą powiadomień (`NotificationDrawer`).
- **Rozszerzenie testów automatycznych:**
  - Dodano asercje testujące mechanizm odkładania (snooze) i resetowania statusu modalu pop-up (`44 PASSED, 0 FAILED`).

---

## [v2026.20260922.2205] — 2026-09-22

### Dodano (Added)
- **Weryfikacja zaległych meczów przy logowaniu:**
  - Automatyczne okno dialogowe (`OverdueMatchPromptModal`) wyświetlane uczestnikom spotkania przy pierwszym logowaniu po upłynięciu zaplanowanego terminu meczu.
  - Opcja **„Tak, mecz się odbył”** natychmiast przenosząca gracza do formularza uzupełnienia wyniku.
  - Opcja **„Nie, mecz się nie odbył”** trwale usuwająca wpis o zaplanowanym meczu z bazy Firestore i terminarza ligi. Zgodnie z wytycznymi wystarczy, że jeden z dwóch uczestników udzieli odpowiedzi, by uporządkować kalendarz.
  - Opcje przełożenia meczu na nowy termin oraz odłożenia odpowiedzi na później.
  - Wyróżnienie zaległych spotkań na liście meczów w terminarzu (pulsująca plakietka *„Termin minął”*, ramka ostrzegawcza oraz szybki przycisk usunięcia niedoszłego meczu).
- **Automatyczne powiadomienie push 2h po planowanym terminie:**
  - Monitor w tle sprawdzający mecze, od których zaplanowanego terminu minęły 2 godziny.
  - Jeśli wynik nie został jeszcze wprowadzony (`status === 'scheduled'`), system wysyła powiadomienie push skierowane wyłącznie do obydwu uczestników spotkania.
  - Jeśli wynik został wprowadzony (`status === 'completed'`), powiadomienie push nie jest wysyłane.
- **Autentyczny dźwięk powiadomienia:**
  - Zastąpiono syntetyczny dźwięk Web Audio oryginalnym, wysokiej jakości nagraniem czystego uderzenia rakietą w piłkę tenisową na korcie krytym (forehand).
  - Przygotowano zoptymalizowane pliki dźwiękowe `/tennis-hit.mp3` oraz `/tennis-hit.wav` z normalizacją głośności EBU R128 i miękkim fade-in/fade-out.
  - Zarejestrowano zasoby audio w pamięci podręcznej Service Workera (`public/sw.js`) do natychmiastowego odtwarzania w trybie offline i PWA.
- **Automatyzacja GitHub CI/CD:**
  - Skrypt `npm run push:github` ze wsparciem dla automatycznego inkrementowania numeru wersji w `public/version.json`.
  - Workflow GitHub Actions (`.github/workflows/deploy.yml`) automatycznie wdrażający każdą zmianę z gałęzi `main` na platformę Firebase Hosting (`lgt2026.pl`).

### Zmieniono (Changed)
- Rozbudowano interfejs `Match` o pola `overduePushSent?: boolean`, `overdueNotifiedAt?: number`, `time?: string`, `courtName?: string`, `surface?: SurfaceType`.
- Rozszerzono typ powiadomień `NotificationType` o kategorię `match_overdue_reminder`.
- Zaktualizowano szufladę powiadomień (`NotificationDrawer`) o dedykowaną ikonę zegara, pomarańczowe tło dla powiadomień o zaległych meczach oraz przełącznik preferencji powiadomień o meczach 2h po terminie.
- Zaktualizowano reguły bezpieczeństwa bazy danych Firestore (`firestore.rules`).

---

## [v2026.20260920.1830] — 2026-09-20

### Dodano (Added)
- **Moduł Mobilizacji do Gry z Nowymi Rywalami (`OpponentSuggester`):**
  - Inteligentny widget na stronie głównej rekomendujący zawodników, z którymi zalogowany gracz jeszcze nie rozegrał meczu lub u których upłynął wymagany odstęp 2 miesięcy kalendarzowych.
  - Szybkie przyciski bezpośredniego kontaktu (telefon, WhatsApp) oraz planowania meczu z poziomu rekomendacji.
- **Proaktywny monitor wersji aplikacji (`VersionNotification`):**
  - Wykrywanie w tle nowych wydań produkcyjnych (`public/version.json`) z możliwością natychmiastowego odświeżenia Service Workera bez utraty danych sesji.

### Zmieniono (Changed)
- Ulepszono nawigację dolną na urządzeniach mobilnych (`MobileBottomNav`).
- Wprowadzono bezpieczne zarządzanie kontami zawodników przez Komisarza Ligi.

---

## [v2026.20260901.1200] — 2026-09-01

### Dodano (Added)
- **Wydanie Podstawowe Ligi Gentlemanów w Tenisie (LGT 2026):**
  - Pełna implementacja tabeli ligowej z automatycznym sortowaniem według punktów, bilansu meczów, bilansu setów, bilansu gemów oraz bezpośredniego pojedynku (H2H).
  - Oficjalny system punktacji meczowej:
    - 2:0 $\rightarrow$ 3 punkty dla zwycięzcy, 0 dla pokonanego.
    - 2:1 $\rightarrow$ 2 punkty dla zwycięzcy, 1 punkt dla pokonanego.
  - Matematyczny silnik tenisowy: walidacja setów do 6 gemów, tie-breaków do 7 pkt i super tie-breaków do 10 pkt z wymogiem 2 punktów przewagi.
  - Algorytm 2 miesięcy kalendarzowych na mecze rewanżowe (`getTwoMonthsLaterDate`). Spotkania rozgrywane częściej automatycznie klasyfikowane jako sparingi towarzyskie (`isFriendly: true`, 0 pkt do tabeli ligowej).
  - Autoryzacja użytkowników (RBAC: Komisarz Ligi oraz Gracze) z logowaniem adresem e-mail i hasłem min. 6 znaków.
  - Rejestracja nowych zawodników z nienaruszalnym prefiksem kraju `+48` i deklaracją Kodeksu Fair Play.
  - Integracja z Google Cloud Firestore (kolekcje: `users`, `players`, `matches`, `settings`, `notifications`, `audit_logs`).
  - Dedykowana domena produkcyjna `https://lgt2026.pl` z certyfikatem SSL i hostingiem Firebase Hosting CDN.
  - Obsługa PWA (Progressive Web App) z manifestem, ikonami SVG i Service Workerem.
