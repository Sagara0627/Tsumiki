import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { CharacterDefinition, CharacterSvgProps } from './types';
import { Emotion } from '../store/types';

const OUTLINE = '#4A3B32';
const BODY = '#F6EDD6';
const BELLY = '#FCF7E8';
const GREEN = '#7BC96F';
const GREEN_DARK = '#5BA854';
const BLUSH = '#F5B8B8';
const TEAR = '#8FCBEF';

/** 双葉の垂れ具合: 0=ピン 1=少し 2=しおれ 3=完全に垂れる */
function leafDroop(emotion: Emotion): number {
  switch (emotion) {
    case 'worried':
      return 1;
    case 'tearful':
      return 2;
    case 'sad':
      return 3;
    case 'relieved':
      return 1;
    default:
      return 0;
  }
}

function Sprout({ emotion }: { emotion: Emotion }) {
  const droop = leafDroop(emotion);
  const angle = [0, 18, 38, 62][droop];
  const flower = emotion === 'celebrate';
  return (
    <G>
      <Path d="M100 44 C100 34 100 28 100 20" stroke={GREEN_DARK} strokeWidth={6} strokeLinecap="round" fill="none" />
      <G transform={`rotate(${angle} 100 22)`}>
        <Ellipse cx={82} cy={16} rx={17} ry={10} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} transform="rotate(-24 82 16)" />
      </G>
      <G transform={`rotate(${-angle} 100 22)`}>
        <Ellipse cx={118} cy={16} rx={17} ry={10} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} transform="rotate(24 118 16)" />
      </G>
      {flower && (
        <G>
          {[0, 72, 144, 216, 288].map((r) => (
            <Ellipse key={r} cx={100} cy={8} rx={6} ry={9} fill="#FFB7D0" transform={`rotate(${r} 100 14)`} />
          ))}
          <Circle cx={100} cy={14} r={5} fill="#F5B301" />
        </G>
      )}
    </G>
  );
}

function Face({ emotion }: { emotion: Emotion }) {
  switch (emotion) {
    case 'cheer':
      return (
        <G>
          <Circle cx={78} cy={95} r={7} fill={OUTLINE} />
          <Circle cx={81} cy={92} r={2.5} fill="#FFF" />
          <Circle cx={122} cy={95} r={7} fill={OUTLINE} />
          <Circle cx={125} cy={92} r={2.5} fill="#FFF" />
          <Path d="M86 112 Q100 130 114 112 Z" fill={OUTLINE} />
        </G>
      );
    case 'proud':
      return (
        <G>
          <Path d="M70 96 Q78 86 86 96" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M114 96 Q122 86 130 96" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M88 113 Q100 125 112 113" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M46 62 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="#F5B301" />
          <Path d="M154 78 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill="#F5B301" />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Path d="M66 82 L84 88" stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" />
          <Path d="M134 82 L116 88" stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={79} cy={97} r={5.5} fill={OUTLINE} />
          <Circle cx={121} cy={97} r={5.5} fill={OUTLINE} />
          <Path d="M88 117 Q94 112 100 117 Q106 122 112 117" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M152 64 q7 11 0 16 q-7 -5 0 -16 Z" fill={TEAR} />
        </G>
      );
    case 'tearful':
      return (
        <G>
          <Circle cx={78} cy={96} r={8.5} fill={OUTLINE} />
          <Circle cx={81} cy={92} r={3} fill="#FFF" />
          <Circle cx={75} cy={98} r={1.8} fill="#FFF" />
          <Circle cx={122} cy={96} r={8.5} fill={OUTLINE} />
          <Circle cx={125} cy={92} r={3} fill="#FFF" />
          <Circle cx={119} cy={98} r={1.8} fill="#FFF" />
          <Ellipse cx={72} cy={112} rx={4.5} ry={6.5} fill={TEAR} />
          <Ellipse cx={128} cy={112} rx={4.5} ry={6.5} fill={TEAR} />
          <Path d="M88 122 Q100 112 112 122" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sad':
      return (
        <G>
          <Path d="M70 96 Q78 103 86 96" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M114 96 Q122 103 130 96" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M91 120 Q100 114 109 120" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'relieved':
      return (
        <G>
          <Path d="M70 96 Q78 86 86 96" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M114 96 Q122 86 130 96" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M72 102 q-3 12 -1 18" stroke={TEAR} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M128 102 q3 12 1 18" stroke={TEAR} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M84 112 Q100 132 116 112 Z" fill={OUTLINE} />
        </G>
      );
    case 'celebrate':
      return (
        <G>
          <Path d="M70 94 Q78 84 86 94" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M114 94 Q122 84 130 94" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M82 110 Q100 136 118 110 Z" fill={OUTLINE} />
          <Circle cx={40} cy={44} r={4} fill="#FF8A3C" />
          <Circle cx={162} cy={38} r={4} fill="#5B8DEF" />
          <Circle cx={30} cy={100} r={3.5} fill="#9C6ADE" />
          <Circle cx={172} cy={104} r={3.5} fill="#6FCF97" />
          <Path d="M156 56 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill="#F5B301" />
          <Path d="M38 66 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill="#F5B301" />
        </G>
      );
  }
}

function MameSvg({ emotion, size }: CharacterSvgProps) {
  const armsUp = emotion === 'celebrate';
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* 腕 */}
      {armsUp ? (
        <G>
          <Ellipse cx={48} cy={92} rx={9} ry={16} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} transform="rotate(35 48 92)" />
          <Ellipse cx={152} cy={92} rx={9} ry={16} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} transform="rotate(-35 152 92)" />
        </G>
      ) : (
        <G>
          <Ellipse cx={44} cy={128} rx={9} ry={14} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} transform="rotate(-20 44 128)" />
          <Ellipse cx={156} cy={128} rx={9} ry={14} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} transform="rotate(20 156 128)" />
        </G>
      )}
      {/* 足 */}
      <Ellipse cx={80} cy={181} rx={13} ry={8} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} />
      <Ellipse cx={120} cy={181} rx={13} ry={8} fill={GREEN} stroke={GREEN_DARK} strokeWidth={3} />
      {/* 体 */}
      <Path
        d="M100 42 C138 42 162 78 160 118 C158 158 132 180 100 180 C68 180 42 158 40 118 C38 78 62 42 100 42 Z"
        fill={emotion === 'sad' ? '#EFE6CE' : BODY}
        stroke={OUTLINE}
        strokeWidth={5}
      />
      <Ellipse cx={100} cy={140} rx={36} ry={26} fill={BELLY} />
      {/* 頬 */}
      {emotion !== 'sad' && (
        <G>
          <Circle cx={64} cy={110} r={7} fill={BLUSH} opacity={0.85} />
          <Circle cx={136} cy={110} r={7} fill={BLUSH} opacity={0.85} />
        </G>
      )}
      <Sprout emotion={emotion} />
      <Face emotion={emotion} />
    </Svg>
  );
}

