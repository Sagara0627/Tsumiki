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
  /** ロードマップ由来のタスクは元テンプレートID(重複リコメンド防止) */
  templateId?: string;
  /** 導入期(ストリーク育成前)に出す極小タスク。ミッション選出・タスク一覧で特別扱いする */
  warmup?: boolean;
  /** 音声ロールプレイのタスク。チェックではなく SimRunner を開いて完了する(areaId の台本を使う) */
  sim?: boolean;
}

/** ロードマップの段階(ステップ1=きほん → 3=はってん) */
export type RoadmapStage = 1 | 2 | 3;

export interface CareerPlan {
  /** 目指す姿(自由記述。例:「3年でテックリードになる」) */
  goal: string;
  /** 重点領域(リコメンドで優先される) */
  focusAreas: AreaId[];
  /** おすすめタスクを1日1件まで自動でタスクに追加する */
  autoAdd: boolean;
  /** 見送ったテンプレートID(再リコメンドしない) */
  dismissed: string[];
  /** 最後に自動追加した日(YYYY-MM-DD)。1日1件の上限管理 */
  lastAutoAddDate: string | null;
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
  /** サウンド設定(効果音・BGM の ON/OFF)。どちらも初期 ON */
  sound: { sfx: boolean; bgm: boolean };
}

export interface AppState {
  /** スキーマ版。v2: キャリアプラン(docs/career-roadmap.md)を初期投入済み */
  version: 2;
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
  /** キャリアプラン(未設定なら null。設定するとロードマップのおすすめが有効になる) */
  career: CareerPlan | null;
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
