/**
 * サウンドI/Oの橋渡し。store 層・UI 層は expo-audio に直接依存せず、
 * App 起動時に registerSoundBridge で実装(expoSound)を注入する。
 * (通知ブリッジ・音声ブリッジと同じ依存方向。store をオーディオ実装から切り離す)
 * 注入前・非対応環境(音源ロード失敗など)では noop にフォールバックし、無音で動く。
 */
export type SoundEffect = 'complete' | 'celebrate' | 'tap';

export interface SoundSettings {
  /** 効果音(complete/celebrate/tap)の ON/OFF */
  sfx: boolean;
  /** ループBGM の ON/OFF */
  bgm: boolean;
}

export interface SoundBridge {
  /** 効果音を一発鳴らす(sfx=OFF のときは何もしない) */
  play(effect: SoundEffect): void;
  /** 設定を反映。BGM の再生/停止もこの呼び出しで切り替わる */
  applySettings(settings: SoundSettings): void;
}

const noopSound: SoundBridge = {
  play: () => {},
  applySettings: () => {},
};

let bridge: SoundBridge = noopSound;

export function registerSoundBridge(s: SoundBridge): void {
  bridge = s;
}

export function getSoundBridge(): SoundBridge {
  return bridge;
}
