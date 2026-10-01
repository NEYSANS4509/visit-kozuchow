// src/components/CaptchaBox.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Komponent prostej weryfikacji antybotowej (matematyczna CAPTCHA).
 * Spełnia kryteria WCAG 2.1 AA:
 * - Minimalny rozmiar dotyku min. 48x48 dp dla przycisku odświeżenia
 * - Komunikaty o sukcesie/błędzie zdublowane ikoną i czytelnym tekstem
 * - Obsługa skalowania fontów i trybu wysokiego kontrastu.
 *
 * @param {Function} onVerified - Funkcja zwrotna informująca rodzica o stanie weryfikacji (boolean)
 */
export default function CaptchaBox({ onVerified }) {
  const { colors, highContrast, colorBlindMode, getScaledFontSize } = useAccessibility();

  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Losowanie nowych liczb do równania
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserInput('');
    setError(false);
    setIsSuccess(false);
    onVerified(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Weryfikacja poprawności wyniku wpisanego przez użytkownika
  const handleCheck = (text) => {
    setUserInput(text);
    const parsed = parseInt(text, 10);
    if (parsed === num1 + num2) {
      setIsSuccess(true);
      setError(false);
      onVerified(true);
    } else {
      setIsSuccess(false);
      if (text.length >= String(num1 + num2).length) {
        setError(true);
        onVerified(false);
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        highContrast && styles.highContrastContainer,
      ]}
      accessible={true}
      accessibilityRole="none"
    >
      <View style={styles.badgeRow}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.textDark} />
        <Text
          style={[
            styles.label,
            { color: colors.textDark, fontSize: getScaledFontSize(12) },
          ]}
          allowFontScaling={true}
        >
          Weryfikacja antybotowa (CAPTCHA)
        </Text>
      </View>

      <View style={styles.solveRow}>
        <View style={styles.mathEquationBox}>
          <Text
            style={[
              styles.mathText,
              { color: colors.textDark, fontSize: getScaledFontSize(16) },
            ]}
            allowFontScaling={true}
          >
            {num1} + {num2} = ?
          </Text>
        </View>

        <TextInput
          style={[
            styles.input,
            { color: colors.textDark, fontSize: getScaledFontSize(16) },
            isSuccess && styles.inputSuccess,
            error && styles.inputError,
            highContrast && styles.highContrastInput,
          ]}
          placeholder="Wynik"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          value={userInput}
          onChangeText={handleCheck}
          allowFontScaling={true}
          accessible={true}
          accessibilityLabel={`Pole na wynik dodawania: ${num1} plus ${num2}`}
        />

        {/* Przycisk losowania nowego zadania min. 48x48 dp */}
        <TouchableOpacity
          onPress={generateCaptcha}
          style={[styles.refreshBtn, highContrast && styles.highContrastButton]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Wylosuj nowe zadanie weryfikacyjne"
        >
          <Ionicons name="reload" size={20} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Komunikaty statusu ze zdublowanymi ikonami i tekstem dla daltonistów */}
      {isSuccess && (
        <View
          style={styles.statusMessageRow}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="Weryfikacja pomyślna. Możesz przejść dalej."
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={colorBlindMode ? '#0284C7' : '#16A34A'}
          />
          <Text
            style={[
              styles.successText,
              {
                color: colorBlindMode ? '#0284C7' : '#16A34A',
                fontSize: getScaledFontSize(12),
              },
            ]}
            allowFontScaling={true}
          >
            Weryfikacja pomyślna
          </Text>
        </View>
      )}

      {error && (
        <View
          style={styles.statusMessageRow}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="Błędny wynik. Spróbuj ponownie lub wylosuj nowe zadanie."
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={colorBlindMode ? '#C026D3' : '#DC2626'}
          />
          <Text
            style={[
              styles.errorText,
              {
                color: colorBlindMode ? '#C026D3' : '#DC2626',
                fontSize: getScaledFontSize(12),
              },
            ]}
            allowFontScaling={true}
          >
            Błędny wynik, spróbuj ponownie
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  highContrastContainer: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontWeight: '700',
  },
  solveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mathEquationBox: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mathText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
  highContrastInput: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  inputSuccess: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  // WCAG Touch target: min 48x48
  refreshBtn: {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highContrastButton: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  statusMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  successText: {
    fontWeight: '700',
  },
  errorText: {
    fontWeight: '700',
  },
});