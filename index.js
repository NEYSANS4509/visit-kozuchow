// index.js
// Główny punkt wejściowy aplikacji Expo / React Native.
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent rejestruje główny komponent aplikacji (App) w AppRegistry.
// Zapewnia poprawne środowisko wykonawcze zarówno w aplikacji Expo Go,
// jak i w natywnych kompilacjach produkcyjnych (Android APK/AAB oraz iOS).
registerRootComponent(App);
