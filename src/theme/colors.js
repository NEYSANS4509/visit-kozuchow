// src/theme/colors.js
/**
 * Główna paleta kolorystyczna aplikacji Visit Kożuchów (Tryb Jasny).
 * Zawiera kolory podstawowe, odcienie tekstu, tła oraz barwy stanu (WCAG 2.1 AA).
 */
export const colors = {
  primary: '#408DD4',
  primaryLight: '#EBF3FA',
  primaryAccessible: '#1A66A8', // Kontrast > 5.2:1 na jasnym tle (spełnia wytyczne WCAG AA)
  white: '#FFFFFF',

  textPrimary: '#1C1C1E',
  textSecondary: '#4B5563',
  textDark: '#1E293B',
  textMuted: '#64748B',

  borderLight: '#E9E9E9',
  borderMuted: '#AFAFAF',
  surfaceMuted: '#E2E8F0',
  backgroundLight: '#F8FAFC',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  dangerText: '#DC2626',
};

/**
 * Nowoczesna paleta kolorystyczna dla trybu ciemnego (Dark Mode).
 * Zapewnia doskonałą czytelność (WCAG 2.1 AA), redukuje zmęczenie wzroku
 * oraz nadaje aplikacji elegancki, stonowany wygląd.
 */
export const darkColors = {
  primary: '#38BDF8', // Sky-400: świeży, wyrazisty błękit o doskonałej widoczności
  primaryLight: '#0F2847', // Głębokie podświetlenie aktywnego elementu
  primaryAccessible: '#38BDF8',
  white: '#1E293B', // Slate-800: wyniesione tło kart, modalnych okien i nawigacji

  textPrimary: '#F1F5F9', // Slate-100: wysoki kontrast tekstu
  textSecondary: '#94A3B8', // Slate-400: elegancki tekst pomocniczy
  textDark: '#FFFFFF', // Czysta biel dla nagłówków
  textMuted: '#64748B', // Slate-500: dyskretne podpisy

  borderLight: '#334155', // Slate-700: subtelne linie oddzielające i obramowania
  borderMuted: '#475569', // Slate-600: krawędzie elementów
  surfaceMuted: '#0F172A', // Slate-900: tło podrzędnych paneli
  backgroundLight: '#0B0F19', // Głębokie, aksamitne tło ekranu
  danger: '#F87171',
  dangerSoft: '#450A0A',
  dangerText: '#FCA5A5',
};