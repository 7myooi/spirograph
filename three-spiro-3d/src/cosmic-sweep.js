import * as THREE from "three";

const DEFAULT_SWEEP_PRESET = {
  palette: [0xf6fbff, 0xbce8ff, 0x68c9ff, 0x239bff],
  duration: 0.82,
  resetCooldownMin: 3.2,
  resetCooldownMax: 5.4,
  triggerCooldownMin: 3.6,
  triggerCooldownMax: 6.2,
  visibility: 1,
  coreScale: 1,
  trailScale: 1,
  ghostScale: 1,
  opacity: 1,
};

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

function randomInt(min, max) {
  return THREE.MathUtils.randInt(min, max);
}

function createRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(128, 128, 10, 128, 128, 128);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.22, "rgba(255,255,255,0.48)");
  glow.addColorStop(0.58, "rgba(255,255,255,0.1)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  const glow = context.createLinearGradient(0, 128, 512, 128);
  glow.addColorStop(0, "rgba(255,255,255,0)");
  glow.addColorStop(0.16, "rgba(255,255,255,0.03)");
  glow.addColorStop(0.5, "rgba(255,255,255,1)");
  glow.addColorStop(0.84, "rgba(255,255,255,0.03)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 112, 512, 32);

  const softness = context.createLinearGradient(0, 0, 0, 256);
  softness.addColorStop(0, "rgba(255,255,255,0)");
  softness.addColorStop(0.44, "rgba(255,255,255,0.05)");
  softness.addColorStop(0.5, "rgba(255,255,255,0.18)");
  softness.addColorStop(0.56, "rgba(255,255,255,0.05)");
  softness.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = softness;
  context.fillRect(0, 0, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRibbonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  const band = context.createLinearGradient(0, 128, 512, 128);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.2, "rgba(255,255,255,0.02)");
  band.addColorStop(0.4, "rgba(255,255,255,0.14)");
  band.addColorStop(0.5, "rgba(255,255,255,0.98)");
  band.addColorStop(0.6, "rgba(255,255,255,0.14)");
  band.addColorStop(0.8, "rgba(255,255,255,0.02)");
  band.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = band;
  context.fillRect(0, 118, 512, 20);

  const feather = context.createLinearGradient(0, 0, 0, 256);
  feather.addColorStop(0, "rgba(255,255,255,0)");
  feather.addColorStop(0.47, "rgba(255,255,255,0.04)");
  feather.addColorStop(0.5, "rgba(255,255,255,0.16)");
  feather.addColorStop(0.53, "rgba(255,255,255,0.04)");
  feather.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = feather;
  context.fillRect(0, 0, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCosmicSweep(parentGroup) {
  const group = new THREE.Group();
  parentGroup.add(group);

  const ringMaterial = new THREE.SpriteMaterial({
    map: createRingTexture(),
    color: DEFAULT_SWEEP_PRESET.palette[0],
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Sprite(ringMaterial);
  ring.visible = false;
  group.add(ring);

  const glowMaterial = new THREE.SpriteMaterial({
    map: createGlowTexture(),
    color: DEFAULT_SWEEP_PRESET.palette[1],
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.visible = false;
  group.add(glow);

  const trailMaterial = new THREE.SpriteMaterial({
    map: createRibbonTexture(),
    color: DEFAULT_SWEEP_PRESET.palette[2],
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const trail = new THREE.Sprite(trailMaterial);
  trail.visible = false;
  group.add(trail);

  const ghostAMaterial = new THREE.SpriteMaterial({
    map: createRibbonTexture(),
    color: DEFAULT_SWEEP_PRESET.palette[1],
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ghostA = new THREE.Sprite(ghostAMaterial);
  ghostA.visible = false;
  group.add(ghostA);

  const ghostBMaterial = new THREE.SpriteMaterial({
    map: createRibbonTexture(),
    color: DEFAULT_SWEEP_PRESET.palette[3],
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ghostB = new THREE.Sprite(ghostBMaterial);
  ghostB.visible = false;
  group.add(ghostB);

  const sweepState = {
    startX: -280,
    endX: 280,
    startY: 0,
    endY: 0,
    z: -260,
    rotation: 0,
    coreLength: 140,
    trailLength: 176,
    ghostOffset: 4.4,
  };

  const styleState = { ...DEFAULT_SWEEP_PRESET };
  let life = 0;
  let cooldown = styleState.triggerCooldownMin;

  function hideAll() {
    ring.visible = false;
    glow.visible = false;
    trail.visible = false;
    ghostA.visible = false;
    ghostB.visible = false;
  }

  function applyPreset(preset = DEFAULT_SWEEP_PRESET) {
    Object.assign(styleState, DEFAULT_SWEEP_PRESET, preset);
  }

  function reset() {
    life = 0;
    cooldown = randomInRange(
      styleState.resetCooldownMin,
      styleState.resetCooldownMax,
    );
    hideAll();
  }

  function trigger() {
    life = styleState.duration;
    cooldown = randomInRange(
      styleState.triggerCooldownMin,
      styleState.triggerCooldownMax,
    );

    const palette = styleState.palette;
    const sweepColor = palette[randomInt(0, palette.length - 1)];
    const coreColor = 0xffffff;
    const direction = Math.random() > 0.5 ? 1 : -1;

    sweepState.startX =
      direction > 0 ? randomInRange(-330, -250) : randomInRange(250, 330);
    sweepState.endX =
      direction > 0 ? randomInRange(190, 320) : randomInRange(-320, -190);
    sweepState.startY = randomInRange(-120, 110);
    sweepState.endY =
      sweepState.startY +
      randomInRange(-84, 84) +
      direction * randomInRange(-10, 10);
    sweepState.z = randomInRange(-320, -220);
    sweepState.rotation = Math.atan2(
      sweepState.endY - sweepState.startY,
      sweepState.endX - sweepState.startX,
    );
    sweepState.coreLength =
      randomInRange(136, 196) * styleState.coreScale;
    sweepState.trailLength =
      (sweepState.coreLength + randomInRange(72, 118)) * styleState.trailScale;
    sweepState.ghostOffset = randomInRange(3.2, 5.6);

    group.position.set(sweepState.startX, sweepState.startY, sweepState.z);
    group.rotation.set(0, 0, sweepState.rotation);

    ringMaterial.color.set(sweepColor);
    glowMaterial.color.set(coreColor);
    trailMaterial.color.set(sweepColor);
    ghostAMaterial.color.set(palette[Math.min(1, palette.length - 1)]);
    ghostBMaterial.color.set(palette[Math.min(3, palette.length - 1)]);

    ring.scale.set(12 * styleState.coreScale, 12 * styleState.coreScale, 1);
    glow.scale.set(sweepState.coreLength, 4.8 * styleState.coreScale, 1);
    trail.scale.set(sweepState.trailLength, 2.1 * styleState.trailScale, 1);
    ghostA.scale.set(
      sweepState.trailLength * 0.72,
      1.15 * styleState.ghostScale,
      1,
    );
    ghostB.scale.set(
      sweepState.trailLength * 0.58,
      0.95 * styleState.ghostScale,
      1,
    );
    trail.position.set(0, 0, 0);
    ghostA.position.set(0, -sweepState.ghostOffset, 0);
    ghostB.position.set(0, sweepState.ghostOffset, 0);

    ring.material.opacity = 0.46 * styleState.opacity;
    glow.material.opacity = 0.2 * styleState.opacity;
    trail.material.opacity = 0.24 * styleState.opacity;
    ghostAMaterial.opacity = 0.1 * styleState.opacity;
    ghostBMaterial.opacity = 0.08 * styleState.opacity;
    glowMaterial.rotation = 0;
    trailMaterial.rotation = 0;
    ghostAMaterial.rotation = 0;
    ghostBMaterial.rotation = 0;

    ring.visible = true;
    glow.visible = true;
    trail.visible = true;
    ghostA.visible = true;
    ghostB.visible = true;
  }

  function update(delta) {
    if (life <= 0) {
      cooldown -= delta;
      if (cooldown <= 0) {
        trigger();
      }
    }

    if (life <= 0) {
      return;
    }

    life = Math.max(0, life - delta);
    const progress = 1 - life / styleState.duration;
    const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
    const fade = Math.sin(progress * Math.PI);
    const centerProtection = THREE.MathUtils.smoothstep(
      Math.hypot(group.position.x * 0.34, group.position.y),
      10,
      70,
    );
    const visibility =
      THREE.MathUtils.lerp(0.22, 0.9, centerProtection) *
      styleState.visibility;

    group.position.x = THREE.MathUtils.lerp(
      sweepState.startX,
      sweepState.endX,
      eased,
    );
    group.position.y = THREE.MathUtils.lerp(
      sweepState.startY,
      sweepState.endY,
      eased,
    );
    group.position.z = sweepState.z;

    ring.scale.set(
      (13 + fade * 4.2) * styleState.coreScale,
      (13 + fade * 4.2) * styleState.coreScale,
      1,
    );
    glow.scale.set(
      sweepState.coreLength + eased * 18,
      (4.8 + fade * 1.2) * styleState.coreScale,
      1,
    );
    trail.scale.set(
      sweepState.trailLength + eased * 26,
      (2.1 + fade * 0.45) * styleState.trailScale,
      1,
    );
    ghostA.scale.set(
      sweepState.trailLength * 0.72 + eased * 18,
      (1.15 + fade * 0.24) * styleState.ghostScale,
      1,
    );
    ghostB.scale.set(
      sweepState.trailLength * 0.58 + eased * 14,
      (0.95 + fade * 0.18) * styleState.ghostScale,
      1,
    );
    ghostA.position.y = -sweepState.ghostOffset;
    ghostB.position.y = sweepState.ghostOffset;

    ring.material.opacity = Math.min(1, fade * 0.46 * visibility * styleState.opacity);
    glow.material.opacity = Math.min(1, fade * 0.2 * visibility * styleState.opacity);
    trail.material.opacity = Math.min(
      1,
      Math.pow(fade, 0.9) * 0.24 * visibility * styleState.opacity,
    );
    ghostAMaterial.opacity = Math.min(
      1,
      Math.pow(fade, 1.05) * 0.1 * visibility * styleState.opacity,
    );
    ghostBMaterial.opacity = Math.min(
      1,
      Math.pow(fade, 1.1) * 0.08 * visibility * styleState.opacity,
    );

    if (life > 0) {
      return;
    }

    hideAll();
  }

  applyPreset();
  reset();

  return {
    applyPreset,
    reset,
    update,
  };
}
