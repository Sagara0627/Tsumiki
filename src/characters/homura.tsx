import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { CharacterDefinition, CharacterSvgProps } from './types';
import { Emotion } from '../store/types';

const MOUTH = '#B33B18';
const TEAR = '#8FCBEF';

/** 感情ごとの炎のスケール(弱ると小さくなる) */
function flameScale(emotion: Emotion): number {
  switch (emotion) {
    case 'proud':
      return 1.06;
    case 'celebrate':
      return 1.14;
    case 'worried':
      return 0.9;
    case 'tearful':
      return 0.78;
    case 'sad':
      return 0.62;
    default:
      return 1;
  }
}

/** 弱っている時は色もくすませる */
function flameColors(emotion: Emotion): { outer: [string, string]; core: [string, string] } {
  if (emotion === 'sad') {
    return { outer: ['#D9A18C', '#C99383'], core: ['#EFDDBA', '#F5EAD2'] };
  }
  if (emotion === 'tearful') {
    return { outer: ['#FF9A6C', '#F27A50'], core: ['#FFE07A', '#FFF3B0'] };
  }
  return { outer: ['#FF7A3C', '#FF5A2C'], core: ['#FFD23F', '#FFF3B0'] };
}

function Sparks({ emotion }: { emotion: Emotion }) {
  if (emotion === 'celebrate') {
    return (
      <G>
        <Circle cx={34} cy={60} r={5} fill="#FFB25E" />
        <Circle cx={168} cy={52} r={4} fill="#FFB25E" />
        <Circle cx={24} cy={120} r={3.5} fill="#FF8A3C" />
        <Circle cx={176} cy={116} r={4.5} fill="#FF8A3C" />
        <Path d="M156 24 l3 7.5 7.5 3 -7.5 3 -3 7.5 -3 -7.5 -7.5 -3 7.5 -3 Z" fill="#F5B301" />
        <Path d="M40 20 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill="#F5B301" />
      </G>
    );
  }
  if (emotion === 'proud' || emotion === 'cheer' || emotion === 'relieved') {
    return (
      <G>
        <Circle cx={42} cy={70} r={4} fill="#FFB25E" />
        <Circle cx={160} cy={62} r={3.5} fill="#FFB25E" />
        <Circle cx={170} cy={130} r={3} fill="#FF8A3C" />
      </G>
    );
  }
  if (emotion === 'sad') {
    // 立ちのぼる煙
    return (
      <Path
        d="M100 66 q-8 -12 0 -22 q8 -10 2 -20"
        stroke="#B9AFA6"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
    );
  }
  return null;
}

