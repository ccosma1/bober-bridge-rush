import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { bakeCrowd, staticMerge, mountRig, boxGeo } from "./vat.js?v=br24";

const V = "br24";
const warned = {};

function url(path) {
  return path + "?v=" + V;
}

function warnOnce(slot, reason) {
  if (warned[slot]) return;
  warned[slot] = 1;
  console.warn("asset fallback:", slot, reason || "");
}

function withTimeout(run, ms) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, reason: "timeout" });
    }, ms || 8000);
    run(
      (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ ok: true, value });
      },
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ ok: false, reason: String(err && err.message ? err.message : err) });
      }
    );
  });
}

const MUD = new THREE.Color("#E08A3C");
const MUD2 = new THREE.Color("#F2B15A");
const BARK = new THREE.Color("#D4722A");
const BARK2 = new THREE.Color("#F0C07A");
const MOSS = new THREE.Color("#7CB342");
const LEAF = new THREE.Color("#6E9440");
const REED_DK = new THREE.Color("#3f5a28");
const REED_LT = new THREE.Color("#8eac58");
const FOAM = new THREE.Color("#F7FBFA");
const FOAM2 = new THREE.Color("#e7f4ff");
const RUST = new THREE.Color("#8A4B32");
const SAC = new THREE.Color("#9aaf6a");
const EYE = new THREE.Color("#b060ff");
const REEDS = [MOSS, LEAF, REED_DK, REED_LT];

function vhash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function paintClog(col, name, yNorm, x, y, z, nx, ny) {
  const salt = (name ? name.length : 1) * 0.17;
  const blot = vhash(Math.floor(x * 7 + salt), Math.floor(y * 7), Math.floor(z * 7));
  const fine = vhash(x * 19 + salt, y * 19, z * 17);
  if (blot > 0.58) col.copy(BARK).lerp(BARK2, fine);
  else col.copy(MUD).lerp(MUD2, fine);
  const up = ny > 0 ? ny : 0;
  if (up > 0.55) col.lerp(MOSS, Math.min(0.28, (up - 0.55) * 0.7));
  if (yNorm < 0.12) col.multiplyScalar(0.92);
}

function sphereGeo(r, x, y, z, w, h) {
  const g = new THREE.SphereGeometry(r, w || 8, h || 6);
  g.translate(x, y, z);
  return g;
}

function strandGeo(r, h, x, y, z, lean, cone) {
  const g = cone
    ? new THREE.ConeGeometry(r, h, 4, 1, true)
    : new THREE.CylinderGeometry(r * 0.4, r, h, 5, 1, true);
  g.translate(0, h * 0.5, 0);
  g.rotateZ(lean || 0);
  g.rotateX((lean || 0) * 0.45);
  g.translate(x, y, z);
  return g;
}

function shellGeo(rx, ry, rz, x, y, z) {
  const g = new THREE.SphereGeometry(1, 8, 6);
  g.scale(rx, ry, rz);
  g.translate(x, y, z);
  return g;
}

