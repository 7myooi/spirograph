import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createSpaceBackground, SCENE_FOG_COLOR } from "./background.js";
import { createCosmicSweep } from "./cosmic-sweep.js";
import {
  buildSpiroPoints,
  randomBloomSettings,
  randomSpiroParams,
  tipDefaults,
  tubeDefaults,
} from "./spiro-data.js";
import { createToast } from "./toast.js";

// シーン全体の土台を用意する。レンダラー、カメラ、Bloom、背景をここで初期化する。
const scene = new THREE.Scene();
const spaceBackground = createSpaceBackground();
scene.background = spaceBackground.backdropTexture;
// Fog を入れておくと、背景とオブジェクトの奥行きが自然につながりやすい。
scene.fog = new THREE.FogExp2(SCENE_FOG_COLOR, 0.008);

const camera = new THREE.PerspectiveCamera(
  // 視野角。大きいほど広く見えるが、広角っぽい見え方も強くなる。
  60,
  // 画面の横縦比。これを合わない値にすると表示がつぶれる。
  window.innerWidth / window.innerHeight,
  // near / far は「どこからどこまで描画するか」の範囲。
  0.1,
  1000,
);
// 少し上・少し手前に引いた位置から、全体を見下ろすような構図にする。
camera.position.set(0, 18, 70);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
// 高 DPI 端末でもきれいに見せつつ、重くなりすぎないよう上限を 2 にする。
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// composer は「通常描画 → Bloom」のような後処理の流れを管理する。
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  // 強さ / にじみ幅 / しきい値。あとで GUI から調整できる。
  1.2,
  0.8,
  0.15,
);
composer.addPass(bloomPass);

const showToast = createToast();

const ambientLight = new THREE.HemisphereLight(0xaec5ff, 0x05060a, 1.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(20, 24, 18);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x6ea8ff, 0.45);
fillLight.position.set(-18, -6, -20);
scene.add(fillLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// target を原点に置くことで、模様の中心を軸に回転しやすくする。
controls.target.set(0, 0, 0);
controls.update();

scene.add(spaceBackground.group);

// スピログラフ本体と先端の発光演出をひとつのグループにまとめて回転させる。
const spiroGroup = new THREE.Group();
scene.add(spiroGroup);

// まずは元の虹色ライン。生成途中の「描かれていく感じ」を見せる役目を持つ。
const lineGeometry = new THREE.BufferGeometry();
const lineMaterial = new THREE.LineBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.7,
});
const spiroLine = new THREE.Line(lineGeometry, lineMaterial);
spiroGroup.add(spiroLine);

// こちらは太さのある立体版。ラインと同じ軌跡を、チューブとして見せる。
const tubeMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0x101820,
  emissiveIntensity: 0.95,
  metalness: 0.12,
  roughness: 0.28,
  vertexColors: true,
});
const tubeMesh = new THREE.Mesh(new THREE.BufferGeometry(), tubeMaterial);
tubeMesh.visible = false;
spiroGroup.add(tubeMesh);

const headGeometry = new THREE.SphereGeometry(0.6, 24, 24);
const headMaterial = new THREE.MeshBasicMaterial({ color: 0x88ccff });
const head = new THREE.Mesh(headGeometry, headMaterial);
spiroGroup.add(head);

// glow は先端の外側に置く薄い発光層。芯の球より大きくして「にじみ」を作る。
const glowGeometry = new THREE.SphereGeometry(1.4, 24, 24);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0x66aaff,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
spiroGroup.add(glow);

function createHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  // 中心が明るく、外へ行くほど消える円形グラデーションを描く。
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(180,220,255,0.95)");
  gradient.addColorStop(0.45, "rgba(90,170,255,0.42)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ハローはスプライトで作って、どの角度から見ても先端の発光が見えやすいようにする。
const haloMaterial = new THREE.SpriteMaterial({
  map: createHaloTexture(),
  color: 0x88ccff,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const haloSprite = new THREE.Sprite(haloMaterial);
spiroGroup.add(haloSprite);

const tipLight = new THREE.PointLight(0x7ec7ff, 30, 80, 2);
spiroGroup.add(tipLight);

const cosmicSweep = createCosmicSweep(spaceBackground.group);

// チューブ生成時に使う補助状態。毎フレーム計算し直さずここで覚えておく。
const tubeState = {
  radius: 0.2,
  radialSegments: 16,
  tubularSegments: 0,
  indicesPerSegment: 0,
};

// points は軌跡そのもの、drawCount は「今どこまで描けたか」を表す。
let points = [];
let drawCount = 0;
// pulseTime は先端発光の脈動用。
let pulseTime = 0;
let randomizeTimeoutId = null;
// GUI へ値を戻すときに onChange を暴発させないためのロック。
let guiSyncLocked = false;
let tubeGeometry = null;
const effectClock = new THREE.Clock();

// 点列が変わったときやチューブ半径が変わったときに、立体の軌跡を作り直す。
function rebuildTubeGeometry() {
  if (tubeGeometry !== null) {
    // 前の geometry を破棄しておかないと、GPU メモリに残り続ける。
    tubeGeometry.dispose();
    tubeGeometry = null;
  }

  if (points.length < 2) {
    tubeMesh.visible = false;
    tubeState.tubularSegments = 0;
    return;
  }

  tubeState.tubularSegments = Math.max(200, Math.floor(points.length * 0.22));
  // TubeGeometry の index は「1 セグメントあたり何 index 必要か」が決まっている。
  tubeState.indicesPerSegment = tubeState.radialSegments * 6;

  // 計算済みの点列を滑らかなカーブとして補間し、その上にチューブを通す。
  const curve = new THREE.CatmullRomCurve3(points);
  tubeGeometry = new THREE.TubeGeometry(
    curve,
    tubeState.tubularSegments,
    tubeState.radius,
    tubeState.radialSegments,
    false,
  );

  const ringVertexCount = tubeState.radialSegments + 1;
  const tubeColors = new Float32Array(
    tubeGeometry.attributes.position.count * 3,
  );

  // チューブの各輪切りリングごとに同じ色を入れて、軸方向へ虹が流れる見え方にする。
  for (let segment = 0; segment <= tubeState.tubularSegments; segment += 1) {
    const segmentColor = new THREE.Color().setHSL(
      segment / Math.max(1, tubeState.tubularSegments),
      0.9,
      0.6,
    );

    for (let ringIndex = 0; ringIndex < ringVertexCount; ringIndex += 1) {
      const vertexIndex = segment * ringVertexCount + ringIndex;
      const colorOffset = vertexIndex * 3;
      tubeColors[colorOffset] = segmentColor.r;
      tubeColors[colorOffset + 1] = segmentColor.g;
      tubeColors[colorOffset + 2] = segmentColor.b;
    }
  }

  tubeGeometry.setAttribute("color", new THREE.BufferAttribute(tubeColors, 3));
  tubeGeometry.setDrawRange(0, 0);
  tubeMesh.geometry = tubeGeometry;
  tubeMesh.visible = true;
}

// 線の描画進行に合わせて、チューブ側の表示範囲も同じ割合で伸ばしていく。
function updateTubeDrawRange() {
  if (tubeGeometry === null || points.length === 0) {
    return;
  }

  // ラインは点数ベースで伸びるので、その進行率をチューブのセグメント数へ変換する。
  const ratio = drawCount / points.length;
  const visibleSegments = Math.max(
    1,
    Math.floor(tubeState.tubularSegments * ratio),
  );

  if (tubeGeometry.index) {
    // index 付き geometry の drawRange は「頂点数」ではなく「index 数」で指定する。
    const visibleIndices = Math.min(
      tubeGeometry.index.count,
      visibleSegments * tubeState.indicesPerSegment,
    );
    tubeGeometry.setDrawRange(0, visibleIndices);
    return;
  }

  const visibleVertices = Math.min(
    tubeGeometry.attributes.position.count,
    Math.floor(tubeGeometry.attributes.position.count * ratio),
  );
  tubeGeometry.setDrawRange(0, visibleVertices);
}

let activeParams = randomSpiroParams();
const PRESET_STORAGE_KEY = "three-spiro-3d-preset";
const SHARE_STATE_KEYS = [
  "R",
  "r",
  "d",
  "turns",
  "step",
  "zAmp",
  "zFreq",
  "spinX",
  "spinY",
  "drawSpeed",
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
];

// GUI の値をひとつに集約して、操作・プリセット・再描画の基準にする。
const guiState = {
  ...activeParams,
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

  // 「今すぐランダム」は手動で新しい形を引き直すためのボタン。
  randomizeNow: () => {
    regenerateSpiro(true);
    showToast("Randomized");
  },
  // redraw は現在の GUI 値でもう一度作り直したいときに使う。
  redraw: () => {
    syncParamsFromGui();
    applyTubeAppearance(false);
    rebuildFromActiveParams();
    applyBloomSettings();
    applyTipAppearance();
    scheduleRandomize();
    showToast("Redrawn");
  },
  // いまの見た目を URL に埋め込んで、別の人へそのまま送れるようにする。
  copyShareUrl: () => {
    const shareUrl = buildShareUrl();
    window.history.replaceState(null, "", shareUrl);

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          showToast("Share URL copied");
        })
        .catch(() => {
          showToast("Share URL updated");
        });
      return;
    }

    showToast("Share URL updated");
  },
  savePreset: () => {
    localStorage.setItem(
      PRESET_STORAGE_KEY,
      JSON.stringify(buildSerializableState()),
    );
    showToast("Preset saved");
  },
  loadPreset: () => {
    // localStorage から文字列で取り出して、JSON として元のオブジェクトへ戻す。
    const saved = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!saved) {
      showToast("No preset found");
      return;
    }

    const preset = JSON.parse(saved);
    applySerializableState(preset);
    showToast("Preset loaded");
  },
};

