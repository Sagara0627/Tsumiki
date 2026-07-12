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
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

// store 層 → 通知層の橋渡し(モジュール読み込み時に一度だけ)
configureNotificationHandler();
registerNotificationBridge({
  sync: (state) => void syncReminders(state),
  celebrate: (state, c) => void sendCelebration(state, c),
});

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={[styles.tabIcon, !focused && styles.tabIconOff]}>{emoji}</Text>;
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

  if (!ready) {
    return (
      <View style={styles.loading}>
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
            tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          }}
        >
          <Tab.Screen
            name="ホーム"
            component={HomeScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
          />
          <Tab.Screen
            name="タスク"
            component={TasksScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✅" focused={focused} /> }}
          />
          <Tab.Screen
            name="きろく"
            component={RecordsScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} /> }}
          />
          <Tab.Screen
            name="せってい"
            component={SettingsScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }}
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
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 22 },
  tabIconOff: { opacity: 0.45 },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { fontSize: 15, color: colors.sub },
});