function clogBits(api, kind) {
  const head = api.bone("Head");
  const torso = api.bone("Torso") || api.bone("Chest") || api.bone("Abdomen");
  if (!head) return;
  const p = new THREE.Vector3();
  head.getWorldPosition(p);
  // Mounted crowd faces -Z; eyes, mane root, and the spout use that side.
  const ey = p.y + 0.22;
  const ez = p.z - 0.55;
  api.add("Head", sphereGeo(0.08, p.x - 0.1, ey, ez, 8, 6), 5, EYE, 0);
  api.add("Head", sphereGeo(0.08, p.x + 0.1, ey, ez, 8, 6), 5, EYE, 0);
  if (kind === "clog") {
    const mane = 16;
    for (let i = 0; i < mane; i++) {
      const len = 0.28 + (i % 5) * 0.07;
      const ang = (i / mane) * Math.PI * 2;
      const lean = (i % 2 ? 0.55 : -0.48) * (0.7 + (i % 3) * 0.18);
      api.add("Head", strandGeo(
        0.02 + (i % 3) * 0.008,
        len,
        p.x + Math.cos(ang) * 0.16,
        p.y + 0.42,
        p.z + Math.sin(ang) * 0.1,
        lean,
        i % 2 === 0
      ), 6, REEDS[i % 4], 0);
    }
    const body = torso || head;
    const q = new THREE.Vector3();
    body.getWorldPosition(q);
    api.add(body.name, shellGeo(0.22, 0.1, 0.16, q.x - 0.2, q.y + 0.16, q.z + 0.02), 0, BARK, 0);
    api.add(body.name, shellGeo(0.18, 0.08, 0.14, q.x + 0.18, q.y + 0.1, q.z - 0.02), 0, BARK2, 0);
    api.add(body.name, shellGeo(0.16, 0.12, 0.12, q.x, q.y + 0.22, q.z + 0.12), 0, MUD, 0);
    for (let i = 0; i < 6; i++) {
      const len = 0.42 + (i % 3) * 0.08;
      api.add("Head", strandGeo(
        0.016,
        len,
        p.x + (i - 2.5) * 0.045,
        p.y + 0.3,
        p.z + 0.16,
        1.05,
        i % 2 === 0
      ), 6, REEDS[i % 4], 0);
    }
  }
  if (kind === "suds") {
    const s = torso || head;
    const q = new THREE.Vector3();
    s.getWorldPosition(q);
    const bubbles = [
      [0.22, 0.2, 0.02, 0.16],
      [-0.2, 0.16, -0.04, 0.14],
      [0.04, 0.32, -0.08, 0.12],
      [-0.1, 0.26, 0.14, 0.13],
      [0.16, 0.08, -0.16, 0.1],
      [0, 0.14, 0.12, 0.15],
      [0.24, 0.28, 0.08, 0.09],
      [-0.26, 0.02, 0.06, 0.11],
      [0.08, -0.02, -0.12, 0.1],
      [-0.06, 0.36, 0.02, 0.08],
      [0.18, 0.18, 0.16, 0.09],
      [-0.14, 0.08, -0.16, 0.12],
    ];
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      api.add(s.name, sphereGeo(b[3], q.x + b[0], q.y + b[1], q.z + b[2], 7, 5), 2, i % 2 ? FOAM : FOAM2, 0);
    }
    api.add("Head", sphereGeo(0.28, p.x, p.y + 0.28, p.z, 8, 6), 2, FOAM, 0);
    api.add("Head", sphereGeo(0.12, p.x + 0.16, p.y + 0.36, p.z - 0.06, 6, 5), 2, FOAM2, 0);
    api.add("Head", sphereGeo(0.1, p.x - 0.14, p.y + 0.34, p.z + 0.04, 6, 5), 2, FOAM, 0);
    api.add(s.name, shellGeo(0.16, 0.48, 0.42, q.x - 0.42, q.y + 0.08, q.z - 0.28), 2, FOAM, 0);
    api.add(s.name, shellGeo(0.1, 0.36, 0.3, q.x - 0.5, q.y + 0.08, q.z - 0.22), 2, FOAM2, 0);
    api.add("Head", sphereGeo(0.11, p.x - 0.1, ey - 0.04, ez - 0.1, 6, 4), 2, FOAM, 0);
    api.add("Head", sphereGeo(0.11, p.x + 0.1, ey - 0.04, ez - 0.1, 6, 4), 2, FOAM2, 0);
    api.add("Head", sphereGeo(0.08, p.x, ey + 0.1, ez - 0.12, 5, 4), 2, FOAM, 0);
    const visor = new THREE.TorusGeometry(0.18, 0.04, 4, 8);
    visor.rotateX(1.15);
    visor.translate(p.x, ey + 0.02, ez - 0.04);
    api.add("Head", visor, 2, FOAM2, 0);
  }
  if (kind === "spit") {
    const bone = torso || head;
    const q = new THREE.Vector3();
    bone.getWorldPosition(q);
    // Local -X is the flank the bridge camera sees after the enemy yaw.
    api.add(bone.name, sphereGeo(0.32, q.x - 0.34, q.y + 0.02, q.z + 0.02, 12, 10), 7, SAC, 0);
    api.add(bone.name, sphereGeo(0.16, q.x - 0.5, q.y + 0.16, q.z - 0.04, 10, 8), 7, new THREE.Color("#c6d48a"), 0);
    api.add(bone.name, sphereGeo(0.09, q.x - 0.22, q.y - 0.16, q.z + 0.04, 8, 6), 7, SAC, 0);
    const spout = new THREE.CylinderGeometry(0.07, 0.09, 0.46, 6);
    spout.rotateX(Math.PI / 2);
    spout.translate(q.x, q.y + 0.06, q.z - 0.62);
    api.add(bone.name, spout, 7, RUST, 0);
    const lip = new THREE.TorusGeometry(0.09, 0.025, 5, 8);
    lip.rotateX(Math.PI / 2);
    lip.translate(q.x, q.y + 0.06, q.z - 0.84);
    api.add(bone.name, lip, 7, new THREE.Color("#6e3a28"), 0);
    api.add(bone.name, sphereGeo(0.06, q.x, q.y + 0.02, q.z - 0.92, 5, 4), 7, SAC, 0);
  }
}

