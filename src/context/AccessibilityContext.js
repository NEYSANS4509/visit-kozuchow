// src/context/AccessibilityContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { colors as defaultColors } from '../theme/colors';

/**
 * Kontekst dostępności cyfrowej (WCAG 2.1 AA) dla całej aplikacji Visit Kożuchów.
 */
const AccessibilityContext = createContext(null);

/**
 * Paleta kolorów o podwyższonym kontraście (WCAG AAA - kontrast tekstu >= 7:1 na jasnym tle).
 */
const HIGH_CONTRAST_COLORS = {
  ...defaultColors,
  primary: '#004B87', // Głęboki granat o kontraście > 7.5:1 na białym tle
  primaryLight: '#DCEBFA',
  primaryAccessible: '#002E54', // Kontrast > 10:1
  textPrimary: '#000000', // Czerń absolutna (kontrast 21:1)
  textSecondary: '#111827',
  textDark: '#000000',
  textMuted: '#1F2937',
  borderLight: '#000000', // Wyraźne czarne obramowania dla elementów interfejsu
  borderMuted: '#374151',
  surfaceMuted: '#CBD5E1',
  backgroundLight: '#FFFFFF',
  danger: '#991B1B', // Bardzo ciemna czerwień o wysokim kontraście
  dangerSoft: '#FEE2E2',
  dangerText: '#7F1D1D',
  highContrastBorder: '#000000',
};

/**
 * Paleta bezpieczna dla osób z zaburzeniami rozpoznawania barw (daltonizm: deuteranopia, protanopia, tritanopia).
 * Eliminuje pary czerwony-zielony jako jedyny nośnik informacji, stosując błękit, bursztyn i fiolet.
 */
const COLOR_BLIND_COLORS = {
  ...defaultColors,
  primary: '#0D6EFD', // Wyrazisty szafir
  primaryAccessible: '#0A58CA',
  success: '#0284C7', // Zastępuje zieleń wyrazistym błękitem lazurowym
  warning: '#D97706', // Ciepły bursztyn
  danger: '#C026D3', // Fuksja / purpura zamiast tradycyjnej czerwieni
  dangerSoft: '#FAE8FF',
  dangerText: '#86198F',
};

/**
 * Dostawca kontekstu dostępności (AccessibilityProvider).
 * Umożliwia dynamiczne przełączanie:
 * 1. Trybu dla daltonistów
 * 2. Trybu wysokiego kontrastu (7:1)
 * 3. Powiększonego tekstu (+25%)
 * 4. Trybu redukcji ruchu / spokojnych animacji (WCAG 2.1 - Kryterium 2.3.3)
 */
export function AccessibilityProvider({ children }) {
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Automatyczne wykrycie systemowych preferencji redukcji ruchu użytkownika
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted && enabled) {
          setReduceMotion(true);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) setReduceMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  // Przełączniki poszczególnych opcji
  const toggleColorBlindMode = () => setColorBlindMode((prev) => !prev);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleLargeText = () => setLargeText((prev) => !prev);
  const toggleReduceMotion = () => setReduceMotion((prev) => !prev);

  // Resetowanie wszystkich ułatwień dostępu do wartości domyślnych
  const resetAccessibilitySettings = () => {
    setColorBlindMode(false);
    setHighContrast(false);
    setLargeText(false);
    setReduceMotion(false);
  };

  // Mnożnik rozmiaru czcionki (1.0 = standard, 1.25 = powiększony o 25%)
  const fontScale = largeText ? 1.25 : 1.0;

  // Dynamicznie wyliczana paleta kolorów na podstawie aktywnych flag
  const activeColors = useMemo(() => {
    if (highContrast) {
      return {
        ...HIGH_CONTRAST_COLORS,
        ...(colorBlindMode
          ? {
              success: '#0284C7',
              warning: '#B45309',
              danger: '#86198F',
            }
          : {}),
      };
    }
    if (colorBlindMode) {
      return COLOR_BLIND_COLORS;
    }
    return defaultColors;
  }, [highContrast, colorBlindMode]);

  /**
   * Pomocnicza funkcja przeliczająca rozmiar fontu z uwzględnieniem trybu większego tekstu.
   *
   * @param {number} baseSize - Bazowy rozmiar fontu w punktach
   * @returns {number} Przeliczony rozmiar
   */
  const getScaledFontSize = (baseSize) => Math.round(baseSize * fontScale);

  const value = useMemo(
    () => ({
      colorBlindMode,
      highContrast,
      largeText,
      reduceMotion,
      fontScale,
      colors: activeColors,
      toggleColorBlindMode,
      toggleHighContrast,
      toggleLargeText,
      toggleReduceMotion,
      setColorBlindMode,
      setHighContrast,
      setLargeText,
      setReduceMotion,
      resetAccessibilitySettings,
      getScaledFontSize,
    }),
    [colorBlindMode, highContrast, largeText, reduceMotion, fontScale, activeColors]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Niestandardowy hook ułatwiający dostęp do opcji dostępności cyfrowej w dowolnym komponencie.
 *
 * @returns {object} Stan i metody kontekstu dostępności
 */
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      colorBlindMode: false,
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      fontScale: 1.0,
      colors: defaultColors,
      toggleColorBlindMode: () => {},
      toggleHighContrast: () => {},
      toggleLargeText: () => {},
      toggleReduceMotion: () => {},
      setColorBlindMode: () => {},
      setHighContrast: () => {},
      setLargeText: () => {},
      setReduceMotion: () => {},
      resetAccessibilitySettings: () => {},
      getScaledFontSize: (s) => s,
    };
  }
  return context;
}
