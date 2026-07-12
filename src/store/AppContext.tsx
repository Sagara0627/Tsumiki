import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
// RN の AppState はアプリ状態(active/background)。データモデルの AppState と衝突するため別名にする
import { AppState as RNAppState } from 'react-native';
import { AppState, AreaId, Celebration, CharacterId, Task } from './types';
import { initialState } from './seed';
import { loadState, saveState, clearState, serialize, parseImport } from './storage';
import { completionsOn, currentStreak, reconcile, MAX_FREEZES, STREAK_MILESTONES } from './streak';
import { ensureMissions } from './missions';
import { levelFromXp, newlyEarnedBadges } from './xp';
import { getCharacter } from '../characters';
import { genId } from '../utils/id';
import { todayKey } from '../utils/date';

/**
 * 通知層への橋渡し。store 層は通知の実装(expo-notifications)に依存せず、
 * App 起動時に registerNotificationBridge で注入する。
 */
export interface NotificationBridge {
  /** 状態変化後のリマインダー再スケジュール(呼び出し側で debounce 済み) */
  sync(state: AppState): void;
  /** レベルアップ・マイルストーン等の即時称賛通知 */
  celebrate(state: AppState, celebration: Celebration): void;
}

let notificationBridge: NotificationBridge | null = null;
export function registerNotificationBridge(bridge: NotificationBridge): void {
  notificationBridge = bridge;
}

export interface AppApi {
  state: AppState;
  /** 30秒ごとに更新される現在時刻(感情・カウントダウンの再計算用) */
  now: Date;
  ready: boolean;
  celebrations: Celebration[];

  completeTask(taskId: string): void;
  uncompleteTask(taskId: string): void;
  addTask(input: { areaId: AreaId; title: string; xp: number }): void;
  updateTask(taskId: string, patch: Partial<Pick<Task, 'areaId' | 'title' | 'xp'>>): void;
  archiveTask(taskId: string, archived: boolean): void;

  setDailyGoal(goal: number): void;
  setCharacter(id: CharacterId): void;
  addReminderTime(hour: number, minute: number): void;
  updateReminderTime(id: string, hour: number, minute: number): void;
  removeReminderTime(id: string): void;

  exportJson(): string;
  importJson(json: string): void;
  resetAll(): Promise<void>;

  dismissCelebration(): void;
}

const AppContext = createContext<AppApi | null>(null);

export function useApp(): AppApi {
  const api = useContext(AppContext);
  if (!api) throw new Error('useApp は AppProvider の内側で使ってください');
  return api;
}

