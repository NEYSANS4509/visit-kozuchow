// src/screens/WelcomeScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableWithoutFeedback,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScaledStyles } from '../hooks/useScale';

/**
 * Ekran powitalny (splash screen) aplikacji Visit Kożuchów.
 * Prezentuje animowaną sekwencję wejścia logo i automatycznie przekierowuje do katalogu 'Explore'.
 * Obsługuje wytyczne WCAG 2.3.3 (Reduce Motion) dla osób z nadwrażliwością na ruch.
 *
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function WelcomeScreen({ navigation }) {
  const { scale, styles } = useScaledStyles(createStyles);

  // Wartości animacji wyjścia całego ekranu
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Wartości animacji górnego elementu (1.png - pineska z zamkiem)
  const pinOpacity = useRef(new Animated.Value(0)).current;
  const pinTranslateY = useRef(new Animated.Value(-30)).current;
  const pinScale = useRef(new Animated.Value(0.85)).current;

  // Wartości animacji dolnego elementu (2.png - napis Visit Kożuchów)
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(25)).current;

  // Płynne przejście do głównej części aplikacji
  const proceedToApp = () => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      navigation.replace('Explore');
    });
  };

  useEffect(() => {
    let isMounted = true;
    let exitTimer = null;

    // WCAG 2.3.3: Sprawdzanie systemowego ograniczenia ruchu
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) return;

      if (reduceMotion) {
        // Natychmiastowe wyświetlenie obu grafik bez ruchu
        pinOpacity.setValue(1);
        pinTranslateY.setValue(0);
        pinScale.setValue(1);
        textOpacity.setValue(1);
        textTranslateY.setValue(0);
        exitTimer = setTimeout(proceedToApp, 1600);
      } else {
        // Płynna sekwencja kaskadowa: najpierw pineska, chwilę po niej napis
        Animated.sequence([
          // 1. Wejście pineski (górna grafika)
          Animated.parallel([
            Animated.timing(pinOpacity, {
              toValue: 1,
              duration: 550,
              useNativeDriver: true,
            }),
            Animated.spring(pinTranslateY, {
              toValue: 0,
              friction: 6,
              tension: 45,
              useNativeDriver: true,
            }),
            Animated.spring(pinScale, {
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
          ]),
          // 2. Wejście napisu z dołu (dolna grafika)
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.spring(textTranslateY, {
              toValue: 0,
              friction: 7,
              tension: 50,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // 3. Krótka pauza na zapoznanie się z ekranem i płynne przejście
          if (isMounted) {
            exitTimer = setTimeout(proceedToApp, 1400);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={proceedToApp} accessible={false}>
      <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0D6EFD" translucent />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.logoGroup}>
            {/* 1.png: Górna grafika z ilustracją zamku / pineską */}
            <Animated.Image
              source={require('../../assets/1.png')}
              style={[
                styles.pinImage,
                {
                  opacity: pinOpacity,
                  transform: [{ translateY: pinTranslateY }, { scale: pinScale }],
                },
              ]}
              resizeMode="contain"
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel="Ilustracja Zamku w Kożuchowie"
            />

            {/* 2.png: Dolna grafika z typografią Visit Kożuchów */}
            <Animated.Image
              source={require('../../assets/2.png')}
              style={[
                styles.textImage,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
              resizeMode="contain"
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel="Visit Kożuchów"
            />
          </View>

          {/* Podpis informujący o wersji testowej */}
          <Animated.View
            style={[styles.disclaimerContainer, { opacity: textOpacity }]}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Wersja testowa aplikacji. Funkcje oraz treści mogą ulec zmianie."
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>WERSJA TESTOWA</Text>
            </View>
            <Text style={styles.disclaimerText}>
              Aplikacja w fazie rozwoju — funkcje oraz treści mogą ulec zmianie.
            </Text>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D6EFD',
      justifyContent: 'center',
      alignItems: 'center',
    },
    safeArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    logoGroup: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinImage: {
      width: 175 * scale,
      height: 195 * scale,
      marginBottom: -12 * scale,
    },
    textImage: {
      width: 250 * scale,
      height: 110 * scale,
    },
    disclaimerContainer: {
      position: 'absolute',
      bottom: 24 * scale,
      left: 20 * scale,
      right: 20 * scale,
      alignItems: 'center',
    },
    badge: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderWidth: 1,
      paddingHorizontal: 10 * scale,
      paddingVertical: 3 * scale,
      borderRadius: 10 * scale,
      marginBottom: 6 * scale,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10 * scale,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    disclaimerText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11 * scale,
      lineHeight: 15 * scale,
      textAlign: 'center',
      fontWeight: '500',
    },
  });