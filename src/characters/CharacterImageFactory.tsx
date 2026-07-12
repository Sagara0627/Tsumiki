import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { CharacterId, Emotion } from '../store/types';
import { missingEmotions, saveCapturedImage } from '../notifications/characterImages';
import CharacterView from './CharacterView';

const IMAGE_SIZE = 512;

/**
 * リッチ通知用のキャラ表情 PNG を画面外で生成するコンポーネント。
 * 未生成の表情を1枚ずつ描画→撮影→保存し、全て終わると何も描画しなくなる。
 * App のルートに置いておくだけでよい(キャラ切替時も自動で追加生成)。
 */
export default function CharacterImageFactory({ characterId }: { characterId: CharacterId }) {
  const [queue, setQueue] = useState<Emotion[]>([]);

  useEffect(() => {
    setQueue(missingEmotions(characterId));
  }, [characterId]);

  if (queue.length === 0) return null;
  const emotion = queue[0];
  return (
    <View style={styles.offscreen} pointerEvents="none">
      <EmotionShot
        key={`${characterId}-${emotion}`}
        characterId={characterId}
        emotion={emotion}
        onDone={() => setQueue((q) => q.slice(1))}
      />
    </View>
  );
}

function EmotionShot({
  characterId,
  emotion,
  onDone,
}: {
  characterId: CharacterId;
  emotion: Emotion;
  onDone: () => void;
}) {
  const ref = useRef<View>(null);

  useEffect(() => {
    let cancelled = false;
    // マウント直後は描画が終わっていないことがあるので1フレーム待つ
    const raf = requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const uri = await captureRef(ref, {
            format: 'png',
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            result: 'tmpfile',
          });
          if (!cancelled) saveCapturedImage(characterId, emotion, uri);
        } catch {
          // 撮影失敗時はスキップ(通知は画像なしで送られるだけ)
        } finally {
          if (!cancelled) onDone();
        }
      }, 50);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [characterId, emotion, onDone]);

  return (
    <View ref={ref} collapsable={false} style={styles.shot}>
      <CharacterView characterId={characterId} emotion={emotion} size={IMAGE_SIZE} />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -IMAGE_SIZE * 2,
    top: 0,
    opacity: 0,
  },
  shot: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: 'transparent',
  },
});
