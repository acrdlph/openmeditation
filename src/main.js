import * as THREE from "three";
import "./styles.css";

const canvas = document.querySelector("#world");
const launchButton = document.querySelector("#launchButton");
const query = new URLSearchParams(window.location.search);
const QA_MODE = query.has("qa");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0c1814, 0.0038);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(0, 18, 92);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: QA_MODE,
});
renderer.setPixelRatio(renderPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;

const EYE_HEIGHT = 18;
const START_POSITION = new THREE.Vector3(0, EYE_HEIGHT, 92);
const keys = new Set();
const velocity = new THREE.Vector3();
const moveIntent = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const temp = new THREE.Vector3();
const rng = mulberry32(20260615);

let previousFrameTime = performance.now() * 0.001;
let elapsedTime = 0;
let yaw = 0;
let pitch = -0.015;
let targetYaw = yaw;
let targetPitch = pitch;
let engaged = false;
let pointerDown = false;
let touchWalking = false;
let lastPointerX = 0;
let lastPointerY = 0;
let qaCaptured = false;

const palette = {
  stone: 0x1b211e,
  stoneLight: 0x313b35,
  darkWood: 0x241812,
  moss: 0x476946,
  leaf: 0x81c784,
  aqua: 0x8de8d7,
  amber: 0xf5c66f,
  lavender: 0xc8b7ff,
  rose: 0xd8899b,
  linen: 0xf7f1e4,
};

const materials = {
  corridorFloor: texturedStandard(createWovenTexture("#1b211e", "#323f37", "#0d1210"), {
    roughness: 0.92,
    metalness: 0.02,
  }),
  corridorWall: texturedStandard(createWallTexture(), {
    roughness: 0.86,
    metalness: 0.03,
  }),
  warmStone: new THREE.MeshStandardMaterial({
    color: 0x34352d,
    roughness: 0.84,
    metalness: 0.02,
  }),
  darkStone: new THREE.MeshStandardMaterial({
    color: palette.stone,
    roughness: 0.88,
    metalness: 0.02,
  }),
  moss: texturedStandard(createWovenTexture("#314f32", "#63865a", "#203126"), {
    roughness: 0.98,
    metalness: 0.01,
  }),
  wood: new THREE.MeshStandardMaterial({
    color: palette.darkWood,
    roughness: 0.72,
    metalness: 0.04,
  }),
  cushionForest: new THREE.MeshStandardMaterial({
    color: 0xa35c48,
    roughness: 0.86,
    metalness: 0.01,
  }),
  cushionWater: new THREE.MeshStandardMaterial({
    color: 0x263d57,
    roughness: 0.82,
    metalness: 0.02,
  }),
  cushionSky: new THREE.MeshStandardMaterial({
    color: 0x6d627f,
    roughness: 0.82,
    metalness: 0.02,
  }),
  water: new THREE.MeshStandardMaterial({
    color: 0x254f57,
    emissive: 0x153a44,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.58,
    roughness: 0.2,
    metalness: 0.28,
  }),
  glassAqua: glowMaterial(0x8de8d7, 1.7, 0.45),
  glassAmber: glowMaterial(0xf5c66f, 1.5, 0.42),
  glassLavender: glowMaterial(0xc8b7ff, 1.35, 0.4),
  leafGlow: glowMaterial(0x81c784, 1.0, 0.34),
};

const animated = {
  portals: [],
  lamps: [],
  water: [],
  drifting: [],
  clouds: [],
};

initScene();
applyQueryStart();
animate();

function initScene() {
  scene.add(createSky());
  initLights();
  createCorridor();
  createForestRoom();
  createWaterRoom();
  createSkyRoom();

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  document.addEventListener("pointerlockchange", updateLaunchVisibility);
  document.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", startWalking);
  launchButton.addEventListener("click", startWalking);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

function initLights() {
  scene.add(new THREE.HemisphereLight(0xcfe7db, 0x1b1410, 1.75));

  const corridorLight = new THREE.DirectionalLight(0xffdfb0, 1.85);
  corridorLight.position.set(-35, 74, 78);
  scene.add(corridorLight);

  const moonLight = new THREE.DirectionalLight(0xa6d8ff, 1.4);
  moonLight.position.set(70, 92, -220);
  scene.add(moonLight);
}

function createCorridor() {
  const corridor = new THREE.Group();
  scene.add(corridor);

  addBox(corridor, [54, 1, 340], [0, -0.5, -58], materials.corridorFloor);
  addBox(corridor, [58, 1.1, 112], [0, -0.48, -291], materials.corridorFloor);

  addSegmentedSideWall(corridor, -1, [{ center: 38, width: 42 }]);
  addSegmentedSideWall(corridor, 1, [{ center: -66, width: 42 }]);
  addEndWall(corridor);

  for (let z = 94; z > -222; z -= 38) {
    addBox(corridor, [58, 1.7, 2.2], [0, 31.2, z], materials.warmStone);
    addBox(corridor, [1.2, 25, 1.2], [-24, 12.5, z], materials.warmStone);
    addBox(corridor, [1.2, 25, 1.2], [24, 12.5, z], materials.warmStone);
    addCeilingLight(corridor, z - 13, z % 76 === 0 ? palette.aqua : palette.amber);
  }

  addDoorFrame(corridor, "left", new THREE.Vector3(-26.8, 12, 38), "forest", palette.leaf);
  addDoorFrame(corridor, "right", new THREE.Vector3(26.8, 12, -66), "water", palette.aqua);
  addDoorFrame(corridor, "front", new THREE.Vector3(0, 12, -225), "sky", palette.lavender);

  addPath([-25, 0.05, 38], [-88, 0.08, 38], 18, materials.moss);
  addPath([25, 0.05, -66], [88, 0.08, -66], 18, materials.darkStone);
  addPath([0, 0.05, -222], [0, 0.08, -292], 18, materials.warmStone);

  const plaque = createLabel("openmeditation.io", 34, 8, {
    background: "rgba(9, 13, 12, 0.55)",
    foreground: "#f7f1e4",
    border: "rgba(245, 198, 111, 0.34)",
    font: "38px serif",
  });
  plaque.position.set(0, 17.5, 113.9);
  plaque.rotation.y = Math.PI;
  corridor.add(plaque);
}

function addSegmentedSideWall(parent, side, openings) {
  const start = 112;
  const end = -226;
  let cursor = start;
  for (const opening of openings) {
    const openStart = opening.center + opening.width / 2;
    const openEnd = opening.center - opening.width / 2;
    addWallRun(parent, side, cursor, openStart);
    addBox(parent, [1.2, 7.5, opening.width], [side * 27, 28.2, opening.center], materials.corridorWall);
    cursor = openEnd;
  }
  addWallRun(parent, side, cursor, end);
}

function addWallRun(parent, side, zA, zB) {
  const length = Math.abs(zA - zB);
  if (length < 1) return;
  addBox(parent, [1.2, 32, length], [side * 27, 16, (zA + zB) * 0.5], materials.corridorWall);
}

function addEndWall(parent) {
  addBox(parent, [17, 32, 1.2], [-22, 16, -226], materials.corridorWall);
  addBox(parent, [17, 32, 1.2], [22, 16, -226], materials.corridorWall);
  addBox(parent, [36, 7.5, 1.2], [0, 28.2, -226], materials.corridorWall);
}

function addDoorFrame(parent, orientation, position, label, color) {
  const frame = new THREE.Group();
  frame.position.copy(position);
  parent.add(frame);

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3d392e,
    roughness: 0.62,
    metalness: 0.05,
    emissive: color,
    emissiveIntensity: 0.08,
  });
  const portalMat = glowMaterial(color, 1.25, 0.23);

  const verticalSize = orientation === "front" ? [2.3, 26, 2.3] : [2.3, 26, 2.3];
  const topSize = orientation === "front" ? [40, 2.3, 2.3] : [2.3, 2.3, 40];
  const leftPos = orientation === "front" ? [-19, 0, 0] : [0, 0, -19];
  const rightPos = orientation === "front" ? [19, 0, 0] : [0, 0, 19];
  const topPos = [0, 13.5, 0];

  addBox(frame, verticalSize, leftPos, frameMat);
  addBox(frame, verticalSize, rightPos, frameMat);
  addBox(frame, topSize, topPos, frameMat);

  const portalSize = orientation === "front" ? [32, 22] : [36, 22];
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(portalSize[0], portalSize[1]), portalMat);
  portal.position.y = 1.5;
  if (orientation === "left") {
    portal.rotation.y = Math.PI / 2;
    portal.position.x = -0.25;
  } else if (orientation === "right") {
    portal.rotation.y = -Math.PI / 2;
    portal.position.x = 0.25;
  } else {
    portal.rotation.y = 0;
    portal.position.z = -0.25;
  }
  frame.add(portal);
  animated.portals.push({ mesh: portal, baseOpacity: portalMat.opacity, phase: rng() * Math.PI * 2 });

  const doorLight = new THREE.PointLight(color, 18, 82, 2.1);
  doorLight.position.y = 5.5;
  if (orientation === "left") doorLight.position.x = 6;
  if (orientation === "right") doorLight.position.x = -6;
  if (orientation === "front") doorLight.position.z = 6;
  frame.add(doorLight);

  const sign = createLabel(label, 19, 5.2, {
    background: "rgba(8, 11, 10, 0.48)",
    foreground: "#f7f1e4",
    border: "rgba(255,255,255,0.16)",
    font: "34px serif",
  });
  sign.position.y = 19;
  if (orientation === "left") {
    sign.rotation.y = Math.PI / 2;
    sign.position.x = 0.72;
  } else if (orientation === "right") {
    sign.rotation.y = -Math.PI / 2;
    sign.position.x = -0.72;
  } else {
    sign.position.z = 0.72;
  }
  frame.add(sign);
}

