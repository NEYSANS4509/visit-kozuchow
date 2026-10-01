// src/data/aiKnowledge.js
import { PLACES } from './places';

/**
 * 1. Koordynaty lokali gastronomicznych i punktów gastronomicznych w Kożuchowie
 * do dynamicznych obliczeń odległości GPS dla turystów.
 */
export const RESTAURANTS = [
  {
    name: 'Restauracja Rycerska',
    address: 'ul. Rynek 19',
    type: 'Kuchnia polska, dania obiadowe, pizza',
    latitude: 51.7461,
    longitude: 15.5962,
  },
  {
    name: 'Pizzeria Ciao Ciao',
    address: 'ul. Rynek 19',
    type: 'Włoska pizza na cienkim cieście',
    latitude: 51.7461,
    longitude: 15.5962,
  },
  {
    name: 'Nasir Kebab & Burger',
    address: 'ul. 22 Lipca 32',
    type: 'Kebab, burgery, dania na wynos',
    latitude: 51.7471,
    longitude: 15.5968,
  },
  {
    name: 'Restauracja Pod Lipami',
    address: 'Plac Kopernika 1',
    type: 'Tradycyjne obiady domowe',
    latitude: 51.7445,
    longitude: 15.5982,
  },
  {
    name: 'Restauracja Helena',
    address: 'ul. Zielonogórska 24',
    type: 'Dania obiadowe i catering',
    latitude: 51.7492,
    longitude: 15.5938,
  },
];

/**
 * Oblicza odległość w metrach między dwoma punktami geograficznymi wg wzoru haversine.
 *
 * @param {number} lat1 - Szerokość geograficzna punktu 1
 * @param {number} lon1 - Długość geograficzna punktu 1
 * @param {number} lat2 - Szerokość geograficzna punktu 2
 * @param {number} lon2 - Długość geograficzna punktu 2
 * @returns {number} Zaokrąglona odległość w metrach
 */
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Promień Ziemi w metrach
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formatuje liczbę metrów na czytelny ciąg tekstowy (np. "350 m" lub "1.2 km").
 *
 * @param {number} meters - Odległość w metrach
 * @returns {string} Sformatowany ciąg znaków
 */
