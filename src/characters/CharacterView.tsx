import React from 'react';
import { CharacterId, Emotion } from '../store/types';
import { getCharacter } from './index';

interface Props {
  characterId: CharacterId;
  emotion: Emotion;
  size: number;
}

/** アクティブキャラの指定感情を描画する薄いラッパー */
export default function CharacterView({ characterId, emotion, size }: Props) {
  const def = getCharacter(characterId);
  const CharSvg = def.Svg;
  return <CharSvg emotion={emotion} size={size} />;
}
