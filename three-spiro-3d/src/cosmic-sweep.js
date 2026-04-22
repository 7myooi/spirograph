import * as THREE from "three";

const effectPalette = [0xf6fbff, 0xbce8ff, 0x68c9ff, 0x239bff];
const duration = 0.82;

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

function randomInt(min, max) {
  return THREE.MathUtils.randInt(min, max);
}

// 重いジオメトリを使わず、やわらかいスプライトの重ね合わせで流星の筋を作る。
function createRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  // 中心だけ強く光る小さな円を描き、流星のヘッド光として使う。
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
  // 横長の発光帯を作って、進行方向に伸びるコアの光として使う。
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
  // より細い帯を作って、尾の筋や補助線として重ねる。
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

// この演出は背景空間に置いて、遠くを流れる宇宙の筋として見せる。
export function createCosmicSweep(parentGroup) {
  const group = new THREE.Group();
  parentGroup.add(group);

  // ヘッド光、コア、尾、補助線を別スプライトで持つと、調整しやすい。
  const ringMaterial = new THREE.SpriteMaterial({
    map: createRingTexture(),
    color: effectPalette[0],
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
    color: effectPalette[1],
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
    color: effectPalette[2],
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
    color: effectPalette[1],
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
    color: effectPalette[3],
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

  let life = 0;
  let cooldown = 3.6;

  function hideAll() {
    ring.visible = false;
    glow.visible = false;
    trail.visible = false;
    ghostA.visible = false;
    ghostB.visible = false;
  }

  function reset() {
    life = 0;
    // 連続しすぎないよう、次の発生までの待ち時間をランダムにする。
    cooldown = randomInRange(3.2, 5.4);
    hideAll();
  }

  // 背景の片側から反対側へ向かって、新しいストリークを発生させる。
  function trigger() {
    life = duration;
    cooldown = randomInRange(3.6, 6.2);

    const sweepColor = effectPalette[randomInt(0, effectPalette.length - 1)];
    const coreColor = 0xffffff;
    const direction = Math.random() > 0.5 ? 1 : -1;

    // 画面の中心から少し外した位置を通すことで、主役のスピログラフを邪魔しにくくする。
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
    // 長さや補助線の間隔も少し揺らして、毎回同じ見え方にならないようにする。
    sweepState.coreLength = randomInRange(136, 196);
    sweepState.trailLength =
      sweepState.coreLength + randomInRange(72, 118);
    sweepState.ghostOffset = randomInRange(3.2, 5.6);

    group.position.set(sweepState.startX, sweepState.startY, sweepState.z);
    group.rotation.set(0, 0, sweepState.rotation);

    ringMaterial.color.set(sweepColor);
    glowMaterial.color.set(coreColor);
    trailMaterial.color.set(sweepColor);
    ghostAMaterial.color.set(effectPalette[1]);
    ghostBMaterial.color.set(effectPalette[3]);

    ring.scale.set(12, 12, 1);
    glow.scale.set(sweepState.coreLength, 4.8, 1);
    trail.scale.set(sweepState.trailLength, 2.1, 1);
    ghostA.scale.set(sweepState.trailLength * 0.72, 1.15, 1);
    ghostB.scale.set(sweepState.trailLength * 0.58, 0.95, 1);
    trail.position.set(0, 0, 0);
    ghostA.position.set(0, -sweepState.ghostOffset, 0);
    ghostB.position.set(0, sweepState.ghostOffset, 0);

    ring.material.opacity = 0.46;
    glow.material.opacity = 0.2;
    trail.material.opacity = 0.24;
    ghostAMaterial.opacity = 0.1;
    ghostBMaterial.opacity = 0.08;
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

  // 時間に応じて伸びと透明度を変えて、速いけれど派手すぎない動きにする。
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
    const progress = 1 - life / duration;
    // smootherstep で進行を少しなめらかにして、急発進感を弱める。
    const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
    // フェードは 0 → 1 → 0 の山を作りたいので sin を使う。
    const fade = Math.sin(progress * Math.PI);
    // 中心を横切るときは visibility を下げて、主役にかぶりすぎないようにする。
    const centerProtection = THREE.MathUtils.smoothstep(
      Math.hypot(group.position.x * 0.34, group.position.y),
      10,
      70,
    );
    const visibility = THREE.MathUtils.lerp(0.22, 0.9, centerProtection);

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

    ring.scale.set(13 + fade * 4.2, 13 + fade * 4.2, 1);
    glow.scale.set(sweepState.coreLength + eased * 18, 4.8 + fade * 1.2, 1);
    trail.scale.set(sweepState.trailLength + eased * 26, 2.1 + fade * 0.45, 1);
    ghostA.scale.set(
      sweepState.trailLength * 0.72 + eased * 18,
      1.15 + fade * 0.24,
      1,
    );
    ghostB.scale.set(
      sweepState.trailLength * 0.58 + eased * 14,
      0.95 + fade * 0.18,
      1,
    );
    ghostA.position.y = -sweepState.ghostOffset;
    ghostB.position.y = sweepState.ghostOffset;

    ring.material.opacity = fade * 0.46 * visibility;
    glow.material.opacity = fade * 0.2 * visibility;
    trail.material.opacity = Math.pow(fade, 0.9) * 0.24 * visibility;
    ghostAMaterial.opacity = Math.pow(fade, 1.05) * 0.1 * visibility;
    ghostBMaterial.opacity = Math.pow(fade, 1.1) * 0.08 * visibility;

    if (life > 0) {
      return;
    }

    hideAll();
  }

  reset();

  return {
    reset,
    update,
  };
}
