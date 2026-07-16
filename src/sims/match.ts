import { SimIntent, SimTurn } from './types';

/**
 * 発話テキストの正規化。判定を安定させるため空白・記号を除き、
 * 全角英数を半角化・カタカナをひらがな化して表記ゆれを吸収する。
 * (端末内STTの結果は句読点や表記が揺れるため、緩めに寄せる)
 */
export function normalize(text: string): string {
  return text
    .replace(/[\s　]/g, '')
    .replace(/[。、．，!?！？「」『』()（）・…ー-]/g, '')
    // 全角英数 → 半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // カタカナ → ひらがな
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

/** ひとつの意図に一致するか。全 keywordGroup がそれぞれ最低1語を含めば成立(AND of OR) */
export function matchesIntent(transcript: string, intent: SimIntent): boolean {
  const t = normalize(transcript);
  if (t.length === 0) return false;
  return intent.keywordGroups.every((group) =>
    group.some((kw) => t.includes(normalize(kw)))
  );
}

export interface TurnResult {
  /** 一致した意図(なければ null = onMiss) */
  intent: SimIntent | null;
  /** ターンの狙いを満たしたか(good な意図に一致) */
  good: boolean;
}

/** ターンの期待意図を上から順に判定し、最初に一致したものを返す */
export function evaluateTurn(transcript: string, turn: SimTurn): TurnResult {
  for (const intent of turn.expects) {
    if (matchesIntent(transcript, intent)) {
      return { intent, good: intent.good };
    }
  }
  return { intent: null, good: false };
}
