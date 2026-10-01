// src/components/PrimaryButton.js
import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Podstawowy przycisk akcji (Primary Button) w aplikacji.
 * Spełnia standardy WCAG 2.1 AA:
 * - Minimalny rozmiar dotyku min. 48x48 dp (Touch Target)
 * - Obsługuje stany ładowania (busy), zablokowania (disabled)
 * - Dynamiczne skalowanie tekstu (allowFontScaling={true}).
 *
 * @param {string} label - Tekst etykiety na przycisku
 * @param {Function} onPress - Funkcja zwrotna wywoływana po dotknięciu
 * @param {object} style - Dodatkowe style kontenera przycisku
 * @param {object} textStyle - Dodatkowe style tekstu przycisku
 * @param {boolean} loading - Czy wyświetlić wskaźnik ładowania zamiast tekstu
 * @param {boolean} disabled - Czy przycisk jest nieaktywny
 * @param {string} accessibilityLabel - Etykieta dla czytników ekranu (a11y)
 * @param {string} accessibilityHint - Podpowiedź akcji dla czytnika ekranu
 */
export default function PrimaryButton({
  label,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) {
  const { colors, highContrast, getScaledFontSize } = useAccessibility();
  const isBlocked = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        highContrast && styles.highContrastButton,
        style,
        isBlocked && { opacity: 0.65 },
      ]}
      activeOpacity={0.85}
      disabled={isBlocked}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: colors.white, fontSize: getScaledFontSize(16) },
            textStyle,
          ]}
          allowFontScaling={true}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
