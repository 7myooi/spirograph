import * as THREE from "three";

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

function randomInt(min, max) {
  return THREE.MathUtils.randInt(min, max);
}

function randomizeControlValue(control) {
  const { random } = control;

  if (!random) {
    return undefined;
  }

  if (random.type === "int") {
    return randomInt(random.min, random.max);
  }

  return randomInRange(random.min, random.max);
}

// どのモードでも共通で使う、軌跡そのものの見え方に関わるパラメータ群。
export const COMMON_CURVE_CONTROLS = [
  {
    key: "turns",
    label: "turns：描画周回数",
    min: 12,
    max: 64,
    step: 1,
    random: { min: 26, max: 52, type: "int" },
  },
  {
    key: "step",
    label: "step：点の細かさ",
    min: 0.008,
    max: 0.04,
    step: 0.001,
    random: { min: 0.014, max: 0.026, type: "float" },
  },
  {
    key: "zAmp",
    label: "zAmp：高さの強さ",
    min: 0,
    max: 18,
    step: 0.1,
    random: { min: 5, max: 14, type: "float" },
  },
  {
    key: "zFreq",
    label: "zFreq：高さの波数",
    min: 0.05,
    max: 1.2,
    step: 0.01,
    random: { min: 0.18, max: 0.6, type: "float" },
  },
];

// モードの種類に関係なく、アニメーションのテンポに効くパラメータ群。
export const MOTION_CURVE_CONTROLS = [
  {
    key: "spinX",
    label: "spinX：X回転速度",
    min: 0,
    max: 0.01,
    step: 0.0001,
    random: { min: 0.0008, max: 0.002, type: "float" },
  },
  {
    key: "spinY",
    label: "spinY：Y回転速度",
    min: 0,
    max: 0.01,
    step: 0.0001,
    random: { min: 0.0018, max: 0.0036, type: "float" },
  },
  {
    key: "drawSpeed",
    label: "drawSpeed：描画速度",
    min: 1,
    max: 30,
    step: 1,
    random: { min: 6, max: 14, type: "int" },
  },
];

function buildSpiroPoint(params, t) {
  const x =
    (params.R - params.r) * Math.cos(t) +
    params.d * Math.cos(((params.R - params.r) / params.r) * t);
  const y =
    (params.R - params.r) * Math.sin(t) -
    params.d * Math.sin(((params.R - params.r) / params.r) * t);
  const z = params.zAmp * Math.sin(t * params.zFreq) + 2 * Math.cos(t * 0.17);

  return new THREE.Vector3(x, y, z);
}

function buildSpiroPoints(params) {
  const nextPoints = [];

  for (let t = 0; t <= Math.PI * params.turns; t += params.step) {
    nextPoints.push(buildSpiroPoint(params, t));
  }

  return nextPoints;
}

function buildLissajousPoint(params, t) {
  const x =
    params.lissajousAmpX *
    Math.sin(params.lissajousFreqX * t + params.lissajousPhase);
  const y = params.lissajousAmpY * Math.sin(params.lissajousFreqY * t);
  const z =
    params.zAmp * Math.sin(t * params.zFreq + params.lissajousPhase * 0.5) +
    params.lissajousAmpX * 0.12 * Math.cos(t * 0.35);

  return new THREE.Vector3(x, y, z);
}

function buildLissajousPoints(params) {
  const nextPoints = [];

  for (let t = 0; t <= Math.PI * params.turns; t += params.step) {
    nextPoints.push(buildLissajousPoint(params, t));
  }

  return nextPoints;
}

function centerPoints(points) {
  if (points.length === 0) {
    return points;
  }

  const bounds = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
  };

  for (const point of points) {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.minZ = Math.min(bounds.minZ, point.z);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
    bounds.maxZ = Math.max(bounds.maxZ, point.z);
  }

  const offsetX = (bounds.minX + bounds.maxX) * 0.5;
  const offsetY = (bounds.minY + bounds.maxY) * 0.5;
  const offsetZ = (bounds.minZ + bounds.maxZ) * 0.5;

  points.forEach((point) => {
    point.x -= offsetX;
    point.y -= offsetY;
    point.z -= offsetZ;
  });

  return points;
}

function buildLorenzPoints(params) {
  const nextPoints = [];
  const totalSteps = Math.max(
    1600,
    Math.floor((Math.PI * params.turns) / Math.max(params.step, 0.002)),
  );
  const warmupSteps = 220;

  let x = 0.01;
  let y = 0;
  let z = 0;

  for (let index = 0; index < totalSteps + warmupSteps; index += 1) {
    const dx = params.lorenzSigma * (y - x);
    const dy = x * (params.lorenzRho - z) - y;
    const dz = x * y - params.lorenzBeta * z;

    x += dx * params.lorenzDt;
    y += dy * params.lorenzDt;
    z += dz * params.lorenzDt;

    if (index < warmupSteps) {
      continue;
    }

    nextPoints.push(
      new THREE.Vector3(
        x * params.lorenzScale,
        z * params.lorenzScale * 0.8,
        y * params.lorenzScale,
      ),
    );
  }

  return centerPoints(nextPoints);
}

