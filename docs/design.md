# Tsumiki 設計書(キャリア習慣化アプリ / Expo)

損失回避(ストリークが途切れるともったいない)を核にした、キャラクター主導の習慣化アプリ。
個人利用・iOS メイン・端末内完結(サーバ同期なし)。

## 1. キャラクター(3案・最終決定は保留)

詳細なビジュアル仕様・表情差分・セリフは [character-spec.md](./character-spec.md) を参照。

| 案 | 名前 | コンセプト | 損失回避メタファー |
|---|---|---|---|
| A | **マメ**(芽吹きの妖精) | タスク=水やり、ストリーク=育った日数 | サボると葉がしおれ、枯れそうになる |
| B | **ホムラ**(継続の炎の精) | タスク=薪くべ、ストリーク=炎の大きさ | サボると炎が小さくなり消えそうになる |
| C | **ツミ**(つみきの守り人)※第3案 | タスク=1段積む、ストリーク=塔の高さ | サボると塔が傾き、崩れる(アプリ名と統一) |

- 差し替えは **`src/characters/index.ts` の `DEFAULT_CHARACTER_ID` 1か所**(+設定画面でも切替可能にする設計)
- 各キャラは `CharacterDefinition` 1インターフェースに統一:
  SVG(7表情)/ セリフ辞書 / 通知文言 / テーマ色 / ストリーク絵文字 / アクション呼称(水やり等)
- 感情7種: `cheer`(朝・応援) `proud`(完了・誇らしい) `worried`(昼未完了・そわそわ)
  `tearful`(夜未完了・涙目) `sad`(途切れ・しょんぼり) `relieved`(復帰・泣き笑い) `celebrate`(祝い)

## 2. 画面構成

ボトムタブ4画面+モーダル2種:

```
[ホーム]     キャラ(表情+吹き出し+常時アニメーション)/ 🔥ストリーク大表示 / ❄️フリーズ所持数
             今日のミッション(デイリーゴール進捗と一体のチェックリスト)
             夜未完了時: 「あと n時間」+「1タスクで◯日の記録を守れる」赤バナー(脈打つ)
[タスク]     「つぎの一歩」(キャリアプランのおすすめ: 追加/見送る+次ステップ解放ヒント)
             5領域別のタスク一覧 / 追加・編集・アーカイブ(モーダル)
[きろく]     月カレンダー(達成=緑・フリーズ=青・未達=赤)/ 領域別バー / バッジ一覧 / 累計サマリ
[せってい]   通知時刻の追加・変更(デフォルト 8:00/12:00/19:00/21:00)/ 権限案内
             デイリーゴール / キャリアプラン(目標・重点領域・自動追加)/ キャラ切替
             JSONエクスポート・インポート / リセット

[お祝いモーダル]  レベルアップ・バッジ・マイルストーン時に celebrate 表情で表示
[タスク編集モーダル] タイトル / 領域 / XP
```

## 3. データモデル(`src/store/types.ts` 実装済み)

```ts
AppState {
  version: 1
  createdAt: string            // 利用開始日(カレンダーの未達表示起点)
  tasks: Task[]                // { id, areaId, title, xp, archived, createdAt }
  logs: CompletionLog[]        // { id, taskId, areaId, title, xp, dateKey, completedAt }
  freezes: number              // ストリークフリーズ所持数(初期1、7日毎+1、最大2)
  frozenDates: string[]        // フリーズで守られた日
  longest: number              // 最長ストリーク
  lastBreakDate: string | null // 直近の途切れ日(sad/relieved 判定に使用)
  xp: number
  badges: Badge[]
  missions: { dateKey, taskIds }  // 今日のデイリーミッション
  career: CareerPlan | null       // { goal, focusAreas[], autoAdd, dismissed[], lastAutoAddDate }
  settings: { dailyGoal, reminderTimes[], characterId }
}
```

- `Task.templateId?` はロードマップ由来タスクの元テンプレートID(重複リコメンド防止)

- 領域は5固定: `tech / hearing / drive / negotiation / output`(色・絵文字付き、`seed.ts`)
- 永続化: AsyncStorage 単一キー `tsumiki:state:v1`。
  エクスポートは `{ app:'tsumiki', exportedAt, state }` の JSON(インポートは normalize で欠損補完)

