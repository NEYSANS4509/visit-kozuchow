// src/components/FadeInView.js
import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Spokojny komponent pojawiania się elementów w interfejsie (Fade-In).
 *
 * Filozofia Calm Motion:
 * - Płynna zmiana samej przezroczystości (opacity: 0 -> 1) w ciągu 180 ms.
 * - Brak ruchu w przestrzeni (brak złudzenia lotu), dzięki czemu jest w 100% bezpieczny
 *   dla osób z zaburzeniami błędnika i chorobą lokomocyjną (kinetozą).
 * - Jeśli włączony jest tryb redukcji ruchu (reduceMotion): renderowanie natychmiastowe z pełną widocznością.
 *
 * @param {object} props - Właściwości (children, style, duration, delay)
 */
export default function FadeInView({
  children,
  style,
  duration = 180,
  delay = 0,
}) {
  const { reduceMotion } = useAccessibility();
  const opacityAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacityAnim.setValue(1);
      return;
    }

    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [reduceMotion, duration, delay]);

  return (
    <Animated.View style={[style, { opacity: opacityAnim }]}>
      {children}
    </Animated.View>
  );
}
