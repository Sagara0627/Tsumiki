import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import { getCharacter } from '../characters';
import CharacterView from '../characters/CharacterView';
import { colors, radius } from '../theme';

/**
 * レベルアップ・バッジ・マイルストーン・フリーズ獲得のお祝い表示。
 * celebrations キューの先頭を表示し、OKで次のお祝いへ進む。
 */
export default function CelebrationModal() {
  const { state, celebrations, dismissCelebration } = useApp();
  const current = celebrations[0];
  if (!current) return null;

  const char = getCharacter(state.settings.characterId);

  return (
    <Modal transparent animationType="fade" onRequestClose={dismissCelebration}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: char.bgColor }]}>
          <CharacterView characterId={char.id} emotion="celebrate" size={150} />
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.message}>{current.message}</Text>
          <Pressable
            style={[styles.button, { backgroundColor: char.themeColor }]}
            onPress={dismissCelebration}
          >
            <Text style={styles.buttonText}>
              {celebrations.length > 1 ? `やったー!(あと${celebrations.length - 1}件)` : 'やったー!'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    borderRadius: radius.card,
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.text, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: 12,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
