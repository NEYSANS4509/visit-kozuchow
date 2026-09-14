// src/data/places.js

/**
 * Główna baza danych obiektów historycznych i turystycznych w Kożuchowie.
 * Wszystkie zasoby graficzne są ładowane lokalnie w formacie PNG.
 */
export const PLACES = [
  {
    id: 'place_01',
    qrCode: 'KZ-01-PLACE',
    title: 'Zamek Kożuchów',
    category: 'Zabytki',
    shortDescription:
      'Zabytkowy zamek wybudowany w XIII–XIV w. przez Piastów głogowsko-żagańskich.',
    fullDescription:
      'Zamek w Kożuchowie – zabytkowy zamek w Kożuchowie. Zamek wybudowany w XIII–XIV w. w miejscu starszego drewniano-ziemnego grodu przez Piastów głogowsko-żagańskich; położony w północno-zachodniej części Kożuchowa.',
    location: {
      latitude: 51.7458,
      longitude: 15.5947,
      address: 'Klasztorna',
    },
    openingHours: 'Całodobowo / 09:00 - 17:00',
    visitDurationMin: 30,

    // Główne zdjęcie zabytku
    imageUri: require('../../assets/places/zamek_main.png'),

    // Galeria 4 miniatur
    galleryImages: [
      require('../../assets/places/zamek1.png'),
      require('../../assets/places/zamek2.png'),
      require('../../assets/places/zamek3.png'),
      require('../../assets/places/zamek4.png'),
    ],

    audioGuideUrl: null,
    isWheelchairAccessible: true,
  },
  {
    id: 'place_02',
    qrCode: 'KZ-02-PLACE',
    title: 'Rynek miejski',
    category: 'Architektura',
    shortDescription: 'Zabytkowy rynek z ratuszem i kamienicami z różnych epok.',
    fullDescription:
      'Zabytkowy układ urbanistyczny rynku miejskiego w Kożuchowie z zachowanym czworobocznym planem i ratuszem.',
    location: {
      latitude: 51.748,
      longitude: 15.596,
      address: 'Rynek',
    },
    openingHours: 'Całodobowo',
    visitDurationMin: 45,

    // Tymczasowe użycie głównego zdjęcia zamku (.png)
    imageUri: require('../../assets/places/zamek_main.png'),
    galleryImages: [],
    audioGuideUrl: null,
    isWheelchairAccessible: false,
  },
];