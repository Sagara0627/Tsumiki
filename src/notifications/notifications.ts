import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { AppState, Celebration } from '../store/types';
import { getCharacter } from '../characters';
import { currentStreak, isTodayDone } from '../store/streak';
import { NotifSlot, SLOT_EMOTION, slotForHour } from '../store/mood';
import { addDaysKey, keyToDate, todayKey } from '../utils/date';
import { stableHash } from '../utils/id';
import { attachmentCopyUri } from './characterImages';

/** アプリがフォアグラウンドでも通知バナーを表示する(称賛通知用) */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function hasPermission(): Promise<boolean> {
  const s = await Notifications.getPermissionsAsync();
  return s.granted || s.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestPermission(): Promise<boolean> {
  const s = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return s.granted || s.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export function openSystemSettings(): void {
  void Linking.openSettings();
}

/** キャラ表情 PNG があれば iOS リッチ通知の添付にする */
function attachmentsFor(state: AppState, slot: NotifSlot | 'celebrate') {
  if (Platform.OS !== 'ios') return undefined;
  const emotion = slot === 'celebrate' ? 'celebrate' : SLOT_EMOTION[slot];
  const uri = attachmentCopyUri(state.settings.characterId, emotion);
  if (!uri) return undefined;
  return [{ identifier: 'character', url: uri, type: 'image' }];
}

/**
 * セリフを日付ハッシュで安定抽選する。
 * streak が実数で使えない場合({streak} 入りが不自然な場合)は
 * プレースホルダなしの行を優先し、なければ汎用語に置換する。
 */
function pickLine(pool: string[], seed: string, streak: number | null): string {
  const usable =
    streak !== null && streak > 0 ? pool : pool.filter((l) => !l.includes('{streak}'));
  const candidates = usable.length > 0 ? usable : pool;
  const line = candidates[stableHash(seed) % candidates.length];
  if (streak !== null && streak > 0) {
    return line.replaceAll('{streak}', String(streak));
  }
  // 翌日以降は実数が読めないため汎用語に置換(数字のズレ防止)
  return line.replaceAll('{streak}日分', 'これまで').replaceAll('{streak}日', 'これまで');
}

/**
 * 今後7日ぶんのリマインダーを全キャンセル→再スケジュールする。
 * 繰り返しトリガーを使わないのは「今日完了済みなら今日の残り通知を
 * スキップする」出し分けのため。7日×最大4回=28件 < iOS 上限64。
 */
export async function syncReminders(state: AppState, now: Date = new Date()): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!(await hasPermission())) return;

    const char = getCharacter(state.settings.characterId);
    const streak = currentStreak(state, now);
    const todayDone = isTodayDone(state, now);
    const today = todayKey(now);

    for (let day = 0; day < 7; day++) {
      // 今日完了済みなら今日の残り通知は出さない(Duolingo 方式)
      if (day === 0 && todayDone) continue;
      const dateKey = addDaysKey(today, day);

      for (const r of state.settings.reminderTimes) {
        const fireDate = keyToDate(dateKey);
        fireDate.setHours(r.hour, r.minute, 0, 0);
        if (fireDate.getTime() <= now.getTime()) continue;

        const slot = slotForHour(r.hour);
        const isToday = day === 0;
        const effectiveStreak = isToday ? streak : null;
        const body = pickLine(char.notif[slot], `${dateKey}:${slot}:${r.id}`, effectiveStreak);

        // 夜に守るべきストリークがある日はタイトルを強化する
        let title = `${char.streakEmoji} ${char.name}`;
        if (slot === 'evening' || slot === 'lastCall') {
          if (isToday && streak > 0) {
            title =
              slot === 'evening'
                ? `⚠️ ${streak}日の記録が途切れそう`
                : `🚨 ${streak}日が消える寸前!`;
          } else if (!isToday) {
            title = slot === 'evening' ? '⚠️ 記録が途切れそう' : '🚨 今日の1タスク、まだだよ!';
          }
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: slot === 'lastCall' ? 'default' : undefined,
            attachments: attachmentsFor(state, slot),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
          },
        });
      }
    }
  } catch {
    // 通知はベストエフォート(シミュレータ・権限なし等で失敗してもアプリは動かす)
  }
}

/** レベルアップ・マイルストーン達成などの即時称賛通知 */
export async function sendCelebration(state: AppState, c: Celebration): Promise<void> {
  try {
    if (!(await hasPermission())) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: c.title,
        body: c.message,
        sound: 'default',
        attachments: attachmentsFor(state, 'celebrate'),
      },
      trigger: null,
    });
  } catch {
    // ベストエフォート
  }
}
