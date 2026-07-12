import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

interface IconProps {
  color: string;
  size?: number;
  focused?: boolean;
}

export function HomeIcon({ color, size = 24, focused }: IconProps) {
  const sw = focused ? 2.3 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 10.8 12 4.3l7.5 6.5V19a1.7 1.7 0 0 1-1.7 1.7H6.2A1.7 1.7 0 0 1 4.5 19v-8.2Z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.16 : 0}
      />
      <Path
        d="M9.8 20.5v-5a2.2 2.2 0 0 1 4.4 0v5"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TasksIcon({ color, size = 24, focused }: IconProps) {
  const sw = focused ? 2.3 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3.8}
        y={3.8}
        width={16.4}
        height={16.4}
        rx={5.2}
        stroke={color}
        strokeWidth={sw}
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.16 : 0}
      />
      <Path
        d="m8.4 12.2 2.5 2.6 4.9-5.4"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ color, size = 24, focused }: IconProps) {
  const sw = focused ? 2.3 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3.8}
        y={5.2}
        width={16.4}
        height={15}
        rx={4.5}
        stroke={color}
        strokeWidth={sw}
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.16 : 0}
      />
      <Line x1={4.4} y1={9.8} x2={19.6} y2={9.8} stroke={color} strokeWidth={sw} />
      <Line x1={8.3} y1={3.2} x2={8.3} y2={6.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={15.7} y1={3.2} x2={15.7} y2={6.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={12} cy={14.8} r={1.7} fill={color} />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 24, focused }: IconProps) {
  const sw = focused ? 2.3 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={15} cy={7} r={2.5} fill={colors.card} stroke={color} strokeWidth={sw} />
      <Circle cx={9} cy={12} r={2.5} fill={colors.card} stroke={color} strokeWidth={sw} />
      <Circle cx={16.5} cy={17} r={2.5} fill={colors.card} stroke={color} strokeWidth={sw} />
    </Svg>
  );
}