function haulerBits(api) {
  const hand = api.bone("Wrist.R") || api.bone("LowerArm.R") || api.bone("Head");
  if (hand) {
    const p = new THREE.Vector3();
    hand.getWorldPosition(p);
    api.add(hand.name, shellGeo(0.3, 0.2, 0.24, p.x, p.y + 0.04, p.z - 0.2), 4, new THREE.Color("#c5ced6"), 0);
    api.add(hand.name, shellGeo(0.16, 0.12, 0.14, p.x + 0.14, p.y + 0.14, p.z - 0.08), 4, new THREE.Color("#d5dde3"), 0);
    api.add(hand.name, shellGeo(0.1, 0.08, 0.1, p.x - 0.12, p.y + 0.1, p.z - 0.28), 4, new THREE.Color("#aeb8c0"), 0);
  }
  const torso = api.bone("Torso") || api.bone("Abdomen");
  if (torso) {
    const q = new THREE.Vector3();
    torso.getWorldPosition(q);
    api.add(torso.name, shellGeo(0.34, 0.2, 0.26, q.x, q.y + 0.14, q.z + 0.16), 0, new THREE.Color("#5c4030"), 0);
  }
  const shoulders = [api.bone("Shoulder.L"), api.bone("Shoulder.R")];
  for (let i = 0; i < shoulders.length; i++) {
    const bone = shoulders[i];
    if (!bone) continue;
    const q = new THREE.Vector3();
    bone.getWorldPosition(q);
    api.add(bone.name, shellGeo(0.16, 0.12, 0.15, q.x, q.y + 0.05, q.z + 0.05), 0, new THREE.Color("#4a3428"), 0);
  }
}

const FILES = {
  zombie: "assets/models/zombie.glb",
  yeti: "assets/models/yeti.glb",
  yetiCrowd: "assets/models/yeti-crowd.glb",
  duck: "assets/models/duck.glb",
  crossbow: "assets/models/crossbow.glb",
  rocket: "assets/models/rocket.glb",
  wrench: "assets/models/wrench.glb",
  smg: "assets/guns/blaster-c.glb",
  shot: "assets/guns/blaster-b.glb",
  gerald: "assets/guns/blaster-j.glb",
  party: "assets/guns/blaster-k.glb",
  flame: "assets/guns/blaster-n.glb",
  sap: "assets/guns/blaster-h.glb",
  concrete: "assets/textures/concrete_diff.jpg",
  concreteNor: "assets/textures/concrete_nor.jpg",
  concreteArm: "assets/textures/concrete_arm.jpg",
  metal: "assets/textures/metal_diff.jpg",
  metalNor: "assets/textures/metal_nor.jpg",
  water: "assets/textures/waternormals.jpg",
  hdr: "assets/env/shanghai_riverside_1k.hdr",
};

