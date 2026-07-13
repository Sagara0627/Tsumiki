import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { prefersReducedMotion } from './ui';

/**
 * アプリ全体で使う小さなアニメーション部品集。
 * すべて transform / opacity のみ(useNativeDriver: true)で動かし、
 * 「視差効果を減らす」設定時は静的表示にフォールバックする。
 */

// ---- Bouncy: 押すとふにっと沈むタップ領域(積み木を押す手応え) ----

export function Bouncy({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
  scaleTo = 0.96,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (v: number) => {
    if (prefersReducedMotion()) return;
    Animated.spring(scale, {
      toValue: v,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ---- PopIn: 出現時にぽんっと弾む(popKey を変えると再生し直す) ----

export function PopIn({
  children,
  style,
  delay = 0,
  popKey,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  popKey?: string | number;
}) {
  const anim = useRef(new Animated.Value(prefersReducedMotion() ? 1 : 0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      delay,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
    // popKey が変わったときだけ再生し直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popKey]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---- PopOnChange: 値が変わった瞬間にむくっと膨らむ(ストリーク数字用) ----

export function PopOnChange({
  value,
  children,
  style,
}: {
  value: string | number;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value && !prefersReducedMotion()) {
      scale.setValue(1.35);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }).start();
    }
    prev.current = value;
  }, [value, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
  );
}

// ---- Pulse: ゆっくり脈打つ(締切バナーの緊張感) ----

export function Pulse({
  children,
  style,
  active = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  active?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, scale]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

// ---- FloatUp: 「+10」がふわっと浮かんで消える ----

export function FloatUp({
  play,
  text,
  color = '#F0AD00',
  style,
}: {
  /** 0は待機。増えるたびに1回再生 */
  play: number;
  text: string;
  color?: string;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!play || prefersReducedMotion()) return;
    setVisible(true);
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [play, anim]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatUp,
        style,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -34] }) },
            { scale: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.1, 1] }) },
          ],
        },
      ]}
    >
      <Text style={[styles.floatUpText, { color }]}>{text}</Text>
    </Animated.View>
  );
}

// ---- ConfettiBurst: 積み木ブロックの紙吹雪 ----

const CONFETTI_COLORS = [
  '#FF8A3C', // primary
  '#5B8DEF', // tech
  '#9C6ADE', // hearing
  '#F2994A', // drive
  '#56CCF2', // negotiation
  '#6FCF97', // output
  '#F0AD00', // gold
];

interface ParticleSpec {
  id: number;
  dx: number; // 最終的な横流れ
  rise: number; // 打ち上げ高さ
  fall: number; // 落下距離
  size: number;
  color: string;
  spin: number;
  delay: number;
  duration: number;
}

function makeSpecs(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    dx: (Math.random() - 0.5) * 260,
    rise: 60 + Math.random() * 110,
    fall: 160 + Math.random() * 140,
    size: 7 + Math.random() * 7,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    spin: (Math.random() - 0.5) * 720,
    delay: Math.random() * 120,
    duration: 900 + Math.random() * 500,
  }));
}

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: spec.duration,
      delay: spec.delay,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: '50%',
        top: '40%',
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size * 0.3,
        backgroundColor: spec.color,
        opacity: progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, spec.dx],
            }),
          },
          {
            // 打ち上げ→放物線ふうに落下(区分線形でも小粒なら自然に見える)
            translateY: progress.interpolate({
              inputRange: [0, 0.25, 0.45, 0.7, 1],
              outputRange: [
                0,
                -spec.rise,
                -spec.rise * 0.75,
                spec.fall * 0.35,
                spec.fall,
              ],
            }),
          },
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${spec.spin}deg`],
            }),
          },
        ],
      }}
    />
  );
}

export function ConfettiBurst({
  play,
  count = 26,
  style,
}: {
  /** 0は待機。増えるたびに1回噴出 */
  play: number;
  count?: number;
  style?: ViewStyle;
}) {
  const [playing, setPlaying] = useState(0);

  useEffect(() => {
    if (!play || prefersReducedMotion()) return;
    setPlaying(play);
    const t = setTimeout(() => setPlaying(0), 1700);
    return () => clearTimeout(t);
  }, [play]);

  const specs = useMemo(() => (playing ? makeSpecs(count) : []), [playing, count]);

  if (specs.length === 0) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {specs.map((s) => (
        <Particle key={`${playing}-${s.id}`} spec={s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  floatUp: {
    position: 'absolute',
    right: 4,
    top: -6,
  },
  floatUpText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
