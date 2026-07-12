import { AppState, AreaId } from './types';
import { AREAS } from './seed';

export interface LevelInfo {
  level: number;
  /** 現在レベル内で獲得済みの XP */
  into: number;
  /** 次のレベルまでに必要な XP(レベル内合計) */
  need: number;
}

/** レベル n → n+1 に必要な XP。序盤は軽く、徐々に重く */
export function xpToNext(level: number): number {
  return 80 + (level - 1) * 40;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let rest = xp;
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level += 1;
  }
  return { level, into: rest, need: xpToNext(level) };
}

export function perAreaCounts(state: AppState): Record<AreaId, number> {
  const counts = Object.fromEntries(AREAS.map((a) => [a.id, 0])) as Record<AreaId, number>;
  for (const log of state.logs) {
    if (counts[log.areaId] !== undefined) counts[log.areaId] += 1;
  }
  return counts;
}

// ---- バッジ ----

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  check: (ctx: BadgeCtx) => boolean;
}

interface BadgeCtx {
  state: AppState;
  totalDone: number;
  longest: number;
  level: number;
  perArea: Record<AreaId, number>;
  goalDays: number; // デイリーゴールを満たした日数
}

const streakBadge = (days: number): BadgeDef => ({
  id: `streak-${days}`,
  name: `${days}日継続`,
  emoji: days >= 100 ? '👑' : days >= 30 ? '🏆' : days >= 7 ? '🔥' : '🌱',
  desc: `ストリークを${days}日つなげた`,
  check: (c) => c.longest >= days,
});

const totalBadge = (n: number, emoji: string): BadgeDef => ({
  id: `total-${n}`,
  name: `累計${n}タスク`,
  emoji,
  desc: `合計${n}個のアクションを完了した`,
  check: (c) => c.totalDone >= n,
});

export const BADGES: BadgeDef[] = [
  {
    id: 'first-step',
    name: 'はじめの一歩',
    emoji: '👣',
    desc: '最初のアクションを完了した',
    check: (c) => c.totalDone >= 1,
  },
  streakBadge(3),
  streakBadge(7),
  streakBadge(14),
  streakBadge(30),
  streakBadge(60),
  streakBadge(100),
  totalBadge(10, '🎯'),
  totalBadge(50, '💪'),
  totalBadge(100, '💎'),
  totalBadge(300, '🚀'),
  {
    id: 'all-areas',
    name: '五角形のはじまり',
    emoji: '⭐',
    desc: '5つのスキル領域すべてで1回以上完了した',
    check: (c) => AREAS.every((a) => c.perArea[a.id] >= 1),
  },
  {
    id: 'balanced-10',
    name: 'バランス型エンジニア',
    emoji: '🧭',
    desc: '5つの領域すべてで10回以上完了した',
    check: (c) => AREAS.every((a) => c.perArea[a.id] >= 10),
  },
  {
    id: 'goal-7',
    name: 'ゴールハンター',
    emoji: '🏁',
    desc: 'デイリーゴールを7日達成した',
    check: (c) => c.goalDays >= 7,
  },
  {
    id: 'level-5',
    name: 'レベル5到達',
    emoji: '🎖️',
    desc: 'レベル5になった',
    check: (c) => c.level >= 5,
  },
  {
    id: 'level-10',
    name: 'レベル10到達',
    emoji: '🥇',
    desc: 'レベル10になった',
    check: (c) => c.level >= 10,
  },
];

export function badgeCtx(state: AppState): BadgeCtx {
  const perArea = perAreaCounts(state);
  const byDay = new Map<string, number>();
  for (const l of state.logs) byDay.set(l.dateKey, (byDay.get(l.dateKey) ?? 0) + 1);
  let goalDays = 0;
  for (const n of byDay.values()) if (n >= state.settings.dailyGoal) goalDays += 1;
  return {
    state,
    totalDone: state.logs.length,
    longest: state.longest,
    level: levelFromXp(state.xp).level,
    perArea,
    goalDays,
  };
}

/** まだ獲得していないバッジのうち、条件を満たしたものを返す */
export function newlyEarnedBadges(state: AppState): BadgeDef[] {
  const owned = new Set(state.badges.map((b) => b.id));
  const ctx = badgeCtx(state);
  return BADGES.filter((b) => !owned.has(b.id) && b.check(ctx));
}