function addCeilingLight(parent, z, color) {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(18, 0.24, 1.3), glowBasic(color, 0.72));
  panel.position.set(0, 29.6, z);
  parent.add(panel);

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, 6), glowBasic(color, 0.16));
  glow.position.set(0, 29.2, z);
  glow.rotation.x = Math.PI / 2;
  parent.add(glow);

  const light = new THREE.PointLight(color, 10, 62, 2);
  light.position.set(0, 25, z);
  parent.add(light);
}

function createForestRoom() {
  const room = new THREE.Group();
  room.position.set(-122, 0, 38);
  scene.add(room);

  addDisc(room, 74, 0.9, [0, 0, 0], materials.moss);
  addRingStones(room, 70, palette.stoneLight, 16);

  for (let i = 0; i < 22; i += 1) {
    const angle = (i / 22) * Math.PI * 2 + rng() * 0.12;
    const radius = 43 + rng() * 28;
    const tree = createTree(14 + rng() * 12, 25 + rng() * 20);
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    tree.rotation.y = rng() * Math.PI * 2;
    room.add(tree);
  }

  const cushion = createCushion(materials.cushionForest);
  cushion.position.set(0, 1.2, 0);
  room.add(cushion);

  const mat = new THREE.Mesh(new THREE.CircleGeometry(20, 64), new THREE.MeshBasicMaterial({
    color: 0xf5c66f,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.y = 0.08;
  room.add(mat);

  for (let i = 0; i < 11; i += 1) {
    const lamp = createHangingLamp(palette.amber);
    const angle = (i / 11) * Math.PI * 2;
    lamp.position.set(Math.cos(angle) * 34, 20 + rng() * 9, Math.sin(angle) * 34);
    room.add(lamp);
  }

}

function createWaterRoom() {
  const room = new THREE.Group();
  room.position.set(122, 0, -66);
  scene.add(room);

  addDisc(room, 74, 0.9, [0, 0, 0], materials.darkStone);
  addRingStones(room, 70, 0x314353, 18);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(45, 45, 0.45, 96), materials.water);
  basin.position.y = 0.35;
  room.add(basin);
  animated.water.push({ mesh: basin, phase: 0 });

  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0x51463a,
    roughness: 0.76,
    metalness: 0.03,
  });
  addBox(room, [12, 1.2, 88], [0, 1.0, 0], bridgeMat);
  addBox(room, [88, 1.2, 12], [0, 1.05, 0], bridgeMat);

  const cushion = createCushion(materials.cushionWater);
  cushion.position.set(0, 2.0, 0);
  room.add(cushion);

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const column = new THREE.Group();
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x40505b,
      roughness: 0.78,
      metalness: 0.05,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 30, 10), columnMat);
    shaft.position.y = 15;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1.6, 12), columnMat);
    cap.position.y = 30.8;
    column.add(shaft, cap);
    column.position.set(Math.cos(angle) * 58, 0, Math.sin(angle) * 58);
    room.add(column);
  }

  for (let i = 0; i < 10; i += 1) {
    const lamp = createStandingLantern(palette.aqua);
    const angle = (i / 10) * Math.PI * 2 + 0.2;
    lamp.position.set(Math.cos(angle) * 33, 1, Math.sin(angle) * 33);
    room.add(lamp);
  }

}

