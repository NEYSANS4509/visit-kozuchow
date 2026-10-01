// src/services/placesService.js
import { PLACES } from '../data/places';

/**
 * Stała reprezentująca brak filtrowania (wszystkie kategorie).
 * Używana w komponentach interfejsu użytkownika (np. filtrach i listach wyboru).
 */
export const ALL_CATEGORIES = 'Wszystkie';

/**
 * Czas symulowanego opóźnienia sieciowego w milisekundach.
 * Przydatny do testowania stanów ładowania (ActivityIndicator) w interfejsie użytkownika.
 */
const NETWORK_DELAY_MS = 100;

/**
 * Pomocnicza funkcja symulująca asynchroniczne zapytanie sieciowe (mock API).
 *
 * @param {*} data - Dane do zwrócenia po upływie zadanego czasu
 * @param {number} delay - Czas oczekiwania w milisekundach
 * @returns {Promise<*>}
 */
const mockFetch = (data, delay = NETWORK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay));

/**
 * Warstwa serwisowa (Wzorzec Repository) do obsługi bazy danych o zabytkach i salach ekspozycyjnych.
 */
export const placesService = {
  /**
   * Pobiera pełną kopię listy wszystkich głównych miejsc turystycznych.
   *
   * @returns {Promise<Array>} Lista obiektów historycznych
   */
  getAllPlaces: () => {
    return mockFetch([...PLACES]);
  },

  /**
   * Wyszukuje miejsce lub salę na podstawie odczytanego kodu QR.
   * Odporne na białe znaki oraz różnice w wielkości liter (case-insensitive).
   * Przeszukuje zarówno obiekty główne, jak i sale wewnętrzne (rooms).
   *
   * @param {string} rawQrCode - Surowa wartość odczytana z kamery lub skanera
   * @returns {Promise<Object|null>} Znaleziony obiekt lub null
   */
  getPlaceByQrCode: (rawQrCode) => {
    const sanitizedCode = rawQrCode?.trim().toLowerCase();

    if (!sanitizedCode) {
      return mockFetch(null);
    }

    // 1. Sprawdzenie głównych obiektów
    let foundPlace = PLACES.find(
      (item) => item.qrCode?.trim().toLowerCase() === sanitizedCode
    );

    // 2. Jeśli nie znaleziono na liście głównej, sprawdzenie sal wewnętrznych (rooms)
    if (!foundPlace) {
      for (const place of PLACES) {
        if (Array.isArray(place.rooms)) {
          const matchingRoom = place.rooms.find(
            (room) => room.qrCode?.trim().toLowerCase() === sanitizedCode
          );
          if (matchingRoom) {
            foundPlace = { ...matchingRoom, parentPlaceId: place.id };
            break;
          }
        }
      }
    }

    return mockFetch(foundPlace ? { ...foundPlace } : null);
  },

  /**
   * Pobiera szczegółowe dane miejsca lub sali na podstawie unikalnego ID.
   * Przeszukuje zarówno obiekty nadrzędne, jak i podrzędne ekspozycje.
   *
   * @param {string} id - Identyfikator rekordu (np. 'place_01' lub 'room_01')
   * @returns {Promise<Object|null>} Znaleziony rekord lub null
   */
  getPlaceById: (id) => {
    if (!id) return mockFetch(null);

    // 1. Sprawdzenie głównych obiektów
    let foundPlace = PLACES.find((item) => item.id === id);

    // 2. Sprawdzenie sal ekspozycyjnych
    if (!foundPlace) {
      for (const place of PLACES) {
        if (Array.isArray(place.rooms)) {
          const matchingRoom = place.rooms.find((room) => room.id === id);
          if (matchingRoom) {
            foundPlace = { ...matchingRoom, parentPlaceId: place.id };
            break;
          }
        }
      }
    }

    return mockFetch(foundPlace ? { ...foundPlace } : null);
  },

  /**
   * Zwraca obiekty przefiltrowane według wybranej kategorii tematycznej.
   *
   * @param {string} category - Nazwa wybranej kategorii lub stała ALL_CATEGORIES
   * @returns {Promise<Array>} Przefiltrowana lista obiektów
   */
  getPlacesByCategory: (category) => {
    if (!category || category === ALL_CATEGORIES) {
      return mockFetch([...PLACES]);
    }

    const filtered = PLACES.filter(
      (item) => item.category?.toLowerCase() === category.trim().toLowerCase()
    );

    return mockFetch([...filtered]);
  },
};