// src/screens/QRScannerScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { placesService } from '../services/placesService';
import { PLACES } from '../data/places';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { useScaledStyles } from '../hooks/useScale';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BARCODE_SETTINGS = {
  barcodeTypes: ['qr'],
};

/**
 * Ekran skanera kodów QR (QRScannerScreen).
 * Spełnia standardy dostępności WCAG 2.1 AA:
 * - Przyciski dotykowe o wymiarach min. 48x48 dp (Touch Target)
 * - Komunikaty głosowe dla czytników ekranu (announceForAccessibility)
 * - Etykiety i stany przycisków w języku wybranym przez użytkownika.
 *
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function QRScannerScreen({ navigation }) {
  const { scale, styles } = useScaledStyles(createStyles);
  const { colors, highContrast, getScaledFontSize } = useAccessibility();
  const { t } = useLanguage();

  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);

  // Natychmiastowa flaga blokująca wielokrotne wywołanie skanowania
  const isScanningRef = useRef(false);

  // Resetowanie flagi skanera przy każdym powrocie na ekran
  useFocusEffect(
    useCallback(() => {
      isScanningRef.current = false;
    }, [])
  );

  // Obsługa odczytanego kodu QR
  const handleBarcodeScanned = async ({ data }) => {
    if (isScanningRef.current || !data) return;
    isScanningRef.current = true;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility(t('qr.scanSuccess'));

    const raw = String(data).trim();

    try {
      // 1. Wyszukiwanie po kodzie QR w bazie obiektów i sal (np. KZ-01-PLACE, KZ-01-ROOM)
      let foundPlace = await placesService.getPlaceByQrCode(raw);

      // 2. Wyszukiwanie bezpośrednio po ID zabytku lub sali (np. place_01, room_01)
      if (!foundPlace) {
        foundPlace = await placesService.getPlaceById(raw);
      }

      // 3. Wyszukiwanie podciągu kodu w bazie (np. jeśli kod QR zawiera pełny adres URL)
      if (!foundPlace) {
        const lowerRaw = raw.toLowerCase();
        for (const p of PLACES) {
          if (lowerRaw.includes(p.qrCode?.toLowerCase()) || lowerRaw.includes(p.id?.toLowerCase())) {
            foundPlace = p;
            break;
          }
          if (Array.isArray(p.rooms)) {
            const matchingRoom = p.rooms.find(
              (r) => lowerRaw.includes(r.qrCode?.toLowerCase()) || lowerRaw.includes(r.id?.toLowerCase())
            );
            if (matchingRoom) {
              foundPlace = { ...matchingRoom, parentPlaceId: p.id };
              break;
            }
          }
        }
      }

      if (foundPlace) {
        navigation.navigate('CastleDetail', {
          placeId: foundPlace.id,
          placeData: foundPlace,
        });
      } else {
        Alert.alert(
          t('common.error'),
          `${t('qr.scanFailed')}\n("${raw}")`,
          [
            {
              text: t('common.close'),
              onPress: () => {
                isScanningRef.current = false;
              },
            },
          ]
        );
      }
    } catch {
      isScanningRef.current = false;
    }
  };

  if (!permission) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.white }]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Sprawdzanie uprawnień do kamery"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.white }]}>
        <Ionicons name="camera-outline" size={64 * scale} color={colors.primary} />
        <Text
          style={[
            styles.permissionTitle,
            { color: colors.textDark, fontSize: getScaledFontSize(20 * scale) },
          ]}
          allowFontScaling={true}
        >
          {t('qr.title')}
        </Text>
        <Text
          style={[
            styles.permissionMessage,
            { color: colors.textMuted, fontSize: getScaledFontSize(14 * scale) },
          ]}
          allowFontScaling={true}
        >
          {t('qr.cameraPermission')}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={requestPermission}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('qr.grantPermission')}
        >
          <Text
            style={[
              styles.permissionButtonText,
              { fontSize: getScaledFontSize(16 * scale) },
            ]}
            allowFontScaling={true}
          >
            {t('qr.grantPermission')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text
            style={[
              styles.backLinkText,
              { color: colors.textMuted, fontSize: getScaledFontSize(14 * scale) },
            ]}
            allowFontScaling={true}
          >
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Warstwa 1: Natywny podgląd kamery na pełnym ekranie */}
      <CameraView
        style={styles.cameraLayer}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={BARCODE_SETTINGS}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Warstwa 2: Nakładka interfejsu użytkownika na widok kamery */}
      <SafeAreaView style={styles.uiOverlay} edges={['top', 'bottom']} pointerEvents="box-none">
        {/* Górny pasek: powrót, tytuł oraz przełącznik latarki (min. 48x48) */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            accessibilityHint="Zamyka aparat i wraca do poprzedniego widoku"
          >
            <Ionicons name="close" size={26 * scale} color="#FFFFFF" />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { fontSize: getScaledFontSize(18 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
            allowFontScaling={true}
          >
            {t('nav.qr')}
          </Text>

          <TouchableOpacity
            style={[styles.iconButton, torchEnabled && styles.iconButtonActive]}
            activeOpacity={0.7}
            onPress={() => setTorchEnabled((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? 'Wyłącz latarkę' : 'Włącz latarkę'}
            accessibilityState={{ checked: torchEnabled }}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={22 * scale}
              color={torchEnabled ? '#FFD60A' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Ramka celownika wycentrowana na środku ekranu */}
        <View style={styles.targetWrapper} pointerEvents="none">
          <View
            style={[
              styles.targetFrame,
              { width: 250 * scale, height: 250 * scale },
            ]}
          >
            <View
              style={[
                styles.corner,
                styles.topLeft,
                { borderColor: colors.primary },
                highContrast && styles.highContrastCorner,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.topRight,
                { borderColor: colors.primary },
                highContrast && styles.highContrastCorner,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomLeft,
                { borderColor: colors.primary },
                highContrast && styles.highContrastCorner,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomRight,
                { borderColor: colors.primary },
                highContrast && styles.highContrastCorner,
              ]}
            />
          </View>
          <Text
            style={[
              styles.hintText,
              { fontSize: getScaledFontSize(15 * scale) },
            ]}
            allowFontScaling={true}
          >
            {t('qr.subtitle')}
          </Text>
        </View>

        {/* Odstęp dolny dla zachowania symetrii układu flex */}
        <View style={styles.bottomSpacer} pointerEvents="none" />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    cameraLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    uiOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      zIndex: 10,
      elevation: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20 * scale,
    },
    topBar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8 * scale,
    },
    // WCAG Touch Target: min. 48x48 dp
    iconButton: {
      width: 48 * scale,
      height: 48 * scale,
      minWidth: 48,
      minHeight: 48,
      borderRadius: 24 * scale,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      borderWidth: 1 * scale,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonActive: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#FFD60A',
    },
    headerTitle: {
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    targetWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    targetFrame: {
      position: 'relative',
      backgroundColor: 'transparent',
    },
    corner: {
      position: 'absolute',
      width: 36 * scale,
      height: 36 * scale,
    },
    highContrastCorner: {
      borderColor: '#FFFFFF',
      borderWidth: 5,
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 4 * scale,
      borderLeftWidth: 4 * scale,
      borderTopLeftRadius: 14 * scale,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 4 * scale,
      borderRightWidth: 4 * scale,
      borderTopRightRadius: 14 * scale,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4 * scale,
      borderLeftWidth: 4 * scale,
      borderBottomLeftRadius: 14 * scale,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4 * scale,
      borderRightWidth: 4 * scale,
      borderBottomRightRadius: 14 * scale,
    },
    hintText: {
      marginTop: 22 * scale,
      color: '#FFFFFF',
      textAlign: 'center',
      width: 280 * scale,
      lineHeight: 22 * scale,
      fontWeight: '600',
      textShadowColor: 'rgba(0, 0, 0, 0.9)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    bottomSpacer: {
      width: 48 * scale,
      height: 48 * scale,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28 * scale,
    },
    permissionTitle: {
      fontWeight: '700',
      marginTop: 20 * scale,
      marginBottom: 10 * scale,
      textAlign: 'center',
    },
    permissionMessage: {
      textAlign: 'center',
      lineHeight: 22 * scale,
      marginBottom: 28 * scale,
    },
    permissionButton: {
      paddingVertical: 14 * scale,
      paddingHorizontal: 28 * scale,
      borderRadius: 24 * scale,
      minHeight: 48 * scale,
      minWidth: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    permissionButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    backLink: {
      marginTop: 18 * scale,
      padding: 10 * scale,
      minHeight: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backLinkText: {
      fontWeight: '600',
    },
  });