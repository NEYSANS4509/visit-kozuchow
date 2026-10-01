// src/context/AccessibilityContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as defaultColors, darkColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@visit_kozuchow_theme';
const A11Y_STORAGE_KEY = '@visit_kozuchow_a11y';

/**
 * Kontekst dostępności cyfrowej (WCAG 2.1 AA) oraz personalizacji motywu dla całej aplikacji Visit Kożuchów.
 */
const AccessibilityContext = createContext(null);

/**
 * Paleta kolorów o podwyższonym kontraście dla trybu jasnego (WCAG AAA - kontrast tekstu >= 7:1 na jasnym tle).
 */
const HIGH_CONTRAST_COLORS = {
  ...defaultColors,
  primary: '#004B87', // Głęboki granat o kontraście > 7.5:1 na białym tle
  primaryLight: '#DCEBFA',
  primaryAccessible: '#002E54', // Kontrast > 10:1
  white: '#FFFFFF',
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
 * Paleta kolorów o podwyższonym kontraście dla trybu ciemnego (WCAG AAA).
 */
const DARK_HIGH_CONTRAST_COLORS = {
  ...darkColors,
  primary: '#67E8F9', // Jasny cyjan o maksymalnym kontraście na czerni
  primaryLight: '#164E63',
  primaryAccessible: '#67E8F9',
  white: '#0B0F19', // Głęboka czerń jako tło kart
  textPrimary: '#FFFFFF', // Czysta biel
  textSecondary: '#F1F5F9',
  textDark: '#FFFFFF',
  textMuted: '#E2E8F0',
  borderLight: '#FFFFFF', // Białe ostre krawędzie
  borderMuted: '#CBD5E1',
  surfaceMuted: '#1E293B',
  backgroundLight: '#000000', // Czerń absolutna tła
  danger: '#FCA5A5',
  dangerSoft: '#7F1D1D',
  dangerText: '#FEF2F2',
  highContrastBorder: '#FFFFFF',
};

/**
 * Paleta bezpieczna dla osób z zaburzeniami rozpoznawania barw w trybie jasnym (daltonizm: deuteranopia, protanopia, tritanopia).
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
 * Paleta bezpieczna dla osób z zaburzeniami rozpoznawania barw w trybie ciemnym.
 */
const DARK_COLOR_BLIND_COLORS = {
  ...darkColors,
  primary: '#38BDF8',
  primaryAccessible: '#38BDF8',
  success: '#38BDF8',
  warning: '#FBBF24',
  danger: '#E879F9',
  dangerSoft: '#4A044E',
  dangerText: '#F0ABFC',
};

/**
 * Dostawca kontekstu dostępności (AccessibilityProvider).
 * Umożliwia dynamiczne przełączanie:
 * 1. Motywu wyglądu (systemowy / jasny / ciemny)
 * 2. Trybu dla daltonistów
 * 3. Trybu wysokiego kontrastu (7:1 / WCAG AAA)
 * 4. Powiększonego tekstu (+25%)
 * 5. Trybu redukcji ruchu / spokojnych animacji (WCAG 2.1 - Kryterium 2.3.3)
 */
export function AccessibilityProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'system' | 'light' | 'dark'
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Wczytanie zapisanych preferencji motywu i ułatwień dostępu z pamięci urządzenia
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [savedTheme, savedA11y] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(A11Y_STORAGE_KEY),
        ]);
        if (isMounted && savedTheme && ['system', 'light', 'dark'].includes(savedTheme)) {
          setThemeModeState(savedTheme);
        }
        if (isMounted && savedA11y) {
          const parsed = JSON.parse(savedA11y);
          if (parsed.colorBlindMode !== undefined) setColorBlindMode(parsed.colorBlindMode);
          if (parsed.highContrast !== undefined) setHighContrast(parsed.highContrast);
          if (parsed.largeText !== undefined) setLargeText(parsed.largeText);
          if (parsed.reduceMotion !== undefined) setReduceMotion(parsed.reduceMotion);
        }
      } catch (_e) {
        // Cicha obsługa błędów odczytu pamięci
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Wyliczanie czy aktualnie aktywny jest tryb ciemny
  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Zmiana i trwałe zapisanie wybranego motywu
  const setThemeMode = async (mode) => {
    if (!['system', 'light', 'dark'].includes(mode)) return;
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (_e) {}
  };

  // Pomocniczy zapis stanu opcji dostępności
  const persistA11y = async (updated) => {
    try {
      await AsyncStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(updated));
    } catch (_e) {}
  };

  // Przełączniki poszczególnych opcji z utrwaleniem w pamięci
  const toggleColorBlindMode = () => {
    setColorBlindMode((prev) => {
      const next = !prev;
      persistA11y({ colorBlindMode: next, highContrast, largeText, reduceMotion });
      return next;
    });
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      persistA11y({ colorBlindMode, highContrast: next, largeText, reduceMotion });
      return next;
    });
  };

  const toggleLargeText = () => {
    setLargeText((prev) => {
      const next = !prev;
      persistA11y({ colorBlindMode, highContrast, largeText: next, reduceMotion });
      return next;
    });
  };

  const toggleReduceMotion = () => {
    setReduceMotion((prev) => {
      const next = !prev;
      persistA11y({ colorBlindMode, highContrast, largeText, reduceMotion: next });
      return next;
    });
  };

  // Resetowanie wszystkich ułatwień dostępu do wartości domyślnych
  const resetAccessibilitySettings = () => {
    setColorBlindMode(false);
    setHighContrast(false);
    setLargeText(false);
    setReduceMotion(false);
    persistA11y({ colorBlindMode: false, highContrast: false, largeText: false, reduceMotion: false });
  };

  // Mnożnik rozmiaru czcionki (1.0 = standard, 1.25 = powiększony o 25%)
  const fontScale = largeText ? 1.25 : 1.0;

  // Dynamicznie wyliczana paleta kolorów na podstawie aktywnego motywu i flag dostępności
  const activeColors = useMemo(() => {
    const basePalette = isDarkMode ? darkColors : defaultColors;

    if (highContrast) {
      const hcPalette = isDarkMode ? DARK_HIGH_CONTRAST_COLORS : HIGH_CONTRAST_COLORS;
      if (colorBlindMode) {
        return {
          ...hcPalette,
          success: '#38BDF8',
          warning: isDarkMode ? '#FBBF24' : '#B45309',
          danger: isDarkMode ? '#F0ABFC' : '#86198F',
        };
      }
      return hcPalette;
    }

    if (colorBlindMode) {
      return isDarkMode ? DARK_COLOR_BLIND_COLORS : COLOR_BLIND_COLORS;
    }

    return basePalette;
  }, [isDarkMode, highContrast, colorBlindMode]);

  /**
   * Pomocnicza funkcja przeliczająca rozmiar fontu z uwzględnieniem trybu większego tekstu.
   *
   * @param {number} baseSize - Bazowy rozmiar fontu w punktach
   * @returns {number} Przeliczony rozmiar
   */
  const getScaledFontSize = (baseSize) => Math.round(baseSize * fontScale);

  const value = useMemo(
    () => ({
      themeMode,
      isDarkMode,
      setThemeMode,
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
    [
      themeMode,
      isDarkMode,
      colorBlindMode,
      highContrast,
      largeText,
      reduceMotion,
      fontScale,
      activeColors,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Niestandardowy hook ułatwiający dostęp do opcji dostępności cyfrowej i motywu w dowolnym komponencie.
 *
 * @returns {object} Stan i metody kontekstu dostępności
 */
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      themeMode: 'system',
      isDarkMode: false,
      setThemeMode: () => {},
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
