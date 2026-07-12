import { CharacterDefinition } from './types';
import { CharacterId } from '../store/types';
import { mame } from './mame';
import { homura } from './homura';
import { tsumi } from './tsumi';

/**
 * ★ キャラクターの差し替えはここ1か所 ★
 * 初期キャラを変えるには DEFAULT_CHARACTER_ID を変更する。
 * (アプリ内の設定画面からも切り替え可能。設定値が優先される)
 */
export const DEFAULT_CHARACTER_ID: CharacterId = 'mame';

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  mame,
  homura,
  tsumi,
};

export function getCharacter(id: CharacterId): CharacterDefinition {
  return CHARACTERS[id] ?? CHARACTERS[DEFAULT_CHARACTER_ID];
}
