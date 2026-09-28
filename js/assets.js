import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { bakeCrowd, staticMerge, mountRig, boxGeo } from "./vat.js?v=br5";

const V = "br5";
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

const MUD = new THREE.Color("#5A4128");
const MUD2 = new THREE.Color("#7B5A3A");
const MOSS = new THREE.Color("#4E6B2E");
const LEAF = new THREE.Color("#6E9440");
const FOAM = new THREE.Color("#F7FBFA");
const RUST = new THREE.Color("#8A4B32");

function paintClog(col, name, yNorm) {
  if (yNorm > 0.45) col.copy(yNorm > 0.7 ? MUD2 : MUD);
  else col.copy(MOSS);
}

function clogBits(api, kind) {
  const head = api.bone("Head");
  const torso = api.bone("Torso") || api.bone("Chest") || api.bone("Abdomen");
  if (!head) return;
  const p = new THREE.Vector3();
  head.getWorldPosition(p);
  const eye = new THREE.Color("#B04CFF");
  api.add("Head", boxGeo(0.2, 0.16, 0.12, p.x - 0.14, p.y + 0.22, p.z - 0.55), 0, eye, 1);
  api.add("Head", boxGeo(0.2, 0.16, 0.12, p.x + 0.14, p.y + 0.22, p.z - 0.55), 0, eye, 1);
  for (let i = 0; i < 5; i++) {
    api.add("Head", boxGeo(0.12, 0.28, 0.08, p.x + (i - 2) * 0.1, p.y + 0.62, p.z - 0.05), 0, LEAF, 0);
  }
  if (kind === "suds") {
    const s = torso || head;
    const q = new THREE.Vector3();
    s.getWorldPosition(q);
    api.add(s.name, boxGeo(0.55, 0.4, 0.4, q.x, q.y + 0.1, q.z), 2, FOAM, 0);
    api.add("Head", boxGeo(0.36, 0.28, 0.3, p.x, p.y, p.z), 2, FOAM, 0);
  }
  if (kind === "spit") {
    const q = new THREE.Vector3();
    (torso || head).getWorldPosition(q);
    api.add((torso || head).name, boxGeo(0.1, 0.1, 0.55, q.x + 0.18, q.y + 0.15, q.z - 0.15), 3, RUST, 0);
  }
}

function haulerBits(api) {
  const hand = api.bone("Wrist.R") || api.bone("LowerArm.R") || api.bone("Head");
  if (!hand) return;
  const p = new THREE.Vector3();
  hand.getWorldPosition(p);
  api.add(hand.name, boxGeo(0.7, 0.45, 0.35, p.x, p.y + 0.1, p.z - 0.25), 4, new THREE.Color("#E7EEF2"), 0);
}

