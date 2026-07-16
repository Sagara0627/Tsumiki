import { AppState, AreaId, CareerPlan, RoadmapStage, Task } from './types';
import { AREAS } from './seed';
import { perAreaCounts } from './xp';
import { inWarmup } from './warmup';
import { genId } from '../utils/id';
import { todayKey } from '../utils/date';

/**
 * キャリアプランのロードマップ。
 * 領域ごとに3段階のタスクテンプレートを持ち、その領域の累計完了数が
 * しきい値を超えると次のステップが解放される(段階的に負荷を上げる)。
 * リコメンドは重点領域 → 低いステップ → 手薄な領域 の順で優先する。
 *
 * テンプレートの中身は docs/career-roadmap.md(12ヶ月キャリア学習ロードマップ)の
 * 5領域×3フェーズを、毎日チェックできる粒度のタスクに落としたもの。
 */

export interface RoadmapTemplate {
  id: string;
  areaId: AreaId;
  stage: RoadmapStage;
  title: string;
  xp: number;
  /** ロードマップの「今すぐ着手すべき優先アクション」。プラン投入時に即タスク化する */
  priority?: boolean;
}

export const STAGE_INFO: Record<RoadmapStage, { name: string; emoji: string }> = {
  1: { name: 'きほん', emoji: '🌱' },
  2: { name: 'じっせん', emoji: '🔥' },
  3: { name: 'はってん', emoji: '👑' },
};

/** ステップ解放に必要な、その領域の累計完了数 */
export const STAGE_UNLOCK: Record<RoadmapStage, number> = { 1: 0, 2: 12, 3: 30 };

const T = (
  areaId: AreaId,
  stage: RoadmapStage,
  title: string,
  priority = false,
  // 文言だけ直したいとき、旧タイトルを渡してIDを維持する(採用済みタスクとの重複追加を防ぐ)
  idTitle?: string
): RoadmapTemplate => ({
  id: `rm-${areaId}-${stage}-${hash(idTitle ?? title)}`,
  areaId,
  stage,
  title,
  xp: stage === 1 ? 10 : stage === 2 ? 15 : 20,
  priority,
});