## 4. コアロジック(実装済み)

### ストリーク計算(`src/store/streak.ts`)
- **ストリークは logs + frozenDates から毎回導出**(チェック取り消しにも壊れない)
- 1日1タスク以上の完了でその日はセーフ。今日未完了でも「まだ途切れていない」扱い(今日中は猶予)
- カウントは完了日のみ(フリーズ日は継続を繋ぐが日数に含めない = Duolingo方式)
- `reconcile()`: 起動/フォアグラウンド時に空白日を検査。
  フリーズで全てカバーできれば自動消費して継続、無理なら `lastBreakDate` を記録して途切れ確定。冪等
- フリーズ: 初期1個、ストリーク7の倍数日で+1(最大2)
- マイルストーン: 3/7/14/21/30/50/60/100/150/200/365日

### 感情の出し分け(`src/store/mood.ts`)
優先度順: 復帰当日(relieved) > 今日完了(proud) > 途切れ直後2日(sad)
> 19時以降未完了(ストリークあり=tearful / なし=worried) > 12時以降未完了(worried) > 朝(cheer)。
`celebrate` はモーダル/通知イベント時のみの一時表情。

### XP・レベル・バッジ(`src/store/xp.ts`)
- レベルn→n+1 に必要XP = `80 + (n-1)*40`(序盤は軽く)
- バッジ17種: 継続(3〜100日)/累計(10〜300)/全領域制覇/バランス型/ゴール7日/レベル到達

### 通知(`src/notifications/` 実装済み)
- expo-notifications ローカル通知。**繰り返しトリガーではなく「今後7日ぶんを都度スケジュール」方式**
  (今日完了済みなら今日の残り通知をスキップできる=Duolingo的な出し分けの要)
- 再スケジュール契機: 起動時 / タスク完了時 / 設定変更時(全キャンセル→再登録。7日×4回=28件 < iOS上限64)
- 時刻帯スロット: `<11時=morning(cheer)` `<17時=noon(worried)` `<21時=evening(tearful)` `以降=lastCall(tearful)`
- 文言はキャラ辞書から日付ハッシュで安定抽選。`{streak}` は当日分のみ実数に置換
  (翌日以降分は「連続」等の汎用語に置換して数字のズレを防ぐ)
- 夜(evening/lastCall)でストリークありなら title を
  `⚠️ ◯日の記録が途切れそう` / `🚨 ◯日が消える寸前!` に強化
- **リッチ通知**: `content.attachments`(iOS)にキャラ表情PNGを添付。
  PNGは初回起動時に react-native-view-shot で SVG→PNG(512px)をオフスクリーン生成し
  documentDirectory にキャッシュ(`characterImages.ts`)。本番イラスト差し替え時は同パスに置くだけ
- 称賛: ストリーク更新・レベルアップ時に即時通知(celebrate表情添付)
- 権限: 初回起動時にリクエスト。拒否時は設定画面に案内+`Linking.openSettings()`

### アニメーション(`src/components/animations.tsx` / `src/characters/AnimatedCharacter.tsx`)
- 部品集(すべて transform/opacity のみ・useNativeDriver、「視差効果を減らす」設定時は静的表示):
  `Bouncy`(押下バウンス)/ `PopIn`(出現ポップ)/ `PopOnChange`(値変化でむくっ)/
  `Pulse`(脈動)/ `FloatUp`(+XPフロート)/ `ConfettiBurst`(積み木ブロックの紙吹雪)
- `AnimatedCharacter`: 感情別の待機モーション
  (通常=呼吸 / worried・tearful=そわそわ左右揺れ / sad=沈んだ深呼吸 / celebrate=ぴょんぴょん)
  +`bounceKey` の変化でしゃがみ→ジャンプ→着地。
  通知画像のスナップショット(CharacterImageFactory)は静的な `CharacterView` を直接使う
- ホーム: タスク完了ごとに紙吹雪+キャラジャンプ(ゴール達成の瞬間は増量)、
  ストリーク数字ポップ、週ストリップの時差ポップイン、BlockProgress の埋まった瞬間の弾み
- お祝いモーダル: celebrate 待機モーション+紙吹雪

