import * as THREE from "three";

// 先端発光の見た目に使う基準値。GUI 側はこの値を元に拡大縮小する。
export const tipDefaults = {
  headSize: 0.6,
  glowSize: 1.4,
  haloSize: 4.8,
  headColor: "#88ccff",
  glowColor: "#66aaff",
  haloColor: "#88ccff",
};

// チューブ本体の見た目に使う基準値。
export const tubeDefaults = {
  colorMode: "rainbow",
  color: "#7dd3fc",
  emissive: 0x101820,
};

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

// Bloom は曲線モードとは独立した演出なので、ここでは見た目用の乱数だけを持つ。
export function randomBloomSettings() {
  return {
    bloomStrength: randomInRange(0.8, 1.8),
    bloomRadius: randomInRange(0.45, 0.95),
    bloomThreshold: randomInRange(0.08, 0.22),
  };
}
