import { Directory, File, Paths } from 'expo-file-system';
import { ALL_EMOTIONS, CharacterId, Emotion } from '../store/types';
import { genId } from '../utils/id';

/**
 * リッチ通知に添付するキャラ表情 PNG のキャッシュ置き場。
 * 初回起動時に CharacterImageFactory が SVG を撮影してここへ保存する。
 * 本番イラストへ差し替える場合も同じパスに PNG を置くだけでよい。
 */
function imagesDir(): Directory {
  return new Directory(Paths.document, 'character-images');
}

function imageFile(characterId: CharacterId, emotion: Emotion): File {
  return new File(imagesDir(), `${characterId}-${emotion}.png`);
}

/** キャッシュ済みなら PNG の URI を返す */
export function characterImageUri(characterId: CharacterId, emotion: Emotion): string | null {
  try {
    const f = imageFile(characterId, emotion);
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

/** まだ PNG 化されていない表情の一覧 */
export function missingEmotions(characterId: CharacterId): Emotion[] {
  try {
    return ALL_EMOTIONS.filter((e) => !imageFile(characterId, e).exists);
  } catch {
    return [];
  }
}

/** captureRef が書き出した一時ファイルをキャッシュ先へ移動する */
export function saveCapturedImage(
  characterId: CharacterId,
  emotion: Emotion,
  tmpUri: string
): void {
  const dir = imagesDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = imageFile(characterId, emotion);
  if (dest.exists) dest.delete();
  new File(tmpUri).move(dest);
}

/**
 * 通知添付用のコピーを作る。
 * iOS は添付ファイルを通知ストアへ「移動」してしまうため、
 * キャッシュ本体を直接渡すと2回目以降の通知で画像が消える。
 */
export function attachmentCopyUri(characterId: CharacterId, emotion: Emotion): string | null {
  try {
    const src = imageFile(characterId, emotion);
    if (!src.exists) return null;
    const copy = new File(Paths.cache, `notif-${genId()}.png`);
    src.copy(copy);
    return copy.uri;
  } catch {
    return null;
  }
}
