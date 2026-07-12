import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow } from '../theme';

// OSの「視差効果を減らす」を尊重(未取得の間は動かさない側に倒す)
let reduceMotion = true;
void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
  reduceMotion = v;
});

export function prefersReducedMotion(): boolean {
  return reduceMotion;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTick} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export function ProgressBar({
  ratio,
  color = colors.primary,
  height = 10,
}: {
  ratio: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const anim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(clamped);
      return;
    }
    Animated.timing(anim, { toValue: clamped, duration: 400, useNativeDriver: false }).start();
  }, [clamped, anim]);

  return (
    <View style={[styles.barTrack, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.barFill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

/**
 * 積み木モチーフの離散プログレス。
 * タスクのような「数えられる」進捗はバーではなくブロックで表す。
 */
export function BlockProgress({
  total,
  filled,
  color = colors.primary,
  height = 14,
}: {
  total: number;
  filled: number;
  color?: string;
  height?: number;
}) {
  const blocks = Math.max(1, total);
  const done = Math.min(blocks, Math.max(0, filled));
  return (
    <View style={styles.blockRow}>
      {Array.from({ length: blocks }, (_, i) => (
        <View
          key={i}
          style={[
            styles.block,
            { height, borderRadius: Math.min(radius.block, height / 2) },
            i < done && { backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * 角丸スクエアのチェックボックス(完了 = ブロックをひとつ積む)。
 * 完了時にスプリングで弾む。押下領域は呼び出し側の Pressable が持つ。
 */
export function CheckBlock({
  done,
  size = 28,
  disabled,
}: {
  done: boolean;
  size?: number;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(done);

  useEffect(() => {
    if (done && !prev.current && !reduceMotion) {
      scale.setValue(0.5);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
    prev.current = done;
  }, [done, scale]);

  return (
    <Animated.View
      style={[
        styles.checkBlock,
        { width: size, height: size, borderRadius: size * 0.32, transform: [{ scale }] },
        done && styles.checkBlockOn,
        disabled && styles.checkBlockDisabled,
      ]}
    >
      {done && <Text style={[styles.checkMark, { fontSize: size * 0.55 }]}>✓</Text>}
    </Animated.View>
  );
}

export function Chip({
  label,
  color = colors.faint,
  textColor = colors.text,
}: {
  label: string;
  color?: string;
  textColor?: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 18,
    ...shadow.card,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginLeft: 6,
    marginBottom: -2,
  },
  sectionTick: {
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.sub,
    letterSpacing: 0.4,
  },
  barTrack: {
    backgroundColor: colors.faint,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  blockRow: {
    flexDirection: 'row',
    gap: 5,
  },
  block: {
    flex: 1,
    backgroundColor: colors.faint,
  },
  checkBlock: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBlockOn: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkBlockDisabled: {
    opacity: 0.3,
  },
  checkMark: {
    color: '#FFF',
    fontWeight: '800',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
