# Visit Kożuchów — Raport Wdrożonych Zmian i Nowości (Co dodano)

Niniejszy dokument stanowi oficjalne podsumowanie funkcji, ulepszeń i poprawek wdrożonych w aplikacji **Visit Kożuchów** w ramach najnowszych aktualizacji (Wersja 1.1). Wdrożone zostały m.in. kluczowe moduły z planów rozwoju (Roadmap), w tym pełna wielojęzyczność, ciemny motyw oraz przygotowanie do kompilacji produkcyjnej.

---

## 1. Wielojęzyczność (i18n): Język Polski, Angielski i Niemiecki

Jedna z najważniejszych funkcjonalności zaplanowanych pierwotnie na przyszłe wersje została w całości ukończona i zintegrowana:

* **Trzy kompletne bazy językowe JSON:**
  * `src/i18n/pl.json` — język polski (domyślny)
  * `src/i18n/en.json` — język angielski (międzynarodowy)
  * `src/i18n/de.json` — język niemiecki (dla turystów z Niemiec i pogranicza)
* **Zarządzanie stanem języka (`LanguageContext.js`):**
  * Natychmiastowe przełączanie języka w locie (bez restartu aplikacji).
  * Trwałe zapamiętywanie wybranego języka w pamięci urządzenia (`AsyncStorage`).
* **Automatyczne tłumaczenie bazy wiedzy o zabytkach (`translatePlace`):**
  * Tłumaczenie tytułów obiektów, opisów historycznych, ciekawostek, legend, adresów, godzin otwarcia oraz sal zamkowych (*Sala Rycerska*, *Izba Regionalna*).
* **Wielojęzyczny Audioprzewodnik (Text-to-Speech):**
  * Automatyczne dopasowanie silnika syntezy mowy do wybranego języka:
    * `pl-PL` dla języka polskiego,
    * `en-US` dla języka angielskiego,
    * `de-DE` dla języka niemieckiego.
* **Wielojęzyczny Asystent AI:**
  * Asystent automatycznie odpowiada w wybranym języku (polskim, angielskim lub niemieckim).
  * Dynamiczne powitanie powitalne oraz podpowiedzi pytań (chipsy) dostosowane do języka.

---

## 2. Pełny Ciemny Motyw (Dark Mode)

Aplikacja zyskała kompleksowe wsparcie dla trybu ciemnego, zoptymalizowanego pod kątem ekranów OLED/AMOLED oraz spacerów wieczornych:

* **Spójna stylistyka w całej aplikacji:**
  * Ciemne tła, eleganckie powierzchnie (`#0F172A`, `#1E293B`, `#132338`) i wysoki kontrast typografii (`#F8FAFC`).
  * Wyeliminowano wszelkie niepożądane białe ramki i krawędzie wokół kart, widżetów oraz elementów nawigacyjnych.
* **Dostosowanie paska stanu (`StatusBar`):**
  * Automatyczne przełączanie ikon paska stanu (bateria, zegar, wifi) między jasnymi i ciemnymi.
* **Tryb ciemny w mapach:**
  * Spójna ciemna stylistyka paneli informacyjnych, kreatora tras oraz dolnego arkusza zabytków na tle mapy satelitarnej.

---

## 3. Nowy, Stonowany Ekran Ustawień (`SettingsScreen`)

Ekran ustawień został całkowicie przeprojektowany na bardziej powściągliwy, intuicyjny i elegancki:

* **Brak wizualnego przesytu:** Usunięto jaskrawe, sztucznie wyglądające gradienty i nadmiarowe ikony.
* **Czytelny podział modułowy:**
  1. **Język aplikacji (i18n):** Przełącznik flag (PL / EN / DE) z zaznaczeniem aktywnego języka.
  2. **Wygląd i motyw:** Przełącznik trybu ciemnego / jasnego.
  3. **Ułatwienia dostępu (WCAG 2.1 AA):**
     * Tryb wysokiego kontrastu (> 7:1)
     * Tryb dla osób z daltonizmem (protanopia, deuteranopia, tritanopia)
     * Powiększony tekst z dynamicznym skalowaniem czcionek
  4. **Informacje o projekcie:** Wersja, autorzy, prawa autorskie i linki prawne.
* **Pełna dostępność:** Wszystkie przełączniki i kafelki posiadają wymiary min. 48×48 dp i etykiety dla czytników ekranu.

---

## 4. Udoskonalona Mapa Satelitarna (Hybrid Satellite Map)

* **Stały widok satelitarny z etykietami (`mapType="hybrid"`):**
  * Zrezygnowano ze zbędnego i mylącego przycisku przełączania warstw — turysta ma teraz zawsze czytelną, fotorealistyczną mapę satelitarną z nałożonymi nazwami ulic i numeracją domów.
* **Inteligentne centrowanie na obiektach:**
  * Kamera mapy po kliknięciu obiektu automatycznie przesuwa się lekko ku górze, dzięki czemu dolny panel informacyjny nie zasłania pinezki ani zabytku.
* **Poprawka licznika przystanków trasy ("Punkt 10 z 12"):**
  * Naprawiono błąd obcinania tekstu przy trasach liczących powyżej 9 przystanków — licznik i przycisk następnego przystanku mieszczą się idealnie bez nakładania.

