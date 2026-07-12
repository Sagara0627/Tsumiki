import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { CharacterDefinition, CharacterSvgProps } from './types';
import { Emotion } from '../store/types';

const OUTLINE = '#59422F';
const BODY = '#E8C99B';
const FACE = '#F7E8CF';
const BLUSH = '#F0A98F';
const TEAR = '#8FCBEF';
const BLOCK1 = '#5B8DEF';
const BLOCK2 = '#F2994A';
const BLOCK3 = '#6FCF97';

/** 頭上ブロックの傾き(崩れそう度) */
function blockTilt(emotion: Emotion): number {
  switch (emotion) {
    case 'worried':
      return 7;
    case 'tearful':
      return 13;
    default:
      return 0;
  }
}

function HeadBlocks({ emotion }: { emotion: Emotion }) {
  if (emotion === 'sad') {
    // 崩れて足元に散らばっている
    return (
      <G>
        <Rect x={150} y={166} width={34} height={18} rx={5} fill={BLOCK1} stroke={OUTLINE} strokeWidth={3} transform="rotate(18 167 175)" />
        <Rect x={8} y={172} width={30} height={16} rx={5} fill={BLOCK2} stroke={OUTLINE} strokeWidth={3} transform="rotate(-14 23 180)" />
      </G>
    );
  }
  const tilt = blockTilt(emotion);
  const extra = emotion === 'proud' || emotion === 'celebrate';
  const relieved = emotion === 'relieved';
  return (
    <G transform={`rotate(${tilt} 100 60)`}>
      <Rect x={70} y={38} width={60} height={24} rx={6} fill={BLOCK1} stroke={OUTLINE} strokeWidth={3.5} />
      {!relieved && (
        <Rect x={79} y={16} width={42} height={20} rx={6} fill={BLOCK2} stroke={OUTLINE} strokeWidth={3.5} transform={`rotate(${tilt > 0 ? tilt + 4 : 0} 100 26)`} />
      )}
      {extra && (
        <G>
          <Rect x={85} y={-4} width={30} height={17} rx={5} fill={BLOCK3} stroke={OUTLINE} strokeWidth={3} />
          <Path d="M136 8 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill="#F5B301" />
        </G>
      )}
      {(emotion === 'worried' || emotion === 'tearful') && (
        <G>
          {/* グラグラ線 */}
          <Path d="M140 22 q6 4 0 8" stroke={OUTLINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Path d="M148 16 q8 6 0 12" stroke={OUTLINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      )}
      {relieved && (
        // 拾ったブロックを載せ直したところ
        <Rect x={82} y={14} width={36} height={19} rx={5} fill={BLOCK3} stroke={OUTLINE} strokeWidth={3.5} />
      )}
    </G>
  );
}

function Face({ emotion }: { emotion: Emotion }) {
  switch (emotion) {
    case 'cheer':
      return (
        <G>
          <Circle cx={82} cy={112} r={6.5} fill={OUTLINE} />
          <Circle cx={85} cy={109} r={2.2} fill="#FFF" />
          <Circle cx={118} cy={112} r={6.5} fill={OUTLINE} />
          <Circle cx={121} cy={109} r={2.2} fill="#FFF" />
          <Path d="M88 128 Q100 142 112 128 Z" fill={OUTLINE} />
        </G>
      );
    case 'proud':
      return (
        <G>
          <Path d="M74 113 Q82 104 90 113" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M110 113 Q118 104 126 113" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M90 130 Q100 140 110 130" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Path d="M72 100 L88 105" stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" />
          <Path d="M128 100 L112 105" stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={83} cy={114} r={5} fill={OUTLINE} />
          <Circle cx={117} cy={114} r={5} fill={OUTLINE} />
          <Path d="M90 132 Q95 128 100 132 Q105 136 110 132" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M146 92 q6 10 0 14 q-6 -4 0 -14 Z" fill={TEAR} />
        </G>
      );
    case 'tearful':
      return (
        <G>
          <Circle cx={82} cy={113} r={8} fill={OUTLINE} />
          <Circle cx={85} cy={109} r={2.8} fill="#FFF" />
          <Circle cx={79} cy={115} r={1.6} fill="#FFF" />
          <Circle cx={118} cy={113} r={8} fill={OUTLINE} />
          <Circle cx={121} cy={109} r={2.8} fill="#FFF" />
          <Circle cx={115} cy={115} r={1.6} fill="#FFF" />
          <Ellipse cx={75} cy={128} rx={4} ry={6} fill={TEAR} />
          <Ellipse cx={125} cy={128} rx={4} ry={6} fill={TEAR} />
          <Path d="M90 136 Q100 128 110 136" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sad':
      return (
        <G>
          <Path d="M74 114 Q82 120 90 114" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M110 114 Q118 120 126 114" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M92 134 Q100 129 108 134" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'relieved':
      return (
        <G>
          <Path d="M74 113 Q82 104 90 113" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M110 113 Q118 104 126 113" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M76 119 q-3 10 -1 15" stroke={TEAR} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M124 119 q3 10 1 15" stroke={TEAR} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M86 128 Q100 146 114 128 Z" fill={OUTLINE} />
        </G>
      );
    case 'celebrate':
      return (
        <G>
          <Path d="M74 111 Q82 102 90 111" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M110 111 Q118 102 126 111" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M84 126 Q100 148 116 126 Z" fill={OUTLINE} />
          <Circle cx={36} cy={70} r={4} fill={BLOCK1} />
          <Circle cx={166} cy={62} r={4} fill={BLOCK2} />
          <Circle cx={28} cy={130} r={3.5} fill={BLOCK3} />
          <Circle cx={172} cy={126} r={3.5} fill="#9C6ADE" />
        </G>
      );
  }
}

function TsumiSvg({ emotion, size }: CharacterSvgProps) {
  const armsUp = emotion === 'celebrate';
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* 腕 */}
      {armsUp ? (
        <G>
          <Ellipse cx={42} cy={92} rx={9} ry={16} fill={BODY} stroke={OUTLINE} strokeWidth={3.5} transform="rotate(35 42 92)" />
          <Ellipse cx={158} cy={92} rx={9} ry={16} fill={BODY} stroke={OUTLINE} strokeWidth={3.5} transform="rotate(-35 158 92)" />
        </G>
      ) : (
        <G>
          <Ellipse cx={40} cy={130} rx={9} ry={15} fill={BODY} stroke={OUTLINE} strokeWidth={3.5} transform="rotate(-15 40 130)" />
          <Ellipse cx={160} cy={130} rx={9} ry={15} fill={BODY} stroke={OUTLINE} strokeWidth={3.5} transform="rotate(15 160 130)" />
        </G>
      )}
      {/* 足 */}
      <Rect x={66} y={168} width={26} height={16} rx={8} fill={BODY} stroke={OUTLINE} strokeWidth={3.5} />
      <Rect x={108} y={168} width={26} height={16} rx={8} fill={BODY} stroke={OUTLINE} strokeWidth={3.5} />
      {/* 体(角丸の木ブロック) */}
      <Rect x={45} y={70} width={110} height={102} rx={24} fill={emotion === 'sad' ? '#DBC29E' : BODY} stroke={OUTLINE} strokeWidth={5} />
      {/* 顔パネル */}
      <Rect x={58} y={84} width={84} height={74} rx={18} fill={FACE} />
      {/* 木目 */}
      <Path d="M52 152 q8 -6 16 0" stroke={OUTLINE} strokeWidth={2} fill="none" opacity={0.35} />
      <Path d="M136 78 q8 4 14 -2" stroke={OUTLINE} strokeWidth={2} fill="none" opacity={0.35} />
      {/* 頬 */}
      {emotion !== 'sad' && (
        <G>
          <Circle cx={70} cy={126} r={6} fill={BLUSH} opacity={0.85} />
          <Circle cx={130} cy={126} r={6} fill={BLUSH} opacity={0.85} />
        </G>
      )}
      <HeadBlocks emotion={emotion} />
      <Face emotion={emotion} />
    </Svg>
  );
}

export const tsumi: CharacterDefinition = {
  id: 'tsumi',
  name: 'ツミ',
  title: 'つみきの守り人',
  story:
    '昔の宮大工が「続ける心」を宿して彫った木の子精霊。あなたの毎日の行動を1個ずつブロックにして、キャリアの塔を積み上げている。5色のブロックは5つのスキル領域。1日サボると塔が崩れそうになるが、崩れても「また積めばいい」が口ぐせ。',
  themeColor: '#C9832C',
  bgColor: '#FBF1DC',
  streakEmoji: '🧱',
  actionWord: 'ひと積み',
  Svg: TsumiSvg,
  speech: {
    cheer: [
      'おはようございます!今日のいちだん、積みましょう🧱',
      '朝のうちに積むと、塔が安定するのです!',
    ],
    proud: [
      '{streak}段目、しっかり積めました!良い塔です!',
      '今日も塔が高くなりました。えっへん!',
    ],
    worried: [
      '今日のぶんが、まだ積まれていません…そわそわします…',
      '1つだけでも、積みませんか…?',
    ],
    tearful: [
      '塔がグラグラです…!今日が終わると、崩れちゃいます…',
      '{streak}日分の積み上げが…お願いです、あと1つだけ…',
    ],
    sad: [
      '……崩れてしまいました。でも、土台は残っています',
      'また1段目から、一緒に積んでくれますか…?',
    ],
    relieved: [
      '戻ってきてくれた…!うれしくて涙が…また積めます!',
      '1段目、積み直しました!ここからです!',
    ],
    celebrate: [
      'なんと立派な塔でしょう!!🎉',
      'お祝いです!特別なブロックを積みました!',
    ],
  },
  notif: {
    morning: [
      'おはようございます!今日の1段、積みましょう🧱',
      '朝の1タスクで、今日の塔は安泰です!',
    ],
    noon: [
      '今日のぶんが、まだ積まれていません…そわそわ…',
      'お昼の5分で1段、いかがですか?',
    ],
    evening: [
      '塔が傾いてきました…{streak}日分の積み上げが危ないです…',
      'あと1タスクで今日の塔は守れます…!',
    ],
    lastCall: [
      'もうすぐ今日が終わります…!{streak}日の塔が崩れる寸前です…!',
      'ツミが泣いています…寝る前に1つだけ、お願いします…!',
    ],
    praiseTask: ['見事な1段です!塔が高くなりました🧱'],
    streakMilestone: (n) => `🎉 ${n}日積み上げ達成!記念のブロックを積みました!`,
    levelUp: (lv) => `⬆️ レベル${lv}!職人の腕が上がりました!`,
    broken: ['昨日は積めませんでした…今日からまた、一緒に積み直しましょう🧱'],
    recovered: ['積み直しの1段目!ツミはうれし泣きです…!'],
  },
};
