// src/screens/SettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';
import { useScaledStyles } from '../hooks/useScale';

/**
 * Ekran ustawień aplikacji (SettingsScreen) z zaawansowaną konfiguracją dostępności cyfrowej (WCAG 2.1 AA).
 * Umożliwia włączenie trybu dla osób z daltonizmem, wysokiego kontrastu oraz powiększonego tekstu.
 *
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function SettingsScreen({ navigation }) {
  const { scale, styles } = useScaledStyles(createStyles);
  const {
    colorBlindMode,
    highContrast,
    largeText,
    colors,
    toggleColorBlindMode,
    toggleHighContrast,
    toggleLargeText,
    resetAccessibilitySettings,
    getScaledFontSize,
  } = useAccessibility();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundLight }]} edges={['top']}>
      {/* Pasek nagłówka z przyciskiem powrotu */}
      <View style={[styles.header, highContrast && styles.highContrastHeader]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Wróć do poprzedniego ekranu"
          accessibilityHint="Wraca do głównego widoku aplikacji"
        >
          <Ionicons name="arrow-back" size={24 * scale} color={colors.textDark} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.textDark, fontSize: getScaledFontSize(22 * scale) },
          ]}
          accessible={true}
          accessibilityRole="header"
        >
          Ustawienia
        </Text>

        <View style={styles.headerSpacer} pointerEvents="none" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
            INFORMACYJNA PLAKIETKA: EKRAN W FAZIE ROZWOJU
            Wyraźne powiadomienie użytkownika o trwających pracach nad rozbudową funkcji.
           ========================================================================= */}
        <View
          style={[
            styles.developmentBanner,
            highContrast && styles.highContrastBanner,
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="Uwaga: Ekran w fazie rozwoju. Funkcjonalność aplikacji będzie stale rozwijana i wzbogacana o nowe moduły turystyczne."
        >
          <View style={styles.bannerIconBox}>
            <Ionicons name="construct" size={22 * scale} color="#B45309" />
          </View>
          <View style={styles.bannerTextBox}>
            <View style={styles.bannerTitleRow}>
              <Text
                style={[
                  styles.bannerTitle,
                  { fontSize: getScaledFontSize(14 * scale) },
                ]}
              >
                Ekran w fazie rozwoju
              </Text>
              <View style={styles.betaBadge}>
                <Text style={styles.betaBadgeText}>BETA</Text>
              </View>
            </View>
            <Text
              style={[
                styles.bannerDescription,
                { fontSize: getScaledFontSize(12 * scale) },
              ]}
            >
              Pracujemy nad kolejnymi funkcjami przewodnika. Dostępność cyfrowa i moduły personalizacji są stale udoskonalane.
            </Text>
          </View>
        </View>

        {/* =========================================================================
            SEKCJA: DOSTĘPNOŚĆ (ACCESSIBILITY / WCAG 2.1 AA)
           ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="body" size={20 * scale} color={colors.primary} />
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(18 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Dostępność (WCAG 2.1)
          </Text>
        </View>

        <View
          style={[
            styles.cardContainer,
            { backgroundColor: colors.white },
            highContrast && styles.highContrastCard,
          ]}
        >
          {/* 1. Przełącznik: Tryb dla daltonistów */}
          <View
            style={[
              styles.settingRow,
              highContrast && styles.highContrastDivider,
            ]}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="color-filter-outline"
                size={22 * scale}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
                  ]}
                >
                  Tryb dla daltonistów
                </Text>
                {colorBlindMode && (
                  <View style={styles.statusIndicatorActive}>
                    <Ionicons name="checkmark-circle" size={14 * scale} color="#0284C7" />
                    <Text style={styles.statusIndicatorText}>Aktywny</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                Zastępuje problematyczne pary kolorów (np. czerwień–zieleń) bezpieczną paletą i dubluje statusy ikonami oraz tekstem.
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={colorBlindMode}
                onValueChange={toggleColorBlindMode}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.white}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Tryb dla daltonistów"
                accessibilityHint="Włącza lub wyłącza paletę bezpieczną dla osób z zaburzeniami rozpoznawania barw"
                accessibilityState={{ checked: colorBlindMode }}
              />
            </View>
          </View>

          {/* 2. Przełącznik: Wysoki kontrast */}
          <View
            style={[
              styles.settingRow,
              highContrast && styles.highContrastDivider,
            ]}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="contrast-outline"
                size={22 * scale}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
                  ]}
                >
                  Wysoki kontrast
                </Text>
                {highContrast && (
                  <View style={styles.statusIndicatorActive}>
                    <Ionicons name="checkmark-circle" size={14 * scale} color="#004B87" />
                    <Text style={styles.statusIndicatorText}>Aktywny</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                Gwarantuje kontrast tekstu od 7:1 (standard WCAG AAA) oraz wyraźne, pogrubione krawędzie elementów interfejsu.
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={highContrast}
                onValueChange={toggleHighContrast}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.white}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Wysoki kontrast"
                accessibilityHint="Włącza lub wyłącza tryb maksymalnego kontrastu tekstu i obramowań"
                accessibilityState={{ checked: highContrast }}
              />
            </View>
          </View>

          {/* 3. Przełącznik: Większy tekst */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="text-outline"
                size={22 * scale}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
                  ]}
                >
                  Większy tekst
                </Text>
                {largeText && (
                  <View style={styles.statusIndicatorActive}>
                    <Ionicons name="checkmark-circle" size={14 * scale} color="#0D6EFD" />
                    <Text style={styles.statusIndicatorText}>Aktywny</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                Zwiększa bazowy rozmiar fontu w całej aplikacji o 25%, ułatwiając czytanie bez zniekształcania układu.
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={largeText}
                onValueChange={toggleLargeText}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.white}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Większy tekst"
                accessibilityHint="Powiększa rozmiar czcionek w całej aplikacji"
                accessibilityState={{ checked: largeText }}
              />
            </View>
          </View>
        </View>

        {/* =========================================================================
            PODGLĄD NA ŻYWO (LIVE ACCESSIBILITY PREVIEW)
            Pokazuje użytkownikowi w czasie rzeczywistym, jak wybrane ustawienia
            wpływają na czytelność elementów, przycisków i etykiet stanu.
           ========================================================================= */}
        <View style={styles.previewSection}>
          <Text
            style={[
              styles.previewSectionTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
            ]}
          >
            Podgląd wybranych ułatwień dostępu:
          </Text>

          <View
            style={[
              styles.previewCard,
              { backgroundColor: colors.white },
              highContrast && styles.highContrastCard,
            ]}
          >
            <View style={styles.previewBadgeRow}>
              <View
                style={[
                  styles.previewBadge,
                  {
                    backgroundColor: colorBlindMode ? '#E0F2FE' : '#DCFCE7',
                    borderColor: colorBlindMode ? '#0284C7' : '#16A34A',
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={colorBlindMode ? 'information-circle' : 'checkmark-circle'}
                  size={14 * scale}
                  color={colorBlindMode ? '#0284C7' : '#16A34A'}
                />
                <Text
                  style={[
                    styles.previewBadgeText,
                    {
                      color: colorBlindMode ? '#0369A1' : '#15803D',
                      fontSize: getScaledFontSize(11 * scale),
                    },
                  ]}
                >
                  {colorBlindMode ? 'Status: Bezpieczny dla wzroku' : 'Status: Dostępny'}
                </Text>
              </View>

              <View
                style={[
                  styles.previewBadge,
                  {
                    backgroundColor: colorBlindMode ? '#FAE8FF' : '#FEE2E2',
                    borderColor: colorBlindMode ? '#C026D3' : '#EF4444',
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={colorBlindMode ? 'alert-circle' : 'close-circle'}
                  size={14 * scale}
                  color={colorBlindMode ? '#C026D3' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.previewBadgeText,
                    {
                      color: colorBlindMode ? '#86198F' : '#B91C1C',
                      fontSize: getScaledFontSize(11 * scale),
                    },
                  ]}
                >
                  {colorBlindMode ? 'Informacja: Ostrzeżenie' : 'Status: Błąd'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.previewButton,
                { backgroundColor: colors.primary },
                highContrast && styles.highContrastButton,
              ]}
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Przykładowy przycisk demonstracyjny"
            >
              <Ionicons name="eye-outline" size={18 * scale} color={colors.white} />
              <Text
                style={[
                  styles.previewButtonText,
                  { fontSize: getScaledFontSize(14 * scale) },
                ]}
              >
                Przykładowy przycisk ({highContrast ? 'Wysoki kontrast' : 'Standard'})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Przycisk resetowania ustawień dostępności */}
        {(colorBlindMode || highContrast || largeText) && (
          <TouchableOpacity
            style={[
              styles.resetButton,
              highContrast && styles.highContrastResetButton,
            ]}
            onPress={resetAccessibilitySettings}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Przywróć domyślne ustawienia dostępności"
          >
            <Ionicons name="refresh-outline" size={18 * scale} color={colors.danger} />
            <Text
              style={[
                styles.resetButtonText,
                { color: colors.danger, fontSize: getScaledFontSize(13 * scale) },
              ]}
            >
              Przywróć domyślne ustawienia
            </Text>
          </TouchableOpacity>
        )}

        {/* Informacje o wersji i certyfikacji */}
        <View style={styles.footerInfo}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textMuted, fontSize: getScaledFontSize(11 * scale) },
            ]}
          >
            Visit Kożuchów • Wersja 1.0 (Kompilacja testowa)
          </Text>
          <Text
            style={[
              styles.footerSubText,
              { color: colors.textMuted, fontSize: getScaledFontSize(10 * scale) },
            ]}
          >
            Projekt realizowany w oparciu o wytyczne WCAG 2.1 na poziomie AA
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    highContrastHeader: {
      borderBottomWidth: 2,
      borderBottomColor: '#000000',
    },
    backButton: {
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      borderRadius: 24 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerSpacer: {
      width: 48 * scale,
      height: 48 * scale,
    },
    scrollContent: {
      paddingHorizontal: 18 * scale,
      paddingTop: 16 * scale,
      paddingBottom: 40 * scale,
    },
    developmentBanner: {
      flexDirection: 'row',
      backgroundColor: '#FEF3C7',
      borderRadius: 16 * scale,
      padding: 14 * scale,
      marginBottom: 20 * scale,
      borderWidth: 1.5,
      borderColor: '#F59E0B',
      gap: 12 * scale,
      alignItems: 'flex-start',
    },
    highContrastBanner: {
      backgroundColor: '#FFFBEB',
      borderColor: '#000000',
      borderWidth: 2.5,
    },
    bannerIconBox: {
      width: 36 * scale,
      height: 36 * scale,
      borderRadius: 18 * scale,
      backgroundColor: '#FDE68A',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2 * scale,
    },
    bannerTextBox: {
      flex: 1,
    },
    bannerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      marginBottom: 4 * scale,
    },
    bannerTitle: {
      fontWeight: '800',
      color: '#92400E',
    },
    betaBadge: {
      backgroundColor: '#D97706',
      paddingHorizontal: 6 * scale,
      paddingVertical: 2 * scale,
      borderRadius: 6 * scale,
    },
    betaBadgeText: {
      color: '#FFFFFF',
      fontSize: 9 * scale,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    bannerDescription: {
      color: '#78350F',
      lineHeight: 18 * scale,
      fontWeight: '500',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      marginBottom: 12 * scale,
      paddingHorizontal: 4 * scale,
    },
    sectionTitle: {
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    cardContainer: {
      borderRadius: 18 * scale,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      overflow: 'hidden',
      marginBottom: 20 * scale,
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
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16 * scale,
      minHeight: 64 * scale,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      gap: 12 * scale,
    },
    highContrastDivider: {
      borderBottomWidth: 1.5,
      borderBottomColor: '#000000',
    },
    settingIconContainer: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingInfo: {
      flex: 1,
    },
    settingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      marginBottom: 3 * scale,
    },
    settingTitle: {
      fontWeight: '700',
    },
    statusIndicatorActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3 * scale,
      backgroundColor: '#F0F9FF',
      paddingHorizontal: 6 * scale,
      paddingVertical: 1.5 * scale,
      borderRadius: 6 * scale,
    },
    statusIndicatorText: {
      fontSize: 10 * scale,
      fontWeight: '700',
      color: '#0284C7',
    },
    settingDescription: {
      lineHeight: 17 * scale,
    },
    switchWrapper: {
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewSection: {
      marginBottom: 20 * scale,
    },
    previewSectionTitle: {
      fontWeight: '700',
      marginBottom: 8 * scale,
      paddingHorizontal: 4 * scale,
    },
    previewCard: {
      borderRadius: 16 * scale,
      padding: 16 * scale,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      gap: 12 * scale,
    },
    previewBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8 * scale,
    },
    previewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5 * scale,
      paddingHorizontal: 10 * scale,
      paddingVertical: 5 * scale,
      borderRadius: 8 * scale,
    },
    previewBadgeText: {
      fontWeight: '700',
    },
    previewButton: {
      minHeight: 48 * scale,
      borderRadius: 14 * scale,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8 * scale,
      paddingHorizontal: 16 * scale,
    },
    highContrastButton: {
      borderWidth: 2.5,
      borderColor: '#000000',
    },
    previewButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6 * scale,
      minHeight: 48 * scale,
      paddingVertical: 10 * scale,
      borderRadius: 12 * scale,
      backgroundColor: '#FEE2E2',
      marginBottom: 24 * scale,
    },
    highContrastResetButton: {
      borderWidth: 2,
      borderColor: '#991B1B',
    },
    resetButtonText: {
      fontWeight: '700',
    },
    footerInfo: {
      alignItems: 'center',
      gap: 4 * scale,
      marginTop: 8 * scale,
    },
    footerText: {
      fontWeight: '600',
    },
    footerSubText: {
      textAlign: 'center',
    },
  });