// それぞれのモードについて、「GUI 表示」「ランダム値」「点列生成」をまとめて持つ。
export const CURVE_MODE_DEFINITIONS = [
  {
    key: "spiro",
    label: "Spiro：スピロ",
    folderLabel: "Spiro：スピロ",
    controls: [
      {
        key: "R",
        label: "R：大円半径",
        min: 10,
        max: 28,
        step: 0.1,
        random: { min: 14, max: 24, type: "float" },
      },
      {
        key: "r",
        label: "r：小円半径",
        min: 3,
        max: 12,
        step: 0.1,
        random: { min: 4, max: 10, type: "float" },
      },
      {
        key: "d",
        label: "d：ペン位置",
        min: 3,
        max: 18,
        step: 0.1,
        random: { min: 6, max: 16, type: "float" },
      },
    ],
    buildPoints: buildSpiroPoints,
  },
  {
    key: "lissajous",
    label: "Lissajous：リサージュ",
    folderLabel: "Lissajous：リサージュ",
    controls: [
      {
        key: "lissajousAmpX",
        label: "lissajousAmpX：X振幅",
        min: 8,
        max: 28,
        step: 0.1,
        random: { min: 12, max: 24, type: "float" },
      },
      {
        key: "lissajousAmpY",
        label: "lissajousAmpY：Y振幅",
        min: 8,
        max: 24,
        step: 0.1,
        random: { min: 8, max: 20, type: "float" },
      },
      {
        key: "lissajousFreqX",
        label: "lissajousFreqX：X周波数",
        min: 1,
        max: 9,
        step: 1,
        random: { min: 2, max: 7, type: "int" },
      },
      {
        key: "lissajousFreqY",
        label: "lissajousFreqY：Y周波数",
        min: 1,
        max: 9,
        step: 1,
        random: { min: 3, max: 9, type: "int" },
      },
      {
        key: "lissajousPhase",
        label: "lissajousPhase：位相差",
        min: 0,
        max: Math.PI,
        step: 0.01,
        random: { min: 0, max: Math.PI, type: "float" },
      },
    ],
    buildPoints: buildLissajousPoints,
  },
  {
    key: "lorenz",
    label: "Lorenz：ローレンツ",
    folderLabel: "Lorenz：ローレンツ",
    controls: [
      {
        key: "lorenzSigma",
        label: "lorenzSigma：σ",
        min: 4,
        max: 20,
        step: 0.1,
        random: { min: 8, max: 14, type: "float" },
      },
      {
        key: "lorenzRho",
        label: "lorenzRho：ρ",
        min: 10,
        max: 40,
        step: 0.1,
        random: { min: 24, max: 34, type: "float" },
      },
      {
        key: "lorenzBeta",
        label: "lorenzBeta：β",
        min: 1.2,
        max: 4,
        step: 0.01,
        random: { min: 2.1, max: 3.2, type: "float" },
      },
      {
        key: "lorenzDt",
        label: "lorenzDt：時間刻み",
        min: 0.001,
        max: 0.02,
        step: 0.0005,
        random: { min: 0.004, max: 0.012, type: "float" },
      },
      {
        key: "lorenzScale",
        label: "lorenzScale：拡大率",
        min: 0.2,
        max: 1.2,
        step: 0.01,
        random: { min: 0.42, max: 0.72, type: "float" },
      },
    ],
    buildPoints: buildLorenzPoints,
  },
];

export const CURVE_MODE_OPTIONS = Object.fromEntries(
  CURVE_MODE_DEFINITIONS.map((definition) => [definition.label, definition.key]),
);

export const MODE_SPECIFIC_CURVE_PARAM_KEYS = CURVE_MODE_DEFINITIONS.flatMap(
  (definition) => definition.controls.map((control) => control.key),
);

export const ALL_CURVE_PARAM_KEYS = [
  "curveMode",
  ...COMMON_CURVE_CONTROLS.map((control) => control.key),
  ...MOTION_CURVE_CONTROLS.map((control) => control.key),
  ...MODE_SPECIFIC_CURVE_PARAM_KEYS,
];

export function getCurveModeDefinition(curveMode = "spiro") {
  return (
    CURVE_MODE_DEFINITIONS.find((definition) => definition.key === curveMode) ??
    CURVE_MODE_DEFINITIONS[0]
  );
}

function randomizeControls(controls) {
  return Object.fromEntries(
    controls
      .filter((control) => control.random)
      .map((control) => [control.key, randomizeControlValue(control)]),
  );
}

// GUI の初期値や自動ランダム化で使う、曲線モード系の値をまとめて作る。
export function randomCurveParams(curveMode = "spiro") {
  const nextMode = getCurveModeDefinition(curveMode);

  return {
    curveMode: nextMode.key,
    ...randomizeControls(COMMON_CURVE_CONTROLS),
    ...randomizeControls(MOTION_CURVE_CONTROLS),
    ...Object.assign(
      {},
      ...CURVE_MODE_DEFINITIONS.map((definition) =>
        randomizeControls(definition.controls),
      ),
    ),
  };
}

// GUI の巨大な hand-written copy を減らすため、曲線系のキーだけを抜き出す。
export function pickCurveParams(source) {
  return Object.fromEntries(
    ALL_CURVE_PARAM_KEYS.map((key) => [key, source[key]]),
  );
}

function buildRainbowColors(pointCount) {
  const nextColors = [];

  for (let index = 0; index < pointCount; index += 1) {
    const hue = index / Math.max(1, pointCount - 1);
    const color = new THREE.Color().setHSL(hue, 0.85, 0.6);
    nextColors.push(color.r, color.g, color.b);
  }

  return nextColors;
}

export function buildCurvePoints(params) {
  const modeDefinition = getCurveModeDefinition(params.curveMode);
  const nextPoints = modeDefinition.buildPoints(params);
  const nextColors = buildRainbowColors(nextPoints.length);
  return { nextPoints, nextColors };
}
