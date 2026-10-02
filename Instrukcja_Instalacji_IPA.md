# 📱 Instrukcja: Jak zainstalować plik .ipa na telefonie iPhone (iOS)

> Ten przewodnik opisuje krok po kroku najwygodniejsze sposoby instalacji pliku **`.ipa`** aplikacji **Visit Kożuchów** na fizycznym telefonie iPhone lub tablecie iPad.

---

## ⚡ Wymagania wstępne na telefonie iPhone (Ważne!)

W systemach **iOS 16, iOS 17 oraz iOS 18** Apple wymaga jednorazowego włączenia trybu programisty:

1. Na telefonie iPhone wejdź w: **Ustawienia (Settings)** → **Prywatność i ochrona (Privacy & Security)**.
2. Przewiń na sam dół do sekcji **Bezpieczeństwo** i dotknij **Tryb programisty (Developer Mode)**.
3. Włącz przełącznik i wybierz **Uruchom ponownie (Restart)**.
4. Po ponownym uruchomieniu telefonu potwierdź włączenie trybu kodem blokady ekranu.

---

## 🚀 Metoda 1: Instalacja bezprzewodowa przez EAS Internal Distribution (Rekomendowana)

Najszybsza metoda, działająca bezpośrednio z chmury Expo bez potrzeby podłączania telefonu kablem do komputera.

### Krok po kroku:
1. Uruchom budowanie profilu testowego w terminalu:
   ```bash
   npm run build:ios:ipa
   ```
   *(lub `npx eas-cli build -p ios --profile preview-device`)*
2. Jeśli budujesz po raz pierwszy na dane urządzenie, EAS poprosi o rejestrację Twojego iPhone'a:
   * Wyświetli link i kod QR. Otwórz link na telefonie iPhone w przeglądarce **Safari**.
   * Zainstaluj mały profil rejestracyjny Apple, który bezpiecznie odczyta identyfikator urządzenia (UDID) i doda go do profilu Ad-Hoc.
3. Po zakończeniu kompilacji w chmurze otrzymasz link i kod QR do gotowego pliku.
4. Zeskanuj kod QR aparatem iPhone'a i otwórz stronę w **Safari**.
5. Kliknij przycisk **„Install”** — aplikacja pobierze się i zainstaluje bezpośrednio na ekranie początkowym Twojego iPhone'a!

---

## 💻 Metoda 2: Instalacja przez Sideloadly (Windows & Mac) — Bardzo prosta i niezawodna

Darmowy program **Sideloadly** to najpopularniejsze narzędzie do instalacji dowolnych plików `.ipa` z komputera na iPhone przy użyciu zwykłego, darmowego konta Apple ID.

### Co jest potrzebne:
* Komputer z systemem Windows 10/11 lub macOS.
* Program **Sideloadly** (pobierz bezpłatnie z oficjalnej strony: [sideloadly.io](https://sideloadly.io/)).
* Kabel USB / Lightning / USB-C do podłączenia iPhone'a do komputera.
* Pobrany plik `.ipa` aplikacji.

### Instrukcja krok po kroku:
1. Podłącz telefon iPhone kablem do komputera. Jeśli telefon zapyta, wybierz **„Ufaj temu komputerowi”** i wpisz kod blokady.
2. Otwórz program **Sideloadly**. Program automatycznie wykryje podłączony telefon w polu *Connected Device*.
3. W polu **Apple ID** wpisz swój adres e-mail Apple ID (służy do wygenerowania darmowego podpisu deweloperskiego na 7 dni).
4. Przeciągnij pobrany plik **`visit-kozuchow.ipa`** i upuść go na duże pole z ikoną po lewej stronie programu.
5. Kliknij duży przycisk **Start**.
6. Przy pierwszym razie wpisz hasło do swojego konta Apple ID (oraz kod 2FA wysłany na telefon).
7. Po ok. 30–60 sekundach w logach pojawi się komunikat `Done!` — aplikacja pojawi się na ekranie telefonu.

#### ⚠️ Pierwsze uruchomienie po instalacji przez Sideloadly:
Gdy klikniesz ikonę aplikacji na iPhone, pojawi się komunikat: *„Niezaufany deweloper”*.
* Rozwiązanie: Wejdź w **Ustawienia** → **Ogólne** → **VPN i zarządzanie urządzeniem** → kliknij na swój adres Apple ID → wybierz **Zaufaj „...”**. Aplikacja uruchomi się od razu!

---

## 🔄 Metoda 3: Instalacja przez AltStore (Bezprzewodowo z Wi-Fi)

Alternatywne narzędzie do instalacji plików `.ipa` stworzone przez Rileya Testuta.

1. Pobierz i zainstaluj **AltServer** na komputerze ([altstore.io](https://altstore.io/)).
2. Zainstaluj aplikację **AltStore** na podłączonym iPhone przez AltServer.
3. Pobierz plik `.ipa` na iPhone (np. z Dysku Google, AirDrop lub pobierz z przeglądarki).
4. W aplikacji AltStore wejdź w zakładkę **My Apps**, kliknij ikonę **`+`** w lewym górnym rogu i wybierz plik `.ipa`.
5. Aplikacja zainstaluje się na telefonie.

---

## 🌐 Metoda 4: Przez serwisy OTA (Diawi / InstallOnAir)

Jeśli plik `.ipa` został zbudowany i podpisany certyfikatem z zarejestrowanym profilem Ad-Hoc (np. przez EAS):

1. Wejdź na stronę [diawi.com](https://www.diawi.com/) lub [installonair.com](https://www.installonair.com/).
2. Wgraj plik `.ipa`.
3. Serwis wygeneruje unikalny link oraz kod QR.
4. Otwórz wygenerowany link w przeglądarce **Safari na iPhone** i kliknij **Install Application**.

---

## 🏆 Podsumowanie: Którą metodę wybrać?

| Sytuacja | Rekomendowana metoda |
| :--- | :--- |
| **Masz konto Expo / EAS i budujesz w chmurze** | **Metoda 1 (EAS Internal Distribution)** — najwygodniejsza, bez kabli. |
| **Masz gotowy plik `.ipa` na komputerze z Windows lub Mac** | **Metoda 2 (Sideloadly)** — zajmuje 1 minutę, działa na każdym iPhonie. |
| **Chcesz wysłać link do instalacji znajomemu/urzędnikowi** | **Metoda 1** lub **Metoda 4 (Diawi)**. |
