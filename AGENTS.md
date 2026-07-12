# Tsumiki

損失回避(「ストリークが途切れるともったいない」)を核にしたキャラクター主導のキャリア習慣化アプリ。
個人利用・iOS メイン・端末内完結(サーバ同期なし)。Expo SDK 57 / React Native 0.86 / TypeScript strict。

## Expo SDK 57 の注意

Expo は大きく変わっている。Expo の API を使うコードを書く前に、必ずバージョン固定ドキュメント
https://docs.expo.dev/versions/v57.0.0/ を確認する(学習時の知識だけで書かない)。

## コマンド

- 型検証: `npx tsc --noEmit` — **唯一の検証ゲート**(テスト・リンタは導入していない)。コード変更後は必ず通すこと
- 開発サーバ: `npx expo start`(Expo Go はローカル通知の一部機能に制限あり)
- iOS 実機フルビルド: `npx expo run:ios --device`(通知・アイコン含むフル機能の確認はこちら)
- アプリアイコン書き出し: `npm run icon <mame|homura|tsumi>`(sharp で SVG→PNG)

## アーキテクチャ

store 層は純関数、状態を持つのは `src/store/AppContext.tsx` のみ、という構成が全体を貫く原則。

- **`src/store/`**: `AppState` を受け取り新しい `AppState` を返す純関数群
  - ストリークは保存値ではなく **logs + frozenDates から毎回導出**(`streak.ts`)。チェック取り消しでも壊れない設計なので、ストリークをどこかに保存するような変更はしない
  - 日次精算は `settleDay = ensureMissions ∘ autoAddFromRoadmap ∘ reconcile`(`AppContext.tsx`)。起動・フォアグラウンド復帰・日付跨ぎで呼ばれ、**冪等**であることが前提
  - 永続化は AsyncStorage 単一キー `tsumiki:state:v1`(`storage.ts`)。保存と通知同期は AppContext 側で debounce
- **NotificationBridge**(`AppContext.tsx`): store 層は expo-notifications に依存しない。App.tsx が起動時に `registerNotificationBridge()` で通知実装を注入する。この依存方向を崩さないこと
- **`src/notifications/`**: 繰り返しトリガーではなく「**今後7日ぶんを都度スケジュール**」方式。状態変化ごとに全キャンセル→再登録(7日×通知時刻数を iOS 上限64件以内に収める前提)。通知用キャラ表情 PNG は初回起動時に react-native-view-shot でオフスクリーン生成し documentDirectory にキャッシュ
- **`src/characters/`**: 3キャラ(mame/homura/tsumi)は `CharacterDefinition` 1インターフェースに統一(SVG 7表情+セリフ+通知文言+テーマ色)。デフォルトキャラの切替は `index.ts` の `DEFAULT_CHARACTER_ID` 1か所。表情の出し分けロジックはキャラ側ではなく `store/mood.ts`(優先度順の判定)にある

データモデル・コアロジックの詳細は docs/design.md、キャラのビジュアル仕様は docs/character-spec.md を参照。

## 規約・落とし穴

- UI 文言・コード内コメント・コミットメッセージは日本語
- 日付キーは**ローカルタイムゾーン**の `YYYY-MM-DD`。必ず `src/utils/date.ts` の `todayKey`/`dateKey` を使う(`toISOString()` は UTC なので日付がずれる)
- React Native の `AppState`(アプリ状態)とデータモデルの `AppState` が名前衝突する。RN 側は `RNAppState` の別名で import する
- 機能を追加・変更したら docs/design.md の該当箇所(特に「実装状況」)と README を更新する
