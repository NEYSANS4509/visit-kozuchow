// src/services/placesService.js
import { PLACES } from '../data/places';

/**
 * Stała reprezentująca brak filtrowania (wszystkie kategorie).
 * Należy jej używać również w komponentach interfejsu użytkownika (np. w filtrach).
 */
export const ALL_CATEGORIES = 'Wszystkie';

/**
 * Czas symulowanego opóźnienia sieciowego w milisekundach.
 * Przydatny do testowania stanów ładowania (ActivityIndicator) w UI.
 */
const NETWORK_DELAY_MS = 100;

/**
 * Pomocnicza funkcja symulująca asynchroniczne zapytanie sieciowe.
 * @param {*} data - Dane do zwrócenia
 * @param {number} delay - Czas oczekiwania w ms
 * @returns {Promise<*>}
 */
const mockFetch = (data, delay = NETWORK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay));

/**
 * Warstwa serwisowa (Wzorzec Repository) do obsługi danych o lokacjach.
 */
export const placesService = {
  /**
   * Pobiera pełną kopię listy wszystkich miejsc.
   * @returns {Promise<Array>}
   */
  getAllPlaces: () => {
    return mockFetch([...PLACES]);
  },

  /**
   * Wyszukuje miejsce po kodzie z QR-skanera.
   * Odporne na spacje oraz różnice w wielkości liter (case-insensitive).
   * @param {string} rawQrCode - Surowa wartość z kamery
   * @returns {Promise<Object|null>}
   */
  getPlaceByQrCode: (rawQrCode) => {
    const sanitizedCode = rawQrCode?.trim().toLowerCase();

    if (!sanitizedCode) {
      return mockFetch(null);
    }

    const foundPlace = PLACES.find(
      (item) => item.qrCode?.trim().toLowerCase() === sanitizedCode
    );

    return mockFetch(foundPlace ? { ...foundPlace } : null);
  },

  /**
   * Pobiera szczegółowe dane miejsca na podstawie unikalnego ID.
   * @param {string} id - Identyfikator rekordu
   * @returns {Promise<Object|null>}
   */
  getPlaceById: (id) => {
    const foundPlace = PLACES.find((item) => item.id === id);
    return mockFetch(foundPlace ? { ...foundPlace } : null);
  },

  /**
   * Zwraca miejsca przefiltrowane według kategorii.
   * @param {string} category - Wybrana kategoria lub ALL_CATEGORIES
   * @returns {Promise<Array>}
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