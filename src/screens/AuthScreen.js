import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function AuthScreen({ navigation }) {
  // Stany formularza
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Stany logiki biznesowej i UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamiczne skalowanie względem szerokości bazowej z Figmy (390px)
  const { width: windowWidth } = useWindowDimensions();
  const scale = windowWidth / 390;

  const styles = useMemo(() => createStyles(scale), [scale]);

  // Prosta walidacja formatu adresu e-mail
  const isEmailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, [email]);

  // Walidacja loginu (minimum 3 znaki bez spacji)
  const isUsernameValid = useMemo(() => {
    return username.trim().length >= 3;
  }, [username]);

  // Walidacja hasła (minimum 6 znaków)
  const isPasswordValid = useMemo(() => {
    return password.length >= 6;
  }, [password]);

  // Obsługa logowania / rejestracji głównej
  const handleRegister = async () => {
    setErrorMessage('');

    if (!isEmailValid) {
      setErrorMessage('Wprowadź poprawny adres e-mail.');
      return;
    }
    if (!isUsernameValid) {
      setErrorMessage('Nazwa użytkownika musi mieć minimum 3 znaki.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('Hasło musi zawierać co najmniej 6 znaków.');
      return;
    }

    setIsLoading(true);

    try {
      // Symulacja żądania sieciowego / zapytania do bazy danych
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Sukces',
        `Zarejestrowano pomyślnie!\nUżytkownik: ${username}\nZapamiętaj mnie: ${rememberMe ? 'Tak' : 'Nie'}`
      );
      // navigation.replace('Home'); // Odkomentować po utworzeniu kolejnego ekranu
    } catch (error) {
      setErrorMessage('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa alternatywnego przycisku tworzenia konta
  const handleCreateAccountSecondary = () => {
    Alert.alert('Informacja', 'Przejście do alternatywnego formularza tworzenia konta.');
  };

  return (
    <View style={styles.container}>
      {/* Dolne tło z planety */}
      <Image
        source={require('../../assets/earth.png')}
        style={styles.bottomBackground}
        resizeMode="contain"
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Logo v4 1 (Figma: Width: 282, Height: 306) */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Kontener całego formularza */}
            <View style={styles.form}>
              
              {/* Komunikat błędu walidacji lub serwera */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={14 * scale} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 2. Pole 1: Email (Figma: Group 65 -> W: 316, H: 53) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="twoj@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {/* Ikona weryfikacji widoczna tylko po poprawnym wpisaniu adresu */}
                  {isEmailValid && (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20 * scale}
                      color={colors.primary}
                    />
                  )}
                </View>
              </View>

              {/* 3. Pole 2: Nazwa użytkownika (Figma: Group 67 -> W: 316, H: 53) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="nazwa_uzytkownika"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {/* Ikona weryfikacji widoczna przy minimum 3 znakach */}
                  {isUsernameValid && (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20 * scale}
                      color={colors.primary}
                    />
                  )}
                </View>
              </View>

              {/* 4. Pole 3: Hasło z przełącznikiem widoczności (Figma: Group 66 -> W: 317, H: 41.85) */}
              <View style={styles.passwordGroup}>
                <Text style={styles.label}>Hasło</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18 * scale}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. Wiersz opcji: Zapamiętaj mnie + Zapomniałeś hasła? */}
              <View style={styles.optionsRow}>
                {/* Group 5: Checkbox zapamiętania sesji */}
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  activeOpacity={0.7}
                  onPress={() => setRememberMe(!rememberMe)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={10 * scale} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.smallNoteText}>Zapamiętaj mnie</Text>
                </TouchableOpacity>

                {/* Zapomniałeś hasła? */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Zapomniałeś hasła?"
                  onPress={() => Alert.alert('Reset hasła', 'Link do resetu zostanie wysłany na podany e-mail.')}
                >
                  <Text style={styles.forgotPasswordText}>Zapomniałeś hasła?</Text>
                </TouchableOpacity>
              </View>

              {/* 6. Przycisk Zarejestruj się ze wskaźnikiem ładowania */}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={handleRegister}
                accessibilityRole="button"
                accessibilityLabel="Zarejestruj się"
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Zarejestruj się</Text>
                )}
              </TouchableOpacity>

              {/* 7. Tekst rozdzielający */}
              <Text style={styles.dividerText}>Nie masz jeszcze konta?</Text>

              {/* 8. Group 7: Stwórz Konto */}
              <TouchableOpacity
                style={styles.createAccountButton}
                activeOpacity={0.85}
                onPress={handleCreateAccountSecondary}
                accessibilityRole="button"
                accessibilityLabel="Stwórz Konto"
              >
                <Text style={styles.createAccountText}>Stwórz Konto</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (scale) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      position: 'relative',
      overflow: 'hidden',
    },
    bottomBackground: {
      position: 'absolute',
      width: 580 * scale,
      height: 520 * scale,
      bottom: -130 * scale,
      left: -200 * scale,
      opacity: 0.18,
    },
    safeArea: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: 24 * scale,
      paddingBottom: 28 * scale,
    },
    logoWrapper: {
      width: 282 * scale,
      height: 306 * scale,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8 * scale,
      marginBottom: 6 * scale,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    form: {
      width: '100%',
      alignItems: 'center',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 316 * scale,
      backgroundColor: '#FEE2E2',
      paddingVertical: 6 * scale,
      paddingHorizontal: 10 * scale,
      borderRadius: 8 * scale,
      marginBottom: 10 * scale,
    },
    errorText: {
      color: '#DC2626',
      fontSize: 11 * scale,
      marginLeft: 6 * scale,
      fontWeight: '500',
    },
    inputGroup: {
      width: 316 * scale,
      height: 53 * scale,
      justifyContent: 'flex-end',
      marginBottom: 16 * scale,
    },
    passwordGroup: {
      width: 317 * scale,
      height: 42 * scale,
      justifyContent: 'flex-end',
      marginBottom: 12 * scale,
    },
    label: {
      fontSize: 11 * scale,
      color: colors.textDark,
      fontWeight: '500',
      marginBottom: 2 * scale,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBorder,
      paddingBottom: 4 * scale,
    },
    textInput: {
      flex: 1,
      fontSize: 14 * scale,
      color: colors.textDark,
      padding: 0,
    },
    optionsRow: {
      width: 317 * scale,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6 * scale,
      marginBottom: 22 * scale,
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 14 * scale,
    },
    checkbox: {
      width: 12 * scale,
      height: 12 * scale,
      borderRadius: 2 * scale,
      borderWidth: 1,
      borderColor: colors.checkboxBorder,
      marginRight: 6 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    smallNoteText: {
      fontSize: 10 * scale,
      color: colors.textMuted,
      fontWeight: '400',
    },
    forgotPasswordText: {
      fontSize: 10 * scale,
      fontWeight: '700',
      color: colors.textMuted,
    },
    registerButton: {
      width: 317 * scale,
      height: 44 * scale,
      backgroundColor: colors.primary,
      borderRadius: 20 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    registerButtonText: {
      color: colors.white,
      fontSize: 14 * scale,
      fontWeight: '600',
    },
    dividerText: {
      fontSize: 10 * scale,
      color: colors.textMuted,
      fontWeight: '400',
      marginTop: 22 * scale,
      marginBottom: 16 * scale,
      textAlign: 'center',
    },
    createAccountButton: {
      width: 317 * scale,
      height: 44 * scale,
      borderRadius: 20 * scale,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createAccountText: {
      color: colors.primary,
      fontSize: 14 * scale,
      fontWeight: '600',
    },
  });