function createSkyRoom() {
  const room = new THREE.Group();
  room.position.set(0, 0, -340);
  scene.add(room);

  addDisc(room, 82, 0.9, [0, 0, 0], new THREE.MeshStandardMaterial({
    color: 0x373247,
    roughness: 0.8,
    metalness: 0.04,
  }));
  addRingStones(room, 78, 0x544d66, 14);

  const inner = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 1.3, 72), new THREE.MeshStandardMaterial({
    color: 0x5b6474,
    roughness: 0.7,
    metalness: 0.06,
  }));
  inner.position.y = 1.0;
  room.add(inner);

  const cushion = createCushion(materials.cushionSky);
  cushion.position.set(0, 2.4, 0);
  room.add(cushion);

  for (let i = 0; i < 6; i += 1) {
    const arch = createSkyArch();
    const angle = (i / 6) * Math.PI * 2;
    arch.position.set(Math.cos(angle) * 47, 0, Math.sin(angle) * 47);
    arch.rotation.y = -angle + Math.PI / 2;
    room.add(arch);
  }

  const cloudTexture = createCloudTexture();
  for (let i = 0; i < 24; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTexture,
      color: new THREE.Color().setHSL(0.58 + rng() * 0.12, 0.34, 0.72),
      transparent: true,
      opacity: 0.16 + rng() * 0.15,
      depthWrite: false,
    }));
    const angle = rng() * Math.PI * 2;
    const radius = 40 + rng() * 80;
    sprite.position.set(Math.cos(angle) * radius, 18 + rng() * 38, Math.sin(angle) * radius);
    const size = 26 + rng() * 46;
    sprite.scale.set(size, size * (0.28 + rng() * 0.18), 1);
    room.add(sprite);
    animated.clouds.push({ sprite, phase: rng() * Math.PI * 2, radius });
  }

}

