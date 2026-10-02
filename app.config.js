// app.config.js
// Dynamiczna konfiguracja Expo wstrzykująca poufne klucze API ze zmiennych środowiskowych (.env).
// Dzięki temu klucze API nie trafiają w postaci jawnego tekstu do repozytorium GitHub.

try {
  const { load } = require('@expo/env');
  load(process.cwd());
} catch (_e) {
  // Ciche przejście w środowisku produkcyjnym EAS, gdzie zmienne są już w procesie
}

module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