function buildSerializableState() {
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

function buildShareUrl() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/u, ""));
  hashParams.set("state", encodeShareState(buildSerializableState()));
  url.hash = hashParams.toString();
  return url.toString();
}

// Bloom は composer 側で処理するので、GUI の値を pass に反映する。
function applyBloomSettings() {
  bloomPass.strength = guiState.bloomStrength;
  bloomPass.radius = guiState.bloomRadius;
  bloomPass.threshold = guiState.bloomThreshold;
}

// 先端の色は、軌跡に合わせた虹色か、GUI で決めた固定色かを切り替えられる。
function updateTipColors(progress) {
  if (guiState.tipColorMode === "manual") {
    headMaterial.color.set(guiState.headColor);
    glowMaterial.color.set(guiState.glowColor);
    haloMaterial.color.set(guiState.haloColor);
    tipLight.color.set(guiState.glowColor);
    return;
  }

  // progress を色相にそのまま割り当てると、描画の進行に合わせて色が流れて見える。
  const hue = THREE.MathUtils.clamp(progress, 0, 1);
  headMaterial.color.setHSL(hue, 0.95, 0.72);
  glowMaterial.color.setHSL(hue, 0.95, 0.62);
  haloMaterial.color.setHSL(hue, 0.95, 0.7);
  tipLight.color.setHSL(hue, 0.95, 0.68);
}

// 先端の大きさ設定はリアルタイムで反映して、芯・グロー・ハローをそろえて動かす。
function applyTipAppearance() {
  // GUI の値は絶対値なので、元のサイズを基準に倍率へ変換する。
  head.scale.setScalar(guiState.headSize / tipDefaults.headSize);
  haloSprite.scale.setScalar(guiState.haloSize);
  updateTipColors((drawCount - 1) / Math.max(1, points.length - 1));
}

// チューブの見た目は、頂点カラーの虹色と手動指定の単色を切り替えて使う。
function applyTubeAppearance(rebuildGeometry = true) {
  tubeState.radius = guiState.tubeRadius;
  tubeMaterial.emissiveIntensity = guiState.tubeEmissiveIntensity;
  const useManualTubeColor = guiState.tubeColorMode === "manual";

  // 単色モードでは頂点カラーを無効にして、材質の color をそのまま使う。
  tubeMaterial.vertexColors = !useManualTubeColor;
  lineMaterial.vertexColors = !useManualTubeColor;

  if (useManualTubeColor) {
    tubeMaterial.color.set(guiState.tubeColor);
    tubeMaterial.emissive.set(guiState.tubeColor);
    lineMaterial.color.set(guiState.tubeColor);
  } else {
    tubeMaterial.color.set(0xffffff);
    tubeMaterial.emissive.set(tubeDefaults.emissive);
    lineMaterial.color.set(0xffffff);
  }

  tubeMaterial.needsUpdate = true;
  lineMaterial.needsUpdate = true;

  if (rebuildGeometry && points.length > 1) {
    rebuildTubeGeometry();
    updateTubeDrawRange();
  }
}

