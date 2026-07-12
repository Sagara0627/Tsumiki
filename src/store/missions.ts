import { AppState, AreaId, Task } from './types';
import { AREAS } from './seed';
import { perAreaCounts } from './xp';
import { todayKey } from '../utils/date';

/**
 * 今日のデイリーミッションを生成する。
 * - 完了数が少ない領域を優先し、各領域から最も実施回数の少ないタスクを
 *   ラウンドロビンで dailyGoal 件選出する
 * - 日付が変わって最初の呼び出しでのみ再生成(同日中は固定)
 */
export function ensureMissions(state: AppState, now: Date = new Date()): AppState {
  const today = todayKey(now);
  if (state.missions.dateKey === today) return state;
  return { ...state, missions: { dateKey: today, taskIds: pickMissions(state) } };
}

function pickMissions(state: AppState): string[] {
  const active = state.tasks.filter((t) => !t.archived);
  if (active.length === 0) return [];

  // タスクごとの実施回数
  const doneCount = new Map<string, number>();
  for (const log of state.logs) {
    doneCount.set(log.taskId, (doneCount.get(log.taskId) ?? 0) + 1);
  }

  // 領域を「完了数が少ない順」に並べる
  const perArea = perAreaCounts(state);
  const areaOrder = [...AREAS].sort((a, b) => perArea[a.id] - perArea[b.id]).map((a) => a.id);

  // 領域ごとにタスクを「実施回数が少ない順」で積む
  const byArea = new Map<AreaId, Task[]>();
  for (const areaId of areaOrder) {
    const tasks = active
      .filter((t) => t.areaId === areaId)
      .sort((a, b) => (doneCount.get(a.id) ?? 0) - (doneCount.get(b.id) ?? 0));
    if (tasks.length > 0) byArea.set(areaId, tasks);
  }

  const goal = Math.max(1, state.settings.dailyGoal);
  const picked: string[] = [];
  let round = 0;
  while (picked.length < goal && round < 20) {
    let addedThisRound = false;
    for (const areaId of areaOrder) {
      if (picked.length >= goal) break;
      const tasks = byArea.get(areaId);
      const task = tasks?.[round];
      if (task) {
        picked.push(task.id);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break; // 全領域を出し尽くした
    round += 1;
  }
  return picked;
}
