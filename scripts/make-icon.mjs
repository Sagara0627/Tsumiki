// キャラ別 SVG から assets/icon.png(1024px)を書き出す。
// 使い方: npm run icon -- mame   (mame | homura | tsumi)
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2] ?? 'mame';
const src = join(root, 'assets', 'character', `icon-${name}.svg`);

if (!existsSync(src)) {
  console.error(`SVG が見つかりません: ${src}`);
  console.error('使い方: npm run icon -- <mame|homura|tsumi>');
  process.exit(1);
}

const out = join(root, 'assets', 'icon.png');
await sharp(src, { density: 96 }).resize(1024, 1024).png().toFile(out);
console.log(`書き出しました: ${out} (${name})`);
