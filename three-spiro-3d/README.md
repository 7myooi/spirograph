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

### 3. 公開 URL 
https://7myooi.github.io/spirograph/

