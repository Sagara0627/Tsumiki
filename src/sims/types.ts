import { AreaId } from '../store/types';

/**
 * 台本ベースの音声ロールプレイ(シミュレーション)の型。
 * 端末内にAI対話相手は置けないため、会話は「台本(turns)」で進み、
 * ユーザーの発話は match.ts のキーワード判定で intent に振り分ける。
 * ヒアリング・調整交渉は相手役との対話、推進は「声に出して宣言する」独白ドリル。
 */

/** ユーザーの一発話に期待する意図。keywordGroups は「全グループのいずれかの語を含む」で成立(AND of OR) */
export interface SimIntent {
  id: string;
  /** 各グループから最低1語を含めば一致(表記ゆれ・言い換えを synonyms で吸収) */
  keywordGroups: string[][];
  /** 一致時のキャラの反応(TTSで話す)。良い返しへの手応え */
  reply: string;
  /** この意図を「達成」と見なすか(ターンの狙いを満たしたか)。false は許容だが物足りない返し */
  good: boolean;
  /** 指定時、次に進むターンの id(通常は配列の次へ。話の先取りで以降のターンが不要になる場合の分岐用) */
  next?: string;
  /** 指定時、次のターンの say をこの文言で上書きする(直前の発話内容を受けて相手の切り出し方を変える) */
  leadIn?: string;
}

export interface SimTurn {
  id: string;
  /** キャラが先に話す一言(TTS)。独白ドリルなど無い場合もある */
  say?: string;
  /** ユーザーに求める行動(画面に表示・お題) */
  prompt: string;
  /** 期待する意図。上から順に判定し、最初に一致したものを採用 */
  expects: SimIntent[];
  /** どの意図にも一致しなかったときのヒント(TTSで話す)。1回出して次へ進む */
  onMiss: string;
}

export interface SimScenario {
  id: string;
  areaId: AreaId;
  /** 一覧・タスクに出す短いタイトル */
  title: string;
  /** 相手役・場面の説明(開始画面) */
  setup: string;
  /** 相手役の呼び名(「依頼者」「PMの佐藤さん」など。独白は空でよい) */
  partner: string;
  turns: SimTurn[];
  /** 締めのメッセージ(振り返り) */
  wrapUp: string;
}
