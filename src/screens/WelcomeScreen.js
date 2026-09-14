import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../theme/colors';


export default function WelcomeScreen({ navigation }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scale = windowWidth / 390;

  const styles = useMemo(
    () => createStyles(scale, windowHeight),
    [scale, windowHeight]
  );

  // Wartości referencyjne dla animacji
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Płynne wejście karty (fade-in oraz przesunięcie z dołu)
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Zapętlona animacja lewitacji logo w osi Y
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cardOpacity, cardTranslateY, floatAnim]);

  return (
    <View style={styles.container}>
      {/* Elementy tła: górna i dolna grafika */}
      <Image
        source={require('../../assets/fly.png')}
        style={styles.earthTop}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/fly.png')}
        style={styles.earthBottom}
        resizeMode="contain"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Główna karta z animacją pojawiania się */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Kontener z lewitującym logo */}
          <View style={styles.logoWrapper}>
            <Animated.Image
              source={require('../../assets/logo.png')}
              style={[
                styles.logo,
                {
                  transform: [{ translateY: floatAnim }],
                },
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Główny przycisk nawigacji */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DevHub')}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (scale, windowHeight) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      position: 'relative',
      overflow: 'hidden',
    },
    // Górna grafika tła (Figma: ion:earth)
    earthTop: {
      position: 'absolute',
      width: 441 * scale,
      height: 387 * scale,
      top: -125 * scale,
      left: 201 * scale,
      tintColor: '#FFFFFF',
      opacity: 0.18,
      zIndex: 0,
    },
    // Dolna grafika tła
    earthBottom: {
      position: 'absolute',
      width: 441 * scale,
      height: 387 * scale,
      bottom: -100 * scale,
      left: -100 * scale,
      tintColor: '#FFFFFF',
      opacity: 0.18,
      zIndex: 0,
    },
    safeArea: {
      flex: 1,
      alignItems: 'center',
      zIndex: 1,
    },
    // Główna biała karta
    card: {
      width: 342 * scale,
      height: Math.min(609 * scale, windowHeight * 0.78),
      marginTop: 35 * scale,
      backgroundColor: colors.white,
      borderRadius: 24 * scale,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 24 * scale,
      paddingHorizontal: 16 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 * scale },
      shadowOpacity: 0.12,
      shadowRadius: 20 * scale,
      elevation: 8,
    },
    logoWrapper: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 334 * scale,
      height: 362 * scale,
    },
    startButton: {
      width: 300 * scale,
      height: 50 * scale,
      backgroundColor: colors.primary,
      borderRadius: 25 * scale,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8 * scale,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 * scale },
      shadowOpacity: 0.3,
      shadowRadius: 8 * scale,
      elevation: 4,
    },
    startButtonText: {
      color: colors.white,
      fontSize: 18 * scale,
      fontWeight: '700',
      letterSpacing: 0.5 * scale,
    },
  });