// Pine Bridge fight. World forward is -Z. Squad z = -distance.
// The chase camera sits on +Z, so screen-right is world +X.

import * as THREE from "three";
import {
  ADVANCE,
  RENDER_CAP,
  SIM_CAP,
  STEER_MAX,
  WEAPONS,
  SCRIPT,
  applyGate,
  boberReward,
  clampLane,
  formationOffsets,
  formationRadius,
  freshGate,
  gateBlue,
  gateLabel,
  selfTestRules,
  shootGate,
  shownCount,
  squadDmgMul,
  starsFor,
  tierAfterPickup,
  weaponMods,
} from "./rules.js?v=br0";
import {
  animToon,
  attachOutline,
  blobTexture,
  digitMaterial,
  drawWeaponIcon,
  makeSign,
  paintCrateFace,
  paintSign,
  toon,
  writeLog,
  writeQuat,
  writeTRS,
} from "./mats.js?v=br0";
import {
  buildBeetle,
  buildBober,
  buildBoss,
  buildBrute,
  buildCrateGeo,
  buildGateFrame,
  buildPedestal,
  buildRat,
  buildSoldier,
  bulletGeo,
  logGeo,
  quadGeo,
} from "./build.js?v=br0";

const CAP = 320;
const BULLETS = 400;
const PUFFS = 256;
const FLOATS = 40;
const GLYPHS = FLOATS * 4;
const CORE = 0.75;

const KINDS = [
  { hp: 20, speed: 5, bite: 1, rad: 0.48, lat: 2.3, y: 0.46 },
  { hp: 60, speed: 3.5, bite: 2, rad: 0.58, lat: 1.5, y: 0.5 },
  { hp: 400, speed: 2.5, bite: 5, rad: 1.12, lat: 1.8, y: 0.95 },
];

const TIER_NAMES = ["", "Wood", "Stone", "Iron"];
const TIER_COLORS = ["", "#8B5A2B", "#8E99A4", "#6E8EAE"];