---

## 5. Nowa Architektura Asystenta AI i Bezpośrednia Nawigacja

* **Przeniesienie czatu do natywnego ekranu (`AIChatScreen`):**
  * Zastąpiono lokalne okno modalne dedykowanym ekranem w stosie nawigacyjnym React Navigation z animacją wysuwania od dołu (`slide_from_bottom`).
* **Bezpośrednie przejście do mapy i szczegółów (Bez migotania!):**
  * Wcześniej kliknięcie odnośnika zamykało czat, przez co na 220 ms pojawiał się ekran katalogu, a dopiero potem otwierała się mapa.
  * Teraz kliknięcie **„Pokaż na mapie”**, **„Szczegóły”** lub **kartę wyznaczonej trasy** przechodzi **natychmiastowo i bezpośrednio** do docelowego ekranu.
  * Cofnięcie się strzałką wstecz powraca bezpośrednio do rozmowy z asystentem AI z zachowaniem całej historii.
* **Naprawione zachowanie klawiatury:**
  * Usunięto problem nakładania się klawiatury na pole tekstowe na Androidzie.
  * Zaimplementowano dynamiczny dolny odstęp (10 dp przy otwartej klawiaturze nad klawiszami, bezpieczny margines gestów telefonu przy zamkniętej).
  * Zlikwidowano szarpanie i niechciane skoki ekranu przy dotknięciu pola wprowadzania wiadomości.
* **Czyste kafelki pod wiadomościami:**
  * Usunięto wyświetlanie surowych znaczników `[LINK:...]` i `[ROUTE:...]` w tekście dymku — odnośniki są prezentowane estetycznie jako osobne przyciski akcji pod odpowiedzią AI.

---

## 6. Przygotowanie do Kompilacji na Android i iOS

Projekt został w 100% skonfigurowany pod proces kompilacji i publikacji na obie platformy:

* **Plik `app.json`:**
  * **iOS:**
    * Identyfikator pakietu: `bundleIdentifier: "com.visitkozuchow.guide"`
    * Numer kompilacji: `buildNumber: "1"`
    * Wsparcie dla tabletów iPad: `supportsTablet: true`
    * Wymagane opisy uprawnień w `infoPlist`: aparat (`NSCameraUsageDescription`), lokalizacja GPS (`NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`).
  * **Android:**
    * Nazwa pakietu: `package: "com.visitkozuchow.guide"`
    * Kod wersji: `versionCode: 1`
    * Uprawnienia systemowe: `CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
    * Ikona adaptacyjna zoptymalizowana pod Android 12–15.
  * **Globalne:**
    * Schemat Deep Linków: `scheme: "visitkozuchow"`
    * Wtyczki konfiguracyjne: `expo-camera`, `expo-location`, `expo-status-bar`, `expo-asset`.
* **Plik `eas.json`:**
  * Profil `preview`: natychmiastowe generowanie pliku instalacyjnego Android APK (`buildType: "apk"`) oraz wersji na symulator iOS (`simulator: true`).
  * Profil `production`: oficjalna paczka Android App Bundle (`buildType: "app-bundle"`) dla Google Play oraz kompilacja produkcyjna `.ipa` dla Apple TestFlight / App Store.
* **Skrypty budowania w `package.json`:**
  * `npm run build:android:apk` — budowanie pliku APK na telefon Android
  * `npm run build:android:aab` — budowanie paczki produkcyjnej AAB
  * `npm run build:ios:sim` — budowanie na symulator iOS
  * `npm run build:ios:store` — budowanie produkcyjne na iOS
  * `npm run build:all` — równoległe budowanie na obie platformy
  * `npm run check:config` — weryfikacja poprawności konfiguracji Expo

---

## 7. Podsumowanie Stanu Projektu

| Obszar | Przed aktualizacją | Po aktualizacji |
| :--- | :--- | :--- |
| **Języki** | Tylko polski | **Polski, Angielski, Niemiecki (PL/EN/DE)** |
| **Audioprzewodnik** | Tylko polski lektor | **Wielojęzyczny TTS (pl-PL, en-US, de-DE)** |
| **Asystent AI** | Tylko język polski, modal | **Wielojęzyczny AI, natywny ekran, bezpośrednie linki** |
| **Motyw** | Wyłącznie jasny | **Pełny Ciemny i Jasny Motyw (Dark & Light Mode)** |
| **Ekran Ustawień** | Złożony, eksperymentalny | **Stonowany, czytelny, intuicyjny, dostępny WCAG** |
| **Mapa** | Przełącznik satelita/ulice | **Stały hybrydowy widok satelitarny z ulicami** |
| **Klawiatura w czacie** | Nakładała się na pole tekstowe | **Idealne dopasowanie bez zasłaniania i skoków** |
| **Nawigacja z AI** | Zamykanie okna i migotanie Explore | **Bezpośredni, natychmiastowy przeskok do Mapy/Zabytku** |
| **Budowanie Android** | Podstawowe | **Gotowe APK do instalacji oraz AAB do Google Play** |
| **Budowanie iOS** | Brak bundleIdentifier | **Pełny bundleIdentifier, uprawnienia i profil EAS** |