function longbowGeo() {
  const positions = [];
  const indices = [];
  const segs = 8;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = (t - 0.5) * 0.9;
    const z = -Math.sin(t * Math.PI) * 0.16;
    const w = 0.035;
    const b = positions.length / 3;
    positions.push(-w, y, z, w, y, z, 0, y, z - w);
    if (i) {
      const p = b - 3;
      indices.push(p, b, p + 1, p + 1, b, b + 1, p, p + 2, b + 2, p + 2, b, b + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
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

function chunkyGun(color, len, shape) {
  const L = len || 0.55;
  const parts = [
    boxGeo(0.09, 0.11, L * 0.72, 0, 0.06, -L * 0.28),
    boxGeo(0.07, 0.07, L * 0.55, 0, 0.1, -L * 0.55),
    boxGeo(0.1, 0.12, 0.12, 0, -0.02, -0.04),
  ];
  if (shape === "bow") {
    parts.push(boxGeo(0.28, 0.04, 0.04, 0, 0.12, -L * 0.7));
    parts.push(boxGeo(0.04, 0.16, 0.04, -0.12, 0.12, -L * 0.7));
    parts.push(boxGeo(0.04, 0.16, 0.04, 0.12, 0.12, -L * 0.7));
  } else if (shape === "smg") {
    parts.push(boxGeo(0.16, 0.1, 0.14, 0, -0.02, 0.02));
    parts.push(boxGeo(0.05, 0.05, L * 0.9, 0, 0.12, -L * 0.2));
  } else if (shape === "shot") {
    parts.push(boxGeo(0.07, 0.07, L * 0.85, -0.06, 0.14, -L * 0.35));
    parts.push(boxGeo(0.07, 0.07, L * 0.85, 0.06, 0.14, -L * 0.35));
  } else if (shape === "gerald") {
    parts.push(boxGeo(0.035, 0.035, L, -0.07, 0.14, -L * 0.35));
    parts.push(boxGeo(0.035, 0.035, L, 0.07, 0.14, -L * 0.35));
    parts.push(boxGeo(0.035, 0.035, L * 0.8, 0, 0.2, -L * 0.3));
    parts.push(boxGeo(0.14, 0.04, 0.16, 0, 0.08, 0.08));
  } else if (shape === "log") {
    parts.push(boxGeo(0.2, 0.2, L, 0, 0.16, -L * 0.2));
  } else if (shape === "rocket") {
    parts.push(boxGeo(0.08, 0.08, L * 1.1, 0, 0.16, -L * 0.45));
    parts.push(boxGeo(0.14, 0.04, 0.16, 0, 0.16, -L * 0.9));
    parts.push(boxGeo(0.04, 0.14, 0.16, 0, 0.16, -L * 0.9));
  } else if (shape === "hat") {
    parts.push(boxGeo(0.22, 0.06, 0.22, 0, 0.18, -L * 0.2));
    parts.push(boxGeo(0.1, 0.14, 0.1, 0, 0.28, -L * 0.2));
  } else if (shape === "tank") {
    parts.push(boxGeo(0.18, 0.14, 0.22, -0.02, -0.02, 0.04));
    parts.push(boxGeo(0.04, 0.04, L * 0.9, 0.08, 0.12, -L * 0.35));
  } else if (shape === "sap") {
    parts.push(boxGeo(0.16, 0.2, 0.16, 0, 0.02, 0.06));
    parts.push(boxGeo(0.05, 0.05, L * 0.55, 0, 0.16, -L * 0.35));
  } else if (shape === "beam") {
    parts.push(boxGeo(0.04, 0.04, L * 1.3, 0, 0.12, -L * 0.4));
    parts.push(boxGeo(0.12, 0.12, 0.08, 0, 0.12, -L * 1.05));
  } else if (shape === "storm") {
    parts.push(boxGeo(0.05, 0.22, 0.05, -0.08, 0.2, -L * 0.45));
    parts.push(boxGeo(0.05, 0.22, 0.05, 0.08, 0.2, -L * 0.45));
    parts.push(boxGeo(0.18, 0.04, 0.06, 0, 0.3, -L * 0.45));
  } else if (shape === "frost") {
    parts.push(boxGeo(0.16, 0.16, 0.16, 0, 0.14, -L * 0.15));
    parts.push(boxGeo(0.06, 0.06, 0.2, 0, 0.14, -L * 0.55));
  } else if (shape === "rail") {
    parts.push(boxGeo(0.06, 0.06, L * 1.35, 0, 0.14, -L * 0.45));
    parts.push(boxGeo(0.16, 0.08, 0.22, 0, 0.04, 0.02));
  } else if (shape === "tube") {
    parts.push(boxGeo(0.12, 0.12, L * 0.8, 0, 0.14, -L * 0.45));
  } else {
    parts.push(boxGeo(0.08, 0.14, 0.1, 0, -0.01, -L * 0.35));
  }
  const geo = parts[0];
  const pos = [geo.getAttribute("position")];
  let count = pos[0].count;
  for (let i = 1; i < parts.length; i++) {
    pos.push(parts[i].getAttribute("position"));
    count += pos[i].count;
  }
  const arr = new Float32Array(count * 3);
  let o = 0;
  for (let i = 0; i < pos.length; i++) {
    arr.set(pos[i].array, o);
    o += pos[i].array.length;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  merged.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.28 });
  return { geo: merged, mat, tris: Math.floor(count / 3) };
}

function gunOf(gltf, color, len, shape) {
  if (!gltf) return chunkyGun(color, len, shape);
  try {
    const geo = staticMerge(gltf.scene, len || 0.55);
    const tris = geo && geo.index ? Math.floor(geo.index.count / 3) : 0;
    if (!geo || tris > 180) return chunkyGun(color, len, shape);
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
  const clogOpt = (kind, height) => ({
    height,
    fps: 10,
    clips: [
      { name: "Run_Arms", frames: 16 },
      { name: "Walk", frames: 16 },
      { name: "Punch", frames: 8 },
    ],
    recolor: paintClog,
    decorate: (api) => clogBits(api, kind),
  });
  pack.clog = safeBake(got.zombie, clogOpt("clog", 1.6), "clog");
  pack.suds = safeBake(got.zombie, clogOpt("suds", 2.0), "suds");
  pack.spit = safeBake(got.zombie, clogOpt("spit", 1.8), "spit");
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
  pack.guns.bow = gunOf(got.crossbow, 0xc9a36a, 0.55, "bow");
  pack.guns.long = { geo: longbowGeo(), mat: new THREE.MeshStandardMaterial({ color: 0x7d9a45, roughness: 0.65 }), tris: 32 };
  pack.guns.smg = chunkyGun(0xf5c400, 0.42, "smg");
  pack.guns.shot = chunkyGun(0xe86a1a, 0.62, "shot");
  pack.guns.gerald = chunkyGun(0x3ddc6a, 0.7, "gerald");
  pack.guns.log = chunkyGun(0x8b5a2b, 0.72, "log");
  pack.guns.rocket = chunkyGun(0xff2e63, 0.78, "rocket");
  pack.guns.party = chunkyGun(0xc86bff, 0.5, "hat");
  pack.guns.flame = chunkyGun(0xff6a1a, 0.58, "tank");
  pack.guns.sap = chunkyGun(0xe0a030, 0.48, "sap");
  pack.guns.beam = chunkyGun(0xff2430, 0.85, "beam");
  pack.guns.storm = chunkyGun(0x3a6bff, 0.55, "storm");
  pack.guns.frost = chunkyGun(0x7debff, 0.5, "frost");
  pack.guns.rail = chunkyGun(0xfff6d8, 1.05, "rail");
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
  "Rubber Duck, Crossbow — CreativeTrio, CC0, poly.pizza",
  "Wrench — Armory_3D, CC0, poly.pizza",
  "Blaster Kit, City Kit (Commercial) — Kenney, CC0, kenney.nl",
  "concrete_floor_02, metal_plate, shanghai_riverside — Poly Haven, CC0",
  "waternormals.jpg — three.js authors, MIT",
];
