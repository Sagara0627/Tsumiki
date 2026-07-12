import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AreaId, Task } from '../store/types';
import { AREAS } from '../store/seed';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme';

const XP_OPTIONS = [5, 10, 15, 20, 30];

interface Props {
  visible: boolean;
  /** null なら新規作成 */
  task: Task | null;
  /** 新規作成時の初期領域 */
  defaultAreaId?: AreaId;
  onClose: () => void;
}

export default function TaskEditModal({ visible, task, defaultAreaId, onClose }: Props) {
  const { addTask, updateTask, archiveTask } = useApp();
  const [title, setTitle] = useState('');
  const [areaId, setAreaId] = useState<AreaId>('tech');
  const [xp, setXp] = useState(10);

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setAreaId(task?.areaId ?? defaultAreaId ?? 'tech');
    setXp(task?.xp ?? 10);
  }, [visible, task, defaultAreaId]);

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    if (task) {
      updateTask(task.id, { title: title.trim(), areaId, xp });
    } else {
      addTask({ title: title.trim(), areaId, xp });
    }
    onClose();
  };

  const toggleArchive = () => {
    if (!task) return;
    archiveTask(task.id, !task.archived);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.heading}>{task ? 'タスクを編集' : 'タスクを追加'}</Text>

          <Text style={styles.label}>タイトル</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="例: 技術記事を1本読む(15分)"
            placeholderTextColor={colors.sub}
            autoFocus={!task}
          />

          <Text style={styles.label}>スキル領域</Text>
          <View style={styles.chipRow}>
            {AREAS.map((a) => {
              const selected = a.id === areaId;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setAreaId(a.id)}
                  style={[
                    styles.selectChip,
                    selected && { backgroundColor: a.color, borderColor: a.color },
                  ]}
                >
                  <Text style={[styles.selectChipText, selected && styles.selectChipTextOn]}>
                    {a.emoji} {a.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>XP(タスクの重さ)</Text>
          <View style={styles.chipRow}>
            {XP_OPTIONS.map((v) => {
              const selected = v === xp;
              return (
                <Pressable
                  key={v}
                  onPress={() => setXp(v)}
                  style={[
                    styles.selectChip,
                    selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.selectChipText, selected && styles.selectChipTextOn]}>
                    {v}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={onClose}>
              <Text style={styles.buttonGhostText}>キャンセル</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonPrimary, !canSave && styles.buttonDisabled]}
              onPress={save}
              disabled={!canSave}
            >
              <Text style={styles.buttonPrimaryText}>保存</Text>
            </Pressable>
          </View>

          {task && (
            <Pressable style={styles.archiveButton} onPress={toggleArchive}>
              <Text style={styles.archiveText}>
                {task.archived ? '↩️ アーカイブから戻す' : '🗄️ アーカイブする(一覧から隠す)'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 6,
  },
  heading: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.sub, marginTop: 10 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  selectChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  selectChipTextOn: { color: '#FFF' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: {
    flex: 1,
    borderRadius: radius.chip,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.4 },
  buttonGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonGhostText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  archiveButton: { marginTop: 14, alignItems: 'center' },
  archiveText: { fontSize: 13, color: colors.sub, fontWeight: '600' },
});
