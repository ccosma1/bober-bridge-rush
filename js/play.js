// Dam Run fight. World forward is -Z. Squad z = -distance.
// The chase camera sits on +Z, so screen-right is world +X.

import * as THREE from "three";
import {
  ADVANCE,
  ENEMY,
  GUN_ORDER,
  LEVELS,
  RENDER_CAP,
  SIM_CAP,
  STARTERS,
  STEER_MAX,
  WEAPONS,
  applyGate,
  boberReward,
  clampLane,
  clogHit,
  crateHp,
  formationOffsets,
  formationRadius,
  freshGate,
  gateBlue,
  gateLabel,
  hairGrowth,
  levelOf,
  mysteryPick,
  nextLevel,
  selfTestRules,
  shootGate,
  shownCount,
  squadDmgMul,
  starsFor,
  tierAfterPickup,
  weaponMods,
} from "./rules.js?v=br2";
import {
  animToon,
  attachOutline,
  blobTexture,
  digitMaterial,
  drawWeaponIcon,
  makeSign,
  outlineAnim,
  paintCrateFace,
  paintCrateHp,
  paintGateSign,
  paintSign,
  toon,
  writeLog,
  writeQuat,
  writeTRS,
} from "./mats.js?v=br2";
import {
  arrowGeo,
  buildBaron,
  buildBigTub,
  buildBober,
  buildClogling,
  buildCrateGeo,
  buildDuck,
  buildGateFrame,
  buildGrunk,
  buildHairball,
  buildHauler,
  buildLeaf,
  buildPedestal,
  buildSoldier,
  buildSpitter,
  buildSuds,
  buildWrench,
  bulletGeo,
  flameGeo,
  logGeo,
  quadGeo,
  rocketGeo,
  streamGeo,
} from "./build.js?v=br2";

const STRIDE = 320;
const CAPS = [320, 320, 320, 120, 120, 120, 120];
const TYPES = 7;
const BALLN = 400;
const ARROWN = 100;
const LOGN = 80;
const ROCKN = 60;
const PARTYN = 150;
const MUDN = 16;
const CASEN = 60;
const EMBN = 80;
const PUDN = 20;
const HAZN = 16;
const DUCKN = 16;
const PUFFS = 256;
const FLOATS = 40;
const GLYPHS = FLOATS * 4;
const CORE = 0.75;
const QX = -0.70710678118;
const QW = 0.70710678118;

