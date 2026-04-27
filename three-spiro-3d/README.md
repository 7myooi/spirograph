# three-spiro-3d

Three.js で作った、ambient 向けの生成アートアプリです。  
スピログラフ系の軌跡を 3D 空間に描き出し、発光、宇宙背景、BGM、Focus モード、自動ドリフト、共有 URL までまとめて扱えます。

公開 URL:
<https://7myooi.github.io/spirograph/>

## 特徴

- 3 つの軌跡モード
  - `Spirograph`
  - `Lissajous`
  - `Lorenz`
- 先端発光
  - `head / glow / halo` を重ねた発光表現
  - Bloom 付き
- ambient テーマ
  - `Calm / Deep / Cosmic / Drift`
  - 背景、宇宙ストリーク、BGM の雰囲気がテーマごとに変化
- Focus モード
  - HUD や GUI を控えめにして、つけっぱなし向けの見え方に切り替え
- 自動ドリフト
  - Focus 中に ambient preset と curve mode が時間でゆるく移る
- 共有と保存
  - `共有URLコピー` で現在状態を URL 化
  - `Preset` の保存 / 読み込み
- スマホ対応
  - モバイル専用の下部パネル UI
  - PWA / fullscreen / install 導線あり

## 基本操作

PC:

- マウスドラッグで回転
- ホイールでズーム
- 右側 GUI で形状、発光、音、ambient preset を調整

スマホ:

- 1 本指で回転
- ピンチでズーム
- 右下の `調整` ボタンから下部パネルを開いて操作

## ローカル起動

```bash
npm install
npm run dev
```

本番ビルド確認:

```bash
npm run build
npm run preview
```

## テスト

ロジックと公開物の軽い整合性確認:

```bash
npm run test:smoke
```

確認内容:

- curve mode 定義の重複チェック
- ランダムパラメータ生成の整合性
- 点列生成結果が有限値かどうか
- 共有 URL の roundtrip
- preset 保存 / 読み込みの roundtrip
- PWA 必須アセットの存在確認
- 音源 fallback の確認

見た目と操作まで含めたブラウザ確認:

```bash
npm run test:e2e
```

headless ではなくブラウザを見ながら確認したい場合:

```bash
npm run test:e2e:headed
```

## 共有 URL

1. アプリ内で好みの状態に調整する
2. `共有URLコピー` を押す
3. コピーした URL を共有する

受け取った人は、その URL を開くだけで同じ設定を再現できます。

## PWA

このアプリは PWA 対応です。

- スマホでホーム画面追加可能
- fullscreen 切り替えあり
- install 可能な環境では `アプリ追加` が使える

manifest と service worker は `public/` にあります。

## 音源

`public/audio/` に音源を置く構成です。

最低限必要:

- `bgm.mp3`

テーマごとに差を付けたい場合は、次の名前で置けます。

- `calm.mp3`
- `deep.mp3`
- `cosmic.mp3`
- `drift.mp3`

テーマ専用音源がない場合は `bgm.mp3` にフォールバックします。

## GitHub Pages

このプロジェクトは GitHub Pages で公開できるようにしてあります。

現在の構成では、リポジトリ root 側の workflow から `three-spiro-3d/` を build します。

必要な設定:

1. GitHub に push する
2. `Settings > Pages`
3. `Build and deployment > Source` を `GitHub Actions` にする

## 主なファイル

- `src/main.js`
  - 描画全体の司令塔
- `src/curve-modes.js`
  - 各曲線モードの定義と点列生成
- `src/ambient-presets.js`
  - ambient preset の定義
- `src/gui.js`
  - PC 用 GUI
- `src/mobile-ui.js`
  - スマホ用 UI
- `src/audio.js`
  - BGM 制御
- `src/background.js`
  - 背景生成
- `src/cosmic-sweep.js`
  - 宇宙ストリーク演出
- `src/pwa.js`
  - PWA / install / fullscreen 補助
- `scripts/smoke-check.mjs`
  - 軽量テスト