/** タイトルから安定したIDを作る(テンプレート追加・並べ替えでIDが変わらないように) */
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export const ROADMAP: RoadmapTemplate[] = [
  // 領域5: 圧倒的知識・AIキャッチアップ(フェーズ1: 定常化 → 2: 基礎の底上げ → 3: 専門を決める)
  T('tech', 1, 'AIペアプロ(Claude Code/Copilot)で仕事を1タスク進める', true),
  T('tech', 1, '朝15分インプット(Zennトレンド/HN/リリースノート)'),
  T('tech', 2, '設計本(Clean Architecture等)を15分読み進める'),
  T('tech', 2, '本で学んだ設計を業務・個人開発で1つ実践する'),
  T('tech', 3, '設計判断を「なぜそうしたか」理由付きで記事化を進める'),
  T('tech', 3, 'scrapの蓄積を振り返り「深める専門領域」の候補をメモする'),
  // 領域1: ヒアリング力(フェーズ1: 型を作る → 2: 仮説を持って聞く → 3: 一次ヒアリングを回す)
  T('hearing', 1, '質問テンプレ(なぜ/何を/どうやって)で意図の確認質問を1回する', true),
  T('hearing', 1, 'MTG後に相手の目的を1文で要約して認識を確かめる'),
  T('hearing', 2, 'MTG前に相手の課題の仮説を2つ用意してから聞く'),
  T('hearing', 2, '議事録に「相手の課題/背景/期待値」欄を書いて埋める'),
  T('hearing', 3, '新規タスクの要件ヒアリングを自分主導で回す'),
  T('hearing', 3, '初回ヒアリングから要件ドラフトを書いて合意を取る'),
  // 領域2: 推進力(フェーズ1: 分解の型 → 2: 見積もりと振り返り → 3: 独力で完走)
  T('drive', 1, 'TODO分解テンプレでゴール→30〜60分タスクに細分化する', true),
  T('drive', 1, '「◯◯を書く」形で最初の一歩を書き出し、すぐ着手する', false, '「動詞で始まる最初の一歩」を書き出してすぐ着手する'),
  T('drive', 2, 'タスクに見積もりを付け、実績とのズレを1行メモする'),
  T('drive', 2, '週次で見積もりを振り返り、翌週の優先トップ3を決める'),
  T('drive', 3, '個人開発/副業案件を計画〜リリースへ1歩進める'),
  T('drive', 3, '小案件のスケジュールを自分で引いて共有する'),
  // 領域3: 調整・交渉力(フェーズ1: 伝える型 → 2: 相手のメリット起点 → 3: 利害調整を主導)
  T('negotiation', 1, 'Slack/PRの説明文をPREP法(結論→理由→具体例)で書く'),
  T('negotiation', 1, '提案を「結論→理由→相手のメリット」で30秒で伝える'),
  T('negotiation', 2, '提案前に相手の評価軸・課題をメモしてから話す'),
  T('negotiation', 2, '技術提案を「相手の課題がどう解決するか」起点で語る'),
  T('negotiation', 3, '意見が割れる場面で論点整理役を買って出る'),
  T('negotiation', 3, '対立する意見を「互いのこうしたい」を踏まえた折衷案に導く'),
  // 領域4: アウトプット力(フェーズ1: 習慣化 → 2: 作って見せる → 3: 人前と実務へ)
  T('output', 1, 'Zenn scrapに今週の学習メモを書く(箇条書き3行でOK)', true),
  T('output', 1, 'X(SNS)で今日の学びを短文発信する'),
  T('output', 2, '月1本の記事の下書きを30分進める(公開まで)'),
  T('output', 2, '個人開発を30分進め、過程をscrapに記録する'),
  T('output', 3, 'LT登壇資料を10分進める(登壇枠への申込みでもOK)'),
  T('output', 3, '副業マッチング(Offers等)のプロフィール・応募を進める'),
];

export function templateOf(id: string): RoadmapTemplate | undefined {
  return ROADMAP.find((t) => t.id === id);
}

/** その領域で現在解放されている最大ステップ */
export function unlockedStage(areaCount: number): RoadmapStage {
  if (areaCount >= STAGE_UNLOCK[3]) return 3;
  if (areaCount >= STAGE_UNLOCK[2]) return 2;
  return 1;
}

export interface UnlockHint {
  areaId: AreaId;
  nextStage: RoadmapStage;
  /** 次のステップ解放まであと何回の完了が必要か */
  remaining: number;
}

/** いちばん解放が近いステップ(重点領域を優先)。全解放済みなら null */
export function nextUnlockHint(state: AppState): UnlockHint | null {
  if (!state.career) return null;
  const perArea = perAreaCounts(state);
  const ordered = orderedAreaIds(state.career);
  let best: UnlockHint | null = null;
  for (const areaId of ordered) {
    const stage = unlockedStage(perArea[areaId]);
    if (stage >= 3) continue;
    const nextStage = (stage + 1) as RoadmapStage;
    const remaining = STAGE_UNLOCK[nextStage] - perArea[areaId];
    if (!best || remaining < best.remaining) best = { areaId, nextStage, remaining };
  }
  return best;
}

/** 重点領域を先頭に、残りは定義順で並べた領域ID */
function orderedAreaIds(career: CareerPlan): AreaId[] {
  const focus = career.focusAreas.filter((id) => AREAS.some((a) => a.id === id));
  const rest = AREAS.map((a) => a.id).filter((id) => !focus.includes(id));
  return [...focus, ...rest];
}

/**
 * いま出すべきおすすめテンプレートを返す。
 * 対象: 解放済みステップ / 未採用(templateId が既存タスクにない) / 未見送り
 * 優先: 重点領域 → 低いステップ → 完了数が少ない領域
 */
