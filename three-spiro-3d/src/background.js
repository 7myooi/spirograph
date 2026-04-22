import * as THREE from "three";

export const SCENE_FOG_COLOR = 0x050811;

function randomInRange(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

// 星やネビュラの前段として使う、空全体のグラデーション背景を描く。
function createBackdropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;

  const context = canvas.getContext("2d");
  // まずは夜空のベース色。上から下に向けて少しだけ色を変えて奥行きを出す。
  const baseGradient = context.createLinearGradient(0, 0, 0, 1024);
  baseGradient.addColorStop(0, "#02030d");
  baseGradient.addColorStop(0.42, "#0d1f42");
  baseGradient.addColorStop(0.78, "#081126");
  baseGradient.addColorStop(1, "#01040c");
  context.fillStyle = baseGradient;
  context.fillRect(0, 0, 1024, 1024);

  // ここから先は screen 合成にして、光を重ねる感覚で色を足していく。
  context.globalCompositeOperation = "screen";

  // 大きな光の塊をいくつか置いて、宇宙雲の下地を作る。
  const glowA = context.createRadialGradient(220, 180, 16, 220, 180, 360);
  glowA.addColorStop(0, "rgba(116, 184, 255, 0.58)");
  glowA.addColorStop(0.5, "rgba(46, 106, 255, 0.26)");
  glowA.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glowA;
  context.fillRect(0, 0, 1024, 1024);

  const glowB = context.createRadialGradient(810, 680, 14, 810, 680, 340);
  glowB.addColorStop(0, "rgba(80, 255, 236, 0.28)");
  glowB.addColorStop(0.45, "rgba(19, 122, 255, 0.2)");
  glowB.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glowB;
  context.fillRect(0, 0, 1024, 1024);

  const glowC = context.createRadialGradient(720, 220, 10, 720, 220, 280);
  glowC.addColorStop(0, "rgba(255, 94, 224, 0.28)");
  glowC.addColorStop(0.5, "rgba(130, 65, 255, 0.16)");
  glowC.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glowC;
  context.fillRect(0, 0, 1024, 1024);

  // 線形グラデーションで、オーロラのような筋をうっすら重ねる。
  const auroraA = context.createLinearGradient(120, 80, 640, 660);
  auroraA.addColorStop(0, "rgba(0, 255, 214, 0.12)");
  auroraA.addColorStop(0.4, "rgba(80, 138, 255, 0.08)");
  auroraA.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = auroraA;
  context.fillRect(0, 0, 1024, 1024);

  const auroraB = context.createLinearGradient(860, 40, 420, 860);
  auroraB.addColorStop(0, "rgba(255, 101, 236, 0.12)");
  auroraB.addColorStop(0.55, "rgba(94, 71, 255, 0.08)");
  auroraB.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = auroraB;
  context.fillRect(0, 0, 1024, 1024);

  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  for (let index = 0; index < 140; index += 1) {
    // 小さな輝点をランダムに散らして、背景テクスチャ自体にも粒感を入れる。
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = Math.random() * 2.4 + 0.3;
    context.globalAlpha = Math.random() * 0.28 + 0.04;
    context.fillRect(x, y, size, size);
  }
  context.globalAlpha = 1;

  const vignette = context.createRadialGradient(512, 512, 180, 512, 512, 620);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.14)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.44)");
  context.globalCompositeOperation = "source-over";
  context.fillStyle = vignette;
  context.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 星レイヤーは、奥行きと濃さを変えた point cloud として作る。
function createStarField(count, spreadX, spreadY, depth, color, size, opacity) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    // Z をマイナス側へ散らして、カメラの奥に星が広がるように置く。
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

// ネビュラは同じぼかしテクスチャを使い回し、色・大きさ・位置だけを変える。
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

// 背景全体をひとつのオブジェクトとして返して、main.js 側ではまとめて扱えるようにする。
export function createSpaceBackground() {
  const group = new THREE.Group();
  const backdropTexture = createBackdropTexture();
  const nebulaTexture = createNebulaTexture();

  // 遠景 / 中景 / アクセント / 夢っぽい粉 で役割を分けてレイヤーを作る。
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

  let time = 0;

  // 背景は主役を邪魔しないよう、ゆっくり漂う程度の動きに抑える。
  function update(delta) {
    // だいたい 60fps 基準になるよう、delta を係数へ変換して使う。
    const frame = delta * 60;
    time += 0.0024 * frame;

    // 星レイヤーは回転だけで十分に奥行き感が出る。
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

    // ネビュラは角度・位置・透明度を少しずつ揺らして、静止画感を消す。
    nebulaA.material.rotation += 0.00024 * frame;
    nebulaB.material.rotation -= 0.00016 * frame;
    nebulaC.material.rotation += 0.00011 * frame;
    nebulaD.material.rotation -= 0.00014 * frame;
    nebulaE.material.rotation += 0.00009 * frame;

    nebulaA.position.y = 72 + Math.sin(time * 1.1) * 6;
    nebulaB.position.x = 124 + Math.cos(time * 0.85) * 9;
    nebulaC.position.y = 118 + Math.sin(time * 0.7) * 5;
    nebulaD.position.x = -10 + Math.sin(time * 0.62) * 8;
    nebulaE.position.y = 82 + Math.cos(time * 0.92) * 7;

    nebulaA.material.opacity = 0.2 + (Math.sin(time * 1.3) + 1) * 0.03;
    nebulaB.material.opacity = 0.16 + (Math.cos(time * 1.1) + 1) * 0.025;
    nebulaC.material.opacity = 0.12 + (Math.sin(time * 0.95) + 1) * 0.022;
    nebulaD.material.opacity = 0.1 + (Math.cos(time * 0.8) + 1) * 0.02;
    nebulaE.material.opacity = 0.08 + (Math.sin(time * 1.45) + 1) * 0.018;
    dreamDustA.material.opacity = 0.08 + (Math.sin(time * 1.6) + 1) * 0.035;
    dreamDustB.material.opacity = 0.07 + (Math.cos(time * 1.3) + 1) * 0.03;
  }

  return {
    backdropTexture,
    group,
    update,
  };
}
