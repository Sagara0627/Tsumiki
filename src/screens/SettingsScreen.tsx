import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useApp } from '../store/AppContext';
import { CHARACTERS } from '../characters';
import CharacterView from '../characters/CharacterView';
import { CharacterId } from '../store/types';
import { hasPermission, openSystemSettings, requestPermission } from '../notifications/notifications';
import { formatHM, todayKey } from '../utils/date';
import { colors, radius } from '../theme';
import { Card, SectionTitle } from '../components/ui';

export default function SettingsScreen() {
  const {
    state,
    setDailyGoal,
    setCharacter,
    addReminderTime,
    updateReminderTime,
    removeReminderTime,
    exportJson,
    importJson,
    resetAll,
  } = useApp();
  const insets = useSafeAreaInsets();

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  useEffect(() => {
    void hasPermission().then(setNotifGranted);
  }, []);

  const askPermission = useCallback(async () => {
    const ok = await requestPermission();
    setNotifGranted(ok);
    if (!ok) {
      Alert.alert(
        '通知が許可されていません',
        'リマインダーを受け取るには、iOSの設定アプリから通知を許可してください。',
        [
          { text: 'あとで', style: 'cancel' },
          { text: '設定を開く', onPress: openSystemSettings },
        ]
      );
    }
  }, []);

  const pickerTarget = state.settings.reminderTimes.find((r) => r.id === pickerFor) ?? null;

  const onPickTime = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerFor(null);
      if (event.type !== 'set' || !date || !pickerTarget) return;
      updateReminderTime(pickerTarget.id, date.getHours(), date.getMinutes());
    },
    [pickerTarget, updateReminderTime]
  );

  // ---- バックアップ ----
  const shareExport = useCallback(async () => {
    try {
      const file = new File(Paths.cache, `tsumiki-export-${todayKey(new Date())}.json`);
      if (file.exists) file.delete();
      file.write(exportJson());
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Tsumiki データをエクスポート',
      });
    } catch (e) {
      Alert.alert('エクスポートに失敗しました', String(e));
    }
  }, [exportJson]);

  const copyExport = useCallback(async () => {
    await Clipboard.setStringAsync(exportJson());
    Alert.alert('コピーしました', 'エクスポートJSONをクリップボードにコピーしました。');
  }, [exportJson]);

  const confirmImport = useCallback(
    (loadJson: () => Promise<string | null>) => {
      Alert.alert('データをインポート', '現在のデータはすべて上書きされます。よろしいですか?', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'インポート',
          style: 'destructive',
          onPress: async () => {
            try {
              const json = await loadJson();
              if (json === null) return; // ユーザーがキャンセル
              importJson(json);
              Alert.alert('インポート完了', 'データを読み込みました。');
            } catch (e) {
              Alert.alert('インポートに失敗しました', e instanceof Error ? e.message : String(e));
            }
          },
        },
      ]);
    },
    [importJson]
  );

  const importFromFile = useCallback(() => {
    confirmImport(async () => {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets[0]) return null;
      return new File(res.assets[0].uri).text();
    });
  }, [confirmImport]);

  const importFromClipboard = useCallback(() => {
    confirmImport(async () => {
      const text = await Clipboard.getStringAsync();
      if (!text) throw new Error('クリップボードが空です。');
      return text;
    });
  }, [confirmImport]);

  const confirmReset = useCallback(() => {
    Alert.alert(
      'すべてリセット',
      'タスク・ログ・ストリーク・バッジがすべて消えます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'リセットする', style: 'destructive', onPress: () => void resetAll() },
      ]
    );
  }, [resetAll]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
    >
      <Text style={styles.heading}>せってい</Text>

      {/* 通知 */}
      <SectionTitle>通知リマインダー</SectionTitle>
      <Card style={styles.cardGap}>
        {notifGranted === false && (
          <Pressable style={styles.permBanner} onPress={askPermission}>
            <Text style={styles.permText}>
              🔕 通知が許可されていません。タップして許可すると、キャラがリマインドしてくれます。
            </Text>
          </Pressable>
        )}
        {state.settings.reminderTimes.map((r) => (
          <View key={r.id} style={styles.reminderRow}>
            <Pressable style={styles.timeButton} onPress={() => setPickerFor(r.id)}>
              <Text style={styles.timeText}>{formatHM(r.hour, r.minute)}</Text>
            </Pressable>
            <Text style={styles.reminderHint}>{slotHint(r.hour)}</Text>
            <Pressable onPress={() => removeReminderTime(r.id)} hitSlop={8}>
              <Text style={styles.removeText}>削除</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addTimeButton} onPress={() => addReminderTime(20, 0)}>
          <Text style={styles.addTimeText}>+ 時刻を追加</Text>
        </Pressable>
        <Text style={styles.note}>
          今日のタスクを完了すると、その日の残りの通知は自動でスキップされます。
        </Text>
      </Card>

      {/* デイリーゴール */}
      <SectionTitle>デイリーゴール</SectionTitle>
      <Card>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>1日の目標タスク数</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepButton}
              onPress={() => setDailyGoal(state.settings.dailyGoal - 1)}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.goalValue}>{state.settings.dailyGoal}</Text>
            <Pressable
              style={styles.stepButton}
              onPress={() => setDailyGoal(state.settings.dailyGoal + 1)}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.note}>ストリーク自体は1日1タスクでつながります。</Text>
      </Card>

      {/* キャラクター */}
      <SectionTitle>パートナー</SectionTitle>
      <Card>
        <View style={styles.charRow}>
          {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => {
            const def = CHARACTERS[id];
            const selected = id === state.settings.characterId;
            return (
              <Pressable
                key={id}
                style={[
                  styles.charOption,
                  { backgroundColor: def.bgColor },
                  selected && { borderColor: def.themeColor, borderWidth: 3 },
                ]}
                onPress={() => setCharacter(id)}
              >
                <CharacterView characterId={id} emotion="proud" size={72} />
                <Text style={styles.charOptionName}>
                  {selected ? '✓ ' : ''}
                  {def.name}
                </Text>
                <Text style={styles.charOptionTitle}>{def.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* バックアップ */}
      <SectionTitle>バックアップ</SectionTitle>
      <Card style={styles.cardGap}>
        <SettingButton label="📤 エクスポート(共有)" onPress={() => void shareExport()} />
        <SettingButton label="📋 クリップボードにコピー" onPress={() => void copyExport()} />
        <SettingButton label="📥 ファイルからインポート" onPress={importFromFile} />
        <SettingButton label="📎 クリップボードから復元" onPress={importFromClipboard} />
      </Card>

      {/* リセット */}
      <SectionTitle>危険な操作</SectionTitle>
      <Card>
        <SettingButton label="🗑️ すべてのデータをリセット" danger onPress={confirmReset} />
      </Card>

      {/* 時刻ピッカー */}
      {pickerTarget &&
        (Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" onRequestClose={() => setPickerFor(null)}>
            <View style={styles.pickerBackdrop}>
              <View style={styles.pickerSheet}>
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  value={timeToDate(pickerTarget.hour, pickerTarget.minute)}
                  onChange={onPickTime}
                />
                <Pressable style={styles.pickerDone} onPress={() => setPickerFor(null)}>
                  <Text style={styles.pickerDoneText}>完了</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            mode="time"
            value={timeToDate(pickerTarget.hour, pickerTarget.minute)}
            onChange={onPickTime}
          />
        ))}
    </ScrollView>
  );
}

function timeToDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function slotHint(hour: number): string {
  if (hour < 11) return '朝の後押し';
  if (hour < 17) return '昼のそわそわ';
  if (hour < 21) return '夜の警告';
  return '最終確認';
}

function SettingButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={[styles.settingButton, danger && styles.settingButtonDanger]} onPress={onPress}>
      <Text style={[styles.settingButtonText, danger && styles.settingButtonTextDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  cardGap: { gap: 10 },
  permBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.chip,
    padding: 12,
  },
  permText: { fontSize: 13, color: colors.danger, lineHeight: 18 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeText: { fontSize: 17, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  reminderHint: { flex: 1, fontSize: 12, color: colors.sub },
  removeText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  addTimeButton: { alignSelf: 'flex-start' },
  addTimeText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  note: { fontSize: 11, color: colors.sub, lineHeight: 16 },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalLabel: { fontSize: 14, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  goalValue: { fontSize: 18, fontWeight: '800', color: colors.text, minWidth: 24, textAlign: 'center' },
  charRow: { flexDirection: 'row', gap: 10 },
  charOption: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  charOptionName: { fontSize: 14, fontWeight: '700', color: colors.text },
  charOptionTitle: { fontSize: 10, color: colors.sub },
  settingButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  settingButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  settingButtonDanger: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  settingButtonTextDanger: { color: colors.danger },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
  },
  pickerDone: {
    backgroundColor: colors.primary,
    borderRadius: radius.chip,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerDoneText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
