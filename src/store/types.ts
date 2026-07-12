export type AreaId = 'tech' | 'hearing' | 'drive' | 'negotiation' | 'output';

export type CharacterId = 'mame' | 'homura' | 'tsumi';

export interface SkillArea {
  id: AreaId;
  name: string;
  short: string;
  emoji: string;
  color: string;
  description: string;
}

export interface Task {
  id: string;
  areaId: AreaId;
  title: string;
  xp: number;
  archived: boolean;
  createdAt: string; // ISO
}

export interface CompletionLog {
  id: string;
  taskId: string;
  areaId: AreaId;
  title: string; // タスク削除後も履歴を保つためスナップショット
  xp: number;
  dateKey: string; // YYYY-MM-DD(ローカル)
  completedAt: string; // ISO
}

export interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
}

export interface Badge {
  id: string;
  earnedAt: string; // ISO
}

export interface Settings {
  dailyGoal: number; // 1日の目標タスク数
  reminderTimes: ReminderTime[];
  characterId: CharacterId;
}

export interface AppState {
  version: 1;
  createdAt: string; // 利用開始日(ISO)。カレンダーの「未達」表示の起点
  tasks: Task[];
  logs: CompletionLog[];
  /** ストリークフリーズ所持数(7日継続ごとに+1、最大2) */
  freezes: number;
  /** フリーズで守られた日(YYYY-MM-DD) */
  frozenDates: string[];
  /** 最長ストリーク(記録) */
  longest: number;
  /** 直近でストリークが途切れた日(未達だった日) */
  lastBreakDate: string | null;
  xp: number;
  badges: Badge[];
  /** 今日のデイリーミッション */
  missions: { dateKey: string; taskIds: string[] };
  settings: Settings;
}

export type Emotion =
  | 'cheer' // 朝・未完了: 明るく後押し
  | 'proud' // 完了/順調: 誇らしい
  | 'worried' // 昼・未完了: そわそわ
  | 'tearful' // 夜・未完了: 涙目
  | 'sad' // 途切れ: しょんぼり
  | 'relieved' // 復帰: 泣いて喜ぶ
  | 'celebrate'; // レベルアップ等: 大喜び

export const ALL_EMOTIONS: Emotion[] = [
  'cheer',
  'proud',
  'worried',
  'tearful',
  'sad',
  'relieved',
  'celebrate',
];

export interface Celebration {
  id: string;
  kind: 'level' | 'badge' | 'streak' | 'freeze';
  title: string;
  message: string;
}
