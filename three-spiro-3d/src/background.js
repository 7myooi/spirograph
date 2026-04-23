import * as THREE from "three";

export const SCENE_FOG_COLOR = 0x050811;

const DEFAULT_BACKDROP_THEME = {
  gradientStops: [
    { offset: 0, color: "#02030d" },
    { offset: 0.42, color: "#0d1f42" },
    { offset: 0.78, color: "#081126" },
    { offset: 1, color: "#01040c" },
  ],
  glowA: ["rgba(116, 184, 255, 0.58)", "rgba(46, 106, 255, 0.26)"],
  glowB: ["rgba(80, 255, 236, 0.28)", "rgba(19, 122, 255, 0.2)"],
  glowC: ["rgba(255, 94, 224, 0.28)", "rgba(130, 65, 255, 0.16)"],
  auroraA: ["rgba(0, 255, 214, 0.12)", "rgba(80, 138, 255, 0.08)"],
  auroraB: ["rgba(255, 101, 236, 0.12)", "rgba(94, 71, 255, 0.08)"],
  sparkleColor: "rgba(255, 255, 255, 0.18)",
  sparkleCount: 140,
  sparkleOpacityMin: 0.04,
  sparkleOpacityRange: 0.28,
  vignetteMidAlpha: 0.14,
  vignetteOuterAlpha: 0.44,
};

const DEFAULT_BACKGROUND_PRESET = {
  starOpacity: 1,
  nearStarOpacity: 1,
  accentOpacity: 1,
  dustOpacity: 1,
  nebulaOpacity: 1,
  motion: 1,
  colors: {
    farStars: 0xe2edff,
    nearStars: 0x8fc5ff,
    accentStars: 0xff93ec,
    dustA: 0xffc2f3,
    dustB: 0x9ffff0,
    nebulaA: 0x2a74ff,
    nebulaB: 0x11d5ff,
    nebulaC: 0xff4fd8,
    nebulaD: 0x7c5cff,
    nebulaE: 0x26ffd9,
  },
  backdrop: DEFAULT_BACKDROP_THEME,
};

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

function createBackdropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return {
    canvas,
    context: canvas.getContext("2d"),
    texture,
  };
}

function drawBackdrop(backdropState, theme) {
  const { canvas, context, texture } = backdropState;
  context.clearRect(0, 0, canvas.width, canvas.height);

  const baseGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  theme.gradientStops.forEach((stop) => {
    baseGradient.addColorStop(stop.offset, stop.color);
  });
  context.fillStyle = baseGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalCompositeOperation = "screen";

  const glowA = context.createRadialGradient(220, 180, 16, 220, 180, 360);
  glowA.addColorStop(0, theme.glowA[0]);
  glowA.addColorStop(0.5, theme.glowA[1]);
  glowA.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glowA;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glowB = context.createRadialGradient(810, 680, 14, 810, 680, 340);
  glowB.addColorStop(0, theme.glowB[0]);
  glowB.addColorStop(0.45, theme.glowB[1]);
  glowB.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glowB;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glowC = context.createRadialGradient(720, 220, 10, 720, 220, 280);
  glowC.addColorStop(0, theme.glowC[0]);
  glowC.addColorStop(0.5, theme.glowC[1]);
  glowC.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glowC;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const auroraA = context.createLinearGradient(120, 80, 640, 660);
  auroraA.addColorStop(0, theme.auroraA[0]);
  auroraA.addColorStop(0.4, theme.auroraA[1]);
  auroraA.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = auroraA;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const auroraB = context.createLinearGradient(860, 40, 420, 860);
  auroraB.addColorStop(0, theme.auroraB[0]);
  auroraB.addColorStop(0.55, theme.auroraB[1]);
  auroraB.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = auroraB;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = theme.sparkleColor;
  for (let index = 0; index < theme.sparkleCount; index += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2.4 + 0.3;
    context.globalAlpha =
      Math.random() * theme.sparkleOpacityRange + theme.sparkleOpacityMin;
    context.fillRect(x, y, size, size);
  }
  context.globalAlpha = 1;

  const vignette = context.createRadialGradient(512, 512, 180, 512, 512, 620);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.72, `rgba(0, 0, 0, ${theme.vignetteMidAlpha})`);
  vignette.addColorStop(1, `rgba(0, 0, 0, ${theme.vignetteOuterAlpha})`);
  context.globalCompositeOperation = "source-over";
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);

  texture.needsUpdate = true;
}

