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
import { useLanguage } from '../context/LanguageContext';
import { useScaledStyles } from '../hooks/useScale';

/**
 * Ekran ustawień aplikacji (SettingsScreen).
 * Zapewnia spójną, minimalistyczną konfigurację:
 * 1. Motywu wyglądu (Systemowy / Jasny / Ciemny)
 * 2. Języka aplikacji (Polski, English, Deutsch)
 * 3. Ułatwień dostępu (WCAG 2.1 AA)
 * 4. Informacji o wersji przewodnika
 *
 * @param {object} navigation - Obiekt nawigacji React Navigation
 */
export default function SettingsScreen({ navigation }) {
  const { scale, styles } = useScaledStyles(createStyles);
  const { language, setLanguage, t } = useLanguage();
  const {
    themeMode,
    isDarkMode,
    setThemeMode,
    colorBlindMode,
    highContrast,
    largeText,
    reduceMotion,
    colors,
    toggleColorBlindMode,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    resetAccessibilitySettings,
    getScaledFontSize,
  } = useAccessibility();

  // Opcje motywu do wyboru w segmencie
  const themeOptions = [
    {
      id: 'system',
      label: t('settings.themeSystem'),
      icon: 'phone-portrait-outline',
    },
    {
      id: 'light',
      label: t('settings.themeLight'),
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      label: t('settings.themeDark'),
      icon: 'moon-outline',
    },
  ];

  // Lista dostępnych języków
  const languageOptions = [
    { code: 'pl', name: t('settings.languages.pl'), flag: '🇵🇱' },
    { code: 'en', name: t('settings.languages.en'), flag: '🇬🇧' },
    { code: 'de', name: t('settings.languages.de'), flag: '🇩🇪' },
  ];

  // Flaga informująca, czy jakiekolwiek opcje dostępności są aktywne
  const hasCustomA11y = colorBlindMode || highContrast || largeText || reduceMotion;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.backgroundLight }]}
      edges={['top']}
    >
      {/* Pasek nagłówka */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.borderLight },
          highContrast && styles.highContrastHeader,
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          accessibilityHint="Wraca do głównego widoku"
        >
          <Ionicons name="arrow-back" size={24 * scale} color={colors.textDark} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.textDark, fontSize: getScaledFontSize(20 * scale) },
          ]}
          accessible={true}
          accessibilityRole="header"
        >
          {t('settings.title')}
        </Text>

        <View style={styles.headerSpacer} pointerEvents="none" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
            SEKCJA 1: MOTYW I WYGLĄD (THEME / APPEARANCE)
           ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="color-palette-outline" size={18 * scale} color={colors.primaryAccessible} />
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            {t('settings.themeSection')}
          </Text>
        </View>

        <View
          style={[
            styles.cardContainer,
            { backgroundColor: colors.white, borderColor: colors.borderLight },
            highContrast && styles.highContrastCard,
          ]}
        >
          <Text
            style={[
              styles.cardDescription,
              { color: colors.textSecondary, fontSize: getScaledFontSize(13 * scale) },
            ]}
          >
            {t('settings.themeDesc')}
          </Text>

          {/* 3-segmentowy przełącznik motywu */}
          <View
            style={[
              styles.segmentedBar,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
            ]}
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('settings.themeSection')}
          >
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.segmentButton,
                    isSelected && [
                      styles.segmentButtonActive,
                      {
                        backgroundColor: isDarkMode ? colors.primaryLight : colors.white,
                        borderColor: isDarkMode ? colors.primary : colors.borderLight,
                      },
                    ],
                    highContrast && isSelected && styles.highContrastSegmentActive,
                  ]}
                  onPress={() => setThemeMode(opt.id)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={`${opt.label}. ${isSelected ? 'Aktywny' : 'Wybierz'}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18 * scale}
                    color={isSelected ? colors.primaryAccessible : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isSelected ? colors.primaryAccessible : colors.textSecondary,
                        fontSize: getScaledFontSize(13 * scale),
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* =========================================================================
            SEKCJA 2: JĘZYK APLIKACJI (LANGUAGE SELECTION)
           ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="globe-outline" size={18 * scale} color={colors.primaryAccessible} />
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            {t('settings.languageSection')}
          </Text>
        </View>

        <View
          style={[
            styles.cardContainer,
            { backgroundColor: colors.white, borderColor: colors.borderLight },
            highContrast && styles.highContrastCard,
          ]}
        >
          {languageOptions.map((langItem, index) => {
            const isSelected = language === langItem.code;
            const isLast = index === languageOptions.length - 1;

            return (
              <TouchableOpacity
                key={langItem.code}
                style={[
                  styles.languageRow,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.borderLight,
                  },
                  isSelected && {
                    backgroundColor: isDarkMode ? colors.primaryLight : '#F0F9FF',
                  },
                  highContrast && isSelected && styles.highContrastLanguageSelected,
                ]}
                onPress={() => setLanguage(langItem.code)}
                activeOpacity={0.65}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${langItem.name}. ${isSelected ? 'Aktywny' : 'Wybierz'}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.languageFlag}>{langItem.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    {
                      color: isSelected ? colors.primaryAccessible : colors.textDark,
                      fontSize: getScaledFontSize(14 * scale),
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {langItem.name}
                </Text>
                {isSelected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20 * scale}
                    color={colors.primaryAccessible}
                  />
                ) : (
                  <Ionicons
                    name="ellipse-outline"
                    size={18 * scale}
                    color={colors.borderMuted}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* =========================================================================
            SEKCJA 3: DOSTĘPNOŚĆ CYFROWA (WCAG 2.1 AA)
           ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="accessibility-outline" size={18 * scale} color={colors.primaryAccessible} />
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textDark, fontSize: getScaledFontSize(15 * scale) },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            {t('settings.accessibilitySection')}
          </Text>
        </View>

        <View
          style={[
            styles.cardContainer,
            { backgroundColor: colors.white, borderColor: colors.borderLight },
            highContrast && styles.highContrastCard,
          ]}
        >
          {/* 1. Daltonizm */}
          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.borderLight },
              highContrast && styles.highContrastDivider,
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons
                name="color-filter-outline"
                size={20 * scale}
                color={colors.primaryAccessible}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
                ]}
              >
                {t('settings.colorBlind')}
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                {t('settings.colorBlindDesc')}
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={colorBlindMode}
                onValueChange={toggleColorBlindMode}
                trackColor={{
                  false: isDarkMode ? '#334155' : '#CBD5E1',
                  true: colors.primary,
                }}
                thumbColor={colors.white}
                ios_backgroundColor={isDarkMode ? '#334155' : '#CBD5E1'}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={t('settings.colorBlind')}
                accessibilityState={{ checked: colorBlindMode }}
              />
            </View>
          </View>

          {/* 2. Wysoki kontrast */}
          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.borderLight },
              highContrast && styles.highContrastDivider,
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons
                name="contrast-outline"
                size={20 * scale}
                color={colors.primaryAccessible}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
                ]}
              >
                {t('settings.highContrast')}
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                {t('settings.highContrastDesc')}
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={highContrast}
                onValueChange={toggleHighContrast}
                trackColor={{
                  false: isDarkMode ? '#334155' : '#CBD5E1',
                  true: colors.primary,
                }}
                thumbColor={colors.white}
                ios_backgroundColor={isDarkMode ? '#334155' : '#CBD5E1'}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={t('settings.highContrast')}
                accessibilityState={{ checked: highContrast }}
              />
            </View>
          </View>

          {/* 3. Większy tekst */}
          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.borderLight },
              highContrast && styles.highContrastDivider,
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons
                name="text-outline"
                size={20 * scale}
                color={colors.primaryAccessible}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
                ]}
              >
                {t('settings.largeText')}
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                {t('settings.largeTextDesc')}
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={largeText}
                onValueChange={toggleLargeText}
                trackColor={{
                  false: isDarkMode ? '#334155' : '#CBD5E1',
                  true: colors.primary,
                }}
                thumbColor={colors.white}
                ios_backgroundColor={isDarkMode ? '#334155' : '#CBD5E1'}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={t('settings.largeText')}
                accessibilityState={{ checked: largeText }}
              />
            </View>
          </View>

          {/* 4. Ograniczenie animacji */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons
                name="pulse-outline"
                size={20 * scale}
                color={colors.primaryAccessible}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
                ]}
              >
                {t('settings.reduceMotion')}
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(12 * scale) },
                ]}
              >
                {t('settings.reduceMotionDesc')}
              </Text>
            </View>

            <View style={styles.switchWrapper}>
              <Switch
                value={reduceMotion}
                onValueChange={toggleReduceMotion}
                trackColor={{
                  false: isDarkMode ? '#334155' : '#CBD5E1',
                  true: colors.primary,
                }}
                thumbColor={colors.white}
                ios_backgroundColor={isDarkMode ? '#334155' : '#CBD5E1'}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={t('settings.reduceMotion')}
                accessibilityState={{ checked: reduceMotion }}
              />
            </View>
          </View>
        </View>

        {/* Przycisk resetowania opcji dostępności (widoczny tylko po zmianie) */}
        {hasCustomA11y && (
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: isDarkMode ? '#2D1515' : '#FEE2E2',
                borderColor: colors.danger,
              },
              highContrast && styles.highContrastResetButton,
            ]}
            onPress={resetAccessibilitySettings}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('settings.resetBtn')}
          >
            <Ionicons name="refresh-outline" size={17 * scale} color={colors.danger} />
            <Text
              style={[
                styles.resetButtonText,
                { color: colors.danger, fontSize: getScaledFontSize(13 * scale) },
              ]}
            >
              {t('settings.resetBtn')}
            </Text>
          </TouchableOpacity>
        )}

        {/* =========================================================================
            SEKCJA 4: INFORMACJE O APLIKACJI (ABOUT & CERTIFICATION)
           ========================================================================= */}
        <View style={styles.aboutContainer}>
          <Text
            style={[
              styles.aboutAppName,
              { color: colors.textDark, fontSize: getScaledFontSize(14 * scale) },
            ]}
          >
            {t('settings.footerBuild')}
          </Text>
          <Text
            style={[
              styles.aboutAppTagline,
              { color: colors.textMuted, fontSize: getScaledFontSize(11 * scale) },
            ]}
          >
            {t('settings.appTagline')}
          </Text>
          <Text
            style={[
              styles.aboutStandard,
              { color: colors.textMuted, fontSize: getScaledFontSize(10 * scale) },
            ]}
          >
            {t('settings.footerStandard')}
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
      borderBottomWidth: StyleSheet.hairlineWidth,
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
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    headerSpacer: {
      width: 48 * scale,
      height: 48 * scale,
    },
    scrollContent: {
      paddingHorizontal: 16 * scale,
      paddingTop: 16 * scale,
      paddingBottom: 40 * scale,
      gap: 4 * scale,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6 * scale,
      marginTop: 12 * scale,
      marginBottom: 8 * scale,
      paddingHorizontal: 4 * scale,
    },
    sectionTitle: {
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    cardContainer: {
      borderRadius: 16 * scale,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: 12 * scale,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 1.5,
        },
      }),
    },
    highContrastCard: {
      borderWidth: 2,
      borderColor: '#000000',
      elevation: 0,
      shadowOpacity: 0,
    },
    cardDescription: {
      paddingHorizontal: 16 * scale,
      paddingTop: 14 * scale,
      paddingBottom: 10 * scale,
      lineHeight: 18 * scale,
    },
    segmentedBar: {
      flexDirection: 'row',
      marginHorizontal: 12 * scale,
      marginBottom: 12 * scale,
      borderRadius: 12 * scale,
      padding: 4 * scale,
      gap: 4 * scale,
      borderWidth: StyleSheet.hairlineWidth,
    },
    segmentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10 * scale,
      minHeight: 42 * scale,
      borderRadius: 9 * scale,
      gap: 6 * scale,
    },
    segmentButtonActive: {
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    highContrastSegmentActive: {
      borderWidth: 2,
      borderColor: '#000000',
    },
    segmentText: {
      letterSpacing: -0.1,
    },
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13 * scale,
      paddingHorizontal: 16 * scale,
      minHeight: 48 * scale,
      gap: 12 * scale,
    },
    languageFlag: {
      fontSize: 20 * scale,
    },
    languageName: {
      flex: 1,
    },
    highContrastLanguageSelected: {
      borderWidth: 1.5,
      borderColor: '#000000',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12 * scale,
      paddingHorizontal: 16 * scale,
      minHeight: 56 * scale,
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: 12 * scale,
    },
    highContrastDivider: {
      borderBottomWidth: 1.5,
      borderBottomColor: '#000000',
    },
    iconBadge: {
      width: 36 * scale,
      height: 36 * scale,
      borderRadius: 10 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingInfo: {
      flex: 1,
      gap: 2 * scale,
    },
    settingTitle: {
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    settingDescription: {
      lineHeight: 16 * scale,
    },
    switchWrapper: {
      minWidth: 48 * scale,
      minHeight: 48 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6 * scale,
      minHeight: 48 * scale,
      paddingVertical: 10 * scale,
      paddingHorizontal: 16 * scale,
      borderRadius: 12 * scale,
      borderWidth: 1,
      marginTop: 4 * scale,
      marginBottom: 16 * scale,
    },
    highContrastResetButton: {
      borderWidth: 2,
      borderColor: '#991B1B',
    },
    resetButtonText: {
      fontWeight: '600',
    },
    aboutContainer: {
      alignItems: 'center',
      paddingVertical: 16 * scale,
      gap: 4 * scale,
    },
    aboutAppName: {
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    aboutAppTagline: {
      textAlign: 'center',
    },
    aboutStandard: {
      textAlign: 'center',
      opacity: 0.8,
    },
  });
