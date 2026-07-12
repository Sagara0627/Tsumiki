import { ComponentType } from 'react';
import { CharacterId, Emotion } from '../store/types';

export interface CharacterSvgProps {
  emotion: Emotion;
  size: number;
}

/**
 * キャラクターは全てこの1インターフェースで定義する。
 * 新キャラの追加・差し替えは src/characters/ にファイルを足して
 * index.ts の CHARACTERS に登録するだけで完結する。
 */
export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  title: string;
  story: string;
  themeColor: string;
  /** ホームのキャラカード背景 */
  bgColor: string;
  /** ストリーク表示に使う絵文字(🔥相当) */
  streakEmoji: string;
  /** タスク完了のキャラ的な呼び名(水やり/薪くべ/ひと積み) */
  actionWord: string;
  Svg: ComponentType<CharacterSvgProps>;
  /** アプリ内吹き出しのセリフ。{streak} は現在の連続日数に置換される */
  speech: Record<Emotion, string[]>;
  notif: {
    morning: string[];
    noon: string[];
    evening: string[];
    lastCall: string[];
    praiseTask: string[];
    streakMilestone: (n: number) => string;
    levelUp: (lv: number) => string;
    broken: string[];
    recovered: string[];
  };
}