function createStarField(count, spreadX, spreadY, depth, color, size, opacity) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = randomInRange(-spreadX, spreadX);
    positions[offset + 1] = randomInRange(-spreadY, spreadY);
    positions[offset + 2] = randomInRange(-depth, -depth * 0.35);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

function createNebulaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(256, 256, 40, 256, 256, 256);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.88)");
  gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.42)");
  gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.08)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createNebulaSprite(texture, color, opacity, position, scale, rotation) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  material.rotation = rotation;

  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(scale.x, scale.y, 1);
  return sprite;
}

export function createSpaceBackground() {
  const group = new THREE.Group();
  const backdropState = createBackdropTexture();
  const nebulaTexture = createNebulaTexture();

  const farStars = createStarField(1800, 460, 170, 400, 0xe2edff, 1.05, 0.7);
  const nearStars = createStarField(620, 340, 110, 280, 0x8fc5ff, 2.2, 0.56);
  const accentStars = createStarField(180, 300, 120, 260, 0xff93ec, 2.8, 0.22);
  const dreamDustA = createStarField(120, 280, 130, 210, 0xffc2f3, 4.6, 0.12);
  const dreamDustB = createStarField(90, 240, 110, 200, 0x9ffff0, 4.2, 0.11);
  const nebulaA = createNebulaSprite(
    nebulaTexture,
    0x2a74ff,
    0.22,
    new THREE.Vector3(-110, 72, -220),
    new THREE.Vector2(300, 220),
    -0.24,
  );
  const nebulaB = createNebulaSprite(
    nebulaTexture,
    0x11d5ff,
    0.18,
    new THREE.Vector3(124, -22, -250),
    new THREE.Vector2(270, 200),
    0.38,
  );
  const nebulaC = createNebulaSprite(
    nebulaTexture,
    0xff4fd8,
    0.14,
    new THREE.Vector3(18, 118, -310),
    new THREE.Vector2(230, 170),
    0.16,
  );
  const nebulaD = createNebulaSprite(
    nebulaTexture,
    0x7c5cff,
    0.12,
    new THREE.Vector3(-10, -108, -280),
    new THREE.Vector2(320, 220),
    -0.1,
  );
  const nebulaE = createNebulaSprite(
    nebulaTexture,
    0x26ffd9,
    0.09,
    new THREE.Vector3(166, 82, -340),
    new THREE.Vector2(260, 180),
    0.28,
  );

  group.add(farStars);
  group.add(nearStars);
  group.add(accentStars);
  group.add(dreamDustA);
  group.add(dreamDustB);
  group.add(nebulaA);
  group.add(nebulaB);
  group.add(nebulaC);
  group.add(nebulaD);
  group.add(nebulaE);

  const starLayers = {
    far: { points: farStars, baseOpacity: 0.7, colorKey: "farStars" },
    near: { points: nearStars, baseOpacity: 0.56, colorKey: "nearStars" },
    accent: {
      points: accentStars,
      baseOpacity: 0.22,
      colorKey: "accentStars",
    },
    dustA: { points: dreamDustA, baseOpacity: 0.12, colorKey: "dustA" },
    dustB: { points: dreamDustB, baseOpacity: 0.11, colorKey: "dustB" },
  };

  const nebulaLayers = [
    {
      sprite: nebulaA,
      baseOpacity: 0.2,
      pulseAmplitude: 0.03,
      pulseSpeed: 1.3,
      axis: "y",
      basePosition: new THREE.Vector3(-110, 72, -220),
      driftAmplitude: 6,
      driftSpeed: 1.1,
      driftPhase: "sin",
      rotationSpeed: 0.00024,
      colorKey: "nebulaA",
    },
    {
      sprite: nebulaB,
      baseOpacity: 0.16,
      pulseAmplitude: 0.025,
      pulseSpeed: 1.1,
      axis: "x",
      basePosition: new THREE.Vector3(124, -22, -250),
      driftAmplitude: 9,
      driftSpeed: 0.85,
      driftPhase: "cos",
      rotationSpeed: -0.00016,
      colorKey: "nebulaB",
    },
    {
      sprite: nebulaC,
      baseOpacity: 0.12,
      pulseAmplitude: 0.022,
      pulseSpeed: 0.95,
      axis: "y",
      basePosition: new THREE.Vector3(18, 118, -310),
      driftAmplitude: 5,
      driftSpeed: 0.7,
      driftPhase: "sin",
      rotationSpeed: 0.00011,
      colorKey: "nebulaC",
    },
    {
      sprite: nebulaD,
      baseOpacity: 0.1,
      pulseAmplitude: 0.02,
      pulseSpeed: 0.8,
      axis: "x",
      basePosition: new THREE.Vector3(-10, -108, -280),
      driftAmplitude: 8,
      driftSpeed: 0.62,
      driftPhase: "sin",
      rotationSpeed: -0.00014,
      colorKey: "nebulaD",
    },
    {
      sprite: nebulaE,
      baseOpacity: 0.08,
      pulseAmplitude: 0.018,
      pulseSpeed: 1.45,
      axis: "y",
      basePosition: new THREE.Vector3(166, 82, -340),
      driftAmplitude: 7,
      driftSpeed: 0.92,
      driftPhase: "cos",
      rotationSpeed: 0.00009,
      colorKey: "nebulaE",
    },
  ];

  const dustPulseLayers = [
    {
      points: dreamDustA,
      baseOpacity: 0.08,
      pulseAmplitude: 0.035,
      pulseSpeed: 1.6,
      phase: "sin",
    },
    {
      points: dreamDustB,
      baseOpacity: 0.07,
      pulseAmplitude: 0.03,
      pulseSpeed: 1.3,
      phase: "cos",
    },
  ];

  const presetState = {
    ...DEFAULT_BACKGROUND_PRESET,
    colors: { ...DEFAULT_BACKGROUND_PRESET.colors },
    backdrop: { ...DEFAULT_BACKDROP_THEME },
  };
  let time = 0;

  function applyPreset(preset = DEFAULT_BACKGROUND_PRESET) {
    const colors = {
      ...DEFAULT_BACKGROUND_PRESET.colors,
      ...(preset.colors ?? {}),
    };
    const backdropTheme = {
      ...DEFAULT_BACKDROP_THEME,
      ...(preset.backdrop ?? {}),
    };

    Object.assign(presetState, DEFAULT_BACKGROUND_PRESET, preset, {
      colors,
      backdrop: backdropTheme,
    });

    starLayers.far.points.material.opacity =
      starLayers.far.baseOpacity * presetState.starOpacity;
    starLayers.near.points.material.opacity =
      starLayers.near.baseOpacity * presetState.nearStarOpacity;
    starLayers.accent.points.material.opacity =
      starLayers.accent.baseOpacity * presetState.accentOpacity;

    Object.values(starLayers).forEach((layer) => {
      layer.points.material.color.set(colors[layer.colorKey]);
    });

    nebulaLayers.forEach((layer) => {
      layer.sprite.material.color.set(colors[layer.colorKey]);
    });

    drawBackdrop(backdropState, backdropTheme);
  }

  function update(delta) {
    const frame = delta * 60 * presetState.motion;
    time += 0.0024 * frame;

    farStars.rotation.y += 0.00012 * frame;
    farStars.rotation.x -= 0.00003 * frame;
    nearStars.rotation.y -= 0.0002 * frame;
    nearStars.rotation.z += 0.00005 * frame;
    accentStars.rotation.y += 0.00024 * frame;
    accentStars.rotation.x += 0.00004 * frame;
    dreamDustA.rotation.y -= 0.00018 * frame;
    dreamDustA.rotation.z += 0.00006 * frame;
    dreamDustB.rotation.y += 0.00014 * frame;
    dreamDustB.rotation.x += 0.00004 * frame;

    dustPulseLayers.forEach((layer) => {
      const wave =
        layer.phase === "sin"
          ? Math.sin(time * layer.pulseSpeed)
          : Math.cos(time * layer.pulseSpeed);
      layer.points.material.opacity =
        (layer.baseOpacity + (wave + 1) * layer.pulseAmplitude) *
        presetState.dustOpacity;
    });

    nebulaLayers.forEach((layer) => {
      layer.sprite.material.rotation += layer.rotationSpeed * frame;
      const wave =
        layer.driftPhase === "sin"
          ? Math.sin(time * layer.driftSpeed)
          : Math.cos(time * layer.driftSpeed);
      layer.sprite.position.copy(layer.basePosition);
      layer.sprite.position[layer.axis] += wave * layer.driftAmplitude;
      layer.sprite.material.opacity =
        (layer.baseOpacity +
          (Math.sin(time * layer.pulseSpeed) + 1) * layer.pulseAmplitude) *
        presetState.nebulaOpacity;
    });
  }

  applyPreset();

  return {
    backdropTexture: backdropState.texture,
    group,
    update,
    applyPreset,
  };
}
