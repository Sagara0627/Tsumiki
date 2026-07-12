import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { getCharacter } from '../characters';
import CharacterView from '../characters/CharacterView';
import { ambientEmotion } from '../store/mood';
import { completionsOn, currentStreak, isTodayDone, MAX_FREEZES } from '../store/streak';
import { levelFromXp } from '../store/xp';
import { areaOf } from '../store/seed';
import { formatCountdown, minutesUntilMidnight, todayKey } from '../utils/date';
import { stableHash } from '../utils/id';
import { colors, radius } from '../theme';
import { Card, ProgressBar, SectionTitle } from '../components/ui';

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

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
    >
      {/* キャラクター */}
      <View style={[styles.charCard, { backgroundColor: char.bgColor }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{speech}</Text>
        </View>
        <View style={styles.bubbleTail} />
        <CharacterView characterId={char.id} emotion={emotion} size={160} />
        <Text style={styles.charName}>
          {char.name}
          <Text style={styles.charTitle}>({char.title})</Text>
        </Text>
      </View>

      {/* ストリーク */}
      <Card style={styles.streakCard}>
        <View style={styles.streakRow}>
          <View style={styles.streakMain}>
            <Text style={styles.streakNumber}>
              {char.streakEmoji} {streak}
              <Text style={styles.streakUnit}> 日連続</Text>
            </Text>
            <Text style={styles.streakSub}>
              最長 {state.longest}日 ・ レベル{level.level}
            </Text>
          </View>
          <View style={styles.freezeBox}>
            <Text style={styles.freezeText}>❄️ ×{state.freezes}</Text>
            <Text style={styles.freezeSub}>フリーズ(最大{MAX_FREEZES})</Text>
          </View>
        </View>
        <View style={styles.levelRow}>
          <ProgressBar ratio={level.into / level.need} color={colors.gold} height={8} />
          <Text style={styles.levelText}>
            次のレベルまで {level.need - level.into} XP
          </Text>
        </View>
      </Card>

      {/* 夜の損失回避バナー */}
      {showDanger && (
        <View style={styles.dangerBanner}>
          <Text style={styles.dangerTitle}>
            ⏰ 今日終了まで {formatCountdown(minutesUntilMidnight(now))}
          </Text>
          <Text style={styles.dangerText}>
            あと1タスクで {streak}日の記録を守れる!
          </Text>
        </View>
      )}

      {/* デイリーゴール */}
      <SectionTitle>今日のゴール</SectionTitle>
      <Card>
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>
            {doneToday} / {state.settings.dailyGoal} タスク
          </Text>
          {doneToday >= state.settings.dailyGoal && <Text style={styles.goalDone}>達成!🎉</Text>}
        </View>
        <ProgressBar ratio={doneToday / state.settings.dailyGoal} color={colors.success} />
      </Card>

      {/* 今日のミッション */}
      <SectionTitle>今日のミッション</SectionTitle>
      <Card style={styles.missionCard}>
        {missionTasks.length === 0 && (
          <Text style={styles.emptyText}>
            タスクがありません。「タスク」タブから追加してください。
          </Text>
        )}
        {missionTasks.map((task, i) => {
          const done = doneTaskIds.has(task.id);
          const area = areaOf(task.areaId);
          return (
            <Pressable
              key={task.id}
              onPress={() => (done ? uncompleteTask(task.id) : completeTask(task.id))}
              style={[styles.missionRow, i > 0 && styles.missionRowBorder]}
            >
              <View
                style={[
                  styles.checkbox,
                  done && { backgroundColor: colors.success, borderColor: colors.success },
                ]}
              >
                {done && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.missionBody}>
                <Text style={[styles.missionTitle, done && styles.missionTitleDone]}>
                  {task.title}
                </Text>
                <Text style={styles.missionMeta}>
                  {area.emoji} {area.short} ・ +{task.xp} XP
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Text style={styles.footnote}>
        1日1タスクでもストリークはつながるよ({char.actionWord}1回でOK)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  charCard: {
    borderRadius: radius.card,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '92%',
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.card,
    marginBottom: 4,
  },
  charName: { marginTop: 4, fontSize: 16, fontWeight: '700', color: colors.text },
  charTitle: { fontSize: 13, fontWeight: '400', color: colors.sub },
  streakCard: { gap: 12 },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
  streakMain: { flex: 1 },
  streakNumber: { fontSize: 34, fontWeight: '800', color: colors.text },
  streakUnit: { fontSize: 16, fontWeight: '600', color: colors.sub },
  streakSub: { marginTop: 2, fontSize: 13, color: colors.sub },
  freezeBox: {
    backgroundColor: '#EAF6FD',
    borderRadius: radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  freezeText: { fontSize: 18, fontWeight: '700', color: colors.freeze },
  freezeSub: { fontSize: 10, color: colors.sub, marginTop: 2 },
  levelRow: { gap: 4 },
  levelText: { fontSize: 11, color: colors.sub, textAlign: 'right' },
  dangerBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 14,
    gap: 4,
  },
  dangerTitle: { fontSize: 15, fontWeight: '800', color: colors.danger },
  dangerText: { fontSize: 14, color: colors.danger },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalText: { fontSize: 16, fontWeight: '700', color: colors.text },
  goalDone: { fontSize: 14, fontWeight: '700', color: colors.success },
  missionCard: { paddingVertical: 4 },
  missionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  missionRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  missionBody: { flex: 1 },
  missionTitle: { fontSize: 15, color: colors.text, lineHeight: 20 },
  missionTitleDone: { textDecorationLine: 'line-through', color: colors.sub },
  missionMeta: { fontSize: 12, color: colors.sub, marginTop: 2 },
  emptyText: { fontSize: 14, color: colors.sub, paddingVertical: 12 },
  footnote: { fontSize: 12, color: colors.sub, textAlign: 'center', marginTop: 4 },
});
