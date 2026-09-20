# はむあつめ — プロジェクト引き継ぎメモ（CLAUDE.md）

このファイルは Claude Code セッション開始時に自動で読まれる。作業前に必ず目を通すこと。

## プロジェクト概要

- 「ねこあつめ」ライクな **ハムスター版の放置収集ゲーム**。名前は **はむあつめ**。
- ブラウザで動く静的サイト（ビルド不要、フレームワーク不使用、依存ゼロ）。`index.html` を開くだけで動く。
- えさとグッズを置く → 時間経過でハムスターが来訪 → 帰るときに「ひまわりの種」を残す → 図鑑を埋める。
- 対象ユーザーは日本語話者。UI 文言はひらがな多めのやわらかい日本語（ねこあつめ調）。
- GitHub: `riku1128-tong/hamuatsume`（main ブランチ）。作業後は必ずコミットして `origin main` へ push する。

## 決定済みの方針（変更しない）

1. **ハムスターは実在種を網羅**：ゴールデン（キンクマ・ブラック・長毛・ダルメシアン・シルバーグレー・三毛・クリーム）、ジャンガリアン（プディング・サファイア・パール・スノーホワイト・ブループディング）、ロボロフスキー（ホワイトフェイス・パイド・プラチナ）、キャンベル（ブラック・ブルー・アルビノ・アルジェンテ・モトルド）、チャイニーズ（スポット）、クロハラ、ブラント、ハイイロ。＋オリジナルの「レアはむ」6種（必要グッズあり）。
2. **図鑑名は元の種類がわかる名前**にする（例：「プディングジャンガリアン」「ホワイトフェイスロボ」）。愛称だけの名前（「プリン」など）は NG。ユーザーがつけるニックネームは別枠。
3. **イラストは「ひつじ村」風のドット絵**（2026-09-20 に SVG ベクター絵から変更。ユーザーの要望）：1px の暗い輪郭＋ベタ塗り＋影 1 段、点目。グラデ・アンチエイリアスなし。ハムスターは 20×20、グッズは 30×24、背景は 256×128（=1280×640 の 1/5）のピクセルグリッドで描き、`Px` クラスが色ごとの `<path>` にまとめてインライン SVG（`shape-rendering: crispEdges`）で出す。画像ファイルは使わない。
4. **ポーズは6種類**（おすわり front／あるく side／うしろすがた back／ねる sleep／たべる eat／ごろん belly）＋左右反転。グッズごとに使うポーズが決まる（`ITEMS[].pose`）。
5. 配色はクリーム＆ウッド系、フォントは Zen Maru Gothic（Google Fonts、未取得時は丸ゴシック系にフォールバック）。CSS 変数は `css/style.css` の `:root` にまとめてある。
6. セーブは `localStorage`（キー `hamuatsume.save.v1`）。サーバー不要のまま維持する。
7. 絵文字は UI に使わない（アイコンはインライン SVG）。

## ファイル構成

```
index.html        エントリ（script を順に読み込む：data → art → game → ui → main）
css/style.css     全スタイル
js/data.js        HamuData：FOODS / ITEMS / HAMSTERS / GROUPS / SLOTS / BOWL
js/art.js         HamuArt：Px（ピクセルキャンバス）、hamster(opts)、item(id) / bowl()、room()（おへや背景）、ICONS
js/game.js        HamuGame.Game：状態・tick シミュレーション・セーブ・購入/配置/えさ
js/ui.js          HamuUI.UI：5画面（おへや／はむ図鑑／ショップ／えさ／せってい）とモーダル・トースト
js/main.js        起動（window.hamu = { game, ui } をデバッグ用に公開）
design/*.dc.html  初期モックアップ（Claude Design 形式。参考資料、ゲームからは未使用）
```

グローバル変数方式（ES modules 不使用）なのは `file://` で直接開いても動かすため。この方針は維持する。

## ゲームロジックの要点（js/game.js）

