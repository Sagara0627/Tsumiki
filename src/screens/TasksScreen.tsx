import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { AREAS, areaOf } from '../store/seed';
import { nextUnlockHint, recommendTemplates, STAGE_INFO } from '../store/roadmap';
import { AreaId, Task } from '../store/types';
import { todayKey } from '../utils/date';
import { colors, radius } from '../theme';
import { Card, CheckBlock } from '../components/ui';
import { Bouncy } from '../components/animations';
import { useSim } from '../components/SimRunner';
import TaskEditModal from '../components/TaskEditModal';

export default function TasksScreen() {
  const { state, now, completeTask, uncompleteTask, adoptTemplate, dismissTemplate } = useApp();
  const { openSim } = useSim();
  const insets = useSafeAreaInsets();
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultAreaId, setDefaultAreaId] = useState<AreaId>('tech');

  const today = todayKey(now);
  const doneTaskIds = useMemo(
    () => new Set(state.logs.filter((l) => l.dateKey === today).map((l) => l.taskId)),
    [state.logs, today]
  );

  const openNew = (areaId: AreaId) => {
    setEditing(null);
    setDefaultAreaId(areaId);
    setEditorOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setEditorOpen(true);
  };

  const recommendations = useMemo(() => recommendTemplates(state), [state]);
  const unlockHint = useMemo(() => nextUnlockHint(state), [state]);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>タスク</Text>
          <View style={styles.archiveToggle}>
            <Text style={styles.archiveLabel}>アーカイブ表示</Text>
            <Switch
              value={showArchived}
              onValueChange={setShowArchived}
              trackColor={{ true: colors.primary }}
              style={styles.archiveSwitch}
            />
          </View>
        </View>

        {/* キャリアプランのおすすめ(段階的な「つぎの一歩」) */}
        {state.career ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.areaTile, { backgroundColor: colors.primarySoft }]}>
                <Text style={styles.areaEmoji}>🧭</Text>
              </View>
              <View style={styles.sectionText}>
                <Text style={styles.sectionName}>つぎの一歩</Text>
                <Text style={styles.sectionDesc}>
                  {state.career.goal
                    ? `「${state.career.goal}」に向けたおすすめ`
                    : 'キャリアプランに向けたおすすめ'}
                </Text>
              </View>
            </View>
            <Card style={styles.taskCard}>
              {recommendations.length === 0 && (
                <Text style={styles.emptyText}>
                  いま出せるおすすめは全部追加ずみ!
                  {unlockHint
                    ? ` ${areaOf(unlockHint.areaId).emoji}${areaOf(unlockHint.areaId).short} をあと${unlockHint.remaining}回完了すると、ステップ${unlockHint.nextStage}「${STAGE_INFO[unlockHint.nextStage].name}」が解放されるよ。`
                    : ''}
                </Text>
              )}
              {recommendations.map((t, i) => {
                const area = areaOf(t.areaId);
                const stage = STAGE_INFO[t.stage];
                return (
                  <View key={t.id} style={[styles.taskRow, i > 0 && styles.taskRowBorder]}>
                    <View style={styles.taskBody}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <Text style={styles.taskMeta}>
                        {stage.emoji} {stage.name} ・ {area.emoji}
                        {area.short} ・ +{t.xp} XP
                      </Text>
                    </View>
                    <Pressable style={styles.recoDismiss} onPress={() => dismissTemplate(t.id)} hitSlop={6}>
                      <Text style={styles.recoDismissText}>見送る</Text>
                    </Pressable>
                    <Bouncy style={styles.addButton} onPress={() => adoptTemplate(t.id)} scaleTo={0.9}>
                      <Text style={styles.addButtonText}>+ 追加</Text>
                    </Bouncy>
                  </View>
                );
              })}
              {recommendations.length > 0 && unlockHint && (
                <Text style={styles.unlockNote}>
                  🔒 ステップ{unlockHint.nextStage}「{STAGE_INFO[unlockHint.nextStage].name}」は{' '}
                  {areaOf(unlockHint.areaId).short} をあと{unlockHint.remaining}回完了で解放
                </Text>
              )}
            </Card>
          </View>
        ) : (
          <Card style={styles.planCta}>
            <Text style={styles.planCtaText}>
              🧭 せってい → キャリアプランで目標を設定すると、目標に向けた段階的なおすすめタスクがここに届くよ。
            </Text>
          </Card>
        )}

        {AREAS.map((area) => {
          const tasks = state.tasks.filter(
            (t) => t.areaId === area.id && !t.warmup && (showArchived || !t.archived)
          );
          return (
            <View key={area.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.areaTile, { backgroundColor: `${area.color}24` }]}>
                  <Text style={styles.areaEmoji}>{area.emoji}</Text>
                </View>
                <View style={styles.sectionText}>
                  <Text style={styles.sectionName}>{area.name}</Text>
                  <Text style={styles.sectionDesc}>{area.description}</Text>
                </View>
                <Bouncy style={styles.addButton} onPress={() => openNew(area.id)} scaleTo={0.9}>
                  <Text style={styles.addButtonText}>+ 追加</Text>
                </Bouncy>
              </View>
              <Card style={styles.taskCard}>
                {tasks.length === 0 && (
                  <Text style={styles.emptyText}>タスクなし。「+ 追加」から登録できます。</Text>
                )}
                {tasks.map((task, i) => {
                  const done = doneTaskIds.has(task.id);
                  return (
                    <View key={task.id} style={[styles.taskRow, i > 0 && styles.taskRowBorder]}>
                      <Pressable
                        onPress={() =>
                          done
                            ? uncompleteTask(task.id)
                            : task.sim
                              ? openSim(task.areaId)
                              : completeTask(task.id)
                        }
                        disabled={task.archived}
                        hitSlop={6}
                      >
                        <CheckBlock done={done} size={26} disabled={task.archived} />
                      </Pressable>
                      <Pressable
                        style={styles.taskBody}
                        onPress={() =>
                          task.sim && !done ? openSim(task.areaId) : openEdit(task)
                        }
                      >
                        <Text
                          style={[
                            styles.taskTitle,
                            done && styles.taskTitleDone,
                            task.archived && styles.taskTitleArchived,
                          ]}
                        >
                          {task.archived ? '🗄️ ' : ''}
                          {task.title}
                        </Text>
                        <Text style={styles.taskMeta}>
                          {task.sim ? '🎙️ 声で練習 ・ ' : ''}+{task.xp} XP
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Card>
            </View>
          );
        })}
      </ScrollView>

      <TaskEditModal
        visible={editorOpen}
        task={editing}
        defaultAreaId={defaultAreaId}
        onClose={() => setEditorOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text },
  archiveToggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  archiveLabel: { fontSize: 12, color: colors.sub },
  archiveSwitch: { transform: [{ scale: 0.8 }] },
  section: { marginTop: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  areaTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaEmoji: { fontSize: 16 },
  sectionText: { flex: 1 },
  sectionName: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionDesc: { fontSize: 11, color: colors.sub, marginTop: 1 },
  addButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  addButtonText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  taskCard: { paddingVertical: 6 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  taskRowBorder: { borderTopWidth: 1, borderTopColor: colors.faint },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 14, color: colors.text, lineHeight: 19 },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.sub },
  taskTitleArchived: { color: colors.sub },
  taskMeta: { fontSize: 11, color: colors.sub, marginTop: 2 },
  emptyText: { fontSize: 13, color: colors.sub, paddingVertical: 10 },
  recoDismiss: { paddingHorizontal: 4, paddingVertical: 7 },
  recoDismissText: { fontSize: 12, color: colors.sub, fontWeight: '600' },
  unlockNote: {
    fontSize: 11,
    color: colors.sub,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: colors.faint,
  },
  planCta: { marginTop: 14 },
  planCtaText: { fontSize: 13, color: colors.sub, lineHeight: 19 },
});
