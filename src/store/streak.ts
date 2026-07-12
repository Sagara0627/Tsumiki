import { AppState } from './types';
import { addDaysKey, daysBetweenKeys, todayKey } from '../utils/date';

/** 完了ログがある日の集合 */
export function completedDateSet(state: AppState): Set<string> {
  return new Set(state.logs.map((l) => l.dateKey));
}

export function completionsOn(state: AppState, key: string): number {
  return state.logs.filter((l) => l.dateKey === key).length;
}

/** 今日1件以上完了していれば今日のストリークは安全 */
export function isTodayDone(state: AppState, now: Date = new Date()): boolean {
  return completionsOn(state, todayKey(now)) > 0;
}

/**
 * 現在のストリークをログ+フリーズ履歴から導出する。
 * - 連続性: 完了日またはフリーズ日が連続していれば継続
 * - カウント: 完了日のみを数える(フリーズ日は日数に含めない = Duolingo 方式)
 * - 今日未完了でもまだ「途切れた」扱いにはしない(今日中ならセーフ)
 */
export function currentStreak(state: AppState, now: Date = new Date()): number {
  const done = completedDateSet(state);
  const frozen = new Set(state.frozenDates);
  const today = todayKey(now);

  let cursor = today;
  let count = 0;
  if (done.has(today)) {
    count = 1;
    cursor = addDaysKey(today, -1);
  } else {
    cursor = addDaysKey(today, -1); // 今日はまだ猶予中
  }
  while (done.has(cursor) || frozen.has(cursor)) {
    if (done.has(cursor)) count += 1;
    cursor = addDaysKey(cursor, -1);
  }
  return count;
}

/**
 * アプリ起動・フォアグラウンド復帰時の整合処理。
 * 最後のアクティブ日から今日までの「空白日」を検査し、
 * - フリーズで全てカバーできるなら自動消費して継続を守る
 * - できなければストリークは途切れ、lastBreakDate を記録する
 * 冪等(同じ状態で何度呼んでも結果が変わらない)。
 */
export function reconcile(state: AppState, now: Date = new Date()): AppState {
  const done = completedDateSet(state);
  const frozen = new Set(state.frozenDates);
  const active = [...done, ...frozen].sort();
  if (active.length === 0) return state;

  const lastActive = active[active.length - 1];
  const today = todayKey(now);
  const gap = daysBetweenKeys(lastActive, today) - 1; // 昨日までの空白日数
  if (gap <= 0) return state;

  // 空白日のうちフリーズ未適用の日を列挙
  const uncovered: string[] = [];
  for (let i = 1; i <= gap; i++) {
    const k = addDaysKey(lastActive, i);
    if (!frozen.has(k) && !done.has(k)) uncovered.push(k);
  }
  if (uncovered.length === 0) return state;

  // 守るべきストリークがあった場合のみフリーズを使う
  const hadStreak = currentStreakAt(state, lastActive) > 0;
  if (hadStreak && uncovered.length <= state.freezes) {
    return {
      ...state,
      freezes: state.freezes - uncovered.length,
      frozenDates: [...state.frozenDates, ...uncovered],
    };
  }
  // 途切れ確定
  if (hadStreak && state.lastBreakDate !== uncovered[0]) {
    return { ...state, lastBreakDate: uncovered[0] };
  }
  return state;
}

/** 指定日時点のストリーク(その日を含めて遡る) */
function currentStreakAt(state: AppState, key: string): number {
  const done = completedDateSet(state);
  const frozen = new Set(state.frozenDates);
  let cursor = key;
  let count = 0;
  while (done.has(cursor) || frozen.has(cursor)) {
    if (done.has(cursor)) count += 1;
    cursor = addDaysKey(cursor, -1);
  }
  return count;
}

/** 直近の途切れから復帰した当日か(泣いて喜ぶ演出用) */
export function isRecoveredToday(state: AppState, now: Date = new Date()): boolean {
  if (!state.lastBreakDate) return false;
  if (!isTodayDone(state, now)) return false;
  const streak = currentStreak(state, now);
  return streak === 1 && daysBetweenKeys(state.lastBreakDate, todayKey(now)) <= 3;
}

/** ごく最近途切れて、まだ復帰していない状態か(しょんぼり演出用) */
export function isRecentlyBroken(state: AppState, now: Date = new Date()): boolean {
  if (!state.lastBreakDate) return false;
  if (isTodayDone(state, now)) return false;
  if (currentStreak(state, now) > 0) return false;
  return daysBetweenKeys(state.lastBreakDate, todayKey(now)) <= 2;
}

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 60, 100, 150, 200, 365];
export const MAX_FREEZES = 2;
