// src/context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pl from '../i18n/pl.json';
import en from '../i18n/en.json';
import de from '../i18n/de.json';

const STORAGE_KEY = '@visit_kozuchow_language';

const TRANSLATIONS = { pl, en, de };

const TTS_LOCALES = {
  pl: 'pl-PL',
  en: 'en-US',
  de: 'de-DE',
};

const LanguageContext = createContext(null);

/**
 * Dostawca kontekstu językowego (LanguageProvider).
 * Umożliwia dynamiczne przełączanie języków (Polski, Angielski, Niemiecki),
 * automatyczne tłumaczenie interfejsu (i18n), asystenta AI oraz lektora TTS.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('pl');
  const [isLoaded, setIsLoaded] = useState(false);

  // Wczytanie zapisanego języka z pamięci podręcznej AsyncStorage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && saved && ['pl', 'en', 'de'].includes(saved)) {
          setLanguageState(saved);
        }
      } catch (_e) {
        // Cicha obsługa błędu odczytu pamięci
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Zmiana i trwały zapis wybranego języka
  const setLanguage = useCallback(async (newLang) => {
    if (!['pl', 'en', 'de'].includes(newLang)) return;
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (_e) {
      // Ignorowanie błędu zapisu w trybie offline
    }
  }, []);

  /**
   * Główna funkcja translacyjna t(key, params).
   * Obsługuje ścieżki zagnieżdżone w formacie kropkowym (np. 'settings.languageSection').
   * W przypadku braku tłumaczenia automatycznie stosuje fallback do języka polskiego.
   *
   * @param {string} keyPath - Ścieżka klucza w formacie 'sekcja.podklucz'
   * @param {object} params - Opcjonalne parametry do podstawienia {{zmienna}}
   * @returns {string} Przetłumaczony tekst
   */
  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath) return '';

      const getNested = (obj, path) => {
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
      };

      const currentDictionary = TRANSLATIONS[language] || TRANSLATIONS.pl;
      let val = getNested(currentDictionary, keyPath);

      // Fallback do słownika polskiego, jeśli w wybranym języku brakuje klucza
      if (val === undefined && language !== 'pl') {
        val = getNested(TRANSLATIONS.pl, keyPath);
      }

      if (val === undefined) {
        return keyPath;
      }

      if (typeof val === 'string' && params && Object.keys(params).length > 0) {
        return Object.entries(params).reduce((str, [k, v]) => {
          return str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }, val);
      }

      return val;
    },
    [language]
  );

  /**
   * Tłumaczy dane pojedynczego zabytku na aktualnie wybrany język.
   * Podmienia tytuł, kategorię, opisy i ciekawostki z bazy tłumaczeń.
   *
   * @param {object} place - Obiekt zabytku z PLACES
   * @returns {object} Zabytek z przetłumaczonymi polami
   */
  const translatePlace = useCallback(
    (place) => {
      if (!place || !place.id) return place;

      const placeTranslations = TRANSLATIONS[language]?.places?.[place.id] || TRANSLATIONS.pl?.places?.[place.id];
      if (!placeTranslations) return place;

      return {
        ...place,
        title: placeTranslations.title || place.title,
        category: placeTranslations.category || place.category,
        shortDescription: placeTranslations.shortDescription || place.shortDescription,
        fullDescription: placeTranslations.fullDescription || place.fullDescription,
        funFact: placeTranslations.funFact || place.funFact,
        openingHours: placeTranslations.openingHours || place.openingHours,
      };
    },
    [language]
  );

  const ttsLocale = useMemo(() => TTS_LOCALES[language] || 'pl-PL', [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      translatePlace,
      ttsLocale,
      isLoaded,
    }),
    [language, setLanguage, t, translatePlace, ttsLocale, isLoaded]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Niestandardowy hook do łatwego korzystania z lokalizacji i18n w komponentach.
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
