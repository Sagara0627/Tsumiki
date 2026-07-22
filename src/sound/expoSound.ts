import { AppState as RNAppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SoundBridge, SoundEffect, SoundSettings } from './index';

// 効果音は assets/sounds/*.wav(scripts/make-sounds.mjs で生成)。Metro が require で束ねる
const SFX_SOURCES: Record<SoundEffect, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  celebrate: require('../../assets/sounds/celebrate.wav'),
};
// BGM は書き出し済みの楽曲ファイル(シームレスループ前提)。make-sounds.mjs の生成対象外
const BGM_SOURCE = require('../../assets/sounds/bgm.mp3');

const SFX_VOLUME: Record<SoundEffect, number> = {
  tap: 0.4,
  complete: 0.6,
  celebrate: 0.7,
};
const BGM_VOLUME = 0.28;

/**
 * expo-audio による SoundBridge 実装。
 * - 効果音: プレイヤーを都度使い回し、頭出し(seekTo 0)して再生
 * - BGM: ループ再生。設定 OFF・アプリがバックグラウンドの間は一時停止
 * オーディオ初期化に失敗しても throw せず、無音で継続する(voice ブリッジと同じ思想)。
 */
export function createExpoSound(): SoundBridge {
  let settings: SoundSettings = { sfx: true, bgm: false };
  let appActive = true;
  const players: Partial<Record<SoundEffect, AudioPlayer>> = {};
  let bgmPlayer: AudioPlayer | null = null;

  // iOS のマナーモードを尊重し(playsInSilentMode:false)、他アプリの音楽とは共存する
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
    () => {}
  );

  function sfxPlayer(effect: SoundEffect): AudioPlayer | null {
    if (!players[effect]) {
      try {
        const p = createAudioPlayer(SFX_SOURCES[effect]);
        p.volume = SFX_VOLUME[effect];
        players[effect] = p;
      } catch {
        return null;
      }
    }
    return players[effect] ?? null;
  }

  /** BGM を設定・アプリ状態に合わせて再生/停止する(冪等) */
  function syncBgm(): void {
    const shouldPlay = settings.bgm && appActive;
    if (shouldPlay) {
      try {
        if (!bgmPlayer) {
          bgmPlayer = createAudioPlayer(BGM_SOURCE);
          bgmPlayer.loop = true;
          bgmPlayer.volume = BGM_VOLUME;
        }
        bgmPlayer.play();
      } catch {
        bgmPlayer = null;
      }
    } else {
      bgmPlayer?.pause();
    }
  }

  // バックグラウンド復帰で BGM を止める/再開する
  RNAppState.addEventListener('change', (status) => {
    appActive = status === 'active';
    syncBgm();
  });

  return {
    play(effect: SoundEffect) {
      if (!settings.sfx) return;
      const p = sfxPlayer(effect);
      if (!p) return;
      try {
        p.seekTo(0);
        p.play();
      } catch {
        // 再生失敗は無視(無音で継続)
      }
    },
    applySettings(next: SoundSettings) {
      settings = next;
      syncBgm();
    },
  };
}
