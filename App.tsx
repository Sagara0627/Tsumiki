import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider, registerNotificationBridge, useApp } from './src/store/AppContext';
import {
  configureNotificationHandler,
  requestPermission,
  sendCelebration,
  syncReminders,
} from './src/notifications/notifications';
import CharacterImageFactory from './src/characters/CharacterImageFactory';
import CelebrationModal from './src/components/CelebrationModal';
import { SimProvider } from './src/components/SimRunner';
import { CalendarIcon, HomeIcon, MicIcon, SettingsIcon, TasksIcon } from './src/components/icons';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { registerVoiceBridge } from './src/voice';
import { createExpoVoice } from './src/voice/expoVoice';
import { getSoundBridge, registerSoundBridge } from './src/sound';
import { createExpoSound } from './src/sound/expoSound';
import { colors, font, shadow } from './src/theme';

// store 層 → 通知層の橋渡し(モジュール読み込み時に一度だけ)
configureNotificationHandler();
registerNotificationBridge({
  sync: (state) => void syncReminders(state),
  celebrate: (state, c) => void sendCelebration(state, c),
});
// UI 層 → 音声層の橋渡し(TTS/STT 実装を注入)
registerVoiceBridge(createExpoVoice());
// UI/store 層 → サウンド層の橋渡し(効果音・BGM 実装を注入)
registerSoundBridge(createExpoSound());

const Tab = createBottomTabNavigator();

type IconComponent = typeof HomeIcon;

function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: IconComponent;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapOn]}>
      <Icon color={color} focused={focused} />
    </View>
  );
}

function Root() {
  const { ready, state } = useApp();

  // 初回起動時に通知権限をリクエスト(以後はOS側の記憶に任せる)
  useEffect(() => {
    if (!ready) return;
    void requestPermission().then((ok) => {
      if (ok) void syncReminders(state);
    });
    // 起動時に一度だけ実行したいので state は依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // サウンド設定をブリッジへ反映(BGM の再生/停止もここで切り替わる)
  const { sfx, bgm } = state.settings.sound;
  useEffect(() => {
    if (!ready) return;
    getSoundBridge().applySettings({ sfx, bgm });
  }, [ready, sfx, bgm]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingBlocks}>
          <View style={[styles.loadingBlock, { backgroundColor: '#7BC96F' }]} />
          <View style={[styles.loadingBlock, { backgroundColor: colors.primary }]} />
          <View style={[styles.loadingBlock, { backgroundColor: colors.freeze }]} />
        </View>
        <Text style={styles.loadingText}>つみあげ中…</Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.sub,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopWidth: 0,
              ...shadow.float,
            },
          }}
        >
          <Tab.Screen
            name="ホーム"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon Icon={HomeIcon} color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="タスク"
            component={TasksScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon Icon={TasksIcon} color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="れんしゅう"
            component={PracticeScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon Icon={MicIcon} color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="きろく"
            component={RecordsScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon Icon={CalendarIcon} color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="せってい"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon Icon={SettingsIcon} color={color} focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      {/* リッチ通知用の表情PNGをオフスクリーン生成(生成済みなら何もしない) */}
      <CharacterImageFactory characterId={state.settings.characterId} />
      <CelebrationModal />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <SimProvider>
          <Root />
        </SimProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tabIconWrapOn: { backgroundColor: colors.primarySoft },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingBlocks: { flexDirection: 'row', gap: 6 },
  loadingBlock: { width: 16, height: 16, borderRadius: 5 },
  loadingText: { fontSize: 15, color: colors.sub, fontFamily: font.rounded },
});