applyBloomSettings();
applyTipAppearance();
applyTubeAppearance(false);
cosmicSweep.reset();

function syncGuiFromParams() {
  // activeParams → guiState の逆流し込み中は、GUI 側の再描画イベントを止める。
  guiSyncLocked = true;
  Object.assign(guiState, activeParams);
  guiSyncLocked = false;
}

function syncParamsFromGui() {
  // shape / motion 系の値だけを、実際に描画へ使う activeParams に移す。
  activeParams = {
    ...activeParams,
    R: guiState.R,
    r: guiState.r,
    d: guiState.d,
    turns: guiState.turns,
    step: guiState.step,
    zAmp: guiState.zAmp,
    zFreq: guiState.zFreq,
    spinX: guiState.spinX,
    spinY: guiState.spinY,
    drawSpeed: guiState.drawSpeed,
  };
}

function applySerializableState(nextState) {
  Object.assign(guiState, nextState);
  syncParamsFromGui();
  applyBloomSettings();
  applyTipAppearance();
  applyTubeAppearance(false);
  rebuildFromActiveParams();
  syncGuiVisibility();
  gui
    .controllersRecursive()
    .forEach((controller) => controller.updateDisplay());
  scheduleRandomize();
}

function loadSharedStateFromUrl() {
  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/u, ""),
  );
  const stateToken = hashParams.get("state");

  if (!stateToken) {
    return false;
  }

  try {
    const sharedState = decodeShareState(stateToken);
    applySerializableState(sharedState);
    showToast("Shared setup loaded");
    return true;
  } catch {
    showToast("Share URL is invalid");
    return false;
  }
}

// 新しく作った点列を、ライン表示とチューブ表示の両方へ流し込む。
function applySpiro(pointsData, colorsData) {
  points = pointsData;
  drawCount = 0;
  pulseTime = 0;
  // 形が切り替わるタイミングで、背景演出もいったんリセットする。
  cosmicSweep.reset();

  lineGeometry.setFromPoints(points);
  lineGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colorsData, 3),
  );
  lineGeometry.setDrawRange(0, 0);
  rebuildTubeGeometry();

  if (points.length > 0) {
    // 生成開始時点では、先端オブジェクトを最初の点に置いておく。
    head.position.copy(points[0]);
    glow.position.copy(points[0]);
    haloSprite.position.copy(points[0]);
    tipLight.position.copy(points[0]);
    updateTipColors(0);
  }

  head.visible = points.length > 0;
  glow.visible = points.length > 0;
  haloSprite.visible = points.length > 0;
  tipLight.visible = points.length > 0;
  spiroGroup.rotation.set(0, 0, 0);
}

// 形状パラメータが変わったら、軌跡全体を作り直す。
function rebuildFromActiveParams() {
  const { nextPoints, nextColors } = buildSpiroPoints(activeParams);
  applySpiro(nextPoints, nextColors);
}

// 自動ランダム化はタイマーをひとつに絞って、GUI 変更時に組み直しやすくする。
function scheduleRandomize() {
  if (randomizeTimeoutId !== null) {
    window.clearTimeout(randomizeTimeoutId);
    randomizeTimeoutId = null;
  }

  if (guiState.autoRandomize) {
    // 設定された間隔のあとに、もう一度 regenerate を呼び出す。
    randomizeTimeoutId = window.setTimeout(
      () => regenerateSpiro(true),
      guiState.randomizeEveryMs,
    );
  }
}

// ランダム再生成時は必要に応じて Bloom も変えて、その結果を GUI 表示へ戻す。
function regenerateSpiro(useRandomParams = false) {
  if (useRandomParams) {
    activeParams = randomSpiroParams();

    if (guiState.randomizeBloom) {
      Object.assign(guiState, randomBloomSettings());
    }

    // ランダムで決まった値を GUI に反映して、見た目と表示を一致させる。
    syncGuiFromParams();
    guiControllers.forEach((controller) => controller.updateDisplay());
  } else {
    syncParamsFromGui();
  }

  applyTubeAppearance(false);
  rebuildFromActiveParams();
  applyBloomSettings();
  applyTipAppearance();
  scheduleRandomize();
}

