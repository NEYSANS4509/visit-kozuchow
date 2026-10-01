// src/hooks/useScale.js
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Bazowa szerokość ekranu makiety w Figma (w punktach logicznych).
 * Wszystkie wymiary są proporcjonalnie skalowane względem tej wartości.
 */
const FIGMA_WIDTH = 390;

/**
 * Hook obliczający współczynnik skalowania interfejsu na podstawie bieżącej szerokości ekranu.
 *
 * @returns {{ scale: number, windowWidth: number, windowHeight: number }}
 * - scale: współczynnik proporcji (np. 1.0 dla 390px, >1 dla tabletów)
 * - windowWidth: aktualna szerokość okna
 * - windowHeight: aktualna wysokość okna
 */
export function useScale() {
  const { width, height } = useWindowDimensions();
  const scale = width / FIGMA_WIDTH;

  return { scale, windowWidth: width, windowHeight: height };
}

/**
 * Hook generujący i memoizujący dynamiczne style ze skalowaniem.
 * Przelicza style tylko w przypadku zmiany wymiarów ekranu lub funkcji fabryki.
 *
 * @param {Function} createStyles - Funkcja tworząca arkusz stylów przyjmująca (scale, windowHeight)
 * @returns {{ scale: number, styles: object, windowWidth: number, windowHeight: number }}
 */
export function useScaledStyles(createStyles) {
  const { scale, windowWidth, windowHeight } = useScale();
  const styles = useMemo(
    () => createStyles(scale, windowHeight),
    [scale, windowHeight, createStyles]
  );

  return { scale, styles, windowWidth, windowHeight };
}
