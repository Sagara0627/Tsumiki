import { AppState, SkillArea, Task } from './types';
import { genId } from '../utils/id';

export const AREAS: SkillArea[] = [
  {
    id: 'tech',
    name: '技術力・知識',
    short: '技術',
    emoji: '🛠️',
    color: '#5B8DEF',
    description: '基礎と最新技術のキャッチアップ',
  },
  {
    id: 'hearing',
    name: 'ヒアリング力',
    short: 'ヒアリング',
    emoji: '👂',
    color: '#9C6ADE',
    description: '相手の意図と前提を引き出す',
  },
  {
    id: 'drive',
    name: '推進力',
    short: '推進',
    emoji: '🚀',
    color: '#F2994A',
    description: 'ゴール逆算でTODOを細かく刻む',
  },
  {
    id: 'negotiation',
    name: '調整・交渉力',
    short: '調整交渉',
    emoji: '🤝',
    color: '#56CCF2',
    description: '相手のメリット起点で端的に伝える',
  },
  {
    id: 'output',
    name: 'アウトプット力',
    short: '発信',
    emoji: '✍️',
    color: '#6FCF97',
    description: '学びを外に出して実績にする',
  },
];

export function areaOf(id: string): SkillArea {
  return AREAS.find((a) => a.id === id) ?? AREAS[0];
}

// 初期タスクは docs/career-roadmap.md の具体アクションに合わせる。
// 「どの場面で・何を・どこまでやれば完了か」が読んだ瞬間わかる粒度にすること
const SEED_TASKS: Array<[Task['areaId'], string, number]> = [
  ['tech', 'Zennのトレンド記事を1本読んで、要点を3行メモする', 10],
  ['tech', 'Hacker Newsか使用ツールのリリースノートに朝15分目を通す', 10],
  ['tech', '気になったライブラリ・新機能をClaude Codeで10分だけ試す', 15],
  ['hearing', 'MTGで「なぜそうしたいんですか?」を1回質問する', 10],
  ['hearing', 'MTG後に相手の目的を1文に要約し、Slackで認識合わせする', 10],
  ['drive', '今日いちばん重いタスクを「動詞で始まる30分TODO」3つに割る', 10],
  ['drive', '分解したTODOの1つ目に、いますぐ5分だけ着手する', 10],
  ['negotiation', 'Slackの依頼文を「結論→理由→相手のメリット」の順で書く', 10],
  ['negotiation', 'PRの説明文をPREP法(結論→理由→具体例)で書く', 10],
  ['output', 'Zennのscrapに今日の学びを箇条書き3行で書く', 15],
  ['output', 'X(SNS)に今日学んだことを1ポストする', 10],
  ['output', '個人開発のコードを10分書いて、進んだ分をscrapにメモする', 15],
];

export function seedTasks(): Task[] {
  const now = new Date().toISOString();
  return SEED_TASKS.map(([areaId, title, xp]) => ({
    id: genId('t-'),
    areaId,
    title,
    xp,
    archived: false,
    createdAt: now,
  }));
}

export function initialState(): AppState {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    tasks: seedTasks(),
    logs: [],
    freezes: 1, // 初期ボーナスとして1個(初回のうっかりを救済)
    frozenDates: [],
    longest: 0,
    lastBreakDate: null,
    xp: 0,
    badges: [],
    missions: { dateKey: '', taskIds: [] },
    career: null,
    settings: {
      dailyGoal: 3,
      reminderTimes: [
        { id: 'r1', hour: 8, minute: 0 },
        { id: 'r2', hour: 12, minute: 0 },
        { id: 'r3', hour: 19, minute: 0 },
        { id: 'r4', hour: 21, minute: 0 },
      ],
      characterId: 'mame',
    },
  };
}
