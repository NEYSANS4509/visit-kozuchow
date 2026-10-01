// src/components/AudioGuideButton.js
import React, { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAccessibility } from '../context/AccessibilityContext';
import { useScale } from '../hooks/useScale';
import CalmPressable from './CalmPressable';

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

    // Priorytet: głos o wysokiej jakości (Enhanced/Premium) lub głos Siri
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
 * Posiada spokojny, hipnotyzujący puls oddechowy (Calm Breathing Animation) podczas mowy.
 *
 * @param {string} text - Tekst opisu do odczytania
 * @param {object} style - Opcjonalne style przycisku
 */
export default function AudioGuideButton({ text, style }) {
  const { scale } = useScale();
  const { colors, highContrast, reduceMotion } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Spokojna animacja pulsu oddechowego (okres 2.4 sekundy — bardzo łagodna i relaksująca)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animationLoop = null;

    if (isSpeaking && !reduceMotion) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animationLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      animationLoop?.stop?.();
    };
  }, [isSpeaking, reduceMotion]);

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
      rate: 0.87, // Spokojne tempo
      pitch: 0.98,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const btnSize = Math.max(48, Math.round(46 * scale));

  return (
    <CalmPressable
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
      <Animated.View
        style={[
          styles.button,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: isSpeaking ? colors.primary : colors.primaryLight,
            transform: [{ scale: pulseAnim }],
          },
          highContrast && styles.highContrastButton,
          style,
        ]}
      >
        <Ionicons
          name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
          size={22 * scale}
          color={isSpeaking ? colors.white : colors.primary}
        />
      </Animated.View>
    </CalmPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  highContrastButton: {
    borderWidth: 2,
    borderColor: '#000000',
  },
});