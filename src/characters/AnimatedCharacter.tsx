import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { CharacterId, Emotion } from '../store/types';
import CharacterView from './CharacterView';
import { prefersReducedMotion } from '../components/ui';

interface Props {
  characterId: CharacterId;
  emotion: Emotion;
  size: number;
  /** 増えるたびに1回ジャンプする(タスク完了の合図) */
  bounceKey?: number;
}

/** 感情ごとの待機モーションのパラメータ */
function idleParams(emotion: Emotion): { duration: number; bobRatio: number; sway: boolean } {
  switch (emotion) {
    case 'celebrate':
      return { duration: 300, bobRatio: 0.08, sway: false }; // ぴょんぴょん跳ねる
    case 'worried':
    case 'tearful':
      return { duration: 450, bobRatio: 0.012, sway: true }; // そわそわ左右に揺れる
    case 'sad':
      return { duration: 1900, bobRatio: 0.012, sway: false }; // 沈んだ深呼吸
    default:
      return { duration: 1200, bobRatio: 0.03, sway: false }; // ふんわり呼吸
  }
}

/**
 * キャラクターに「生きている」動きを付けるラッパー。
 * 通知画像のスナップショット(CharacterImageFactory)は静的な CharacterView を
 * 直接使うので、画面表示だけこちらを使う。
 */
export default function AnimatedCharacter({ characterId, emotion, size, bounceKey = 0 }: Props) {
  const bob = useRef(new Animated.Value(0)).current; // 0..1 の待機ループ
  const jump = useRef(new Animated.Value(0)).current; // -1(しゃがみ)..1(空中)
  const prevBounce = useRef(bounceKey);

  // 待機モーション(感情が変わったらリズムも変わる)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    bob.setValue(0);
    const { duration } = idleParams(emotion);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [emotion, bob]);

  // タスク完了ジャンプ(しゃがんで、跳んで、着地)
  useEffect(() => {
    if (bounceKey === prevBounce.current) return;
    prevBounce.current = bounceKey;
    if (prefersReducedMotion()) return;
    jump.setValue(0);
    Animated.sequence([
      Animated.timing(jump, {
        toValue: -1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(jump, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
      Animated.spring(jump, { toValue: 0, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [bounceKey, jump]);

  const { bobRatio, sway } = idleParams(emotion);

  const bobY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * bobRatio],
  });
  const jumpY = jump.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [size * 0.02, 0, -size * 0.14],
  });
  const squash = jump.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.92, 1, 1.05],
  });
  const swayDeg = bob.interpolate({
    inputRange: [0, 1],
    outputRange: sway ? ['-2.5deg', '2.5deg'] : ['0deg', '0deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: Animated.add(bobY, jumpY) },
          { rotate: swayDeg },
          { scaleY: squash },
        ],
      }}
    >
      <CharacterView characterId={characterId} emotion={emotion} size={size} />
    </Animated.View>
  );
}
