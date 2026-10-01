// src/components/LegalModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Modal wyświetlający informacje prawne: Politykę Prywatności oraz Regulamin.
 * Spełnia standardy WCAG 2.1 AA:
 * - Rozmiar dotyku min. 48x48 dp dla przycisków i zakładek
 * - Dynamiczne skalowanie tekstu (allowFontScaling={true})
 * - Pełne opisy i role dostępności (accessibilityRole="tab", "tablist").
 *
 * @param {boolean} visible - Czy okno modalne jest widoczne
 * @param {Function} onClose - Funkcja zwrotna zamykająca okno modalne
 * @param {'privacy'|'terms'} initialTab - Domyślnie aktywna zakładka ('privacy' lub 'terms')
 */
export default function LegalModal({ visible, onClose, initialTab = 'privacy' }) {
  const [tab, setTab] = useState(initialTab);
  const { colors, highContrast, getScaledFontSize } = useAccessibility();

  // Synchronizacja aktywnej zakładki przy każdorazowym otwarciu modala
  useEffect(() => {
    if (visible) {
      setTab(initialTab);
    }
  }, [visible, initialTab]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
        {/* Nagłówek okna modalnego z przełącznikiem zakładek (min. 48x48 dp) */}
        <View style={[styles.header, highContrast && styles.highContrastHeader]}>
          <View style={styles.tabButtons} accessible={true} accessibilityRole="tablist">
            <TouchableOpacity
              style={[
                styles.tabBtn,
                tab === 'privacy' && styles.tabBtnActive,
                highContrast && tab === 'privacy' && styles.highContrastActiveTab,
              ]}
              onPress={() => setTab('privacy')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="Polityka prywatności"
              accessibilityState={{ selected: tab === 'privacy' }}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'privacy' && styles.tabTextActive,
                  { fontSize: getScaledFontSize(13) },
                ]}
                allowFontScaling={true}
              >
                Polityka prywatności
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                tab === 'terms' && styles.tabBtnActive,
                highContrast && tab === 'terms' && styles.highContrastActiveTab,
              ]}
              onPress={() => setTab('terms')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="Regulamin aplikacji"
              accessibilityState={{ selected: tab === 'terms' }}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'terms' && styles.tabTextActive,
                  { fontSize: getScaledFontSize(13) },
                ]}
                allowFontScaling={true}
              >
                Regulamin
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Zamknij informacje prawne"
            accessibilityHint="Zamyka okno dokumentów prawnych"
          >
            <Ionicons name="close" size={26} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Przewijana zawartość dokumentów prawnych */}
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {tab === 'privacy' ? (
            <View>
              <Text
                style={[
                  styles.title,
                  { color: colors.textDark, fontSize: getScaledFontSize(22) },
                ]}
                accessible={true}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                Polityka Prywatności Aplikacji „Visit Kożuchów”
              </Text>
              <Text
                style={[styles.date, { fontSize: getScaledFontSize(12) }]}
                allowFontScaling={true}
              >
                Ostatnia aktualizacja: Wrzesień 2026
              </Text>

              <Text
                style={[
                  styles.heading,
                  { color: colors.textDark, fontSize: getScaledFontSize(16) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                1. Administrator Danych i Charakter Aplikacji
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                Aplikacja mobilna „Visit Kożuchów” ma charakter edukacyjno-turystyczny i działa w architekturze Offline-First. Aplikacja nie wymaga rejestracji, nie gromadzi i nie profiluje żadnych danych osobowych użytkownika.
              </Text>

              <Text
                style={[
                  styles.heading,
                  { color: colors.textDark, fontSize: getScaledFontSize(16) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                2. Uprawnienia urządzenia
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                • <Text style={[styles.bold, { color: colors.textDark }]}>Kamera:</Text> Dostęp do aparatu fotograficznego wykorzystywany jest wyłącznie w czasie rzeczywistym do skanowania tabliczek z kodami QR rozmieszczonymi na zabytkach. Aplikacja nie zapisuje zdjęć w pamięci trwałej ani nie przesyła strumienia wideo.
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                • <Text style={[styles.bold, { color: colors.textDark }]}>Lokalizacja (GPS):</Text> Koordynaty GPS przetwarzane są bezpośrednio na urządzeniu w celu centrowania mapy i nawigacji turystycznej. Dane lokalizacyjne nie są nigdzie rejestrowane ani agregowane.
              </Text>

              <Text
                style={[
                  styles.heading,
                  { color: colors.textDark, fontSize: getScaledFontSize(16) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                3. Pamięć lokalna i Multimedia
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                Wszystkie treści historyczne, audiodeskrypcje oraz pliki graficzne są zintegrowane w instalatorze aplikacji i nie wymagają stałego połączenia z zewnętrznymi serwerami.
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={[
                  styles.title,
                  { color: colors.textDark, fontSize: getScaledFontSize(22) },
                ]}
                accessible={true}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                Regulamin Aplikacji „Visit Kożuchów”
              </Text>
              <Text
                style={[styles.date, { fontSize: getScaledFontSize(12) }]}
                allowFontScaling={true}
              >
                Wersja dokumentu: 1.0 (2026)
              </Text>

              <Text
                style={[
                  styles.heading,
                  { color: colors.textDark, fontSize: getScaledFontSize(16) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                § 1. Postanowienia wstępne
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                1. Niniejszy regulamin określa zasady korzystania z bezpłatnego mobilnego przewodnika turystycznego po zabytkach miasta Kożuchów.
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                2. Korzystanie z aplikacji jest bezpłatne i dobrowolne.
              </Text>

              <Text
                style={[
                  styles.heading,
                  { color: colors.textDark, fontSize: getScaledFontSize(16) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                § 2. Bezpieczeństwo podczas zwiedzania
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                1. Użytkownik korzystający z aplikacji w przestrzeni miejskiej jest zobowiązany do zachowania ostrożności, w szczególności podczas poruszania się w pobliżu ulic, murów obronnych, schodów terenowych oraz zabytkowej fosy.
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                2. Korzystanie ze skanera kodów QR i audioprzewodnika nie powinno odwracać uwagi od otoczenia drogowego i pieszego.
              </Text>

              <Text
                style={[
                  styles.heading,
                  { color: colors.textDark, fontSize: getScaledFontSize(16) },
                ]}
                accessibilityRole="header"
                allowFontScaling={true}
              >
                § 3. Prawa autorskie
              </Text>
              <Text
                style={[
                  styles.paragraph,
                  { color: colors.textSecondary, fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(22) },
                ]}
                allowFontScaling={true}
              >
                Wszelkie materiały tekstowe, bazy danych obiektów oraz materiały fotograficzne stanowią własność twórców projektu lub są wykorzystywane na prawach dozwolonego użytku edukacyjnego.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  highContrastHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
  },
  // WCAG Touch Target: min. 48 dp
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  highContrastActiveTab: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  tabText: {
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  closeBtn: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  date: {
    color: '#94A3B8',
    marginBottom: 16,
  },
  heading: {
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
  },
});