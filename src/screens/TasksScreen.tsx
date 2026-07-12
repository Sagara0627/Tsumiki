import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { AREAS } from '../store/seed';
import { AreaId, Task } from '../store/types';
import { todayKey } from '../utils/date';
import { colors, radius } from '../theme';
import { Card } from '../components/ui';
import TaskEditModal from '../components/TaskEditModal';

export default function TasksScreen() {
  const { state, now, completeTask, uncompleteTask } = useApp();
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

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>タスク</Text>
          <View style={styles.archiveToggle}>
            <Text style={styles.archiveLabel}>アーカイブ表示</Text>
            <Switch
              value={showArchived}
              onValueChange={setShowArchived}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        {AREAS.map((area) => {
          const tasks = state.tasks.filter(
            (t) => t.areaId === area.id && (showArchived || !t.archived)
          );
          return (
            <View key={area.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.areaDot, { backgroundColor: area.color }]} />
                <Text style={styles.sectionName}>
                  {area.emoji} {area.name}
                </Text>
                <Pressable style={styles.addButton} onPress={() => openNew(area.id)}>
                  <Text style={styles.addButtonText}>+ 追加</Text>
                </Pressable>
              </View>
              <Text style={styles.sectionDesc}>{area.description}</Text>
              <Card style={styles.taskCard}>
                {tasks.length === 0 && (
                  <Text style={styles.emptyText}>タスクなし。「+ 追加」から登録できます。</Text>
                )}
                {tasks.map((task, i) => {
                  const done = doneTaskIds.has(task.id);
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskRow, i > 0 && styles.taskRowBorder]}
                    >
                      <Pressable
                        onPress={() =>
                          done ? uncompleteTask(task.id) : completeTask(task.id)
                        }
                        disabled={task.archived}
                        style={[
                          styles.checkbox,
                          done && { backgroundColor: colors.success, borderColor: colors.success },
                          task.archived && styles.checkboxDisabled,
                        ]}
                      >
                        {done && <Text style={styles.checkmark}>✓</Text>}
                      </Pressable>
                      <Pressable style={styles.taskBody} onPress={() => openEdit(task)}>
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
                        <Text style={styles.taskMeta}>+{task.xp} XP ・ タップで編集</Text>
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
    marginBottom: 8,
  },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  archiveToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  archiveLabel: { fontSize: 12, color: colors.sub },
  section: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  areaDot: { width: 10, height: 10, borderRadius: 5 },
  sectionName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  addButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addButtonText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  sectionDesc: { fontSize: 11, color: colors.sub, marginBottom: 6, marginLeft: 18 },
  taskCard: { paddingVertical: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  taskRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDisabled: { opacity: 0.3 },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 14, color: colors.text, lineHeight: 19 },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.sub },
  taskTitleArchived: { color: colors.sub },
  taskMeta: { fontSize: 11, color: colors.sub, marginTop: 2 },
  emptyText: { fontSize: 13, color: colors.sub, paddingVertical: 10 },
});
