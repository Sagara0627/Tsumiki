import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from './types';
import { initialState } from './seed';

const KEY = 'tsumiki:state:v1';

/** 欠けたフィールドをデフォルトで補完(将来のスキーマ追加・インポート時の防御) */
export function normalize(raw: Partial<AppState>): AppState {
  const base = initialState();
  return {
    ...base,
    ...raw,
    version: 1,
    tasks: Array.isArray(raw.tasks) ? raw.tasks : base.tasks,
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    frozenDates: Array.isArray(raw.frozenDates) ? raw.frozenDates : [],
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    missions: raw.missions ?? base.missions,
    settings: {
      ...base.settings,
      ...(raw.settings ?? {}),
      reminderTimes: Array.isArray(raw.settings?.reminderTimes)
        ? raw.settings!.reminderTimes
        : base.settings.reminderTimes,
    },
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
  const candidate = (root?.app === 'tsumiki' ? root.state : root) as Partial<AppState> | undefined;
  if (!candidate || typeof candidate !== 'object' || candidate.version !== 1) {
    throw new Error('Tsumiki のエクスポートデータではないようです(version が一致しません)。');
  }
  return normalize(candidate);
}
