import * as Speech from 'expo-speech';
import { VoiceBridge } from './index';

/**
 * expo-speech(TTS)+ expo-speech-recognition(STT)による実装。
 * STT は iOS の SFSpeechRecognizer / Android の SpeechRecognizer を端末内で使う
 * (requiresOnDeviceRecognition: true = 音声を端末外に出さない)。
 *
 * expo-speech-recognition は import 時に requireNativeModule で native を要求し、
 * 未搭載(Expo Go・シミュレータ・prebuild前)だと throw する。App 全体を巻き込まないよう
 * 遅延 require + try/catch で読み込み、失敗時は STT 無効(UI はテキスト入力へ退避)にする。
 */
function loadSpeechRecognition(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule;
  } catch {
    return null;
  }
}

export function createExpoVoice(): VoiceBridge {
  const stt = loadSpeechRecognition();

  return {
    sttAvailable: stt != null,

    speak(text) {
      return new Promise<void>((resolve) => {
        try {
          Speech.stop();
          Speech.speak(text, {
            language: 'ja-JP',
            onDone: () => resolve(),
            onStopped: () => resolve(),
            onError: () => resolve(),
          });
        } catch {
          resolve();
        }
      });
    },

    stopSpeaking() {
      try {
        Speech.stop();
      } catch {
        /* noop */
      }
    },

    async listen(opts) {
      if (!stt) throw new Error('stt-unavailable');
      const perm = await stt.requestPermissionsAsync();
      if (!perm?.granted) throw new Error('permission-denied');

      return new Promise<string>((resolve, reject) => {
        let finalText = '';
        let lastText = '';
        const subs = [
          stt.addListener('result', (e: any) => {
            const t = e?.results?.[0]?.transcript ?? '';
            lastText = t;
            if (e?.isFinal) finalText = t;
            opts?.onPartial?.(t);
          }),
          stt.addListener('end', () => {
            cleanup();
            resolve(finalText || lastText);
          }),
          stt.addListener('error', (e: any) => {
            cleanup();
            reject(new Error(e?.error ?? 'stt-error'));
          }),
        ];
        const cleanup = () => subs.forEach((s: any) => s?.remove?.());

        try {
          stt.start({
            lang: 'ja-JP',
            requiresOnDeviceRecognition: true,
            interimResults: true,
            continuous: false,
          });
        } catch (err) {
          cleanup();
          reject(err instanceof Error ? err : new Error('stt-start-failed'));
        }
      });
    },

    finishListening() {
      try {
        stt?.stop();
      } catch {
        /* noop */
      }
    },

    cancelListening() {
      try {
        stt?.abort();
      } catch {
        /* noop */
      }
    },
  };
}
