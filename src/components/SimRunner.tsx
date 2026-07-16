import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '../store/AppContext';
import { getCharacter } from '../characters';
import AnimatedCharacter from '../characters/AnimatedCharacter';
import { AreaId, Emotion } from '../store/types';
import { areaOf } from '../store/seed';
import {
  SimScenario,
  SimTurn,
  evaluateTurn,
  scenariosForArea,
} from '../sims';
import { getVoiceBridge } from '../voice';
import { colors, font, radius, shadow } from '../theme';

/**
 * 音声ロールプレイの実行 UI。openSim(areaId) でその領域の台本を開く。
 * キャラが TTS で話す → ユーザーが声(STT)またはテキストで返す → キーワード判定で
 * フィードバック → 次のターン。完走で sim-<area> タスクを完了扱いにする(ストリーク駆動)。
 */

interface SimApi {
  openSim(areaId: AreaId): void;
}
const SimContext = createContext<SimApi>({ openSim: () => {} });
export function useSim(): SimApi {
  return useContext(SimContext);
}

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [areaId, setAreaId] = useState<AreaId | null>(null);
  return (
    <SimContext.Provider value={{ openSim: setAreaId }}>
      {children}
      <SimModal areaId={areaId} onClose={() => setAreaId(null)} />
    </SimContext.Provider>
  );
}

type Phase = 'pick' | 'intro' | 'turn' | 'feedback' | 'done';
type ListenState = 'idle' | 'listening' | 'thinking';

