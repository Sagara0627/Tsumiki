import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { areaOf } from '../store/seed';
import { completionsOn } from '../store/streak';
import { SIM_AREAS, scenariosForArea } from '../sims';
import { getVoiceBridge } from '../voice';
import { todayKey } from '../utils/date';
import { useSim } from '../components/SimRunner';
import { Card } from '../components/ui';
import { Bouncy } from '../components/animations';
import { colors, radius } from '../theme';

/**
 * 「れんしゅう」タブ。相手・場が要る3領域のロールプレイをいつでも起動できる。
 * 完走するとその領域のタスク(sim-<area>)が完了扱いになり、ストリーク・ゴールが進む。
 */
export default function PracticeScreen() {
  const { state, now } = useApp();
  const insets = useSafeAreaInsets();
  const { openSim } = useSim();
  const voice = getVoiceBridge();

  const today = todayKey(now);
  const doneSimAreas = new Set(
    state.logs.filter((l) => l.dateKey === today).map((l) => l.taskId)
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>れんしゅう</Text>
        <Text style={styles.lead}>
          相手や場がないとやりにくいアクションを、キャラ相手に声で練習しよう。1回やり切ると今日のぶんが完了になるよ。
        </Text>
        {!voice.sttAvailable && (
          <Text style={styles.note}>
            ※ 音声はネイティブビルド(実機)で使えます。それ以外ではキーボード入力で練習できます。
          </Text>
        )}

        {SIM_AREAS.map((areaId) => {
          const area = areaOf(areaId);
          const scenarios = scenariosForArea(areaId);
          const doneToday = doneSimAreas.has(`sim-${areaId}`);
          return (
            <Card key={areaId} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.tile, { backgroundColor: `${area.color}24` }]}>
                  <Text style={styles.emoji}>{area.emoji}</Text>
                </View>
                <View style={styles.headText}>
                  <Text style={styles.areaName}>{area.name}</Text>
                  <Text style={styles.areaDesc}>{area.description}</Text>
                </View>
                {doneToday && <Text style={styles.donePill}>済</Text>}
              </View>
              <Text style={styles.scenarioNote}>
                台本 {scenarios.length}本 ・ 相手はキャラが演じるよ
              </Text>
              <Bouncy
                style={{ ...styles.startBtn, backgroundColor: area.color }}
                onPress={() => openSim(areaId)}
                scaleTo={0.96}
              >
                <Text style={styles.startBtnText}>🎙️ ロールプレイを始める</Text>
              </Bouncy>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  lead: { fontSize: 14, color: colors.sub, lineHeight: 21 },
  note: { fontSize: 12, color: colors.primary, lineHeight: 18 },
  card: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  headText: { flex: 1 },
  areaName: { fontSize: 16, fontWeight: '800', color: colors.text },
  areaDesc: { fontSize: 12, color: colors.sub },
  donePill: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  scenarioNote: { fontSize: 13, color: colors.sub },
  startBtn: { borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