const SAVE_DEBOUNCE_MS = 500;
const NOTIF_DEBOUNCE_MS = 1500;
const TICK_MS = 30_000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => initialState());
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);

  // 常に最新 state を指す ref。アクションはこれを読むことで stale closure を避ける
  const stateRef = useRef(state);
  stateRef.current = state;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveState(stateRef.current), SAVE_DEBOUNCE_MS);
  }, []);

  const scheduleNotifSync = useCallback(() => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(
      () => notificationBridge?.sync(stateRef.current),
      NOTIF_DEBOUNCE_MS
    );
  }, []);

  /** 全アクションの共通経路: state 更新 → 保存 → 通知再同期 */
  const mutate = useCallback(
    (fn: (s: AppState) => AppState) => {
      const next = fn(stateRef.current);
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
      scheduleSave();
      scheduleNotifSync();
    },
    [scheduleSave, scheduleNotifSync]
  );

  const pushCelebration = useCallback((c: Celebration) => {
    setCelebrations((prev) => [...prev, c]);
    notificationBridge?.celebrate(stateRef.current, c);
  }, []);

  // ---- 起動時ロード ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = (await loadState()) ?? initialState();
      if (cancelled) return;
      const d = new Date();
      const settled = ensureMissions(reconcile(loaded, d), d);
      stateRef.current = settled;
      setState(settled);
      setReady(true);
      if (settled !== loaded) void saveState(settled);
      notificationBridge?.sync(settled);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- フォアグラウンド復帰時: 空白日の精算+ミッション再生成 ----
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      const d = new Date();
      setNow(d);
      mutate((s) => ensureMissions(reconcile(s, d), d));
    });
    return () => sub.remove();
  }, [mutate]);

  // ---- 30秒ごとの時刻更新(日付跨ぎでミッションも切り替える) ----
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNow(d);
      if (stateRef.current.missions.dateKey !== todayKey(d)) {
        mutate((s) => ensureMissions(reconcile(s, d), d));
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [mutate]);

  // ---- タスク完了 ----
  const completeTask = useCallback(
    (taskId: string) => {
      const d = new Date();
      const today = todayKey(d);
      const prev = stateRef.current;
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (prev.logs.some((l) => l.taskId === taskId && l.dateKey === today)) return;

      const firstOfDay = completionsOn(prev, today) === 0;
      const levelBefore = levelFromXp(prev.xp).level;

      let next: AppState = {
        ...prev,
        logs: [
          ...prev.logs,
          {
            id: genId('log-'),
            taskId: task.id,
            areaId: task.areaId,
            title: task.title,
            xp: task.xp,
            dateKey: today,
            completedAt: d.toISOString(),
          },
        ],
        xp: prev.xp + task.xp,
      };

      const streak = currentStreak(next, d);
      next = { ...next, longest: Math.max(next.longest, streak) };

      const char = getCharacter(next.settings.characterId);

      // その日最初の完了時のみストリーク系イベントを判定(取り消し→再チェックの重複を防ぐ)
      if (firstOfDay) {
        if (STREAK_MILESTONES.includes(streak)) {
          pushCelebration({
            id: genId('c-'),
            kind: 'streak',
            title: `${streak}日継続!`,
            message: char.notif.streakMilestone(streak),
          });
        }
        if (streak > 0 && streak % 7 === 0 && next.freezes < MAX_FREEZES) {
          next = { ...next, freezes: next.freezes + 1 };
          pushCelebration({
            id: genId('c-'),
            kind: 'freeze',
            title: 'フリーズ獲得!',
            message: `7日継続のごほうびに❄️フリーズを1個ゲット!うっかり忘れても1日守ってくれるよ(所持 ${next.freezes}/${MAX_FREEZES})`,
          });
        }
      }

      const levelAfter = levelFromXp(next.xp).level;
      if (levelAfter > levelBefore) {
        pushCelebration({
          id: genId('c-'),
          kind: 'level',
          title: `レベル${levelAfter}!`,
          message: char.notif.levelUp(levelAfter),
        });
      }

      const earned = newlyEarnedBadges(next);
      if (earned.length > 0) {
        const at = d.toISOString();
        next = {
          ...next,
          badges: [...next.badges, ...earned.map((b) => ({ id: b.id, earnedAt: at }))],
        };
        for (const b of earned) {
          pushCelebration({
            id: genId('c-'),
            kind: 'badge',
            title: `バッジ獲得 ${b.emoji}`,
            message: `「${b.name}」 — ${b.desc}`,
          });
        }
      }

      mutate(() => next);
    },
    [mutate, pushCelebration]
  );

  // ---- タスク完了の取り消し(今日の分のみ) ----
  const uncompleteTask = useCallback(
    (taskId: string) => {
      const today = todayKey(new Date());
      mutate((s) => {
        const log = [...s.logs]
          .reverse()
          .find((l) => l.taskId === taskId && l.dateKey === today);
        if (!log) return s;
        return {
          ...s,
          logs: s.logs.filter((l) => l.id !== log.id),
          xp: Math.max(0, s.xp - log.xp),
        };
      });
    },
    [mutate]
  );

  // ---- タスク CRUD ----
  const addTask = useCallback(
    (input: { areaId: AreaId; title: string; xp: number }) => {
      mutate((s) => ({
        ...s,
        tasks: [
          ...s.tasks,
          {
            id: genId('t-'),
            areaId: input.areaId,
            title: input.title.trim(),
            xp: input.xp,
            archived: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    [mutate]
  );

  const updateTask = useCallback(
    (taskId: string, patch: Partial<Pick<Task, 'areaId' | 'title' | 'xp'>>) => {
      mutate((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      }));
    },
    [mutate]
  );

  const archiveTask = useCallback(
    (taskId: string, archived: boolean) => {
      mutate((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, archived } : t)),
        // アーカイブしたタスクは今日のミッションからも外す
        missions: archived
          ? { ...s.missions, taskIds: s.missions.taskIds.filter((id) => id !== taskId) }
          : s.missions,
      }));
    },
    [mutate]
  );

  // ---- 設定 ----
  const setDailyGoal = useCallback(
    (goal: number) => {
      const clamped = Math.min(10, Math.max(1, Math.round(goal)));
      mutate((s) => ({ ...s, settings: { ...s.settings, dailyGoal: clamped } }));
    },
    [mutate]
  );

  const setCharacter = useCallback(
    (id: CharacterId) => {
      mutate((s) => ({ ...s, settings: { ...s.settings, characterId: id } }));
    },
    [mutate]
  );

  const addReminderTime = useCallback(
    (hour: number, minute: number) => {
      mutate((s) => ({
        ...s,
        settings: {
          ...s.settings,
          reminderTimes: [...s.settings.reminderTimes, { id: genId('r-'), hour, minute }].sort(
            (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
          ),
        },
      }));
    },
    [mutate]
  );

  const updateReminderTime = useCallback(
    (id: string, hour: number, minute: number) => {
      mutate((s) => ({
        ...s,
        settings: {
          ...s.settings,
          reminderTimes: s.settings.reminderTimes
            .map((r) => (r.id === id ? { ...r, hour, minute } : r))
            .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
        },
      }));
    },
    [mutate]
  );

  const removeReminderTime = useCallback(
    (id: string) => {
      mutate((s) => ({
        ...s,
        settings: {
          ...s.settings,
          reminderTimes: s.settings.reminderTimes.filter((r) => r.id !== id),
        },
      }));
    },
    [mutate]
  );

  // ---- バックアップ ----
  const exportJson = useCallback(() => serialize(stateRef.current), []);

  const importJson = useCallback(
    (json: string) => {
      const imported = parseImport(json); // 不正なら throw
      const d = new Date();
      mutate(() => ensureMissions(reconcile(imported, d), d));
    },
    [mutate]
  );

  const resetAll = useCallback(async () => {
    await clearState();
    const d = new Date();
    const fresh = ensureMissions(initialState(), d);
    stateRef.current = fresh;
    setState(fresh);
    setCelebrations([]);
    void saveState(fresh);
    notificationBridge?.sync(fresh);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebrations((prev) => prev.slice(1));
  }, []);

  const api = useMemo<AppApi>(
    () => ({
      state,
      now,
      ready,
      celebrations,
      completeTask,
      uncompleteTask,
      addTask,
      updateTask,
      archiveTask,
      setDailyGoal,
      setCharacter,
      addReminderTime,
      updateReminderTime,
      removeReminderTime,
      exportJson,
      importJson,
      resetAll,
      dismissCelebration,
    }),
    [
      state,
      now,
      ready,
      celebrations,
      completeTask,
      uncompleteTask,
      addTask,
      updateTask,
      archiveTask,
      setDailyGoal,
      setCharacter,
      addReminderTime,
      updateReminderTime,
      removeReminderTime,
      exportJson,
      importJson,
      resetAll,
      dismissCelebration,
    ]
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}
