import { ALL_CURVE_PARAM_KEYS } from "./curve-modes.js";

export const PRESET_STORAGE_KEY = "three-spiro-3d-preset";

// 共有 URL とプリセット保存の対象キー。
// 曲線モードごとの値は curve-modes.js から自動で集めて、追記漏れを防ぐ。
const SHARE_STATE_KEYS = [
  ...ALL_CURVE_PARAM_KEYS,
  "ambientPreset",
  "autoDriftEnabled",
  "autoDriftEveryMs",
  "autoRandomize",
  "randomizeBloom",
  "randomizeEveryMs",
  "bloomStrength",
  "bloomRadius",
  "bloomThreshold",
  "tipColorMode",
  "headSize",
  "glowSize",
  "haloSize",
  "headColor",
  "glowColor",
  "haloColor",
  "pulseSpeed",
  "pulseAmount",
  "tubeRadius",
  "tubeEmissiveIntensity",
  "tubeColorMode",
  "tubeColor",
  "bgmEnabled",
  "bgmVolume",
];

export function createGuiState({
  activeParams,
  tipDefaults,
  tubeDefaults,
  actions,
}) {
  // GUI 表示用の値と、保存・共有へ含めたい状態をひとつの箱にまとめる。
  return {
    ...activeParams,
    focusModeEnabled: false,
    ambientPreset: "calm",
    autoDriftEnabled: false,
    autoDriftEveryMs: 45000,
    autoRandomize: true,
    randomizeBloom: false,
    randomizeEveryMs: 9000,
    bloomStrength: 1.2,
    bloomRadius: 0.8,
    bloomThreshold: 0.15,
    tipColorMode: "rainbow",
    headSize: tipDefaults.headSize,
    glowSize: tipDefaults.glowSize,
    haloSize: tipDefaults.haloSize,
    headColor: tipDefaults.headColor,
    glowColor: tipDefaults.glowColor,
    haloColor: tipDefaults.haloColor,
    pulseSpeed: 0.08,
    pulseAmount: 0.18,
    tubeRadius: 0.2,
    tubeEmissiveIntensity: 0.95,
    tubeColorMode: tubeDefaults.colorMode,
    tubeColor: tubeDefaults.color,
    bgmEnabled: true,
    bgmVolume: 0.32,
    ...actions,
  };
}

export function buildSerializableState(guiState) {
  // 関数や Focus の一時状態は含めず、復元に必要な値だけを抜き出す。
  return Object.fromEntries(
    SHARE_STATE_KEYS.map((key) => [key, guiState[key]]),
  );
}

function encodeShareState(state) {
  return btoa(JSON.stringify(state))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function decodeShareState(token) {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0
      ? ""
      : "=".repeat(4 - (normalized.length % 4));

  return JSON.parse(atob(normalized + padding));
}

export function buildShareUrl(guiState, currentHref) {
  // 現在の見た目を hash に埋め込んで、そのまま共有できる URL を作る。
  const url = new URL(currentHref);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/u, ""));
  hashParams.set("state", encodeShareState(buildSerializableState(guiState)));
  url.hash = hashParams.toString();
  return url.toString();
}

export function readSharedStateFromHash(hash) {
  const hashParams = new URLSearchParams(hash.replace(/^#/u, ""));
  const stateToken = hashParams.get("state");

  if (!stateToken) {
    return null;
  }

  return decodeShareState(stateToken);
}

export function savePresetToStorage(guiState, storage = window.localStorage) {
  storage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify(buildSerializableState(guiState)),
  );
}

export function loadPresetFromStorage(storage = window.localStorage) {
  const saved = storage.getItem(PRESET_STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}