const gui = new GUI({ title: "Spiro Controls" });
const guiControllers = [];

// プリセット読込時にまとめて表示更新できるよう、コントローラーを一覧で持っておく。
function registerGuiController(controller) {
  guiControllers.push(controller);
  return controller;
}

function addSpiroControl(folder, prop, min, max, step, name) {
  const controller = registerGuiController(
    folder.add(guiState, prop, min, max, step).name(name),
  );

  controller.onFinishChange(() => {
    if (guiSyncLocked) {
      return;
    }

    // 軌跡の形に関わる値は、操作が終わったタイミングで再構築する。
    syncParamsFromGui();
    rebuildFromActiveParams();
    scheduleRandomize();
  });

  return controller;
}

function addBloomControl(folder, prop, min, max, step, name) {
  const controller = registerGuiController(
    folder.add(guiState, prop, min, max, step).name(name),
  );

  controller.onChange(() => {
    // Bloom は見ながら調整したいので、ドラッグ中も即反映する。
    applyBloomSettings();
  });

  return controller;
}

function addTipNumberControl(folder, prop, min, max, step, name) {
  const controller = registerGuiController(
    folder.add(guiState, prop, min, max, step).name(name),
  );

  controller.onChange(() => {
    // 先端サイズは geometry を組み直さず、その場で scale だけ変える。
    applyTipAppearance();
  });

  return controller;
}

function addTipColorControl(folder, prop, name) {
  const controller = registerGuiController(
    folder.addColor(guiState, prop).name(name),
  );

  controller.onChange(() => {
    // 色は材質にそのまま流し込めるので、こちらも即時反映で十分。
    applyTipAppearance();
  });

  return controller;
}

function addLiveNumberControl(folder, prop, min, max, step, name, onChange) {
  const controller = registerGuiController(
    folder.add(guiState, prop, min, max, step).name(name),
  );

  controller.onChange(() => {
    onChange();
  });

  return controller;
}

function addLiveColorControl(folder, prop, name, onChange) {
  const controller = registerGuiController(
    folder.addColor(guiState, prop).name(name),
  );

  controller.onChange(() => {
    onChange();
  });

  return controller;
}

function setControllerVisible(controller, isVisible) {
  if (isVisible) {
    if (typeof controller.show === "function") {
      controller.show();
      return;
    }

    controller.domElement.style.display = "";
    return;
  }

  if (typeof controller.hide === "function") {
    controller.hide();
    return;
  }

  controller.domElement.style.display = "none";
}

// 手動色モードのときだけカラーピッカーを見せて、GUI の情報量を抑える。
function syncGuiVisibility() {
  const tipUsesManualColor = guiState.tipColorMode === "manual";
  tipManualColorControllers.forEach((controller) => {
    setControllerVisible(controller, tipUsesManualColor);
  });

  const tubeUsesManualColor = guiState.tubeColorMode === "manual";
  tubeManualColorControllers.forEach((controller) => {
    setControllerVisible(controller, tubeUsesManualColor);
  });
}

const shapeFolder = gui.addFolder("Shape：形状");
const shapeCurveFolder = shapeFolder.addFolder("Curve：軌跡");
const shapeTubeFolder = shapeFolder.addFolder("Tube：本体");
const motionFolder = gui.addFolder("Motion：動き");
const tipFolder = gui.addFolder("Tip：先端発光");
const tipSizeFolder = tipFolder.addFolder("Size：サイズ");
const tipPulseFolder = tipFolder.addFolder("Pulse：脈動");
const tipColorFolder = tipFolder.addFolder("Color：色");
const bloomFolder = gui.addFolder("Bloom：発光");
const randomFolder = gui.addFolder("Random：ランダム");
const randomAutoFolder = randomFolder.addFolder("Auto：自動");
const randomActionFolder = randomFolder.addFolder("Action：操作");
const randomPresetFolder = randomFolder.addFolder("Preset：保存");

shapeTubeFolder.close();
tipPulseFolder.close();
tipColorFolder.close();
bloomFolder.close();
randomFolder.close();
randomAutoFolder.close();
randomPresetFolder.close();