- 1 tick = 1分（`TICK_MS`）。`setSpeed(1|10|60)` で倍速（設定画面のデバッグ用）。
- 起動時に経過 tick ぶんをまとめて進行（最大 24 時間）→ `offline` イベントで要約トースト。
- 毎 tick：えさ減少（`100/duration + 0.15×来訪数`）→ 退出判定（`leaveAt` 到達 or えさ切れで 35%）→ 空き席ごとに来訪判定（`0.07 × food.attract`、えさ皿席は ×0.6）。
- 来訪者の選抜 `chooseHamster`：`likes[item]`（未設定は 0.25）× レア度重み（1:1.0 / 2:0.45 / 3:0.16）× レア度3はえさの `rare` 倍率 × 好物一致で ×2.2。`requires` 付きはそのグッズ席にしか来ない。
- 退出時のおみやげ：`6〜16 × food.gift × レア度倍率(1/1.5/2.5) × 滞在ボーナス`、金の種は確率ドロップ。
- イベント：`change` / `arrive` / `leave` / `offline` / `reset` を `game.on(fn)` で購読。

## 動作確認の方法

- ブラウザで `index.html` を開く。せってい → 時間の速さ ×60 にすると数十秒で来訪する。
- `file://` だと Google Fonts 以外は問題なく動く。Claude の内蔵ブラウザで見るときは `python -m http.server <port> --bind 127.0.0.1` で配信する（8765 は別プロジェクトが使っていることがある）。
- おへやに手早く住人を置く（DevTools）: `const g=hamu.game,D=HamuData;['wheel','house'].forEach((id,i)=>{g.state.inventory[id]=1;g.placeItem('s'+(i+1),id)});g.freeSeats().slice(0,3).forEach((st,i)=>g.arrive(D.HAMSTERS[i],st,{arrivals:0,newHams:[]}));hamu.ui.render()`
- DevTools コンソールで `hamu.game.state` を確認、`hamu.game.tick()` で手動進行、`hamu.game.state.seeds = 9999; hamu.ui.render()` で通貨付与。
- Playwright が使える環境なら headless で `file://.../index.html` を開き `pageerror` が無いことを確認する（Google Fonts の取得失敗は無視してよい）。

## 現在の状態（v0.1、2026-09-20）

- 5画面すべて実装済み。ハムスター35種・グッズ16種・えさ6種。
- 2026-09-20: 絵をすべてドット絵（ひつじ村風）に描き直し。おへやは柵で囲った牧場（草地＋土の小道＋木・茂み・花）。
- スマホ対応：おへやは 1280×640 のステージを縮小表示（最小 0.55 倍で横スクロール）、モバイル用えさゲージあり。
- 既知の未実装／改善候補（優先順）：
  1. アニメーション（回し車が回る、歩く、ほお袋がふくらむ等。ドット絵なので 2〜3 フレームのスプライト切り替えが向く）
  2. 効果音・BGM（設定でオンオフ）
  3. レアはむの追加、季節イベント
  4. 図鑑のコンプリート報酬、実績
  5. GitHub Pages での公開（Settings → Pages → main / root）
  6. i18n（英語）

## 作業ルール

- 変更は小さくコミット。コミットメッセージは日本語でよい。
- `data.js` に種類を追加するときは `id` を一意に、`likes` に最低1つ好きなグッズを入れる。レアはむは `requires` と `accessory` を設定する。
- `art.js` のハムスターは文字列スプライト（`POSES`）。左右対称ポーズは左半分 10 列だけ書いて `M()` で鏡映する。文字の意味は `POSES` 直上のコメント参照（`S`/`P`/`R`/`F` は色未設定なら体色にフォールバック）。新ポーズは `POSES` と `HEAD`（head/brow/chin の座標）を、新アクセサリーは `ACC` を追加する。
- グッズは `ITEM_DRAW[id](p)` に `Px` の rect/ellipse/line/tri で描き、最後に `outline()` で輪郭を付ける（自前で輪郭を描かない）。背景の飾りは `room()` 内の tree/bush/flower ヘルパーで置く。座標はスロット（`SLOTS`）と重ならない場所に。
- 絵を直したら `design/sprites.html` を開いて全ポーズ・全種・全グッズ・背景を一覧で確認する（`?sec=poses|all|items|bowls|room`）。
- セーブ形式を変えるときは `newState()` と `load()` の後方互換（`Object.assign(newState(), s)`）を壊さない。