const CITY = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => "assets/city/low-detail-building-" + id + ".glb")
  .concat(["a", "b", "c", "d"].map((id) => "assets/city/building-skyscraper-" + id + ".glb"));

export function loadGame(onStep) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const texLoader = new THREE.TextureLoader();
  const hdrLoader = new RGBELoader();
  const keys = Object.keys(FILES).concat(CITY.map((p, i) => "city" + i));
  const paths = Object.values(FILES).concat(CITY);
  let step = 0;
  const jobs = paths.map((path, i) => withTimeout((ok, bad) => {
    const full = url(path);
    const finish = (value) => {
      step++;
      if (onStep) onStep(step, paths.length);
      ok(value);
    };
    if (path.endsWith(".hdr")) {
      hdrLoader.load(full, (tex) => finish(tex), undefined, bad);
    } else if (path.endsWith(".glb")) {
      loader.load(full, (gltf) => finish(gltf), undefined, bad);
    } else {
      texLoader.load(full, (tex) => {
        tex.colorSpace = path.indexOf("nor") >= 0 || path.indexOf("arm") >= 0 || path.indexOf("water") >= 0
          ? THREE.NoColorSpace
          : THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        finish(tex);
      }, undefined, bad);
    }
  }, 8000).then((res) => {
    if (!res.ok) warnOnce(keys[i], res.reason);
    return res;
  }));

  const map = Promise.allSettled(jobs).then((settled) => {
    const got = {};
    for (let i = 0; i < keys.length; i++) {
      const r = settled[i];
      const val = r.status === "fulfilled" ? r.value : { ok: false };
      got[keys[i]] = val && val.ok ? val.value : null;
    }
    return got;
  });

  const critical = map.then((got) => ({
    zombie: !!got.zombie,
    concrete: !!got.concrete,
  }));

  const done = map.then((got) => bakeAll(got));
  return { critical, done };
}

const STEEL = new THREE.Color("#3a4048");
const GRIP_C = new THREE.Color("#6b4a32");
const BRASS = new THREE.Color("#c9a15a");
const LENS = new THREE.Color("#ff2430");
const ORB = new THREE.Color("#d5e6ff");
const GUN_BODY = {
  mini: new THREE.Color("#F5C400"),
  dambust: new THREE.Color("#E23B32"),
  burst: new THREE.Color("#F4E6C3"),
  saw: new THREE.Color("#F2E8CF"),
  rail: new THREE.Color("#C9864A"),
  beam: new THREE.Color("#E23B32"),
  storm: new THREE.Color("#4FC3FF"),
  flame: new THREE.Color("#F5A623"),
  glacier: new THREE.Color("#4FC3B3"),
  barrage: new THREE.Color("#E23B32"),
  cone: new THREE.Color("#C9864A"),
  aurora: new THREE.Color("#7DEBFF"),
};

function triCount(geo) {
  if (!geo) return 0;
  if (geo.index) return geo.index.count / 3;
  return geo.attributes.position.count / 3;
}

function tubeGeo(r, len, seg, x, y, z, open) {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, !!open);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function addP(parts, geo, col) {
  parts.push({ geo: geo, color: col });
}

function addBoxP(parts, w, h, d, x, y, z, col) {
  addP(parts, boxGeo(w, h, d, x, y, z), col);
}

function addGrip(parts, x, y, z) {
  addBoxP(parts, 0.07, 0.16, 0.085, x, y, z, GRIP_C);
}

function addBand(parts, r, x, y, z) {
  addP(parts, tubeGeo(r, 0.034, 8, x, y, z, true), BRASS);
}

