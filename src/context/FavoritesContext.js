// src/context/FavoritesContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = '@visit_kozuchow_favorites_v1';

const FavoritesContext = createContext({
  favoriteIds: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  favoriteCount: 0,
});

/**
 * Kontekst zarządzania ulubionymi zabytkami i personalizowanym planem zwiedzania.
 * Zapewnia trwały zapis w pamięci lokalnej urządzenia (AsyncStorage offline).
 */
export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Wczytanie zapisanych ulubionych przy starcie aplikacji
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavoriteIds(parsed);
          }
        }
      } catch (_e) {
        // Cicha obsługa w przypadku braku lub uszkodzenia danych lokalnych
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sprawdzenie, czy dany obiekt znajduje się na liście ulubionych
  const isFavorite = useCallback(
    (placeId) => {
      if (!placeId) return false;
      return favoriteIds.includes(placeId);
    },
    [favoriteIds]
  );

  // Dodanie lub usunięcie obiektu z ulubionych z haptycznym potwierdzeniem
  const toggleFavorite = useCallback(
    async (placeId) => {
      if (!placeId) return;
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}

      setFavoriteIds((prev) => {
        const next = prev.includes(placeId)
          ? prev.filter((id) => id !== placeId)
          : [...prev, placeId];

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isFavorite,
        toggleFavorite,
        favoriteCount: favoriteIds.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Hook ułatwiający dostęp do kontekstu ulubionych zabytków.
 */
export function useFavorites() {
  return useContext(FavoritesContext);
}