function applyQueryStart() {
  if (!QA_MODE) return;

  const room = query.get("room");
  const starts = {
    forest: [-122, 72],
    water: [122, -28],
    sky: [0, -300],
  };
  const start = starts[room];
  if (!start) return;

  camera.position.set(start[0], EYE_HEIGHT, start[1]);
  yaw = 0;
  pitch = -0.03;
  targetYaw = yaw;
  targetPitch = pitch;
  velocity.set(0, 0, 0);
}

function createTree(trunkHeight, leafHeight) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.8, trunkHeight, 8),
    materials.wood,
  );
  trunk.position.y = trunkHeight / 2;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.29 + rng() * 0.05, 0.36, 0.36 + rng() * 0.1),
    roughness: 0.92,
    metalness: 0.01,
    emissive: 0x18351f,
    emissiveIntensity: 0.2,
  });
  for (let i = 0; i < 3; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(8.5 - i * 1.4, leafHeight - i * 5, 8), leafMat);
    leaf.position.y = trunkHeight + 8 + i * 6;
    leaf.rotation.y = rng() * Math.PI * 2;
    tree.add(leaf);
  }
  return tree;
}

function createCushion(material) {
  const cushion = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 2.4, 48), material);
  base.scale.z = 0.78;
  const top = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.45, 12, 48), material);
  top.rotation.x = Math.PI / 2;
  top.position.y = 1.25;
  cushion.add(base, top);
  return cushion;
}

function createHangingLamp(color) {
  const lamp = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 6), materials.wood);
  cord.position.y = 3.5;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.2, 3, 8), glowMaterial(color, 1.2, 0.56));
  shade.position.y = -1.2;
  const light = new THREE.PointLight(color, 9, 50, 1.8);
  light.position.y = -1.4;
  lamp.add(cord, shade, light);
  animated.lamps.push({ mesh: shade, light, phase: rng() * Math.PI * 2, base: 0.85 + rng() * 0.4 });
  return lamp;
}

function createStandingLantern(color) {
  const lamp = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x182327,
    roughness: 0.6,
    metalness: 0.28,
  });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 10, 8), standMat);
  post.position.y = 5;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.2, 10), glowMaterial(color, 1.45, 0.42));
  shade.position.y = 9;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.4, 10), standMat);
  cap.position.y = 11.3;
  const light = new THREE.PointLight(color, 13, 54, 1.9);
  light.position.y = 9;
  lamp.add(post, shade, cap, light);
  animated.lamps.push({ mesh: shade, light, phase: rng() * Math.PI * 2, base: 1.0 + rng() * 0.3 });
  return lamp;
}

