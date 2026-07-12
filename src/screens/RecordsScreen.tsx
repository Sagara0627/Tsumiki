import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { AREAS } from '../store/seed';
import { BADGES, levelFromXp, perAreaCounts } from '../store/xp';
import { dateKey, todayKey } from '../utils/date';
import { colors, radius } from '../theme';
import { Card, ProgressBar, SectionTitle } from '../components/ui';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function RecordsScreen() {
  const { state, now } = useApp();
  const insets = useSafeAreaInsets();
  const [ym, setYm] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }));

  const today = todayKey(now);
  const startKey = dateKey(new Date(state.createdAt));

  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of state.logs) m.set(l.dateKey, (m.get(l.dateKey) ?? 0) + 1);
    return m;
  }, [state.logs]);
  const frozen = useMemo(() => new Set(state.frozenDates), [state.frozenDates]);

  const moveMonth = (delta: number) => {
    setYm(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  // カレンダーセル(前方の空きを null 埋め)
  const cells: Array<number | null> = [];
  const firstDow = new Date(ym.year, ym.month, 1).getDay();
  const daysInMonth = new Date(ym.year, ym.month + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const perArea = perAreaCounts(state);
  const maxArea = Math.max(1, ...AREAS.map((a) => perArea[a.id]));
  const level = levelFromXp(state.xp);
  const owned = new Map(state.badges.map((b) => [b.id, b.earnedAt]));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <Text style={styles.heading}>きろく</Text>

      {/* 月カレンダー(1日=1ブロック) */}
      <Card>
        <View style={styles.calHeader}>
          <Pressable style={styles.calNav} onPress={() => moveMonth(-1)}>
            <Text style={styles.calNavText}>‹</Text>
          </Pressable>
          <Text style={styles.calTitle}>
            {ym.year}年{ym.month + 1}月
          </Text>
          <Pressable style={styles.calNav} onPress={() => moveMonth(1)}>
            <Text style={styles.calNavText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.calGrid}>
          {WEEKDAYS.map((w) => (
            <View key={w} style={styles.calCell}>
              <Text style={styles.calWeekday}>{w}</Text>
            </View>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <View key={`sp-${i}`} style={styles.calCell} />;
            const key = dateKey(new Date(ym.year, ym.month, d));
            const done = (countByDay.get(key) ?? 0) > 0;
            const isFrozen = frozen.has(key);
            const missed = !done && !isFrozen && key >= startKey && key < today;
            const isToday = key === today;
            const inRange = key >= startKey && key <= today;
            return (
              <View key={key} style={styles.calCell}>
                <View
                  style={[
                    styles.dayBlock,
                    done && { backgroundColor: colors.success },
                    isFrozen && { backgroundColor: colors.freeze },
                    missed && { backgroundColor: colors.dangerBg },
                    isToday && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      (done || isFrozen) && styles.dayTextOn,
                      missed && { color: colors.danger },
                      !inRange && styles.dayTextOut,
                    ]}
                  >
                    {d}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <Legend color={colors.success} label="達成" />
          <Legend color={colors.freeze} label="フリーズ" />
          <Legend color={colors.dangerBg} label="未達" border />
        </View>
      </Card>

      {/* 領域別バー */}
      <SectionTitle>領域別の積み上げ</SectionTitle>
      <Card style={styles.areaCard}>
        {AREAS.map((a) => (
          <View key={a.id} style={styles.areaRow}>
            <Text style={styles.areaLabel}>
              {a.emoji} {a.short}
            </Text>
            <View style={styles.areaBar}>
              <ProgressBar ratio={perArea[a.id] / maxArea} color={a.color} height={10} />
            </View>
            <Text style={styles.areaCount}>{perArea[a.id]}</Text>
          </View>
        ))}
      </Card>

      {/* バッジ */}
      <SectionTitle>
        バッジ({owned.size} / {BADGES.length})
      </SectionTitle>
      <Card>
        <View style={styles.badgeGrid}>
          {BADGES.map((b) => {
            const has = owned.has(b.id);
            return (
              <View key={b.id} style={[styles.badge, !has && styles.badgeLocked]}>
                <Text style={styles.badgeEmoji}>{has ? b.emoji : '🔒'}</Text>
                <Text style={[styles.badgeName, !has && styles.badgeNameLocked]}>{b.name}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* 累計サマリ */}
      <SectionTitle>累計</SectionTitle>
      <Card>
        <View style={styles.statGrid}>
          <Stat label="完了タスク" value={`${state.logs.length}`} />
          <Stat label="累計XP" value={`${state.xp}`} />
          <Stat label="レベル" value={`${level.level}`} />
          <Stat label="最長ストリーク" value={`${state.longest}日`} />
          <Stat label="フリーズ使用" value={`${state.frozenDates.length}回`} />
          <Stat label="開始日" value={startKey} />
        </View>
      </Card>
    </ScrollView>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={styles.legend}>
      <View
        style={[
          styles.legendBlock,
          { backgroundColor: color },
          border && { borderWidth: 1, borderColor: colors.danger },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calNav: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavText: { fontSize: 20, color: colors.primary, fontWeight: '700', marginTop: -2 },
  calTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  calWeekday: { fontSize: 11, color: colors.sub, fontWeight: '600' },
  dayBlock: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontSize: 13, color: colors.text, fontVariant: ['tabular-nums'] },
  dayTextOn: { color: '#FFF', fontWeight: '700' },
  dayTextOut: { color: colors.border },
  legendRow: { flexDirection: 'row', gap: 14, marginTop: 12, justifyContent: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendBlock: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.sub },
  areaCard: { gap: 12 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaLabel: { width: 96, fontSize: 13, color: colors.text },
  areaBar: { flex: 1 },
  areaCount: {
    width: 32,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '30.5%',
    backgroundColor: colors.faint,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  badgeLocked: { opacity: 0.45 },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
  badgeNameLocked: { color: colors.sub },
  badgeDesc: { fontSize: 9, color: colors.sub, textAlign: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  stat: { width: '33.3%', alignItems: 'center' },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: { fontSize: 11, color: colors.sub, marginTop: 2 },
});