export const mame: CharacterDefinition = {
  id: 'mame',
  name: 'マメ',
  title: '芽吹きの妖精',
  story:
    'キャリアという大樹の「継続の豆」から生まれた新芽の妖精。毎日のタスクはマメへの水やり。続ければ育ち、忘れると葉がしおれてしまう。5つの枝を伸ばして大樹になるのが夢。',
  themeColor: '#7BC96F',
  bgColor: '#EFF8EA',
  streakEmoji: '🌱',
  actionWord: '水やり',
  Svg: MameSvg,
  speech: {
    cheer: [
      'おはよ!今日も水やり、お願いね🌱',
      '今日のミッション、いっしょにやろ!',
      '朝のうちに1つやると、今日がラクだよ!',
    ],
    proud: [
      '今日もぐんぐん育ってるよ!えっへん🌿',
      '{streak}日分、大きくなったよ!',
      '今日の水やり、ありがとう!',
    ],
    worried: [
      'ねえねえ…今日まだ水やりしてないよ…?',
      'そわそわ……のど、かわいてきちゃった…',
    ],
    tearful: [
      '今日が終わっちゃうよぅ…あと1つだけ、お願い…',
      '{streak}日分の成長が…しおれちゃう…',
    ],
    sad: [
      '……昨日はお水、もらえなかったね。ちょっと元気ないや…',
      'だいじょうぶ。今日からまた、育て直そ…?',
    ],
    relieved: [
      'もどってきてくれた…!うれしくて涙でちゃう…',
      'また一緒に育てるって、信じてたよ!',
    ],
    celebrate: [
      'やったーー!!お花が咲きそう!🎉',
      'すごいすごい!ぼく、誇らしいよ!',
    ],
  },
  notif: {
    morning: [
      'おはよ!ぼくに今日の水やり、お願いね🌱',
      '朝のうちに1タスクやると、今日一日ラクだよ!',
    ],
    noon: [
      'ちょっとのどが渇いてきたかも…今日まだだよね…?',
      '5分だけでもいいから、水やりしてほしいな',
    ],
    evening: [
      'そろそろ日が沈むよ…{streak}日の成長、枯らさないで…',
      'マメがそわそわしてる…あと1タスクで今日の継続を守れるよ',
    ],
    lastCall: [
      '今日が終わっちゃう…!{streak}日分の記録が枯れる寸前だよ…!',
      'マメが泣いてる…寝る前に1つだけ、お願い…!',
    ],
    praiseTask: ['わ!お水ありがとう!ぐんぐん伸びるよ🌿'],
    streakMilestone: (n) => `🎉 ${n}日継続!マメがひとまわり大きくなったよ!`,
    levelUp: (lv) => `⬆️ レベル${lv}に成長!マメも誇らしげです`,
    broken: ['昨日はできなかったね…今日からまた一緒に育て直そう🌱'],
    recovered: ['おかえり!マメ、うれしくて泣いちゃった…!'],
  },
};
