import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { getCharacter } from '../characters';
import AnimatedCharacter from '../characters/AnimatedCharacter';
import { ambientEmotion } from '../store/mood';
import { completionsOn, currentStreak, isTodayDone, MAX_FREEZES } from '../store/streak';
import { levelFromXp } from '../store/xp';
import { areaOf } from '../store/seed';
import { Task } from '../store/types';
import { dateKey, formatCountdown, minutesUntilMidnight, todayKey } from '../utils/date';
import { stableHash } from '../utils/id';
import { colors, font, radius } from '../theme';
import { BlockProgress, Card, CheckBlock } from '../components/ui';
import {
  Bouncy,
  ConfettiBurst,
  FloatUp,
  PopIn,
  PopOnChange,
  Pulse,
} from '../components/animations';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const LEVEL_BLOCKS = 10;

export default function HomeScreen() {
  const { state, now, completeTask, uncompleteTask } = useApp();
  const insets = useSafeAreaInsets();

  const char = getCharacter(state.settings.characterId);
  const emotion = ambientEmotion(state, now);
  const streak = currentStreak(state, now);
  const today = todayKey(now);
  const doneToday = completionsOn(state, today);
  const todayDone = isTodayDone(state, now);
  const level = levelFromXp(state.xp);
  const goal = state.settings.dailyGoal;

  // セリフは「日付+感情」で安定抽選(同じ日は同じセリフ)
  const pool = char.speech[emotion];
  const speech = pool[stableHash(`${today}:${emotion}`) % pool.length].replaceAll(
    '{streak}',
    String(streak)
  );

  const showDanger = !todayDone && streak > 0 && now.getHours() >= 19;

  const missionTasks = state.missions.taskIds
    .map((id) => state.tasks.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t && !t.archived);

  const doneTaskIds = new Set(
    state.logs.filter((l) => l.dateKey === today).map((l) => l.taskId)
  );

  // タスク完了のたびに紙吹雪+キャラのジャンプ。ゴール達成の瞬間は盛大に
  const [burst, setBurst] = useState(0);
  const [burstCount, setBurstCount] = useState(24);
  const prevDone = useRef(doneToday);
  useEffect(() => {
    if (doneToday > prevDone.current) {
      setBurstCount(doneToday === goal ? 48 : 20);
      setBurst((b) => b + 1);
    }
    prevDone.current = doneToday;
  }, [doneToday, goal]);

  // 直近7日のブロックストリップ
  const logDays = useMemo(() => new Set(state.logs.map((l) => l.dateKey)), [state.logs]);
  const frozenDays = useMemo(() => new Set(state.frozenDates), [state.frozenDates]);
  const startKey = dateKey(new Date(state.createdAt));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const key = dateKey(d);
    return {
      key,
      label: WEEKDAYS[d.getDay()],
      done: logDays.has(key),
      frozen: frozenDays.has(key),
      missed: !logDays.has(key) && !frozenDays.has(key) && key >= startKey && key < today,
      isToday: key === today,
    };
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* キャラクターステージ(画面上端までフルブリード) */}
      <View
        style={[
          styles.stage,
          { backgroundColor: char.bgColor, paddingTop: insets.top + 12 },
        ]}
      >
        <PopIn popKey={speech}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{speech}</Text>
          </View>
          <View style={styles.bubbleTail} />
        </PopIn>
        <AnimatedCharacter
          characterId={char.id}
          emotion={emotion}
          size={150}
          bounceKey={burst}
        />
        <View style={styles.ground} />
        <View style={styles.nameRow}>
          <Text style={styles.charName}>{char.name}</Text>
          <View style={styles.titlePill}>
            <Text style={styles.titlePillText}>{char.title}</Text>
          </View>
        </View>
        <ConfettiBurst play={burst} count={burstCount} />
      </View>

      {/* ストリーク(ステージに重ねて浮かせる) */}
      <Card style={styles.streakCard}>
        <View style={styles.streakRow}>
          <PopOnChange value={streak} style={styles.streakMain}>
            <Text style={styles.streakNumber}>
              {char.streakEmoji} {streak}
              <Text style={styles.streakUnit}> 日連続</Text>
            </Text>
          </PopOnChange>
          <View style={styles.freezeBox}>
            <Text style={styles.freezeText}>❄️ ×{state.freezes}</Text>
            <Text style={styles.freezeSub}>フリーズ</Text>
          </View>
        </View>

        <View style={styles.weekRow}>
          {week.map((d, i) => (
            <View key={d.key} style={styles.weekCell}>
              <Text style={styles.weekLabel}>{d.label}</Text>
              <PopIn delay={i * 50}>
                <View
                  style={[
                    styles.weekBlock,
                    d.done && { backgroundColor: colors.success },
                    d.frozen && { backgroundColor: colors.freeze },
                    d.missed && { backgroundColor: colors.dangerBg },
                    d.isToday && styles.weekBlockToday,
                  ]}
                >
                  {d.done && <Text style={styles.weekCheck}>✓</Text>}
                  {d.frozen && <Text style={styles.weekCheck}>❄</Text>}
                </View>
              </PopIn>
            </View>
          ))}
        </View>

        <View style={styles.levelRow}>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>Lv.{level.level}</Text>
          </View>
          <View style={styles.levelBar}>
            <BlockProgress
              total={LEVEL_BLOCKS}
              filled={Math.floor((level.into / level.need) * LEVEL_BLOCKS)}
              color={colors.gold}
              height={10}
            />
          </View>
          <Text style={styles.levelText}>あと{level.need - level.into}</Text>
        </View>
      </Card>

      {/* 夜の損失回避バナー */}
      {showDanger && (
        <Pulse>
          <View style={styles.dangerBanner}>
            <Text style={styles.dangerTitle}>
              ⏰ あと{formatCountdown(minutesUntilMidnight(now))}
            </Text>
            <Text style={styles.dangerText}>1タスクで {streak}日の記録を守れる!</Text>
          </View>
        </Pulse>
      )}

      {/* 今日のミッション(デイリーゴールと一体) */}
      <Card style={styles.missionCard}>
        <View style={styles.goalRow}>
          <Text style={styles.missionHeading}>きょうのミッション</Text>
          {doneToday >= goal ? (
            <PopIn popKey="done">
              <View style={styles.goalDonePill}>
                <Text style={styles.goalDoneText}>達成!🎉</Text>
              </View>
            </PopIn>
          ) : (
            <Text style={styles.goalText}>
              {doneToday}
              <Text style={styles.goalTotal}> / {goal}</Text>
            </Text>
          )}
        </View>
        <BlockProgress total={goal} filled={doneToday} color={colors.success} height={16} />

        <View style={styles.missionList}>
          {missionTasks.length === 0 && (
            <Text style={styles.emptyText}>「タスク」タブから追加してね</Text>
          )}
          {missionTasks.map((task, i) => (
            <MissionRow
              key={task.id}
              task={task}
              done={doneTaskIds.has(task.id)}
              bordered={i > 0}
              onComplete={() => completeTask(task.id)}
              onUncomplete={() => uncompleteTask(task.id)}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

/** ミッション1行。押すとふにっと沈み、完了時は +XP がふわっと浮かぶ */
function MissionRow({
  task,
  done,
  bordered,
  onComplete,
  onUncomplete,
}: {
  task: Task;
  done: boolean;
  bordered: boolean;
  onComplete: () => void;
  onUncomplete: () => void;
}) {
  const [xpPlay, setXpPlay] = useState(0);
  const area = areaOf(task.areaId);

  const handlePress = () => {
    if (done) {
      onUncomplete();
    } else {
      setXpPlay((p) => p + 1);
      onComplete();
    }
  };

  return (
    <Bouncy onPress={handlePress} style={styles.missionRowOuter}>
      <View style={[styles.missionRow, bordered && styles.missionRowBorder]}>
        <CheckBlock done={done} size={30} />
        <View style={styles.missionBody}>
          <Text style={[styles.missionTitle, done && styles.missionTitleDone]}>
            {task.title}
          </Text>
        </View>
        <View style={[styles.xpChip, done && styles.xpChipDone]}>
          <Text style={[styles.xpChipText, { color: done ? colors.success : area.color }]}>
            +{task.xp}
          </Text>
        </View>
        <FloatUp play={xpPlay} text={`+${task.xp} XP`} color={colors.gold} />
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  stage: {
    marginHorizontal: -16,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 44,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    maxWidth: '92%',
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: font.rounded },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.card,
    marginBottom: 2,
    alignSelf: 'center',
  },
  ground: {
    width: 120,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 43, 28, 0.08)',
    marginTop: -8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  charName: { fontSize: 17, fontWeight: '700', color: colors.text },
  titlePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  titlePillText: { fontSize: 11, color: colors.sub },
  streakCard: { gap: 14, marginTop: -32 },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
  streakMain: { flex: 1, alignItems: 'flex-start' },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  streakUnit: { fontSize: 16, fontWeight: '600', color: colors.sub },
  freezeBox: {
    backgroundColor: colors.freezeSoft,
    borderRadius: radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  freezeText: { fontSize: 18, fontWeight: '700', color: colors.freeze },
  freezeSub: { fontSize: 10, color: colors.sub, marginTop: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center', gap: 5, flex: 1 },
  weekLabel: { fontSize: 10, fontWeight: '600', color: colors.sub },
  weekBlock: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBlockToday: { borderWidth: 2, borderColor: colors.primary },
  weekCheck: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelChip: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  levelChipText: { fontSize: 12, fontWeight: '800', color: colors.gold },
  levelBar: { flex: 1 },
  levelText: { fontSize: 11, color: colors.sub, fontVariant: ['tabular-nums'] },
  dangerBanner: {
    backgroundColor: colors.danger,
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  dangerTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  dangerText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.92)' },
  missionCard: { paddingBottom: 8 },
  missionHeading: { fontSize: 16, fontWeight: '800', color: colors.text },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  goalTotal: { fontSize: 15, fontWeight: '600', color: colors.sub },
  goalDonePill: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  goalDoneText: { fontSize: 13, fontWeight: '700', color: colors.success },
  missionList: { marginTop: 6 },
  missionRowOuter: { marginHorizontal: -6 },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    gap: 13,
  },
  missionRowBorder: { borderTopWidth: 1, borderTopColor: colors.faint },
  missionBody: { flex: 1 },
  missionTitle: { fontSize: 15, color: colors.text, lineHeight: 20 },
  missionTitleDone: { textDecorationLine: 'line-through', color: colors.sub },
  xpChip: {
    backgroundColor: colors.faint,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  xpChipDone: { backgroundColor: colors.successSoft },
  xpChipText: { fontSize: 12, fontWeight: '800' },
  emptyText: { fontSize: 14, color: colors.sub, paddingVertical: 12 },
});