### デイリーミッション生成
- 日付が変わって最初の起動時に、**完了数が少ない領域を優先**して各領域から
  最も実施回数の少ないタスクをラウンドロビンで `dailyGoal` 件選出

### キャリアプランとロードマップ(`src/store/roadmap.ts`)
- せっていで **目標(自由記述)+重点領域+自動追加ON/OFF** を設定すると有効化
- 領域×3ステップ(きほん/じっせん/はってん)のタスクテンプレート30件を内蔵。
  その領域の累計完了数でステップ解放(ステップ2=12回、ステップ3=30回)= **段階的に負荷を上げる**
- リコメンド優先度: 重点領域 → 低いステップ → 完了数が少ない領域。
  採用済み(`templateId` が既存タスクにある)と見送り済み(`career.dismissed`)は除外
- タスク画面「つぎの一歩」に最大3件表示(追加/見送る)。次ステップの解放条件もヒント表示
- 自動追加ON: `settleDay`(起動/フォアグラウンド/日付跨ぎの精算)で **1日1件まで**
  最優先のおすすめをタスクに自動追加(`lastAutoAddDate` で冪等)

## 5. 実装状況(ここまで完了)

```
✅ docs/character-spec.md      キャラ3案の完全仕様(発注可能レベル)
✅ src/utils/date.ts, id.ts    日付キー・ハッシュ
✅ src/store/types.ts          全モデル定義
✅ src/store/seed.ts           5領域+サンプルタスク12件+初期状態
                               (タスクは career-roadmap.md の具体アクション粒度)
✅ src/store/streak.ts         ストリーク導出・reconcile・フリーズ
✅ src/store/xp.ts             レベル・バッジ17種
✅ src/store/mood.ts           感情出し分け・通知スロット
✅ src/store/storage.ts        永続化・エクスポート/インポート
✅ src/characters/             types / mame / homura / tsumi(SVG7表情+セリフ+通知文言)
✅ src/characters/index.ts     差し替え1か所(DEFAULT_CHARACTER_ID)
✅ src/characters/CharacterView.tsx
✅ 依存インストール済み(Expo SDK 57, notifications/svg/view-shot/navigation ほか)
✅ src/store/missions.ts        デイリーミッション生成(手薄な領域優先のラウンドロビン)
✅ src/store/roadmap.ts         キャリアプラン用ロードマップ(テンプレ30件・リコメンド・自動追加)
✅ src/store/AppContext.tsx     Provider(stateRef方式・お祝いキュー・debounce保存/通知同期・
                                フォアグラウンドreconcile・30秒tick・NotificationBridge注入)
✅ src/characters/CharacterImageFactory.tsx  7表情をオフスクリーンでPNG化
✅ src/notifications/           notifications.ts(7日分スケジュール・称賛通知・権限)+
                                characterImages.ts(PNGキャッシュ・添付用コピー)
✅ src/screens/                 ホーム/タスク/きろく/せってい
✅ src/components/              CelebrationModal / TaskEditModal / 共通UI /
                                animations.tsx(紙吹雪・XPフロート・バウンス等の部品集)
✅ src/characters/AnimatedCharacter.tsx  感情別待機モーション+完了ジャンプ
✅ App.tsx                      タブ4画面+ブリッジ接続+起動時権限リクエスト
✅ assets/character/icon-*.svg + scripts/make-icon.mjs(npm run icon <キャラ名>)
✅ README.md / npx tsc --noEmit 通過
```

## 6. 残タスク

初期実装はすべて完了。実機(`npx expo run:ios --device`)での動作確認と、
使ってみた上での調整(通知文言・XPバランス等)が次のステップ。

## 7. 拡張アイデア(実装後の候補)

- iOS ウィジェット(ストリーク+キャラ表情常時表示)/ ライブアクティビティで夜のカウントダウン
- 本番イラスト差し替え(character-spec.md をそのまま発注仕様書に)
- ストリーク段階でキャラが成長(マメ:双葉→本葉→花 / ホムラ:金色・青白い炎)
- AI連携: その日の完了ログから「体験→活用→共有」の次アクション提案、週次ふりかえり生成
- Zenn/Qiita RSS 連携で「発信」タスクの自動チェック
