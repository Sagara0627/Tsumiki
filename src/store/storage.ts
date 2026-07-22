import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AreaId, CareerPlan } from './types';
import { AREAS, initialState } from './seed';
import { applyCareerPlan } from './roadmap';

// ストレージキーは据え置き(スキーマ版は state.version で管理)
const KEY = 'tsumiki:state:v1';

/** 欠けたフィールドをデフォルトで補完(将来のスキーマ追加・インポート時の防御) */
export function normalize(raw: Partial<Omit<AppState, 'version'>> & { version?: number }): AppState {
  const base = initialState();
  const state: AppState = {
    ...base,
    ...raw,
    version: 2,
    tasks: Array.isArray(raw.tasks) ? raw.tasks : base.tasks,
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    frozenDates: Array.isArray(raw.frozenDates) ? raw.frozenDates : [],
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    missions: raw.missions ?? base.missions,
    career: normalizeCareer(raw.career),
    settings: {
      ...base.settings,
      ...(raw.settings ?? {}),
      reminderTimes: Array.isArray(raw.settings?.reminderTimes)
        ? raw.settings!.reminderTimes
        : base.settings.reminderTimes,
      sound: {
        sfx: raw.settings?.sound?.sfx ?? base.settings.sound.sfx,
        bgm: raw.settings?.sound?.bgm ?? base.settings.sound.bgm,
      },
    },
  };
  // v1 → v2: キャリアプラン(目指す姿・重点領域・自動追加ON+優先アクションのタスク化)を投入
  return raw.version === 1 ? applyCareerPlan(state) : state;
}

function normalizeCareer(raw: CareerPlan | null | undefined): CareerPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const validAreas = new Set<AreaId>(AREAS.map((a) => a.id));
  return {
    goal: typeof raw.goal === 'string' ? raw.goal : '',
    focusAreas: Array.isArray(raw.focusAreas)
      ? raw.focusAreas.filter((id) => validAreas.has(id))
      : [],
    autoAdd: raw.autoAdd === true,
    dismissed: Array.isArray(raw.dismissed) ? raw.dismissed : [],
    lastAutoAddDate: typeof raw.lastAutoAddDate === 'string' ? raw.lastAutoAddDate : null,
  };
}

export async function loadState(): Promise<AppState | null> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return null;
    return normalize(JSON.parse(json));
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 保存失敗は次回の保存に賭ける(クラッシュさせない)
  }
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/** 機種変更・バックアップ用のエクスポート形式 */
export function serialize(state: AppState): string {
  return JSON.stringify(
    { app: 'tsumiki', exportedAt: new Date().toISOString(), state },
    null,
    2
  );
}

/** エクスポート形式・生の state 形式のどちらも受け付ける */
export function parseImport(json: string): AppState {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error('JSONとして読み込めませんでした。ファイルの中身を確認してください。');
  }
  const root = obj as Record<string, unknown>;
  const candidate = (root?.app === 'tsumiki' ? root.state : root) as
    | (Partial<Omit<AppState, 'version'>> & { version?: number })
    | undefined;
  if (!candidate || typeof candidate !== 'object' || ![1, 2].includes(candidate.version ?? 0)) {
    throw new Error('Tsumiki のエクスポートデータではないようです(version が一致しません)。');
  }
  return normalize(candidate);
}