function SimModal({ areaId, onClose }: { areaId: AreaId | null; onClose: () => void }) {
  const { state, completeTask } = useApp();
  const char = getCharacter(state.settings.characterId);
  const voice = getVoiceBridge();

  const [scenario, setScenario] = useState<SimScenario | null>(null);
  const [phase, setPhase] = useState<Phase>('pick');
  const [turnIndex, setTurnIndex] = useState(0);
  const [emotion, setEmotion] = useState<Emotion>('cheer');
  const [bubble, setBubble] = useState('');
  const [feedback, setFeedback] = useState('');
  const [lastGood, setLastGood] = useState(false);
  const [goodCount, setGoodCount] = useState(0);
  const [input, setInput] = useState('');
  const [listenState, setListenState] = useState<ListenState>('idle');
  const [useText, setUseText] = useState(!voice.sttAvailable);
  const [micError, setMicError] = useState('');

  const scenarios = areaId ? scenariosForArea(areaId) : [];
  const turn: SimTurn | undefined = scenario?.turns[turnIndex];

  // 開くたびに初期化。単一シナリオの領域はチェックを飛ばして即開始画面へ
  useEffect(() => {
    if (areaId == null) return;
    const list = scenariosForArea(areaId);
    setScenario(list.length === 1 ? list[0] : null);
    setPhase(list.length === 1 ? 'intro' : 'pick');
    setTurnIndex(0);
    setGoodCount(0);
    setEmotion('cheer');
    setBubble('');
    setFeedback('');
    setInput('');
    setListenState('idle');
    setUseText(!voice.sttAvailable);
    setMicError('');
  }, [areaId, voice.sttAvailable]);

  // 閉じるときは読み上げ・聞き取りを止める
  const close = useCallback(() => {
    voice.stopSpeaking();
    voice.cancelListening();
    onClose();
  }, [voice, onClose]);

  const startScenario = useCallback(
    (s: SimScenario) => {
      setScenario(s);
      setTurnIndex(0);
      setGoodCount(0);
      setPhase('turn');
      const first = s.turns[0];
      setEmotion('cheer');
      setBubble(first.say ?? '');
      setInput('');
      setFeedback('');
      if (first.say) void voice.speak(first.say);
    },
    [voice]
  );

  const submitAnswer = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || !turn || !scenario) return;
      const result = evaluateTurn(text, turn);
      const good = result.good;
      const reply = result.intent ? result.intent.reply : turn.onMiss;
      setLastGood(good);
      if (good) setGoodCount((c) => c + 1);
      setEmotion(good ? 'proud' : 'worried');
      setFeedback(reply);
      setBubble('');
      setInput('');
      setPhase('feedback');
      void voice.speak(reply);
    },
    [turn, scenario, voice]
  );

  const next = useCallback(() => {
    if (!scenario) return;
    const nextIndex = turnIndex + 1;
    if (nextIndex >= scenario.turns.length) {
      // 完走: その領域のロールプレイタスクを完了扱いに(冪等・1日1回まで加点)
      if (areaId) completeTask(`sim-${areaId}`);
      setEmotion('celebrate');
      setBubble('');
      setFeedback('');
      setPhase('done');
      void voice.speak(scenario.wrapUp);
      return;
    }
    const t = scenario.turns[nextIndex];
    setTurnIndex(nextIndex);
    setPhase('turn');
    setEmotion('cheer');
    setFeedback('');
    setBubble(t.say ?? '');
    if (t.say) void voice.speak(t.say);
  }, [scenario, turnIndex, areaId, completeTask, voice]);

  const startListening = useCallback(async () => {
    setMicError('');
    setInput('');
    setListenState('listening');
    try {
      const transcript = await voice.listen({ onPartial: setInput });
      setListenState('thinking');
      submitAnswer(transcript);
      setListenState('idle');
    } catch {
      setListenState('idle');
      setUseText(true);
      setMicError('音声が使えないみたい。キーボードで入力してね。');
    }
  }, [voice, submitAnswer]);

  const stopListening = useCallback(() => {
    voice.finishListening();
  }, [voice]);

  if (areaId == null) return null;

  return (
    <Modal transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.stage, { backgroundColor: char.bgColor }]}>
            <Pressable style={styles.closeBtn} onPress={close} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <AnimatedCharacter characterId={char.id} emotion={emotion} size={112} />
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {phase === 'pick' && (
              <>
                <Text style={styles.heading}>{areaOf(areaId).name}のロールプレイ</Text>
                <Text style={styles.sub}>やる台本を選んでね</Text>
                {scenarios.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.pickRow}
                    onPress={() => {
                      setScenario(s);
                      setPhase('intro');
                    }}
                  >
                    <Text style={styles.pickTitle}>{s.title}</Text>
                    <Text style={styles.pickArrow}>▶</Text>
                  </Pressable>
                ))}
              </>
            )}

            {phase === 'intro' && scenario && (
              <>
                <Text style={styles.heading}>{scenario.title}</Text>
                {scenario.partner ? (
                  <Text style={styles.partner}>相手:{scenario.partner}</Text>
                ) : (
                  <Text style={styles.partner}>ひとりで声に出す練習</Text>
                )}
                <Text style={styles.setup}>{scenario.setup}</Text>
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: char.themeColor }]}
                  onPress={() => startScenario(scenario)}
                >
                  <Text style={styles.primaryBtnText}>はじめる</Text>
                </Pressable>
              </>
            )}

            {phase === 'turn' && turn && (
              <>
                {bubble ? (
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleLabel}>{scenario?.partner || 'お題'}</Text>
                    <Text style={styles.bubbleText}>{bubble}</Text>
                  </View>
                ) : null}
                <Text style={styles.prompt}>{turn.prompt}</Text>

                {!useText ? (
                  <>
                    <Pressable
                      style={[
                        styles.micBtn,
                        {
                          backgroundColor:
                            listenState === 'listening' ? colors.danger : char.themeColor,
                        },
                      ]}
                      onPress={listenState === 'listening' ? stopListening : startListening}
                      disabled={listenState === 'thinking'}
                    >
                      <Text style={styles.micBtnText}>
                        {listenState === 'listening'
                          ? '● 聞き取り中… タップで確定'
                          : listenState === 'thinking'
                            ? '判定中…'
                            : '🎙️ 声で答える'}
                      </Text>
                    </Pressable>
                    {input ? <Text style={styles.liveText}>「{input}」</Text> : null}
                    <Pressable onPress={() => setUseText(true)}>
                      <Text style={styles.switchText}>キーボードで入力する</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <TextInput
                      style={styles.textInput}
                      value={input}
                      onChangeText={setInput}
                      placeholder="ここに答えを入力"
                      placeholderTextColor={colors.sub}
                      multiline
                    />
                    <Pressable
                      style={[styles.primaryBtn, { backgroundColor: char.themeColor }]}
                      onPress={() => submitAnswer(input)}
                    >
                      <Text style={styles.primaryBtnText}>送信</Text>
                    </Pressable>
                    {voice.sttAvailable ? (
                      <Pressable onPress={() => setUseText(false)}>
                        <Text style={styles.switchText}>声で答える</Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
                {micError ? <Text style={styles.micError}>{micError}</Text> : null}
              </>
            )}

            {phase === 'feedback' && (
              <>
                <View style={[styles.bubble, lastGood ? styles.bubbleGood : styles.bubbleMiss]}>
                  <Text style={styles.bubbleLabel}>{lastGood ? 'いいね!' : 'ヒント'}</Text>
                  <Text style={styles.bubbleText}>{feedback}</Text>
                </View>
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: char.themeColor }]}
                  onPress={next}
                >
                  <Text style={styles.primaryBtnText}>つぎへ</Text>
                </Pressable>
              </>
            )}

            {phase === 'done' && scenario && (
              <>
                <Text style={styles.heading}>おつかれさま!</Text>
                <Text style={styles.doneScore}>
                  {scenario.turns.length}問中 {goodCount}問がいい返し
                </Text>
                <Text style={styles.setup}>{scenario.wrapUp}</Text>
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: char.themeColor }]}
                  onPress={close}
                >
                  <Text style={styles.primaryBtnText}>とじる(完了)</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 20, 10, 0.5)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  stage: { alignItems: 'center', paddingVertical: 18 },
  closeBtn: { position: 'absolute', top: 12, right: 16, zIndex: 2 },
  closeText: { fontSize: 20, color: colors.text, opacity: 0.5 },
  body: { paddingHorizontal: 22 },
  bodyContent: { paddingVertical: 20, paddingBottom: 36, gap: 12 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.sub },
  partner: { fontSize: 13, fontWeight: '700', color: colors.sub },
  setup: { fontSize: 15, color: colors.text, lineHeight: 23, fontFamily: font.rounded },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.faint,
    borderRadius: radius.chip,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  pickTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  pickArrow: { fontSize: 13, color: colors.primary, marginLeft: 8 },
  bubble: {
    backgroundColor: colors.faint,
    borderRadius: radius.chip,
    padding: 14,
    gap: 4,
  },
  bubbleGood: { backgroundColor: colors.successSoft },
  bubbleMiss: { backgroundColor: colors.primarySoft },
  bubbleLabel: { fontSize: 11, fontWeight: '800', color: colors.sub },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 23, fontFamily: font.rounded },
  prompt: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 24 },
  micBtn: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.card,
  },
  micBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  liveText: { fontSize: 15, color: colors.text, textAlign: 'center', fontFamily: font.rounded },
  switchText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
    paddingVertical: 4,
  },
  micError: { fontSize: 13, color: colors.danger, textAlign: 'center' },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.chip,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primaryBtn: { borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  doneScore: { fontSize: 15, fontWeight: '700', color: colors.success },
});