function plainParts() {
  const parts = [];
  addBoxP(parts, 0.08, 0.09, 0.36, 0, 0.06, -0.22, STEEL);
  addBoxP(parts, 0.06, 0.06, 0.22, 0, 0.07, -0.48, STEEL);
  addGrip(parts, 0, -0.06, -0.02);
  addBand(parts, 0.055, 0, 0.07, -0.28);
  return parts;
}

const HOT = new THREE.Color("#FFE08A");

function addCan(parts, col, r, x) {
  const tank = new THREE.CylinderGeometry(r, r * 0.92, 0.18, 6);
  tank.translate(x, 0.11, 0.14);
  addP(parts, tank, col);
}

function flameRig(col, barrels, flare, tankR) {
  const parts = [];
  const n = barrels || 1;
  const span = n > 1 ? 0.08 : 0;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * span;
    const mouth = new THREE.ConeGeometry(0.05 + flare, 0.2, 6);
    mouth.rotateX(Math.PI / 2);
    mouth.translate(x, 0.07, -0.4);
    addP(parts, mouth, HOT);
    addP(parts, tubeGeo(0.03, 0.22, 5, x, 0.07, -0.22, true), col);
  }
  addBoxP(parts, Math.max(0.1, 0.08 + span * (n - 1)), 0.07, 0.16, 0, 0.05, -0.06, col);
  if (tankR) addCan(parts, col, tankR, n > 1 ? 0.02 : 0);
  addGrip(parts, 0, -0.07, 0.02);
  addBand(parts, 0.05 + flare, 0, 0.07, -0.16);
  return parts;
}

function coneFwd(r, len, seg, x, y, z, col, parts) {
  const g = new THREE.ConeGeometry(r, len, seg);
  g.rotateX(-Math.PI / 2);
  g.translate(x, y, z);
  addP(parts, g, col);
}

function ballAt(r, w, h, x, y, z, col, parts) {
  const g = new THREE.SphereGeometry(r, w, h);
  g.translate(x, y, z);
  addP(parts, g, col);
}

function discAt(r, tube, x, y, z, col, parts) {
  const g = new THREE.TorusGeometry(r, tube, 4, 8);
  g.translate(x, y, z);
  addP(parts, g, col);
}