function createSkyArch() {
  const arch = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4b465b,
    roughness: 0.7,
    metalness: 0.04,
    emissive: palette.lavender,
    emissiveIntensity: 0.06,
  });
  addBox(arch, [2.4, 28, 2.4], [-9, 14, 0], mat);
  addBox(arch, [2.4, 28, 2.4], [9, 14, 0], mat);
  addBox(arch, [21, 2.4, 2.4], [0, 28, 0], mat);
  return arch;
}

function addRingStones(parent, radius, color, count) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0.02,
  });
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(8 + rng() * 8, 3 + rng() * 9, 5 + rng() * 8), mat);
    stone.position.set(Math.cos(angle) * radius, stone.geometry.parameters.height / 2, Math.sin(angle) * radius);
    stone.rotation.y = -angle + rng() * 0.28;
    parent.add(stone);
  }
}

function addPath(start, end, width, material) {
  const sx = start[0];
  const sz = start[2];
  const ex = end[0];
  const ez = end[2];
  const dx = ex - sx;
  const dz = ez - sz;
  const length = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.36, length), material);
  mesh.position.set((sx + ex) * 0.5, start[1], (sz + ez) * 0.5);
  mesh.rotation.y = Math.atan2(dx, dz);
  scene.add(mesh);
}

function addDisc(parent, radius, height, position, material) {
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96), material);
  disc.position.set(position[0], position[1], position[2]);
  parent.add(disc);
  return disc;
}

function addBox(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
  return mesh;
}

function createSky() {
  const geometry = new THREE.SphereGeometry(760, 40, 24);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x172138) },
      midColor: { value: new THREE.Color(0x1b4039) },
      bottomColor: { value: new THREE.Color(0x060807) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        vec3 lower = mix(bottomColor, midColor, smoothstep(0.08, 0.58, h));
        vec3 color = mix(lower, topColor, smoothstep(0.46, 1.0, h));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  return new THREE.Mesh(geometry, material);
}

