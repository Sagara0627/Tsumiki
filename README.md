# Tsumiki 🌱

損失回避(「ストリークが途切れるともったいない」)を核にした、キャラクター主導のキャリア習慣化アプリ。
個人利用・iOS メイン・端末内完結(サーバ同期なし)。Expo SDK 57 / React Native 製。

設計の全体像は [docs/design.md](docs/design.md)、キャラクターの仕様は [docs/character-spec.md](docs/character-spec.md) を参照。

## 特徴

- **キャラクターが感情で反応**: 完了すると誇らしげに、夜まで未完了だと涙目に(7表情)。
  常時アニメーション(呼吸・そわそわ・ぴょんぴょん)し、タスク完了でジャンプ+積み木の紙吹雪
- **触って楽しいUI**: 押すと沈むボタン、+XPフロート、進捗ブロックが埋まる瞬間の弾み
  (OSの「視差効果を減らす」設定時は静的表示)
- **ストリーク+フリーズ**: 1日1タスクで継続。7日ごとに❄️フリーズを獲得し、うっかり忘れを自動救済
- **デイリーミッション**: 完了数が少ないスキル領域を優先して毎日自動選出
- **キャリアプランのロードマップ**: 目標と重点領域を設定すると、3ステップ(きほん→じっせん→はってん)の段階的なおすすめタスクをリコメンド。完了を重ねると次ステップが解放。自動追加モードなら1日1件までタスクに自動追加
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
  (Expo Go はローカル通知の一部機能に制限あり。開発サーバ起動中のみ動作)
- **日常使い**(通知・アイコン含めフル機能、Mac なしで単体動作): 無料 Apple ID で Release ビルドを実機にインストール

iPhone を USB 接続してから:

```bash
npm run ios:device
```

初回のみの設定:

1. Xcode → Settings → Accounts に Apple ID を追加(無料アカウントで可)
2. iPhone を USB で Mac に接続し「このコンピュータを信頼」
3. Xcode で `ios/tsumiki.xcworkspace` を開き、TARGETS → tsumiki → Signing & Capabilities で
   「Automatically manage signing」にチェックし、Team に自分の Personal Team を選ぶ
4. iPhone の 設定 → プライバシーとセキュリティ → デベロッパモード をオンにして再起動
5. 初回インストール後、設定 → 一般 → VPN とデバイス管理 → 自分の Apple ID を「信頼」

運用上の注意:

- 無料 Apple ID の署名は **7日で失効**する。週1回 iPhone を繋いで `npm run ios:device` で入れ直せばよい
- データは AsyncStorage 保存のため、上書きインストールや署名失効では**消えない**(再署名すれば復活)
- Bundle ID は `com.yuyasagara.tsumiki`([app.json](app.json))。無料署名では一意な ID が必要なため既定値から変更済み
- **`expo run:ios --device` は使わない**。`COCOAPODS_PARALLEL_CODE_SIGN=true` が渡るため 8 個の
  フレームワークの署名が並列実行され、キーチェーンの競合で大半が `errSecInternalComponent` で失敗する。
  バックグラウンドジョブなので失敗が握り潰され、ビルドは成功扱いのまま未署名のフレームワークが同梱され、
  実機インストール時に `ApplicationVerificationFailed` になる。
  [scripts/ios-device.sh](scripts/ios-device.sh) はこのフラグなしで xcodebuild を直接呼ぶので順次署名になり成功する
- Push 通知の entitlement は [plugins/withoutPushEntitlement.js](plugins/withoutPushEntitlement.js) で除去している。
  expo-notifications が自動で `aps-environment` を付与するが、無料アカウントは Push Notifications capability を
  取得できずプロビジョニングに失敗するため。ローカル通知のみの利用なので実害はない

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
  components/     お祝いモーダル・タスク編集モーダル・共通UI・アニメーション部品
docs/             設計書・キャラ仕様書(イラスト発注可能レベル)
scripts/          アプリアイコン書き出し(sharp)
```

## 開発メモ

- 型検証: `npx tsc --noEmit`
- ストリークは logs+frozenDates から毎回導出(チェック取り消しでも壊れない)。
  起動/フォアグラウンド復帰時に `reconcile()` が空白日を精算し、フリーズで守れなければ途切れ確定
- データは AsyncStorage 単一キー `tsumiki:state:v1`。機種変更は せってい → エクスポート/インポート
- 本番イラストへの差し替えは、通知用PNGを `Documents/character-images/{キャラ}-{表情}.png` に置き換えるだけ
