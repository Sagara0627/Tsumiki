/**
 * 音声I/Oの橋渡し。UI 層(ロールプレイ)は expo-speech / expo-speech-recognition に
 * 直接依存せず、App 起動時に registerVoiceBridge で実装(expoVoice)を注入する。
 * STT が使えない環境(Expo Go・シミュレータ・権限拒否)では listen が例外を投げ、
 * 呼び出し側はテキスト入力にフォールバックする。
 */
export interface VoiceBridge {
  /** 端末内音声認識(STT)が使えそうか。UI のマイク表示の出し分けに使う */
  sttAvailable: boolean;
  /** テキストを読み上げる(TTS)。読み終わり/中断で解決する */
  speak(text: string): Promise<void>;
  /** 読み上げを止める */
  stopSpeaking(): void;
  /** 一発話を聞き取り、確定テキストを返す。使えない場合は reject */
  listen(opts?: { onPartial?: (text: string) => void }): Promise<string>;
  /** 聞き取りを確定(stop)/中断(abort) */
  finishListening(): void;
  cancelListening(): void;
}

/** 注入前・非対応環境のフォールバック(何もしない。UI 側でテキスト入力に切り替える) */
const noopVoice: VoiceBridge = {
  sttAvailable: false,
  speak: async () => {},
  stopSpeaking: () => {},
  listen: async () => {
    throw new Error('voice-unavailable');
  },
  finishListening: () => {},
  cancelListening: () => {},
};

let bridge: VoiceBridge = noopVoice;

export function registerVoiceBridge(v: VoiceBridge): void {
  bridge = v;
}

export function getVoiceBridge(): VoiceBridge {
  return bridge;
}
