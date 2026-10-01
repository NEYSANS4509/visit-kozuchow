// src/screens/ExploreScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { PLACES } from '../data/places';
import { useAccessibility } from '../context/AccessibilityContext';
import { useScaledStyles } from '../hooks/useScale';
import { getImageSource } from '../utils/imageSource';
import LegalModal from '../components/LegalModal';
import AIChatModal from '../components/AIChatModal';
import CalmPressable from '../components/CalmPressable';
import FadeInView from '../components/FadeInView';

/**
 * Domyślny wycinek mapy wycentrowany na historyczne centrum Kożuchowa.
 */
const KOZUCHOW_REGION = {
  latitude: 51.7464,
  longitude: 15.5955,
  latitudeDelta: 0.009,
  longitudeDelta: 0.009,
};

/**
 * Główny ekran katalogowy i pulpit turystyczny (ExploreScreen).
 * Spełnia standardy dostępności WCAG 2.1 (AA):
 * - Minimalny rozmiar dotyku każdego elementu (Touch Target >= 48x48 dp)
 * - Pełne wsparcie dla czytników ekranu (TalkBack / VoiceOver)
 * - Dynamiczne skalowanie fontów i obsługa trybu wysokiego kontrastu oraz trybu dla daltonistów.
 *
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function ExploreScreen({ navigation }) {
  const { scale, styles } = useScaledStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { colors, highContrast, colorBlindMode, getScaledFontSize } = useAccessibility();

  const [searchQuery, setSearchQuery] = useState('');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Dynamiczne filtrowanie obiektów po nazwie, adresie i kategorii
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return PLACES;
    const q = searchQuery.toLowerCase().trim();
    return PLACES.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.location?.address?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundLight }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (85 + insets.bottom) * scale },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Nagłówek z przyciskami Ustawień i Informacji prawnych */}
        <View style={[styles.header, highContrast && styles.highContrastBorderBottom]}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(32 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Zwiedzaj
          </Text>

          <View style={styles.headerActions}>
            {/* Przycisk przejścia do Ustawień Dostępności */}
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Settings')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Ustawienia i ułatwienia dostępu WCAG"
              accessibilityHint="Otwiera panel ustawień, w tym tryb wysokiego kontrastu, tryb dla daltonistów i powiększenie tekstu"
            >
              <Ionicons
                name="settings-outline"
                size={24 * scale}
                color={colors.textDark}
              />
            </TouchableOpacity>

            {/* Przycisk informacji prawnych i regulaminu */}
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => setLegalModalVisible(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Informacje prawne, regulamin i polityka prywatności"
              accessibilityHint="Wyświetla modal z polityką prywatności i regulaminem"
            >
              <Ionicons
                name="information-circle-outline"
                size={26 * scale}
                color={colors.textDark}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Pasek wyszukiwania z obsługą skalowania fontów */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.white },
              highContrast && styles.highContrastCard,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={22 * scale}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
              ]}
              placeholder="Szukaj zabytku, ulicy..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              allowFontScaling={true}
              accessible={true}
              accessibilityLabel="Pole wyszukiwania zabytków i ulic"
              accessibilityHint="Wpisz nazwę zabytku lub ulicy, aby przefiltrować listę"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Wyczyść pole wyszukiwania"
              >
                <Ionicons name="close-circle" size={22 * scale} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Pozioma lista kart polecanych miejsc */}
        {filteredPlaces.length === 0 ? (
          <View style={styles.emptyContainer} accessible={true} accessibilityRole="text">
            <Text
              style={[
                styles.emptyText,
                { color: colors.textMuted, fontSize: getScaledFontSize(14 * scale) },
              ]}
              allowFontScaling={true}
            >
              Nie znaleziono pasujących miejsc
            </Text>
          </View>
        ) : (
          <FadeInView key={`${searchQuery}_${filteredPlaces.length}`} duration={160}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScroll}
            >
              {filteredPlaces.map((item) => (
                <CalmPressable
                  key={item.id}
                  style={[
                    styles.placeCard,
                    { backgroundColor: colors.white },
                    highContrast && styles.highContrastCard,
                  ]}
                  onPress={() => navigation.navigate('CastleDetail', { placeId: item.id })}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Obiekt: ${item.title}, kategoria: ${item.category}, adres: ${item.location?.address || 'Kożuchów'}. Dotknij, aby przejść do szczegółów.`}
                  accessibilityHint="Przenosi do karty zabytku z audioprzewodnikiem i galerią"
                >
                  <View style={styles.cardImageWrapper}>
                    <Image
                      source={getImageSource(item.imageUri)}
                      style={styles.cardImage}
                      resizeMode="cover"
                      accessible={true}
                      accessibilityRole="image"
                      accessibilityLabel={`Zdjęcie obiektu: ${item.title}`}
                    />
                    <View
                      style={styles.cardBookmark}
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <Ionicons name="bookmark-outline" size={16 * scale} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.textDark, fontSize: getScaledFontSize(16 * scale) },
                      ]}
                      numberOfLines={2}
                      allowFontScaling={true}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: colors.textMuted, fontSize: getScaledFontSize(12 * scale) },
                      ]}
                      numberOfLines={1}
                      allowFontScaling={true}
                    >
                      {item.location?.address}
                    </Text>
                  </View>
                </CalmPressable>
              ))}
            </ScrollView>
          </FadeInView>
        )}

        {/* 4. Nagłówek sekcji mapy */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(20 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Mapa
          </Text>
          <CalmPressable
            style={styles.moreButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.navigate('Map')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Pełny ekran mapy"
            accessibilityHint="Otwiera pełnoekranową mapę z pinezkami GPS"
          >
            <Text
              style={[
                styles.sectionMoreText,
                { color: colors.primary, fontSize: getScaledFontSize(14 * scale) },
              ]}
              allowFontScaling={true}
            >
              Pełny ekran
            </Text>
          </CalmPressable>
        </View>

        {/* 5. Widżet podglądu mapy (min. 48x48 touch target) */}
        <CalmPressable
          style={[
            styles.mapCardContainer,
            highContrast && styles.highContrastCard,
          ]}
          onPress={() => navigation.navigate('Map')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Podgląd mapy Kożuchowa z pinezkami zabytków. Dotknij, aby przejść do pełnej mapy z nawigacją GPS."
          accessibilityHint="Przechodzi do ekranu interaktywnej mapy"
        >
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <MapView
              style={styles.embeddedMap}
              provider={PROVIDER_DEFAULT}
              initialRegion={KOZUCHOW_REGION}
              mapType="hybrid"
              showsUserLocation={false}
              showsCompass={false}
              toolbarEnabled={false}
            >
              {PLACES.map((place) => (
                <Marker
                  key={place.id}
                  coordinate={{
                    latitude: place.location.latitude,
                    longitude: place.location.longitude,
                  }}
                >
                  <View
                    style={[
                      styles.miniMarker,
                      { backgroundColor: colors.primary },
                      highContrast && styles.highContrastMarker,
                    ]}
                  >
                    <Ionicons
                      name={
                        place.category === 'Zabytki'
                          ? 'business'
                          : place.category === 'Parki i Przyroda'
                          ? 'leaf'
                          : place.category === 'Miejsca pamięci'
                          ? 'flower'
                          : 'trail-sign'
                      }
                      size={12 * scale}
                      color="#FFF"
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>

          <View style={styles.mapInfoBar} pointerEvents="none">
            <View style={styles.mapInfoTextWrapper}>
              <Text
                style={[
                  styles.mapInfoTitle,
                  { fontSize: getScaledFontSize(14 * scale) },
                ]}
                allowFontScaling={true}
              >
                Kożuchów z góry (GPS)
              </Text>
              <Text
                style={[
                  styles.mapInfoSubtitle,
                  { fontSize: getScaledFontSize(11 * scale) },
                ]}
                allowFontScaling={true}
              >
                Dotknij, aby przejść do pełnej mapy
              </Text>
            </View>
            <View
              style={[
                styles.mapActionButton,
                { backgroundColor: colors.primary },
                highContrast && styles.highContrastActionButton,
              ]}
            >
              <Ionicons name="navigate" size={18 * scale} color="#FFF" />
            </View>
          </View>
        </CalmPressable>
      </ScrollView>

      {/* 6. Dolny pasek nawigacyjny: Odkryj | Mapa | Skaner | Asystent AI (min. wysokość 48 dp) */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.white,
            paddingBottom: Math.max(6 * scale, insets.bottom),
            height: 58 * scale + insets.bottom,
          },
          highContrast && styles.highContrastTopBorder,
        ]}
        accessible={true}
        accessibilityRole="tablist"
      >
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Zakładka Odkryj, aktywna"
          accessibilityState={{ selected: true }}
        >
          <Ionicons name="home" size={24 * scale} color={colors.primary} />
          <Text
            style={[
              styles.navText,
              { color: colors.primary, fontSize: getScaledFontSize(10 * scale) },
            ]}
            allowFontScaling={true}
          >
            Odkryj
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Map')}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Zakładka Mapa"
          accessibilityState={{ selected: false }}
        >
          <Ionicons name="map-outline" size={24 * scale} color={colors.textMuted} />
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted, fontSize: getScaledFontSize(10 * scale) },
            ]}
            allowFontScaling={true}
          >
            Mapa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('QRScanner')}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Zakładka Skaner kodów QR"
          accessibilityState={{ selected: false }}
        >
          <Ionicons name="qr-code-outline" size={24 * scale} color={colors.textMuted} />
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted, fontSize: getScaledFontSize(10 * scale) },
            ]}
            allowFontScaling={true}
          >
            Skaner
          </Text>
        </TouchableOpacity>

        {/* Przycisk otwierający okno Asystenta AI */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setAiModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Inteligentny Asystent turystyczny AI"
          accessibilityHint="Otwiera okno dialogowe z przewodnikiem AI"
        >
          <Ionicons
            name="sparkles"
            size={24 * scale}
            color={colorBlindMode ? colors.primary : '#8B5CF6'}
          />
          <Text
            style={[
              styles.navText,
              {
                color: colorBlindMode ? colors.primary : '#8B5CF6',
                fontSize: getScaledFontSize(10 * scale),
              },
            ]}
            allowFontScaling={true}
          >
            Asystent AI
          </Text>
        </TouchableOpacity>
      </View>

      {/* Okna modalne */}
      <LegalModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
      />

      <AIChatModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100 * scale,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20 * scale,
      paddingTop: 10 * scale,
      paddingBottom: 12 * scale,
    },
    highContrastBorderBottom: {
      borderBottomWidth: 2,
      borderBottomColor: '#000000',
    },
    headerTitle: {
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
    },
    iconButton: {
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24 * scale,
    },
    searchRow: {
      paddingHorizontal: 20 * scale,
      marginBottom: 20 * scale,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 50 * scale,
      borderRadius: 25 * scale,
      paddingHorizontal: 16 * scale,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    highContrastCard: {
      borderWidth: 2.5,
      borderColor: '#000000',
      shadowOpacity: 0,
      elevation: 0,
    },
    searchIcon: {
      marginRight: 8 * scale,
    },
    searchInput: {
      flex: 1,
      minHeight: 44 * scale,
      paddingVertical: 6 * scale,
    },
    clearSearchButton: {
      minWidth: 44 * scale,
      minHeight: 44 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      padding: 30 * scale,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontWeight: '500',
      textAlign: 'center',
    },
    cardsScroll: {
      paddingLeft: 20 * scale,
      paddingRight: 8 * scale,
      paddingBottom: 12 * scale,
      gap: 16 * scale,
    },
    placeCard: {
      width: 220 * scale,
      height: 290 * scale,
      borderRadius: 22 * scale,
      padding: 10 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    cardImageWrapper: {
      position: 'relative',
      width: '100%',
      height: 190 * scale,
      borderRadius: 16 * scale,
      overflow: 'hidden',
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardBookmark: {
      position: 'absolute',
      top: 10 * scale,
      right: 10 * scale,
      width: 32 * scale,
      height: 32 * scale,
      borderRadius: 16 * scale,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
      justifyContent: 'space-between',
      paddingVertical: 8 * scale,
      paddingHorizontal: 4 * scale,
    },
    cardTitle: {
      fontWeight: '700',
      marginBottom: 2 * scale,
    },
    cardSubtitle: {
      fontWeight: '500',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20 * scale,
      marginTop: 22 * scale,
      marginBottom: 12 * scale,
    },
    sectionTitle: {
      fontWeight: '800',
    },
    moreButton: {
      minHeight: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6 * scale,
    },
    sectionMoreText: {
      fontWeight: '700',
    },
    mapCardContainer: {
      marginHorizontal: 20 * scale,
      height: 220 * scale,
      borderRadius: 22 * scale,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#1E293B',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    embeddedMap: {
      width: '100%',
      height: '100%',
    },
    miniMarker: {
      width: 26 * scale,
      height: 26 * scale,
      borderRadius: 13 * scale,
      borderWidth: 2 * scale,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    },
    highContrastMarker: {
      borderColor: '#000000',
      borderWidth: 3,
    },
    mapInfoBar: {
      position: 'absolute',
      bottom: 12 * scale,
      left: 12 * scale,
      right: 12 * scale,
      padding: 12 * scale,
      borderRadius: 16 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    mapInfoTextWrapper: {
      flex: 1,
      marginRight: 8 * scale,
    },
    mapInfoTitle: {
      fontWeight: '700',
      color: '#1C1C1E',
    },
    mapInfoSubtitle: {
      color: '#64748B',
      fontWeight: '500',
      marginTop: 2 * scale,
    },
    mapActionButton: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    highContrastActionButton: {
      borderWidth: 2,
      borderColor: '#000000',
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 10,
    },
    highContrastTopBorder: {
      borderTopWidth: 2,
      borderTopColor: '#000000',
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48 * scale,
      height: '100%',
      gap: 2 * scale,
    },
    navText: {
      fontWeight: '600',
    },
  });