export function formatMeters(meters) {
  if (meters == null || isNaN(meters)) return '';
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

/**
 * 2. Generator promptu systemowego z pełną wiedzą faktograficzną o Kożuchowie.
 * Dynamicznie wstrzykuje do kontekstu AI najbliższe zabytki i restauracje na podstawie GPS.
 *
 * @param {object|null} userLocation - Współrzędne GPS turysty ({ latitude, longitude })
 * @returns {string} Kompletna instrukcja systemowa dla modelu AI
 */
export function generateSystemPrompt(userLocation) {
  const safePlaces = Array.isArray(PLACES) ? PLACES : [];

  // Katalog miejsc z unikalnymi identyfikatorami ID i ekspozycjami
  const placesContext = safePlaces
    .map((p) => {
      const rooms =
        Array.isArray(p.rooms) && p.rooms.length > 0
          ? ` Ekspozycje: ${p.rooms.map((r) => r.title).join(', ')}.`
          : '';
      return `- [ID: ${p.id}] ${p.title} (${p.category}, adres: ${p.location?.address || 'Kożuchów'}). ${p.shortDescription || p.fullDescription}.${rooms}`;
    })
    .join('\n');

  // Generowanie listy znaczników nawigacyjnych dla modelu językowego
  const linksHelp = safePlaces
    .map((p) => `- Jeśli mówisz o: "${p.title}" -> dopisz na samym końcu [LINK:${p.id}]`)
    .join('\n');

  // Dynamiczna sekcja geolokalizacji GPS
  let gpsSection = 'Użytkownik nie udostępnił jeszcze pozycji GPS.';
  if (userLocation?.latitude && userLocation?.longitude) {
    const sortedFood = [...RESTAURANTS]
      .map((r) => ({
        ...r,
        dist: getDistanceMeters(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude),
      }))
      .sort((a, b) => a.dist - b.dist);

    const sortedMonuments = safePlaces
      .map((p) => ({
        id: p.id,
        title: p.title,
        address: p.location?.address,
        dist: getDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          p.location?.latitude || 51.7464,
          p.location?.longitude || 15.5955
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    gpsSection = `
AKTUALNE DANE GPS TURYSTY (OD NAJBLIŻSZEGO OBIEKTU):
Restauracje i jedzenie:
${sortedFood.map((f, i) => `${i + 1}. ${f.name} (${f.address}) — ${formatMeters(f.dist)} (${f.type})`).join('\n')}

Zabytki:
${sortedMonuments.map((m, i) => `${i + 1}. ${m.title} — ${formatMeters(m.dist)} (${m.address})`).join('\n')}

ZASADA GPS: Jeśli turysta pyta "gdzie mam najbliżej zjeść" lub "jaki jest najbliższy zabytek", ZAWSZE wskazuj obiekt z pozycji 1 i podaj dokładny dystans w metrach.
`;
  }

  return `Jesteś oficjalnym, inteligentnym przewodnikiem turystycznym po Kożuchowie (woj. lubuskie).
Odpowiadaj turystom wyłącznie w języku polskim. Bądź konkretny, ciekawy i uprzejmy. Maksymalna długość odpowiedzi: 3-4 zdania.

ŚCIŚLE PRZESTRZEGAJ PONIŻSZYCH ZASAD:
1. FORMAT: Odpowiedź MUSI mieć maksymalnie 2 do 4 treściwych zdań (ok. 30–60 słów). Żadnego lania wody, zbędnych wstępów ("Oczywiście!", "Chętnie pomogę") ani sztucznych zakończeń. Przechodź od razu do sedna sprawy.
2. GRAMATYKA I ODMIANA: Pisz naturalną polszczyzną. BEZWZGLĘDNIE odmieniaj nazwy własne, restauracje i zabytki przez przypadki (np. mów: "przy Zamku", "obok Baszty Krośnieńskiej", "w Kożuchowie", "udaj się do Restauracji Rycerskiej" lub "do Pizzerii Ciao Ciao" — NIGDY nie zostawiaj nazw w mianowniku, gdy kontekst wymaga dopełniacza czy miejscownika!).
3. DOMYKANIE MYŚLI: Zawsze kończ odpowiedź pełnym zdaniem z kropką.
4. GPS: Jeśli turysta pyta "gdzie zjeść" lub "co jest najbliżej", podawaj pierwszy obiekt z listy GPS wraz z odległością w metrach.
6. ZASADA CZYSTEJ NARRACJI I LINKOWANIA (BARDZO WAŻNE):
- W samej treści odpowiedzi NIGDY nie wspominaj o linkach ani odnośnikach (BEZWZGLĘDNY ZAKAZ pisania słów: "oto link", "link poniżej", "zobacz w linku", "kliknij poniżej" itp.). Pisz wyłącznie naturalną, wciągającą opowieść historyczną.
- NIGDY nie wstawiaj znaczników [LINK:id] wewnątrz zdań ani w środku tekstu!
- Jeśli Twoja odpowiedź dotyczy danego zabytku, dopisz znacznik [LINK:dokładne_id] WYŁĄCZNIE jako niewidoczny kod na samym końcu całej wypowiedzi (po kropce kończącej ostatnie zdanie). Aplikacja sama utworzy pod Twoją wypowiedzią interaktywny przycisk.
- Jeśli wspominasz o kilku zabytkach, dopisz ich znaczniki na samym końcu (np. "...To wyjątkowe miejsca. [LINK:place_01][LINK:place_04]").
7. ZASADA PLANOWANIA TRASY: Jeśli turysta pyta o zaplanowanie trasy lub spaceru (np. "trasa na 2 godziny", "trasa na 1h", "zaplanuj wycieczkę", "jaki szlak"), zaproponuj kolejność zwiedzania i na samym końcu dopisz znacznik [ROUTE:id1,id2,id3] z identyfikatorami w kolejności marszu! (Np. [ROUTE:place_01,place_04,place_03,place_06]). Nie pisz "kliknij poniżej", przycisk pojawi się automatycznie.
Oto dostępne znaczniki:
${linksHelp}

${gpsSection}

PODSTAWOWE OBIEKTY Z APLIKACJI:
${placesContext}

SZCZEGÓŁOWA HISTORIA I UNIKALNE CIEKAWOSTKI (UŻYWAJ ICH W ODPOWIEDZIACH):

1. ZAMEK W KOŻUCHOWIE:
- Ukryta wieża (stołp): najstarsza część z XIV w., mury o grubości 2,6 m. W podziemiach był loch głodowy z otworem w suficie. W XVII w. zakonnicy obudowali ją nowym skrzydłem — stoi do dziś całkowicie schowana wewnątrz budynku!
- Przyszły król Polski: rezydował tu książę Zygmunt Jagiellończyk (późniejszy król Zygmunt I Stary), tworząc garnizon do tępienia rycerzy-rozbójników.
- Ocalał jako jedyny: w 1488 r. Jan II Szalony spalił całe miasto, przetrwał tylko potężny zamek.
- Konstrukcja: wzniesiony na sztucznym wzniesieniu i palach pośród bagiennych łąk. W XV w. dostał drugi obwód murów i basteje pod artylerie. Dziś w kształcie litery U (brak jednego skrzydła).
- Luteranizm: w 1516 r. Jan von Rechenberg z zamku wydał nakaz reformacji miasta.

2. ŚREDNIOWIECZNE MURY I FOSA:
- Ewenement europejski: niemal nienaruszony pełny pierścień kamienno-ceglany (~1000 m obwodu z XIV w.).
- Fosa: dawniej nawodniona, do 20 m szerokości i kilkunastu metrów głębokości.
- Baszty: 11 baszt łupinowych (otwartych od strony miasta). Ocalała Baszta Krośnieńska (Izba Regionalna) — przetrwała, bo w XIX w. zamieniono ją na mieszkania.
- Mury w domach: po pożarze w 1764 r. z kamieni z murów odbudowywano spalone kamienice.

3. KOŚCIÓŁ PW. MĘCZEŃSTWA ŚW. JANA CHRZCICIELA:
- XIII-wieczna świątynia z romańskimi ciosami kamiennymi.
- Ukryta flotylla na suficie: barokowe sklepienie ozdobione sztukateriami przedstawiającymi... żaglowce i okręty morskie (unikat śródlądowy)!
- "Głowa w murze": kamienna wczesnośredniowieczna głowa w ścianie prezbiterium (wg legendy: zamurowany murarz lub pogański bożek).
- Gotyckie portale i epitafia: w mury wkomponowano płyty nagrobne dawnych mieszczan i szlachty.

4. RYNEK, PODZIEMIA I RATUSZ:
- Średniowieczna szachownica: idealny układ ulic z XIII w. wywodzący się z osady plemienia Dziadoszan. W XV w. miasto biło własną monetę (halerze).
- Podziemne labirynty: wielokondygnacyjne gotyckie i renesansowe piwnice pod rynkiem i kamienicami do leżakowania kożuchowskiego piwa i obrony.
- Kamienica Rynek 1 ("Pod Złotą Koroną"): reprezentacyjny zajazd możnowładców z zachowanymi renesansowymi polichromiami.
- Zabytkowe podcienia: zadaszone korytarze kupieckie na parterach części kamienic.
- Ratusz "Frankenstein": 4 ściany z 4 różnych epok (od gotyckiej piwnicy i wieży po XIX-wieczny neoklasycyzm i powojenną rekonstrukcję).

5. LAPIDARIUM RZEŹBY NAGROBNEJ (ul. 1 Maja):
- Dawny cmentarz ewangelicki założony w XVII w. (1634 r.), jedna z najwspanialszych i najlepiej zachowanych nekropolii w Polsce.
- Prawie 200 płyt nagrobnych i epitafiów z XVI–XIX w. wmurowanych w mur cmentarny i kaplice.
- Bogata symbolika wanitatywna: klepsydry, czaszki, wizerunki śmierci (Chronos), zwożone epitafia szlacheckie i mieszczańskie.

6. BAROKOWY PORTYK I PARK MIEJSKI:
- Pozostałość rezydencji von Kalckreuthów z 1780 r. (pałac spłonął w 1945 r., rozebrany w l. 50., ocalał kunsztowny portyk).
- 4 filary zwieńczone gzymsem i podtrzymywane przez rzeźby 4 kamiennych herm.
- Pomnik Salomona Maimona – wybitnego filozofa oświeceniowego i kontynuatora Kanta.
- Wiekowe pomniki przyrody: platany, dęby, buki czerwonolistne i cisy w zespole parkowym.

7. ZABYTKOWA FASADA PRZY UL. KLASZTORNEJ:
- Samotna, ocalała fasada kamienicy z XVIII w. (budynek rozebrano w 1959 r.).
- Bogate płaskorzeźby stiukowe św. Piotra (z kluczami) i św. Pawła (z mieczem), muszlowe aureole i motywy fal chrzcielnych.

8. KOŚCIÓŁ PW. ŚW. DUCHA (ul. 1 Maja 34):
- Średniowieczna świątynia szpitalna ufundowana na przełomie XIII i XIV w. dla przytułku poza murami miejskimi.
- Jedyny zachowany zabytek dawnego szpitalnictwa w regionie, późnogotyckie sklepienie sieciowe i ozdobny szczyt z blendami.

9. WIEŻA KOŚCIOŁA EWANGELICKIEGO (Plac Ewangelicki):
- Ocalała wieża z 1826 r., relikt jednego z 6 śląskich Kościołów Łaski z lat 1709–1710 (ugoda altransztadzka).
- Sam szachulcowy kościół rozebrano w latach 60./70. XX w., ocalała monumentalna wieża.

10. WIEŻA CIŚNIEŃ (ul. Szprotawska):
- Zbudowana w 1908 r. w najwyższym punkcie miasta (ok. 112 m n.p.m.), ma prawie 39 m wysokości.
- Czerwona cegła klinkierowa w stylu neogotycko-secesyjnym, stalowy zbiornik typu Intze, płaskorzeźba z herbem miasta w portalu wejściowym.

Jeśli turysta zapyta o cokolwiek spoza Kożuchowa, uprzejmie przypomnij, że jesteś ekspertem wyłącznie od tego miasta.`;
}

/**
 * 3. Inteligentny lokalny silnik odpowiedzi awaryjnych (Offline Failsafe).
 * Uruchamia się w przypadku braku połączenia internetowego lub wyczerpania limitów API.
 * Gwarantuje, że turysta ZAWSZE otrzyma poprawną, merytoryczną odpowiedź przewodnika.
 *
 * @param {string} userText - Zapytanie turysty
 * @param {object|null} userLocation - Współrzędne GPS turysty
 * @returns {string} Precyzyjna odpowiedź przewodnika
 */
export function generateOfflineFallbackResponse(userText, userLocation) {
  if (!userText || !userText.trim()) {
    return 'W czym mogę Ci pomóc podczas zwiedzania Kożuchowa? Zapytaj o zamek, mury, lapidarium lub gdzie zjeść obiad!';
  }

  const query = userText.toLowerCase().trim();

  // 0. Pytania o planowanie trasy / szlak turystyczny / spacer
  if (
    query.includes('tras') ||
    query.includes('szlak') ||
    query.includes('spacer') ||
    query.includes('wycieczk') ||
    query.includes('plan')
  ) {
    if (
      query.includes('2') ||
      query.includes('dwie') ||
      query.includes('dwu') ||
      query.includes('dłuższa')
    ) {
      return 'Oto optymalna 2-godzinna trasa po Kożuchowie: Zamek Piastowski → Mury obronne i fosa → Baszta Krośnieńska → Lapidarium rzeźby nagrobnej → Barokowy portyk w Parku Miejskim → Rynek z Ratuszem. Poznasz najważniejsze militaria oraz unikalną architekturę nagrobną. [ROUTE:place_01,place_04,place_03,place_07,place_08,place_06]';
    }
    if (
      query.includes('1') ||
      query.includes('krótk') ||
      query.includes('szybki') ||
      query.includes('godzin')
    ) {
      return 'Na szybki 1-godzinny spacer polecam klasyczny szlak: Zamek Kożuchów → Mury obronne i fosa → Baszta Krośnieńska → Rynek z Ratuszem. To zwarta pętla ukazująca kluczowe symbole średniowiecznego miasta. [ROUTE:place_01,place_04,place_03,place_06]';
    }
    return 'Polecam sprawdzoną trasę spacerową po Kożuchowie (ok. 1.5h): Zamek Piastowski → Mury obronne → Baszta Krośnieńska → Zabytkowa fasada ul. Klasztornej → Rynek i Ratusz. [ROUTE:place_01,place_04,place_03,place_09,place_06]';
  }

  // 1. Pytania o gastronomię / restauracje
  if (
    query.includes('zje') ||
    query.includes('obiad') ||
    query.includes('pizza') ||
    query.includes('kebab') ||
    query.includes('restaurac') ||
    query.includes('kolacj') ||
    query.includes('kawiarn') ||
    query.includes('jedzen')
  ) {
    if (userLocation?.latitude && userLocation?.longitude) {
      const sortedFood = [...RESTAURANTS]
        .map((r) => ({
          ...r,
          dist: getDistanceMeters(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude),
        }))
        .sort((a, b) => a.dist - b.dist);

      const first = sortedFood[0];
      const second = sortedFood[1];
      return `Najbliżej na posiłek masz do: ${first.name} (${first.address}, ok. ${formatMeters(first.dist)} stąd). Serwuje: ${first.type}. Drugą opcją w pobliżu jest ${second.name} (${formatMeters(second.dist)}).`;
    }

    return 'W centrum Kożuchowa polecam Restaurację Rycerską oraz Pizzerię Ciao Ciao przy Rynku 19, a także Nasir Kebab & Burger przy ul. 22 Lipca 32. Wszystkie lokale znajdują się w odległości krótkiego spaceru od rynku.';
  }

  // 2. Pytania o Zamek / wieżę / lochy / Zygmunta Starego
  if (
    query.includes('zamek') ||
    query.includes('zamk') ||
    query.includes('stołp') ||
    query.includes('loch') ||
    query.includes('zygmunt')
  ) {
    return 'Zamek w Kożuchowie to XIII-wieczna piastowska warownia wybudowana na bagnach na drewnianych palach. Jego największą tajemnicą jest XIV-wieczna cylindryczna wieża (stołp) z lochami głodowymi, która w XVII wieku została całkowicie obudowana skrzydłem i stoi schowana wewnątrz obiektu! Rezydował tu królewicz Zygmunt Jagiellończyk. [LINK:place_01]';
  }

  // 3. Kościół parafialny / głowa w murze / żaglowce
  if (
    query.includes('gromniczn') ||
    query.includes('głow') ||
    query.includes('żaglow') ||
    query.includes('chrzciciel')
  ) {
    return 'Kościół pw. Matki Boskiej Gromnicznej to XIII-wieczna świątynia kryjąca dwie niezwykłe zagadki: kamienną wczesnośredniowieczną „Głowę w murze” w prezbiterium oraz barokowe sklepienie ozdobione sztukateriami przedstawiającymi morskie okręty żaglowe. [LINK:place_02]';
  }

  // 4. Mury obronne / fosa / fortyfikacje
  if (
    query.includes('mur') ||
    query.includes('fos') ||
    query.includes('fortyfikac') ||
    query.includes('bastej')
  ) {
    return 'Średniowieczne mury obronne w Kożuchowie z XIV wieku to unikat w skali europejskiej – zachowały niemal pełny pierścień kamienno-ceglany o obwodzie ponad 1000 metrów. Dawna, sucha fosa została przekształcona w zielony park spacerowy wzdłuż wałów obronnych. [LINK:place_04]';
  }

  // 5. Baszta Krośnieńska
  if (query.includes('krośnień')) {
    return 'Baszta Krośnieńska to jedyna ocalała wieża bramna spośród trzech niegdyś strzegących Kożuchowa, wzniesiona w XIV wieku o wysokości ponad 20 metrów. Przetrwała dzięki zaadaptowaniu jej w XIX wieku na mieszkania, a dziś mieści ekspozycję Izby Regionalnej. [LINK:place_03]';
  }

  // 6. Domek kata
  if (query.includes('kat') || query.includes('domek')) {
    return 'Domek kata to dawna średniowieczna baszta czatownicza wkomponowana w linię południowo-zachodnich murów. Według tradycji miejskiej zamieszkiwał ją miejski kat, który ze względu na swój zawód musiał rezydować na skraju grodu. [LINK:place_05]';
  }

  // 7. Rynek i Ratusz / piwnice
  if (
    query.includes('rynek') ||
    query.includes('ratusz') ||
    query.includes('piwnic') ||
    query.includes('piw')
  ) {
    return 'Kożuchowski Rynek posiada idealny XIII-wieczny szachownicowy układ ulic. W centrum stoi Ratusz łączący elementy gotyckie z neoklasycyzmem, a pod rynkiem i kamienicami rozciągają się wielokondygnacyjne piwnice, w których leżakowało dawne kożuchowskie piwo. [LINK:place_06]';
  }

  // 8. Lapidarium
  if (
    query.includes('lapidari') ||
    query.includes('nagrob') ||
    query.includes('cmentarz') ||
    query.includes('epitafi')
  ) {
    return 'Lapidarium rzeźby nagrobnej przy ul. 1 Maja to unikatowy w skali Polski XVII-wieczny dawny cmentarz ewangelicki z niemal 200 zabytkowymi płytami nagrobnymi z XVI–XIX w. Wyróżnia się kunsztowną symboliką wanitatywną (klepsydry, czaszki, Chronos). [LINK:place_07]';
  }

  // 9. Barokowy portyk i Park Miejski
  if (
    query.includes('portyk') ||
    query.includes('portal') ||
    query.includes('park') ||
    query.includes('maimon') ||
    query.includes('kalckreuth') ||
    query.includes('herm')
  ) {
    return 'Barokowy portyk filarowy w Parku Miejskim to ocalała część pałacu rodziny von Kalckreuth z 1780 roku z rzeźbami czterech herm. W otaczającym parku dworskim stoi pomnik filozofa Salomona Maimona oraz liczne wiekowe pomniki przyrody. [LINK:place_08]';
  }

  // 10. Zabytkowa fasada przy ul. Klasztornej
  if (
    query.includes('klasztorn') ||
    query.includes('fasad') ||
    query.includes('piotr') ||
    query.includes('paweł')
  ) {
    return 'Zabytkowa fasada przy ul. Klasztornej to XVIII-wieczna ściana frontowa dawnej kamienicy, ozdobiona pięknymi stiukowymi płaskorzeźbami św. Piotra z kluczami i św. Pawła z mieczem oraz muszlowymi aureolami. [LINK:place_09]';
  }

  // 11. Kościół pw. Św. Ducha
  if (
    query.includes('duch') ||
    query.includes('szpital') ||
    query.includes('sieciow')
  ) {
    return 'Kościół pw. Św. Ducha przy ul. 1 Maja to XIV-wieczna gotycka świątynia szpitalna – jedyny zachowany ślad średniowiecznego szpitalnictwa w regionie, kryjący późnogotyckie sklepienie sieciowe w prezbiterium. [LINK:place_10]';
  }

  // 12. Wieża kościoła ewangelickiego
  if (
    query.includes('ewangelick') ||
    query.includes('łask') ||
    query.includes('plac ewangelicki')
  ) {
    return 'Wieża kościoła ewangelickiego na Placu Ewangelickim z 1826 roku to pamiątka po dawnym ewangelickim Kościele Łaski z lat 1709–1710, wzniesionym po ugodzie altransztadzkiej. [LINK:place_11]';
  }

  // 13. Wieża ciśnień
  if (
    query.includes('ciśnień') ||
    query.includes('wodociąg') ||
    query.includes('intze')
  ) {
    return 'Kożuchowska wieża ciśnień z 1908 roku to 39-metrowy zabytek techniki wzniesiony na najwyższym wzgórzu miasta (112 m n.p.m.) w stylu neogotycko-secesyjnym ze stalowym zbiornikiem typu Intze. [LINK:place_12]';
  }

  // 14. Domyślna rekomendacja turystyczna
  return 'W Kożuchowie warto zobaczyć Zamek Piastowski, mury obronne z fosą, Lapidarium rzeźby nagrobnej, barokowy portyk w parku oraz zabytkowy Rynek. Zapytaj o dowolny z tych obiektów! [LINK:place_01][LINK:place_04][LINK:place_07][LINK:place_08][LINK:place_06]';
}