function gunParts(shape) {
  const body = GUN_BODY[shape] || STEEL;
  const parts = [];
  if (shape === "flame") return flameRig(body, 1, 0.04, 0.11);
  if (shape === "mini") {
    for (let i = 0; i < 3; i++) addP(parts, tubeGeo(0.018, 0.28, 5, (i - 1) * 0.045, 0.07, -0.28, true), body);
    addBoxP(parts, 0.14, 0.06, 0.12, 0, 0.06, -0.08, body);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "dambust") {
    addBoxP(parts, 0.22, 0.08, 0.16, 0, 0.07, -0.16, body);
    addP(parts, tubeGeo(0.07, 0.12, 6, 0, 0.07, -0.32, true), body);
    addBoxP(parts, 0.16, 0.04, 0.04, 0, 0.07, -0.4, HOT);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "burst") {
    addBoxP(parts, 0.08, 0.06, 0.22, 0, 0.07, -0.18, body);
    addBoxP(parts, 0.02, 0.035, 0.08, -0.03, 0.1, -0.32, STEEL);
    addBoxP(parts, 0.02, 0.045, 0.1, 0, 0.1, -0.34, STEEL);
    addBoxP(parts, 0.02, 0.035, 0.08, 0.03, 0.1, -0.32, STEEL);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "saw") {
    discAt(0.11, 0.018, 0, 0.08, -0.28, body, parts);
    addBoxP(parts, 0.04, 0.04, 0.16, 0, 0.06, -0.12, STEEL);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "rail") {
    addBoxP(parts, 0.045, 0.045, 0.62, 0, 0.08, -0.36, body);
    addP(parts, tubeGeo(0.02, 0.16, 5, 0, 0.11, -0.2, true), STEEL);
    addBoxP(parts, 0.02, 0.04, 0.08, 0, 0.12, -0.08, STEEL);
    addGrip(parts, 0, -0.05, 0.02);
    return parts;
  }
  if (shape === "beam") {
    addBoxP(parts, 0.07, 0.06, 0.28, 0, 0.07, -0.2, body);
    ballAt(0.045, 8, 6, 0, 0.07, -0.4, LENS, parts);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "storm") {
    addP(parts, tubeGeo(0.02, 0.26, 5, -0.04, 0.09, -0.26, true), body);
    addP(parts, tubeGeo(0.02, 0.26, 5, 0.04, 0.09, -0.26, true), body);
    addBoxP(parts, 0.12, 0.05, 0.12, 0, 0.06, -0.08, STEEL);
    ballAt(0.035, 6, 5, 0, 0.12, -0.16, body, parts);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "glacier") {
    coneFwd(0.035, 0.22, 5, -0.03, 0.08, -0.32, body, parts);
    coneFwd(0.028, 0.16, 5, 0.04, 0.07, -0.24, new THREE.Color("#E8FBFF"), parts);
    addBoxP(parts, 0.08, 0.05, 0.14, 0, 0.06, -0.08, STEEL);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "barrage") {
    for (let i = 0; i < 3; i++) coneFwd(0.028, 0.2, 5, (i - 1) * 0.05, 0.09, -0.3, body, parts);
    addBoxP(parts, 0.16, 0.05, 0.12, 0, 0.05, -0.1, STEEL);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  if (shape === "cone") {
    coneFwd(0.09, 0.2, 6, 0, 0.08, -0.28, body, parts);
    addBoxP(parts, 0.08, 0.06, 0.12, 0, 0.06, -0.08, STEEL);
    addGrip(parts, 0, -0.06, 0.04);
    return parts;
  }
  if (shape === "aurora") {
    ballAt(0.07, 8, 6, 0, 0.09, -0.28, body, parts);
    addBoxP(parts, 0.06, 0.05, 0.14, 0, 0.05, -0.1, STEEL);
    addGrip(parts, 0, -0.06, 0.02);
    return parts;
  }
  return plainParts();
}

function mergeGun(parts) {
  let verts = 0;
  let inds = 0;
  for (let i = 0; i < parts.length; i++) {
    const pos = parts[i].geo.attributes.position;
    verts += pos.count;
    inds += parts[i].geo.index ? parts[i].geo.index.count : pos.count;
  }
  const positions = new Float32Array(verts * 3);
  const colors = new Float32Array(verts * 3);
  const indices = new Uint32Array(inds);
  let vBase = 0;
  let iBase = 0;
  for (let p = 0; p < parts.length; p++) {
    const geo = parts[p].geo;
    const pos = geo.attributes.position;
    const col = parts[p].color;
    for (let i = 0; i < pos.count; i++) {
      const o = (vBase + i) * 3;
      positions[o] = pos.getX(i);
      positions[o + 1] = pos.getY(i);
      positions[o + 2] = pos.getZ(i);
      colors[o] = col.r;
      colors[o + 1] = col.g;
      colors[o + 2] = col.b;
    }
    const idx = geo.index;
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices[iBase++] = idx.getX(i) + vBase;
    } else {
      for (let i = 0; i < pos.count; i++) indices[iBase++] = vBase + i;
    }
    vBase += pos.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.48,
    vertexColors: true,
  });
  return { geo: merged, mat: mat, tris: inds / 3 };
}

function chunkyGun(color, len, shape) {
  let parts = gunParts(shape || "plain");
  let tris = 0;
  for (let i = 0; i < parts.length; i++) tris += triCount(parts[i].geo);
  if (tris > 220) {
    warnOnce("gun-tris", (shape || "") + " " + tris);
    parts = plainParts();
  }
  return mergeGun(parts);
}

