// src/theme/colors.js
// Spójny system barw aplikacji oparty na specyfikacji z Figmy
export const colors = {
  // Główne kolory marki i akcenty
  primary: '#408DD4',        // Główny błękit (przyciski CTA, aktywne stany)
  primaryLight: '#EBF3FA',   // Jasny błękit dla tła elementów podrzędnych
  white: '#FFFFFF',          // Czysta biel tła oraz obramowań miniatur

  // Typografia i treść
  textPrimary: '#323232',    // Główny kolor nagłówków i treści opisów (Figma: #323232)
  textSecondary: '#636363',  // Wyciszony kolor pomocniczy (adresy, pinezki, Figma: #636363)
  textDark: '#1E293B',       // Ciemny kolor dla elementów nawigacyjnych
  textMuted: '#64748B',      // Szary kolor placeholderów i podtytułów

  // Obramowania i separatory
  borderLight: '#E9E9E9',    // Subtelna ramka przycisku Start (Figma: #E9E9E9)
  borderMuted: '#AFAFAF',    // Ramka przycisku ulubionych (Figma: #AFAFAF)
  inputBorder: '#99C5EE',    // Dolna linia pól wprowadzania tekstu

  // Tła pomocnicze i stany
  surfaceMuted: '#E2E8F0',   // Szary placeholder pod ładowane grafiki
  backgroundLight: '#F8FAFC',// Tło widoków pomocniczych (np. DevHub)
  danger: '#EF4444',         // Kolor błędu oraz aktywnego serca
};