// src/components/AIChatModal.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { PLACES } from '../data/places';
import { sendChatMessage } from '../services/aiService';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modal inteligentnego przewodnika turystycznego AI.
 * Spełnia standardy dostępności cyfrowej WCAG 2.1 AA:
 * - Wymiary pól dotykowych min. 48x48 dp
 * - Pełne opisy dla czytników TalkBack / VoiceOver
 * - Integracja z trybem wysokiego kontrastu oraz powiększonego tekstu.
 *
 * @param {boolean} visible - Czy modal czatu jest otwarty
 * @param {Function} onClose - Funkcja zwrotna zamykająca okno dialogowe
 */
export default function AIChatModal({ visible, onClose }) {
  const navigation = useNavigation();
  const { colors, highContrast, colorBlindMode, getScaledFontSize } = useAccessibility();
  const { t, language, ttsLocale, translatePlace } = useLanguage();

  const getWelcomeText = useCallback(() => {
    if (language === 'en') {
      return 'Hello! I am your AI tour guide for Kożuchów with live GPS navigation. Ask me about historical secrets, walking routes, or dining!';
    }
    if (language === 'de') {
      return 'Hallo! Ich bin dein KI-Reiseleiter für Kożuchów mit GPS-Standort. Frag mich nach historischen Geheimnissen, Routen oder Restaurants!';
    }
    return 'Cześć! Jestem inteligentnym przewodnikiem po Kożuchowie z obsługą GPS. Zapytaj o ciekawostki historyczne lub gdzie masz najbliżej na obiad!';
  }, [language]);

  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      sender: 'ai',
      text: getWelcomeText(),
    },
  ]);

  // Aktualizacja wiadomości powitalnej przy zmianie języka
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'ai') {
        return [{ id: 'init_1', sender: 'ai', text: getWelcomeText() }];
      }
      return prev;
    });
  }, [language, getWelcomeText]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const scrollRef = useRef(null);

  // Automatyczne przewijanie listy do dołu po pojawieniu się klawiatury
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });

    return () => sub.remove();
  }, []);

  // Pobranie pozycji GPS użytkownika po otwarciu okna czatu
  useEffect(() => {
    let isMounted = true;

    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

      (async () => {
        try {
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
            const req = await Location.requestForegroundPermissionsAsync();
            status = req.status;
          }

          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (isMounted) {
              setUserLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            }
          }
        } catch (_e) {
          // Brak uprawnień lub niedostępność sygnału GPS - cicha obsługa awaryjna
        }
      })();
    } else {
      Speech.stop();
    }

    return () => {
      isMounted = false;
      Speech.stop();
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  // Parsowanie tekstu wypowiedzi i wykrywanie znaczników: [ROUTE:id1,id2] oraz [LINK:id]
  const parseMessageContent = (rawText) => {
    if (!rawText) return { cleanText: '', targetPlaces: [], targetRoute: null };

    let text = rawText;
    let targetRoute = null;
    const targetPlaces = [];

    // 1. Wykrywanie trasy [ROUTE:id1,id2,id3]
    const routeMatch = text.match(/\[ROUTE:([^\]]+)\]/i);
    if (routeMatch) {
      const rawIds = routeMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      const matchedPlaces = rawIds
        .map((id) =>
          PLACES.find(
            (p) =>
              p.id?.toLowerCase() === id.toLowerCase() ||
              p.title?.toLowerCase().includes(id.toLowerCase())
          )
        )
        .filter(Boolean);

      if (matchedPlaces.length > 0) {
        targetRoute = {
          placeIds: matchedPlaces.map((p) => p.id),
          count: matchedPlaces.length,
          places: matchedPlaces.map(translatePlace),
        };
      }
    }

    // 2. Wykrywanie WSZYSTKICH linków do zabytków [LINK:id]
    const linkMatches = [...text.matchAll(/\[LINK:([^\]]+)\]/gi)];
    for (const match of linkMatches) {
      const rawTargetId = match[1].trim();
      const foundPlace = PLACES.find(
        (p) =>
          p.id?.toLowerCase() === rawTargetId.toLowerCase() ||
          p.title?.toLowerCase().includes(rawTargetId.toLowerCase())
      );
      if (foundPlace && !targetPlaces.some((tp) => tp.id === foundPlace.id)) {
        targetPlaces.push(translatePlace(foundPlace));
      }
    }

    // 3. Całkowite i bezwzględne oczyszczenie tekstu ze znaczników i zwrotów wprowadzających do linków:
    text = text
      .replace(/\[LINK:[^\]]+\]/gi, '')
      .replace(/\[ROUTE:[^\]]+\]/gi, '');

    // Usunięcie ewentualnych sformułowań wprowadzających na końcu wypowiedzi
    text = text
      .replace(/(?:,\s*)?(?:[Oo]to|[Pp]oniżej|[Zz]obacz|[Kk]liknij)?\s*(?:znajdziesz\s+)?(?:linki?|odnośniki?)\s*(?:do\s+obiekt[óu]w?|do\s+miejsca?|do\s+szczegółów?)?\s*[:.]?\s*$/gi, '')
      .replace(/(?:,\s*)?(?:[Вв]от|[Нн]иже|[Сс]мотрите)?\s*(?:ссылк[аиу]|линки?)\s*(?:на\s+место|на\s+объект)?\s*[:.]?\s*$/gi, '');

    // Usunięcie ewentualnych formatowań Markdown [Tekst](url) -> Tekst
    text = text.replace(/\[([^\]]+)\]\((?:https?:\/\/[^\)]+|#[^\)]*)\)/gi, '$1');

    // Kosmetyka interpunkcji i białych znaków (zamiana wiszącego dwukropka na kropkę, usunięcie spacji)
    text = text
      .replace(/\s*:\s*$/, '.')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,!?;:])/g, '$1')
      .trim();

    return { cleanText: text, targetPlaces, targetRoute };
  };

  // Przejście do szczegółów zabytku ze zminimalizowaniem czatu
  const handleOpenPlace = (placeId) => {
    Speech.stop();
    onClose();
    setTimeout(() => {
      navigation.navigate('CastleDetail', { placeId });
    }, 220);
  };

  // Otwarcie wyznaczonej trasy na mapie ze zminimalizowaniem czatu
  const handleOpenRoute = (placeIds) => {
    Speech.stop();
    onClose();
    setTimeout(() => {
      navigation.navigate('Map', { routePlaces: placeIds });
    }, 220);
  };

  // Wysłanie zapytania do asystenta AI
  const handleSend = async (customPrompt) => {
    const text = (customPrompt || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    const aiAnswer = await sendChatMessage(text, messages, userLocation, language);

    const aiMsg = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text:
        aiAnswer ||
        t('chat.fallbackError'),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  // Odsłuchanie odpowiedzi AI za pomocą syntezatora mowy w wybranym języku
  const playVoice = (text) => {
    Speech.stop();
    Speech.speak(text, {
      language: ttsLocale,
      pitch: 1.0,
      rate: 0.95,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.white }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={[styles.keyboardContainer, { backgroundColor: colors.backgroundLight }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 25}
        >
          {/* Nagłówek okna czatu */}
          <View style={[styles.header, highContrast && styles.highContrastHeader]}>
            <View style={styles.headerTitleBox}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colorBlindMode ? colors.primary : '#8B5CF6' },
                ]}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextWrapper}>
                <Text
                  style={[
                    styles.title,
                    { color: colors.textDark, fontSize: getScaledFontSize(15) },
                  ]}
                  numberOfLines={1}
                  allowFontScaling={true}
                >
                  {t('chat.title')}
                </Text>
                <View style={styles.gpsStatusRow}>
                  <Ionicons
                    name={userLocation ? 'location' : 'location-outline'}
                    size={13}
                    color={userLocation ? (colorBlindMode ? '#0284C7' : '#16A34A') : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.subtitle,
                      { color: colors.textMuted, fontSize: getScaledFontSize(11) },
                      userLocation && { color: colorBlindMode ? '#0284C7' : '#16A34A', fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                    allowFontScaling={true}
                  >
                    {userLocation
                      ? language === 'en'
                        ? 'Live GPS Active'
                        : language === 'de'
                        ? 'Live-GPS Aktiv'
                        : 'GPS Aktywny (lokalizacja live)'
                      : t('chat.subtitle')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Przycisk zamknięcia min. 48x48 dp */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={26} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Szybkie podpowiedzi pytań (chips min. 48 dp) */}
          <View style={[styles.chipsBar, { backgroundColor: colors.white }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {[
                language === 'en'
                  ? '1-hour walking route'
                  : language === 'de'
                  ? 'Rundgang 1 Stunde'
                  : 'Trasa na 1 godzinę',
                language === 'en'
                  ? '2-hour highlights tour'
                  : language === 'de'
                  ? 'Rundgang 2 Stunden'
                  : 'Trasa na 2 godziny',
                language === 'en'
                  ? 'Where can I eat nearby?'
                  : language === 'de'
                  ? 'Wo kann ich essen?'
                  : 'Gdzie najbliżej zjem?',
                language === 'en'
                  ? 'Castle tower mystery'
                  : language === 'de'
                  ? 'Geheimnis des Schlossturms'
                  : 'Tajemnica wieży zamku',
                language === 'en'
                  ? 'Defensive walls & moat'
                  : language === 'de'
                  ? 'Stadtmauer und Stadtgraben'
                  : 'Mury obronne i fosa',
                language === 'en'
                  ? 'Sepulchral Lapidarium'
                  : language === 'de'
                  ? 'Lapidarium der Grabmalkunst'
                  : 'Lapidarium rzeźby nagrobnej',
              ].map((item, idx) => (
                <TouchableOpacity
                  key={`sug_${idx}`}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
                    highContrast && styles.highContrastChip,
                  ]}
                  onPress={() => handleSend(item)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Podpowiedź: ${item}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textDark, fontSize: getScaledFontSize(13) },
                    ]}
                    allowFontScaling={true}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Przewijana lista wiadomości w konwersacji */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => {
              const { cleanText, targetPlaces, targetRoute } = parseMessageContent(m.text);
              const isUser = m.sender === 'user';

              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [styles.aiBubble, { backgroundColor: colors.white, borderColor: colors.borderLight }, highContrast && styles.highContrastBubble],
                  ]}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`${isUser ? 'Twoja wiadomość' : 'Odpowiedź przewodnika'}: ${cleanText}`}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isUser
                        ? styles.userText
                        : [styles.aiText, { color: colors.textDark }],
                      { fontSize: getScaledFontSize(14), lineHeight: getScaledFontSize(21) },
                    ]}
                    allowFontScaling={true}
                  >
                    {cleanText}
                  </Text>

                  {/* Karta wyznaczonej trasy od asystenta AI */}
                  {!isUser && targetRoute && (
                    <TouchableOpacity
                      style={[
                        styles.placeLinkButton,
                        { backgroundColor: colorBlindMode ? '#E0F2FE' : '#F3E8FF' },
                        highContrast && styles.highContrastPlaceLink,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleOpenRoute(targetRoute.placeIds)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Wczytaj trasę na mapę: ${targetRoute.count} przystanków`}
                      accessibilityHint="Otwiera interaktywną mapę z wyznaczoną trasą i ponumerowanymi punktami"
                    >
                      <View style={styles.placeLinkLeft}>
                        <Ionicons
                          name="trail-sign"
                          size={22}
                          color={colorBlindMode ? '#0284C7' : '#8B5CF6'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.placeLinkText,
                              {
                                color: colorBlindMode ? '#0284C7' : '#8B5CF6',
                                fontSize: getScaledFontSize(13),
                              },
                            ]}
                            numberOfLines={1}
                            allowFontScaling={true}
                          >
                            Pokaż trasę na mapie ({targetRoute.count} pkt)
                          </Text>
                          <Text
                            style={[
                              styles.routeLinkSubText,
                              { color: colors.textMuted, fontSize: getScaledFontSize(11) },
                            ]}
                            numberOfLines={1}
                            allowFontScaling={true}
                          >
                            {targetRoute.places.map((p) => p.title).join(' → ')}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colorBlindMode ? '#0284C7' : '#8B5CF6'}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Karty szybkiego przejścia do wskazanych zabytków (wyłącznie pod wiadomością) */}
                  {!isUser &&
                    targetPlaces &&
                    targetPlaces.length > 0 &&
                    targetPlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        style={[
                          styles.placeLinkButton,
                          { backgroundColor: colors.primaryLight },
                          highContrast && styles.highContrastPlaceLink,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleOpenPlace(place.id)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Przejdź do obiektu: ${place.title}`}
                        accessibilityHint="Otwiera szczegółową kartę zabytku"
                      >
                        <View style={styles.placeLinkLeft}>
                          <Ionicons name="navigate-circle" size={22} color={colors.primary} />
                          <Text
                            style={[
                              styles.placeLinkText,
                              { color: colors.primary, fontSize: getScaledFontSize(13) },
                            ]}
                            numberOfLines={1}
                            allowFontScaling={true}
                          >
                            {t('common.open')}: {place.title}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    ))}

                  {/* Przycisk odsłuchania lektorem (min. 48 dp) */}
                  {!isUser && (
                    <TouchableOpacity
                      style={styles.speakButton}
                      onPress={() => playVoice(cleanText)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={t('chat.speakAnswer')}
                    >
                      <Ionicons name="volume-medium-outline" size={18} color={colors.primary} />
                      <Text
                        style={[
                          styles.speakButtonText,
                          { color: colors.primary, fontSize: getScaledFontSize(12) },
                        ]}
                        allowFontScaling={true}
                      >
                        {language === 'en' ? 'Listen' : language === 'de' ? 'Anhören' : 'Odsłuchaj'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {loading && (
              <View
                style={[styles.bubble, styles.aiBubble, styles.loadingRow]}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={t('chat.thinking')}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[
                    styles.loadingText,
                    { color: colors.textMuted, fontSize: getScaledFontSize(13) },
                  ]}
                  allowFontScaling={true}
                >
                  {t('chat.thinking')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Dolny pasek wprowadzania tekstu */}
          <View style={[styles.inputArea, { backgroundColor: colors.white }, highContrast && styles.highContrastTopBorder]}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceMuted, color: colors.textDark, fontSize: getScaledFontSize(14) },
              ]}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              allowFontScaling={true}
              accessible={true}
              accessibilityLabel={t('chat.placeholder')}
            />
            {/* Przycisk wysłania min. 48x48 */}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: colorBlindMode ? colors.primary : '#8B5CF6' },
                !inputText.trim() && styles.sendBtnDisabled,
                highContrast && styles.highContrastSendBtn,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('chat.send')}
              accessibilityState={{ disabled: !inputText.trim() || loading }}
            >
              <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  highContrastHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextWrapper: {
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  gpsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subtitle: {
    fontWeight: '500',
  },
  closeBtn: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 10,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highContrastChip: {
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  chipText: {
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highContrastBubble: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  bubbleText: {
    flexShrink: 1,
  },
  aiText: {},
  userText: {
    color: '#FFFFFF',
  },
  placeLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    marginTop: 10,
    gap: 8,
  },
  highContrastPlaceLink: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  placeLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  placeLinkText: {
    fontWeight: '700',
  },
  routeLinkSubText: {
    marginTop: 2,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    minHeight: 40,
    alignSelf: 'flex-start',
  },
  speakButtonText: {
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontStyle: 'italic',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  highContrastTopBorder: {
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // WCAG min 48x48 dp
  sendBtn: {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highContrastSendBtn: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});