function gunOf(gltf, color, len, shape) {
  if (!gltf) return chunkyGun(color, len, shape);
  try {
    const geo = staticMerge(gltf.scene, len || 0.55);
    const tris = geo && geo.index ? Math.floor(geo.index.count / 3) : 0;
    if (!geo || tris > 220) return chunkyGun(color, len, shape);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.28 });
    return { geo, mat, tris };
  } catch (err) {
    warnOnce("gun", err && err.message);
    return chunkyGun(color, len, shape);
  }
}

function propOf(gltf, color, len) {
  if (!gltf) return null;
  try {
    const geo = staticMerge(gltf.scene, len || 1);
    if (!geo) return null;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.2 });
    const tris = geo.index ? Math.floor(geo.index.count / 3) : 0;
    return { geo, mat, tris };
  } catch (err) {
    warnOnce("prop", err && err.message);
    return null;
  }
}

function safeBake(gltf, opt, slot) {
  if (!gltf) return null;
  try {
    return bakeCrowd(gltf, opt);
  } catch (err) {
    warnOnce(slot, err && err.message);
    return null;
  }
}

function paintSolid(geo, hex) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color(hex);
  for (let i = 0; i < pos.count; i++) {
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

function mergeColored(geos) {
  const positions = [];
  const colors = [];
  const indices = [];
  let off = 0;
  for (let g = 0; g < geos.length; g++) {
    const pos = geos[g].attributes.position;
    const col = geos[g].attributes.color;
    const idx = geos[g].index;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (col) colors.push(col.getX(i), col.getY(i), col.getZ(i));
      else colors.push(1, 1, 1);
    }
    if (idx) for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + off);
    else for (let i = 0; i < pos.count; i++) indices.push(off + i);
    off += pos.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  merged.setIndex(indices);
  merged.computeVertexNormals();
  return merged;
}

