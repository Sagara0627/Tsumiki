import { AppState, SkillArea, Task } from './types';
import { genId } from '../utils/id';

export const AREAS: SkillArea[] = [
  {
    id: 'tech',
    name: '技術力・知識',
    short: '技術',
    emoji: '🛠️',
    color: '#5B8DEF',
    description: '既存システム+最新技術。基礎から抽象⇔具体を行き来して理解する',
  },
  {
    id: 'hearing',
    name: 'ヒアリング力',
    short: 'ヒアリング',
    emoji: '👂',
    color: '#9C6ADE',
    description: '相手の「なぜ/何を/どうやって」と前提・意図を引き出す',
  },
  {
    id: 'drive',
    name: '推進力',
    short: '推進',
    emoji: '🚀',
    color: '#F2994A',
    description: 'ゴールから逆算し、TODOをすぐ着手できる粒度まで細分化する',
  },
  {
    id: 'negotiation',
    name: '調整・交渉力',
    short: '調整交渉',
    emoji: '🤝',
    color: '#56CCF2',
    description: '相手のメリットを踏まえ、論理的・端的に伝える',
  },
  {
    id: 'output',
    name: 'アウトプット力',
    short: '発信',
    emoji: '✍️',
    color: '#6FCF97',
    description: 'Zenn/Qiita/Note/個人開発/SNS で発信する(体験→活用→共有)',
  },
];

export function areaOf(id: string): SkillArea {
  return AREAS.find((a) => a.id === id) ?? AREAS[0];
}

const SEED_TASKS: Array<[Task['areaId'], string, number]> = [
  ['tech', '技術記事・ドキュメントを1本読む(15分)', 10],
  ['tech', '基礎を1トピック深掘りして自分の言葉でメモする', 15],
  ['tech', '気になる新技術を10分さわってみる(体験する)', 10],
  ['hearing', '会話で「なぜ?」を1回深掘りして前提を確認する', 10],
  ['hearing', '相手の発言を要約して認識合わせを1回する', 10],
  ['drive', '今日のゴールから逆算してTODOを3つに分解する', 10],
  ['drive', 'いちばん小さいTODOに5分だけ着手する', 10],
  ['negotiation', '依頼・相談を「相手のメリット」から書き始める', 10],
  ['negotiation', '結論→理由の順で端的に伝える練習を1回する', 10],
  ['output', '学んだことを1ツイート/1メモで発信する(共有する)', 15],
  ['output', 'Zenn/Qiita の下書きを10分進める', 15],
  ['output', '個人開発を10分進める', 10],
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
    version: 1,
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