export function recommendTemplates(state: AppState, max = 3): RoadmapTemplate[] {
  const career = state.career;
  if (!career) return [];

  const adopted = new Set(state.tasks.map((t) => t.templateId).filter(Boolean));
  const dismissed = new Set(career.dismissed);
  const perArea = perAreaCounts(state);
  const areaRank = new Map(orderedAreaIds(career).map((id, i) => [id, i]));
  const focusSet = new Set(career.focusAreas);

  return ROADMAP.filter(
    (t) =>
      !adopted.has(t.id) &&
      !dismissed.has(t.id) &&
      t.stage <= unlockedStage(perArea[t.areaId])
  )
    .sort((a, b) => {
      const focusDiff = Number(focusSet.has(b.areaId)) - Number(focusSet.has(a.areaId));
      if (focusDiff !== 0) return focusDiff;
      if (a.stage !== b.stage) return a.stage - b.stage;
      if (perArea[a.areaId] !== perArea[b.areaId]) return perArea[a.areaId] - perArea[b.areaId];
      return (areaRank.get(a.areaId) ?? 99) - (areaRank.get(b.areaId) ?? 99);
    })
    .slice(0, max);
}

export function taskFromTemplate(t: RoadmapTemplate): Task {
  return {
    id: genId('t-'),
    areaId: t.areaId,
    title: t.title,
    xp: t.xp,
    archived: false,
    createdAt: new Date().toISOString(),
    templateId: t.id,
  };
}

// ---- キャリアプラン本体(docs/career-roadmap.md 由来) ----

/** 目指す姿: 〜30歳マイルストーン(設定>キャリアプランの「目指す姿」に入る) */
export const CAREER_GOAL =
  '30歳までに一人で案件を回せる土台を完成(ヒアリング〜リリースを独力で完走+週1発信の習慣化)';

/** 重点領域: 優先アクション3つ(Zenn scrap/ヒアリングテンプレ/AIペアプロ)に対応 */
export const CAREER_FOCUS_AREAS: AreaId[] = ['output', 'hearing', 'tech'];

/**
 * キャリアプランを state に投入する。
 * - 目指す姿・重点領域を設定し、おすすめの自動追加(1日1件)をON
 * - 「今すぐ着手すべき優先アクション」のテンプレを即タスク化(採用済みはスキップ)
 * 初回セットアップ(storage の v1→v2 移行・新規インストール)から呼ばれる。冪等。
 */
export function applyCareerPlan(state: AppState): AppState {
  const adopted = new Set(state.tasks.map((t) => t.templateId).filter(Boolean));
  const priorityTasks = ROADMAP.filter((t) => t.priority && !adopted.has(t.id)).map(
    taskFromTemplate
  );
  return {
    ...state,
    tasks: [...state.tasks, ...priorityTasks],
    career: {
      goal: CAREER_GOAL,
      focusAreas: [...CAREER_FOCUS_AREAS],
      autoAdd: true,
      dismissed: state.career?.dismissed ?? [],
      lastAutoAddDate: state.career?.lastAutoAddDate ?? null,
    },
  };
}

/**
 * 自動追加モード: 1日1件まで、いちばん優先度の高いおすすめをタスクに追加する。
 * reconcile と同じく起動/フォアグラウンド復帰時に呼ばれる。冪等(同日2回目は何もしない)
 */
export function autoAddFromRoadmap(state: AppState, now: Date = new Date()): AppState {
  const career = state.career;
  if (!career?.autoAdd) return state;
  // 導入期は本格タスクを増やさない(ウォームアップに集中させ、リストを膨らませない)
  if (inWarmup(state, now)) return state;
  const today = todayKey(now);
  if (career.lastAutoAddDate === today) return state;

  const [next] = recommendTemplates(state, 1);
  if (!next) return state;

  return {
    ...state,
    tasks: [...state.tasks, taskFromTemplate(next)],
    career: { ...career, lastAutoAddDate: today },
  };
}
