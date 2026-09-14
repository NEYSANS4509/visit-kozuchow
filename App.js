// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importy widoków
import WelcomeScreen from './src/screens/WelcomeScreen'; // Ekran powitalny[cite: 7]
import AuthScreen from './src/screens/AuthScreen';       // Ekran logowania/rejestracji[cite: 7, 10]
import DevHubScreen from './src/screens/DevHubScreen';   // Hub do swobodnego testowania ekranów
import CastleDetailScreen from './src/screens/CastleDetailScreen'; // Nowy ekran Zamku

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {/* 1. Ekran startowy */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* 2. Menu wyboru widoków (Dev Hub) */}
        <Stack.Screen name="DevHub" component={DevHubScreen} />

        {/* 3. Karta Zamku Kożuchów */}
        <Stack.Screen name="CastleDetail" component={CastleDetailScreen} />

        {/* 4. Ekran rejestracji / logowania */}
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
