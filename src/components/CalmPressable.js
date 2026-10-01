// src/components/CalmPressable.js
import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Komponent dotykowy z bezpiecznym dla błędnika mikro-odklikiem dotykowym (Calm Pressable).
 *
 * Filozofia Universal Motion Design (WCAG 2.1 - Kryterium 2.3.3):
 * - Na naciśnięcie: delikatne, fizyczne ugięcie o zaledwie ~2.8% (scale: 0.972) bez przemieszczania w osiach X/Y.
 * - Na zwolnienie: miękki powrót do skali 1.0 za pomocą łagodnej sprężyny.
 * - Jeśli włączony jest tryb redukcji ruchu (reduceMotion): animacja natychmiastowo wyłączona (skala 1.0).
 * - Zachowuje pełną dostępność, minimalną strefę dotyku >= 48x48 dp i natywne wsparcie czytników ekranu.
 *
 * @param {object} props - Właściwości komponentu (onPress, style, children, hitSlop, itp.)
 */
export default function CalmPressable({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  disabled = false,
  targetScale = 0.972,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
  accessible = true,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}) {
  const { reduceMotion } = useAccessibility();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event) => {
    if (!disabled && !reduceMotion) {
      Animated.timing(scaleAnim, {
        toValue: targetScale,
        duration: 90,
        useNativeDriver: true,
      }).start();
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    if (!disabled && !reduceMotion) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }).start();
    }
    onPressOut?.(event);
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      testID={testID}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            style,
            !reduceMotion && {
              transform: [{ scale: scaleAnim }],
            },
            disabled && { opacity: 0.5 },
          ]}
        >
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