addSpiroControl(shapeCurveFolder, "R", 10, 28, 0.1, "R：大円半径");
addSpiroControl(shapeCurveFolder, "r", 3, 12, 0.1, "r：小円半径");
addSpiroControl(shapeCurveFolder, "d", 3, 18, 0.1, "d：ペン位置");
addSpiroControl(shapeCurveFolder, "turns", 12, 64, 1, "turns：描画周回数");
addSpiroControl(
  shapeCurveFolder,
  "step",
  0.008,
  0.04,
  0.001,
  "step：点の細かさ",
);
addSpiroControl(shapeCurveFolder, "zAmp", 0, 18, 0.1, "zAmp：高さの強さ");
addSpiroControl(
  shapeCurveFolder,
  "zFreq",
  0.05,
  1.2,
  0.01,
  "zFreq：高さの波数",
);

addLiveNumberControl(
  shapeTubeFolder,
  "tubeRadius",
  0.08,
  0.65,
  0.01,
  "tubeRadius：チューブ半径",
  () => {
    applyTubeAppearance();
  },
);
registerGuiController(
  shapeTubeFolder
    .add(guiState, "tubeColorMode", {
      "Rainbow：虹色": "rainbow",
      "Manual：単色": "manual",
    })
    .name("tubeColorMode：本体色モード"),
).onChange(() => {
  applyTubeAppearance(false);
  syncGuiVisibility();
});
const tubeColorController = addLiveColorControl(
  shapeTubeFolder,
  "tubeColor",
  "tubeColor：本体色",
  () => {
    applyTubeAppearance(false);
  },
);
addLiveNumberControl(
  shapeTubeFolder,
  "tubeEmissiveIntensity",
  0,
  2.4,
  0.01,
  "tubeEmissiveIntensity：本体発光",
  () => {
    applyTubeAppearance(false);
  },
);

addSpiroControl(motionFolder, "spinX", 0, 0.01, 0.0001, "spinX：X回転速度");
addSpiroControl(motionFolder, "spinY", 0, 0.01, 0.0001, "spinY：Y回転速度");
addSpiroControl(motionFolder, "drawSpeed", 1, 30, 1, "drawSpeed：描画速度");

registerGuiController(
  tipFolder
    .add(guiState, "tipColorMode", {
      "Rainbow：虹追従": "rainbow",
      "Manual：手動": "manual",
    })
    .name("colorMode：色モード"),
).onChange(() => {
  applyTipAppearance();
  syncGuiVisibility();
});
addTipNumberControl(
  tipSizeFolder,
  "headSize",
  0.2,
  1.8,
  0.01,
  "headSize：芯サイズ",
);
addTipNumberControl(
  tipSizeFolder,
  "glowSize",
  0.4,
  3.8,
  0.01,
  "glowSize：発光サイズ",
);
addTipNumberControl(
  tipSizeFolder,
  "haloSize",
  1.4,
  10,
  0.05,
  "haloSize：ハローサイズ",
);
const headColorController = addTipColorControl(
  tipColorFolder,
  "headColor",
  "headColor：芯の色",
);
const glowColorController = addTipColorControl(
  tipColorFolder,
  "glowColor",
  "glowColor：発光色",
);
const haloColorController = addTipColorControl(
  tipColorFolder,
  "haloColor",
  "haloColor：ハロー色",
);
addLiveNumberControl(
  tipPulseFolder,
  "pulseSpeed",
  0,
  0.3,
  0.005,
  "pulseSpeed：脈動速度",
  () => {},
);
addLiveNumberControl(
  tipPulseFolder,
  "pulseAmount",
  0,
  0.45,
  0.01,
  "pulseAmount：脈動の強さ",
  () => {},
);

addBloomControl(
  bloomFolder,
  "bloomStrength",
  0,
  3,
  0.01,
  "bloomStrength：発光の強さ",
);
addBloomControl(
  bloomFolder,
  "bloomRadius",
  0,
  2,
  0.01,
  "bloomRadius：にじみの広がり",
);
addBloomControl(
  bloomFolder,
  "bloomThreshold",
  0,
  1,
  0.01,
  "bloomThreshold：しきい値",
);

