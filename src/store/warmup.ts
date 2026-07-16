import { AppState, Task } from './types';
import { currentStreak } from './streak';

/**
 * ウォームアップ層(導入期)。
 * ストリークがまだ育っていないうちは損失回避(「途切れるともったいない」)が
 * 原理的に効かない。そこで最初の数日は「30秒・どこでも・状況に依存しない」極小タスクを
 * 1件だけ出し、無条件で0→1のチェックを取らせる。ストリークが育ったら本格タスクへ卒業する。
 */

/** ウォームアップを卒業するストリーク日数。これ未満の間は導入期扱い(最初の継続マイルストーンと一致) */
export const WARMUP_GRADUATION_STREAK = 3;

/** 導入期か(損失回避が効き始める前)。ストリークが途切れると再び導入期に戻る(やさしい再オンボード) */
export function inWarmup(state: AppState, now: Date = new Date()): boolean {
  return currentStreak(state, now) < WARMUP_GRADUATION_STREAK;
}

/** 実効デイリーゴール。導入期は設定値によらず常に1件、卒業後は設定値 */
export function effectiveDailyGoal(state: AppState, now: Date = new Date()): number {
  return inWarmup(state, now) ? 1 : Math.max(1, state.settings.dailyGoal);
}

// 30秒で終わり、勤務中や会議など状況に依存しない極小アクション。
// areaId は関連の近い領域に寄せて XP・完了数を無駄にしない。ID は固定(冪等な補完のため)。
const WARMUP_DEFS: Array<{ id: string; areaId: Task['areaId']; title: string }> = [
  { id: 'warmup-1', areaId: 'tech', title: 'Zennかテック系アプリを開いて、トレンドのタイトルを3つ眺める' },
  { id: 'warmup-2', areaId: 'output', title: '今日いちばん「学んだ・できた」ことを1つ頭に思い浮かべる' },
  { id: 'warmup-3', areaId: 'drive', title: '今日ちょっとだけ進めたいことを1つ決める' },
  { id: 'warmup-4', areaId: 'hearing', title: '直近の会話で「もっと聞けたな」と思う点を1つ思い出す' },
  { id: 'warmup-5', areaId: 'tech', title: '使っているツールの新機能を1つ、名前だけ検索してみる' },
];

const WARMUP_XP = 5;

export function warmupTasks(): Task[] {
  const now = new Date().toISOString();
  return WARMUP_DEFS.map((d) => ({
    id: d.id,
    areaId: d.areaId,
    title: d.title,
    xp: WARMUP_XP,
    archived: false,
    createdAt: now,
    warmup: true,
  }));
}

/** 既存 state に欠けているウォームアップタスクを補う(冪等)。新規・移行のどちらもカバーする */
export function ensureWarmupTasks(state: AppState): AppState {
  const have = new Set(state.tasks.map((t) => t.id));
  const missing = warmupTasks().filter((t) => !have.has(t.id));
  if (missing.length === 0) return state;
  return { ...state, tasks: [...state.tasks, ...missing] };
}

/** 導入期の今日のミッション: まだ実施回数の少ないウォームアップを1件だけ選ぶ(日ごとに巡回する) */
export function pickWarmupMission(state: AppState): string[] {
  const warm = state.tasks.filter((t) => t.warmup && !t.archived);
  if (warm.length === 0) return [];
  const doneCount = new Map<string, number>();
  for (const log of state.logs) {
    doneCount.set(log.taskId, (doneCount.get(log.taskId) ?? 0) + 1);
  }
  warm.sort(
    (a, b) => (doneCount.get(a.id) ?? 0) - (doneCount.get(b.id) ?? 0) || a.id.localeCompare(b.id)
  );
  return [warm[0].id];
}
