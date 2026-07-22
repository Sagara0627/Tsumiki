import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
import { AreaId, CharacterId } from '../store/types';
import { AREAS } from '../store/seed';
import { hasPermission, openSystemSettings, requestPermission } from '../notifications/notifications';
import { formatHM, todayKey } from '../utils/date';
import { colors, radius } from '../theme';
import { Card, SectionTitle } from '../components/ui';

export default function SettingsScreen() {
  const {
    state,
    setDailyGoal,
    setSound,
    setCareerPlan,
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

  // ---- キャリアプラン ----
  const career = state.career;
  const [goalDraft, setGoalDraft] = useState(career?.goal ?? '');
  useEffect(() => {
    setGoalDraft(career?.goal ?? '');
  }, [career?.goal]);

  const commitGoal = useCallback(() => {
    if (!career) return;
    setCareerPlan({ goal: goalDraft, focusAreas: career.focusAreas, autoAdd: career.autoAdd });
  }, [career, goalDraft, setCareerPlan]);

  const toggleFocusArea = useCallback(
    (id: AreaId) => {
      if (!career) return;
      const focusAreas = career.focusAreas.includes(id)
        ? career.focusAreas.filter((a) => a !== id)
        : [...career.focusAreas, id];
      setCareerPlan({ goal: career.goal, focusAreas, autoAdd: career.autoAdd });
    },
    [career, setCareerPlan]
  );

  const setAutoAdd = useCallback(
    (autoAdd: boolean) => {
      if (!career) return;
      setCareerPlan({ goal: career.goal, focusAreas: career.focusAreas, autoAdd });
    },
    [career, setCareerPlan]
  );

  const confirmDeletePlan = useCallback(() => {
    Alert.alert(
      'キャリアプランを削除',
      'おすすめの表示が止まります(追加ずみのタスクはそのまま残ります)。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: () => setCareerPlan(null) },
      ]
    );
  }, [setCareerPlan]);

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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
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

      {/* サウンド */}
      <SectionTitle>サウンド</SectionTitle>
      <Card style={styles.cardGap}>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>効果音</Text>
          <Switch
            value={state.settings.sound.sfx}
            onValueChange={(v) => setSound({ sfx: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>BGM(ループ再生)</Text>
          <Switch
            value={state.settings.sound.bgm}
            onValueChange={(v) => setSound({ bgm: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <Text style={styles.note}>
          効果音はタスク完了・お祝いのときに鳴ります。BGM はアプリを開いている間だけ流れ、マナーモード中は鳴りません。
        </Text>
      </Card>

      {/* キャリアプラン */}
      <SectionTitle>キャリアプラン</SectionTitle>
      <Card style={styles.cardGap}>
        {!career ? (
          <>
            <Text style={styles.note}>
              目指す姿を設定すると、タスク画面に目標へ向けた段階的なおすすめ(ステップ1→3)が届きます。
            </Text>
            <SettingButton
              label="🧭 目標を設定する"
              onPress={() => setCareerPlan({ goal: '', focusAreas: [], autoAdd: false })}
            />
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>目指す姿</Text>
            <TextInput
              style={styles.goalInput}
              value={goalDraft}
              onChangeText={setGoalDraft}
              onBlur={commitGoal}
              placeholder="例: 3年でテックリードになる"
              placeholderTextColor={colors.sub}
              returnKeyType="done"
            />
            <Text style={styles.fieldLabel}>重点領域(おすすめで優先されます)</Text>
            <View style={styles.areaChipRow}>
              {AREAS.map((a) => {
                const on = career.focusAreas.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    style={[
                      styles.areaChip,
                      on && { backgroundColor: `${a.color}24`, borderColor: a.color },
                    ]}
                    onPress={() => toggleFocusArea(a.id)}
                  >
                    <Text style={[styles.areaChipText, on && styles.areaChipTextOn]}>
                      {a.emoji} {a.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>おすすめを1日1件自動で追加</Text>
              <Switch
                value={career.autoAdd}
                onValueChange={setAutoAdd}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <Text style={styles.note}>
              完了を重ねると領域ごとにステップ2・3のタスクが解放されます。おすすめの「見送る」はいつでもやり直せます(プランを作り直すと復活)。
            </Text>
            <Pressable onPress={confirmDeletePlan} hitSlop={6}>
              <Text style={styles.removeText}>プランを削除</Text>
            </Pressable>
          </>
        )}
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
  heading: { fontSize: 28, fontWeight: '800', color: colors.text },
  cardGap: { gap: 10 },
  permBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.chip,
    padding: 12,
  },
  permText: { fontSize: 13, color: colors.danger, lineHeight: 18 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeButton: {
    backgroundColor: colors.faint,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  timeText: { fontSize: 17, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  reminderHint: { flex: 1, fontSize: 12, color: colors.sub },
  removeText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  addTimeButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  addTimeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  note: { fontSize: 11, color: colors.sub, lineHeight: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.sub },
  goalInput: {
    backgroundColor: colors.faint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
  },
  areaChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  areaChipText: { fontSize: 12, color: colors.sub, fontWeight: '600' },
  areaChipTextOn: { color: colors.text, fontWeight: '700' },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalLabel: { fontSize: 14, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  goalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  charRow: { flexDirection: 'row', gap: 10 },
  charOption: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  charOptionName: { fontSize: 14, fontWeight: '700', color: colors.text },
  charOptionTitle: { fontSize: 10, color: colors.sub },
  settingButton: {
    backgroundColor: colors.faint,
    borderRadius: radius.chip,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  settingButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  settingButtonDanger: { backgroundColor: colors.dangerBg },
  settingButtonTextDanger: { color: colors.danger },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    paddingBottom: 32,
  },
  pickerDone: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  pickerDoneText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