function lin(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

export function createPlay(scene, camera, audio) {
  const soldierBuilt = buildSoldier();
  const boberBuilt = buildBober();
  const ratBuilt = buildRat();
  const beetleBuilt = buildBeetle();
  const bruteBuilt = buildBrute();
  const bossBuilt = buildBoss();
  const tris = {
    soldier: soldierBuilt.tris,
    bober: boberBuilt.tris,
    boss: bossBuilt.tris,
  };

  const soldierPhase = new Float32Array(RENDER_CAP);
  const soldierHit = new Float32Array(RENDER_CAP);
  for (let i = 0; i < RENDER_CAP; i++) soldierPhase[i] = i * 0.71;
  soldierBuilt.geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(soldierPhase, 1));
  soldierBuilt.geo.setAttribute("aHit", new THREE.InstancedBufferAttribute(soldierHit, 1));
  const soldiers = new THREE.InstancedMesh(soldierBuilt.geo, animToon(), RENDER_CAP);
  soldiers.frustumCulled = false;
  soldiers.count = 0;
  soldiers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(soldiers);

  const boberN = boberBuilt.geo.getAttribute("position").count;
  boberBuilt.geo.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(boberN), 1));
  boberBuilt.geo.setAttribute("aHit", new THREE.BufferAttribute(new Float32Array(boberN), 1));
  const bober = new THREE.Mesh(boberBuilt.geo, animToon());
  bober.frustumCulled = false;
  attachOutline(bober, 0.045);
  scene.add(bober);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.23;
  shadow.renderOrder = -1;
  scene.add(shadow);

  function makeEnemy(built) {
    const phase = new Float32Array(CAP);
    const hit = new Float32Array(CAP);
    built.geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    built.geo.setAttribute("aHit", new THREE.InstancedBufferAttribute(hit, 1));
    const mesh = new THREE.InstancedMesh(built.geo, animToon(), CAP);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    const free = new Int16Array(CAP);
    for (let i = 0; i < CAP; i++) free[i] = i;
    return {
      alive: new Uint8Array(CAP),
      x: new Float32Array(CAP),
      z: new Float32Array(CAP),
      hp: new Float32Array(CAP),
      phase,
      hit,
      biteAcc: new Float32Array(CAP),
      freeze: new Uint8Array(CAP),
      free,
      freeN: CAP,
      mesh,
      phaseAttr: built.geo.getAttribute("aPhase"),
      hitAttr: built.geo.getAttribute("aHit"),
    };
  }

  const pools = [makeEnemy(ratBuilt), makeEnemy(beetleBuilt), makeEnemy(bruteBuilt)];

  const bulletCols = [lin("#F4E6C3"), lin("#F5C400"), lin("#E86A1A")];
  const ball = new THREE.InstancedMesh(
    bulletGeo(),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    BULLETS
  );
  ball.frustumCulled = false;
  ball.count = 0;
  ball.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const white = new THREE.Color("#ffffff");
  for (let i = 0; i < 8; i++) ball.setColorAt(i, white);
  scene.add(ball);

  const logs = new THREE.InstancedMesh(logGeo(), toon("#8B5A2B"), 160);
  logs.frustumCulled = false;
  logs.count = 0;
  logs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(logs);

  const puffCol = [
    lin("#6A4A32"),
    lin("#3E7C52"),
    lin("#F4E6C3"),
    lin("#C4A882"),
    lin("#F5C400"),
    lin("#4FC3FF"),
    lin("#FF4F5E"),
    lin("#E86A1A"),
    lin("#F5C400"),
  ];
  const puffs = new THREE.InstancedMesh(
    quadGeo(),
    new THREE.MeshBasicMaterial({
      map: blobTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
    PUFFS
  );
  puffs.frustumCulled = false;
  puffs.count = 0;
  puffs.renderOrder = 2;
  for (let i = 0; i < 4; i++) puffs.setColorAt(i, white);
  scene.add(puffs);

  const digits = new THREE.InstancedMesh(quadGeo(), digitMaterial(), GLYPHS);
  digits.frustumCulled = false;
  digits.count = 0;
  digits.renderOrder = 3;
  const digitAttr = new Float32Array(GLYPHS);
  digits.geometry.setAttribute("aDigit", new THREE.InstancedBufferAttribute(digitAttr, 1));
  scene.add(digits);

  const frameGeo = buildGateFrame();
  const gateFrame = new THREE.InstancedMesh(frameGeo, toon("#ffffff", { vertexColors: true }), 6);
  const gateOutline = new THREE.InstancedMesh(frameGeo, outlineGate(0.03), 6);
  const gatePanel = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(2.55, 1.4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    6
  );
  const gateRim = new THREE.InstancedMesh(
    new THREE.TorusGeometry(1, 0.055, 6, 18),
    new THREE.MeshBasicMaterial({ color: 0xe6c15a, toneMapped: false }),
    6
  );
  for (const m of [gateFrame, gateOutline, gatePanel, gateRim]) {
    m.frustumCulled = false;
    m.count = 6;
    scene.add(m);
  }
  const blueC = new THREE.Color("#4FC3FF");
  const redC = new THREE.Color("#FF4F5E");
  for (let i = 0; i < 6; i++) gatePanel.setColorAt(i, blueC);

  const signs = [];
  for (let i = 0; i < 6; i++) {
    const sign = makeSign();
    const mat = new THREE.MeshBasicMaterial({
      map: sign.tex,
      transparent: true,
      alphaTest: 0.06,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.35), mat);
    mesh.renderOrder = 2;
    scene.add(mesh);
    signs.push({ mesh, canvas: sign.canvas, ctx: sign.ctx, tex: sign.tex });
  }

  function outlineGate(push) {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uPush: { value: push } },
      vertexShader: `
        uniform float uPush;
        void main() {
          vec3 p = position + normal * uPush;
          vec4 mv = vec4(p, 1.0);
          #ifdef USE_INSTANCING
            mv = instanceMatrix * mv;
          #endif
          gl_Position = projectionMatrix * modelViewMatrix * mv;
        }
      `,
      fragmentShader: `void main() { gl_FragColor = vec4(0.118, 0.078, 0.063, 1.0); }`,
    });
  }

  const crateGeo = buildCrateGeo();
  const crates = [];
  const crateSpec = [
    { weapon: "smg", hp: 480, at: 155 },
    { weapon: "log", hp: 968, at: 590 },
  ];
  for (let i = 0; i < crateSpec.length; i++) {
    const spec = crateSpec[i];
    const mesh = new THREE.Mesh(crateGeo, toon("#ffffff", { vertexColors: true }));
    attachOutline(mesh, 0.03);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(3.05, 1.52),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1, toneMapped: false })
    );
    face.position.set(0, 1.05, 1.18);
    mesh.add(face);
    scene.add(mesh);
    crates.push({
      mesh,
      canvas,
      ctx,
      tex,
      weapon: spec.weapon,
      max: spec.hp,
      hp: spec.hp,
      z: -spec.at,
      x: 0,
      state: "idle",
      shake: 0,
      dirty: 1,
    });
  }

  const rackZ = -345;
  const rackSlots = [
    { id: "shot", bonus: 0, x: -3.2 },
    { id: "smg", bonus: 0, x: 0 },
    { id: "pistol", bonus: 1, x: 3.2 },
  ];
  const rack = new THREE.Group();
  const ped = new THREE.InstancedMesh(buildPedestal(), toon("#C8B49A"), 3);
  ped.frustumCulled = false;
  ped.count = 3;
  rack.add(ped);
  const pedM = ped.instanceMatrix.array;
  const rackChips = [];
  for (let i = 0; i < 3; i++) {
    writeTRS(pedM, i, rackSlots[i].x, 0, rackZ, 0, 1, 1, 1);
    const iconC = document.createElement("canvas");
    iconC.width = 256;
    iconC.height = 256;
    const ig = iconC.getContext("2d");
    ig.fillStyle = "#F4E6C3";
    ig.beginPath();
    ig.arc(128, 128, 112, 0, Math.PI * 2);
    ig.fill();
    drawWeaponIcon(ig, rackSlots[i].id, 128, 136, 150);
    const iconTex = new THREE.CanvasTexture(iconC);
    iconTex.colorSpace = THREE.SRGBColorSpace;
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ map: iconTex, toneMapped: false, transparent: true })
    );
    icon.position.set(rackSlots[i].x, 1.82, rackZ + 0.35);
    rack.add(icon);
    const name = makeSign();
    paintSign(name.ctx, name.canvas, WEAPONS[rackSlots[i].id].name);
    name.tex.needsUpdate = true;
    const nameMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 0.52),
      new THREE.MeshBasicMaterial({ map: name.tex, transparent: true, alphaTest: 0.05, toneMapped: false })
    );
    nameMesh.position.set(rackSlots[i].x, 2.62, rackZ + 0.2);
    rack.add(nameMesh);
    const chipC = document.createElement("canvas");
    chipC.width = 256;
    chipC.height = 96;
    const chipCtx = chipC.getContext("2d");
    const chipTex = new THREE.CanvasTexture(chipC);
    chipTex.colorSpace = THREE.SRGBColorSpace;
    const chipMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.4),
      new THREE.MeshBasicMaterial({ map: chipTex, toneMapped: false })
    );
    chipMesh.position.set(rackSlots[i].x, 2.18, rackZ + 0.28);
    rack.add(chipMesh);
    rackChips.push({ canvas: chipC, ctx: chipCtx, tex: chipTex });
  }
  ped.instanceMatrix.needsUpdate = true;
  scene.add(rack);

  const boss = new THREE.Mesh(bossBuilt.geo, toon("#ffffff", { vertexColors: true }));
  boss.frustumCulled = false;
  attachOutline(boss, 0.08);
  const crownMarker = new THREE.Object3D();
  crownMarker.position.copy(bossBuilt.crownLocal);
  boss.add(crownMarker);
  boss.visible = false;
  scene.add(boss);

  const flyMat = new THREE.MeshToonMaterial({ color: new THREE.Color("#F4E6C3"), gradientMap: animToon().gradientMap });
  const fly = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.7), flyMat);
  fly.visible = false;
  scene.add(fly);

  const bx = new Float32Array(BULLETS);
  const by = new Float32Array(BULLETS);
  const bz = new Float32Array(BULLETS);
  const bvx = new Float32Array(BULLETS);
  const bvy = new Float32Array(BULLETS);
  const bvz = new Float32Array(BULLETS);
  const bdmg = new Float32Array(BULLETS);
  const broll = new Float32Array(BULLETS);
  const blife = new Float32Array(BULLETS);
  const borx = new Float32Array(BULLETS);
  const borz = new Float32Array(BULLETS);
  const balive = new Uint8Array(BULLETS);
  const bkind = new Uint8Array(BULLETS);
  const bcol = new Uint8Array(BULLETS);
  const bfall = new Uint8Array(BULLETS);
  const bfree = new Int16Array(BULLETS);
  let bFreeN = BULLETS;

  const px = new Float32Array(PUFFS);
  const py = new Float32Array(PUFFS);
  const pz = new Float32Array(PUFFS);
  const pvx = new Float32Array(PUFFS);
  const pvy = new Float32Array(PUFFS);
  const pvz = new Float32Array(PUFFS);
  const plife = new Float32Array(PUFFS);
  const pmax = new Float32Array(PUFFS);
  const psize = new Float32Array(PUFFS);
  const palive = new Uint8Array(PUFFS);
  const pkind = new Uint8Array(PUFFS);
  const pfree = new Int16Array(PUFFS);
  let pFreeN = PUFFS;

  const flAlive = new Uint8Array(FLOATS);
  const flValue = new Float32Array(FLOATS);
  const flLife = new Float32Array(FLOATS);
  const flX = new Float32Array(FLOATS);
  const flY = new Float32Array(FLOATS);
  const flZ = new Float32Array(FLOATS);
  const flTarget = new Int16Array(FLOATS);
  const digScratch = new Uint8Array(4);

  const head = new Int16Array(512);
  const nextE = new Int16Array(CAP * 3);
  const fx = new Float32Array(64);
  const fz = new Float32Array(64);
  const cds = new Float32Array(RENDER_CAP);
  const ct = new Int8Array(48);
  const ci = new Int16Array(48);
  let cn = 0;
  const cd = new Float32Array(48);

  const gates = [];
  const fired = new Uint8Array(SCRIPT.length);

  const bossState = {
    hp: 3000,
    alive: 1,
    shown: 0,
    summoned: 0,
    x: 0,
    z: -711,
    y: 0,
    homeZ: -711,
    mode: 0,
    t: 1.4,
    lock: 0,
  };

  const view = {
    n: 3,
    weaponId: "pistol",
    tier: 1,
    weaponName: "Twig Pistol",
    tierName: "Wood",
    color: "#F4E6C3",
    dist: 0,
    arena: 0,
    bar: 0,
    barText: "",
    enemies: 0,
    bossHp: 3000,
    bossMax: 3000,
    bossX: 0,
    flash: "",
    half: 5,
    squadX: 0,
    squadZ: 0,
    radius: 0.8,
    bannerY: 2.7,
    ended: "",
    running: 0,
    steered: 0,
    kills: 0,
    cratesOpened: 0,
    crateRammed: 0,
    bossSec: 0,
    calls: 0,
    mPerPx: 0.02,
    gate0: "+5",
    crateHp: 480,
    targetX: 0,
    slow: 0,
  };

  let clock = 0;
  let squadN = 3;
  let squadX = 0;
  let targetX = 0;
  let dist = 0;
  let prevZ = 0;
  let half = 5;
  let radius = 0.8;
  let weaponId = "pistol";
  let tier = 1;
  let mods = weaponMods("pistol", 1);
  let running = false;
  let ended = "";
  let winSent = false;
  let slowLeft = 0;
  let flashT = 0;
  let liveN = 0;
  let kills = 0;
  let cratesOpened = 0;
  let crateRammed = 0;
  let bossSec = 0;
  let arenaStarted = 0;
  let rackTaken = 0;
  let flyT = 0;
  let flyX = 0;
  let flyZ = 0;
  let axis = 0;
  let pointing = 0;
  let steered = 0;
  let bot = false;
  let bench = 0;
  let shotThisTick = false;
  let seed = 12345;
  let bFreeTop = 0;
  let pFreeTop = 0;

  const crownV = new THREE.Vector3();
  const projA = new THREE.Vector3();
  const projB = new THREE.Vector3();
  let crownX = 0;
  let crownY = 3.4;
  let crownZ = -711;
  let aimX = 0;
  let aimY = 1;
  let aimZ = 0;

  let hooks = { win() {}, lose() {} };

  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }

  function resetBullets() {
    bFreeN = BULLETS;
    for (let i = 0; i < BULLETS; i++) {
      bfree[i] = i;
      balive[i] = 0;
    }
    bFreeTop = 0;
  }

  function resetPuffs() {
    pFreeN = PUFFS;
    for (let i = 0; i < PUFFS; i++) {
      pfree[i] = i;
      palive[i] = 0;
    }
    pFreeTop = 0;
  }

  function allocB() {
    if (bFreeN <= 0) return -1;
    const i = bfree[--bFreeN];
    balive[i] = 1;
    return i;
  }

  function freeB(i) {
    if (!balive[i]) return;
    balive[i] = 0;
    bfree[bFreeN++] = i;
  }

  function puff(x0, y0, z0, kind, n, speed, life, size) {
    const sp = speed == null ? 2.4 : speed;
    const lf = life == null ? 0.45 : life;
    const sz = size == null ? 0.42 : size;
    for (let k = 0; k < n; k++) {
      if (pFreeN <= 0) return;
      const i = pfree[--pFreeN];
      palive[i] = 1;
      px[i] = x0;
      py[i] = y0;
      pz[i] = z0;
      const a = rnd() * 6.283;
      pvx[i] = Math.cos(a) * sp * (0.4 + rnd());
      pvy[i] = 1.2 + rnd() * 2.4;
      pvz[i] = Math.sin(a) * sp * (0.4 + rnd());
      plife[i] = lf * (0.7 + rnd() * 0.5);
      pmax[i] = plife[i];
      psize[i] = sz * (0.7 + rnd() * 0.6);
      pkind[i] = kind;
    }
  }

  function floater(target, x0, y0, z0, amount) {
    const add = amount > 0 ? amount : 0;
    if (add <= 0) return;
    for (let i = 0; i < FLOATS; i++) {
      if (flAlive[i] && flTarget[i] === target && flLife[i] > 0.12) {
        flValue[i] += add;
        if (flValue[i] > 9999) flValue[i] = 9999;
        flLife[i] = 0.72;
        flX[i] = x0;
        flY[i] = y0;
        flZ[i] = z0;
        return;
      }
    }
    for (let i = 0; i < FLOATS; i++) {
      if (flAlive[i]) continue;
      flAlive[i] = 1;
      flTarget[i] = target;
      flValue[i] = add > 9999 ? 9999 : add;
      flLife[i] = 0.72;
      flX[i] = x0;
      flY[i] = y0;
      flZ[i] = z0;
      return;
    }
  }

  function fillDigits(n) {
    let v = n | 0;
    if (v < 0) v = 0;
    if (v > 9999) v = 9999;
    if (v < 10) {
      digScratch[0] = v;
      return 1;
    }
    if (v < 100) {
      digScratch[0] = (v / 10) | 0;
      digScratch[1] = v % 10;
      return 2;
    }
    if (v < 1000) {
      digScratch[0] = (v / 100) | 0;
      digScratch[1] = ((v / 10) | 0) % 10;
      digScratch[2] = v % 10;
      return 3;
    }
    digScratch[0] = (v / 1000) | 0;
    digScratch[1] = ((v / 100) | 0) % 10;
    digScratch[2] = ((v / 10) | 0) % 10;
    digScratch[3] = v % 10;
    return 4;
  }

  function spawnEnemy(type, x0, z0) {
    const p = pools[type];
    if (p.freeN <= 0) return -1;
    const i = p.free[--p.freeN];
    p.alive[i] = 1;
    p.x[i] = x0;
    p.z[i] = z0;
    p.hp[i] = KINDS[type].hp;
    p.hit[i] = 0;
    p.phase[i] = rnd() * 6.28;
    p.biteAcc[i] = rnd();
    p.freeze[i] = 0;
    liveN++;
    return i;
  }

  function killEnemy(type, i, splashFx) {
    const p = pools[type];
    if (!p.alive[i]) return;
    p.alive[i] = 0;
    p.free[p.freeN++] = i;
    liveN--;
    if (liveN < 0) liveN = 0;
    kills++;
    if (splashFx && pFreeN > 0) {
      puff(p.x[i], 0.45, p.z[i], 0, 4, 2.2, 0.4, 0.48);
      puff(p.x[i], 0.7, p.z[i], 1, 4, 1.6, 0.5, 0.4);
    }
  }

  function dump(type, count, z, per, spacing) {
    if (count <= 0) return z;
    for (let i = 0; i < count; i++) {
      const row = (i / per) | 0;
      const col = i % per;
      const cols = Math.min(per, count - row * per);
      const x0 = cols <= 1 ? 0 : -4.15 + (col / (cols - 1)) * 8.3;
      spawnEnemy(type, x0, z - row * spacing);
    }
    return z - Math.ceil(count / per) * spacing;
  }

  function spawnWave(ev) {
    let z = -(ev.at + 45);
    const ratPer = ev.rat > 100 ? 12 : ev.rat > 40 ? 10 : 8;
    z = dump(0, ev.rat, z, ratPer, 5.8);
    if (ev.brute) dump(2, ev.brute, z - 6, 2, 4);
    if (ev.beetle) dump(1, ev.beetle, z - 12, 5, 8);
  }

  function buildGates() {
    gates.length = 0;
    let n = 0;
    for (let s = 0; s < SCRIPT.length; s++) {
      const ev = SCRIPT[s];
      if (ev.kind !== "gate") continue;
      for (let side = 0; side < 2; side++) {
        const g = freshGate(ev.pair[side].op, ev.pair[side].k);
        g.x = side === 0 ? -2.45 : 2.45;
        g.z = -ev.at;
        g.side = side;
        g.passed = 0;
        g.bump = 0;
        g.label = gateLabel(g);
        g.index = n;
        gates.push(g);
        paintSign(signs[n].ctx, signs[n].canvas, g.label);
        signs[n].tex.needsUpdate = true;
        gatePanel.setColorAt(n, gateBlue(g.op) ? blueC : redC);
        n++;
      }
    }
    gatePanel.instanceColor.needsUpdate = true;
  }

  function relabel(i) {
    const g = gates[i];
    g.label = gateLabel(g);
    g.bump = 0.36;
    paintSign(signs[i].ctx, signs[i].canvas, g.label);
    signs[i].tex.needsUpdate = true;
    gatePanel.setColorAt(i, gateBlue(g.op) ? blueC : redC);
    gatePanel.instanceColor.needsUpdate = true;
    const kind = gateBlue(g.op) ? 5 : 6;
    puff(g.x, 2.2, g.z, kind, 3, 2.5, 0.3, 0.28);
  }

  function paintChip(i) {
    const slot = rackSlots[i];
    const t = tierAfterPickup(weaponId, tier, slot.id, slot.bonus);
    const ctx = rackChips[i].ctx;
    const canvas = rackChips[i].canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = TIER_COLORS[t];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#F4E6C3";
    ctx.font = "900 48px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("T" + t + " " + TIER_NAMES[t], canvas.width / 2, canvas.height / 2 + 2);
    rackChips[i].tex.needsUpdate = true;
  }

  function refreshMods() {
    mods = weaponMods(weaponId, tier);
    flyMat.color.set(mods.color);
  }

  function equip(id, bonus) {
    tier = tierAfterPickup(weaponId, tier, id, bonus);
    weaponId = id;
    refreshMods();
    if (!rackTaken) {
      for (let i = 0; i < 3; i++) paintChip(i);
    }
    fly.visible = true;
    flyT = 0.4;
  }

  function flushCrates() {
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      if (!c.dirty) continue;
      paintCrateFace(c.ctx, c.canvas, c.weapon, c.hp);
      c.tex.needsUpdate = true;
      c.dirty = 0;
    }
  }

  function breakCrate(c) {
    if (c.state !== "idle") return;
    c.state = "shake";
    c.shake = 0.15;
    c.hp = 0;
    c.dirty = 1;
    audio.crack();
    puff(c.x, 1.2, c.z, 3, 12, 3.2, 0.45, 0.55);
  }

  function grantCrate(c) {
    c.state = "dead";
    c.mesh.visible = false;
    cratesOpened++;
    flyX = c.x;
    flyZ = c.z;
    equip(c.weapon, 0);
  }

  function ramCrate(c) {
    c.state = "dead";
    c.mesh.visible = false;
    crateRammed = 1;
    audio.crack();
    puff(c.x, 1, c.z, 3, 8, 2.4, 0.35, 0.45);
    hurtSquad(5);
  }

  function hurtSquad(n) {
    if (ended || !running) return;
    squadN -= n;
    if (squadN < 0) squadN = 0;
    audio.hurt();
    if (squadN === 0) doLose();
  }

  function doLose() {
    if (ended) return;
    ended = "lose";
    running = false;
    audio.endFire();
    audio.lose();
    publish();
    hooks.lose();
  }

  function beginWin() {
    if (ended) return;
    ended = "win";
    slowLeft = 0.5;
    flashT = 1.35;
    bossState.alive = 0;
    bossState.hp = 0;
    audio.endFire();
    audio.bossOut();
    puff(bossState.x, 1.3, bossState.z, 0, 16, 4.5, 0.6, 0.8);
    puff(bossState.x, 1.8, bossState.z, 1, 8, 3, 0.55, 0.55);
  }

  function finishWin() {
    if (winSent) return;
    winSent = true;
    const stars = starsFor(true, squadN, crateRammed, bossSec);
    const earned = boberReward(kills, cratesOpened, stars);
    hooks.win({
      n: squadN,
      kills,
      cratesOpened,
      crateRammed,
      bossSec,
      stars,
      earned,
    });
  }

  function startArena() {
    if (arenaStarted) return;
    arenaStarted = 1;
    dist = 700;
    half = 7;
    bossState.shown = 1;
    bossState.alive = 1;
    bossState.hp = 3000;
    bossState.summoned = 0;
    bossState.homeZ = -711;
    bossState.z = -711;
    bossState.x = 0;
    bossState.mode = 0;
    bossState.t = 1.2;
    bossState.lock = squadX;
    boss.visible = true;
    audio.bossIn();
  }

  function hurtBoss(dmg, crit, x0, y0, z0) {
    if (!bossState.alive || ended) return;
    const dealt = crit ? dmg * 2 : dmg;
    bossState.hp -= dealt;
    floater(9000, x0, y0 + 0.4, z0, dealt);
    if (crit && pFreeN > 8) puff(crownX, crownY, crownZ, 4, 4, 3, 0.28, 0.32);
    if (!bossState.summoned && bossState.hp <= 1500) {
      bossState.summoned = 1;
      dump(0, 40, bossState.z - 5, 8, 3.2);
    }
    if (bossState.hp <= 0) {
      bossState.hp = 0;
      beginWin();
    }
  }

  function damageEnemy(type, i, dmg, x0, y0, z0, splashHit) {
    const p = pools[type];
    if (!p.alive[i]) return;
    let dealt = dmg;
    if (type === 1 && !splashHit) dealt *= 0.4;
    if (dealt < 0.05) return;
    p.hp[i] -= dealt;
    p.hit[i] = 1;
    floater(type * 400 + i, p.x[i], KINDS[type].y + 0.8, p.z[i], dealt);
    if (pFreeN > 40) puff(x0, y0, z0, splashHit ? 3 : 2, 1, 1.5, 0.18, 0.22);
    if (p.hp[i] <= 0) killEnemy(type, i, true);
  }

  function cellOf(x0, z0) {
    const ix = Math.floor(x0 * 0.5);
    const iz = Math.floor(z0 * 0.5);
    return ((ix * 73856093) ^ (iz * 19349663)) & 511;
  }

  function rebuildGrid() {
    head.fill(-1);
    for (let t = 0; t < 3; t++) {
      const p = pools[t];
      for (let i = 0; i < CAP; i++) {
        if (!p.alive[i]) continue;
        const id = t * CAP + i;
        const h = cellOf(p.x[i], p.z[i]);
        nextE[id] = head[h];
        head[h] = id;
      }
    }
  }

  function segHit(x0, y0, z0, x1, y1, z1, cx, cy, cz, rad) {
    const vx = x1 - x0;
    const vy = y1 - y0;
    const vz = z1 - z0;
    const len2 = vx * vx + vy * vy + vz * vz;
    let t = 0;
    if (len2 > 1e-8) {
      t = ((cx - x0) * vx + (cy - y0) * vy + (cz - z0) * vz) / len2;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
    }
    const dx = x0 + vx * t - cx;
    const dy = y0 + vy * t - cy;
    const dz = z0 + vz * t - cz;
    return dx * dx + dy * dy + dz * dz <= rad * rad;
  }

  function splashAt(x0, y0, z0, dmg, knock) {
    puff(x0, 0.35, z0, 3, 8, 3.4, 0.4, 0.7);
    const ix = Math.floor(x0 * 0.5);
    const iz = Math.floor(z0 * 0.5);
    const r2 = 2.2 * 2.2;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const h = (((ix + dx) * 73856093) ^ ((iz + dz) * 19349663)) & 511;
        for (let id = head[h]; id >= 0; id = nextE[id]) {
          const type = (id / CAP) | 0;
          const i = id - type * CAP;
          const p = pools[type];
          if (!p.alive[i]) continue;
          const ex = p.x[i] - x0;
          const ez = p.z[i] - z0;
          if (ex * ex + ez * ez > r2) continue;
          p.z[i] -= knock;
          damageEnemy(type, i, dmg, p.x[i], KINDS[type].y, p.z[i], true);
        }
      }
    }
    if (bossState.alive) {
      const dx = bossState.x - x0;
      const dz = bossState.z - z0;
      if (dx * dx + dz * dz <= r2) {
        const nearCrown = (crownX - x0) * (crownX - x0) + (crownZ - z0) * (crownZ - z0) < 1.4;
        hurtBoss(dmg, nearCrown ? 1 : 0, bossState.x, 1.6, bossState.z);
        bossState.z -= knock * 0.4;
      }
    }
  }

  function hitGate(x0, z0, z1) {
    const side = x0 <= 0 ? 0 : 1;
    for (let i = side; i < gates.length; i += 2) {
      const g = gates[i];
      if (g.passed) continue;
      const straddles = (z0 - g.z) * (z1 - g.z) <= 0 || Math.abs(z1 - g.z) < 0.35;
      if (!straddles) continue;
      if (x0 < -5.3 || x0 > 5.3) continue;
      if (shootGate(g, 1)) relabel(i);
      else if (pFreeN > 48) puff(g.x, 2, g.z + 0.3, gateBlue(g.op) ? 5 : 6, 1, 1, 0.15, 0.18);
      return 1;
    }
    return 0;
  }

  function hitCrate(x0, y0, z0, dmg) {
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      if (c.state !== "idle") continue;
      if (Math.abs(x0 - c.x) > 1.72) continue;
      if (Math.abs(z0 - c.z) > 1.25) continue;
      if (y0 < 0.15 || y0 > 2.2) continue;
      c.hp -= dmg;
      if (c.hp < 0) c.hp = 0;
      c.dirty = 1;
      floater(9100 + i, c.x, 2.3, c.z, dmg);
      if (c.hp <= 0) breakCrate(c);
      return 1;
    }
    return 0;
  }

  function moveBullets(h) {
    for (let i = 0; i < BULLETS; i++) {
      if (!balive[i]) continue;
      const x0 = bx[i];
      const y0 = by[i];
      const z0 = bz[i];
      if (bkind[i] === 2) {
        bvy[i] -= 16 * h;
        broll[i] += h * 11;
      }
      bx[i] = x0 + bvx[i] * h;
      by[i] = y0 + bvy[i] * h;
      bz[i] = z0 + bvz[i] * h;
      blife[i] -= h;
      if (blife[i] <= 0 || by[i] < -1 || bz[i] > prevZ + 8) {
        freeB(i);
        continue;
      }
      if (bkind[i] === 2 && by[i] <= 0.34) {
        splashAt(bx[i], 0.4, bz[i], bdmg[i], 1);
        freeB(i);
        continue;
      }
      let hit = 0;
      const ix = Math.floor(bx[i] * 0.5);
      const iz = Math.floor(bz[i] * 0.5);
      for (let dz = -1; dz <= 1 && !hit; dz++) {
        for (let dx = -1; dx <= 1 && !hit; dx++) {
          const bucket = (((ix + dx) * 73856093) ^ ((iz + dz) * 19349663)) & 511;
          for (let id = head[bucket]; id >= 0 && !hit; id = nextE[id]) {
            const type = (id / CAP) | 0;
            const slot = id - type * CAP;
            const p = pools[type];
            if (!p.alive[slot]) continue;
            const rad = KINDS[type].rad;
            if (!segHit(x0, y0, z0, bx[i], by[i], bz[i], p.x[slot], KINDS[type].y, p.z[slot], rad)) continue;
            if (bkind[i] === 2) {
              splashAt(p.x[slot], KINDS[type].y, p.z[slot], bdmg[i], 1);
            } else {
              let dmg = bdmg[i];
              if (bfall[i]) {
                const travel = Math.hypot(bx[i] - borx[i], bz[i] - borz[i]);
                if (travel > 14) dmg *= Math.max(0, 1 - (travel - 14) / 14);
              }
              damageEnemy(type, slot, dmg, p.x[slot], KINDS[type].y, p.z[slot], false);
            }
            hit = 1;
          }
        }
      }
      if (hit) {
        freeB(i);
        continue;
      }
      if (bossState.alive && arenaStarted) {
        const crit = segHit(x0, y0, z0, bx[i], by[i], bz[i], crownX, crownY, crownZ, 0.62);
        const body = segHit(x0, y0, z0, bx[i], by[i], bz[i], bossState.x, 1.45, bossState.z, 1.45);
        if (crit || body) {
          if (bkind[i] === 2) splashAt(bx[i], by[i], bz[i], bdmg[i], 1);
          else hurtBoss(bdmg[i], crit ? 1 : 0, bx[i], by[i], bz[i]);
          freeB(i);
          continue;
        }
      }
      if (hitCrate(bx[i], by[i], bz[i], bdmg[i]) || hitGate(bx[i], z0, bz[i])) freeB(i);
    }
  }

  function consider(kind, index, x0, z0) {
    const dx = x0 - squadX;
    const dz = z0 - (-dist);
    if (dz > 2) return;
    const d2 = dx * dx + dz * dz;
    if (d2 > 28 * 28) return;
    if (cn < 48) {
      ct[cn] = kind;
      ci[cn] = index;
      cd[cn] = d2;
      cn++;
      for (let i = cn - 1; i > 0 && cd[i] < cd[i - 1]; i--) {
        const td = cd[i - 1];
        cd[i - 1] = cd[i];
        cd[i] = td;
        const tt = ct[i - 1];
        ct[i - 1] = ct[i];
        ct[i] = tt;
        const ti = ci[i - 1];
        ci[i - 1] = ci[i];
        ci[i] = ti;
      }
    } else if (d2 < cd[47]) {
      ct[47] = kind;
      ci[47] = index;
      cd[47] = d2;
      for (let i = 47; i > 0 && cd[i] < cd[i - 1]; i--) {
        const td = cd[i - 1];
        cd[i - 1] = cd[i];
        cd[i] = td;
        const tt = ct[i - 1];
        ct[i - 1] = ct[i];
        ct[i] = tt;
        const ti = ci[i - 1];
        ci[i - 1] = ci[i];
        ci[i] = ti;
      }
    }
  }

  function buildCands() {
    cn = 0;
    for (let t = 0; t < 3; t++) {
      const p = pools[t];
      for (let i = 0; i < CAP; i++) {
        if (p.alive[i]) consider(t, i, p.x[i], p.z[i]);
      }
    }
    if (bossState.alive && bossState.shown) consider(3, 0, bossState.x, bossState.z);
    for (let i = 0; i < crates.length; i++) {
      if (crates[i].state === "idle") consider(4, i, crates[i].x, crates[i].z);
    }
    for (let i = 0; i < gates.length; i++) {
      if (!gates[i].passed) consider(5, i, gates[i].x, gates[i].z);
    }
  }

  function aimOf(kind, index, soldierX) {
    if (kind < 3) {
      const p = pools[kind];
      if (!p.alive[index]) return 0;
      aimX = p.x[index];
      aimY = KINDS[kind].y;
      aimZ = p.z[index];
      return 1;
    }
    if (kind === 3) {
      if (!bossState.alive) return 0;
      if (Math.abs(soldierX - bossState.x) < 0.85) {
        aimX = crownX;
        aimY = crownY;
        aimZ = crownZ;
      } else {
        aimX = bossState.x;
        aimY = 1.5;
        aimZ = bossState.z;
      }
      return 1;
    }
    if (kind === 4) {
      const c = crates[index];
      if (c.state !== "idle") return 0;
      aimX = c.x;
      aimY = 1.05;
      aimZ = c.z;
      return 1;
    }
    const g = gates[index];
    if (!g || g.passed) return 0;
    aimX = g.x;
    aimY = 2.15;
    aimZ = g.z;
    return 1;
  }

  function fireSoldier(s) {
    if (cn <= 0) return;
    const shown = shownCount(squadN);
    if (s >= shown) return;
    const sx = squadX + fx[s];
    const sy = 1.05;
    const sz = -dist + fz[s];
    if (!aimOf(ct[s % cn], ci[s % cn], sx)) return;
    const dx = aimX - sx;
    const dy = aimY - sy;
    const dz = aimZ - sz;
    const len = Math.hypot(dx, dy, dz) || 1;
    const base = Math.atan2(dx, -dz);
    const pitch = Math.asin(clamp(dy / len, -0.85, 0.85));
    const pellets = mods.pellets;
    const dmg = mods.dmg * squadDmgMul(squadN);
    const col = weaponId === "smg" ? 1 : weaponId === "shot" ? 2 : 0;
    for (let p = 0; p < pellets; p++) {
      const id = allocB();
      if (id < 0) return;
      let ang = base;
      if (mods.pattern === "fan" && pellets > 1) ang += (p / (pellets - 1) - 0.5) * mods.spread;
      else if (mods.pattern === "spread") ang += (rnd() * 2 - 1) * mods.spread;
      else if (pellets > 1) ang += (p - (pellets - 1) / 2) * 0.045;
      const lob = mods.pattern === "lob";
      if (lob) {
        const horiz = Math.hypot(dx, dz) || 1;
        bvx[id] = (dx / horiz) * 18;
        bvz[id] = (dz / horiz) * 18;
        bvy[id] = 8;
        bkind[id] = 2;
      } else {
        const cp = Math.cos(pitch);
        bvx[id] = Math.sin(ang) * cp * 52;
        bvy[id] = Math.sin(pitch) * 52;
        bvz[id] = -Math.cos(ang) * cp * 52;
        bkind[id] = mods.pattern === "fan" ? 1 : 0;
      }
      bx[id] = sx;
      by[id] = sy;
      bz[id] = sz - 0.4;
      bdmg[id] = dmg;
      blife[id] = lob ? 1.6 : 0.75;
      broll[id] = rnd() * 6;
      borx[id] = sx;
      borz[id] = sz;
      bcol[id] = col;
      bfall[id] = mods.falloff > 0 ? 1 : 0;
      shotThisTick = true;
    }
    if ((s & 3) === 0 && pFreeN > 24) puff(sx, sy, sz - 0.6, col === 1 ? 8 : col === 2 ? 7 : 2, 1, 0.4, 0.08, 0.22);
  }

  function botX() {
    if (arenaStarted) return bossState.x;
    if (dist > 145 && dist < 178) return 3.35;
    if (dist > 330 && dist < 368) return 0;
    if (dist > 555 && dist < 625) return 3.35;
    return -2.3;
  }

  function updateCrown() {
    boss.position.set(bossState.x, 0.08 + Math.sin(clock * 2.1) * 0.06, bossState.z);
    boss.rotation.y = Math.PI;
    boss.visible = !!bossState.shown && !!bossState.alive;
    if (!boss.visible) return;
    boss.updateMatrixWorld();
    crownMarker.getWorldPosition(crownV);
    crownX = crownV.x;
    crownY = crownV.y;
    crownZ = crownV.z;
  }

  function checkScript() {
    for (let i = 0; i < SCRIPT.length; i++) {
      if (fired[i]) continue;
      const ev = SCRIPT[i];
      if (dist < ev.at) continue;
      fired[i] = 1;
      if (dist - ev.at < 25 && ev.kind === "wave") spawnWave(ev);
    }
  }

  function tickOnce(h) {
    clock += h;
    if (!running || ended === "lose") return;
    radius = formationRadius(Math.max(squadN, 1), half);
    if (!ended) {
      if (bot) targetX = botX();
      else if (axis && !pointing) targetX += axis * STEER_MAX * h;
      targetX = clampLane(targetX, radius, half);
      if (bot) squadX = targetX;
      else {
        const maxStep = STEER_MAX * h;
        const dx = targetX - squadX;
        if (dx > maxStep) squadX += maxStep;
        else if (dx < -maxStep) squadX -= maxStep;
        else squadX = targetX;
      }
      squadX = clampLane(squadX, radius, half);
      if (!arenaStarted && !bench) {
        dist += ADVANCE * h;
        if (dist > 700) dist = 700;
      }
      if (dist >= 700) startArena();
      half = arenaStarted ? 7 : dist > 670 ? 5 + Math.min(1, (dist - 670) / 30) * 2 : 5;
      const z = -dist;
      if (!arenaStarted) {
        for (let i = 0; i < gates.length; i += 2) {
          const g = gates[i];
          if (g.passed) continue;
          if (prevZ > g.z && z <= g.z && prevZ - g.z < 20) {
            const side = squadX <= 0 ? 0 : 1;
            const pick = gates[i + side];
            squadN = applyGate(squadN, pick.op, pick.k, pick.tenths);
            gates[i].passed = 1;
            gates[i + 1].passed = 1;
            audio.gate();
            puff(pick.x, 1.6, pick.z, gateBlue(pick.op) ? 5 : 6, 10, 3.5, 0.4, 0.4);
            if (squadN <= 0) {
              prevZ = z;
              doLose();
              return;
            }
          }
        }
      }
      for (let i = 0; i < crates.length; i++) {
        const c = crates[i];
        if (c.state === "shake") {
          c.shake -= h;
          if (c.shake <= 0) grantCrate(c);
        } else if (c.state === "idle" && Math.abs(z - c.z) < 1.35 && Math.abs(squadX - c.x) < 1.65 + CORE) {
          ramCrate(c);
          if (ended) {
            prevZ = z;
            return;
          }
        }
      }
      if (!rackTaken && Math.abs(z - rackZ) < 1.25) {
        for (let i = 0; i < 3; i++) {
          if (Math.abs(squadX - rackSlots[i].x) < 1.45) {
            flyX = rackSlots[i].x;
            flyZ = rackZ;
            equip(rackSlots[i].id, rackSlots[i].bonus);
            rackTaken = 1;
            rack.visible = false;
            audio.gate();
            break;
          }
        }
      }
      prevZ = z;
      checkScript();
      if (arenaStarted && bossState.alive) {
        bossSec += h;
        bossState.t -= h;
        if (bossState.mode === 0) {
          bossState.x += clamp(bossState.lock - bossState.x, -1, 1) * 2.2 * h;
          bossState.z += clamp(bossState.homeZ - bossState.z, -1, 1) * 3.2 * h;
          if (bossState.t <= 0) {
            bossState.mode = 1;
            bossState.t = 1.15;
            bossState.lock = squadX;
          }
        } else if (bossState.mode === 1) {
          bossState.x += clamp(bossState.lock - bossState.x, -1, 1) * 4 * h;
          bossState.z += 6.5 * h;
          if (bossState.t <= 0 || bossState.z > z - 3.2) {
            bossState.mode = 2;
            bossState.t = 1.25;
          }
        } else {
          bossState.z += clamp(bossState.homeZ - bossState.z, -1, 1) * 5 * h;
          if (bossState.t <= 0) {
            bossState.mode = 0;
            bossState.t = 1.45;
            bossState.lock = squadX;
          }
        }
        const lim = half - 1.3;
        bossState.x = clamp(bossState.x, -lim, lim);
      }
      updateCrown();
      for (let t = 0; t < 3; t++) {
        const p = pools[t];
        const k = KINDS[t];
        for (let i = 0; i < CAP; i++) {
          if (!p.alive[i] || p.freeze[i]) continue;
          const steer = squadX - p.x[i];
          p.x[i] += clamp(steer, -1, 1) * k.lat * h;
          p.z[i] += k.speed * h;
          if (p.hit[i] > 0) p.hit[i] = Math.max(0, p.hit[i] - h * 5);
        }
      }
      rebuildGrid();
      moveBullets(h);
      if (!ended) {
        const blob = formationRadius(Math.max(squadN, 1), half);
        for (let t = 0; t < 3; t++) {
          const p = pools[t];
          const k = KINDS[t];
          for (let i = 0; i < CAP; i++) {
            if (!p.alive[i] || p.freeze[i]) continue;
            if (p.z[i] > -dist + 2.55) {
              p.alive[i] = 0;
              p.free[p.freeN++] = i;
              liveN--;
              continue;
            }
            const dx = p.x[i] - squadX;
            const dz = p.z[i] - (-dist);
            const rr = blob + k.rad;
            if (dx * dx + dz * dz >= rr * rr) continue;
            if (t === 2) {
              const len = Math.sqrt(dx * dx + dz * dz) || 0.001;
              p.x[i] = squadX + (dx / len) * rr;
              p.z[i] = -dist + (dz / len) * rr;
              p.biteAcc[i] += h;
              if (p.biteAcc[i] >= 1) {
                p.biteAcc[i] -= 1;
                hurtSquad(k.bite);
                if (ended) return;
              }
            } else {
              hurtSquad(k.bite);
              killEnemy(t, i, true);
              if (ended) return;
            }
          }
        }
      }
      if (!ended) {
        formationOffsets(squadN, radius, fx, fz);
        buildCands();
        const shooters = squadN > RENDER_CAP ? RENDER_CAP : squadN;
        const interval = 1 / mods.rate;
        for (let s = 0; s < shooters; s++) {
          cds[s] -= h;
          if (cds[s] > 0) continue;
          if (cn <= 0) continue;
          cds[s] = interval;
          fireSoldier(s);
        }
      }
    }
    for (let i = 0; i < gates.length; i++) {
      if (gates[i].bump > 0) gates[i].bump = Math.max(0, gates[i].bump - h * 2.4);
    }
    if (flyT > 0) flyT -= h;
    for (let i = 0; i < PUFFS; i++) {
      if (!palive[i]) continue;
      plife[i] -= h;
      if (plife[i] <= 0) {
        palive[i] = 0;
        pfree[pFreeN++] = i;
        continue;
      }
      px[i] += pvx[i] * h;
      py[i] += pvy[i] * h;
      pz[i] += pvz[i] * h;
      pvy[i] -= 4 * h;
    }
    for (let i = 0; i < FLOATS; i++) {
      if (!flAlive[i]) continue;
      flLife[i] -= h;
      if (flLife[i] <= 0) flAlive[i] = 0;
    }
    publish();
  }

  function publish() {
    view.n = squadN;
    view.weaponId = weaponId;
    view.tier = tier;
    view.weaponName = mods.name;
    view.tierName = TIER_NAMES[tier];
    view.color = mods.color;
    view.dist = dist;
    view.arena = arenaStarted;
    view.enemies = liveN;
    view.bossHp = bossState.hp;
    view.bossX = bossState.x;
    view.half = half;
    view.squadX = squadX;
    view.squadZ = -dist;
    view.radius = radius;
    view.bannerY = 2.55 + Math.min(radius, 2.2);
    view.ended = ended;
    view.running = running ? 1 : 0;
    view.steered = steered;
    view.kills = kills;
    view.cratesOpened = cratesOpened;
    view.crateRammed = crateRammed;
    view.bossSec = bossSec;
    view.gate0 = gates.length ? gates[0].label : "+5";
    view.crateHp = crates[0].hp;
    view.targetX = targetX;
    view.slow = slowLeft;
    view.flash = flashT > 0 ? "BRIDGE HELD!" : "";
    if (arenaStarted) {
      view.bar = bossState.hp / 3000;
      view.barText = "RAT BARON";
    } else {
      view.bar = dist / 700;
      view.barText = "";
    }
  }

  function reset() {
    seed = 12345;
    squadN = 3;
    squadX = 0;
    targetX = 0;
    dist = 0;
    prevZ = 0;
    half = 5;
    radius = formationRadius(3, 5);
    weaponId = "pistol";
    tier = 1;
    refreshMods();
    running = false;
    ended = "";
    winSent = false;
    slowLeft = 0;
    flashT = 0;
    kills = 0;
    cratesOpened = 0;
    crateRammed = 0;
    bossSec = 0;
    arenaStarted = 0;
    rackTaken = 0;
    flyT = 0;
    bot = false;
    bench = 0;
    steered = 0;
    liveN = 0;
    shotThisTick = false;
    fired.fill(0);
    for (let t = 0; t < 3; t++) {
      const p = pools[t];
      p.alive.fill(0);
      p.freeN = CAP;
      for (let i = 0; i < CAP; i++) p.free[i] = i;
    }
    resetBullets();
    resetPuffs();
    flAlive.fill(0);
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = rnd() * 0.25;
    bossState.hp = 3000;
    bossState.alive = 1;
    bossState.shown = 0;
    bossState.summoned = 0;
    bossState.x = 0;
    bossState.z = -711;
    bossState.homeZ = -711;
    bossState.mode = 0;
    bossState.t = 1.4;
    boss.visible = false;
    fly.visible = false;
    rack.visible = true;
    for (let i = 0; i < 3; i++) paintChip(i);
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      c.hp = c.max;
      c.state = "idle";
      c.shake = 0;
      c.dirty = 1;
      c.mesh.visible = true;
      c.mesh.position.set(0, 0, c.z);
    }
    buildGates();
    audio.endFire();
    publish();
  }

  function sync(cam) {
    flushCrates();
    const shown = formationOffsets(squadN, radius, fx, fz);
    const sM = soldiers.instanceMatrix.array;
    soldiers.count = shown;
    soldiers.visible = shown > 0;
    for (let i = 0; i < shown; i++) writeTRS(sM, i, squadX + fx[i], 0.14, -dist + fz[i], 0, 1, 1, 1);
    if (shown) soldiers.instanceMatrix.needsUpdate = true;
    bober.position.set(squadX, 0.12, -dist - radius - 1.15);
    bober.visible = ended !== "lose";
    shadow.position.set(squadX, 0.23, -dist + 0.15);
    const sh = Math.max(1.3, radius * 2.5);
    shadow.scale.set(sh, sh, 1);
    for (let t = 0; t < 3; t++) {
      const p = pools[t];
      const m = p.mesh.instanceMatrix.array;
      const ph = p.phaseAttr.array;
      const ht = p.hitAttr.array;
      let w = 0;
      for (let i = 0; i < CAP; i++) {
        if (!p.alive[i]) continue;
        writeTRS(m, w, p.x[i], 0, p.z[i], Math.PI, 1, 1, 1);
        ph[w] = p.phase[i];
        ht[w] = p.hit[i];
        w++;
      }
      p.mesh.count = w;
      p.mesh.visible = w > 0;
      if (w) {
        p.mesh.instanceMatrix.needsUpdate = true;
        p.phaseAttr.needsUpdate = true;
        p.hitAttr.needsUpdate = true;
      }
    }
    const bM = ball.instanceMatrix.array;
    const bC = ball.instanceColor.array;
    const lM = logs.instanceMatrix.array;
    let bw = 0;
    let lw = 0;
    for (let i = 0; i < BULLETS; i++) {
      if (!balive[i]) continue;
      if (bkind[i] === 2) {
        if (lw >= 160) continue;
        const yaw = Math.atan2(-bvx[i], -bvz[i]);
        writeLog(lM, lw, bx[i], by[i], bz[i], yaw, broll[i], 1);
        lw++;
      } else {
        const yaw = Math.atan2(bvx[i], bvz[i]);
        writeTRS(bM, bw, bx[i], by[i], bz[i], yaw, 1, 1, 1);
        const c = bulletCols[bcol[i]] || bulletCols[0];
        bC[bw * 3] = c[0];
        bC[bw * 3 + 1] = c[1];
        bC[bw * 3 + 2] = c[2];
        bw++;
      }
    }
    ball.count = bw;
    ball.visible = bw > 0;
    logs.count = lw;
    logs.visible = lw > 0;
    if (bw) {
      ball.instanceMatrix.needsUpdate = true;
      ball.instanceColor.needsUpdate = true;
    }
    if (lw) logs.instanceMatrix.needsUpdate = true;

    cam.updateMatrixWorld();
    const qx = cam.quaternion.x;
    const qy = cam.quaternion.y;
    const qz = cam.quaternion.z;
    const qw = cam.quaternion.w;
    const pM = puffs.instanceMatrix.array;
    const pC = puffs.instanceColor.array;
    let pw = 0;
    for (let i = 0; i < PUFFS; i++) {
      if (!palive[i]) continue;
      const s = psize[i] * (0.45 + 0.55 * (plife[i] / pmax[i]));
      writeQuat(pM, pw, px[i], py[i], pz[i], s, qx, qy, qz, qw);
      const c = puffCol[pkind[i]] || puffCol[0];
      pC[pw * 3] = c[0];
      pC[pw * 3 + 1] = c[1];
      pC[pw * 3 + 2] = c[2];
      pw++;
    }
    puffs.count = pw;
    puffs.visible = pw > 0;
    if (pw) {
      puffs.instanceMatrix.needsUpdate = true;
      puffs.instanceColor.needsUpdate = true;
    }

    const dM = digits.instanceMatrix.array;
    const dA = digits.geometry.getAttribute("aDigit").array;
    let dw = 0;
    for (let f = 0; f < FLOATS; f++) {
      if (!flAlive[f]) continue;
      const nDig = fillDigits(flValue[f] + 0.5);
      const y = flY[f] + (0.72 - flLife[f]) * 1.3;
      for (let k = 0; k < nDig; k++) {
        const ox = (k - (nDig - 1) / 2) * 0.38;
        writeQuat(dM, dw, flX[f] + ox, y, flZ[f], 0.62, qx, qy, qz, qw);
        dA[dw] = digScratch[k];
        dw++;
      }
    }
    digits.count = dw;
    digits.visible = dw > 0;
    if (dw) {
      digits.instanceMatrix.needsUpdate = true;
      digits.geometry.getAttribute("aDigit").needsUpdate = true;
    }

    const fM = gateFrame.instanceMatrix.array;
    const oM = gateOutline.instanceMatrix.array;
    const pPM = gatePanel.instanceMatrix.array;
    const rM = gateRim.instanceMatrix.array;
    let anyGate = 0;
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      const s = g.passed ? 0 : 1;
      if (s) anyGate = 1;
      writeTRS(fM, i, g.x, 0, g.z, 0, s, s, s);
      writeTRS(oM, i, g.x, 0, g.z, 0, s, s, s);
      writeTRS(pPM, i, g.x, 2.18, g.z + 0.12, 0, s, s, s);
      const gold = !g.passed && g.op === "mul" ? 1 : 0;
      writeTRS(rM, i, g.x, 2.2, g.z + 0.16, 0, gold * 1.42, gold * 0.78, gold);
      const sign = signs[i].mesh;
      sign.visible = !g.passed;
      if (!g.passed) {
        sign.position.set(g.x, 2.22, g.z + 0.32);
        sign.quaternion.copy(cam.quaternion);
        const bump = 1 + g.bump;
        sign.scale.set(bump, bump, bump);
      }
    }
    gateFrame.visible = !!anyGate;
    gateOutline.visible = !!anyGate;
    gatePanel.visible = !!anyGate;
    gateRim.visible = !!anyGate;
    if (anyGate) {
      gateFrame.instanceMatrix.needsUpdate = true;
      gateOutline.instanceMatrix.needsUpdate = true;
      gatePanel.instanceMatrix.needsUpdate = true;
      gateRim.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      if (c.state === "dead") {
        c.mesh.visible = false;
        continue;
      }
      c.mesh.visible = true;
      const jx = c.state === "shake" ? Math.sin(clock * 95) * 0.08 : 0;
      c.mesh.position.set(c.x + jx, 0, c.z);
    }
    if (flyT > 0) {
      fly.visible = true;
      fly.position.set(flyX, 1.3 + (0.4 - flyT) * 5, flyZ);
      fly.rotation.z += 0.2;
    } else fly.visible = false;

    projA.set(squadX, 1, -dist);
    projB.set(squadX + 1, 1, -dist);
    projA.project(cam);
    projB.project(cam);
    const pxPerM = Math.abs(projB.x - projA.x) * 0.5 * window.innerWidth;
    view.mPerPx = pxPerM > 0.5 ? 1 / pxPerM : view.mPerPx;
  }

  function tick(dt) {
    let left = dt > 0.05 ? 0.05 : dt;
    if (left < 0) left = 0;
    shotThisTick = false;
    while (left > 1e-5) {
      const h = left > 1 / 60 ? 1 / 60 : left;
      const sim = slowLeft > 0 ? h * 0.35 : h;
      tickOnce(sim);
      left -= h;
      if (ended === "lose") break;
    }
    if (running && !ended) {
      if (shotThisTick) audio.noteFire(weaponId);
      else audio.endFire();
    }
  }

  function tickReal(real) {
    if (flashT > 0) {
      flashT -= real;
      if (flashT < 0) flashT = 0;
      view.flash = flashT > 0 ? "BRIDGE HELD!" : "";
    }
    if (slowLeft > 0) {
      slowLeft -= real;
      view.slow = slowLeft;
      if (slowLeft <= 0) {
        slowLeft = 0;
        finishWin();
      }
    }
  }

  function step(dt) {
    let left = dt;
    while (left > 0) {
      const h = left > 0.05 ? 0.05 : left;
      tick(h);
      tickReal(h);
      left -= h;
      if (ended === "lose" || winSent) break;
    }
  }

  function tickTitle(dt) {
    clock += dt > 0.05 ? 0.05 : dt;
    publish();
  }

  const snap = {};
  function snapshot() {
    snap.n = squadN;
    snap.weapon = weaponId;
    snap.tier = tier;
    snap.color = mods.color;
    snap.dist = dist;
    snap.enemies = liveN;
    snap.bossHp = bossState.hp;
    snap.crateHp = crates[0].hp;
    snap.crate2 = crates[1].hp;
    snap.gate0 = gates[0] ? gates[0].label : "";
    snap.gate1 = gates[1] ? gates[1].label : "";
    snap.x = squadX;
    snap.z = -dist;
    snap.ended = ended;
    snap.kills = kills;
    snap.cratesOpened = cratesOpened;
    snap.ram = crateRammed;
    snap.bossSec = bossSec;
    snap.half = half;
    snap.target = targetX;
    snap.running = running ? 1 : 0;
    snap.arena = arenaStarted;
    return snap;
  }

  function selfTest() {
    const fails = selfTestRules();
    if (tris.soldier > 350) fails.push("soldier tris " + tris.soldier);
    if (tris.bober > 5000) fails.push("bober tris " + tris.bober);
    if (tris.boss > 6000) fails.push("boss tris " + tris.boss);
    if (!soldierBuilt.geo.index) fails.push("soldier not indexed");
    if (!boberBuilt.geo.index) fails.push("bober not indexed");
    const o = new THREE.Object3D();
    o.position.set(1, 2, 3);
    o.rotation.set(0, 0.4, 0);
    o.scale.set(1.2, 0.8, 1.5);
    o.updateMatrix();
    const el = new Float32Array(16);
    writeTRS(el, 0, 1, 2, 3, 0.4, 1.2, 0.8, 1.5);
    for (let i = 0; i < 16; i++) {
      if (Math.abs(el[i] - o.matrix.elements[i]) > 1e-4) fails.push("trs " + i);
    }
    camera.position.set(0, 9, 11);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 1.15, -14);
    camera.updateMatrixWorld(true);
    const a = new THREE.Vector3(0, 1, 0).project(camera);
    const b = new THREE.Vector3(1, 1, 0).project(camera);
    if (!(b.x > a.x + 0.001)) fails.push("camera right");

    reset();
    running = true;
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = 5;
    const rat = spawnEnemy(0, 0.05, -8);
    const id = allocB();
    bx[id] = 0.05;
    by[id] = 0.46;
    bz[id] = -5;
    bvx[id] = 0;
    bvy[id] = 0;
    bvz[id] = -50;
    bdmg[id] = 30;
    blife[id] = 1;
    bkind[id] = 0;
    bfall[id] = 0;
    step(0.2);
    const pr = pools[0];
    if (rat >= 0 && pr.alive[rat] && pr.hp[rat] > 15) fails.push("bullet miss hp " + pr.hp[rat]);

    reset();
    running = true;
    squadN = 10;
    targetX = 30;
    step(0.8);
    const lim = half - formationRadius(10, half);
    if (squadX > lim + 0.05 || squadX < -lim - 0.05) fails.push("rail " + squadX);

    reset();
    running = true;
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = 9;
    squadN = 10;
    squadX = -2;
    targetX = -2;
    dist = 199.2;
    prevZ = -199.2;
    step(0.25);
    if (squadN !== 20) fails.push("live x2 " + squadN);

    reset();
    running = true;
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = 9;
    squadN = 11;
    squadX = 2.2;
    targetX = 2.2;
    dist = 394.2;
    prevZ = -394.2;
    step(0.25);
    if (squadN !== 6) fails.push("live /2 " + squadN);

    reset();
    running = true;
    for (let i = 0; i < 200; i++) {
      const spawned = spawnEnemy(0, ((i % 12) - 6) * 0.6, -30 - ((i / 12) | 0) * 1.5);
      if (spawned >= 0) pools[0].freeze[spawned] = 1;
    }
    if (liveN < 200) fails.push("spawn " + liveN);
    const t0 = performance.now();
    killAll();
    const hitch = performance.now() - t0;
    if (hitch > 35) fails.push("hitch " + hitch.toFixed(1));
    if (liveN !== 0) fails.push("killall " + liveN);
    reset();
    return { fails, soldier: tris.soldier, bober: tris.bober, boss: tris.boss };
  }

  function killAll() {
    for (let t = 0; t < 3; t++) {
      const p = pools[t];
      for (let i = 0; i < CAP; i++) {
        if (!p.alive[i]) continue;
        const fxOn = pFreeN > 8;
        p.alive[i] = 0;
        p.free[p.freeN++] = i;
        liveN--;
        kills++;
        if (fxOn) {
          puff(p.x[i], 0.4, p.z[i], 0, 4, 2, 0.35, 0.4);
          puff(p.x[i], 0.6, p.z[i], 1, 4, 1.4, 0.4, 0.35);
        }
      }
    }
    if (liveN < 0) liveN = 0;
    bench = 0;
    publish();
  }

  function spawnPack(kind, count, hp, freeze) {
    const type = kind === "beetle" ? 1 : kind === "brute" ? 2 : 0;
    bench = 1;
    const n = count | 0;
    for (let i = 0; i < n; i++) {
      const id = spawnEnemy(type, ((i % 14) - 7) * 0.62, -dist - 18 - ((i / 14) | 0) * 1.35);
      if (id < 0) break;
      if (hp) pools[type].hp[id] = hp;
      if (freeze) pools[type].freeze[id] = 1;
    }
    publish();
    return liveN;
  }

  reset();

  return {
    view,
    tris,
    get time() {
      return clock;
    },
    reset,
    start() {
      reset();
      running = true;
      publish();
    },
    tick,
    tickReal,
    step,
    sync,
    tickTitle,
    setHooks(h) {
      hooks = h || hooks;
    },
    drag(meters) {
      if (!running || ended) return;
      targetX += meters;
      steered = 1;
      view.steered = 1;
    },
    setAxis(v) {
      axis = v;
      if (v) {
        steered = 1;
        view.steered = 1;
      }
    },
    pointerDown(v) {
      pointing = v ? 1 : 0;
    },
    selfTest,
    snapshot,
    spawnPack,
    killAll,
    setSquad(n) {
      squadN = clamp(n | 0, 0, SIM_CAP);
      if (running && squadN === 0) doLose();
      publish();
    },
    hurtCrate(dmg) {
      const c = crates[0];
      if (c.state !== "idle") return c.hp;
      c.hp = Math.max(0, c.hp - dmg);
      c.dirty = 1;
      if (c.hp <= 0) breakCrate(c);
      publish();
      return c.hp;
    },
    damageGate(hits) {
      const g = gates[0];
      if (g && !g.passed && shootGate(g, hits)) relabel(0);
      publish();
      return g ? g.label : "";
    },
    forceRack() {
      for (let i = 0; i < SCRIPT.length; i++) if (SCRIPT[i].at < 340) fired[i] = 1;
      dist = 345;
      prevZ = -345;
      squadX = -3.2;
      targetX = -3.2;
      publish();
    },
    debugWin() {
      if (squadN < 30) squadN = 30;
      kills = 40;
      cratesOpened = 1;
      crateRammed = 0;
      if (!arenaStarted) startArena();
      bossSec = 10;
      bossState.hp = 0;
      bossState.alive = 0;
      beginWin();
      publish();
    },
    debugLose() {
      squadN = 0;
      doLose();
      publish();
    },
    killBoss() {
      if (!arenaStarted) startArena();
      hurtBoss(99999, 0, bossState.x, 1.6, bossState.z);
      publish();
    },
    setBot(v) {
      bot = !!v;
    },
  };
}
