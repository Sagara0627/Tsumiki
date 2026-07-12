import { AppState, Emotion } from './types';
import { currentStreak, isRecentlyBroken, isRecoveredToday, isTodayDone } from './streak';

/**
 * 画面表示用の「いまの気分」。
 * 優先度: 復帰(泣き笑い) > 完了(誇らしい) > 途切れ直後(しょんぼり)
 *        > 夜未完了(涙目) > 昼未完了(そわそわ) > 朝(応援)
 */
export function ambientEmotion(state: AppState, now: Date = new Date()): Emotion {
  if (isTodayDone(state, now)) {
    return isRecoveredToday(state, now) ? 'relieved' : 'proud';
  }
  if (isRecentlyBroken(state, now)) return 'sad';

  const hour = now.getHours();
  if (hour >= 19) {
    // 守るべきストリークがある夜は涙目、なければそわそわ止まり
    return currentStreak(state, now) > 0 ? 'tearful' : 'worried';
  }
  if (hour >= 12) return 'worried';
  return 'cheer';
}

/** 通知スロット(時刻帯)ごとの感情 */
export type NotifSlot = 'morning' | 'noon' | 'evening' | 'lastCall';

export function slotForHour(hour: number): NotifSlot {
  if (hour < 11) return 'morning';
  if (hour < 17) return 'noon';
  if (hour < 21) return 'evening';
  return 'lastCall';
}

export const SLOT_EMOTION: Record<NotifSlot, Emotion> = {
  morning: 'cheer',
  noon: 'worried',
  evening: 'tearful',
  lastCall: 'tearful',
};
