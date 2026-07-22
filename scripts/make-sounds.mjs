// UI サウンドを合成生成して assets/sounds/*.wav に書き出す(make-icon.mjs と同じ「素材はコード生成」方針)。
// 外部音源に依存せず完全自作のため、ライセンスはリポジトリと同じ(実質 CC0)。
// 実行: npm run sounds  /  差し替えたい場合はここのパラメータを調整して再生成する。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
const RATE = 44100;

/** 16bit PCM モノラルの WAV を書き出す。samples は -1..1 の配列 */
function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // モノラル
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits/sample
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT_DIR, name), buf);
  console.log(`  ${name}  (${(buf.length / 1024).toFixed(0)}KB)`);
}

const sine = (freq, t) => Math.sin(2 * Math.PI * freq * t);
/** ベル風: 基音+倍音を指数減衰。attack でクリックノイズを防ぐ */
function bell(freq, t, decay, harmonics = [[1, 1], [2, 0.35]]) {
  const attack = Math.min(1, t / 0.004);
  const env = attack * Math.exp(-t / decay);
  let v = 0;
  for (const [mult, amp] of harmonics) v += amp * sine(freq * mult, t);
  return (v / harmonics.reduce((a, [, amp]) => a + amp, 0)) * env;
}

// --- tap: ごく短い操作音(60ms) ---
function makeTap() {
  const dur = 0.06;
  const out = new Float32Array(Math.floor(RATE * dur));
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    out[i] = bell(920, t, 0.018, [[1, 1], [2, 0.2]]) * 0.34;
  }
  return out;
}

// --- complete: タスク完了の確定音。C5+G5(完全5度)のやわらかいベル ---
function makeComplete() {
  const dur = 0.36;
  const out = new Float32Array(Math.floor(RATE * dur));
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const v =
      bell(523.25, t, 0.26, [[1, 1], [2, 0.3]]) * 0.5 +
      bell(783.99, t, 0.3, [[1, 1], [2, 0.25]]) * 0.5;
    out[i] = v * 0.55;
  }
  return out;
}

// --- celebrate: お祝いのアルペジオ C5→E5→G5→C6 ---
function makeCelebrate() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const step = 0.085;
  const dur = step * notes.length + 0.4;
  const out = new Float32Array(Math.floor(RATE * dur));
  notes.forEach((freq, k) => {
    const start = Math.floor(RATE * step * k);
    for (let i = start; i < out.length; i++) {
      const t = (i - start) / RATE;
      out[i] += bell(freq, t, 0.33, [[1, 1], [2, 0.4], [3, 0.15]]) * 0.4;
    }
  });
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

// bgm.mp3 は書き出し済みの楽曲ファイル(シームレスループ前提)を直接配置する運用のため、
// ここでは生成しない。差し替える場合は assets/sounds/bgm.mp3 を上書きすればよい。

mkdirSync(OUT_DIR, { recursive: true });
console.log('サウンドを生成中…');
writeWav('tap.wav', makeTap());
writeWav('complete.wav', makeComplete());
writeWav('celebrate.wav', makeCelebrate());
console.log('完了: assets/sounds/');