function mutantDuck(gltf) {
  if (!gltf) return null;
  try {
    const geo = staticMerge(gltf.scene, 0.85);
    if (!geo || !geo.attributes.position) return null;
    geo.rotateY(Math.PI);
    geo.computeBoundingBox();
    const seat = geo.boundingBox;
    geo.translate(-(seat.min.x + seat.max.x) * 0.5, -seat.min.y, -(seat.min.z + seat.max.z) * 0.5);
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const yolk = new THREE.Color("#FFE14A");
    const belly = new THREE.Color("#FFF3C4");
    const shade = new THREE.Color("#E09818");
    const spanY = Math.max(0.001, box.max.y - box.min.y);
    for (let i = 0; i < pos.count; i++) {
      const y = (pos.getY(i) - box.min.y) / spanY;
      const n = Math.sin(pos.getX(i) * 37 + pos.getZ(i) * 19) * 0.04;
      const c = y < 0.42 ? belly : y > 0.78 ? shade : yolk;
      col[i * 3] = Math.min(1, c.r + n);
      col[i * 3 + 1] = Math.min(1, c.g + n * 0.4);
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const w = box.max.x - box.min.x;
    const h = box.max.y - box.min.y;
    const faceZ = box.min.z + (box.max.z - box.min.z) * 0.16;
    const eyeY = box.min.y + h * 0.64;
    const eyeX = w * 0.18;
    const bits = [geo];
    const add = (g, hex) => bits.push(paintSolid(g, hex));
    add(new THREE.SphereGeometry(h * 0.075, 10, 8).translate(-eyeX, eyeY, faceZ), "#B98CFF");
    add(new THREE.SphereGeometry(h * 0.075, 10, 8).translate(eyeX, eyeY, faceZ), "#B98CFF");
    add(new THREE.SphereGeometry(h * 0.03, 8, 6).translate(-eyeX * 0.82, eyeY + h * 0.02, faceZ - h * 0.03), "#F4E6FF");
    add(new THREE.SphereGeometry(h * 0.03, 8, 6).translate(eyeX * 0.82, eyeY + h * 0.02, faceZ - h * 0.03), "#F4E6FF");
    for (let i = -1; i <= 1; i++) {
      const tooth = new THREE.ConeGeometry(h * 0.018, h * 0.11, 6);
      tooth.translate(i * eyeX * 0.42, eyeY - h * 0.2, faceZ - h * 0.02);
      add(tooth, "#FFF6E4");
    }
    const merged = mergeColored(bits);
    const tris = merged.index ? merged.index.count / 3 : 0;
    return { geo: merged, tris: tris };
  } catch (err) {
    warnOnce("mutant-duck", err && err.message);
    return null;
  }
}

function bakeAll(got) {
  const pack = { env: {}, guns: {}, city: [], warnings: [] };
  const tex = (t, rep) => {
    if (!t) return null;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rep) t.repeat.set(rep, rep);
    return t;
  };
  pack.env.concrete = tex(got.concrete, 2.5);
  pack.env.concreteNor = tex(got.concreteNor, 2.5);
  pack.env.concreteArm = tex(got.concreteArm, 2.5);
  pack.env.metal = tex(got.metal, 2);
  pack.env.metalNor = tex(got.metalNor, 2);
  pack.env.water = got.water || null;
  pack.env.hdr = got.hdr || null;
  if (pack.env.water) {
    pack.env.water.wrapS = pack.env.water.wrapT = THREE.RepeatWrapping;
  }
  pack.soldier = null;
  pack.bober = null;
  const clogOpt = (kind, height, squash) => ({
    height: height,
    fps: 8,
    squash: squash,
    clips: [
      { name: "Walk", frames: 16 },
      { name: "Punch", frames: 8 },
    ],
    recolor: paintClog,
    decorate: (api) => clogBits(api, kind),
  });
  pack.clog = safeBake(got.zombie, clogOpt("clog", 1.6, [0.82, 1.08, 0.76]), "clog");
  pack.suds = safeBake(got.zombie, clogOpt("suds", 2.0, [1.24, 0.88, 1.16]), "suds");
  if (pack.suds && pack.suds.mat) {
    pack.suds.mat.transparent = true;
    pack.suds.mat.depthWrite = true;
    pack.suds.mat.opacity = 1;
  }
  pack.spit = safeBake(got.zombie, clogOpt("spit", 1.8, [0.66, 1.2, 0.64]), "spit");
  pack.mutantDuck = mutantDuck(got.duck);
  pack.hauler = safeBake(got.yetiCrowd || got.yeti, {
    height: 2.6,
    fps: 8,
    clips: [
      { name: "Walk", frames: 16 },
      { name: "Punch", frames: 8 },
    ],
    recolor: paintClog,
    decorate: haulerBits,
  }, "hauler");
  pack.duck = got.duck ? propOf(got.duck, 0xffd23a, 1.0) : null;
  const gunIds = ["mini", "dambust", "burst", "saw", "rail", "beam", "storm", "flame", "glacier", "barrage", "cone", "aurora"];
  for (let i = 0; i < gunIds.length; i++) pack.guns[gunIds[i]] = chunkyGun(0x3a4048, 0.7, gunIds[i]);
  pack.wrench = got.wrench ? propOf(got.wrench, 0xb8b2a6, 3.0) : null;
  for (let i = 0; i < CITY.length; i++) {
    if (got["city" + i]) pack.city.push(got["city" + i]);
  }
  if (got.yeti) {
    try {
      pack.bossRig = mountRig(got.yeti);
      if (pack.bossRig) pack.bossRig.animations = got.yeti.animations || [];
    } catch (err) {
      warnOnce("boss", err && err.message);
    }
  }
  return pack;
}

export const CREDIT_LINES = [
  "Zombie, Yeti, Rocket Launcher — Quaternius, CC0, poly.pizza",
  "Rubber Duck — CreativeTrio, CC0, poly.pizza",
  "Wrench — Armory_3D, CC0, poly.pizza",
  "Blaster Kit, City Kit (Commercial) — Kenney, CC0, kenney.nl",
  "concrete_floor_02, metal_plate, shanghai_riverside — Poly Haven, CC0",
  "waternormals.jpg — three.js authors, MIT",
];
