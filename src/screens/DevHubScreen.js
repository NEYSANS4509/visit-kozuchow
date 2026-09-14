// src/screens/DevHubScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors'; // Wykorzystanie wspólnej palety barw projektu[cite: 13]

export default function DevHubScreen({ navigation }) {
  // Lista dostępnych ekranów w projekcie do szybkiego testowania
  const screens = [
    {
      name: 'CastleDetail',
      title: 'Zamek Kożuchów (Nowa makieta)',
      subtitle: 'Karta obiektu ze zdjęciem, miniaturkami i opisem',
      icon: 'business-outline',
    },
    {
      name: 'Welcome',
      title: 'Ekran Powitalny (Welcome)',
      subtitle: 'Startowa karta z animacją logo i tłem',
      icon: 'sparkles-outline',
    },
    {
      name: 'Auth',
      title: 'Ekran Rejestracji / Logowania',
      subtitle: 'Gotowy formularz wejściowy z walidacją',
      icon: 'person-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Centrum Nawigacji (Dev)</Text>
        <Text style={styles.headerSubtitle}>
          Wybierz ekran do podglądu bez konieczności przechodzenia całego procesu:
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {screens.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.name)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark, // Kolor tekstu zdefiniowany w systemie projektu[cite: 13]
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted, // Etykieta pomocnicza ze stałych stylów[cite: 13]
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white, // Białe tło kart[cite: 13]
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight, // Błękitne tło akcentu[cite: 13]
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark, // Główny kolor czytelnego nagłówka[cite: 13]
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted, // Stonowany opis podglądu ekranu[cite: 13]
  },
});