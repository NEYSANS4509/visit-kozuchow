// src/components/AudioGuideButton.js
import React, { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAccessibility } from '../context/AccessibilityContext';
import { useScale } from '../hooks/useScale';

/**
 * Rozwija typowe polskie skróty historyczne i językowe,
 * aby syntezator mowy (Text-to-Speech) czytał płynnie i nie zatrzymywał się na kropkach.
 *
 * @param {string} rawText - Tekst wejściowy ze skrótami
 * @returns {string} Znormalizowany tekst z pełnymi wyrazami
 */
const normalizeTextForSpeech = (rawText) => {
  if (!rawText) return '';

  return rawText
    .replace(/\bpw\.\s*/gi, 'pod wezwaniem ')
    .replace(/\bNMP\b/g, 'Najświętszej Maryi Panny')
    .replace(/(\d+)\s*r\./gi, '$1 roku')
    .replace(/(\d+)\s*w\./gi, '$1 wieku')
    .replace(/\bnp\.\s*/gi, 'na przykład ')
    .replace(/\btzw\.\s*/gi, 'tak zwany ')
    .replace(/\bok\.\s*/gi, 'około ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Wyszukuje najlepszy dostępny polski głos w systemie (np. Enhanced, Premium lub Siri).
 *
 * @returns {Promise<string|null>} Identyfikator głosu lub null
 */
const getBestPolishVoice = async () => {
  try {
    const availableVoices = await Speech.getAvailableVoicesAsync();
    const polishVoices = availableVoices.filter((v) =>
      v.language?.toLowerCase().startsWith('pl')
    );

    if (polishVoices.length === 0) return null;

    // 1. Priorytet: głos o wysokiej jakości (Enhanced/Premium) lub głos Siri
    const highQualityVoice = polishVoices.find((v) => {
      const q = String(v.quality || '').toLowerCase();
      const n = String(v.name || '').toLowerCase();
      return q === 'enhanced' || q === 'premium' || n.includes('siri') || n.includes('enhanced');
    });

    return highQualityVoice?.identifier || polishVoices[0].identifier;
  } catch {
    return null;
  }
};

/**
 * Przycisk audioprzewodnika odtwarzający opis obiektu za pomocą syntezy mowy (expo-speech).
 * Spełnia standardy WCAG 2.1 AA:
 * - Rozmiar dotyku min. 48x48 dp (Touch Target)
 * - Czytelne etykiety dla czytników ekranu (TalkBack / VoiceOver)
 * - Obsługa trybu wysokiego kontrastu.
 *
 * @param {string} text - Tekst opisu do odczytania
 * @param {object} style - Opcjonalne style przycisku
 */
export default function AudioGuideButton({ text, style }) {
  const { scale } = useScale();
  const { colors, highContrast } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleToggleSpeech = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    if (!text) return;

    const cleanedText = normalizeTextForSpeech(text);
    const bestVoiceId = await getBestPolishVoice();

    setIsSpeaking(true);

    Speech.speak(cleanedText, {
      language: 'pl-PL',
      voice: bestVoiceId || undefined,
      rate: 0.87, // Optymalna prędkość: spokojny, zrozumiały lektor
      pitch: 0.98, // Naturalna barwa głosu
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const btnSize = Math.max(48, Math.round(44 * scale));

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: btnSize,
          height: btnSize,
          minWidth: 48,
          minHeight: 48,
          borderRadius: btnSize / 2,
          backgroundColor: isSpeaking ? colors.primary : colors.primaryLight,
        },
        highContrast && styles.highContrastButton,
        style,
      ]}
      activeOpacity={0.8}
      onPress={handleToggleSpeech}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={
        isSpeaking
          ? 'Zatrzymaj odczytywanie audioprzewodnika'
          : 'Odsłuchaj audioprzewodnik (czytanie na głos)'
      }
      accessibilityHint="Uruchamia lub zatrzymuje syntezator mowy z opisem obiektu"
      accessibilityState={{ busy: isSpeaking }}
    >
      <Ionicons
        name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
        size={22 * scale}
        color={isSpeaking ? colors.white : colors.primary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  highContrastButton: {
    borderWidth: 2,
    borderColor: '#000000',
  },
});