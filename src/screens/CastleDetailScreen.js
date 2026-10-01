// src/screens/CastleDetailScreen.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  AccessibilityInfo,
  findNodeHandle,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { placesService } from '../services/placesService';
import { useAccessibility } from '../context/AccessibilityContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useScaledStyles } from '../hooks/useScale';
import { getImageSource } from '../utils/imageSource';
import AudioGuideButton from '../components/AudioGuideButton';
import CalmPressable from '../components/CalmPressable';
import FadeInView from '../components/FadeInView';

/**
 * Ekran szczegółów zabytku lub sali ekspozycyjnej (CastleDetailScreen).
 * Prezentuje galerię zdjęć, audioprzewodnik (Text-to-Speech), pełny opis historyczny
 * oraz horyzontalną listę sal muzealnych (w przypadku Zamku).
 * Spełnia standardy dostępności cyfrowej WCAG 2.1 AA:
 * - Touch Target >= 48x48 dp dla wszystkich przycisków
 * - Skalowanie czcionek (allowFontScaling={true})
 * - Zarządzanie fokusem czytnika ekranu (setAccessibilityFocus)
 * - Obsługa wysokiego kontrastu i trybu dla osób z daltonizmem.
 *
 * @param {object} route - Parametry trasy ({ placeId, placeData })
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function CastleDetailScreen({ route, navigation }) {
  const placeId = route?.params?.placeId || 'place_01';
  const placeDataParam = route?.params?.placeData || null;

  const { scale, styles, windowWidth, windowHeight } = useScaledStyles(createStyles);
  const { colors, isDarkMode, highContrast, colorBlindMode, getScaledFontSize } = useAccessibility();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, translatePlace } = useLanguage();

  const [place, setPlace] = useState(placeDataParam);
  const [loading, setLoading] = useState(!placeDataParam);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamicznie przetłumaczony zabytek
  const displayPlace = useMemo(() => {
    return place ? translatePlace(place) : null;
  }, [place, translatePlace]);

  const isFav = place ? isFavorite(place.id) : false;

  // Funkcja udostępnienia zabytku za pomocą natywnego modułu Share
  const handleSharePlace = async () => {
    if (!displayPlace) return;
    try {
      const mapsUrl = displayPlace.location?.latitude && displayPlace.location?.longitude
        ? `https://maps.google.com/?q=${displayPlace.location.latitude},${displayPlace.location.longitude}`
        : 'https://visit-kozuchow.pl';

      const shareMessage = `🏰 ${displayPlace.title}\n\n${
        displayPlace.shortDescription || ''
      }\n\n📍 ${displayPlace.location?.address || 'Kożuchów'}\n🗺️ ${mapsUrl}\n\n${t('common.appName')}`;

      await Share.share({
        title: displayPlace.title,
        message: shareMessage,
      });
    } catch (_e) {}
  };

  const galleryRef = useRef(null);
  const titleRef = useRef(null);

  const cardWidth = Math.round(windowWidth * 0.72);
  const cardGap = Math.round(14 * scale);

  useEffect(() => {
    if (placeDataParam) {
      setPlace(placeDataParam);
      setLoading(false);
      return;
    }

    let isMounted = true;
    placesService
      .getPlaceById(placeId)
      .then((data) => {
        if (isMounted) {
          setPlace(data);
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
  }, [placeId, placeDataParam]);

  // =========================================================================
  // WCAG / DOSTĘPNOŚĆ: ZARZĄDZANIE FOKUSEM DLA CZYTNIKÓW EKRANU (a11y)
  // Gdy dane obiektu zostaną pomyślnie załadowane, przenosimy fokus czytnika
  // (TalkBack na Androidzie / VoiceOver na iOS) bezpośrednio na główny nagłówek.
  // Zapobiega to gubieniu kontekstu przez osoby niewidome po zmianie ekranu.
  // =========================================================================
  useEffect(() => {
    if (!loading && place && titleRef.current) {
      const handle = findNodeHandle(titleRef.current);
      if (handle) {
        AccessibilityInfo.setAccessibilityFocus(handle);
      }
    }
  }, [loading, place]);

  // Pełna lista fotografii do galerii (zdjęcie główne + miniatury)
  const galleryList = useMemo(() => {
    if (!place) return [];
    const list = [];
    if (place.imageUri) list.push(place.imageUri);
    if (Array.isArray(place.galleryImages) && place.galleryImages.length > 0) {
      list.push(...place.galleryImages);
    }
    return list;
  }, [place]);

  const handleScroll = (event) => {
    const layoutWidth = event.nativeEvent.layoutMeasurement?.width || windowWidth;
    if (layoutWidth <= 0) return;
    const slide = Math.round(event.nativeEvent.contentOffset.x / layoutWidth);
    if (slide !== activeImageIndex && slide >= 0 && slide < galleryList.length) {
      setActiveImageIndex(slide);
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.white }]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Ładowanie informacji o zabytku"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.white }]}>
        <Ionicons name="alert-circle-outline" size={56 * scale} color={colors.danger} />
        <Text
          style={[
            styles.errorTitle,
            { color: colors.textDark, fontSize: getScaledFontSize(18 * scale) },
          ]}
          allowFontScaling={true}
        >
          {t('explore.noResults')}
        </Text>
        <TouchableOpacity
          style={[styles.errorBackButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={20 * scale} color={colors.white} />
          <Text
            style={[
              styles.errorBackButtonText,
              { fontSize: getScaledFontSize(14 * scale) },
            ]}
            allowFontScaling={true}
          >
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const audioText = `${displayPlace.title}. ${
    displayPlace.location?.address ? `${displayPlace.location.address}. ` : ''
  }${displayPlace.fullDescription || displayPlace.shortDescription || ''}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Galeria fotografii zabytku */}
        <View style={[styles.heroContainer, { height: windowHeight * 0.45 }]}>
          {galleryList.length > 1 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              scrollEventThrottle={16}
            >
              {galleryList.map((imgItem, idx) => (
                /* WCAG: Precyzyjna etykieta zdjęcia z numerem slajdu */
                <Image
                  key={`img_${idx}`}
                  source={getImageSource(imgItem)}
                  style={{ width: windowWidth, height: '100%' }}
                  resizeMode="cover"
                  accessible={true}
                  accessibilityRole="image"
                  accessibilityLabel={`Fotografia ${idx + 1} z ${galleryList.length}: ${displayPlace.title}`}
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              source={getImageSource(displayPlace.imageUri)}
              style={{ width: windowWidth, height: '100%' }}
              resizeMode="cover"
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel={`Fotografia: ${displayPlace.title}`}
            />
          )}

          {/* =========================================================================
              WCAG / DOSTĘPNOŚĆ: GÓRNY PASEK AKCJI (POWRÓT + ULUBIONE + UDOSTĘPNIJ)
              1. minWidth i minHeight >= 48dp (Touch Target)
              2. accessibilityRole="button"
              3. accessibilityLabel i accessibilityHint
             ========================================================================= */}
          <SafeAreaView style={styles.backButtonSafeArea} edges={['top']}>
            <CalmPressable
              style={[
                styles.backPill,
                { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.94)' : 'rgba(255, 255, 255, 0.94)' },
                highContrast && styles.highContrastBorder,
              ]}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              accessibilityHint="Wraca do poprzedniego widoku"
            >
              <Ionicons name="arrow-back" size={22 * scale} color={colors.textDark} />
            </CalmPressable>

            <View style={styles.heroRightActions}>
              {/* Przycisk dodania do ulubionych (Feature 2) */}
              <CalmPressable
                style={[
                  styles.backPill,
                  { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.94)' : 'rgba(255, 255, 255, 0.94)' },
                  isFav && {
                    backgroundColor: colorBlindMode ? '#0284C7' : '#D97706',
                  },
                  highContrast && styles.highContrastBorder,
                ]}
                onPress={() => toggleFavorite(displayPlace.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  isFav
                    ? `Usuń ${displayPlace.title} z ulubionych`
                    : `Zapisz ${displayPlace.title} w ulubionych`
                }
                accessibilityState={{ selected: isFav }}
              >
                <Ionicons
                  name={isFav ? 'bookmark' : 'bookmark-outline'}
                  size={20 * scale}
                  color={isFav ? '#FFFFFF' : colors.textDark}
                />
              </CalmPressable>

              {/* Przycisk udostępnienia zabytku (Feature 4) */}
              <CalmPressable
                style={[
                  styles.backPill,
                  { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.94)' : 'rgba(255, 255, 255, 0.94)' },
                  highContrast && styles.highContrastBorder,
                ]}
                onPress={handleSharePlace}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${t('detail.shareTitle')} ${displayPlace.title}`}
                accessibilityHint="Otwiera menu udostępniania ze szczegółami i linkiem do mapy"
              >
                <Ionicons name="share-social-outline" size={20 * scale} color={colors.textDark} />
              </CalmPressable>
            </View>
          </SafeAreaView>

          {/* WCAG: Ukrycie czysto dekoracyjnych kropek paginacji przed czytnikiem */}
          {galleryList.length > 1 && (
            <View
              style={styles.dotsWrapper}
              pointerEvents="none"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              {galleryList.map((_, idx) => (
                <View
                  key={`dot_${idx}`}
                  style={[styles.dot, activeImageIndex === idx && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* =========================================================================
            WCAG / DOSTĘPNOŚĆ: STRUKTURA SEMANTYCZNA I NAGŁÓWKI (accessibilityRole="header")
           ========================================================================= */}
        <View
          style={[
            styles.contentCard,
            { backgroundColor: colors.white },
            highContrast && styles.highContrastContentCard,
          ]}
        >
          <Text
            ref={titleRef}
            style={[
              styles.mainTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(30 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
            allowFontScaling={true}
          >
            {displayPlace.title}
          </Text>

          {displayPlace.location?.address ? (
            <View
              style={styles.locationRow}
              accessible={true}
              accessibilityLabel={`Lokalizacja: ${displayPlace.location.address}`}
            >
              <Ionicons
                name="location-sharp"
                size={18 * scale}
                color={colors.primaryAccessible}
              />
              <Text
                style={[
                  styles.locationText,
                  { color: colors.primaryAccessible, fontSize: getScaledFontSize(14 * scale) },
                ]}
                allowFontScaling={true}
              >
                {displayPlace.location.address}
              </Text>
            </View>
          ) : null}

          {/* WCAG: Przycisk przejścia na mapę (Touch Target >= 48x48 dp) */}
          {displayPlace.location?.latitude && displayPlace.location?.longitude ? (
            <CalmPressable
              style={[
                styles.mapButton,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                highContrast && styles.highContrastMapButton,
              ]}
              onPress={() => navigation.navigate('Map', { initialPlaceId: displayPlace.id })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t('detail.showOnMap')}: ${displayPlace.title}`}
              accessibilityHint="Przełącza na widok interaktywnej mapy i centruje kamerę na tym zabytku"
            >
              <Ionicons name="map" size={18 * scale} color={colors.primary} />
              <Text
                style={[
                  styles.mapButtonText,
                  { color: colors.primary, fontSize: getScaledFontSize(14 * scale) },
                ]}
                allowFontScaling={true}
              >
                {t('detail.showOnMap')}
              </Text>
            </CalmPressable>
          ) : null}

          {/* Nagłówek sekcji z audioprzewodnikiem */}
          <View style={styles.infoSectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.textDark, fontSize: getScaledFontSize(22 * scale) },
              ]}
              accessibilityRole="header"
              allowFontScaling={true}
            >
              {t('detail.tabs.practical')}
            </Text>

            {/* WCAG: Audioprzewodnik (Text-to-Speech) o wymiarach min. 48x48 */}
            <AudioGuideButton text={audioText} style={styles.audioBtn} />
          </View>

          <Text
            style={[
              styles.descriptionText,
              { color: colors.textPrimary, fontSize: getScaledFontSize(15 * scale) },
            ]}
            allowFontScaling={true}
          >
            {displayPlace.fullDescription || displayPlace.shortDescription}
          </Text>

          {/* Sekcja ekspozycji i sal wewnętrznych */}
          {Array.isArray(displayPlace.rooms) && displayPlace.rooms.length > 0 && (
            <View style={styles.roomsSection}>
              <Text
                style={[
                  styles.roomsSectionTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(20 * scale) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                {t('detail.roomsTitle')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + cardGap}
                decelerationRate="fast"
                contentContainerStyle={styles.roomsScrollTrack}
              >
                {displayPlace.rooms.map((room, idx) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.roomCard,
                      {
                        width: cardWidth,
                        marginRight: idx === displayPlace.rooms.length - 1 ? 0 : cardGap,
                        backgroundColor: colors.backgroundLight,
                        borderColor: colors.borderLight,
                      },
                      highContrast && styles.highContrastBorder,
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.push('CastleDetail', {
                        placeId: room.id,
                        placeData: room,
                      })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Sala: ${room.title}. ${room.shortDescription}. Dotknij, aby zobaczyć szczegóły.`}
                  >
                    <Image
                      source={getImageSource(room.imageUri)}
                      style={styles.roomImage}
                      resizeMode="cover"
                      accessible={true}
                      accessibilityRole="image"
                      accessibilityLabel={`Zdjęcie sali: ${room.title}`}
                    />
                    <View style={styles.roomInfo}>
                      <View style={styles.roomHeaderRow}>
                        <Text
                          style={[
                            styles.roomTitle,
                            { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
                          ]}
                          numberOfLines={1}
                          allowFontScaling={true}
                        >
                          {room.title}
                        </Text>
                        <Ionicons
                          name="chevron-forward-circle-outline"
                          size={22 * scale}
                          color={colors.primaryAccessible}
                        />
                      </View>
                      <Text
                        style={[
                          styles.roomDescription,
                          { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                        ]}
                        numberOfLines={2}
                        allowFontScaling={true}
                      >
                        {room.shortDescription}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24 * scale,
    },
    errorTitle: {
      fontWeight: '700',
      marginBottom: 16 * scale,
    },
    errorBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      paddingHorizontal: 20 * scale,
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      borderRadius: 14 * scale,
      justifyContent: 'center',
    },
    errorBackButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    scrollContent: {
      flexGrow: 1,
    },
    heroContainer: {
      width: '100%',
      position: 'relative',
      backgroundColor: '#E2E8F0',
    },
    backButtonSafeArea: {
      position: 'absolute',
      top: 10 * scale,
      left: 18 * scale,
      right: 18 * scale,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    heroRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10 * scale,
    },
    // WCAG: minWidth i minHeight 48dp dla spełnienia standardu Touch Target
    backPill: {
      width: 48 * scale,
      height: 48 * scale,
      minWidth: 48,
      minHeight: 48,
      borderRadius: 24 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    highContrastBorder: {
      borderWidth: 2.5,
      borderColor: '#000000',
    },
    dotsWrapper: {
      position: 'absolute',
      bottom: 40 * scale,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6 * scale,
      zIndex: 5,
    },
    dot: {
      width: 8 * scale,
      height: 8 * scale,
      borderRadius: 4 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.55)',
    },
    dotActive: {
      width: 20 * scale,
      backgroundColor: '#FFFFFF',
    },
    contentCard: {
      flex: 1,
      marginTop: -26 * scale,
      borderTopLeftRadius: 32 * scale,
      borderTopRightRadius: 32 * scale,
      paddingTop: 24 * scale,
      paddingHorizontal: 20 * scale,
      paddingBottom: 40 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 5,
    },
    highContrastContentCard: {
      borderTopWidth: 3,
      borderTopColor: '#000000',
    },
    mainTitle: {
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      letterSpacing: -0.5,
      marginBottom: 6 * scale,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6 * scale,
      marginBottom: 18 * scale,
      minHeight: 28 * scale,
    },
    locationText: {
      fontWeight: '700',
    },
    mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8 * scale,
      borderWidth: 1.5,
      borderRadius: 20 * scale,
      paddingHorizontal: 16 * scale,
      paddingVertical: 10 * scale,
      minHeight: 48 * scale,
      alignSelf: 'center',
      marginBottom: 16 * scale,
    },
    highContrastMapButton: {
      borderWidth: 2.5,
      borderColor: '#000000',
      backgroundColor: '#FFFFFF',
    },
    mapButtonText: {
      fontWeight: '700',
    },
    infoSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14 * scale,
      minHeight: 48 * scale,
    },
    sectionTitle: {
      fontWeight: '600',
      textAlign: 'left',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    audioBtn: {
      marginLeft: 12 * scale,
    },
    descriptionText: {
      lineHeight: 24 * scale,
      textAlign: 'left',
      marginBottom: 24 * scale,
    },
    roomsSection: {
      marginTop: 6 * scale,
    },
    roomsSectionTitle: {
      fontWeight: '600',
      marginBottom: 14 * scale,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    roomsScrollTrack: {
      paddingRight: 20 * scale,
    },
    roomCard: {
      borderRadius: 18 * scale,
      overflow: 'hidden',
      borderWidth: 1,
      minHeight: 48 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    roomImage: {
      width: '100%',
      height: 120 * scale,
    },
    roomInfo: {
      padding: 12 * scale,
    },
    roomHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4 * scale,
    },
    roomTitle: {
      flex: 1,
      fontWeight: '700',
      marginRight: 6 * scale,
    },
    roomDescription: {
      lineHeight: 16 * scale,
    },
  });