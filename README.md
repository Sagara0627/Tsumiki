# Tsumiki 🌱

損失回避(「ストリークが途切れるともったいない」)を核にした、キャラクター主導のキャリア習慣化アプリ。
個人利用・iOS メイン・端末内完結(サーバ同期なし)。Expo SDK 57 / React Native 製。

設計の全体像は [docs/design.md](docs/design.md)、キャラクターの仕様は [docs/character-spec.md](docs/character-spec.md) を参照。

## 特徴

- **キャラクターが感情で反応**: 完了すると誇らしげに、夜まで未完了だと涙目に(7表情)
- **ストリーク+フリーズ**: 1日1タスクで継続。7日ごとに❄️フリーズを獲得し、うっかり忘れを自動救済
- **デイリーミッション**: 完了数が少ないスキル領域を優先して毎日自動選出
- **Duolingo方式の通知**: 今後7日ぶんをローカル通知でスケジュールし、完了済みの日はスキップ。夜は「◯日の記録が途切れそう」と損失回避文言に強化。キャラ表情PNG付きリッチ通知(iOS)
- **5つのスキル領域**: 技術力 / ヒアリング / 推進力 / 調整交渉 / アウトプット
- **XP・レベル・バッジ17種**、月カレンダー、JSONエクスポート/インポート

## セットアップ

```bash
npm install
npx expo start
```

### iOS 実機で動かす

- **手軽**: `npx expo start` → iPhone の Expo Go でQRコードを読み取る
  (Expo Go はローカル通知の一部機能に制限あり)
- **確実**(通知・アイコン含めフル機能): 開発ビルドを実機にインストール

```bash
npx expo run:ios --device
```

## キャラクターの切り替え

- アプリ内: せってい → パートナー
- 初期キャラの変更: [src/characters/index.ts](src/characters/index.ts) の `DEFAULT_CHARACTER_ID` 1か所
- アプリアイコンの切り替え: `npm run icon homura` など(mame / homura / tsumi)

| キャラ | コンセプト | 損失回避メタファー |
|---|---|---|
| マメ 🌱 | タスク=水やり | サボると葉がしおれる |
| ホムラ 🔥 | タスク=薪くべ | サボると炎が消えそうになる |
| ツミ 🧱 | タスク=1段積む | サボると塔が崩れそうになる |

## プロジェクト構成

```
src/
  store/          状態管理(型・ストリーク・XP/バッジ・ミッション・永続化・Provider)
  characters/     キャラ定義(SVG 7表情+セリフ+通知文言)・PNG生成
  notifications/  ローカル通知のスケジュール・表情PNGキャッシュ
  screens/        ホーム / タスク / きろく / せってい
  components/     お祝いモーダル・タスク編集モーダル・共通UI
docs/             設計書・キャラ仕様書(イラスト発注可能レベル)
scripts/          アプリアイコン書き出し(sharp)
```

## 開発メモ

- 型検証: `npx tsc --noEmit`
- ストリークは logs+frozenDates から毎回導出(チェック取り消しでも壊れない)。
  起動/フォアグラウンド復帰時に `reconcile()` が空白日を精算し、フリーズで守れなければ途切れ確定
- データは AsyncStorage 単一キー `tsumiki:state:v1`。機種変更は せってい → エクスポート/インポート
- 本番イラストへの差し替えは、通知用PNGを `Documents/character-images/{キャラ}-{表情}.png` に置き換えるだけ
