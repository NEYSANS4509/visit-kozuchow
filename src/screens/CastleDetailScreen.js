// src/screens/CastleDetailScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { placesService } from '../services/placesService'; // Odczyt danych z lokalnego serwisu
import { colors } from '../theme/colors'; // Wspólna paleta barw z Figmy

export default function CastleDetailScreen({ route, navigation }) {
  // Identyfikator miejsca (domyślnie Zamek: place_01)
  const placeId = route?.params?.placeId || 'place_01';

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Stan aktualnie wyświetlanego zdjęcia głównego (pozwala na podgląd po kliknięciu miniatury)
  const [activeImage, setActiveImage] = useState(null);

  // Dynamiczne skalowanie pikseli względem szerokości bazowej z Figmy (390px)
  const { width: windowWidth } = useWindowDimensions();
  const scale = windowWidth / 390;
  const styles = useMemo(() => createStyles(scale), [scale]);

  // Pomocnicza funkcja: obsługa zasobów require() oraz adresów URL
  const getImageSource = (source) => {
    if (!source) return null;
    return typeof source === 'string' ? { uri: source } : source;
  };

  useEffect(() => {
    let isMounted = true;

    placesService
      .getPlaceById(placeId)
      .then((data) => {
        if (isMounted) {
          setPlace(data);
          // Ustawienie domyślnego zdjęcia głównego zaraz po pobraniu danych
          setActiveImage(data?.imageUri);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlace(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [placeId]);

  // 1. Ekran ładowania (spinner)
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 2. Obsługa błędu, gdy obiekt nie został odnaleziony w bazie
  if (!place) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={56 * scale} color={colors.danger} />
        <Text style={styles.errorTitle}>Nie znaleziono obiektu</Text>
        <Text style={styles.errorMessage}>
          Wskazany identyfikator zabytku nie figuruje w lokalnej bazie danych.
        </Text>
        <TouchableOpacity
          style={styles.errorBackButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18 * scale} color={colors.white} />
          <Text style={styles.errorBackButtonText}>Wróć do menu</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 3. Widok właściwy obiektu
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Kontener zdjęcia głównego zabytku (Figma: wysokość bazowa 453px) */}
        <View style={styles.imageContainer}>
          {/* Wyświetla aktualnie wybrane zdjęcie (domyślne lub klikniętą miniaturę) */}
          <Image
            source={getImageSource(activeImage || place.imageUri)}
            style={styles.mainCastleImage}
            resizeMode="cover"
          />

          {/* Przycisk powrotu w lewym górnym rogu (Figma: 49 x 25px) */}
          <TouchableOpacity
            style={styles.backButtonPill}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18 * scale} color={colors.textDark} />
          </TouchableOpacity>

          {/* Grupa miniatur (Figma Group 48: Top 385px, Left 67px) */}
          <View style={styles.thumbnailsGroup}>
            {place.galleryImages?.map((imgSource, index) => {
              const isSelected = activeImage === imgSource;

              return (
                <TouchableOpacity
                  key={`${place.id}_thumb_${index}`}
                  style={[
                    styles.thumbnailFrame,
                    isSelected && styles.thumbnailFrameActive,
                  ]}
                  activeOpacity={0.8}
                  // Kliknięcie miniatury podmienia zdjęcie na głównym widoku
                  onPress={() => setActiveImage(imgSource)}
                >
                  <Image
                    source={getImageSource(imgSource)}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sekcja informacyjna z opisem obiektu */}
        <View style={styles.infoContainer}>
          {/* Nazwa zabytku (Figma: Inter SemiBold 20px, kolor #323232) */}
          <Text style={styles.title}>{place.title}</Text>

          {/* Wiersz lokalizacji ze znacznikiem adresu (Figma: Top 524px, Left 23px) */}
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={18 * scale}
              color={colors.textSecondary}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{place.location?.address}</Text>
          </View>

          {/* Treść opisu zabytku (Figma: Szerokość 344px, Inter Regular 15px) */}
          <Text style={styles.description}>
            {place.fullDescription || place.shortDescription}
          </Text>
        </View>
      </ScrollView>

      {/* Dolny pasek akcji: Start oraz Ulubione */}
      <SafeAreaView style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
          {/* Przycisk Start (Figma Rectangle 3: Szerokość 296px, Wysokość 45px, Promień 20px) */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.85}
            onPress={() => console.log(`Rozpoczęto trasę dla: ${place.title}`)}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>

          {/* Przycisk serca (Figma Vector: Szerokość 33px, Wysokość 30px) */}
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            activeOpacity={0.7}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20 * scale}
              color={isFavorite ? colors.danger : colors.borderMuted}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28 * scale,
      backgroundColor: colors.white,
    },
    errorTitle: {
      fontSize: 20 * scale,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 16 * scale,
      marginBottom: 8 * scale,
    },
    errorMessage: {
      fontSize: 14 * scale,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20 * scale,
      marginBottom: 24 * scale,
    },
    errorBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      backgroundColor: colors.primary,
      paddingHorizontal: 20 * scale,
      paddingVertical: 12 * scale,
      borderRadius: 16 * scale,
    },
    errorBackButtonText: {
      color: colors.white,
      fontSize: 15 * scale,
      fontWeight: '600',
    },
    scrollContent: {
      paddingBottom: 90 * scale,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 453 * scale,
      backgroundColor: colors.surfaceMuted,
    },
    mainCastleImage: {
      width: '100%',
      height: '100%',
    },
    backButtonPill: {
      position: 'absolute',
      top: 48 * scale,
      left: 23 * scale,
      width: 49 * scale,
      height: 25 * scale,
      borderRadius: 12.5 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnailsGroup: {
      position: 'absolute',
      top: 385 * scale,
      left: 67 * scale,
      flexDirection: 'row',
      gap: 7 * scale,
      zIndex: 2,
    },
    thumbnailFrame: {
      width: 58.78 * scale,
      height: 58 * scale,
      borderRadius: 20 * scale,
      borderWidth: 3 * scale,
      borderColor: colors.white,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 5,
      elevation: 4,
    },
    // Wyróżnienie aktywnej miniatury kolorem głównym aplikacji
    thumbnailFrameActive: {
      borderColor: colors.primary,
      borderWidth: 3 * scale,
      transform: [{ scale: 1.05 }],
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    infoContainer: {
      paddingHorizontal: 23 * scale,
      paddingTop: 16 * scale,
      backgroundColor: colors.white,
    },
    title: {
      fontSize: 20 * scale,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16 * scale,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24 * scale,
    },
    locationIcon: {
      marginRight: 6 * scale,
    },
    locationText: {
      fontSize: 15 * scale,
      fontWeight: '400',
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    description: {
      width: 344 * scale,
      fontSize: 15 * scale,
      lineHeight: 21 * scale,
      fontWeight: '400',
      color: colors.textPrimary,
    },
    bottomBarWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.white,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 23 * scale,
      paddingVertical: 12 * scale,
      gap: 5 * scale,
    },
    startButton: {
      width: 296 * scale,
      height: 45 * scale,
      borderRadius: 20 * scale,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    startButtonText: {
      color: colors.white,
      fontSize: 16 * scale,
      fontWeight: '600',
    },
    favoriteButton: {
      width: 33 * scale,
      height: 30 * scale,
      borderRadius: 6 * scale,
      borderWidth: 2.06 * scale,
      borderColor: colors.borderMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5 * scale,
    },
    favoriteButtonActive: {
      borderColor: colors.danger,
    },
  });