// src/screens/MapScreen.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PLACES } from '../data/places';
import { useAccessibility } from '../context/AccessibilityContext';
import { useScaledStyles } from '../hooks/useScale';
import { getImageSource } from '../utils/imageSource';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Domyślne współrzędne centrum Kożuchowa (rynek / zamek).
 */
const KOZUCHOW_COORDINATES = {
  latitude: 51.7464,
  longitude: 15.5955,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

/**
 * Przesunięcie kamery na południe (w stopniach szerokości geograficznej),
 * dzięki któremu zabytek pojawia się wyżej na ekranie i dolna karta informacyjna
 * nie zasłania pinezki ani obiektu.
 */
const CAMERA_LAT_OFFSET = 0.0018;

/**
 * Gotowe rekomendowane trasy turystyczne asystenta AI.
 */
const AI_ROUTE_PRESETS = [
  {
    id: 'preset_1h',
    title: 'Szybki spacer (ok. 1h)',
    subtitle: 'Kluczowe zabytki centrum miasta',
    durationMinutes: 60,
    placeIds: ['place_01', 'place_04', 'place_03', 'place_06'],
  },
  {
    id: 'preset_1_5h',
    title: 'Szlak fortyfikacji i tajemnic (ok. 1.5h)',
    subtitle: 'Zamek, mury, baszty i ukryte detale',
    durationMinutes: 90,
    placeIds: ['place_01', 'place_04', 'place_05', 'place_03', 'place_09'],
  },
  {
    id: 'preset_2h',
    title: 'Szlak sakralny i pamięci (ok. 2h)',
    subtitle: 'Kościoły, lapidarium i dawne cmentarze',
    durationMinutes: 120,
    placeIds: ['place_02', 'place_10', 'place_07', 'place_11'],
  },
  {
    id: 'preset_2_5h',
    title: 'Wielka pętla kożuchowska (ok. 2.5h)',
    subtitle: 'Kompleksowe zwiedzanie całego grodu',
    durationMinutes: 150,
    placeIds: ['place_01', 'place_04', 'place_06', 'place_08', 'place_12', 'place_07'],
  },
];

/**
 * Oblicza dokładną odległość w metrach między dwoma punktami GPS za pomocą wzoru haversine.
 *
 * @param {number} lat1 - Szerokość punktu 1
 * @param {number} lon1 - Długość punktu 1
 * @param {number} lat2 - Szerokość punktu 2
 * @param {number} lon2 - Długość punktu 2
 * @returns {number} Dystans w metrach
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formatuje odległość na czytelny tekst w metrach lub kilometrach.
 *
 * @param {number|null} meters - Odległość w metrach
 * @returns {string|null}
 */
function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return null;
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Ekran pełnoekranowej interaktywnej mapy satelitarnej miasta (MapScreen).
 * Zapewnia:
 * 1. Stały widok satelitarny z nazwami ulic (mapType="hybrid") bez zbędnych przełączników.
 * 2. Inteligentne centrowanie na obiektach (z przesunięciem ku górze ekranu, aby dolna karta nie zasłaniała zabytku).
 * 3. Przejrzysty układ: przycisk wyjścia i kreator tras w bezpiecznym flex layout (brak kolizji z bannerem przystanku).
 * 4. Pływający przycisk centrowania na pozycji GPS turysty umieszczony ergonomicznie z prawej strony.
 * 5. Kreator własnych tras i gotowe szlaki AI z numeracją punktów i linią Polyline.
 * 6. Pełną zgodność z wytycznymi WCAG 2.1 AA (strefy dotyku >= 48x48 dp, kontrast, czytniki ekranu).
 *
 * @param {object} route - Parametry trasy ({ initialPlaceId, routePlaces })
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function MapScreen({ route, navigation }) {
  const initialPlaceId = route?.params?.initialPlaceId;
  const initialRoutePlaces = route?.params?.routePlaces;

  const { scale, styles } = useScaledStyles(createStyles);
  const { colors, highContrast, colorBlindMode, getScaledFontSize } = useAccessibility();

  const mapRef = useRef(null);

  // Bezpieczna inicjalizacja wybranego miejsca
  const initialPlace = useMemo(() => {
    if (initialPlaceId) {
      return PLACES.find((p) => p.id === initialPlaceId) || PLACES[0];
    }
    return PLACES[0];
  }, [initialPlaceId]);

  const [selectedPlace, setSelectedPlace] = useState(initialPlace);
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Stan tras turystycznych
  const [activeRouteIds, setActiveRouteIds] = useState([]);
  const [currentRouteStopIndex, setCurrentRouteStopIndex] = useState(0);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [selectedRouteTab, setSelectedRouteTab] = useState('custom'); // 'custom' | 'presets'
  const [draftCustomIds, setDraftCustomIds] = useState([]);

  // Centrowanie kamery na wybranym obiekcie (podniesione wyżej, by dolna karta go nie zasłaniała)
  useEffect(() => {
    if (initialPlaceId) {
      const target = PLACES.find((p) => p.id === initialPlaceId);
      if (target?.location?.latitude && target?.location?.longitude) {
        setSelectedPlace(target);
        const timer = setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: target.location.latitude - CAMERA_LAT_OFFSET,
              longitude: target.location.longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            },
            500
          );
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [initialPlaceId]);

  // Wczytanie trasy przekazanej w parametrach (np. z asystenta AI)
  useEffect(() => {
    if (Array.isArray(initialRoutePlaces) && initialRoutePlaces.length > 0) {
      setActiveRouteIds(initialRoutePlaces);
      setDraftCustomIds(initialRoutePlaces);
      setCurrentRouteStopIndex(0);

      const firstTarget = PLACES.find((p) => p.id === initialRoutePlaces[0]);
      if (firstTarget?.location?.latitude && firstTarget?.location?.longitude) {
        setSelectedPlace(firstTarget);
        const timer = setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: firstTarget.location.latitude - CAMERA_LAT_OFFSET,
              longitude: firstTarget.location.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            500
          );
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [initialRoutePlaces]);

  // Sprawdzenie i pobranie lokalizacji GPS turysty
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (status === 'granted') {
          setHasLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (!isMounted) return;

          const userCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(userCoords);

          // Jeśli brak wskazanego z góry miejsca, wybieramy najbliższy obiekt
          if (!initialPlaceId && (!initialRoutePlaces || initialRoutePlaces.length === 0)) {
            let closest = PLACES[0];
            let minDistance = Infinity;

            PLACES.forEach((place) => {
              if (place.location?.latitude && place.location?.longitude) {
                const dist = getDistanceMeters(
                  userCoords.latitude,
                  userCoords.longitude,
                  place.location.latitude,
                  place.location.longitude
                );
                if (dist < minDistance) {
                  minDistance = dist;
                  closest = place;
                }
              }
            });

            setSelectedPlace(closest);
          }
        }
      } catch (err) {
        console.warn('Informacja o geolokalizacji:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Obiekty aktywnej trasy w kolejności przystanków
  const activeRoutePlaces = useMemo(() => {
    return activeRouteIds
      .map((id) => PLACES.find((p) => p.id === id))
      .filter((p) => Boolean(p && p.location?.latitude && p.location?.longitude));
  }, [activeRouteIds]);

  // Współrzędne dla linii Polyline na mapie
  const routeCoordinates = useMemo(() => {
    return activeRoutePlaces.map((p) => ({
      latitude: p.location.latitude,
      longitude: p.location.longitude,
    }));
  }, [activeRoutePlaces]);

  // Obliczenie statystyk trasy (łączny dystans i szacowany czas marszu)
  const calculateRouteStats = (ids) => {
    const placesList = ids
      .map((id) => PLACES.find((p) => p.id === id))
      .filter((p) => Boolean(p && p.location?.latitude && p.location?.longitude));

    if (placesList.length === 0) return { distanceMeters: 0, estimatedMinutes: 0 };

    let totalMeters = 0;
    for (let i = 0; i < placesList.length - 1; i++) {
      totalMeters += getDistanceMeters(
        placesList[i].location.latitude,
        placesList[i].location.longitude,
        placesList[i + 1].location.latitude,
        placesList[i + 1].location.longitude
      );
    }

    const walkMinutes = Math.round((totalMeters / 1000) * 12);
    const sightMinutes = placesList.length * 15;
    return {
      distanceMeters: totalMeters,
      estimatedMinutes: Math.max(15, walkMinutes + sightMinutes),
    };
  };

  const activeRouteStats = useMemo(() => {
    return calculateRouteStats(activeRouteIds);
  }, [activeRouteIds]);

  const draftRouteStats = useMemo(() => {
    return calculateRouteStats(draftCustomIds);
  }, [draftCustomIds]);

  // Wycentrowanie mapy na lokalizacji użytkownika (lub prośba o uprawnienia)
  const handleRecenter = async () => {
    if (!hasLocationPermission) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const userCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(userCoords);
          mapRef.current?.animateToRegion(
            {
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            500
          );
          return;
        }
      } catch (err) {
        console.warn('Błąd geolokalizacji:', err);
      }
    }

    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        500
      );
    } else if (mapRef.current) {
      // W przypadku braku sygnału GPS centrujemy na rynku Kożuchowa
      mapRef.current.animateToRegion(
        {
          latitude: KOZUCHOW_COORDINATES.latitude - CAMERA_LAT_OFFSET,
          longitude: KOZUCHOW_COORDINATES.longitude,
          latitudeDelta: KOZUCHOW_COORDINATES.latitudeDelta,
          longitudeDelta: KOZUCHOW_COORDINATES.longitudeDelta,
        },
        500
      );
    }
  };

  // Wybór punktu z mapy z przesunięciem ku górze ekranu
  const handleMarkerPress = (place) => {
    if (!place) return;
    setSelectedPlace(place);
    if (place.location?.latitude && place.location?.longitude) {
      mapRef.current?.animateToRegion(
        {
          latitude: place.location.latitude - CAMERA_LAT_OFFSET,
          longitude: place.location.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        400
      );
    }
  };

  // Przejście do kolejnego przystanku na trasie (również z bezpiecznym przesunięciem)
  const handleNextRouteStop = () => {
    if (activeRoutePlaces.length === 0) return;
    const nextIdx = (currentRouteStopIndex + 1) % activeRoutePlaces.length;
    setCurrentRouteStopIndex(nextIdx);
    const nextPlace = activeRoutePlaces[nextIdx];
    if (nextPlace) {
      setSelectedPlace(nextPlace);
      mapRef.current?.animateToRegion(
        {
          latitude: nextPlace.location.latitude - CAMERA_LAT_OFFSET,
          longitude: nextPlace.location.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        500
      );
    }
  };

  // Zakończenie aktywnej trasy turystycznej
  const handleEndRoute = () => {
    setActiveRouteIds([]);
    setCurrentRouteStopIndex(0);
  };

  // Dodanie / usunięcie zabytku w roboczym kreatorze trasy
  const togglePlaceInDraft = (placeId) => {
    setDraftCustomIds((prev) => {
      if (prev.includes(placeId)) {
        return prev.filter((id) => id !== placeId);
      }
      return [...prev, placeId];
    });
  };

  // Zastosowanie wyznaczonej trasy na mapie
  const applyRoute = (ids) => {
    if (!ids || ids.length === 0) return;
    setActiveRouteIds(ids);
    setDraftCustomIds(ids);
    setCurrentRouteStopIndex(0);
    setRouteModalVisible(false);

    const firstPlace = PLACES.find((p) => p.id === ids[0]);
    if (firstPlace?.location?.latitude && firstPlace?.location?.longitude) {
      setSelectedPlace(firstPlace);
      mapRef.current?.animateToRegion(
        {
          latitude: firstPlace.location.latitude - CAMERA_LAT_OFFSET,
          longitude: firstPlace.location.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        600
      );
    }
  };

  // Odległość zaznaczonego miejsca od pozycji użytkownika
  const currentDistance = useMemo(() => {
    if (!userLocation || !selectedPlace?.location?.latitude) return null;
    return getDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      selectedPlace.location.latitude,
      selectedPlace.location.longitude
    );
  }, [userLocation, selectedPlace]);

  return (
    <View style={styles.container}>
      {/* Interaktywna mapa satelitarna z nazwami ulic i obiektami (mapType="hybrid") */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: (selectedPlace?.location?.latitude ?? KOZUCHOW_COORDINATES.latitude) - CAMERA_LAT_OFFSET,
          longitude: selectedPlace?.location?.longitude ?? KOZUCHOW_COORDINATES.longitude,
          latitudeDelta: KOZUCHOW_COORDINATES.latitudeDelta,
          longitudeDelta: KOZUCHOW_COORDINATES.longitudeDelta,
        }}
        mapType="hybrid"
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        toolbarEnabled={false}
      >
        {/* Rysowanie ścieżki aktywnej trasy turystycznej (Polyline) */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colorBlindMode ? '#38BDF8' : '#A78BFA'}
            strokeWidth={4 * scale}
            lineDashPattern={[0]}
          />
        )}

        {/* Pinezki wszystkich 12 zabytków na mapie Kożuchowa */}
        {PLACES.map((place) => {
          if (!place.location?.latitude || !place.location?.longitude) return null;

          const isSelected = selectedPlace?.id === place.id;
          const routeIndex = activeRouteIds.indexOf(place.id);
          const isStopInRoute = routeIndex !== -1;

          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }}
              onPress={() => handleMarkerPress(place)}
              title={place.title}
              description={place.category}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Pinezka zabytku: ${place.title}. Kategoria: ${place.category}${
                isStopInRoute ? `. Przystanek trasy numer ${routeIndex + 1}` : ''
              }`}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={[
                  styles.markerContainer,
                  { backgroundColor: colors.primary },
                  isStopInRoute && {
                    backgroundColor: colorBlindMode ? '#0284C7' : '#8B5CF6',
                  },
                  isSelected && styles.markerContainerActive,
                  highContrast && styles.highContrastMarker,
                ]}
              >
                {isStopInRoute ? (
                  <Text style={styles.markerRouteNumber}>{routeIndex + 1}</Text>
                ) : (
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
                    size={16 * scale}
                    color={colors.white}
                  />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* =========================================================================
          GÓRNY NAGŁÓWEK: PRZYCISK WYJŚCIA + KREATOR TRAS + BANER PRZYSTANKU
          Ułożone w bezpiecznym flex layout - brak jakiejkolwiek kolizji ze strzałką!
          ========================================================================= */}
      <SafeAreaView style={styles.topHeaderContainer} edges={['top']} pointerEvents="box-none">
        {/* Wiersz 1: Przycisk powrotu oraz Przycisk "Utwórz trasę dla siebie" */}
        <View style={styles.topBarRow} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.headerCircleButton, highContrast && styles.highContrastControlButton]}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Wróć do poprzedniego ekranu"
          >
            <Ionicons name="arrow-back" size={22 * scale} color={colors.textDark} />
          </TouchableOpacity>

          {/* Przycisk kreatora tras "Utwórz trasę dla siebie" (min. 48x48 dp) */}
          <TouchableOpacity
            style={[
              styles.routeCreatorPill,
              activeRoutePlaces.length > 0 && {
                backgroundColor: colorBlindMode ? '#0284C7' : '#8B5CF6',
              },
              highContrast && styles.highContrastControlButton,
            ]}
            activeOpacity={0.85}
            onPress={() => setRouteModalVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              activeRoutePlaces.length > 0
                ? `Aktywna trasa z ${activeRoutePlaces.length} przystankami. Otwórz menu trasy.`
                : 'Utwórz trasę dla siebie lub wybierz szlak AI'
            }
          >
            <Ionicons
              name="trail-sign"
              size={18 * scale}
              color={activeRoutePlaces.length > 0 ? '#FFFFFF' : colors.primary}
            />
            <Text
              style={[
                styles.routeCreatorText,
                { color: activeRoutePlaces.length > 0 ? '#FFFFFF' : colors.textDark },
                { fontSize: getScaledFontSize(13 * scale) },
              ]}
              allowFontScaling={true}
            >
              {activeRoutePlaces.length > 0
                ? `Trasa (${activeRoutePlaces.length} pkt)`
                : 'Utwórz trasę'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wiersz 2: Pasek aktywnej trasy w terenie (poniżej strzałki, z pełną widocznością) */}
        {activeRoutePlaces.length > 0 && (
          <View
            style={[
              styles.activeRouteBanner,
              { backgroundColor: colors.white },
              highContrast && styles.highContrastCard,
            ]}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`Aktywny szlak. Przystanek ${currentRouteStopIndex + 1} z ${
              activeRoutePlaces.length
            }: ${activeRoutePlaces[currentRouteStopIndex]?.title}. Całkowity dystans: ${formatDistance(
              activeRouteStats.distanceMeters
            )}.`}
          >
            <View style={styles.activeRouteInfo}>
              <View style={styles.activeRouteBadgeRow}>
                <Ionicons
                  name="navigate-circle"
                  size={14 * scale}
                  color={colorBlindMode ? '#0284C7' : '#8B5CF6'}
                />
                <Text
                  style={[
                    styles.activeRouteStopBadge,
                    { color: colorBlindMode ? '#0284C7' : '#8B5CF6' },
                    { fontSize: getScaledFontSize(11 * scale) },
                  ]}
                  allowFontScaling={true}
                >
                  PRZYSTANEK {currentRouteStopIndex + 1} Z {activeRoutePlaces.length}
                </Text>
              </View>
              <Text
                style={[
                  styles.activeRouteTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
                ]}
                numberOfLines={1}
                allowFontScaling={true}
              >
                {activeRoutePlaces[currentRouteStopIndex]?.title}
              </Text>
            </View>

            <View style={styles.activeRouteActions}>
              <TouchableOpacity
                style={[
                  styles.activeRouteNextBtn,
                  { backgroundColor: colorBlindMode ? '#0284C7' : '#8B5CF6' },
                ]}
                onPress={handleNextRouteStop}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Przejdź do kolejnego przystanku na trasie"
              >
                <Text style={styles.activeRouteNextText}>Następny</Text>
                <Ionicons name="arrow-forward" size={14 * scale} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.activeRouteCancelBtn}
                onPress={handleEndRoute}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Zakończ trasę turystyczną"
              >
                <Ionicons name="close-circle-outline" size={24 * scale} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* =========================================================================
          PŁYWAJĄCY PRZYCISK CENTROWANIA NA POZYCJI GPS TURYSTY (FAB)
          Umieszczony z prawej strony nad dolną kartą z bezpiecznym marginesem.
          ========================================================================= */}
      <View
        style={[
          styles.floatingActionsColumn,
          {
            bottom: selectedPlace
              ? Platform.OS === 'ios'
                ? 145 * scale
                : 145 * scale
              : Platform.OS === 'ios'
              ? 36 * scale
              : 28 * scale,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.floatingActionButton,
            styles.recenterActionButton,
            highContrast && styles.highContrastControlButton,
          ]}
          activeOpacity={0.8}
          onPress={handleRecenter}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Wycentruj mapę na mojej pozycji GPS"
        >
          <Ionicons
            name={hasLocationPermission ? 'locate' : 'locate-outline'}
            size={24 * scale}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* =========================================================================
          DOLNA KARTA WYBRANEGO ZABYTKU (BOTTOM SHEET)
          ========================================================================= */}
      {selectedPlace && (
        <SafeAreaView style={styles.bottomSheet} edges={['bottom']}>
          <TouchableOpacity
            style={[
              styles.placeCard,
              { backgroundColor: colors.white },
              highContrast && styles.highContrastCard,
            ]}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('CastleDetail', { placeId: selectedPlace.id })
            }
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Szczegóły: ${selectedPlace.title}, kategoria ${selectedPlace.category}, odległość: ${
              formatDistance(currentDistance) || 'brak danych'
            }. Dotknij, aby przejść do opisu.`}
          >
            <Image
              source={getImageSource(selectedPlace.imageUri)}
              style={styles.cardImage}
              resizeMode="cover"
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel={`Fotografia: ${selectedPlace.title}`}
            />

            <View style={styles.cardDetails}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primaryLight },
                    highContrast && styles.highContrastSmallBorder,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: colors.primary, fontSize: getScaledFontSize(10 * scale) },
                    ]}
                    allowFontScaling={true}
                  >
                    {selectedPlace.category}
                  </Text>
                </View>

                {currentDistance != null && (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="navigate-outline" size={11 * scale} color={colors.textMuted} />
                    <Text
                      style={[
                        styles.distanceBadgeText,
                        { color: colors.textMuted, fontSize: getScaledFontSize(10 * scale) },
                      ]}
                      allowFontScaling={true}
                    >
                      {formatDistance(currentDistance)}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.placeTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
                ]}
                numberOfLines={1}
                allowFontScaling={true}
              >
                {selectedPlace.title}
              </Text>

              <Text
                style={[
                  styles.placeAddress,
                  { color: colors.textMuted, fontSize: getScaledFontSize(12 * scale) },
                ]}
                numberOfLines={1}
                allowFontScaling={true}
              >
                {selectedPlace.location?.address}
              </Text>
            </View>

            <View style={styles.cardArrowCircle}>
              <Ionicons name="chevron-forward" size={18 * scale} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* =========================================================================
          MODAL KREATORA TRAS ("Utwórz trasę dla siebie" / Szlaki AI)
          ========================================================================= */}
      <Modal
        visible={routeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRouteModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.backgroundLight }]}
          edges={['top', 'bottom']}
        >
          {/* Nagłówek modala */}
          <View style={[styles.modalHeader, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeaderTitleBox}>
              <Ionicons name="trail-sign" size={22 * scale} color={colors.primary} />
              <Text
                style={[
                  styles.modalHeaderTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(18 * scale) },
                ]}
                allowFontScaling={true}
              >
                Planowanie trasy
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setRouteModalVisible(false)}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Zamknij kreator trasy"
            >
              <Ionicons name="close" size={26 * scale} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Przełącznik zakładek (Własna trasa / Szlaki AI) */}
          <View style={[styles.modalTabsBar, { backgroundColor: colors.white }]}>
            <TouchableOpacity
              style={[
                styles.modalTab,
                selectedRouteTab === 'custom' && [
                  styles.modalTabActive,
                  { borderColor: colors.primary },
                ],
              ]}
              onPress={() => setSelectedRouteTab('custom')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedRouteTab === 'custom' }}
            >
              <Text
                style={[
                  styles.modalTabText,
                  {
                    color: selectedRouteTab === 'custom' ? colors.primary : colors.textMuted,
                    fontSize: getScaledFontSize(13 * scale),
                  },
                ]}
                allowFontScaling={true}
              >
                Własna trasa ({draftCustomIds.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalTab,
                selectedRouteTab === 'presets' && [
                  styles.modalTabActive,
                  { borderColor: colors.primary },
                ],
              ]}
              onPress={() => setSelectedRouteTab('presets')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedRouteTab === 'presets' }}
            >
              <Text
                style={[
                  styles.modalTabText,
                  {
                    color: selectedRouteTab === 'presets' ? colors.primary : colors.textMuted,
                    fontSize: getScaledFontSize(13 * scale),
                  },
                ]}
                allowFontScaling={true}
              >
                Szlaki AI (Gotowe trasy)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Zawartość zakładek */}
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {selectedRouteTab === 'custom' ? (
              <View>
                {/* Podsumowanie wybranej trasy */}
                <View
                  style={[
                    styles.routeSummaryCard,
                    { backgroundColor: colors.white },
                    highContrast && styles.highContrastCard,
                  ]}
                >
                  <View style={styles.routeSummaryRow}>
                    <View style={styles.routeStatItem}>
                      <Ionicons name="pin" size={16 * scale} color={colors.primary} />
                      <Text style={[styles.routeStatVal, { color: colors.textDark }]}>
                        {draftCustomIds.length} przystanków
                      </Text>
                    </View>
                    <View style={styles.routeStatItem}>
                      <Ionicons name="walk" size={16 * scale} color={colors.primary} />
                      <Text style={[styles.routeStatVal, { color: colors.textDark }]}>
                        ok. {formatDistance(draftRouteStats.distanceMeters) || '0 m'}
                      </Text>
                    </View>
                    <View style={styles.routeStatItem}>
                      <Ionicons name="time" size={16 * scale} color={colors.primary} />
                      <Text style={[styles.routeStatVal, { color: colors.textDark }]}>
                        ~{draftRouteStats.estimatedMinutes} min
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.routeSummaryDesc, { color: colors.textMuted }]}>
                    Wybierz z listy obiekty, które chcesz odwiedzić w Kożuchowie. Na mapie zostanie
                    wyznaczona przejrzysta ścieżka z ponumerowanymi punktami.
                  </Text>
                </View>

                {/* Lista wszystkich 12 obiektów do wyboru */}
                <Text style={[styles.modalSectionTitle, { color: colors.textDark }]}>
                  Wybierz miejsca do odwiedzenia:
                </Text>

                {PLACES.map((p) => {
                  const isChecked = draftCustomIds.includes(p.id);
                  const orderNum = draftCustomIds.indexOf(p.id) + 1;

                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.placeSelectItem,
                        { backgroundColor: colors.white },
                        isChecked && styles.placeSelectItemActive,
                        highContrast && styles.highContrastCard,
                      ]}
                      onPress={() => togglePlaceInDraft(p.id)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      accessibilityLabel={`${p.title}, kategoria ${p.category}. ${
                        isChecked ? `Zaznaczono jako przystanek numer ${orderNum}` : 'Nie zaznaczono'
                      }`}
                    >
                      <View
                        style={[
                          styles.checkboxCircle,
                          isChecked && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        {isChecked && (
                          <Text style={styles.checkboxNumber}>{orderNum}</Text>
                        )}
                      </View>

                      <View style={styles.placeSelectInfo}>
                        <Text
                          style={[
                            styles.placeSelectTitle,
                            { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
                          ]}
                          numberOfLines={1}
                          allowFontScaling={true}
                        >
                          {p.title}
                        </Text>
                        <Text
                          style={[styles.placeSelectCategory, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {p.category} • {p.location?.address}
                        </Text>
                      </View>

                      <Ionicons
                        name={isChecked ? 'checkmark-circle' : 'add-circle-outline'}
                        size={24 * scale}
                        color={isChecked ? colors.primary : colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* Zakładka Szlaków AI */
              <View>
                <Text style={[styles.modalSectionTitle, { color: colors.textDark }]}>
                  Gotowe szlaki turystyczne przygotowane przez AI:
                </Text>

                {AI_ROUTE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      { backgroundColor: colors.white },
                      highContrast && styles.highContrastCard,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => applyRoute(preset.placeIds)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${preset.title}: ${preset.subtitle}. Czas przejścia ok. ${preset.durationMinutes} minut.`}
                  >
                    <View style={styles.presetTopRow}>
                      <View style={styles.presetBadge}>
                        <Ionicons name="sparkles" size={13 * scale} color="#8B5CF6" />
                        <Text style={styles.presetBadgeText}>Asystent AI</Text>
                      </View>
                      <Text style={[styles.presetDuration, { color: colors.primary }]}>
                        ~{preset.durationMinutes} min
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.presetTitle,
                        { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
                      ]}
                      allowFontScaling={true}
                    >
                      {preset.title}
                    </Text>

                    <Text style={[styles.presetSubtitle, { color: colors.textMuted }]}>
                      {preset.subtitle}
                    </Text>

                    <View style={styles.presetStopsList}>
                      {preset.placeIds.map((pId, idx) => {
                        const targetP = PLACES.find((item) => item.id === pId);
                        return (
                          <Text key={pId} style={styles.presetStopItem} numberOfLines={1}>
                            {idx + 1}. {targetP?.title || pId}
                          </Text>
                        );
                      })}
                    </View>

                    <View style={[styles.presetApplyBtn, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.presetApplyText, { color: colors.primary }]}>
                        Wczytaj tę trasę na mapę
                      </Text>
                      <Ionicons name="arrow-forward" size={16 * scale} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Dolny przycisk zatwierdzenia własnej trasy */}
          {selectedRouteTab === 'custom' && (
            <View style={[styles.modalBottomBar, { backgroundColor: colors.white }]}>
              <TouchableOpacity
                style={[
                  styles.applyRouteButton,
                  { backgroundColor: colors.primary },
                  draftCustomIds.length === 0 && styles.applyRouteButtonDisabled,
                  highContrast && styles.highContrastActionButton,
                ]}
                disabled={draftCustomIds.length === 0}
                onPress={() => applyRoute(draftCustomIds)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Zatwierdź i pokaż trasę na mapie"
                accessibilityState={{ disabled: draftCustomIds.length === 0 }}
              >
                <Ionicons name="map-outline" size={20 * scale} color="#FFFFFF" />
                <Text
                  style={[
                    styles.applyRouteButtonText,
                    { fontSize: getScaledFontSize(15 * scale) },
                  ]}
                  allowFontScaling={true}
                >
                  Zatwierdź trasę ({draftCustomIds.length} pkt)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F172A',
    },
    map: {
      width: '100%',
      height: '100%',
      ...StyleSheet.absoluteFillObject,
    },

    // Główny kontener nagłówka w bezpiecznej strefie
    topHeaderContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16 * scale,
      paddingTop: Platform.OS === 'android' ? 12 * scale : 4 * scale,
      zIndex: 20,
    },
    topBarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8 * scale,
    },
    headerCircleButton: {
      width: 48 * scale,
      height: 48 * scale,
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      borderRadius: 24 * scale,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
    },
    highContrastControlButton: {
      borderWidth: 2,
      borderColor: '#000000',
    },
    routeCreatorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16 * scale,
      paddingVertical: 10 * scale,
      minHeight: 48 * scale,
      borderRadius: 24 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
    },
    routeCreatorText: {
      fontWeight: '700',
    },

    // Pasek aktywnej trasy w terenie (gdy turysta idzie trasą)
    activeRouteBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16 * scale,
      paddingHorizontal: 14 * scale,
      paddingVertical: 10 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    activeRouteInfo: {
      flex: 1,
      marginRight: 10 * scale,
    },
    activeRouteBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
      marginBottom: 2 * scale,
    },
    activeRouteStopBadge: {
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    activeRouteTitle: {
      fontWeight: '700',
    },
    activeRouteActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
    },
    activeRouteNextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
      paddingHorizontal: 10 * scale,
      paddingVertical: 8 * scale,
      borderRadius: 12 * scale,
      minHeight: 40 * scale,
    },
    activeRouteNextText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 12 * scale,
    },
    activeRouteCancelBtn: {
      padding: 4 * scale,
      minWidth: 44 * scale,
      minHeight: 44 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Pływający przycisk centrowania GPS po prawej stronie (FAB)
    floatingActionsColumn: {
      position: 'absolute',
      right: 16 * scale,
      alignItems: 'center',
      zIndex: 15,
    },
    floatingActionButton: {
      borderRadius: 26 * scale,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    recenterActionButton: {
      width: 52 * scale,
      height: 52 * scale,
      minWidth: 52 * scale,
      minHeight: 52 * scale,
    },

    // Pinezki na mapie
    markerContainer: {
      width: 34 * scale,
      height: 34 * scale,
      borderRadius: 17 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 5,
    },
    markerContainerActive: {
      transform: [{ scale: 1.25 }],
      borderColor: '#F59E0B',
      borderWidth: 3,
    },
    highContrastMarker: {
      borderColor: '#000000',
      borderWidth: 3,
    },
    markerRouteNumber: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 14 * scale,
    },

    // Dolna karta wybranego miejsca (Bottom Sheet)
    bottomSheet: {
      position: 'absolute',
      bottom: 16 * scale,
      left: 16 * scale,
      right: 16 * scale,
      zIndex: 10,
    },
    placeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20 * scale,
      padding: 10 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      minHeight: 88 * scale,
    },
    highContrastCard: {
      borderWidth: 2,
      borderColor: '#000000',
    },
    cardImage: {
      width: 72 * scale,
      height: 72 * scale,
      borderRadius: 14 * scale,
    },
    cardDetails: {
      flex: 1,
      marginLeft: 12 * scale,
      marginRight: 8 * scale,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6 * scale,
      marginBottom: 4 * scale,
    },
    badge: {
      paddingHorizontal: 8 * scale,
      paddingVertical: 2 * scale,
      borderRadius: 6 * scale,
      alignSelf: 'flex-start',
    },
    highContrastSmallBorder: {
      borderWidth: 1,
      borderColor: '#000000',
    },
    badgeText: {
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2 * scale,
    },
    distanceBadgeText: {
      fontWeight: '600',
    },
    placeTitle: {
      fontWeight: '700',
      marginBottom: 2 * scale,
    },
    placeAddress: {
      fontWeight: '500',
    },
    cardArrowCircle: {
      width: 36 * scale,
      height: 36 * scale,
      borderRadius: 18 * scale,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Style Modala Kreatora Tras
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    modalHeaderTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
    },
    modalHeaderTitle: {
      fontWeight: '700',
    },
    modalCloseBtn: {
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTabsBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    modalTab: {
      flex: 1,
      paddingVertical: 12 * scale,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      minHeight: 48 * scale,
      justifyContent: 'center',
    },
    modalTabActive: {},
    modalTabText: {
      fontWeight: '700',
    },
    modalScrollContent: {
      padding: 16 * scale,
      paddingBottom: 40 * scale,
    },
    routeSummaryCard: {
      borderRadius: 16 * scale,
      padding: 14 * scale,
      marginBottom: 16 * scale,
    },
    routeSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8 * scale,
    },
    routeStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
    },
    routeStatVal: {
      fontWeight: '700',
      fontSize: 12 * scale,
    },
    routeSummaryDesc: {
      fontSize: 12 * scale,
      lineHeight: 18 * scale,
    },
    modalSectionTitle: {
      fontWeight: '700',
      fontSize: 15 * scale,
      marginBottom: 12 * scale,
    },
    placeSelectItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14 * scale,
      padding: 12 * scale,
      marginBottom: 8 * scale,
      minHeight: 64 * scale,
    },
    placeSelectItemActive: {
      borderWidth: 1.5,
      borderColor: '#8B5CF6',
    },
    checkboxCircle: {
      width: 24 * scale,
      height: 24 * scale,
      borderRadius: 12 * scale,
      borderWidth: 1.5,
      borderColor: '#94A3B8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12 * scale,
    },
    checkboxNumber: {
      color: '#FFFFFF',
      fontSize: 11 * scale,
      fontWeight: '800',
    },
    placeSelectInfo: {
      flex: 1,
      marginRight: 8 * scale,
    },
    placeSelectTitle: {
      fontWeight: '600',
      marginBottom: 2 * scale,
    },
    placeSelectCategory: {
      fontSize: 12 * scale,
    },
    modalBottomBar: {
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    applyRouteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8 * scale,
      borderRadius: 16 * scale,
      minHeight: 52 * scale,
    },
    applyRouteButtonDisabled: {
      opacity: 0.5,
    },
    applyRouteButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    highContrastActionButton: {
      borderWidth: 2,
      borderColor: '#000000',
    },

    // Karty szlaków AI
    presetCard: {
      borderRadius: 16 * scale,
      padding: 16 * scale,
      marginBottom: 14 * scale,
    },
    presetTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6 * scale,
    },
    presetBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
      backgroundColor: '#F3E8FF',
      paddingHorizontal: 8 * scale,
      paddingVertical: 3 * scale,
      borderRadius: 8 * scale,
    },
    presetBadgeText: {
      color: '#8B5CF6',
      fontWeight: '700',
      fontSize: 11 * scale,
    },
    presetDuration: {
      fontWeight: '800',
      fontSize: 13 * scale,
    },
    presetTitle: {
      fontWeight: '700',
      marginBottom: 4 * scale,
    },
    presetSubtitle: {
      fontSize: 12 * scale,
      marginBottom: 10 * scale,
    },
    presetStopsList: {
      marginBottom: 12 * scale,
      gap: 2 * scale,
    },
    presetStopItem: {
      fontSize: 12 * scale,
      color: '#475569',
    },
    presetApplyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12 * scale,
      paddingVertical: 10 * scale,
      borderRadius: 12 * scale,
      minHeight: 44 * scale,
    },
    presetApplyText: {
      fontWeight: '700',
      fontSize: 13 * scale,
    },
  });