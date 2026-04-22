# three-spiro-3d

Three.js で作った 3D スピログラフ作品です。  
虹色の軌跡、発光する先端、Bloom、宇宙背景、流星のようなストリーク演出、GUI 調整、プリセット保存に対応しています。

## できること

- GUI で形状、動き、発光、先端演出を調整
- `Preset` で現在の設定をローカル保存 / 読込
- `copyShareUrl：共有URLコピー` で今の見た目をそのまま共有
- GitHub Pages に公開して、複数の人がブラウザから同じアプリを使える

## ローカルで動かす

```bash
npm install
npm run dev
```

本番ビルド確認:

```bash
npm run build
npm run preview
```

## 共有のしかた

1. GUI で見た目を調整する
2. `Random：ランダム > Preset：保存 > copyShareUrl：共有URLコピー` を押す
3. コピーされた URL を相手に送る

相手はその URL を開くだけで、同じ設定のスピログラフを見られます。

## GitHub Pages で公開する

このリポジトリには GitHub Pages 用の workflow が入っています。

### 1. GitHub へ push する

`main` か `master` ブランチへ push すると、GitHub Actions がビルドして Pages へデプロイします。

### 2. GitHub 側で Pages を有効にする

リポジトリの `Settings > Pages` を開いて、`Build and deployment` を `GitHub Actions` にします。

### 3. 公開 URL を共有する

デプロイ後、GitHub Pages の URL が発行されます。  
その URL を送れば、複数の人が同時にこのアプリを使えます。

## いまの共有範囲

いまは静的サイトとして公開する構成なので、次の共有に向いています。

- 複数人が同じアプリへアクセスする
- 共有 URL で同じ設定を再現する

一方で、次のようなリアルタイム共有はまだ入っていません。

- 誰かの操作が他の人の画面へ即時反映される
- 複数人で同じプリセット一覧を共有する
- ユーザーごとの保存データをサーバーに持つ

ここまでやるなら、次は Firebase / Supabase / 自前 API などのバックエンドが必要です。

## 次の拡張候補

- GUI と状態管理の分離
- JSON export / import
- 複数プリセットスロット
- リアルタイム共有用バックエンド追加
