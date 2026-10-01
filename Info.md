# Visit Kożuchów – Mobilny Przewodnik Turystyczny i Asystent AI
## Kompleksowa dokumentacja funkcji, architektury i zawartości aplikacji (Materiały do prezentacji)

---

## 1. Wprowadzenie i cel projektu
**Visit Kożuchów** to nowoczesna, w pełni dostępna (WCAG 2.1 AA) aplikacja mobilna stworzona dla turystów oraz mieszkańców odkrywających bogate dziedzictwo historyczne Kożuchowa (województwo lubuskie). 

Aplikacja łączy tradycyjny przewodnik turystyczny z **inteligentnym asystentem sztucznej inteligencji (AI)**, geolokalizacją GPS, skanerem kodów QR w terenie, audioprzewodnikiem (Text-to-Speech) oraz interaktywną mapą z funkcją **autorskiego planowania tras spacerowych**.

---

## 2. Wymagania systemowe i specyfikacja techniczna

| Cecha | Szczegóły techniczne |
| :--- | :--- |
| **System operacyjny Android** | **Wymagany Android 8.0 (Oreo, API 26) lub nowszy**.<br>Rekomendowany **Android 12.0 (Snow Cone, API 31)+** aż do najnowszego Androida 15. |
| **System operacyjny iOS** | **iOS 14.0 lub nowszy** (kompatybilność z iPhone oraz iPad). |
| **Uprawnienia systemowe** | • **Aparat (Camera):** wymagany do skanowania tabliczek z kodami QR umieszczonych na zabytkach.<br>• **Lokalizacja GPS (Fine/Coarse Location):** wymagana do wyznaczania odległości do zabytków i restauracji oraz nawigacji na mapie. |
| **Łączność sieciowa** | **Działa w trybie hybrydowym (Offline-First):** wszystkie opisy, zdjęcia, audio i baza wiedzy działają bez dostępu do Internetu. Połączenie sieciowe wzbogaca asystenta AI o modele chmurowe Groq. |
| **Silnik wykonawczy** | React Native / Expo SDK 52 z silnikiem **Hermes Engine** (optymalizacja pamięci RAM i natychmiastowy start). |

---

## 3. Inteligentny Asystent AI (Sztuczna Inteligencja)

W aplikacji zintegrowano wielopoziomowego przewodnika AI, z którym turysta może prowadzić naturalny dialog po polsku.

### W czym pomaga asystent AI?
1. **Opowiadanie historii i sekretów miasta:** AI zna szczegółowe fakty o kożuchowskich fortyfikacjach, tajemnicach ukrytej wieży zamku, lochach głodowych, pobycie królewicza Zygmunta Jagiellończyka czy płaskorzeźbach żaglowców na sklepieniu kościoła.
2. **Inteligentne generowanie tras na żądany czas:** Turysta może napisać np. *„Ułóż mi trasę na 2 godziny”* lub *„Krótki spacer na 1h”*. Asystent układa logiczną kolejność zwiedzania i generuje interaktywny przycisk **„Pokaż trasę na mapie”**, który jednym kliknięciem przenosi wyznaczoną ścieżkę do modułu mapy.
3. **Rekomendacje gastronomiczne na bazie GPS:** AI analizuje aktualne współrzędne turysty i precyzyjnie wskazuje najbliższy lokal gastronomiczny (Restauracja Rycerska, Pizzeria Ciao Ciao, Nasir Kebab itp.) wraz z **dokładną odległością w metrach**.
4. **Interaktywne odnośniki do obiektów:** Jeśli AI wspomina o danym zabytku, w dymku wiadomości automatycznie pojawia się kafelek z przyciskiem przejścia do pełnej karty danego miejsca.
5. **Wbudowany lektor głosowy:** Każda odpowiedź asystenta posiada przycisk *„Odsłuchaj”* (synteza mowy w języku polskim).