function createLabel(text, width, height, options = {}) {
  const canvas2d = document.createElement("canvas");
  canvas2d.width = 768;
  canvas2d.height = 192;
  const ctx = canvas2d.getContext("2d");
  ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
  ctx.fillStyle = options.background ?? "rgba(0,0,0,0.45)";
  roundRect(ctx, 14, 14, canvas2d.width - 28, canvas2d.height - 28, 20);
  ctx.fill();
  ctx.strokeStyle = options.border ?? "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = options.font ?? "40px serif";
  ctx.fillStyle = options.foreground ?? "#f7f1e4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas2d.width / 2, canvas2d.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas2d);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

function createCloudTexture() {
  const size = 192;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const forms = [
    [0.5, 0.52, 0.5, 0.82],
    [0.35, 0.54, 0.32, 0.48],
    [0.65, 0.48, 0.36, 0.48],
    [0.52, 0.38, 0.28, 0.36],
  ];
  for (const [x, y, radius, alpha] of forms) {
    const gradient = ctx.createRadialGradient(x * size, y * size, 0, x * size, y * size, radius * size);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.6, `rgba(208,232,255,${alpha * 0.36})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWovenTexture(base, thread, shadow) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 8) {
    ctx.fillStyle = i % 16 === 0 ? thread : shadow;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(i, 0, 2, size);
    ctx.fillRect(0, i, size, 2);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

function createWallTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1b211e";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 36) {
    for (let x = 0; x < size; x += 54) {
      const offset = y % 72 === 0 ? 0 : 27;
      ctx.fillStyle = `rgba(${44 + rng() * 24}, ${52 + rng() * 24}, ${48 + rng() * 24}, 0.55)`;
      ctx.fillRect((x + offset) % size, y, 50, 32);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.strokeRect((x + offset) % size, y, 50, 32);
    }
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

function texturedStandard(texture, options) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: options.roughness,
    metalness: options.metalness,
  });
}

function glowMaterial(color, intensity, opacity) {
  return new THREE.MeshStandardMaterial({
    color: 0x0c1010,
    emissive: color,
    emissiveIntensity: intensity,
    transparent: true,
    opacity,
    roughness: 0.2,
    metalness: 0.05,
    depthWrite: false,
  });
}

function glowBasic(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function animate() {
  const now = performance.now() * 0.001;
  const dt = Math.min(now - previousFrameTime, 0.033);
  previousFrameTime = now;
  elapsedTime += dt;

  updateMovement(dt);
  updateAtmosphere(dt, elapsedTime);
  updateRoomLight();
  publishState();
  renderer.render(scene, camera);
  captureQaFrame();

  requestAnimationFrame(animate);
}

function publishState() {
  canvas.dataset.elapsed = elapsedTime.toFixed(2);
  canvas.dataset.room = currentRoomName();
  canvas.dataset.x = camera.position.x.toFixed(2);
  canvas.dataset.z = camera.position.z.toFixed(2);
}

function captureQaFrame() {
  if (!QA_MODE || qaCaptured) return;
  qaCaptured = true;

  const gl = renderer.getContext();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  let sampled = 0;
  let nonDark = 0;
  let sum = 0;
  let sumSq = 0;
  let min = 255;
  let max = 0;
  const stride = Math.max(1, Math.floor((width * height) / 12000));
  for (let p = 0; p < width * height; p += stride) {
    const i = p * 4;
    const lum = pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
    sampled += 1;
    if (lum > 8) nonDark += 1;
    sum += lum;
    sumSq += lum * lum;
    min = Math.min(min, lum);
    max = Math.max(max, lum);
  }
  const mean = sum / sampled;

  canvas.dataset.pixelWidth = String(width);
  canvas.dataset.pixelHeight = String(height);
  canvas.dataset.pixelSampled = String(sampled);
  canvas.dataset.pixelNonDarkRatio = (nonDark / sampled).toFixed(4);
  canvas.dataset.pixelMean = mean.toFixed(2);
  canvas.dataset.pixelVariance = (sumSq / sampled - mean * mean).toFixed(2);
  canvas.dataset.pixelMin = min.toFixed(2);
  canvas.dataset.pixelMax = max.toFixed(2);

  const preview = document.createElement("img");
  preview.id = "qaCanvasFrame";
  preview.hidden = true;
  preview.alt = "QA canvas frame";
  preview.src = canvas.toDataURL("image/jpeg", 0.88);
  document.body.appendChild(preview);
}

function updateMovement(dt) {
  const locked = document.pointerLockElement === canvas;
  const turn = axis("ArrowRight", "ArrowLeft");
  targetYaw -= turn * dt * 1.35;
  yaw = THREE.MathUtils.damp(yaw, targetYaw, 18, dt);

  const forwardAxis = axis("KeyW", "KeyS") + axis("ArrowUp", "ArrowDown") + Number(touchWalking);
  const sideAxis = axis("KeyD", "KeyA");
  moveIntent.set(0, 0, 0);

  const yawOnly = new THREE.Euler(0, yaw, 0, "YXZ");
  forward.set(0, 0, -1).applyEuler(yawOnly);
  right.set(1, 0, 0).applyEuler(yawOnly);
  moveIntent.addScaledVector(forward, forwardAxis);
  moveIntent.addScaledVector(right, sideAxis);

  const moving = moveIntent.lengthSq() > 0.001;
  if (moving) moveIntent.normalize();

  const walkSpeed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 170 : 96;
  temp.copy(moveIntent).multiplyScalar(walkSpeed);
  velocity.x = THREE.MathUtils.damp(velocity.x, temp.x, 11.5, dt);
  velocity.z = THREE.MathUtils.damp(velocity.z, temp.z, 11.5, dt);

  const nextX = camera.position.x + velocity.x * dt;
  const nextZ = camera.position.z + velocity.z * dt;
  moveIfWalkable(nextX, camera.position.z);
  moveIfWalkable(camera.position.x, nextZ);

  const bob = moving ? 0 : Math.sin(elapsedTime * 0.55) * 0.025;
  camera.position.y = EYE_HEIGHT + bob;

  if (!locked && !pointerDown) {
    targetPitch = THREE.MathUtils.damp(targetPitch, -0.02 + Math.sin(elapsedTime * 0.2) * 0.008, 1.2, dt);
  }
  targetPitch = THREE.MathUtils.clamp(targetPitch, -0.5, 0.42);
  pitch = THREE.MathUtils.damp(pitch, targetPitch, 18, dt);
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
}

function moveIfWalkable(x, z) {
  if (isWalkable(x, z)) {
    camera.position.x = x;
    camera.position.z = z;
  }
}

function isWalkable(x, z) {
  const inCorridor = x > -24.5 && x < 24.5 && z < 113 && z > -228;
  const leftPassage = x < -21 && x > -128 && z > 12 && z < 64;
  const rightPassage = x > 21 && x < 128 && z > -92 && z < -40;
  const endPassage = x > -22 && x < 22 && z < -224 && z > -346;
  const forest = distance2(x, z, -122, 38) < 71 * 71;
  const water = distance2(x, z, 122, -66) < 71 * 71;
  const sky = distance2(x, z, 0, -340) < 80 * 80;
  return inCorridor || leftPassage || rightPassage || endPassage || forest || water || sky;
}

function currentRoomName() {
  const { x, z } = camera.position;
  if (distance2(x, z, -122, 38) < 72 * 72) return "forest";
  if (distance2(x, z, 122, -66) < 72 * 72) return "water";
  if (distance2(x, z, 0, -340) < 82 * 82) return "sky";
  return "corridor";
}

function updateAtmosphere(dt, elapsed) {
  for (const portal of animated.portals) {
    portal.mesh.material.opacity = portal.baseOpacity + Math.sin(elapsed * 0.7 + portal.phase) * 0.045;
  }

  for (const lamp of animated.lamps) {
    const pulse = lamp.base + Math.sin(elapsed * 1.2 + lamp.phase) * 0.18;
    lamp.mesh.material.emissiveIntensity = pulse;
    lamp.light.intensity = 9 + pulse * 4;
  }

  for (const water of animated.water) {
    water.mesh.rotation.y += dt * 0.08;
    water.mesh.material.opacity = 0.54 + Math.sin(elapsed * 0.55 + water.phase) * 0.04;
    water.mesh.material.emissiveIntensity = 0.64 + Math.sin(elapsed * 0.9) * 0.1;
  }

  for (const cloud of animated.clouds) {
    cloud.sprite.position.x += Math.sin(elapsed * 0.16 + cloud.phase) * dt * 0.45;
    cloud.sprite.position.z += Math.cos(elapsed * 0.14 + cloud.phase) * dt * 0.36;
  }

}

function updateRoomLight() {
  const room = currentRoomName();
  if (room === "forest") {
    scene.fog.color.lerp(new THREE.Color(0x09130c), 0.025);
  } else if (room === "water") {
    scene.fog.color.lerp(new THREE.Color(0x07121a), 0.025);
  } else if (room === "sky") {
    scene.fog.color.lerp(new THREE.Color(0x0d0c19), 0.025);
  } else {
    scene.fog.color.lerp(new THREE.Color(0x08110f), 0.025);
  }
}

function onKeyDown(event) {
  keys.add(event.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "KeyR") {
    camera.position.copy(START_POSITION);
    yaw = 0;
    pitch = -0.015;
    targetYaw = yaw;
    targetPitch = pitch;
    velocity.set(0, 0, 0);
  }
}

function startWalking() {
  engaged = true;
  launchButton.classList.add("is-hidden");
  const lockRequest = canvas.requestPointerLock?.();
  lockRequest?.catch?.(() => {});
}

function updateLaunchVisibility() {
  if (document.pointerLockElement === canvas || engaged) {
    launchButton.classList.add("is-hidden");
  } else {
    launchButton.classList.remove("is-hidden");
  }
}

function onMouseMove(event) {
  if (document.pointerLockElement !== canvas) return;
  targetYaw -= event.movementX * 0.00155;
  targetPitch -= event.movementY * 0.0012;
}

function onPointerDown(event) {
  pointerDown = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  if (event.pointerType === "touch") {
    engaged = true;
    touchWalking = true;
    launchButton.classList.add("is-hidden");
  }
}

function onPointerMove(event) {
  if (!pointerDown || document.pointerLockElement === canvas) return;
  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  targetYaw -= dx * 0.0034;
  targetPitch -= dy * 0.0021;
}

function onPointerUp() {
  pointerDown = false;
  touchWalking = false;
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(renderPixelRatio());
}

function renderPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 1.55);
}

function axis(positive, negative) {
  return Number(keys.has(positive)) - Number(keys.has(negative));
}

function distance2(x, z, cx, cz) {
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz;
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