function Face({ emotion }: { emotion: Emotion }) {
  switch (emotion) {
    case 'cheer':
      return (
        <G>
          <Ellipse cx={87} cy={128} rx={6} ry={9} fill="#FFF" />
          <Ellipse cx={113} cy={128} rx={6} ry={9} fill="#FFF" />
          <Path d="M88 148 Q100 160 112 148 Z" fill={MOUTH} />
        </G>
      );
    case 'proud':
      return (
        <G>
          <Path d="M80 128 Q87 120 94 128" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M106 128 Q113 120 120 128" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M90 146 Q100 156 110 146" stroke={MOUTH} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Path d="M78 116 L94 121" stroke="#FFF" strokeWidth={4} strokeLinecap="round" />
          <Path d="M122 116 L106 121" stroke="#FFF" strokeWidth={4} strokeLinecap="round" />
          <Ellipse cx={88} cy={131} rx={5} ry={7} fill="#FFF" />
          <Ellipse cx={112} cy={131} rx={5} ry={7} fill="#FFF" />
          <Path d="M90 150 Q95 146 100 150 Q105 154 110 150" stroke={MOUTH} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'tearful':
      return (
        <G>
          <Ellipse cx={87} cy={129} rx={7} ry={9.5} fill="#FFF" />
          <Circle cx={87} cy={127} r={2.5} fill="#FFD23F" />
          <Ellipse cx={113} cy={129} rx={7} ry={9.5} fill="#FFF" />
          <Circle cx={113} cy={127} r={2.5} fill="#FFD23F" />
          <Ellipse cx={80} cy={145} rx={4} ry={6} fill={TEAR} />
          <Ellipse cx={120} cy={145} rx={4} ry={6} fill={TEAR} />
          <Path d="M90 154 Q100 146 110 154" stroke={MOUTH} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sad':
      return (
        <G>
          <Path d="M80 132 Q87 138 94 132" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M106 132 Q113 138 120 132" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M92 152 Q100 147 108 152" stroke={MOUTH} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'relieved':
      return (
        <G>
          <Path d="M80 128 Q87 120 94 128" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M106 128 Q113 120 120 128" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M81 136 q-3 10 -1 15" stroke={TEAR} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M119 136 q3 10 1 15" stroke={TEAR} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M86 146 Q100 162 114 146 Z" fill={MOUTH} />
        </G>
      );
    case 'celebrate':
      return (
        <G>
          <Path d="M80 126 Q87 118 94 126" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M106 126 Q113 118 120 126" stroke="#FFF" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M84 144 Q100 164 116 144 Z" fill={MOUTH} />
        </G>
      );
  }
}

function HomuraSvg({ emotion, size }: CharacterSvgProps) {
  const s = flameScale(emotion);
  const { outer, core } = flameColors(emotion);
  // 先端: 弱ると横に曲がる
  const bentTip = emotion === 'worried' || emotion === 'tearful';
  const outerPath = bentTip
    ? 'M112 34 C104 44 148 78 152 122 C156 164 130 186 100 186 C70 186 44 164 48 122 C52 80 82 56 112 34 Z'
    : 'M100 18 C126 52 154 82 154 122 C154 164 130 186 100 186 C70 186 46 164 46 122 C46 82 74 52 100 18 Z';
  const armsUp = emotion === 'celebrate';
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="hOuter" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={outer[1]} />
          <Stop offset="1" stopColor={outer[0]} />
        </LinearGradient>
        <LinearGradient id="hCore" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={core[0]} />
          <Stop offset="1" stopColor={core[1]} />
        </LinearGradient>
      </Defs>
      <Sparks emotion={emotion} />
      <G transform={`translate(${100 - 100 * s} ${186 - 186 * s}) scale(${s})`}>
        {/* 腕(炎の突起) */}
        {armsUp ? (
          <G>
            <Ellipse cx={46} cy={96} rx={10} ry={20} fill={outer[0]} transform="rotate(30 46 96)" />
            <Ellipse cx={154} cy={96} rx={10} ry={20} fill={outer[0]} transform="rotate(-30 154 96)" />
          </G>
        ) : (
          <G>
            <Ellipse cx={44} cy={136} rx={9} ry={16} fill={outer[0]} transform="rotate(-18 44 136)" />
            <Ellipse cx={156} cy={136} rx={9} ry={16} fill={outer[0]} transform="rotate(18 156 136)" />
          </G>
        )}
        <Path d={outerPath} fill="url(#hOuter)" />
        <Path
          d="M100 78 C116 98 132 112 132 138 C132 164 118 176 100 176 C82 176 68 164 68 138 C68 112 84 98 100 78 Z"
          fill="url(#hCore)"
        />
        <Face emotion={emotion} />
      </G>
    </Svg>
  );
}

export const homura: CharacterDefinition = {
  id: 'homura',
  name: 'ホムラ',
  title: '継続の炎の精',
  story:
    'あなたが最初のタスクを完了した瞬間に灯った「やる気の種火」の精。燃料はあなたの行動だけ。続けるほど大きく気高く燃え、サボると小さく消えそうになる。消えても種火は残っていて、再点火できる。',
  themeColor: '#FF7A3C',
  bgColor: '#FFF1E6',
  streakEmoji: '🔥',
  actionWord: '薪くべ',
  Svg: HomuraSvg,
  speech: {
    cheer: [
      'よし、今日も燃えていくぜ!🔥',
      '朝イチの1タスクが一番効くんだ!',
    ],
    proud: [
      '見ろよこの炎!{streak}日分の火力だぜ!',
      '今日もいい燃えっぷりだ!',
    ],
    worried: [
      'お、おい…今日まだ薪(タスク)が入ってないぞ…?',
      'ちょっと火が細くなってきた…かも…',
    ],
    tearful: [
      'このままだと…消えちゃうよ…あと1つ、頼む…',
      '{streak}日燃やし続けた炎なんだ…消さないでくれ…',
    ],
    sad: [
      '……消えちまった。でも、種火は残ってる',
      'もう一回、火を入れてくれるか…?',
    ],
    relieved: [
      '再点火ーー!!うぉぉ、泣けるぜ…!',
      '戻ってきてくれると思ってたぜ…!',
    ],
    celebrate: [
      'うおおお!最っ高に燃えてるぜ!!🎆',
      '祝いの大火だ!!',
    ],
  },
  notif: {
    morning: [
      'おはよう!今日の最初の薪をくべようぜ🔥',
      '朝の1タスクで、今日一日燃え続けられるぜ!',
    ],
    noon: [
      'おーい、今日まだ薪が入ってないぞ?火が細くなってきた…',
      '昼のうちに1つやっとくと夜がラクだぜ!',
    ],
    evening: [
      'やばい、火が小さくなってきた…{streak}日の炎を消さないでくれ…',
      'あと1タスクで今日の炎は守れる。頼んだぜ…!',
    ],
    lastCall: [
      'ホムラが消えかけてる…!{streak}日の炎、あと少しで消えちゃうよ…!',
      '今日が終わる前に…1つだけでいい、火を入れてくれ…!',
    ],
    praiseTask: ['ナイス薪!ゴウゴウ燃えてきたぜ🔥'],
    streakMilestone: (n) => `🎉 ${n}日連続燃焼!炎がひときわ大きくなった!`,
    levelUp: (lv) => `⬆️ レベル${lv}!火力がワンランク上がったぜ!`,
    broken: ['昨日は火が消えちまった…でも種火はある。今日から再点火だ🔥'],
    recovered: ['再点火成功!!ホムラ、うれし泣きしてるぜ…!'],
  },
};
