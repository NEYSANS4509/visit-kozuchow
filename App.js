// App.js
// Główny komponent nawigacyjny aplikacji Visit Kożuchów.
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Kontekst językowy (i18n), dostępności cyfrowej (WCAG 2.1 AA) oraz ulubionych miejsc
import { LanguageProvider } from './src/context/LanguageContext';
import { AccessibilityProvider, useAccessibility } from './src/context/AccessibilityContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

// Import ekranów aplikacji
import WelcomeScreen from './src/screens/WelcomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import MapScreen from './src/screens/MapScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import CastleDetailScreen from './src/screens/CastleDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

/**
 * Wewnętrzny nawigator reagujący na dynamiczną zmianę motywu (jasny / ciemny) i kontrastu.
 */
function AppNavigator() {
  const { isDarkMode, colors } = useAccessibility();

  return (
    <>
      <StatusBar
        style={isDarkMode ? 'light' : 'dark'}
        backgroundColor={colors.backgroundLight}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.backgroundLight },
          }}
        >
          {/* Ekran powitalny / animowany splash */}
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ animation: 'fade' }}
          />

          {/* Główny katalog zabytków i rekomendacji */}
          <Stack.Screen
            name="Explore"
            component={ExploreScreen}
            options={{ animation: 'fade' }}
          />

          {/* Interaktywna mapa miasta z lokalizacją GPS */}
          <Stack.Screen
            name="Map"
            component={MapScreen}
          />

          {/* Skaner kodów QR przy zabytkach */}
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ animation: 'fade_from_bottom' }}
          />

          {/* Uniwersalna karta szczegółów zabytku lub sali */}
          <Stack.Screen
            name="CastleDetail"
            component={CastleDetailScreen}
          />

          {/* Ekran ustawień, motywu i ułatwień dostępu (WCAG 2.1 AA) */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

/**
 * Główny komponent aplikacji konfigurujący dostawców kontekstu.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <FavoritesProvider>
            <AppNavigator />
          </FavoritesProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}