const TIER_NAMES = ["", "Wood", "Stone", "Iron", "Gold"];
const TIER_COLORS = ["", "#8B5A2B", "#8E99A4", "#6E8EAE", "#F5C400"];
const KIND_OF = { clog: 0, suds: 1, hauler: 2, hair: 3, spit: 4, leaf: 5, duck: 6 };

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
  const builtE = [
    buildClogling(),
    buildSuds(),
    buildHauler(),
    buildHairball(),
    buildSpitter(),
    buildLeaf(),
    buildDuck(),
  ];
  const baronBuilt = buildBaron();
  const tubBuilt = buildBigTub();
  const grunkBuilt = buildGrunk();
  const wrenchBuilt = buildWrench();
  const tris = {
    soldier: soldierBuilt.tris,
    bober: boberBuilt.tris,
    boss: Math.max(baronBuilt.tris, tubBuilt.tris, grunkBuilt.tris),
  };

  const soldierPhase = new Float32Array(RENDER_CAP);
  const soldierHit = new Float32Array(RENDER_CAP);
  for (let i = 0; i < RENDER_CAP; i++) soldierPhase[i] = i * 0.71;
  soldierBuilt.geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(soldierPhase, 1));
  soldierBuilt.geo.setAttribute("aHit", new THREE.InstancedBufferAttribute(soldierHit, 1));
  const animShell = outlineAnim(0.035);
  const soldiers = new THREE.InstancedMesh(soldierBuilt.geo, animToon(), RENDER_CAP);
  soldiers.frustumCulled = false;
  soldiers.count = 0;
  soldiers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(soldiers);
  const soldierShell = new THREE.InstancedMesh(soldierBuilt.geo, animShell, RENDER_CAP);
  soldierShell.frustumCulled = false;
  soldierShell.count = 0;
  soldierShell.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(soldierShell);

  const boberN = boberBuilt.geo.getAttribute("position").count;
  boberBuilt.geo.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(boberN), 1));
  boberBuilt.geo.setAttribute("aHit", new THREE.BufferAttribute(new Float32Array(boberN), 1));
  const bober = new THREE.Mesh(boberBuilt.geo, animToon());
  bober.frustumCulled = false;
  attachOutline(bober, 0.04);
  bober.children[0].material = animShell;
  scene.add(bober);

  const pillarMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: "varying float vH; void main(){ vH = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float uTime; varying float vH; void main(){ float pulse = 0.82 + 0.18 * sin(uTime * 2.4); float a = (1.0 - vH) * 0.42 * pulse; gl_FragColor = vec4(1.0, 0.78, 0.32, a); }",
  });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, 7, 14, 1, true), pillarMat);
  pillar.frustumCulled = false;
  pillar.renderOrder = 1;
  scene.add(pillar);

  const blobGeo = new THREE.PlaneGeometry(0.72, 0.46);
  blobGeo.rotateX(-Math.PI / 2);
  const blobs = new THREE.InstancedMesh(
    blobGeo,
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    400
  );
  blobs.frustumCulled = false;
  blobs.count = 0;
  blobs.renderOrder = -1;
  blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(blobs);

  const white = new THREE.Color("#ffffff");

  function makeEnemy(built, cap) {
    const phase = new Float32Array(cap);
    const hit = new Float32Array(cap);
    built.geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    built.geo.setAttribute("aHit", new THREE.InstancedBufferAttribute(hit, 1));
    const mesh = new THREE.InstancedMesh(built.geo, animToon(), cap);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.visible = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    const shell = new THREE.InstancedMesh(built.geo, animShell, cap);
    shell.frustumCulled = false;
    shell.count = 0;
    shell.visible = false;
    shell.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(shell);
    const free = new Int16Array(cap);
    for (let i = 0; i < cap; i++) free[i] = i;
    return {
      cap,
      alive: new Uint8Array(cap),
      x: new Float32Array(cap),
      z: new Float32Array(cap),
      hp: new Float32Array(cap),
      maxHp: new Float32Array(cap),
      foam: new Float32Array(cap),
      phase,
      hit,
      biteAcc: new Float32Array(cap),
      freeze: new Float32Array(cap),
      slowT: new Float32Array(cap),
      stagT: new Float32Array(cap),
      burnT: new Float32Array(cap),
      burnD: new Float32Array(cap),
      age: new Float32Array(cap),
      radS: new Float32Array(cap),
      side: new Float32Array(cap),
      lob: new Float32Array(cap),
      stamp: new Int32Array(cap),
      free,
      freeN: cap,
      mesh,
      shell,
      phaseAttr: built.geo.getAttribute("aPhase"),
      hitAttr: built.geo.getAttribute("aHit"),
    };
  }

  const pools = [];
  for (let t = 0; t < TYPES; t++) pools.push(makeEnemy(builtE[t], CAPS[t]));

  function makeShots(geo, mat, n) {
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.visible = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0, white);
    scene.add(mesh);
    const free = new Int16Array(n);
    for (let i = 0; i < n; i++) free[i] = i;
    return {
      n,
      mesh,
      x: new Float32Array(n),
      y: new Float32Array(n),
      z: new Float32Array(n),
      vx: new Float32Array(n),
      vy: new Float32Array(n),
      vz: new Float32Array(n),
      dmg: new Float32Array(n),
      life: new Float32Array(n),
      roll: new Float32Array(n),
      ox: new Float32Array(n),
      oz: new Float32Array(n),
      extra: new Float32Array(n),
      extra2: new Float32Array(n),
      col: new Uint8Array(n),
      flag: new Uint8Array(n),
      hits: new Uint8Array(n),
      tag: new Int32Array(n),
      alive: new Uint8Array(n),
      free,
      freeN: n,
    };
  }

  const streakMat = () => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const balls = makeShots(bulletGeo(), streakMat(), BALLN);
  const arrows = makeShots(arrowGeo(), streakMat(), ARROWN);
  const logs = makeShots(logGeo(), toon("#8B5A2B"), LOGN);
  const rockets = makeShots(rocketGeo(), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ROCKN);
  const party = makeShots(quadGeo(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false }), PARTYN);
  const muds = makeShots(new THREE.SphereGeometry(0.28, 6, 4), toon("#5E6B4A"), MUDN);
  const cases = makeShots(new THREE.BoxGeometry(0.05, 0.04, 0.08), toon("#E6C15A"), CASEN);
  const embers = makeShots(quadGeo(), new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, depthWrite: false, toneMapped: false }), EMBN);
  const puddles = makeShots(new THREE.CircleGeometry(0.45, 8), new THREE.MeshBasicMaterial({ color: 0xe0a030, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }), PUDN);
  const hazards = makeShots(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0xff4f5e, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }), HAZN);
  const vducks = makeShots(builtE[6].geo, toon("#ffffff", { vertexColors: true }), DUCKN);
  const stuckMesh = new THREE.InstancedMesh(builtE[5].geo, animToon(), 16);
  stuckMesh.frustumCulled = false;
  stuckMesh.count = 0;
  stuckMesh.visible = false;
  scene.add(stuckMesh);
  const stuckT = new Float32Array(16);
  const stuckS = new Int16Array(16);
  let stuckN = 0;

  const bx = balls.x;
  const by = balls.y;
  const bz = balls.z;
  const bvx = balls.vx;
  const bvy = balls.vy;
  const bvz = balls.vz;
  const bdmg = balls.dmg;
  const blife = balls.life;
  const bkind = balls.flag;
  const bfall = balls.col;
  const balive = balls.alive;

  const flameMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform float uTime; varying vec2 vUv; void main(){ float f=fract(vUv.y-uTime*1.4); float a=smoothstep(0.0,0.2,vUv.y)*(1.0-vUv.y); vec3 col=mix(vec3(1.0,0.82,0.25), vec3(0.85,0.22,0.05), f); gl_FragColor=vec4(col,a*0.8); }",
  });
  const flames = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(flameGeo(), flameMat);
    m.frustumCulled = false;
    m.visible = false;
    m.renderOrder = 2;
    scene.add(m);
    flames.push(m);
  }
  const sapMat = new THREE.MeshBasicMaterial({ color: 0xe0a030, transparent: true, opacity: 0.8, depthWrite: false });
  const saps = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(streamGeo(), sapMat);
    m.frustumCulled = false;
    m.visible = false;
    scene.add(m);
    saps.push(m);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.8, depthWrite: false }));
  glow.visible = false;
  glow.scale.set(1.2, 1.2, 1);
  scene.add(glow);
  const goldRing = new THREE.InstancedMesh(new THREE.TorusGeometry(0.16, 0.03, 4, 8), new THREE.MeshBasicMaterial({ color: 0xf5c400 }), RENDER_CAP);
  goldRing.frustumCulled = false;
  goldRing.count = 0;
  goldRing.visible = false;
  scene.add(goldRing);

  const puffCol = [
    lin("#5E6B4A"),
    lin("#7FA64A"),
    lin("#F4E6C3"),
    lin("#C4A882"),
    lin("#F5C400"),
    lin("#4FC3FF"),
    lin("#FF4F5E"),
    lin("#E86A1A"),
    lin("#FF4FA3"),
    lin("#E0A030"),
    lin("#F7FBFA"),
  ];
  const puffs = new THREE.InstancedMesh(
    quadGeo(),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    PUFFS
  );
  puffs.frustumCulled = false;
  puffs.count = 0;
  puffs.visible = false;
  puffs.renderOrder = 2;
  puffs.setColorAt(0, white);
  scene.add(puffs);

  function makeFx(geo, mat, n) {
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.visible = false;
    mesh.renderOrder = 2;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    const free = new Int16Array(n);
    for (let i = 0; i < n; i++) free[i] = i;
    return {
      n, mesh, free, freeN: n,
      x: new Float32Array(n),
      y: new Float32Array(n),
      z: new Float32Array(n),
      life: new Float32Array(n),
      max: new Float32Array(n),
      size: new Float32Array(n),
      alive: new Uint8Array(n),
    };
  }
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xfff2d0,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xffe08a,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const splatMat = new THREE.MeshBasicMaterial({
    color: 0x6a5438,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    toneMapped: false,
  });
  const muzzles = makeFx(quadGeo(), glowMat, 48);
  const sparks = makeFx(quadGeo(), sparkMat, 48);
  const splats = makeFx(new THREE.CircleGeometry(0.55, 8), splatMat, 24);

  const digits = new THREE.InstancedMesh(quadGeo(), digitMaterial(), GLYPHS);
  digits.frustumCulled = false;
  digits.count = 0;
  digits.visible = false;
  digits.renderOrder = 3;
  const digitAttr = new Float32Array(GLYPHS);
  digits.geometry.setAttribute("aDigit", new THREE.InstancedBufferAttribute(digitAttr, 1));
  scene.add(digits);

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
      fragmentShader: "void main(){ gl_FragColor=vec4(0.118,0.078,0.063,1.0); }",
    });
  }

  const frameGeo = buildGateFrame();
  const gateFrame = new THREE.InstancedMesh(frameGeo, toon("#ffffff", { vertexColors: true }), 8);
  const gateOutline = new THREE.InstancedMesh(frameGeo, outlineGate(0.03), 8);
  const gateTime = { value: 0 };
  const gateMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    toneMapped: false,
  });
  gateMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = gateTime;
    shader.fragmentShader = "uniform float uTime;\n" + shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      "diffuseColor.rgb *= 0.78 + 0.22 * sin(gl_FragCoord.y * 0.09 - uTime * 2.6);\n#include <opaque_fragment>"
    );
  };
  const gatePanel = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.5, 3.5), gateMat, 8);
  const gateRim = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(4.85, 3.85),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    }),
    8
  );
  for (const m of [gateFrame, gateOutline, gatePanel, gateRim]) {
    m.frustumCulled = false;
    m.count = 0;
    m.visible = false;
    scene.add(m);
  }
  gatePanel.setColorAt(0, white);
  const blueC = new THREE.Color("#3AA0FF");
  const redC = new THREE.Color("#FF4A4A");
  const signs = [];
  for (let i = 0; i < 8; i++) {
    const sign = makeSign();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.8),
      new THREE.MeshBasicMaterial({ map: sign.tex, transparent: true, alphaTest: 0.06, toneMapped: false, side: THREE.DoubleSide })
    );
    mesh.renderOrder = 2;
    mesh.visible = false;
    scene.add(mesh);
    signs.push({ mesh, canvas: sign.canvas, ctx: sign.ctx, tex: sign.tex });
  }

  const crateGeo = buildCrateGeo();
  const crates = [];
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(crateGeo, toon("#ffffff", { vertexColors: true }));
    attachOutline(mesh, 0.03);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.15),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1, toneMapped: false })
    );
    face.position.set(0, 2.05, 0.78);
    mesh.add(face);
    const hpCanvas = document.createElement("canvas");
    hpCanvas.width = 512;
    hpCanvas.height = 280;
    const hpCtx = hpCanvas.getContext("2d");
    const hpTex = new THREE.CanvasTexture(hpCanvas);
    hpTex.colorSpace = THREE.SRGBColorSpace;
    const hpFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 1.6),
      new THREE.MeshBasicMaterial({ map: hpTex, transparent: true, depthWrite: false, toneMapped: false })
    );
    hpFace.position.set(0, 0.95, 0.8);
    mesh.add(hpFace);
    const top = new THREE.Mesh(builtE[6].geo, toon("#ffffff", { vertexColors: true }));
    top.position.set(0, 3.05, 0);
    top.scale.set(0.85, 0.85, 0.85);
    top.visible = false;
    mesh.add(top);
    mesh.visible = false;
    scene.add(mesh);
    crates.push({
      mesh, canvas, ctx, tex, top, face, hpCanvas, hpCtx, hpTex, hpFace,
      kind: "weapon", gun: "bow", hp: 1, max: 1, x: 0, z: -40,
      state: "dead", shake: 0, reel: 0, dirty: 0, extra: "", jab: 0,
    });
  }

  const rack = new THREE.Group();
  const ped = new THREE.InstancedMesh(buildPedestal(), toon("#C8B49A"), 3);
  ped.frustumCulled = false;
  ped.count = 3;
  rack.add(ped);
  const pedM = ped.instanceMatrix.array;
  const rackSlots = [
    { kind: "gun", gun: "shot", bonus: 0, n: 0, x: -3.33 },
    { kind: "gun", gun: "smg", bonus: 0, n: 0, x: 0 },
    { kind: "gun", gun: "bow", bonus: 0, n: 0, x: 3.33 },
  ];
  const rackBits = [];
  for (let i = 0; i < 3; i++) {
    writeTRS(pedM, i, rackSlots[i].x, 0, 0, 0, 1, 1, 1);
    const iconC = document.createElement("canvas");
    iconC.width = 256;
    iconC.height = 256;
    const iconTex = new THREE.CanvasTexture(iconC);
    iconTex.colorSpace = THREE.SRGBColorSpace;
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ map: iconTex, toneMapped: false, transparent: true, side: THREE.DoubleSide })
    );
    icon.position.set(rackSlots[i].x, 1.9, 0.35);
    rack.add(icon);
    const name = makeSign();
    const nameMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.7),
      new THREE.MeshBasicMaterial({ map: name.tex, transparent: true, alphaTest: 0.05, toneMapped: false })
    );
    nameMesh.position.set(rackSlots[i].x, 2.85, 0.2);
    rack.add(nameMesh);
    const chipC = document.createElement("canvas");
    chipC.width = 256;
    chipC.height = 96;
    const chipTex = new THREE.CanvasTexture(chipC);
    chipTex.colorSpace = THREE.SRGBColorSpace;
    const chipMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.42),
      new THREE.MeshBasicMaterial({ map: chipTex, toneMapped: false })
    );
    chipMesh.position.set(rackSlots[i].x, 2.42, 0.28);
    rack.add(chipMesh);
    rackBits.push({
      iconC, iconG: iconC.getContext("2d"), iconTex, icon,
      name, nameMesh, chipC, chipG: chipC.getContext("2d"), chipTex, chipMesh,
    });
  }
  ped.instanceMatrix.needsUpdate = true;
  const banner = makeSign();
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 0.7),
    new THREE.MeshBasicMaterial({ map: banner.tex, transparent: true, alphaTest: 0.05, toneMapped: false })
  );
  bannerMesh.position.set(0, 3.4, 0.15);
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(3.5, 0.08, 6, 24, Math.PI),
    new THREE.MeshBasicMaterial({
      color: 0x3aa0ff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  arch.position.y = 0.4;
  rack.add(arch);
  bannerMesh.visible = false;
  rack.add(bannerMesh);
  rack.visible = false;
  scene.add(rack);
  let rackZ = -345;
  let rackBanner = "";
  let rackStyle = "standard";

  const boss = new THREE.Mesh(baronBuilt.geo, toon("#ffffff", { vertexColors: true }));
  boss.frustumCulled = false;
  attachOutline(boss, 0.08);
  const crownMarker = new THREE.Object3D();
  crownMarker.position.copy(baronBuilt.crownLocal);
  boss.add(crownMarker);
  boss.visible = false;
  scene.add(boss);
  const wrench = new THREE.Mesh(wrenchBuilt.geo, toon("#ffffff", { vertexColors: true }));
  wrench.frustumCulled = false;
  wrench.visible = false;
  scene.add(wrench);
  const manhole = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 12),
    new THREE.MeshBasicMaterial({ color: 0x1a1714, toneMapped: false })
  );
  manhole.rotation.x = -Math.PI / 2;
  manhole.position.y = 0.24;
  manhole.visible = false;
  scene.add(manhole);
  const waySign = makeSign();
  paintSign(waySign.ctx, waySign.canvas, "THIS WAY");
  waySign.tex.needsUpdate = true;
  const wayArrow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.1),
    new THREE.MeshBasicMaterial({ map: waySign.tex, transparent: true, toneMapped: false })
  );
  wayArrow.visible = false;
  scene.add(wayArrow);
  const zone = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x6a1020, transparent: true, opacity: 0.45, depthWrite: false })
  );
  zone.rotation.x = -Math.PI / 2;
  zone.position.y = 0.25;
  zone.visible = false;
  scene.add(zone);

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
  const words = [];
  for (let i = 0; i < 16; i++) words.push({ on: 0, text: "", x: 0, y: 0, z: 0, life: 0, bad: 0 });
  let wordI = 0;

  const head = new Int16Array(512);
  const nextE = new Int16Array(STRIDE * TYPES);
  const fx = new Float32Array(64);
  const fz = new Float32Array(64);
  const cds = new Float32Array(RENDER_CAP);
  const ct = new Int8Array(48);
  const ci = new Int16Array(48);
  let cn = 0;
  const cd = new Float32Array(48);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const gates = [];
  const fired = new Uint8Array(16);

  let level = levelOf("1-1");
  let unlocked = STARTERS.slice();
  const seen = {};
  for (let i = 0; i < STARTERS.length; i++) seen[STARTERS[i]] = true;

  const bossState = {
    hp: 3000, alive: 0, shown: 0, summoned: 0, x: 0, z: -711, homeZ: -711,
    mode: 0, t: 1.4, lock: 0, cool: 6, p60: 0, p30: 0,
  };
  let bossKind = "baron";
  let wrenchPhase = 0;
  let wrenchT = 0;
  let wrenchX = 0;
  let wrenchY = 1.4;
  let wrenchZ = 0;
  let zoneSide = 1;
  let zoneT = 0;
  let pullT = 0;
  let shotTag = 1;
  let frameTag = 1;

  const view = {
    n: 3, weaponId: "bow", tier: 1, weaponName: "Twig Crossbow", tierName: "Wood",
    family: "ARROWS", color: "#F4E6C3", gold: 0, spin: 0,
    dist: 0, arena: 0, bar: 0, barText: "", enemies: 0, counts,
    bossHp: 3000, bossMax: 3000, bossX: 0, flash: "", half: 5,
    squadX: 0, squadZ: 0, radius: 0.8, bannerY: 2.7, ended: "", running: 0,
    steered: 0, kills: 0, cratesOpened: 0, crateRammed: 0, bossSec: 0,
    calls: 0, mPerPx: 0.02, gate0: "+5", crateHp: 480, targetX: 0, slow: 0, shake: 0,
    levelId: "1-1", levelName: level.name, intro: level.intro, winTitle: level.win,
    river: 0, dam: 1, theme: 0, toastT: 0, toastName: "", toastLine: "",
    barkT: 0, bark: "", words,
  };

  let clock = 0;
  let squadN = 3;
  let squadX = 0;
  let targetX = 0;
  let dist = 0;
  let prevZ = 0;
  let half = 5;
  let radius = 0.8;
  let weaponId = "bow";
  let tier = 1;
  let mods = weaponMods("bow", 1);
  let running = false;
  let ended = "";
  let winSent = false;
  let slowLeft = 0;
  let flashT = 0;
  let camShake = 0;
  const DECK = 0.28;
  let liveN = 0;
  let kills = 0;
  let duckKills = 0;
  let duckCrates = 0;
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
  let spin = 0;
  let kickT = 0;
  let gunAcc = 0;
  let toastT = 0;
  let toastName = "";
  let toastLine = "";
  let barkT = 0;
  let barkText = "";
  let aimX = 0;
  let aimY = 1;
  let aimZ = 0;
  let crownX = 0;
  let crownY = 3;
  let crownZ = -711;
  let hooks = { win() {}, lose() {}, seen() {} };
  const crownV = new THREE.Vector3();
  const projA = new THREE.Vector3();
  const projB = new THREE.Vector3();

  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }

  function clearPool(s) {
    s.freeN = s.n;
    s.alive.fill(0);
    for (let i = 0; i < s.n; i++) s.free[i] = i;
  }
  function allocS(s) {
    if (s.freeN <= 0) return -1;
    const i = s.free[--s.freeN];
    s.alive[i] = 1;
    s.life[i] = 1;
    s.hits[i] = 0;
    s.flag[i] = 0;
    s.extra[i] = 0;
    s.extra2[i] = 0;
    s.roll[i] = 0;
    s.vy[i] = 0;
    return i;
  }
  function freeS(s, i) {
    if (!s.alive[i]) return;
    s.alive[i] = 0;
    s.free[s.freeN++] = i;
  }
  function allocB() {
    return allocS(balls);
  }

  function copyInstances(src, dst, n) {
    dst.count = n;
    dst.visible = n > 0;
    if (!n) return;
    dst.instanceMatrix.array.set(src.instanceMatrix.array.subarray(0, n * 16));
    dst.instanceMatrix.needsUpdate = true;
  }

  function paintFx(pool, cam, flat) {
    const m = pool.mesh.instanceMatrix.array;
    let w = 0;
    const qx = flat ? QX : cam.quaternion.x;
    const qy = flat ? 0 : cam.quaternion.y;
    const qz = flat ? 0 : cam.quaternion.z;
    const qw = flat ? QW : cam.quaternion.w;
    for (let i = 0; i < pool.n; i++) {
      if (!pool.alive[i]) continue;
      const s = pool.size[i] * (0.35 + 0.65 * (pool.life[i] / (pool.max[i] || 1)));
      writeQuat(m, w, pool.x[i], pool.y[i], pool.z[i], s, qx, qy, qz, qw);
      w++;
    }
    pool.mesh.count = w;
    pool.mesh.visible = w > 0;
    if (w) pool.mesh.instanceMatrix.needsUpdate = true;
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

  function word(text, x0, y0, z0, bad) {
    const w = words[wordI];
    wordI = (wordI + 1) % words.length;
    w.on = 1;
    w.text = text;
    w.bad = bad ? 1 : 0;
    w.x = x0;
    w.y = y0;
    w.z = z0;
    w.life = 1.15;
  }

  function clearFx(pool) {
    pool.alive.fill(0);
    pool.freeN = pool.n;
    for (let i = 0; i < pool.n; i++) pool.free[i] = i;
  }

  function spawnFx(pool, x0, y0, z0, life, size) {
    if (pool.freeN <= 0) return;
    const i = pool.free[--pool.freeN];
    pool.alive[i] = 1;
    pool.x[i] = x0;
    pool.y[i] = y0;
    pool.z[i] = z0;
    pool.life[i] = life;
    pool.max[i] = life;
    pool.size[i] = size;
  }

  function fadeFx(pool, h) {
    for (let i = 0; i < pool.n; i++) {
      if (!pool.alive[i]) continue;
      pool.life[i] -= h;
      if (pool.life[i] <= 0) {
        pool.alive[i] = 0;
        pool.free[pool.freeN++] = i;
      }
    }
  }

  function paintCracks(ctx, canvas, ratio) {
    if (ratio >= 0.66) return;
    ctx.strokeStyle = "#1E1410";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.18, canvas.height * 0.12);
    ctx.lineTo(canvas.width * 0.58, canvas.height * 0.78);
    ctx.stroke();
    if (ratio >= 0.33) return;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.78, canvas.height * 0.08);
    ctx.lineTo(canvas.width * 0.36, canvas.height * 0.9);
    ctx.stroke();
  }

  function say(text) {
    barkText = text;
    barkT = 1.5;
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
    if (!p || p.freeN <= 0 || liveN >= 320) return -1;
    const i = p.free[--p.freeN];
    const spec = ENEMY[type];
    const base = spec.hp * level.hpMul;
    p.alive[i] = 1;
    p.x[i] = x0;
    p.z[i] = z0;
    p.hp[i] = base;
    p.maxHp[i] = base;
    p.foam[i] = spec.foam ? spec.foam * level.hpMul : 0;
    p.hit[i] = 0;
    p.phase[i] = rnd() * 6.28;
    p.biteAcc[i] = rnd();
    p.freeze[i] = 0;
    p.slowT[i] = 0;
    p.stagT[i] = 0;
    p.burnT[i] = 0;
    p.burnD[i] = 0;
    p.age[i] = 0;
    p.radS[i] = 1;
    p.side[i] = rnd() < 0.5 ? -1 : 1;
    p.lob[i] = 0.6 + rnd() * 1.4;
    p.stamp[i] = 0;
    liveN++;
    counts[type]++;
    return i;
  }

  function releaseEnemy(type, i) {
    const p = pools[type];
    if (!p.alive[i]) return;
    p.alive[i] = 0;
    p.free[p.freeN++] = i;
    liveN--;
    counts[type]--;
    if (liveN < 0) liveN = 0;
    if (counts[type] < 0) counts[type] = 0;
  }

  function killEnemy(type, i, splashFx) {
    const p = pools[type];
    if (!p.alive[i]) return;
    const x0 = p.x[i];
    const z0 = p.z[i];
    releaseEnemy(type, i);
    kills++;
    if (type === 6) {
      duckKills++;
      word("QUACK", x0, 1.6, z0);
      audio.quack();
    }
    spawnFx(splats, x0, DECK + 0.03, z0, 1.3, 0.85 + (type === 2 ? 0.6 : 0));
    if (splashFx && pFreeN > 8) {
      puff(x0, 0.55, z0, 0, 4, 2.2, 0.4, 0.45);
      puff(x0, 0.9, z0, 1, 3, 1.8, 0.45, 0.32);
      if (kills % 100 === 0) popDuck(x0, 0.8, z0, 1);
    }
  }

  function popDuck(x0, y0, z0, n) {
    for (let k = 0; k < n; k++) {
      const i = allocS(vducks);
      if (i < 0) return;
      vducks.x[i] = x0;
      vducks.y[i] = y0;
      vducks.z[i] = z0;
      vducks.vx[i] = (rnd() * 2 - 1) * 3;
      vducks.vy[i] = 3 + rnd() * 2;
      vducks.vz[i] = (rnd() * 2 - 1) * 2;
      vducks.life[i] = 1.1;
    }
  }

  function dump(type, count, z, per) {
    if (!count || count <= 0) return z;
    const p = pools[type];
    const room = Math.min(count, p.freeN, 320 - liveN);
    const cols = Math.max(1, Math.min(per || 12, 12));
    for (let i = 0; i < room; i++) {
      const row = (i / cols) | 0;
      const col = i % cols;
      const nCols = Math.min(cols, room - row * cols);
      const x0 = nCols <= 1 ? 0 : -((nCols - 1) * 0.8) * 0.5 + col * 0.8;
      spawnEnemy(type, x0, z - row * 0.8);
    }
    return z - Math.ceil(room / cols) * 0.8;
  }

  function spawnWave(ev) {
    let z = -(ev.at + 21);
    z = dump(0, ev.clog || 0, z, 12);
    if (ev.hauler) z = dump(2, ev.hauler, z - 0.8, 4);
    if (ev.suds) z = dump(1, ev.suds, z - 0.8, 12);
    if (ev.hair) z = dump(3, ev.hair, z - 0.8, 6);
    if (ev.spit) z = dump(4, ev.spit, z - 0.8, 6);
    if (ev.leaf) {
      for (let s = 0; s < ev.leaf; s++) z = dump(5, 8, z - 0.8, 8);
    }
    if (ev.duck) dump(6, ev.duck, z - 0.8, 3);
  }

  function armHazard(x0, z0, r, delay, maxKill) {
    const i = allocS(hazards);
    if (i < 0) return;
    hazards.x[i] = x0;
    hazards.z[i] = z0;
    hazards.y[i] = 0.26;
    hazards.extra[i] = r;
    hazards.life[i] = delay;
    hazards.extra2[i] = maxKill;
  }

  function buildGates() {
    gates.length = 0;
    let n = 0;
    const evs = level.events;
    for (let s = 0; s < evs.length; s++) {
      const ev = evs[s];
      if (ev.kind !== "gate") continue;
      for (let side = 0; side < 2; side++) {
        const g = freshGate(ev.pair[side].op, ev.pair[side].k);
        g.x = side === 0 ? -2.45 : 2.45;
        g.z = -ev.at;
        g.side = side;
        g.passed = 0;
        g.bump = 0;
        g.flip = 0;
        g.label = gateLabel(g);
        g.index = n;
        gates.push(g);
        paintGateSign(signs[n].ctx, signs[n].canvas, g.label, gateBlue(g.op));
        signs[n].tex.needsUpdate = true;
        const tint = gateBlue(g.op) ? blueC : redC;
        gatePanel.setColorAt(n, tint);
        gateRim.setColorAt(n, tint);
        n++;
      }
    }
    if (gatePanel.instanceColor) gatePanel.instanceColor.needsUpdate = true;
    if (gateRim.instanceColor) gateRim.instanceColor.needsUpdate = true;
  }

  function relabel(i) {
    const g = gates[i];
    g.label = gateLabel(g);
    g.bump = 0.36;
    paintGateSign(signs[i].ctx, signs[i].canvas, g.label, gateBlue(g.op));
    signs[i].tex.needsUpdate = true;
    const tint = gateBlue(g.op) ? blueC : redC;
    gatePanel.setColorAt(i, tint);
    gateRim.setColorAt(i, tint);
    gatePanel.instanceColor.needsUpdate = true;
    if (gateRim.instanceColor) gateRim.instanceColor.needsUpdate = true;
    puff(g.x, 2.2, g.z, gateBlue(g.op) ? 5 : 6, 3, 2.5, 0.3, 0.28);
  }

  function paintRackSlot(i) {
    const slot = rackSlots[i];
    const bit = rackBits[i];
    const ig = bit.iconG;
    ig.clearRect(0, 0, 256, 256);
    ig.fillStyle = "#F4E6C3";
    ig.beginPath();
    ig.arc(128, 128, 112, 0, Math.PI * 2);
    ig.fill();
    let label = "";
    let family = "";
    let chip = "";
    let col = TIER_COLORS[1];
    if (slot.kind === "tier") {
      ig.fillStyle = "#F5C400";
      ig.font = "900 92px Arial Black, Arial, sans-serif";
      ig.textAlign = "center";
      ig.textBaseline = "middle";
      ig.fillText("+1", 128, 132);
      label = "+1 TIER";
      family = "TIER";
      chip = "+1";
      col = "#F5C400";
    } else if (slot.kind === "vol") {
      ig.fillStyle = "#F5C400";
      ig.beginPath();
      ig.moveTo(78, 150);
      ig.lineTo(100, 96);
      ig.lineTo(156, 96);
      ig.lineTo(178, 150);
      ig.fill();
      label = "+" + (slot.n || 10) + " VOLUNTEERS";
      family = "SQUAD";
      chip = "+" + (slot.n || 10);
      col = "#3E6B45";
    } else {
      const w = WEAPONS[slot.gun] || WEAPONS.bow;
      drawWeaponIcon(ig, w.id, 128, 136, 150);
      const t = tierAfterPickup(weaponId, tier, w.id, slot.bonus || 0);
      label = w.name;
      family = w.family;
      chip = "T" + t + " " + TIER_NAMES[t];
      col = TIER_COLORS[t];
    }
    bit.iconTex.needsUpdate = true;
    paintSign(bit.name.ctx, bit.name.canvas, label);
    bit.name.ctx.font = "700 36px Arial, sans-serif";
    bit.name.ctx.fillStyle = "#F5C400";
    bit.name.ctx.textAlign = "center";
    bit.name.ctx.fillText(family, 256, 230);
    bit.name.tex.needsUpdate = true;
    const cg = bit.chipG;
    cg.clearRect(0, 0, 256, 96);
    cg.fillStyle = col;
    cg.fillRect(0, 0, 256, 96);
    cg.fillStyle = "#1E1410";
    cg.font = "900 40px Arial Black, Arial, sans-serif";
    cg.textAlign = "center";
    cg.textBaseline = "middle";
    cg.fillText(chip, 128, 50);
    bit.chipTex.needsUpdate = true;
  }

  function layoutLevel() {
    let ci = 0;
    rackTaken = 0;
    rackBanner = "";
    rackStyle = "standard";
    let haveRack = 0;
    for (let s = 0; s < level.events.length; s++) {
      const ev = level.events[s];
      if (ev.kind === "crate") {
        const items = ev.items || [];
        for (let k = 0; k < items.length && ci < crates.length; k++) {
          const item = items[k];
          let kind = item.type || "weapon";
          if (kind === "volunteer" && rnd() < 0.15) kind = "duck";
          let x = 0;
          if (ev.layout === "pair") x = k === 0 ? -3.35 : 3.35;
          else if (ev.layout === "row") x = (k - 1) * 3.3;
          if (item.x != null) x = item.x;
          const c = crates[ci++];
          c.kind = kind;
          c.gun = item.gun || "";
          c.max = crateHp(level.baseHp, kind, item.hp);
          c.hp = c.max;
          c.x = x;
          c.z = -ev.at;
          c.state = "idle";
          c.shake = 0;
          c.reel = 0;
          c.dirty = 1;
          c.extra = kind === "volunteer" ? "+" + level.vol : "";
          c.top.visible = kind === "duck";
        }
      } else if (ev.kind === "rack" && !haveRack) {
        haveRack = 1;
        rackZ = -ev.at;
        rackStyle = ev.rack || "standard";
        rackBanner = ev.banner || "";
        const slots = ev.slots || [];
        for (let k = 0; k < 3; k++) {
          const src = slots[k] || { kind: "gun", gun: "bow" };
          rackSlots[k].kind = src.kind || "gun";
          rackSlots[k].gun = src.gun || "bow";
          rackSlots[k].bonus = src.bonus || 0;
          rackSlots[k].n = src.n || 10;
          rackSlots[k].x = k === 0 ? -3.33 : k === 1 ? 0 : 3.33;
          writeTRS(pedM, k, rackSlots[k].x, 0, 0, 0, 1, 1, 1);
          rackBits[k].icon.position.x = rackSlots[k].x;
          rackBits[k].nameMesh.position.x = rackSlots[k].x;
          rackBits[k].chipMesh.position.x = rackSlots[k].x;
        }
        ped.instanceMatrix.needsUpdate = true;
      }
    }
    for (let i = ci; i < crates.length; i++) {
      crates[i].state = "dead";
      crates[i].hp = 0;
      crates[i].mesh.visible = false;
      crates[i].top.visible = false;
    }
    rack.visible = !!haveRack;
    if (rackBanner) {
      paintSign(banner.ctx, banner.canvas, rackBanner);
      banner.tex.needsUpdate = true;
      bannerMesh.visible = true;
    } else bannerMesh.visible = false;
    for (let i = 0; i < 3; i++) paintRackSlot(i);
    rack.position.set(0, 0, rackZ);
  }

  function flushCrates() {
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      if (!c.dirty || c.state === "dead") continue;
      const icon = c.state === "reel" ? (c.gun || "bow") : c.gun;
      paintCrateFace(c.ctx, c.canvas, c.kind, icon, c.hp, c.extra);
      paintCrateHp(c.hpCtx, c.hpCanvas, c.hp);
      const ratio = c.max > 0 ? c.hp / c.max : 1;
      paintCracks(c.ctx, c.canvas, ratio);
      paintCracks(c.hpCtx, c.hpCanvas, ratio);
      c.tex.needsUpdate = true;
      c.hpTex.needsUpdate = true;
      c.dirty = 0;
    }
  }

  function refreshMods() {
    mods = weaponMods(weaponId, tier);
    if (!rackTaken) {
      for (let i = 0; i < 3; i++) paintRackSlot(i);
    }
  }

  function equip(id, bonus) {
    tier = tierAfterPickup(weaponId, tier, id, bonus || 0);
    weaponId = id;
    spin = 0;
    refreshMods();
    if (mods.line && !seen[id]) {
      seen[id] = true;
      toastT = 1.5;
      toastName = "NEW GUN: " + mods.name;
      toastLine = mods.line;
      if (hooks.seen) hooks.seen(id);
    }
    flyX = squadX;
    flyZ = -dist;
    flyT = 0.35;
  }

  function breakCrate(c) {
    if (c.state !== "idle") return;
    c.hp = 0;
    c.dirty = 1;
    audio.crack();
    camShake = 0.15;
    puff(c.x, 1.6, c.z, 3, 10, 3.2, 0.45, 0.5);
    if (c.kind === "mystery") {
      c.state = "reel";
      c.reel = 0.6;
      c.gun = mysteryPick(unlocked, rnd);
    } else {
      c.state = "shake";
      c.shake = 0.15;
    }
  }

  function grantCrate(c) {
    c.state = "dead";
    c.mesh.visible = false;
    c.top.visible = false;
    flyX = c.x;
    flyZ = c.z;
    if (c.kind === "weapon" || c.kind === "mystery") {
      cratesOpened++;
      equip(c.gun || "bow", 0);
    } else if (c.kind === "volunteer") {
      cratesOpened++;
      squadN = Math.min(SIM_CAP, squadN + level.vol);
      floater(9200, c.x, 2.2, c.z, level.vol);
    } else if (c.kind === "tier") {
      cratesOpened++;
      tier = Math.min(4, tier + 1);
      refreshMods();
      flyT = 0.35;
    } else if (c.kind === "duck") {
      duckCrates++;
      audio.quack();
      popDuck(c.x, 1.6, c.z, 10);
      word("+40", c.x, 2.4, c.z);
    } else if (c.kind === "forged") {
      dump(0, 20, -dist - 10, 5);
      word("FORGERY!", c.x, 2.4, c.z);
      audio.crack();
    }
  }

  function ramCrate(c) {
    c.state = "dead";
    c.mesh.visible = false;
    c.top.visible = false;
    crateRammed = 1;
    audio.crack();
    puff(c.x, 1.4, c.z, 3, 8, 2.4, 0.35, 0.45);
    word("-5", c.x, 2.2, c.z, 1);
    hurtSquad(5, 1);
  }

  function hurtSquad(n, quiet) {
    if (ended || !running || n <= 0) return;
    const lost = Math.min(n, squadN);
    squadN -= n;
    if (squadN < 0) squadN = 0;
    audio.hurt();
    if (!quiet && lost > 0) {
      const flashes = Math.min(4, lost);
      for (let k = 0; k < flashes; k++) word("-1", squadX + (k - (flashes - 1) * 0.5) * 0.4, 1.8, -dist, 1);
      puff(squadX, 1.1, -dist, 2, Math.min(6, lost), 2.4, 0.35, 0.42);
    }
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
    if (bossKind === "baron") {
      say("THIS IS MERELY A FIRST NOTICE.");
      manhole.visible = true;
      manhole.position.set(bossState.x, 0.24, bossState.z);
    } else if (bossKind === "grunk") {
      say("Oh, it's a PLAN plan.");
      wayArrow.visible = true;
      wayArrow.position.set(bossState.x, 2.2, bossState.z - 2.4);
      wrench.visible = false;
      puff(bossState.x, 1.6, bossState.z, 7, 8, 3, 0.4, 0.4);
    }
    puff(bossState.x, 1.3, bossState.z, 0, 14, 4.5, 0.6, 0.8);
    puff(bossState.x, 1.8, bossState.z, 1, 8, 3, 0.55, 0.55);
  }

  function finishWin() {
    if (winSent) return;
    winSent = true;
    const stars = starsFor(true, squadN, crateRammed, bossSec, level.starN, level.starSec);
    const earned = boberReward(kills, cratesOpened, stars, duckKills, duckCrates);
    hooks.win({
      n: squadN,
      kills,
      cratesOpened,
      crateRammed,
      bossSec,
      stars,
      earned,
      levelId: level.id,
      winTitle: level.win,
      nextId: nextLevel(level.id),
    });
  }

  function showBossMesh() {
    const src = bossKind === "tub" ? tubBuilt : bossKind === "grunk" ? grunkBuilt : baronBuilt;
    boss.geometry = src.geo;
    if (boss.children[0]) boss.children[0].geometry = src.geo;
    crownMarker.position.copy(src.crownLocal);
  }

  function startArena() {
    if (arenaStarted) return;
    arenaStarted = 1;
    dist = level.len;
    half = 7;
    bossKind = level.boss;
    showBossMesh();
    bossState.shown = 1;
    bossState.alive = 1;
    bossState.hp = level.bossHp;
    bossState.summoned = 0;
    bossState.p60 = 0;
    bossState.p30 = 0;
    bossState.homeZ = -(level.len + 11);
    bossState.z = bossState.homeZ;
    bossState.x = 0;
    bossState.mode = 0;
    bossState.t = 1.2;
    bossState.lock = squadX;
    bossState.cool = bossKind === "baron" ? 6 : bossKind === "tub" ? 8 : 5;
    wrenchPhase = 0;
    wrench.visible = false;
    zone.visible = false;
    pullT = 0;
    boss.visible = true;
    audio.bossIn();
    if (bossKind === "baron") say("BY ORDER OF THE DRAIN.");
  }

  function hurtBoss(dmg, crit, splash, pierce, x0, y0, z0) {
    if (!bossState.alive || ended) return;
    let dealt = dmg;
    if (bossKind === "tub" && !crit && !splash && !pierce) dealt *= 0.4;
    if (crit) dealt *= 2;
    if (dealt < 0.05) return;
    bossState.hp -= dealt;
    if (bossState.hp < 0) bossState.hp = 0;
    camShake = 0.15;
    spawnFx(sparks, x0, y0, z0, 0.08, 0.34);
    floater(9000, x0, y0 + 0.4, z0, dealt);
    if (crit && pFreeN > 8) puff(crownX, crownY, crownZ, 4, 4, 3, 0.28, 0.32);
    const max = level.bossHp;
    if (bossKind === "baron" && !bossState.summoned && bossState.hp <= max * 0.5) {
      bossState.summoned = 1;
      dump(0, 40, bossState.z - 4, 8);
      say("All water flows to me. Eventually.");
    }
    if (bossKind === "grunk") {
      if (!bossState.p60 && bossState.hp <= max * 0.6) {
        bossState.p60 = 1;
        pullT = 1;
      }
      if (!bossState.p30 && bossState.hp <= max * 0.3) {
        bossState.p30 = 1;
        pullT = 1;
      }
      if (!bossState.summoned && bossState.hp <= max * 0.5) {
        bossState.summoned = 1;
        dump(0, 30, bossState.z - 4, 8);
        dump(3, 1, bossState.z - 8, 1);
      }
    }
    if (bossState.hp <= 0) beginWin();
  }

  function damageEnemy(type, i, dmg, x0, y0, z0, splash, pierce, flame) {
    const p = pools[type];
    if (!p.alive[i]) return;
    const hit = clogHit(type, p.hp[i], p.foam[i], dmg, splash ? 1 : 0, pierce ? 1 : 0, flame ? 1 : 0, p.slowT[i] > 0 ? 1 : 0);
    p.hp[i] = hit.hp;
    p.foam[i] = hit.foam;
    p.hit[i] = 1;
    spawnFx(sparks, x0, y0, z0, 0.08, 0.22);
    if (flame && mods.burn) {
      p.burnT[i] = 2;
      p.burnD[i] = mods.burn;
    }
    floater(type * 400 + i, p.x[i], ENEMY[type].y + 0.7, p.z[i], hit.dealt);
    audio.squeak();
    if (hit.burst && pFreeN > 12) puff(p.x[i], ENEMY[type].y, p.z[i], 10, 8, 2.4, 0.45, 0.35);
    if (pFreeN > 40) puff(x0, y0, z0, flame ? 7 : 2, 1, 1.4, 0.16, 0.2);
    if (p.hp[i] <= 0) killEnemy(type, i, true);
  }

  function cellOf(x0, z0) {
    const ix = Math.floor(x0 * 0.5);
    const iz = Math.floor(z0 * 0.5);
    return ((ix * 73856093) ^ (iz * 19349663)) & 511;
  }

  function rebuildGrid() {
    head.fill(-1);
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      for (let i = 0; i < p.cap; i++) {
        if (!p.alive[i]) continue;
        const id = t * STRIDE + i;
        const h = cellOf(p.x[i], p.z[i]);
        nextE[id] = head[h];
        head[h] = id;
      }
    }
  }

  function segHit(x0, y0, z0, x1, y1, z1, cx, cy, cz, rad) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const len2 = dx * dx + dy * dy + dz * dz;
    let t = 0;
    if (len2 > 1e-8) t = ((cx - x0) * dx + (cy - y0) * dy + (cz - z0) * dz) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const px0 = x0 + dx * t - cx;
    const py0 = y0 + dy * t - cy;
    const pz0 = z0 + dz * t - cz;
    return px0 * px0 + py0 * py0 + pz0 * pz0 <= rad * rad;
  }

  function splashAt(x0, y0, z0, dmg, knock, r) {
    const rad = r || 2.2;
    const r2 = rad * rad;
    puff(x0, 0.4, z0, 3, 10, 3.4, 0.35, 0.7);
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      const k = ENEMY[t];
      for (let i = 0; i < p.cap; i++) {
        if (!p.alive[i]) continue;
        const dx = p.x[i] - x0;
        const dz = p.z[i] - z0;
        if (dx * dx + dz * dz > r2) continue;
        if (knock && t === 0) p.z[i] -= knock;
        else if (knock) p.z[i] -= knock * 0.45;
        damageEnemy(t, i, dmg, p.x[i], k.y, p.z[i], 1, 0, 0);
      }
    }
    if (bossState.alive) {
      const dx = bossState.x - x0;
      const dz = bossState.z - z0;
      if (dx * dx + dz * dz <= (rad + 1.2) * (rad + 1.2)) {
        const near = (crownX - x0) * (crownX - x0) + (crownZ - z0) * (crownZ - z0) < 0.8;
        hurtBoss(dmg, near ? 1 : 0, 1, 0, bossState.x, 1.6, bossState.z);
        bossState.z -= (knock || 0) * 0.35;
      }
    }
  }

  function hitGate(x0, z0, z1) {
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      if (g.passed) continue;
      if (Math.abs(x0 - g.x) > 2.15) continue;
      const lo = z0 < z1 ? z0 : z1;
      const hi = z0 < z1 ? z1 : z0;
      if (g.z < lo - 0.4 || g.z > hi + 0.4) continue;
      const wasBlue = gateBlue(g.op);
      if (shootGate(g, 1)) {
        relabel(i);
        if (!wasBlue && gateBlue(g.op)) {
          g.flip = 0.3;
          word("FLIPPED!", g.x, 3.1, g.z, 0);
        }
      }
      return 1;
    }
    return 0;
  }

  function hitCrate(x0, y0, z0, dmg) {
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      if (c.state !== "idle") continue;
      if (Math.abs(x0 - c.x) > 1.7) continue;
      if (Math.abs(z0 - c.z) > 1.25) continue;
      if (y0 < 0.15 || y0 > 3.35) continue;
      c.hp -= dmg;
      if (c.hp < 0) c.hp = 0;
      c.dirty = 1;
      c.jab = 0.05;
      spawnFx(sparks, x0, y0, z0, 0.07, 0.26);
      if (pFreeN > 20) puff(c.x + (x0 - c.x) * 0.3, y0, c.z + 0.8, 3, 3, 2.4, 0.22, 0.14);
      floater(9100 + i, c.x, 2.6, c.z, dmg);
      if (c.hp <= 0) breakCrate(c);
      return 1;
    }
    return 0;
  }

  function queryEnemies(x0, y0, z0, x1, y1, z1, visitor) {
    const ix = Math.floor(x1 * 0.5);
    const iz = Math.floor(z1 * 0.5);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const bucket = (((ix + dx) * 73856093) ^ ((iz + dz) * 19349663)) & 511;
        for (let id = head[bucket]; id >= 0; id = nextE[id]) {
          const type = (id / STRIDE) | 0;
          const slot = id - type * STRIDE;
          const p = pools[type];
          if (!p || !p.alive[slot]) continue;
          const rad = ENEMY[type].rad * (p.radS[slot] || 1);
          if (!segHit(x0, y0, z0, x1, y1, z1, p.x[slot], ENEMY[type].y * (p.radS[slot] || 1), p.z[slot], rad)) continue;
          if (visitor(type, slot)) return 1;
        }
      }
    }
    return 0;
  }

  function bossCrit(x0, y0, z0, x1, y1, z1) {
    if (!bossState.alive || !arenaStarted) return 0;
    if (bossKind === "grunk" && wrenchPhase === 2) {
      if (segHit(x0, y0, z0, x1, y1, z1, wrenchX, wrenchY, wrenchZ, 0.7)) return 2;
    }
    if (segHit(x0, y0, z0, x1, y1, z1, crownX, crownY, crownZ, 0.62)) return 1;
    if (segHit(x0, y0, z0, x1, y1, z1, bossState.x, 1.45, bossState.z, 1.45)) return 0;
    return -1;
  }

  function movePool(s, h, kind) {
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i]) continue;
      const x0 = s.x[i];
      const y0 = s.y[i];
      const z0 = s.z[i];
      if (kind === "log") {
        s.vy[i] -= 16 * h;
        s.roll[i] += h * 11;
      } else if (kind === "rocket" && s.flag[i]) {
        steerRocket(s, i, h);
      } else if (kind === "party" || kind === "case" || kind === "ember" || kind === "duck") {
        s.vy[i] -= (kind === "party" ? 2.2 : 6) * h;
      } else if (kind === "mud") {
        s.vy[i] -= 14 * h;
      }
      s.x[i] = x0 + s.vx[i] * h;
      s.y[i] = y0 + s.vy[i] * h;
      s.z[i] = z0 + s.vz[i] * h;
      s.life[i] -= h;
      if (kind === "puddle" || kind === "hazard") {
        if (kind === "puddle" && s.life[i] <= 0) freeS(s, i);
        continue;
      }
      if (kind === "case" || kind === "ember" || kind === "duck") {
        if (s.life[i] <= 0 || s.y[i] < 0) freeS(s, i);
        continue;
      }
      if (s.flag[i] === 3 && kind === "arrow") {
        if (s.life[i] <= 0) freeS(s, i);
        continue;
      }
      if (s.life[i] <= 0 || s.y[i] < -1 || s.z[i] > prevZ + 12) {
        if (kind === "rocket") {
          splashAt(s.x[i], 0.4, s.z[i], s.dmg[i], 0.4, s.extra[i] || 1.5);
          audio.pop();
        }
        freeS(s, i);
        continue;
      }
      if ((kind === "log" || kind === "rocket" || kind === "mud") && s.y[i] <= 0.36) {
        if (kind === "mud") resolveMud(s, i);
        else {
          splashAt(s.x[i], 0.4, s.z[i], s.dmg[i], kind === "log" ? (s.extra2[i] || 1) : 0.4, s.extra[i] || (kind === "log" ? 2.2 : 1.5));
          if (kind === "rocket") audio.pop();
        }
        freeS(s, i);
        continue;
      }
      if (kind === "mud") {
        if (s.life[i] <= 0) freeS(s, i);
        continue;
      }
      let stop = 0;
      queryEnemies(x0, y0, z0, s.x[i], s.y[i], s.z[i], (type, slot) => {
        const p = pools[type];
        if (p.stamp[slot] === s.tag[i]) return 0;
        p.stamp[slot] = s.tag[i];
        if (kind === "arrow" && s.flag[i] === 1) {
          s.flag[i] = 3;
          s.vx[i] = 0;
          s.vy[i] = 0;
          s.vz[i] = 0;
          s.life[i] = 0.3;
          s.x[i] = p.x[slot];
          s.y[i] = ENEMY[type].y;
          s.z[i] = p.z[slot];
          damageEnemy(type, slot, s.dmg[i], p.x[slot], ENEMY[type].y, p.z[slot], 0, 0, 0);
          stop = 0;
          return 1;
        }
        if (kind === "log" || kind === "rocket") {
          splashAt(p.x[slot], ENEMY[type].y, p.z[slot], s.dmg[i], kind === "log" ? (s.extra2[i] || 1) : 0.4, s.extra[i] || 2.2);
          if (kind === "rocket") audio.pop();
          stop = 1;
          return 1;
        }
        let dmg = s.dmg[i];
        if (s.flag[i] && kind === "ball") {
          const travel = Math.hypot(s.x[i] - s.ox[i], s.z[i] - s.oz[i]);
          if (travel > 14) dmg *= Math.max(0, 1 - (travel - 14) / 14);
        }
        if (kind === "ball" && s.extra2[i] && type === 0) p.z[slot] -= s.extra2[i];
        if (kind === "party") {
          let dealt = dmg;
          if (rnd() < (s.extra[i] || 0.1)) {
            dealt *= 5;
            word("PARTY!", p.x[slot], ENEMY[type].y + 1.1, p.z[slot]);
          }
          p.stagT[slot] = s.extra2[i] || 0.3;
          damageEnemy(type, slot, dealt, p.x[slot], ENEMY[type].y, p.z[slot], 0, 0, 0);
          stop = 1;
          return 1;
        }
        const pierce = kind === "arrow" && s.extra[i] > 0 ? 1 : 0;
        damageEnemy(type, slot, dmg, p.x[slot], ENEMY[type].y, p.z[slot], 0, pierce, 0);
        if (pierce) {
          s.hits[i]++;
          s.extra[i] -= 1;
          if (s.hits[i] >= 3 && s.flag[i] !== 2) {
            s.flag[i] = 2;
            word("PIERCE x3", p.x[slot], 1.8, p.z[slot]);
          }
          if (s.hits[i] >= 3 && p.freeze[slot] < 1) p.freeze[slot] = 0.05;
          if (s.extra[i] <= 0) stop = 1;
          return stop;
        }
        stop = 1;
        return 1;
      });
      if (stop) {
        freeS(s, i);
        continue;
      }
      if (bossState.alive && arenaStarted && kind !== "mud") {
        const crit = bossCrit(x0, y0, z0, s.x[i], s.y[i], s.z[i]);
        if (crit >= 0) {
          if (kind === "log" || kind === "rocket") {
            splashAt(s.x[i], s.y[i], s.z[i], s.dmg[i], kind === "log" ? 1 : 0.4, s.extra[i] || 2.2);
            if (kind === "rocket") audio.pop();
          } else {
            const pierce = kind === "arrow" && s.extra[i] > 0 ? 1 : 0;
            hurtBoss(s.dmg[i], crit > 0 ? 1 : 0, 0, pierce, s.x[i], s.y[i], s.z[i]);
          }
          freeS(s, i);
          continue;
        }
      }
      if (kind !== "mud" && (hitCrate(s.x[i], s.y[i], s.z[i], s.dmg[i]) || hitGate(s.x[i], z0, s.z[i]))) {
        if (!(kind === "arrow" && s.extra[i] > 1)) freeS(s, i);
      }
    }
  }

  function steerRocket(s, i, h) {
    let tx = s.ox[i];
    let tz = s.oz[i];
    let hpBest = -1;
    const reach = 30;
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      for (let k = 0; k < p.cap; k++) {
        if (!p.alive[k] || p.hp[k] <= hpBest) continue;
        const dx = p.x[k] - s.x[i];
        const dz = p.z[k] - s.z[i];
        if (dx * dx + dz * dz > reach * reach) continue;
        hpBest = p.hp[k];
        tx = p.x[k];
        tz = p.z[k];
      }
    }
    if (bossState.alive && bossState.hp > hpBest) {
      const dx = bossState.x - s.x[i];
      const dz = bossState.z - s.z[i];
      if (dx * dx + dz * dz < reach * reach) {
        tx = bossState.x;
        tz = bossState.z;
      }
    }
    const spd = Math.hypot(s.vx[i], s.vz[i]) || 26;
    const cur = Math.atan2(s.vx[i], -s.vz[i]);
    const want = Math.atan2(tx - s.x[i], -(tz - s.z[i]));
    let d = want - cur;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const max = ((s.extra2[i] || 180) * Math.PI / 180) * h;
    const ny = cur + clamp(d, -max, max);
    s.vx[i] = Math.sin(ny) * spd;
    s.vz[i] = -Math.cos(ny) * spd;
  }

  function resolveMud(s, i) {
    puff(s.x[i], 0.4, s.z[i], 0, 6, 2, 0.3, 0.4);
  }

  function resolveHazards() {
    const shown = shownCount(squadN);
    for (let i = 0; i < hazards.n; i++) {
      if (!hazards.alive[i] || hazards.life[i] > 0) continue;
      const r = hazards.extra[i];
      const max = hazards.extra2[i] || 2;
      let hit = 0;
      for (let n = 0; n < shown && hit < max; n++) {
        const sx = squadX + fx[n];
        const sz = -dist + fz[n];
        const dx = sx - hazards.x[i];
        const dz = sz - hazards.z[i];
        if (dx * dx + dz * dz <= r * r) {
          hurtSquad(1);
          hit++;
          if (ended) return;
        }
      }
      puff(hazards.x[i], 0.5, hazards.z[i], 3, 4, 2, 0.25, 0.35);
      freeS(hazards, i);
    }
  }

  function consider(kind, index, x0, z0, reach) {
    const dx = x0 - squadX;
    const dz = z0 - (-dist);
    if (dz > 2) return;
    const d2 = dx * dx + dz * dz;
    const lim = reach || 28;
    if (d2 > lim * lim) return;
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
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      const reach = t === 4 ? 34 : 28;
      for (let i = 0; i < p.cap; i++) if (p.alive[i]) consider(t, i, p.x[i], p.z[i], reach);
    }
    if (bossState.alive && bossState.shown) consider(7, 0, bossState.x, bossState.z, 28);
    for (let i = 0; i < crates.length; i++) {
      if (crates[i].state === "idle") consider(8, i, crates[i].x, crates[i].z, 28);
    }
    for (let i = 0; i < gates.length; i++) {
      if (!gates[i].passed) consider(9, i, gates[i].x, gates[i].z, 28);
    }
  }

  function aimOf(kind, index, soldierX) {
    if (kind < 7) {
      const p = pools[kind];
      if (!p.alive[index]) return 0;
      aimX = p.x[index];
      aimY = ENEMY[kind].y * (p.radS[index] || 1);
      aimZ = p.z[index];
      return 1;
    }
    if (kind === 7) {
      if (!bossState.alive) return 0;
      if (bossKind === "grunk" && wrenchPhase === 2) {
        aimX = wrenchX;
        aimY = wrenchY;
        aimZ = wrenchZ;
      } else if (Math.abs(soldierX - bossState.x) < 0.85) {
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
    if (kind === 8) {
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

  function spawnShot(pool, sx, sy, sz, vx, vy, vz, dmg, life, col, flag, extra, extra2) {
    const id = allocS(pool);
    if (id < 0) return -1;
    pool.x[id] = sx;
    pool.y[id] = sy;
    pool.z[id] = sz;
    pool.vx[id] = vx;
    pool.vy[id] = vy;
    pool.vz[id] = vz;
    pool.dmg[id] = dmg;
    pool.life[id] = life;
    pool.col[id] = col;
    pool.flag[id] = flag;
    pool.extra[id] = extra || 0;
    pool.extra2[id] = extra2 || 0;
    pool.ox[id] = sx;
    pool.oz[id] = sz;
    pool.tag[id] = ++shotTag;
    pool.roll[id] = rnd() * 6;
    return id;
  }

  function fireSoldier(s) {
    if (cn <= 0) return;
    const shown = shownCount(squadN);
    if (s >= shown) return;
    const sx = squadX + fx[s];
    const sy = 0.78;
    const sz = -dist + fz[s];
    if (!aimOf(ct[s % cn], ci[s % cn], sx)) return;
    const dx = aimX - sx;
    const dy = aimY - sy;
    const dz = aimZ - sz;
    const len = Math.hypot(dx, dy, dz) || 1;
    const base = Math.atan2(dx, -dz);
    const pitch = Math.asin(clamp(dy / len, -0.85, 0.85));
    const dmg = mods.dmg * squadDmgMul(squadN);
    const pat = mods.pattern;
    if (pat === "cone" || pat === "stream") return;
    const pellets = mods.pellets;
    for (let p = 0; p < pellets; p++) {
      let ang = base;
      if ((pat === "fan" || pat === "confetti") && pellets > 1) ang += (p / (pellets - 1) - 0.5) * mods.spread;
      else if (pat === "spread" || pat === "spin") ang += (rnd() * 2 - 1) * mods.spread;
      const cp = Math.cos(pitch);
      if (pat === "lob") {
        const horiz = Math.hypot(dx, dz) || 1;
        spawnShot(logs, sx, sy, sz - 0.3, (dx / horiz) * 18, 8, (dz / horiz) * 18, dmg, 1.6, 0, 0, mods.splash, mods.knock);
      } else if (pat === "home") {
        const id = spawnShot(rockets, sx, sy, sz - 0.3, Math.sin(ang) * cp * 26, Math.sin(pitch) * 8, -Math.cos(ang) * cp * 26, dmg, 2.2, 2 + (shotTag % 3), 1, mods.splash, mods.turn);
        if (id >= 0) {
          rockets.ox[id] = aimX;
          rockets.oz[id] = aimZ;
        }
      } else if (pat === "confetti") {
        spawnShot(party, sx, sy, sz - 0.2, Math.sin(ang) * 24, 2.5 + rnd(), -Math.cos(ang) * 24, dmg, 0.85, 2 + (p % 3), 0, mods.crit, mods.stagger);
      } else if (pat === "arrow" || pat === "pierce") {
        const speed = pat === "pierce" ? 90 : 48;
        spawnShot(arrows, sx, sy, sz - 0.35, Math.sin(ang) * cp * speed, Math.sin(pitch) * speed, -Math.cos(ang) * cp * speed, dmg, pat === "pierce" ? 0.55 : 0.8, pat === "pierce" ? 1 : 0, pat === "arrow" ? 1 : 0, pat === "pierce" ? mods.pierce : 0, 0);
      } else {
        const speed = 52;
        const col = weaponId === "shot" || weaponId === "gerald" ? 5 : 2;
        spawnShot(balls, sx, sy, sz - 0.4, Math.sin(ang) * cp * speed, Math.sin(pitch) * speed, -Math.cos(ang) * cp * speed, dmg, 0.75, col, mods.falloff > 0 ? 1 : 0, 0, pat === "fan" ? 0.4 : 0);
      }
    }
    shotThisTick = true;
    if (pat === "fan") kickT = 0.2;
    if (pat === "spin") {
      const id = allocS(cases);
      if (id >= 0) {
        cases.x[id] = sx + 0.2;
        cases.y[id] = sy;
        cases.z[id] = sz;
        cases.vx[id] = 1.5 + rnd();
        cases.vy[id] = 2 + rnd();
        cases.vz[id] = 0.5;
        cases.life[id] = 0.7;
      }
    }
    spawnFx(muzzles, sx, sy, sz - 0.62, 0.06, 0.42);
  }

  function tickCone() {
    const range = 11;
    const halfAng = mods.spread * 0.5;
    const dmg = mods.dmg * squadDmgMul(squadN);
    const shown = Math.max(1, shownCount(squadN));
    const origins = Math.max(1, Math.ceil(shown / 10));
    stuckN = 0;
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      for (let i = 0; i < p.cap; i++) {
        if (!p.alive[i]) continue;
        let hit = 0;
        for (let c = 0; c < origins && !hit; c++) {
          const s = Math.min(shown - 1, c * 10);
          const sx = squadX + (fx[s] || 0);
          const sz = -dist + (fz[s] || 0);
          const dx = p.x[i] - sx;
          const fwd = sz - p.z[i];
          if (fwd <= 0.15 || fwd > range) continue;
          if (Math.atan2(Math.abs(dx), fwd) > halfAng) continue;
          hit = 1;
        }
        if (!hit) continue;
        damageEnemy(t, i, dmg, p.x[i], ENEMY[t].y, p.z[i], 0, 0, 1);
      }
    }
    for (let k = 0; k < 4; k++) {
      const id = allocS(embers);
      if (id < 0) break;
      embers.x[id] = squadX + (rnd() * 2 - 1) * 0.8;
      embers.y[id] = 0.8 + rnd();
      embers.z[id] = -dist - rnd() * 6;
      embers.vx[id] = (rnd() * 2 - 1) * 0.6;
      embers.vy[id] = 0.8 + rnd();
      embers.vz[id] = -2 - rnd() * 2;
      embers.life[id] = 0.45;
    }
  }

  function tickStream() {
    const dmg = mods.dmg * squadDmgMul(squadN);
    const shown = Math.max(1, shownCount(squadN));
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      for (let i = 0; i < p.cap; i++) {
        if (!p.alive[i]) continue;
        let hits = 0;
        const fwd = -dist - p.z[i];
        if (fwd <= 0 || fwd > 20) continue;
        for (let s = 0; s < shown; s++) {
          if (Math.abs(p.x[i] - (squadX + fx[s])) < 0.45) hits++;
        }
        if (!hits) continue;
        p.slowT[i] = mods.slow || 2.5;
        damageEnemy(t, i, dmg * hits, p.x[i], ENEMY[t].y, p.z[i], 0, 0, 0);
        if (puddles.freeN > 0 && rnd() < 0.25) {
          const id = allocS(puddles);
          if (id >= 0) {
            puddles.x[id] = p.x[i];
            puddles.z[id] = p.z[i];
            puddles.y[id] = 0.24;
            puddles.life[id] = 3;
            puddles.extra[id] = 0.7;
          }
        }
      }
    }
  }

  function botX() {
    let x = -2.3;
    if (level.id === "1-1") {
      if (dist > 145 && dist < 178) x = 3.35;
      else if (dist > 330 && dist < 368) x = 0;
      else if (dist > 555 && dist < 625) x = 3.35;
    }
    if (arenaStarted) {
      x = bossState.x;
      if (wrenchPhase === 1) {
        const band = (half * 2) / 3;
        const mid = -half + band * (zoneSide + 0.5);
        if (Math.abs(x - mid) < band * 0.55) x = zoneSide === 2 ? -half * 0.7 : half * 0.7;
      }
      for (let i = 0; i < hazards.n; i++) {
        if (!hazards.alive[i]) continue;
        x = 4.8;
        break;
      }
    }
    return x;
  }

  function updateBoss() {
    const bob = Math.sin(clock * 2.1) * 0.06;
    let y = 0.08 + bob;
    let yaw = Math.PI;
    if (bossKind === "baron" && ended === "win") {
      const u = clamp(1 - slowLeft / 0.5, 0, 1);
      y = 0.08 - u * 3.2;
      yaw = Math.PI + u * 8;
      manhole.visible = true;
    }
    boss.position.set(bossState.x, y, bossState.z);
    boss.rotation.y = yaw;
    boss.visible = !!(bossState.shown && (bossState.alive || (ended === "win" && slowLeft > 0)));
    if (boss.visible) {
      boss.updateMatrixWorld();
      crownMarker.getWorldPosition(crownV);
      crownX = crownV.x;
      crownY = crownV.y;
      crownZ = crownV.z;
    }
    if (bossKind === "grunk" && wrenchPhase === 2) {
      const span = -dist - bossState.z;
      const u = wrenchT < 0.4 ? wrenchT / 0.4 : Math.max(0, (0.8 - wrenchT) / 0.4);
      const band = (half * 2) / 3;
      wrenchX = -half + band * (zoneSide + 0.5);
      wrenchY = 1.3 + Math.sin(u * Math.PI) * 1.4;
      wrenchZ = bossState.z + span * u;
      wrench.position.set(wrenchX, wrenchY, wrenchZ);
      wrench.rotation.y = Math.PI;
      wrench.rotation.z = clock * 14;
      wrench.visible = true;
    } else if (!(bossKind === "grunk" && ended === "win")) {
      wrench.visible = false;
    }
    if (wrenchPhase === 1) {
      const band = (half * 2) / 3;
      zone.visible = true;
      zone.position.set(-half + band * (zoneSide + 0.5), 0.25, -dist - 4);
      zone.scale.set(band, 18, 1);
    } else zone.visible = false;
    wayArrow.visible = bossKind === "grunk" && ended === "win" && slowLeft > 0;
  }

  function checkScript() {
    const evs = level.events;
    for (let i = 0; i < evs.length; i++) {
      if (fired[i]) continue;
      const ev = evs[i];
      if (dist < ev.at) continue;
      fired[i] = 1;
      if (dist - ev.at < 25 && ev.kind === "wave") spawnWave(ev);
    }
  }

  function soldiersInThird(side) {
    const band = (half * 2) / 3;
    const lo = -half + band * side;
    const hi = lo + band;
    const shown = shownCount(squadN);
    let n = 0;
    for (let s = 0; s < shown; s++) {
      const x = squadX + fx[s];
      if (x >= lo && x < hi) n++;
    }
    return n > 6 ? 6 : n;
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
      if (pullT > 0 && bossKind === "grunk" && arenaStarted) {
        const step = 1.5 * h;
        if (squadX > step) squadX -= step;
        else if (squadX < -step) squadX += step;
        else squadX = 0;
        pullT -= h;
      }
      if (!arenaStarted && !bench) {
        dist += ADVANCE * h;
        if (dist > level.len) dist = level.len;
      }
      if (dist >= level.len) startArena();
      const widen = level.len - 30;
      half = arenaStarted ? 7 : dist > widen ? 5 + Math.min(1, (dist - widen) / 30) * 2 : 5;
      const z = -dist;
      if (!arenaStarted) {
        for (let i = 0; i < gates.length; i += 2) {
          const g = gates[i];
          if (!g || g.passed) continue;
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
      let rammed = -1;
      let ramD = 1e9;
      for (let i = 0; i < crates.length; i++) {
        const c = crates[i];
        if (c.jab > 0) c.jab = Math.max(0, c.jab - h * 0.45);
        if (c.state === "shake") {
          c.shake -= h;
          if (c.shake <= 0) grantCrate(c);
        } else if (c.state === "reel") {
          c.reel -= h;
          if (c.reel <= 0) grantCrate(c);
          else if (((c.reel * 10) | 0) !== (((c.reel + h) * 10) | 0)) {
            c.gun = mysteryPick(unlocked, rnd);
            c.dirty = 1;
          }
        } else if (c.state === "idle" && Math.abs(z - c.z) < 1.35) {
          const d = Math.abs(squadX - c.x);
          if (d < 1.65 + CORE && d < ramD) {
            ramD = d;
            rammed = i;
          }
        }
      }
      if (rammed >= 0) {
        ramCrate(crates[rammed]);
        if (ended) {
          prevZ = z;
          return;
        }
      }
      if (!rackTaken && rack.visible && Math.abs(z - rackZ) < 1.25) {
        for (let i = 0; i < 3; i++) {
          if (Math.abs(squadX - rackSlots[i].x) < 1.45) {
            const slot = rackSlots[i];
            flyX = slot.x;
            flyZ = rackZ;
            if (slot.kind === "tier") {
              tier = Math.min(4, tier + 1);
              refreshMods();
              flyT = 0.35;
            } else if (slot.kind === "vol") {
              squadN = Math.min(SIM_CAP, squadN + (slot.n || 10));
              floater(9300, slot.x, 2, rackZ, slot.n || 10);
            } else equip(slot.gun, slot.bonus || 0);
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
        bossState.cool -= h;
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
        bossState.x = clamp(bossState.x, -(half - 1.3), half - 1.3);
        if (bossKind === "baron" && bossState.cool <= 0) {
          bossState.cool = 6;
          const land = -dist;
          armHazard(-3.2, land - 0.3, 1, 0.8, 2);
          armHazard(0, land + 0.2, 1.25, 0.8, 3);
          armHazard(1.2, land - 0.2, 1, 0.8, 2);
        } else if (bossKind === "tub" && bossState.cool <= 0) {
          bossState.cool = 8;
          dump(0, 12, bossState.z + 2.2, 6, 2);
        } else if (bossKind === "grunk") {
          if (wrenchPhase === 0 && bossState.cool <= 0) {
            bossState.cool = 5;
            zoneSide = (rnd() * 3) | 0;
            wrenchPhase = 1;
            zoneT = 1;
          } else if (wrenchPhase === 1) {
            zoneT -= h;
            if (zoneT <= 0) {
              wrenchPhase = 2;
              wrenchT = 0;
              formationOffsets(squadN, radius, fx, fz);
              hurtSquad(soldiersInThird(zoneSide));
              if (ended) return;
            }
          } else if (wrenchPhase === 2) {
            wrenchT += h;
            if (wrenchT > 0.8) wrenchPhase = 0;
          }
        }
      }
      updateBoss();
      for (let t = 0; t < TYPES; t++) {
        const p = pools[t];
        const k = ENEMY[t];
        for (let i = 0; i < p.cap; i++) {
          if (!p.alive[i]) continue;
          if (p.burnT[i] > 0) {
            const hit = clogHit(t, p.hp[i], p.foam[i], p.burnD[i] * h, 0, 0, 1, p.slowT[i] > 0 ? 1 : 0);
            p.hp[i] = hit.hp;
            p.foam[i] = hit.foam;
            p.burnT[i] -= h;
            if (hit.burst) puff(p.x[i], k.y, p.z[i], 10, 6, 2, 0.35, 0.3);
            if (p.hp[i] <= 0) {
              killEnemy(t, i, true);
              continue;
            }
          }
          if (p.slowT[i] > 0) p.slowT[i] -= h;
          if (p.freeze[i] >= 1 || p.stagT[i] > 0) {
            if (p.stagT[i] > 0) p.stagT[i] -= h;
            continue;
          }
          if (p.freeze[i] > 0) {
            p.freeze[i] -= h;
            continue;
          }
          const slow = p.slowT[i] > 0 ? 0.5 : 1;
          if (t === 3) {
            p.age[i] += h;
            const g = hairGrowth(p.age[i]);
            const max = k.hp * level.hpMul * g.hpScale;
            if (max > p.maxHp[i]) p.hp[i] += max - p.maxHp[i];
            p.maxHp[i] = max;
            p.radS[i] = g.radScale;
            p.z[i] += 6 * slow * h;
          } else if (t === 4) {
            const holdZ = -dist - 30;
            if (p.z[i] < holdZ) p.z[i] = Math.min(holdZ, p.z[i] + 8 * h);
            else p.z[i] = Math.max(holdZ, p.z[i] - 8 * slow * h);
            p.x[i] += clamp(squadX - p.x[i], -1, 1) * k.lat * slow * h;
            p.lob[i] -= h;
            if (p.lob[i] <= 0) {
              p.lob[i] = 3;
              const id = allocS(muds);
              if (id >= 0) {
                const tx = squadX;
                const tz = -dist;
                muds.x[id] = p.x[i];
                muds.y[id] = 1.3;
                muds.z[id] = p.z[i];
                muds.vx[id] = (tx - p.x[i]) / 0.8;
                muds.vz[id] = (tz - p.z[i]) / 0.8;
                muds.vy[id] = 4.42;
                muds.life[id] = 0.85;
                armHazard(tx, tz, 1.2, 0.8, 3);
              }
            }
          } else if (t === 6) {
            p.x[i] += p.side[i] * 3 * slow * h;
            p.z[i] += 0.35 * h;
            if (Math.abs(p.x[i]) > half + 1.3) releaseEnemy(t, i);
          } else {
            const gap = -p.z[i] - dist;
            if (gap < 8) p.x[i] += clamp(squadX - p.x[i], -1, 1) * k.lat * slow * h;
            p.z[i] += k.speed * slow * h;
          }
          if (p.hit[i] > 0) p.hit[i] = Math.max(0, p.hit[i] - h * 12.5);
        }
      }
      rebuildGrid();
      movePool(balls, h, "ball");
      movePool(arrows, h, "arrow");
      movePool(logs, h, "log");
      movePool(rockets, h, "rocket");
      movePool(party, h, "party");
      movePool(muds, h, "mud");
      movePool(cases, h, "case");
      movePool(embers, h, "ember");
      movePool(puddles, h, "puddle");
      movePool(hazards, h, "hazard");
      movePool(vducks, h, "duck");
      formationOffsets(squadN, radius, fx, fz);
      resolveHazards();
      if (ended) return;
      if (!ended) {
        const blob = formationRadius(Math.max(squadN, 1), half);
        for (let t = 0; t < TYPES; t++) {
          const p = pools[t];
          const k = ENEMY[t];
          for (let i = 0; i < p.cap; i++) {
            if (!p.alive[i] || p.freeze[i] >= 1) continue;
            if (p.z[i] > -dist + 2.8) {
              releaseEnemy(t, i);
              continue;
            }
            const rad = k.rad * (p.radS[i] || 1);
            const dx = p.x[i] - squadX;
            const dz = p.z[i] - (-dist);
            const rr = blob + rad;
            if (dx * dx + dz * dz >= rr * rr) continue;
            if (t === 5) {
              if (stuckN < 16) {
                stuckS[stuckN] = (stuckN * 3) % Math.max(1, shownCount(squadN));
                stuckT[stuckN] = 2;
                stuckN++;
              }
              releaseEnemy(t, i);
              continue;
            }
            if (t === 6) {
              p.side[i] *= -1;
              const len = Math.sqrt(dx * dx + dz * dz) || 0.001;
              p.x[i] = squadX + (dx / len) * (rr + 0.2);
              continue;
            }
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
              let bite = k.bite;
              if (t === 3) bite = hairGrowth(p.age[i]).bite;
              hurtSquad(bite);
              killEnemy(t, i, true);
              if (ended) return;
            }
          }
        }
      }
      if (!ended) {
        let aliveStuck = 0;
        for (let i = 0; i < stuckN; i++) {
          stuckT[i] -= h;
          if (stuckT[i] > 0) {
            stuckT[aliveStuck] = stuckT[i];
            stuckS[aliveStuck] = stuckS[i];
            aliveStuck++;
          }
        }
        stuckN = aliveStuck;
        buildCands();
        const shooters = squadN > RENDER_CAP ? RENDER_CAP : squadN;
        const leafCut = Math.min(0.4, stuckN * 0.05);
        const rateScale = leafCut > 0 ? 1 / (1 - leafCut) : 1;
        if (mods.pattern === "spin") {
          if (cn > 0) spin = Math.min(1, spin + h / 0.6);
          else spin = Math.max(0, spin - h / 0.4);
        } else spin = Math.max(0, spin - h);
        const rateNow = mods.pattern === "spin" ? mods.rate + (mods.rateMax - mods.rate) * spin : mods.rate;
        if (mods.pattern === "cone" || mods.pattern === "stream") {
          gunAcc -= h;
          if (gunAcc <= 0 && cn > 0) {
            gunAcc += (1 / Math.max(0.05, rateNow)) * rateScale;
            if (mods.pattern === "cone") tickCone();
            else tickStream();
            shotThisTick = true;
          }
        } else {
          const interval = (1 / Math.max(0.05, rateNow)) * rateScale;
          for (let s = 0; s < shooters; s++) {
            cds[s] -= h;
            if (cds[s] > 0) continue;
            if (cn <= 0) continue;
            cds[s] = interval;
            fireSoldier(s);
          }
        }
      }
    }
    if (kickT > 0) kickT = Math.max(0, kickT - h);
    for (let i = 0; i < gates.length; i++) {
      if (gates[i].bump > 0) gates[i].bump = Math.max(0, gates[i].bump - h * 2.4);
      if (gates[i].flip > 0) gates[i].flip = Math.max(0, gates[i].flip - h);
    }
    if (flyT > 0) flyT -= h;
    for (let i = 0; i < words.length; i++) {
      if (!words[i].on) continue;
      words[i].life -= h;
      if (words[i].life <= 0) words[i].on = 0;
    }
    fadeFx(muzzles, h);
    fadeFx(sparks, h);
    fadeFx(splats, h);
    if (camShake > 0) camShake = Math.max(0, camShake - h);
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
    view.tierName = TIER_NAMES[tier] || "Wood";
    view.family = mods.family;
    view.color = mods.color;
    view.gold = mods.gold ? 1 : 0;
    view.spin = spin;
    view.dist = dist;
    view.arena = arenaStarted;
    view.enemies = liveN;
    view.bossHp = bossState.hp;
    view.bossMax = level.bossHp;
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
    view.crateHp = crates[0] ? crates[0].hp : 0;
    view.targetX = targetX;
    view.slow = slowLeft;
    view.flash = "";
    view.shake = camShake;
    view.levelId = level.id;
    view.levelName = level.name;
    view.intro = level.intro;
    view.winTitle = level.win;
    view.river = level.river;
    view.dam = level.dam;
    view.theme = level.theme;
    view.toastT = toastT;
    view.toastName = toastName;
    view.toastLine = toastLine;
    view.barkT = barkT;
    view.bark = barkText;
    if (arenaStarted) {
      view.bar = level.bossHp > 0 ? bossState.hp / level.bossHp : 0;
      view.barText = level.bossName;
    } else {
      view.bar = level.len > 0 ? dist / level.len : 0;
      view.barText = "";
    }
  }

  function reset() {
    seed = 12345;
    level = levelOf(level.id);
    squadN = 3;
    squadX = 0;
    targetX = 0;
    dist = 0;
    prevZ = 0;
    half = 5;
    radius = formationRadius(3, 5);
    weaponId = "bow";
    tier = 1;
    spin = 0;
    kickT = 0;
    gunAcc = 0;
    running = false;
    ended = "";
    winSent = false;
    slowLeft = 0;
    flashT = 0;
    kills = 0;
    duckKills = 0;
    duckCrates = 0;
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
    stuckN = 0;
    shotThisTick = false;
    toastT = 0;
    barkT = 0;
    wrenchPhase = 0;
    pullT = 0;
    counts.fill(0);
    fired.fill(0);
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      p.alive.fill(0);
      p.freeN = p.cap;
      for (let i = 0; i < p.cap; i++) p.free[i] = i;
    }
    clearPool(balls);
    clearPool(arrows);
    clearPool(logs);
    clearPool(rockets);
    clearPool(party);
    clearPool(muds);
    clearPool(cases);
    clearPool(embers);
    clearPool(puddles);
    clearPool(hazards);
    clearPool(vducks);
    pFreeN = PUFFS;
    for (let i = 0; i < PUFFS; i++) {
      pfree[i] = i;
      palive[i] = 0;
    }
    flAlive.fill(0);
    for (let i = 0; i < words.length; i++) words[i].on = 0;
    clearFx(muzzles);
    clearFx(sparks);
    clearFx(splats);
    camShake = 0;
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = rnd() * 0.25;
    bossKind = level.boss;
    showBossMesh();
    bossState.hp = level.bossHp;
    bossState.alive = 0;
    bossState.shown = 0;
    bossState.summoned = 0;
    bossState.x = 0;
    bossState.z = -(level.len + 11);
    bossState.homeZ = bossState.z;
    bossState.mode = 0;
    bossState.t = 1.4;
    boss.visible = false;
    wrench.visible = false;
    manhole.visible = false;
    wayArrow.visible = false;
    zone.visible = false;
    rack.visible = false;
    layoutLevel();
    buildGates();
    refreshMods();
    audio.endFire();
    publish();
  }

  function sync(cam) {
    flushCrates();
    flameMat.uniforms.uTime.value = clock;
    gateTime.value = clock;
    const shown = formationOffsets(squadN, radius, fx, fz);
    const back = kickT > 0 ? 0.15 * (kickT / 0.2) : 0;
    const wob = spin * Math.sin(clock * 90) * 0.03;
    const sM = soldiers.instanceMatrix.array;
    soldiers.count = shown;
    soldiers.visible = shown > 0;
    const gM = goldRing.instanceMatrix.array;
    goldRing.count = mods.gold ? shown : 0;
    goldRing.visible = mods.gold && shown > 0;
    for (let i = 0; i < shown; i++) {
      writeTRS(sM, i, squadX + fx[i] + wob, DECK, -dist + fz[i] + back, 0, 1, 1, 1);
      if (mods.gold) writeTRS(gM, i, squadX + fx[i] + wob + 0.22, DECK + 0.55, -dist + fz[i] + back - 0.25, 0, 1, 1, 1);
    }
    if (shown) soldiers.instanceMatrix.needsUpdate = true;
    if (goldRing.visible) goldRing.instanceMatrix.needsUpdate = true;
    copyInstances(soldiers, soldierShell, shown);
    bober.position.set(squadX + wob, DECK, -dist - radius - 1.15 + back);
    bober.visible = ended !== "lose";
    const pr = Math.max(0.8, radius + 0.5);
    pillar.position.set(squadX, DECK + 3.5, -dist);
    pillar.scale.set(pr, 1, pr);
    pillarMat.uniforms.uTime.value = clock;
    pillar.visible = shown > 0 && ended !== "lose";
    glow.visible = spin > 0.2;
    if (glow.visible) {
      glow.position.set(squadX + wob, 1.15, -dist + 0.2);
      const gs = 0.6 + spin * 1.1;
      glow.scale.set(gs, gs, 1);
    }
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      const m = p.mesh.instanceMatrix.array;
      const ph = p.phaseAttr.array;
      const ht = p.hitAttr.array;
      let w = 0;
      for (let i = 0; i < p.cap; i++) {
        if (!p.alive[i]) continue;
        const sc = p.radS[i] || 1;
        const y = (t === 5 ? 1.05 : DECK);
        const yaw = t === 6 ? (p.side[i] < 0 ? Math.PI / 2 : -Math.PI / 2) : Math.PI;
        const roll = t === 3 ? clock * 6 : 0;
        if (t === 3) writeLog(m, w, p.x[i], y, p.z[i], yaw, roll, sc);
        else writeTRS(m, w, p.x[i], y, p.z[i], yaw, sc, sc, sc);
        ph[w] = p.phase[i] + (t === 5 ? clock : 0);
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
      copyInstances(p.mesh, p.shell, w);
    }
    const stM = stuckMesh.instanceMatrix.array;
    stuckMesh.count = stuckN;
    stuckMesh.visible = stuckN > 0;
    for (let i = 0; i < stuckN; i++) {
      const s = stuckS[i] % Math.max(1, shown);
      writeTRS(stM, i, squadX + (fx[s] || 0), 1.15, -dist + (fz[s] || 0), clock, 0.7, 0.7, 0.7);
    }
    if (stuckN) stuckMesh.instanceMatrix.needsUpdate = true;

    paintShots(balls, "ball", cam);
    paintShots(arrows, "arrow", cam);
    paintShots(logs, "log", cam);
    paintShots(rockets, "rocket", cam);
    paintShots(party, "party", cam);
    paintShots(muds, "mud", cam);
    paintShots(cases, "case", cam);
    paintShots(embers, "ember", cam);
    paintShots(puddles, "puddle", cam);
    paintShots(hazards, "hazard", cam);
    paintShots(vducks, "vduck", cam);

    const coneOn = mods.pattern === "cone" && running && !ended && shown > 0;
    const streamOn = mods.pattern === "stream" && running && !ended && shown > 0;
    const origins = Math.max(1, Math.ceil(Math.max(1, shown) / 10));
    for (let i = 0; i < 6; i++) {
      const s = Math.min(shown - 1, i * 10);
      const on = coneOn && i < origins;
      flames[i].visible = !!on;
      if (on) {
        const rad = Math.tan(mods.spread * 0.5) * 11;
        flames[i].position.set(squadX + (fx[s] || 0), 1.05, -dist + (fz[s] || 0));
        flames[i].scale.set(rad, rad, 11);
      }
      const onS = streamOn && i < origins;
      saps[i].visible = !!onS;
      if (onS) {
        saps[i].position.set(squadX + (fx[s] || 0), 1.0, -dist + (fz[s] || 0));
        saps[i].scale.set(1, 1, 20);
      }
    }

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
      const s = psize[i] * (0.45 + 0.55 * (plife[i] / (pmax[i] || 1)));
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
      for (let k = 0; k < nDig && dw < GLYPHS; k++) {
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
      const near = Math.abs(-g.z - dist) < 70;
      const s = g.passed || !near ? 0 : 1;
      if (s) anyGate = 1;
      let flipY = s;
      if (s && g.flip > 0) {
        const u = 1 - g.flip / 0.3;
        flipY = Math.abs(Math.cos(u * Math.PI));
        if (flipY < 0.04) flipY = 0.04;
      }
      writeTRS(fM, i, g.x, 0, g.z, 0, s, flipY, s);
      writeTRS(oM, i, g.x, 0, g.z, 0, s, flipY, s);
      writeTRS(pPM, i, g.x, 1.75, g.z + 0.16, 0, s, flipY, s);
      writeTRS(rM, i, g.x, 1.75, g.z + 0.08, 0, s, flipY, s);
      const sign = signs[i].mesh;
      sign.visible = !!s;
      if (s) {
        sign.position.set(g.x, 1.75, g.z + 0.34);
        sign.quaternion.copy(cam.quaternion);
        const bump = 1 + g.bump;
        sign.scale.set(bump, bump * (s ? flipY / s : 1), bump);
      }
    }
    for (let i = gates.length; i < 8; i++) signs[i].mesh.visible = false;
    gateFrame.count = gates.length;
    gateOutline.count = gates.length;
    gatePanel.count = gates.length;
    gateRim.count = gates.length;
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
      const near = Math.abs(-c.z - dist) < 48;
      c.mesh.visible = near;
      if (!near) continue;
      const jx = (c.state === "shake" ? Math.sin(clock * 95) * 0.08 : 0) + Math.sin(clock * 70) * (c.jab || 0);
      const wobble = c.kind === "mystery" ? Math.sin(clock * 2.2) * 0.05 : 0;
      c.mesh.position.set(c.x + jx, DECK, c.z);
      c.mesh.rotation.z = wobble;
    }
    for (let i = 0; i < 3; i++) rackBits[i].icon.rotation.y = clock * 0.55 + i * 0.4;
    if (rack.visible) {
      const near = Math.abs(-rackZ - dist) < 46;
      rack.visible = near && !rackTaken;
    }
    paintFx(muzzles, cam, 0);
    paintFx(sparks, cam, 0);
    paintFx(splats, cam, 1);

    const bM = blobs.instanceMatrix.array;
    let bw = 0;
    const blobAt = (x, z, sc) => {
      if (bw >= 400) return;
      writeTRS(bM, bw, x, DECK + 0.02, z, 0, sc, 1, sc * 0.72);
      bw++;
    };
    if (shown > 0 && ended !== "lose") {
      for (let i = 0; i < shown; i++) blobAt(squadX + fx[i], -dist + fz[i], 1);
      blobAt(squadX, -dist - radius - 1.15, 1.15);
    }
    for (let t = 0; t < TYPES && bw < 400; t++) {
      const p = pools[t];
      for (let i = 0; i < p.cap && bw < 400; i++) {
        if (!p.alive[i]) continue;
        if (p.z[i] < -dist - 80) continue;
        blobAt(p.x[i], p.z[i], Math.max(0.6, ENEMY[t].rad * (p.radS[i] || 1) * 1.6));
      }
    }
    for (let i = 0; i < crates.length && bw < 400; i++) {
      const c = crates[i];
      if (c.state === "dead" || !c.mesh.visible) continue;
      blobAt(c.x, c.z, 2.4);
    }
    if (boss.visible && bossState.alive && bw < 400) blobAt(bossState.x, bossState.z, 2.8);
    blobs.count = bw;
    blobs.visible = bw > 0;
    if (bw) blobs.instanceMatrix.needsUpdate = true;

    projA.set(squadX, 1, -dist);
    projB.set(squadX + 1, 1, -dist);
    projA.project(cam);
    projB.project(cam);
    const pxPerM = Math.abs(projB.x - projA.x) * 0.5 * (cam.userData.viewW || window.innerWidth);
    view.mPerPx = pxPerM > 0.5 ? 1 / pxPerM : view.mPerPx;
  }

  const COLS = {
    0: lin("#F4E6C3"),
    1: lin("#F7F7FF"),
    2: lin("#F5C400"),
    3: lin("#4FC3FF"),
    4: lin("#FF4FA3"),
    5: lin("#E86A1A"),
  };

  function paintShots(s, kind, cam) {
    const m = s.mesh.instanceMatrix.array;
    const col = s.mesh.instanceColor ? s.mesh.instanceColor.array : null;
    let w = 0;
    const qx = cam.quaternion.x;
    const qy = cam.quaternion.y;
    const qz = cam.quaternion.z;
    const qw = cam.quaternion.w;
    for (let i = 0; i < s.n; i++) {
      if (!s.alive[i]) continue;
      if (kind === "log") {
        const yaw = Math.atan2(-s.vx[i], -s.vz[i]);
        writeLog(m, w, s.x[i], s.y[i], s.z[i], yaw, s.roll[i], 1);
      } else if (kind === "rocket") {
        const yaw = Math.atan2(-s.vx[i], -s.vz[i]);
        writeTRS(m, w, s.x[i], s.y[i], s.z[i], yaw, 1, 1, 1);
      } else if (kind === "arrow" || kind === "ball") {
        const yaw = Math.atan2(s.vx[i], s.vz[i]);
        writeTRS(m, w, s.x[i], s.y[i], s.z[i], yaw, 1, 1, 1);
      } else if (kind === "case") {
        const yaw = Math.atan2(s.vx[i], s.vz[i]);
        writeTRS(m, w, s.x[i], s.y[i], s.z[i], yaw, 1, 1, 1);
      } else if (kind === "hazard" || kind === "puddle") {
        const sc = kind === "hazard" ? (s.extra[i] || 1) * 2 : 1.1;
        writeQuat(m, w, s.x[i], s.y[i], s.z[i], sc, QX, 0, 0, QW);
      } else if (kind === "party" || kind === "ember") {
        const sc = kind === "party" ? 0.22 : 0.16;
        writeQuat(m, w, s.x[i], s.y[i], s.z[i], sc, qx, qy, qz, qw);
      } else if (kind === "vduck") {
        writeTRS(m, w, s.x[i], s.y[i], s.z[i], 0, 0.7, 0.7, 0.7);
      } else {
        writeTRS(m, w, s.x[i], s.y[i], s.z[i], 0, 1, 1, 1);
      }
      if (col) {
        const c = COLS[s.col[i]] || COLS[0];
        col[w * 3] = c[0];
        col[w * 3 + 1] = c[1];
        col[w * 3 + 2] = c[2];
      }
      w++;
    }
    s.mesh.count = w;
    s.mesh.visible = w > 0;
    if (w) {
      s.mesh.instanceMatrix.needsUpdate = true;
      if (col) s.mesh.instanceColor.needsUpdate = true;
    }
  }

  function tick(dt) {
    let left = dt > 0.05 ? 0.05 : dt;
    if (left < 0) left = 0;
    shotThisTick = false;
    audio.beginTick();
    while (left > 1e-5) {
      const h = left > 1 / 60 ? 1 / 60 : left;
      const sim = slowLeft > 0 ? h * 0.35 : h;
      tickOnce(sim);
      left -= h;
      if (ended === "lose") break;
    }
    if (running && !ended) {
      if (shotThisTick) audio.noteFire(weaponId, spin);
      else audio.endFire();
    }
  }

  function tickReal(real) {
    if (toastT > 0) toastT = Math.max(0, toastT - real);
    if (barkT > 0) barkT = Math.max(0, barkT - real);
    view.toastT = toastT;
    view.barkT = barkT;
    if (flashT > 0) {
      flashT -= real;
      if (flashT < 0) flashT = 0;
    }
    view.flash = "";
    view.shake = camShake;
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
    snap.family = mods.family;
    snap.gold = mods.gold ? 1 : 0;
    snap.color = mods.color;
    snap.dist = dist;
    snap.enemies = liveN;
    snap.bossHp = bossState.hp;
    snap.crateHp = crates[0] ? crates[0].hp : 0;
    snap.crate2 = crates[1] ? crates[1].hp : 0;
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
    snap.spin = spin;
    snap.foam = 0;
    const suds = pools[1];
    for (let i = 0; i < suds.cap; i++) {
      if (suds.alive[i]) {
        snap.foam = suds.foam[i];
        break;
      }
    }
    snap.stuck = stuckN;
    snap.duckKills = duckKills;
    snap.level = level.id;
    snap.bark = barkText;
    snap.river = level.river;
    snap.rack = rackStyle;
    snap.banner = rackBanner;
    if (!snap.counts) snap.counts = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 7; i++) snap.counts[i] = counts[i];
    if (!snap.kinds) snap.kinds = [];
    snap.kinds.length = 0;
    for (let i = 0; i < crates.length; i++) {
      if (crates[i].hp > 0) snap.kinds.push(crates[i].kind);
    }
    if (!snap.slots) snap.slots = ["", "", ""];
    for (let i = 0; i < 3; i++) snap.slots[i] = rackSlots[i].kind === "gun" ? rackSlots[i].gun : rackSlots[i].kind;
    return snap;
  }

  function selfTest() {
    const fails = selfTestRules();
    if (tris.soldier > 600) fails.push("soldier tris " + tris.soldier);
    if (tris.bober > 800) fails.push("bober tris " + tris.bober);
    for (let t = 0; t < TYPES; t++) {
      if (builtE[t].tris > 500) fails.push("enemy tris " + t + " " + builtE[t].tris);
    }
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
    camera.position.set(0, 11, 13);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0.3, -11);
    camera.updateMatrixWorld(true);
    const a = new THREE.Vector3(0, 1, 0).project(camera);
    const b = new THREE.Vector3(1, 1, 0).project(camera);
    if (!(b.x > a.x + 0.001)) fails.push("camera right");

    reset();
    running = true;
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = 5;
    const clog = spawnEnemy(0, 0.05, -8);
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
    balls.tag[id] = ++shotTag;
    step(0.2);
    const pr = pools[0];
    if (clog >= 0 && pr.alive[clog]) fails.push("bullet miss hp " + pr.hp[clog]);

    reset();
    running = true;
    for (let i = 0; i < RENDER_CAP; i++) cds[i] = 9;
    const line = [];
    for (let i = 0; i < 4; i++) line.push(spawnEnemy(0, 0, -8 - i * 3));
    const arrow = allocS(arrows);
    arrows.x[arrow] = 0;
    arrows.y[arrow] = 0.5;
    arrows.z[arrow] = -4;
    arrows.vx[arrow] = 0;
    arrows.vy[arrow] = 0;
    arrows.vz[arrow] = -90;
    arrows.dmg[arrow] = 60;
    arrows.life[arrow] = 1;
    arrows.extra[arrow] = 4;
    arrows.flag[arrow] = 0;
    arrows.col[arrow] = 1;
    arrows.tag[arrow] = ++shotTag;
    step(0.35);
    let pierced = 0;
    for (let i = 0; i < 4; i++) if (line[i] >= 0 && !pools[0].alive[line[i]]) pierced++;
    if (pierced < 4) fails.push("pierce " + pierced);

    reset();
    running = true;
    const leaf = spawnEnemy(5, 0, -12);
    damageEnemy(5, leaf, 1, 0, 1, -12, 0, 0, 1);
    if (leaf >= 0 && pools[5].alive[leaf]) fails.push("flame leaf");

    reset();
    running = true;
    const held = spawnEnemy(0, 0, -18);
    if (held >= 0) pools[0].stagT[held] = 0.3;
    const z0 = held >= 0 ? pools[0].z[held] : 0;
    step(0.2);
    if (held >= 0 && Math.abs(pools[0].z[held] - z0) > 0.08) fails.push("stagger");

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
    running = true;
    squadN = 3;
    armHazard(0, 0, 2, 0.05, 3);
    step(0.2);
    if (squadN !== 0) fails.push("hazard " + squadN);
    reset();
    return { fails, soldier: tris.soldier, bober: tris.bober, boss: tris.boss };
  }

  function killAll() {
    for (let t = 0; t < TYPES; t++) {
      const p = pools[t];
      for (let i = 0; i < p.cap; i++) {
        if (!p.alive[i]) continue;
        const fxOn = pFreeN > 8;
        const x0 = p.x[i];
        const z0 = p.z[i];
        releaseEnemy(t, i);
        kills++;
        if (fxOn) {
          puff(x0, 0.4, z0, 0, 3, 2, 0.3, 0.35);
          puff(x0, 0.6, z0, 1, 2, 1.4, 0.3, 0.28);
        }
      }
    }
    if (liveN < 0) liveN = 0;
    bench = 0;
    publish();
  }

  function spawnPack(kind, count, hp, freeze) {
    const type = KIND_OF[kind] != null ? KIND_OF[kind] : 0;
    bench = 1;
    const n = count | 0;
    for (let i = 0; i < n; i++) {
      const near = n === 1;
      const id = spawnEnemy(type, near ? squadX : ((i % 14) - 7) * 0.62, -dist - (near ? 8 : 18) - ((i / 14) | 0) * 1.35);
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
    setLevel(id) {
      level = levelOf(id);
    },
    setLoadout(save) {
      unlocked = (save && save.unlocked && save.unlocked.length ? save.unlocked : STARTERS).slice();
      const list = (save && save.seenGuns) || STARTERS;
      for (let i = 0; i < GUN_ORDER.length; i++) seen[GUN_ORDER[i]] = false;
      for (let i = 0; i < list.length; i++) seen[list[i]] = true;
    },
    cycleGun() {
      const i = GUN_ORDER.indexOf(weaponId);
      weaponId = GUN_ORDER[(i + 1) % GUN_ORDER.length];
      spin = 0;
      refreshMods();
      publish();
    },
    bumpTier() {
      tier = Math.min(4, tier + 1);
      refreshMods();
      publish();
    },
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
      if (!c || c.state !== "idle") return c ? c.hp : 0;
      c.hp = Math.max(0, c.hp - dmg);
      c.dirty = 1;
      if (c.hp <= 0) breakCrate(c);
      publish();
      return c.hp;
    },
    openCrate(index) {
      const c = crates[index | 0];
      if (!c || c.state !== "idle") return 0;
      c.hp = 0;
      c.dirty = 1;
      breakCrate(c);
      publish();
      return 1;
    },
    damageGate(hits) {
      const g = gates[0];
      if (g && !g.passed && shootGate(g, hits)) relabel(0);
      publish();
      return g ? g.label : "";
    },
    forceRack() {
      const evs = level.events;
      for (let i = 0; i < evs.length; i++) if (evs[i].at < 340) fired[i] = 1;
      dist = 345;
      prevZ = -345;
      squadX = -3.2;
      targetX = -3.2;
      rack.visible = true;
      publish();
    },
    debugWin() {
      if (squadN < 30) squadN = 30;
      kills = 40;
      cratesOpened = 1;
      crateRammed = 0;
      duckKills = 0;
      duckCrates = 0;
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
      hurtBoss(99999, 0, 0, 1, bossState.x, 1.6, bossState.z);
      publish();
    },
    setBot(v) {
      bot = !!v;
    },
  };
}
