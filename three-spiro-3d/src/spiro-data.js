import * as THREE from "three";

// GUI の初期値と実際の見た目がずれないよう、共通の既定値をまとめて持つ。
export const tipDefaults = {
  headSize: 0.6,
  glowSize: 1.4,
  haloSize: 4.8,
  headColor: "#88ccff",
  glowColor: "#66aaff",
  haloColor: "#88ccff",
};

export const tubeDefaults = {
  colorMode: "rainbow",
  color: "#7dd3fc",
  emissive: 0x101820,
};

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

function randomInt(min, max) {
  return THREE.MathUtils.randInt(min, max);
}

// ランダム値は、今のシーンスケールで形が破綻しにくい範囲に絞っている。
export function randomSpiroParams() {
  // R / r / d はスピログラフの基本形を決める主要パラメータ。
  const R = randomInRange(14, 24);
  const r = randomInRange(4, 10);
  const d = randomInRange(6, 16);

  return {
    R,
    r,
    d,
    turns: randomInt(26, 52),
    step: randomInRange(0.014, 0.026),
    zAmp: randomInRange(5, 14),
    zFreq: randomInRange(0.18, 0.6),
    spinX: randomInRange(0.0008, 0.002),
    spinY: randomInRange(0.0018, 0.0036),
    drawSpeed: randomInt(6, 14),
  };
}

export function randomBloomSettings() {
  // 発光は毎回大きくぶれすぎないよう、見た目が崩れにくい範囲にしておく。
  return {
    bloomStrength: randomInRange(0.8, 1.8),
    bloomRadius: randomInRange(0.45, 0.95),
    bloomThreshold: randomInRange(0.08, 0.22),
  };
}

// 座標と虹色を同時に作って、ラインとチューブが同じ元データを使えるようにする。
export function buildSpiroPoints(params) {
  const nextPoints = [];
  const nextColors = [];

  for (let t = 0; t <= Math.PI * params.turns; t += params.step) {
    // x / y はスピログラフの基本式。R, r, d の組み合わせで花びらの形が変わる。
    const x =
      (params.R - params.r) * Math.cos(t) +
      params.d * Math.cos(((params.R - params.r) / params.r) * t);
    const y =
      (params.R - params.r) * Math.sin(t) -
      params.d * Math.sin(((params.R - params.r) / params.r) * t);
    // z は元の 2D スピログラフに上下の波を足して、3D 感を出すための値。
    const z = params.zAmp * Math.sin(t * params.zFreq) + 2 * Math.cos(t * 0.17);

    nextPoints.push(new THREE.Vector3(x, y, z));

    // t の進み具合をそのまま色相へ変換して、軌跡に沿って虹色が流れるようにする。
    const hue = (t / (Math.PI * params.turns)) % 1;
    const color = new THREE.Color().setHSL(hue, 0.85, 0.6);
    nextColors.push(color.r, color.g, color.b);
  }

  return { nextPoints, nextColors };
}
