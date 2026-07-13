import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import { getCharacter } from '../characters';
import AnimatedCharacter from '../characters/AnimatedCharacter';
import { colors, font, radius } from '../theme';
import { prefersReducedMotion } from './ui';
import { ConfettiBurst } from './animations';

/**
 * レベルアップ・バッジ・マイルストーン・フリーズ獲得のお祝い表示。
 * celebrations キューの先頭を表示し、OKで次のお祝いへ進む。
 */
export default function CelebrationModal() {
  const { state, celebrations, dismissCelebration } = useApp();
  const current = celebrations[0];

  const scale = useRef(new Animated.Value(0.7)).current;
  const [confetti, setConfetti] = useState(0);
  useEffect(() => {
    if (!current) return;
    // お祝いごとに紙吹雪を打ち上げ直す
    setConfetti((c) => c + 1);
    if (prefersReducedMotion()) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0.7);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [current, scale]);

  if (!current) return null;

  const char = getCharacter(state.settings.characterId);

  return (
    <Modal transparent animationType="fade" onRequestClose={dismissCelebration}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.stage, { backgroundColor: char.bgColor }]}>
            <AnimatedCharacter characterId={char.id} emotion="celebrate" size={150} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.message}>{current.message}</Text>
            <Pressable
              style={[styles.button, { backgroundColor: char.themeColor }]}
              onPress={dismissCelebration}
            >
              <Text style={styles.buttonText}>
                {celebrations.length > 1
                  ? `やったー!(あと${celebrations.length - 1}件)`
                  : 'やったー!'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
        <ConfettiBurst play={confetti} count={44} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 20, 10, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  stage: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  body: {
    alignItems: 'center',
    padding: 22,
    paddingTop: 18,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 23,
    fontFamily: font.rounded,
  },
  button: {
    marginTop: 10,
    borderRadius: radius.pill,
    paddingHorizontal: 30,
    paddingVertical: 13,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
