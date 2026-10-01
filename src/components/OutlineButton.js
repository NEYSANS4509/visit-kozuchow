// src/components/OutlineButton.js
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Przycisk konturowy (Outline Button) do akcji drugorzędnych.
 * Spełnia kryteria WCAG 2.1 AA:
 * - Minimalny rozmiar dotyku min. 48x48 dp
 * - Wsparcie dla czytników ekranu i skalowania fontów.
 *
 * @param {string} label - Tekst etykiety na przycisku
 * @param {Function} onPress - Funkcja zwrotna wywoływana po dotknięciu
 * @param {object} style - Dodatkowe style kontenera przycisku
 * @param {object} textStyle - Dodatkowe style tekstu przycisku
 * @param {boolean} disabled - Czy przycisk jest nieaktywny
 * @param {string} accessibilityLabel - Etykieta dla czytników ekranu (a11y)
 * @param {string} accessibilityHint - Podpowiedź akcji dla czytnika ekranu
 */
export default function OutlineButton({
  label,
  onPress,
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) {
  const { colors, highContrast, getScaledFontSize } = useAccessibility();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderColor: colors.primary },
        highContrast && styles.highContrastButton,
        style,
        disabled && { opacity: 0.6 },
      ]}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          styles.text,
          { color: colors.primary, fontSize: getScaledFontSize(15) },
          textStyle,
        ]}
        allowFontScaling={true}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  highContrastButton: {
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