randomAutoFolder
  .add(guiState, "autoRandomize")
  .name("autoRandomize：自動ランダム")
  .onChange(() => {
    scheduleRandomize();
    showToast(guiState.autoRandomize ? "Auto random on" : "Auto random off");
  });

randomAutoFolder
  .add(guiState, "randomizeBloom")
  .name("randomizeBloom：Bloomもランダム")
  .onChange(() => {
    showToast(guiState.randomizeBloom ? "Bloom random on" : "Bloom random off");
  });

randomAutoFolder
  .add(guiState, "randomizeEveryMs", 2000, 20000, 500)
  .name("randomizeEveryMs：自動ランダム間隔(ms)")
  .onFinishChange(() => {
    scheduleRandomize();
    showToast(`Randomize every ${guiState.randomizeEveryMs}ms`);
  });

randomActionFolder
  .add(guiState, "randomizeNow")
  .name("randomizeNow：今すぐランダム");
randomActionFolder.add(guiState, "redraw").name("redraw：再描画");
randomPresetFolder
  .add(guiState, "copyShareUrl")
  .name("copyShareUrl：共有URLコピー");
randomPresetFolder
  .add(guiState, "savePreset")
  .name("savePreset：プリセット保存");
randomPresetFolder
  .add(guiState, "loadPreset")
  .name("loadPreset：プリセット読込");

const tipManualColorControllers = [
  headColorController,
  glowColorController,
  haloColorController,
];
const tubeManualColorControllers = [tubeColorController];

syncGuiVisibility();

// 共有 URL があればその設定を優先し、なければ通常の初期形状を作る。
if (!loadSharedStateFromUrl()) {
  regenerateSpiro(false);
}

// 毎フレーム、軌跡を伸ばし、先端を脈動させ、背景を動かしてから描画する。
function animate() {
  requestAnimationFrame(animate);
  // タブ復帰時などに急に大きな delta が来ても暴れないよう上限をかける。
  const delta = Math.min(effectClock.getDelta(), 0.05);

  if (drawCount < points.length) {
    // 毎フレーム drawSpeed 分だけ進めて、線を少しずつ生成していく。
    drawCount = Math.min(drawCount + activeParams.drawSpeed, points.length);
    lineGeometry.setDrawRange(0, drawCount);
    updateTubeDrawRange();

    // いま見えている最後の点が、先端オブジェクトたちの現在位置になる。
    const currentPoint = points[drawCount - 1];
    head.position.copy(currentPoint);
    glow.position.copy(currentPoint);
    haloSprite.position.copy(currentPoint);
    tipLight.position.copy(currentPoint);
    updateTipColors((drawCount - 1) / Math.max(1, points.length - 1));
  }

  pulseTime += guiState.pulseSpeed;
  const glowPulse = 1 + Math.sin(pulseTime) * guiState.pulseAmount;
  const haloPulse =
    1 + Math.sin(pulseTime * 1.15) * (guiState.pulseAmount * 0.78);
  // glow と halo は大きさと透明度の両方を揺らして、呼吸しているような見え方にする。
  glow.scale.setScalar((guiState.glowSize / tipDefaults.glowSize) * glowPulse);
  glowMaterial.opacity = THREE.MathUtils.clamp(
    0.14 +
      (Math.sin(pulseTime * 1.4) + 1) * (0.05 + guiState.pulseAmount * 0.18),
    0.08,
    0.95,
  );
  haloSprite.scale.setScalar(guiState.haloSize * haloPulse);
  haloMaterial.opacity = THREE.MathUtils.clamp(
    0.58 +
      (Math.sin(pulseTime * 1.4) + 1) * (0.08 + guiState.pulseAmount * 0.24),
    0.2,
    1,
  );

  // 背景と宇宙ストリークは、スピログラフとは別の時間軸でゆっくり更新する。
  spaceBackground.update(delta);
  cosmicSweep.update(delta);

  // 最後にグループ全体へ回転を足して、立体感を見せる。
  spiroGroup.rotation.y += activeParams.spinY;
  spiroGroup.rotation.x += activeParams.spinX;

  controls.update();
  composer.render();
}

animate();

// 画面サイズ変更時に、レンダラーと Bloom の内部サイズも合わせ直す。
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});
