// src/utils/imageSource.js

/**
 * Normalizuje źródło obrazu dla komponentu Image w React Native.
 * Obsługuje zarówno lokalne zasoby (wymóg require), jak i zewnętrzne adresy URL (string).
 *
 * @param {string|number|object|null} source - Źródło obrazu (ścieżka require, URL string lub obiekt { uri })
 * @returns {object|number|null} Poprawny obiekt źródła dla komponentu <Image source={...} />
 */
export function getImageSource(source) {
  if (!source) {
    return null;
  }

  return typeof source === 'string' ? { uri: source } : source;
}
