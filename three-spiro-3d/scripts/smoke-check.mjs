import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AMBIENT_PRESET_DEFINITIONS } from "../src/ambient-presets.js";
import {
  buildSerializableState,
  buildShareUrl,
  createGuiState,
  loadPresetFromStorage,
  readSharedStateFromHash,
  savePresetToStorage,
} from "../src/app-state.js";
import {
  ALL_CURVE_PARAM_KEYS,
  buildCurvePoints,
  CURVE_MODE_DEFINITIONS,
  randomCurveParams,
} from "../src/curve-modes.js";
import { tipDefaults, tubeDefaults } from "../src/spiro-data.js";

if (typeof globalThis.btoa !== "function") {
  globalThis.btoa = (value) =>
    Buffer.from(value, "utf8").toString("base64");
}

if (typeof globalThis.atob !== "function") {
  globalThis.atob = (value) =>
    Buffer.from(value, "base64").toString("utf8");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const warnings = [];
const results = [];

function test(title, fn) {
  fn();
  results.push(`PASS ${title}`);
}

function relToPublicPath(relativePath) {
  return path.join(publicRoot, ...relativePath.split("/"));
}

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

try {
  test("curve mode definitions are unique", () => {
    const keys = CURVE_MODE_DEFINITIONS.map((definition) => definition.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  test("curve parameter whitelist stays unique", () => {
    assert.equal(new Set(ALL_CURVE_PARAM_KEYS).size, ALL_CURVE_PARAM_KEYS.length);
  });

  test("randomCurveParams returns a complete param object for every mode", () => {
    for (const definition of CURVE_MODE_DEFINITIONS) {
      const params = randomCurveParams(definition.key);
      assert.equal(params.curveMode, definition.key);

      for (const key of ALL_CURVE_PARAM_KEYS) {
        assert.notEqual(params[key], undefined, `missing param: ${key}`);
      }
    }
  });

  test("buildCurvePoints creates finite rainbow data for every mode", () => {
    for (const definition of CURVE_MODE_DEFINITIONS) {
      const params = randomCurveParams(definition.key);
      const { nextPoints, nextColors } = buildCurvePoints(params);

      assert.ok(nextPoints.length > 0, `${definition.key} produced no points`);
      assert.equal(nextColors.length, nextPoints.length * 3);

      nextPoints.forEach((point, index) => {
        assert.ok(Number.isFinite(point.x), `${definition.key} point ${index} x`);
        assert.ok(Number.isFinite(point.y), `${definition.key} point ${index} y`);
        assert.ok(Number.isFinite(point.z), `${definition.key} point ${index} z`);
      });

      nextColors.forEach((value, index) => {
        assert.ok(
          Number.isFinite(value) && value >= 0 && value <= 1,
          `${definition.key} color ${index}`,
        );
      });
    }
  });

  test("share URL roundtrip preserves serializable state", () => {
    const guiState = createGuiState({
      activeParams: randomCurveParams("lorenz"),
      tipDefaults,
      tubeDefaults,
      actions: {},
    });

    Object.assign(guiState, {
      ambientPreset: "cosmic",
      autoDriftEnabled: true,
      autoDriftEveryMs: 60000,
      bgmEnabled: false,
      bloomStrength: 1.45,
      tubeColorMode: "manual",
      tubeColor: "#7dd3fc",
    });

    const expectedState = buildSerializableState(guiState);
    const shareUrl = buildShareUrl(guiState, "https://example.com/spirograph/");
    const sharedState = readSharedStateFromHash(new URL(shareUrl).hash);
    assert.deepEqual(sharedState, expectedState);
  });

  test("preset storage roundtrip preserves serializable state", () => {
    const storage = createMemoryStorage();
    const guiState = createGuiState({
      activeParams: randomCurveParams("lissajous"),
      tipDefaults,
      tubeDefaults,
      actions: {},
    });

    Object.assign(guiState, {
      ambientPreset: "deep",
      bgmVolume: 0.42,
      pulseAmount: 0.11,
    });

    const expectedState = buildSerializableState(guiState);
    savePresetToStorage(guiState, storage);
    const loadedState = loadPresetFromStorage(storage);
    assert.deepEqual(loadedState, expectedState);
  });

  test("required public assets for PWA shell exist", () => {
    const requiredAssets = [
      "favicon.svg",
      "manifest.webmanifest",
      "sw.js",
      "audio/bgm.mp3",
    ];

    requiredAssets.forEach((relativePath) => {
      assert.ok(
        fs.existsSync(relToPublicPath(relativePath)),
        `missing public asset: ${relativePath}`,
      );
    });
  });

  test("ambient presets point to valid fallback audio files", () => {
    AMBIENT_PRESET_DEFINITIONS.forEach((preset) => {
      assert.ok(Array.isArray(preset.audioPaths) && preset.audioPaths.length > 0);

      const fallbackPath = preset.audioPaths[preset.audioPaths.length - 1];
      assert.ok(
        fs.existsSync(relToPublicPath(fallbackPath)),
        `missing fallback audio: ${preset.key} -> ${fallbackPath}`,
      );

      const preferredPath = preset.audioPaths[0];
      if (!fs.existsSync(relToPublicPath(preferredPath))) {
        warnings.push(
          `WARN ${preset.key} theme is falling back because ${preferredPath} is missing`,
        );
      }
    });
  });

  console.log(results.join("\n"));

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    console.log(warnings.join("\n"));
  }
} catch (error) {
  console.error("FAIL", error.message);
  process.exitCode = 1;
}
