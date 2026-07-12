import { Platform } from 'react-native';

// 「積み木の絵本」— あたたかい紙の上に、木のブロックを積む
export const colors = {
  bg: '#FAF3E5',
  card: '#FFFFFF',
  text: '#3B2B1C',
  sub: '#9C8A76',
  border: '#F0E3CC',
  faint: '#F6EDDA',
  primary: '#FF8A3C',
  primarySoft: '#FFE9D6',
  danger: '#E5484D',
  dangerBg: '#FDECEC',
  success: '#3FA871',
  successSoft: '#E2F3E9',
  freeze: '#4BA9E8',
  freezeSoft: '#E6F3FC',
  gold: '#F0AD00',
  goldSoft: '#FBF1D3',
};

export const radius = {
  card: 24,
  chip: 14,
  block: 8,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#5C4326',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: '#5C4326',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
};

// キャラクターの声(セリフ・お祝い)だけ丸ゴシック。iOS同梱フォントのためW4のみ
// — 太字にせず、サイズと色で強弱をつけること
export const font = {
  rounded: Platform.select({ ios: 'Hiragino Maru Gothic ProN', default: undefined }),
};