### Trzypoziomowa architektura niezawodności (Resilience Architecture):
* **Poziom 1 (Chmura Groq):** Model rozumujący `openai/gpt-oss-20b` z kontrolowanym parametrem `reasoning_effort: low` i buforem 1200 tokenów. Zapewnia odpowiedzi w czasie ~600 ms bez zacinania.
* **Poziom 2 (Chmura Fallback):** W razie przeciążenia sieci następuje automatyczne, niewidoczne dla użytkownika przełączenie na model `qwen/qwen3.8-27b` (czas odpowiedzi ~270 ms).
* **Poziom 3 (Lokalny Offline Engine):** Przy całkowitym braku zasięgu (np. w podziemiach zamku) zapytania obsługuje wbudowany lokalny silnik wiedzy. Użytkownik **nigdy** nie otrzymuje pustego ekranu ani błędu połączenia.

---

## 4. Interaktywna mapa i planowanie tras („Utwórz trasę dla siebie”)

Moduł mapy ([MapScreen](file:///c:/Projects/visit-kozuchow/src/screens/MapScreen.js)) to pełnoekranowe centrum nawigacji po Kożuchowie:

### Kluczowe funkcje mapy:
* **Wszystkie zabytki na mapie:** Wszystkie 12 historycznych obiektów posiada dedykowane pinezki z unikalnymi ikonami kategorii (*Zabytki*, *Architektura*, *Miejsca pamięci*, *Parki i Przyroda*).
* **Przejście z karty zabytku („Pokaż na mapie”):** W karcie każdego obiektu znajduje się przycisk, który przenosi turystę na mapę i natychmiast płynnie centruje widok na jego współrzędnych.
* **Kreator własnych tras („Utwórz trasę dla siebie”):**
  * Turysta może samodzielnie zaznaczyć dowolne zabytki, które chce odwiedzić.
  * Aplikacja w czasie rzeczywistym oblicza **łączny dystans trasy w metrach/kilometrach** oraz **szacowany czas przejścia i zwiedzania**.
  * Po zatwierdzeniu na mapie rysowana jest ciągła ścieżka (**Polyline**), a pinezki otrzymują czytelną numerację kolejnych przystanków (1, 2, 3...).
* **Gotowe szlaki AI (Presety czasowe):**
  1. *Szybki spacer (ok. 1h)*: Zamek → Mury miejskie → Baszta Krośnieńska → Rynek.
  2. *Szlak fortyfikacji i tajemnic (ok. 1.5h)*: Zamek → Mury i fosa → Domek kata → Baszta → Fasada ul. Klasztornej.
  3. *Szlak sakralny i pamięci (ok. 2h)*: Kościół Gromnicznej → Kościół św. Ducha → Lapidarium → Wieża ewangelicka.
  4. *Wielka pętla kożuchowska (ok. 2.5h)*: Zamek → Mury → Rynek → Park Miejski z portykiem → Wieża ciśnień → Lapidarium.
* **Nawigacja w terenie (Route Mode):** Podczas marszu u góry ekranu wyświetla się status trasy: *„Przystanek 2 z 5: Baszta Krośnieńska”* z przyciskami przełączania na kolejny cel i zakończenia trasy.

---

## 5. Skaner kodów QR

### Do czego służy i jak jest wykorzystywany?
Kożuchów posiada fizyczne tabliczki informacyjne na zabytkach oraz wewnątrz sal zamkowych. Aplikacja posiada wbudowany szybki skaner kamery ([QRScannerScreen](file:///c:/Projects/visit-kozuchow/src/screens/QRScannerScreen.js)):
* **Błyskawiczna identyfikacja obiektu:** Zeskanowanie kodu (np. `KZ-01-PLACE` do `KZ-12-PLACE`) natychmiast otwiera szczegółową kartę danego zabytku bez konieczności wpisywania nazwy.
* **Obsługa sal muzealnych:** W Zamku kody QR (np. `KZ-01-ROOM` – Sala Rycerska, `KZ-02-ROOM` – Izba Regionalna) otwierają dedykowane opisy konkretnych ekspozycji.
* **Tryb dostępności (Dla osób z ograniczeniami wzroku/ruchu):** Możliwość ręcznego wprowadzenia kodu z klawiatury oraz włączania latarki do skanowania po zmroku.

---

## 6. Katalog obiektów historycznych (12 zabytków)

Wszystkie obiekty posiadają wyczerpujące opracowanie historyczne, galerię zdjęć w wysokiej rozdzielczości, dane GPS, adresy, godziny dostępności oraz audioprzewodnik.

1. **Zamek w Kożuchowie (XIII–XIV w.)**
   * *Kategoria:* Zabytki | *GPS:* 51.747179, 15.594875 (ul. Klasztorna)
   * *Ciekawostki:* Najstarsza warownia Piastów głogowskich wzniesiona na bagnach na drewnianych palach. Wewnątrz budynku ukryty jest XIV-wieczny cylindryczny stołp z lochami głodowymi o grubości murów 2,6 m. Rezydował tu książę Zygmunt Jagiellończyk (późniejszy król Zygmunt I Stary). Posiada wyodrębnione sale: *Sala Rycerska* i *Izba Regionalna*.
2. **Kościół pw. Matki Boskiej Gromnicznej (XIII w.)**
   * *Kategoria:* Architektura | *GPS:* 51.745787, 15.593527 (Plac Matejki)
   * *Ciekawostki:* W ścianę prezbiterium wmurowana jest wczesnośredniowieczna rzeźba „Głowa w murze”. Barokowe sklepienie zdobią unikalne dla kościołów śródlądowych sztukaterie przedstawiające morskie okręty żaglowe.
3. **Baszta Krośnieńska (XIV–XV w.)**
   * *Kategoria:* Zabytki | *GPS:* 51.746859, 15.593184 (ul. Zielonogórska 8)
   * *Ciekawostki:* Jedyna ocalała wieża bramna spośród trzech niegdyś strzegących miasta. Mierzy ponad 20 metrów wysokości, ocalała dzięki przekształceniu na mieszkania w XIX w., dziś mieści zbiory Izby Regionalnej.
4. **Średniowieczne mury obronne i fosa (XIII/XIV w.)**
   * *Kategoria:* Zabytki | *GPS:* 51.745983, 15.593172 (ul. B. Krzywoustego)
   * *Ciekawostki:* Unikat w skali europejskiej – niemal nienaruszony pełny pierścień kamienno-ceglany o obwodzie ponad 1000 metrów. Dawna głęboka fosa została przekształcona w zieloną promenadę spacerową.
5. **Domek kata (XV w.)**
   * *Kategoria:* Zabytki | *GPS:* 51.744300, 15.596600 (ul. Szprotawska)
   * *Ciekawostki:* Dawna baszta wykuszowa w linii obwarowań. Według tradycji miejskiej stanowiła odosobnione mieszkanie miejskiego egzekutora.
6. **Rynek i Ratusz (XIII–XIX w.)**
   * *Kategoria:* Architektura | *GPS:* 51.746200, 15.596000 (Rynek)
   * *Ciekawostki:* Nienaruszony szachownicowy układ urbanistyczny z czasów lokacji. Ratusz łączy elementy gotyckie z neoklasycyzmem, a pod rynkiem ciągną się wielopoziomowe piwnice leżakowania dawnego kożuchowskiego piwa.
7. **Lapidarium rzeźby nagrobnej (XVII w.)**
   * *Kategoria:* Miejsca pamięci | *GPS:* 51.743881, 15.589866 (ul. 1 Maja)
   * *Ciekawostki:* Dawny cmentarz ewangelicki z 1634 roku – jedna z najlepiej zachowanych nekropolii tego typu w Polsce. Zawiera prawie 200 zabytkowych płyt nagrobnych z bogatą symboliką wanitatywną (Chronos, czaszki, klepsydry).
8. **Barokowy portyk i Park Miejski (1780 r.)**
   * *Kategoria:* Parki i Przyroda | *GPS:* 51.747194, 15.598859 (Park Miejski)
   * *Ciekawostki:* Ocalały portyk dawnego pałacu von Kalckreuthów z czterema kamiennymi hermami. W parku znajduje się pomnik żydowskiego filozofa Salomona Maimona oraz liczne pomniki przyrody (platany, cisy, dęby).
9. **Zabytkowa fasada kamienicy (XVIII w.)**
   * *Kategoria:* Architektura | *GPS:* 51.746650, 15.595420 (ul. Klasztorna)
   * *Ciekawostki:* Samotna, ocalała fasada rozebranej kamienicy ozdobiona stiukowymi płaskorzeźbami św. Piotra i Pawła oraz muszlowymi motywami chrztu.
10. **Kościół pw. Św. Ducha (XIV w.)**
    * *Kategoria:* Architektura | *GPS:* 51.744520, 15.591580 (ul. 1 Maja 34)
    * *Ciekawostki:* Średniowieczny kościół szpitalny wybudowany poza murami obronnymi. Jedyny zachowany zabytek dawnego szpitalnictwa w regionie, ze sklepieniem sieciowym w prezbiterium.
11. **Wieża kościoła ewangelickiego (1826 r.)**
    * *Kategoria:* Zabytki | *GPS:* 51.743083, 15.593250 (Plac Ewangelicki)
    * *Ciekawostki:* Ocalała wieża jednego z sześciu śląskich Kościołów Łaski, wzniesionych po ugodzie altransztadzkiej z 1709 r. Sam drewniano-szachulcowy kościół rozebrano w latach 60. XX w.
12. **Wieża ciśnień (1908 r.)**
    * *Kategoria:* Zabytki | *GPS:* 51.741750, 15.596444 (ul. Szprotawska)
    * *Ciekawostki:* Monumentalny obiekt techniki o wysokości prawie 39 m, usytuowany w najwyższym punkcie miasta (112 m n.p.m.). Styl neogotycko-secesyjny z cegły klinkierowej ze zbiornikiem Intze.

---

## 7. Wyszukiwarka i katalog zabytków ([ExploreScreen](file:///c:/Projects/visit-kozuchow/src/screens/ExploreScreen.js))
* **Błyskawiczne filtrowanie:** Wyszukiwanie na żywo po fragmentach nazwy, ulicy lub kategorii zabytku.
* **Przewijana horyzontalnie galeria kart:** Wyświetlanie zdjęć obiektów, kategorii i adresów.
* **Zintegrowana mini-mapa:** Podgląd rozmieszczenia obiektów bezpośrednio z poziomu ekranu głównego.

---

## 8. Audioprzewodnik (Text-to-Speech)
* Wbudowany w każdy obiekt komponent `AudioGuideButton`.
* Lektor odczytuje pełny rys historyczny w języku polskim z możliwością zatrzymania w dowolnym momencie.
* Działa bez potrzeby pobierania zewnętrznych plików MP3 – wykorzystuje natywny silnik mowy urządzenia.

---

## 9. Standard dostępności cyfrowej WCAG 2.1 (AA)
Aplikacja została zaprojektowana zgodnie z międzynarodowymi wymogami dostępności dla osób ze szczególnymi potrzebami:
* **Rozmiar pól dotykowych (Touch Targets):** Wszystkie przyciski, karty i elementy sterujące posiadają fizyczny wymiar dotykowy **co najmniej 48×48 dp** lub poszerzone marginesy `hitSlop`.
* **Tryb wysokiego kontrastu (High Contrast):** Współczynnik kontrastu tekstu do tła powyżej **7:1**, wyraźne czarne obramowania wokół przycisków i kart.
* **Tryb dla osób z daltonizmem (Color Blind Mode):** Alternatywna paleta barw eliminująca problematyczne pary kolorów (np. czerwień/zieleń) oraz uzupełnienie statusów ikonami i tekstem.
* **Powiększony tekst (Large Text):** Globalne zwiększenie rozmiaru fontów w połączeniu z pełnym wsparciem dla systemowego skalowania (`allowFontScaling={true}`).
* **Czytniki ekranu (TalkBack / VoiceOver):** Wypełnione atrybuty `accessible={true}`, precyzyjne `accessibilityLabel`, semantyczne `accessibilityRole` oraz zarządzanie fokusem (`setAccessibilityFocus`).

---

## 10. Bezpieczeństwo i zgodność z RODO
* Wbudowany modal informacji prawnych: przejrzysty **Regulamin** oraz **Polityka Prywatności**.
* Brak śledzenia komercyjnego, brak gromadzenia danych wrażliwych. Lokalizacja GPS przetwarzana jest wyłącznie lokalnie w pamięci urządzenia.
