# はじまりの市 — 開発メモ(Claude Code 向け)

何もない古代の土地から、プレイヤーと村人の分業・交換の中で「お金」が自然に生まれていく、ブラウザで遊ぶ経済シミュレーション。
今は **1人用のプロトタイプ**(プレイヤー1人 + AIの村人8〜16人)。最終目標は、複数のプレイヤーが同じ世界で遊ぶオンライン版。

設計の考え方と数値の一覧は `docs/DESIGN.md` にある。仕組みや数値を変えたら DESIGN.md も更新すること。

## 動かし方

- ブラウザで遊ぶ: `index.html` を直接開くか、`npm start`(`npx serve` で http://localhost:5173)
- バランスを数値で確かめる: `npm run sim`(= `node tools/simulate.mjs 4 120`)
  - 引数: `node tools/simulate.mjs [村の数] [日数] [--seed-region=plain|river|coast|forest]`
  - プレイヤーも「おまかせ」で動かし、村ごとに人口・体力・畑・道具・お金の主役・物価を出す
  - **経済まわりを変えたら、必ず sim を回して前後を比べる**(1村120日でおよそ2秒)
- ビルド工程・依存パッケージはない。素の HTML / CSS / JavaScript。

## 公開(スマホで遊ぶ)

- GitHub Pages で公開している: https://kei-bg.github.io/hajimari-ichi/ (リポジトリ `Kei-bg/hajimari-ichi`、公開リポジトリ)。`main` に push すると `.github/workflows/pages.yml` が動き、1〜2分で公開版に反映される
- **変更がひと区切りついたら commit して push する**(スマホの公開版に反映するため)。経済まわりなら push 前に sim を回す
- 公開時に `index.html` の `?v=dev` がコミットIDに置き換わる(古い JS/CSS が残らないように)。`<script>`/`<link>` を足すときも `?v=dev` を付ける
- 公開するファイルは workflow の `cp` の行で決めている。トップに新しいファイルやフォルダを足したらそこにも足す
- スマホ幅(819px以下)では「日を終える」の帯が画面下に固定される。下端に何かを固定するときはこの帯と重ならないようにする
- 保存は端末ごとの localStorage。PC とスマホで進行は共有されない

## ファイル構成

```
index.html          画面の骨組み(パネルの入れ物だけ。中身は game.js が描く)
manifest.webmanifest, icons/  ホーム画面に追加したとき用
.github/workflows/pages.yml   GitHub Pages への公開
src/style.css       見た目。色はすべて :root のトークン、ダークモードは2ブロックで上書き
src/game.js         ゲームのすべて(定義・状態・シミュレーション・AI・描画・入力)
tools/simulate.mjs  ヘッドレス実行。node:vm で game.js を読み、DOM をスタブして回す
docs/DESIGN.md      ゲームデザインと数値の一覧
```

## コードの地図(src/game.js)

ファイル内の `/* ===== 見出し ===== */` で区切ってある。

| 区画 | 主な中身 |
|---|---|
| 定義 | `ITEMS`(品物)、`TER`/`REG`(地形・土地)、`GATHER`(採集)、`RECIPES`(加工)、`FAC`(施設)、`EVENTS`/`OMENS`/`RARE_DROP`/`HAZ` |
| 世界 | `makePlot`(6×4の土地生成)、`newAgent`、`freshWorld` |
| 所持品・土地 | `cnt`/`add`/`take`、`useTool`(道具1個ごとの耐久 `a.durs[t]` 配列)、`hasFac`、`watered` |
| 道具の組み立て | `HEAD`/`SHAPES`/`HANDLES`/`BINDS`、`designCalc`(性能の式)、`registerDesign`/`learnDesign`、`bestPower`、`craftDesign` |
| 仕事 | `gatherInfo`/`doGather`(運の振れ・珍品)、`doField`、`doCraft`(加工)、`doBuild` |
| 村人の考え方 | `toolUseJobs`/`toolUse`(道具の価値)、`facValue`、`computeWant`(欲しい物)、`agentVal`(主観価値)、`chooseAction`(効用最大の行動)、`aiInvent`/`aiLearn` |
| 交換 | `deficit`/`surplus`、`exchange`、`tryTrade`(物々交換→仲立ち品の順) |
| 1日の終わり | `endDay`(1日の進行の全手順)、`consume`/`decay`、`updatePrices`、`updateMoney`、`people`、`events`、`genOffers` |
| プレイヤーの操作 | `chooseRegion`、`acceptOffer`、`propose`、`teachOffer`/`doTeach`、`unlockHold`(素材を持つと加工を思いつく)、`act`(操作の共通ラッパー) |
| 遠出 | `startExp`/`stepExp`/`finishExp`、`expOutcome`、`expRisk` |
| 今日の出来事 | `maybeCard`、`makeCard`、`resolveCard` |
| 演出 | `toast` 系 |
| 描画 | `render` と各パネルの `renderXxx`。毎回 innerHTML で全描画 |
| 進行・保存 | おまかせ、localStorage(キー `hajimari-ichi-v4`)、クリック処理(イベント委譲、`data-*` 属性で分岐)、`start` |

## 状態 `S` の形(localStorage にそのまま JSON で保存)

- `S.day`、`S.agents[]`(先頭がプレイヤー `isPlayer:true`、`name:'あなた'`)
- エージェント: `inv`(品物→量)、`durs`(道具→耐久の配列。`inv[t]` と長さが常に一致)、`known`(加工レシピIDと道具の型キー)、`plot`(24マス `{t:地形, f:施設|null}`)、`health`、`labor`(1日4)、`want`、`charm`
- `S.prices`(穀物=1が基準)、`S.money`(品物ごとの「お金としての通用度」0〜1)
- `S.designs`(村で誰かが作った道具の型 → `{by, day}`)。**型は実行時に `ITEMS` へ登録される**ので、読み込み時に `defineDesign` し直している(`start` 参照)
- `S.card`(今日の出来事)、`S.found`(珍品帳)、`S.ui`(画面の一時状態: 選択マス、組み立て台 `wb`、遠出 `exp` など)

## 守ってほしい決まり

- **道具の型キー**は `形.素材.柄.結び`(例 `point.stone.long.fiber`)。`dkey()` で作る。柄なしなら結びは常に `none`
- 道具を増減するときは必ず `add`/`take`/`useTool` を通す(耐久配列がずれる)。sim はずれを検出して `!!` を出す
- 新しい品物を足したら: `ITEMS` に定義 → 必要なら `GATHER`/`RECIPES`/`RARE_DROP` → 描画は自動で拾われる
- 文言は日本語。プレイヤー視点の言葉を使う(内部用語を画面に出さない)
- 色は `style.css` の `:root` トークン経由。ライト/ダーク両方で見え方を確認する
- 保存形式を壊す変更をしたら `KEY` のバージョンを上げる(古い保存は読まずに新しく始める)

## いまわかっている課題

- 珍品(金・翡翠・真珠)の値段が上限(基準値×8)に張り付きやすい。お金としての需要の式(`computeWant` 末尾)と上限の見直しが要る
- 村人は安い「差し込み」(結ばない)道具を選びがち。`aiInvent` の評価が耐久を14回で頭打ちにしているのが一因
- 銅・隕鉄の道具はあまり広まらない。窯→炭→製錬の流れを村人が回し切れていない
- 描画は毎回全再構築。パネルが増えたら差分描画か、軽いUIライブラリの導入を検討
- game.js が1ファイル約900行。次に大きく手を入れるときは「シミュレーション(DOMなし)」と「画面」の分割を先にやる(オンライン化の準備にもなる)

## 次の候補(話し合い済み)

1. 季節(冬は採集できず、蓄えが要る)
2. 労働力を増やす手段(家族・弟子)
3. 村で共有する施設(共同の倉・水路)と、その負担の分け方
4. オンライン化(下記)

## オンライン版の方針(合意済みの骨子)

- **サーバー権威型**: 経済の計算はすべてサーバー。クライアントは表示と入力だけ
- フロント: TypeScript + React か Svelte、マップは PixiJS か Phaser
- サーバー: Node.js + TypeScript(クライアントと型を共有)。1日の進行(tick)は専用ワーカー
- DB: PostgreSQL。取引は必ずトランザクション(増殖・二重売買の防止)。Redis でキャッシュ・板・配信
- 通信: WebSocket(Colyseus が候補)
- 運営用の経済ダッシュボード(通貨量・物価・ジニ係数)を早めに作る
- 進め方: まず game.js のシミュレーション部分を純粋関数のモジュールに切り出し、sim とブラウザの両方から使う形にする
- 注意: 有料でランダムな抽選を売る場合、日本では景品表示法の規制がある(コンプガチャは禁止)
