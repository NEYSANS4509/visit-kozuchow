// src/components/AIChatModal.js
import React from 'react';
import { Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AIChatScreen from '../screens/AIChatScreen';

/**
 * Komponent wstecznej kompatybilności dla AIChatModal.
 * Rekomendowanym podejściem jest bezpośrednia nawigacja do ekranu 'AIChat' w stosie nawigacyjnym.
 *
 * @param {boolean} visible - Czy modal czatu jest otwarty
 * @param {Function} onClose - Funkcja zwrotna zamykająca okno dialogowe
 */
export default function AIChatModal({ visible, onClose }) {
  const navigation = useNavigation();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <AIChatScreen navigation={navigation} />
    </Modal>
  );
}