import * as THREE from "three";

const FUR = "#7A4A2A";
const FUR_D = "#5C381F";
const FUR_L = "#C89A6A";
const HAT = "#F2C230";
const CREAM = "#C89A6A";
const INK = "#1E1410";
const TOOTH = "#FFF6E4";
const NOSE = "#3A241C";
const BLUSH = "#E8A090";
const PURPLE = "#D7B4FF";
const MUD = "#6A4A32";
const MUD_D = "#3E2E22";
const SHELL = "#3E4A32";
const CAPE = "#5A3E86";
const WOOD = "#A56B3C";
const WOOD_D = "#7A4E2C";
const STEEL = "#9AA3AE";

export function trisOf(geo) {
  if (!geo) return 0;
  if (geo.index) return geo.index.count / 3;
  const pos = geo.getAttribute("position");
  return pos ? pos.count / 3 : 0;
}

function paint(geo, color, part, pivot) {
  const n = geo.getAttribute("position").count;
  const col = new Float32Array(n * 3);
  const c = new THREE.Color(color);
  const pr = new Float32Array(n);
  const pv = new Float32Array(n * 3);
  const px = pivot ? pivot.x : 0;
  const py = pivot ? pivot.y : 0;
  const pz = pivot ? pivot.z : 0;
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
    pr[i] = part;
    pv[i * 3] = px;
    pv[i * 3 + 1] = py;
    pv[i * 3 + 2] = pz;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aPart", new THREE.BufferAttribute(pr, 1));
  geo.setAttribute("aPivot", new THREE.BufferAttribute(pv, 3));
  return geo;
}

export function mergeParts(list) {
  let vCount = 0;
  let iCount = 0;
  for (let p = 0; p < list.length; p++) {
    vCount += list[p].getAttribute("position").count;
    iCount += list[p].index.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const col = new Float32Array(vCount * 3);
  const part = new Float32Array(vCount);
  const piv = new Float32Array(vCount * 3);
  const idx = new Uint32Array(iCount);
  let v = 0;
  let k = 0;
  for (let p = 0; p < list.length; p++) {
    const g = list[p];
    const gp = g.getAttribute("position");
    const gn = g.getAttribute("normal");
    const gc = g.getAttribute("color");
    const ga = g.getAttribute("aPart");
    const gv = g.getAttribute("aPivot");
    const gi = g.index;
    const base = v;
    for (let i = 0; i < gp.count; i++) {
      const i3 = (v + i) * 3;
      pos[i3] = gp.getX(i);
      pos[i3 + 1] = gp.getY(i);
      pos[i3 + 2] = gp.getZ(i);
      nrm[i3] = gn.getX(i);
      nrm[i3 + 1] = gn.getY(i);
      nrm[i3 + 2] = gn.getZ(i);
      col[i3] = gc.getX(i);
      col[i3 + 1] = gc.getY(i);
      col[i3 + 2] = gc.getZ(i);
      part[v + i] = ga.getX(i);
      piv[i3] = gv.getX(i);
      piv[i3 + 1] = gv.getY(i);
      piv[i3 + 2] = gv.getZ(i);
    }
    for (let i = 0; i < gi.count; i++) idx[k++] = gi.getX(i) + base;
    v += gp.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aPart", new THREE.BufferAttribute(part, 1));
  geo.setAttribute("aPivot", new THREE.BufferAttribute(piv, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

function place(src, color, part, pivot, x, y, z, sx, sy, sz, yaw, rx) {
  const g = src.clone();
  const ux = sx == null ? 1 : sx;
  const uy = sy == null ? 1 : sy;
  const uz = sz == null ? 1 : sz;
  if (ux !== 1 || uy !== 1 || uz !== 1) {
    g.scale(ux, uy, uz);
    g.computeVertexNormals();
  }
  if (rx) g.rotateX(rx);
  if (yaw) g.rotateY(yaw);
  g.translate(x, y, z);
  paint(g, color, part, pivot || { x: x, y: y, z: z });
  return g;
}

// Local offset, then yaw around the origin, then move onto the head. Face features orbit.
function orbit(src, color, part, head, lx, ly, lz, yaw, sx, sy, sz) {
  const g = src.clone();
  const ux = sx == null ? 1 : sx;
  const uy = sy == null ? 1 : sy;
  const uz = sz == null ? 1 : sz;
  if (ux !== 1 || uy !== 1 || uz !== 1) {
    g.scale(ux, uy, uz);
    g.computeVertexNormals();
  }
  g.translate(lx, ly, lz);
  if (yaw) g.rotateY(yaw);
  g.translate(head.x, head.y, head.z);
  paint(g, color, part, { x: head.x, y: head.y, z: head.z });
  return g;
}

function sph(r, w, h) {
  return new THREE.SphereGeometry(r, w, h);
}
function cyl(rt, rb, h, n) {
  return new THREE.CylinderGeometry(rt, rb, h, n);
}
function cone(r, h, n) {
  return new THREE.ConeGeometry(r, h, n);
}
function box(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

function guardParts(s, gold) {
  const hat = gold ? "#F5C400" : "#2E7BFF";
  const suit = gold ? "#FFF4CC" : "#F5F8FC";
  const fur = "#E0A15C";
  const furD = "#C4843E";
  const eyeW = sph(0.055, 6, 4);
  const pupil = sph(0.026, 5, 4);
  const put = (src, color, part, pivot, x, y, z, sx, sy, sz, yaw, rx) =>
    place(
      src,
      color,
      part,
      pivot ? { x: pivot.x * s, y: pivot.y * s, z: pivot.z * s } : null,
      x * s,
      y * s,
      z * s,
      (sx == null ? 1 : sx) * s,
      (sy == null ? 1 : sy) * s,
      (sz == null ? 1 : sz) * s,
      yaw,
      rx
    );
  const parts = [
    put(sph(0.09, 6, 4), furD, 0, null, -0.07, 0.1, 0.02, 1, 0.62, 1.2),
    put(sph(0.09, 6, 4), furD, 0, null, 0.07, 0.1, 0.02, 1, 0.62, 1.2),
    put(sph(0.16, 6, 5), suit, 0, null, 0, 0.32, 0, 1.05, 0.82, 0.78),
    put(sph(0.2, 8, 6), fur, 0, null, 0, 0.6, -0.02),
    put(sph(0.175, 6, 5), hat, 0, null, 0, 0.72, 0.0, 1.08, 0.62, 1.08),
    put(sph(0.075, 6, 4), "#F8D7B0", 0, null, 0, 0.52, -0.14, 1.15, 0.7, 0.85),
    put(box(0.032, 0.07, 0.028), TOOTH, 0, null, -0.028, 0.45, -0.2),
    put(box(0.032, 0.07, 0.028), TOOTH, 0, null, 0.028, 0.45, -0.2),
    put(eyeW, "#FFFFFF", 0, null, -0.075, 0.62, -0.15),
    put(eyeW, "#FFFFFF", 0, null, 0.075, 0.62, -0.15),
    put(pupil, "#1A1C22", 0, null, -0.078, 0.615, -0.19),
    put(pupil, "#1A1C22", 0, null, 0.078, 0.615, -0.19),
    put(sph(0.04, 5, 4), furD, 0, null, -0.15, 0.84, 0.02, 0.65, 1.15, 0.65),
    put(sph(0.04, 5, 4), furD, 0, null, 0.15, 0.84, 0.02, 0.65, 1.15, 0.65),
    put(box(0.2, 0.03, 0.14), furD, 5, { x: 0, y: 0.26, z: 0.06 }, 0, 0.26, 0.18),
    put(cyl(0.03, 0.03, 0.26, 6), "#3E4654", 0, null, 0.04, 0.38, -0.22, 1, 1, 1, 0, -Math.PI / 2),
  ];
  if (gold) parts.push(put(box(0.14, 0.035, 0.1), "#E23B4A", 0, null, 0, 0.46, 0.02));
  return parts;
}

export function buildSoldier() {
  const geo = mergeParts(guardParts(1, false));
  return { geo, tris: trisOf(geo) };
}

export function buildBober() {
  const geo = mergeParts(guardParts(1, true));
  return { geo, tris: trisOf(geo) };
}

const CLOG = "#5E6B4A";
const CLOG_D = "#465236";
const LEAF = "#7FA64A";
const EYE = "#B98CFF";
const FOAM = "#F7FBFA";
const TUBC = "#E4EEF2";
const GOLD = "#F5C400";

function done(parts, crown) {
  const geo = mergeParts(parts);
  const out = { geo, tris: trisOf(geo) };
  if (crown) out.crownLocal = crown;
  return out;
}

function organ(r, w, h, lump) {
  const g = new THREE.SphereGeometry(r, w, h);
  const p = g.attributes.position;
  const L = lump == null ? 0.1 : lump;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const n = Math.hypot(x, y, z) || 1;
    const nx = x / n;
    const ny = y / n;
    const nz = z / n;
    const f = Math.sin(nx * 3.1 + 0.6) * Math.cos(ny * 2.6 + nz * 3.4) * L
      + Math.sin(nx * 7.2 + nz * 6.1 + 1.1) * Math.cos(ny * 5.4) * L * 0.38
      + Math.sin((nx * 2.2 - nz) * 5.5 + ny * 4.0) * L * 0.22;
    const s = 1 + f;
    p.setXYZ(i, nx * n * s, ny * n * s, nz * n * s);
  }
  g.computeVertexNormals();
  return g;
}

function limb(r, len) {
  return new THREE.CapsuleGeometry(r, Math.max(0.05, len), 5, 12);
}

function curveFang() {
  const g = new THREE.ConeGeometry(0.018, 0.09, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const u = (y + 0.045) / 0.09;
    p.setZ(i, p.getZ(i) - u * u * 0.06);
  }
  g.computeVertexNormals();
  return g;
}

function wear(g, aHex, bHex) {
  const pos = g.attributes.position;
  const col = g.attributes.color;
  const a = new THREE.Color(aHex);
  const b = new THREE.Color(bHex);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = Math.sin(x * 21.7 + y * 13.3 + z * 29.1) * 43758.5453;
    const f = n - Math.floor(n);
    const moss = y > 0.95 ? Math.min(0.45, (y - 0.95) * 0.9) * (0.35 + f * 0.4) : 0;
    col.setXYZ(
      i,
      a.r + (b.r - a.r) * f + moss * 0.15,
      a.g + (b.g - a.g) * f + moss * 0.28,
      a.b + (b.b - a.b) * f
    );
  }
  return g;
}

function mud(src, color, color2, part, pivot, x, y, z, sx, sy, sz, yaw, rx) {
  return wear(place(src, color, part, pivot, x, y, z, sx, sy, sz, yaw, rx), color, color2 || color);
}

export function buildClogling() {
  const leg = limb(0.05, 0.18);
  const body = organ(0.2, 20, 16, 0.14);
  const head = organ(0.13, 16, 12, 0.1);
  const snout = organ(0.055, 12, 10, 0.06);
  const arm = limb(0.036, 0.26);
  const hand = organ(0.045, 10, 8, 0.08);
  const eye = sph(0.03, 10, 8);
  const moss = organ(0.07, 12, 8, 0.22);
  const parts = [
    mud(leg, CLOG_D, "#2E2418", 0, null, -0.08, 0.22, 0.02, 1, 1.05, 1),
    mud(leg, CLOG_D, "#2E2418", 0, null, 0.08, 0.22, 0.01, 1, 1.05, 1),
    mud(organ(0.06, 10, 8, 0.08), CLOG_D, "#3A2A1C", 0, null, 0, 0.16, 0.04, 1.4, 0.45, 1.1),
    mud(body, CLOG, "#8A6844", 0, null, 0.02, 0.62, 0.02, 0.62, 1.15, 0.5),
    mud(head, CLOG, "#6D5136", 0, null, 0.01, 1.05, -0.08, 0.82, 0.95, 0.72),
    mud(snout, CLOG_D, "#3E2C1C", 0, null, 0.01, 0.96, -0.2, 0.75, 0.5, 0.9),
    place(eye, EYE, 0, null, -0.05, 1.1, -0.16),
    place(eye, EYE, 0, null, 0.055, 1.1, -0.16),
    place(sph(0.012, 8, 6), "#F4E6FF", 0, null, -0.044, 1.118, -0.186),
    place(sph(0.012, 8, 6), "#F4E6FF", 0, null, 0.062, 1.118, -0.186),
    mud(arm, CLOG_D, "#3E2C1C", 0, null, -0.16, 0.72, -0.16, 1, 1, 1, 0.35, -1.05),
    mud(arm, CLOG_D, "#3E2C1C", 0, null, 0.16, 0.7, -0.18, 1, 1, 1, -0.28, -1.1),
    mud(hand, CLOG, "#6D5136", 0, null, -0.22, 0.52, -0.42),
    mud(hand, CLOG, "#6D5136", 0, null, 0.22, 0.5, -0.44),
  ];
  for (let i = 0; i < 7; i++) {
    const ang = -1.2 + (i / 6) * 2.4;
    parts.push(place(
      moss,
      i % 2 ? LEAF : "#5C8A38",
      0, null,
      Math.sin(ang) * 0.1,
      1.22,
      -0.02 + (i % 3) * 0.015,
      0.55,
      0.22,
      1.15,
      ang * 0.25,
      0.55 + (i % 2) * 0.3
    ));
  }
  return done(parts);
}

export function buildSuds() {
  const leg = limb(0.08, 0.12);
  const body = organ(0.24, 20, 16, 0.08);
  const foam = organ(0.16, 14, 12, 0.16);
  const helm = organ(0.16, 16, 12, 0.07);
  const eye = sph(0.032, 10, 8);
  const shield = organ(0.2, 14, 12, 0.05);
  const arm = limb(0.045, 0.16);
  return done([
    mud(leg, CLOG_D, "#2A2016", 0, null, -0.16, 0.2, 0.04, 1.2, 0.9, 1.1),
    mud(leg, CLOG_D, "#2A2016", 0, null, 0.16, 0.2, 0.03, 1.2, 0.9, 1.1),
    mud(body, CLOG, "#6D5136", 0, null, 0, 0.62, 0.02, 1.35, 1.05, 1.15),
    place(foam, FOAM, 0, null, 0, 0.72, -0.06, 1.15, 0.85, 0.95),
    place(foam, "#E7F3F6", 0, null, 0.02, 0.98, 0.02, 0.95, 0.7, 0.85),
    place(organ(0.11, 12, 10, 0.18), "#F4FBFD", 0, null, -0.28, 0.78, 0.02, 0.95, 0.8, 0.7),
    place(organ(0.1, 12, 10, 0.18), "#F4FBFD", 0, null, 0.28, 0.74, 0.04, 0.9, 0.75, 0.65),
    place(organ(0.08, 10, 8, 0.14), FOAM, 0, null, -0.18, 0.48, -0.08, 0.8, 0.55, 0.6),
    place(organ(0.07, 10, 8, 0.14), "#E7F3F6", 0, null, 0.2, 0.46, 0.06, 0.75, 0.5, 0.55),
    place(helm, FOAM, 0, null, 0, 1.28, -0.02, 1.05, 0.78, 1.02),
    place(organ(0.1, 12, 8, 0.06), "#D5E4EA", 0, null, 0, 1.08, -0.08, 1.15, 0.42, 0.95),
    place(eye, EYE, 0, null, -0.065, 1.28, -0.16),
    place(eye, EYE, 0, null, 0.07, 1.28, -0.16),
    place(sph(0.012, 8, 6), "#F4E6FF", 0, null, -0.055, 1.3, -0.188),
    place(sph(0.012, 8, 6), "#F4E6FF", 0, null, 0.08, 1.3, -0.188),
    place(shield, FOAM, 0, null, -0.5, 0.74, -0.22, 1.15, 1.25, 0.28),
    place(organ(0.06, 10, 8, 0.04), "#C5D5DC", 0, null, -0.5, 0.74, -0.32, 0.55, 0.55, 0.4),
    mud(arm, CLOG_D, "#3E2C1C", 0, null, -0.34, 0.7, -0.08, 1, 1, 1, 0.4, -0.7),
    mud(arm, CLOG_D, "#3E2C1C", 0, null, 0.32, 0.66, 0.02, 1, 1, 1, -0.2, -0.4),
  ]);
}

export function buildHauler() {
  const body = box(0.7, 0.7, 0.55);
  const head = box(0.4, 0.34, 0.36);
  const eye = box(0.08, 0.07, 0.04);
  const arm = box(0.14, 0.16, 0.4);
  const tub = box(1.15, 0.55, 0.7);
  const rim = box(1.25, 0.08, 0.78);
  return done([
    place(body, CLOG, 0, null, 0, 0.7, 0.15),
    place(head, CLOG, 0, null, 0, 1.18, -0.05),
    place(eye, EYE, 0, null, -0.1, 1.24, -0.24),
    place(eye, EYE, 0, null, 0.1, 1.24, -0.24),
    place(arm, CLOG_D, 0, null, -0.42, 0.78, -0.35),
    place(arm, CLOG_D, 0, null, 0.42, 0.78, -0.35),
    place(tub, TUBC, 0, null, 0, 0.72, -0.7),
    place(rim, "#C5D5DC", 0, null, 0, 1.02, -0.7),
    place(box(0.16, 0.22, 0.16), "#C5D5DC", 0, null, -0.48, 0.42, -0.95),
    place(box(0.16, 0.22, 0.16), "#C5D5DC", 0, null, 0.48, 0.42, -0.95),
  ]);
}

function furBall() {
  const g = new THREE.SphereGeometry(0.42, 36, 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const n = Math.hypot(x, y, z) || 1;
    const nx = x / n;
    const ny = y / n;
    const nz = z / n;
    const face = nz < -0.25 ? 0.35 : 1;
    const clump = Math.sin(nx * 5.4 + 0.7) * Math.cos(ny * 4.6 + nz * 5.1);
    const ridge = Math.abs(Math.sin(nx * 11.5 + nz * 9.2 + ny * 3.3));
    const s = 1 + face * (clump * 0.16 + ridge * 0.1) + (nz < -0.45 ? 0.08 : 0);
    p.setXYZ(i, nx * 0.42 * s, ny * 0.42 * s * 0.9 + 0.02, nz * 0.42 * s);
  }
  g.computeVertexNormals();
  return g;
}

export function buildHairball() {
  const fang = curveFang();
  const eye = sph(0.045, 12, 10);
  const parts = [
    mud(furBall(), "#4A3828", "#8A6844", 0, null, 0, 0.42, 0),
    place(sph(0.08, 10, 8), "#2A1814", 0, null, 0, 0.36, -0.46),
  ];
  parts.push(place(eye, EYE, 0, null, -0.11, 0.52, -0.56));
  parts.push(place(eye, EYE, 0, null, 0.12, 0.51, -0.56));
  parts.push(place(sph(0.016, 8, 6), "#F4E6FF", 0, null, -0.09, 0.545, -0.6));
  parts.push(place(sph(0.016, 8, 6), "#F4E6FF", 0, null, 0.14, 0.535, -0.6));
  for (let i = 0; i < 5; i++) {
    const u = i / 4 - 0.5;
    const ang = u * 1.15;
    parts.push(place(
      fang,
      "#FFF6E4",
      0, null,
      Math.sin(ang) * 0.1,
      0.32 - Math.abs(u) * 0.03,
      -0.64,
      1.1,
      1.35 + (i % 2) * 0.4,
      1,
      ang,
      -0.85
    ));
  }
  return done(parts);
}

export function buildSpitter() {
  const leg = limb(0.032, 0.28);
  const body = organ(0.11, 16, 14, 0.12);
  const head = organ(0.08, 14, 12, 0.08);
  const sac = organ(0.16, 18, 14, 0.16);
  const eye = sph(0.028, 10, 8);
  const spout = limb(0.028, 0.32);
  return done([
    mud(leg, CLOG_D, "#2A2016", 0, null, -0.05, 0.24, 0.02),
    mud(leg, CLOG_D, "#2A2016", 0, null, 0.05, 0.24, 0.02),
    mud(body, CLOG, "#8A6844", 0, null, 0.02, 0.86, 0, 0.55, 1.85, 0.46),
    mud(head, CLOG, "#6D5136", 0, null, 0.01, 1.42, -0.04, 0.7, 0.85, 0.62),
    place(eye, EYE, 0, null, -0.038, 1.48, -0.1),
    place(eye, EYE, 0, null, 0.04, 1.48, -0.1),
    place(sph(0.01, 8, 6), "#F4E6FF", 0, null, -0.032, 1.495, -0.124),
    place(sph(0.01, 8, 6), "#F4E6FF", 0, null, 0.046, 1.495, -0.124),
    place(sac, "#C6A04A", 0, null, -0.2, 0.78, 0.08, 1.05, 1.35, 0.95),
    place(organ(0.07, 12, 10, 0.14), "#E0C060", 0, null, -0.26, 1.12, 0.1, 0.9, 0.85, 0.8),
    place(organ(0.045, 10, 8, 0.1), "#A87828", 0, null, -0.1, 0.48, 0.1),
    mud(spout, "#8A5A3A", "#5C3828", 0, null, 0.02, 1.12, -0.34, 1, 1, 1, 0.08, -1.2),
    place(organ(0.04, 10, 8, 0.08), "#6E442C", 0, null, 0.04, 1.02, -0.58, 1.1, 0.65, 1.15),
  ]);
}

export function buildLeaf() {
  const body = organ(0.08, 16, 12, 0.18);
  const wing = organ(0.07, 12, 8, 0.22);
  const eye = sph(0.016, 8, 6);
  const parts = [];
  const greens = ["#B6E25A", "#7CB342", "#E4F58A", "#5C9A38", "#C6EE6A", "#9AD44A", "#6AAA40"];
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + 0.4;
    const rad = 0.12 + (i % 3) * 0.05;
    const cx = Math.cos(ang) * rad;
    const cy = 0.16 + ((i % 4) - 1.5) * 0.07;
    const cz = Math.sin(ang) * rad * 0.62;
    const pivot = { x: cx, y: cy, z: cz };
    const col = greens[i];
    const face = ang + Math.PI;
    parts.push(place(body, col, 0, pivot, cx, cy, cz, 0.62, 0.48, 1.28, face * 0.15, 0.45));
    parts.push(place(wing, "#E8F6A0", 6, pivot, cx - 0.035, cy + 0.01, cz, 0.7, 0.22, 0.85, 0.9, 0.35));
    parts.push(place(wing, col, 6, pivot, cx + 0.035, cy + 0.01, cz, 0.7, 0.22, 0.85, -0.9, -0.3));
    parts.push(place(eye, EYE, 0, pivot, cx - 0.02, cy + 0.03, cz - 0.07));
    parts.push(place(eye, EYE, 0, pivot, cx + 0.02, cy + 0.03, cz - 0.07));
  }
  return done(parts);
}

export function buildDuck() {
  const body = organ(0.26, 20, 16, 0.05);
  const head = organ(0.15, 16, 12, 0.04);
  const beak = organ(0.05, 12, 8, 0.04);
  const wing = organ(0.06, 12, 8, 0.1);
  const foot = organ(0.05, 10, 8, 0.06);
  const eye = sph(0.032, 10, 8);
  const tooth = curveFang();
  const wart = organ(0.03, 5, 4, 0.15);
  const pivot = { x: 0, y: 0.4, z: 0.02 };
  return done([
    place(body, "#FFE14A", 0, null, 0, 0.38, 0, 1.32, 0.92, 1.18),
    place(organ(0.1, 6, 5, 0.05), "#FFF6C2", 0, null, 0, 0.42, -0.12, 0.85, 0.48, 0.55),
    place(head, "#FFD23A", 0, null, 0, 0.72, -0.14, 1.05, 0.92, 1.08),
    place(organ(0.06, 6, 5, 0.1), "#E23B3B", 0, null, 0, 1.02, -0.08, 0.7, 1.35, 0.55),
    place(organ(0.035, 5, 4, 0.1), "#C4232A", 0, null, -0.08, 0.96, -0.06, 0.7, 1.2, 0.55),
    place(organ(0.035, 5, 4, 0.1), "#C4232A", 0, null, 0.08, 0.96, -0.06, 0.7, 1.2, 0.55),
    place(beak, "#F07A18", 0, null, 0, 0.74, -0.38, 1.45, 0.42, 1.35),
    place(organ(0.035, 5, 4, 0.05), "#C45A10", 0, null, 0, 0.52, -0.36, 1.2, 0.32, 1.1),
    place(tooth, "#FFF6E4", 0, null, -0.045, 0.58, -0.48, 0.9, 1.1, 1, 0.35, -0.5),
    place(tooth, "#FFF6E4", 0, null, 0, 0.54, -0.52, 1, 1.25, 1, 0, -0.6),
    place(tooth, "#FFF6E4", 0, null, 0.045, 0.58, -0.48, 0.9, 1.1, 1, -0.35, -0.5),
    place(eye, EYE, 0, null, -0.07, 0.78, -0.26),
    place(eye, EYE, 0, null, 0.075, 0.78, -0.26),
    place(sph(0.012, 4, 3), "#F4E6FF", 0, null, -0.06, 0.8, -0.285),
    place(sph(0.012, 4, 3), "#F4E6FF", 0, null, 0.086, 0.8, -0.285),
    place(wing, "#F0C030", 6, pivot, -0.36, 0.42, -0.02, 0.55, 1.35, 0.7, 0.7),
    place(wing, "#E8A020", 6, pivot, 0.36, 0.42, -0.02, 0.55, 1.35, 0.7, -0.7),
    place(organ(0.05, 5, 4, 0.08), "#E8A020", 5, pivot, 0, 0.36, 0.28, 0.7, 0.4, 1.1),
    place(wart, "#F6C21A", 0, null, 0.18, 0.48, 0.04, 0.9, 0.6, 0.7),
    place(wart, "#E0A010", 0, null, -0.16, 0.32, 0.06, 0.75, 0.5, 0.65),
    place(foot, "#E86A1A", 0, null, -0.1, 0.04, -0.02, 1.3, 0.35, 1.6),
    place(foot, "#E86A1A", 0, null, 0.1, 0.04, -0.02, 1.3, 0.35, 1.6),
  ]);
}

export function buildBaron() {
  const headY = 2.35;
  const body = sph(0.85, 10, 8);
  const head = sph(0.48, 10, 8);
  const ear = sph(0.12, 5, 4);
  const eye = sph(0.07, 5, 3);
  const nose = sph(0.08, 4, 3);
  const arm = cyl(0.14, 0.12, 0.55, 6);
  const leg = cyl(0.16, 0.14, 0.42, 6);
  const tub = box(1.7, 0.55, 2.3);
  const rim = box(1.82, 0.1, 2.42);
  const foot = sph(0.14, 5, 3);
  const band = cyl(0.34, 0.34, 0.08, 8);
  const lure = cone(0.05, 0.28, 4);
  const cap = cyl(0.08, 0.08, 0.04, 6);
  const tie = box(0.06, 0.16, 0.04);
  const cover = cyl(0.16, 0.16, 0.04, 8);
  const hole = cyl(0.05, 0.05, 0.05, 6);
  return done([
    place(tub, TUBC, 0, null, 0, 0.55, 0.05),
    place(rim, "#D5E2E8", 0, null, 0, 0.86, 0.05),
    place(foot, "#C5D0D4", 0, null, -0.7, 0.16, -0.85),
    place(foot, "#C5D0D4", 0, null, 0.7, 0.16, -0.85),
    place(foot, "#C5D0D4", 0, null, -0.7, 0.16, 0.9),
    place(foot, "#C5D0D4", 0, null, 0.7, 0.16, 0.9),
    place(body, CLOG, 0, null, 0, 1.45, -0.05, 1.2, 1, 1.05),
    place(head, CLOG, 0, null, 0, headY, -0.15, 1.05, 0.95, 1),
    place(ear, LEAF, 0, null, -0.32, headY + 0.28, -0.05, 1, 1.3, 0.55),
    place(ear, LEAF, 0, null, 0.32, headY + 0.28, -0.05, 1, 1.3, 0.55),
    place(eye, EYE, 0, null, -0.16, headY + 0.05, -0.52),
    place(eye, EYE, 0, null, 0.14, headY + 0.04, -0.5),
    place(nose, "#3A241C", 0, null, 0, headY - 0.08, -0.62),
    place(cover, "#8A9298", 0, null, 0.2, headY + 0.04, -0.58, 1, 0.35, 1),
    place(hole, "#2A3138", 0, null, 0.2, headY + 0.04, -0.62, 1, 0.4, 1),
    place(arm, CLOG_D, 3, { x: -0.7, y: 1.5, z: 0 }, -0.85, 1.25, -0.1),
    place(arm, CLOG_D, 4, { x: 0.7, y: 1.5, z: 0 }, 0.85, 1.25, -0.1),
    place(leg, CLOG_D, 1, { x: -0.28, y: 0.55, z: 0.15 }, -0.32, 0.32, 0.35),
    place(leg, CLOG_D, 2, { x: 0.28, y: 0.55, z: 0.15 }, 0.32, 0.32, 0.35),
    place(band, GOLD, 0, null, 0, headY + 0.48, -0.12),
    place(lure, "#E86A1A", 0, null, 0, headY + 0.72, -0.12),
    place(lure, "#4FC3FF", 0, null, -0.22, headY + 0.62, -0.02),
    place(cap, "#C23B4A", 0, null, 0.2, headY + 0.52, 0.02),
    place(tie, "#F4E6C3", 0, null, -0.16, headY + 0.42, -0.28),
    place(tie, LEAF, 0, null, 0.12, headY + 0.4, -0.22),
  ], new THREE.Vector3(0.2, headY + 0.04, -0.62));
}

export function buildBigTub() {
  const body = sph(0.72, 10, 8);
  const head = sph(0.38, 8, 6);
  const eye = sph(0.07, 5, 3);
  const arm = cyl(0.14, 0.12, 0.5, 6);
  const leg = cyl(0.16, 0.14, 0.4, 5);
  const tub = box(1.35, 0.7, 1.7);
  const rim = box(1.46, 0.1, 1.82);
  const foot = sph(0.12, 5, 3);
  const duck = sph(0.16, 6, 4);
  const beak = cone(0.05, 0.12, 4);
  return done([
    place(body, CLOG, 0, null, 0, 1.15, 0.1, 1.2, 1.05, 1),
    place(head, CLOG, 0, null, 0, 1.9, -0.15),
    place(eye, EYE, 0, null, -0.12, 1.98, -0.42),
    place(eye, EYE, 0, null, 0.12, 1.98, -0.42),
    place(arm, CLOG_D, 3, { x: -0.7, y: 1.3, z: -0.2 }, -0.85, 1.15, -0.35),
    place(arm, CLOG_D, 4, { x: 0.7, y: 1.3, z: -0.2 }, 0.85, 1.15, -0.35),
    place(leg, CLOG_D, 1, { x: -0.28, y: 0.45, z: 0.15 }, -0.3, 0.28, 0.2),
    place(leg, CLOG_D, 2, { x: 0.28, y: 0.45, z: 0.15 }, 0.3, 0.28, 0.2),
    place(tub, TUBC, 0, null, 0, 0.95, -1.05, 1.15, 1, 1.1),
    place(rim, "#D5E2E8", 0, null, 0, 1.32, -1.05),
    place(foot, "#C5D0D4", 0, null, -0.55, 0.55, -1.7),
    place(foot, "#C5D0D4", 0, null, 0.55, 0.55, -1.7),
    place(duck, GOLD, 0, null, 0, 2.32, -0.12, 1.1, 0.85, 1.15),
    place(beak, "#E86A1A", 0, null, 0, 2.3, -0.28, 1, 0.7, 1),
  ], new THREE.Vector3(0, 2.32, -0.2));
}

export function buildGrunk() {
  const headY = 2.55;
  const body = sph(0.9, 10, 8);
  const head = sph(0.46, 10, 7);
  const eye = sph(0.07, 5, 3);
  const bib = box(0.85, 1.15, 0.2);
  const strap = box(0.12, 0.9, 0.08);
  const arm = cyl(0.18, 0.16, 0.7, 6);
  const leg = cyl(0.2, 0.18, 0.55, 6);
  const boot = box(0.28, 0.16, 0.4);
  const ear = sph(0.1, 4, 3);
  return done([
    place(body, CLOG, 0, null, 0, 1.45, 0, 1.25, 1.1, 1.05),
    place(bib, "#3E5A86", 0, null, 0, 1.4, -0.42),
    place(strap, "#3E5A86", 0, null, -0.28, 1.85, -0.2),
    place(strap, "#3E5A86", 0, null, 0.28, 1.85, -0.2),
    place(head, CLOG, 0, null, 0, headY, -0.1),
    place(ear, LEAF, 0, null, -0.32, headY + 0.22, 0, 1, 1.2, 0.6),
    place(ear, LEAF, 0, null, 0.32, headY + 0.22, 0, 1, 1.2, 0.6),
    place(eye, EYE, 0, null, -0.14, headY + 0.05, -0.42),
    place(eye, EYE, 0, null, 0.14, headY + 0.05, -0.42),
    place(arm, CLOG_D, 3, { x: -0.95, y: 1.7, z: -0.1 }, -1.15, 1.4, -0.15),
    place(arm, CLOG_D, 4, { x: 0.95, y: 1.7, z: -0.1 }, 1.15, 1.4, -0.15),
    place(leg, "#2C3E5A", 1, { x: -0.32, y: 0.7, z: 0.05 }, -0.34, 0.45, 0.08),
    place(leg, "#2C3E5A", 2, { x: 0.32, y: 0.7, z: 0.05 }, 0.34, 0.45, 0.08),
    place(boot, "#1E1410", 0, null, -0.34, 0.16, -0.05),
    place(boot, "#1E1410", 0, null, 0.34, 0.16, -0.05),
  ], new THREE.Vector3(0.9, 2.1, -0.8));
}

export function buildWrench() {
  const handle = box(0.16, 0.16, 1.5);
  const head = box(0.55, 0.22, 0.28);
  const jaw = box(0.16, 0.22, 0.22);
  return done([
    place(handle, "#9AA3AE", 0, null, 0, 0, 0.45),
    place(head, "#C5CED6", 0, null, 0, 0, -0.42),
    place(jaw, "#9AA3AE", 0, null, -0.18, 0, -0.62),
    place(jaw, "#9AA3AE", 0, null, 0.18, 0, -0.62),
  ]);
}

export function arrowGeo() {
  return new THREE.BoxGeometry(0.12, 0.12, 1.7);
}

function mergeBare(geos) {
  let vCount = 0;
  let iCount = 0;
  for (let p = 0; p < geos.length; p++) {
    vCount += geos[p].getAttribute("position").count;
    iCount += geos[p].index.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const idx = new Uint32Array(iCount);
  let v = 0;
  let k = 0;
  for (let p = 0; p < geos.length; p++) {
    const g = geos[p];
    const gp = g.getAttribute("position");
    const gn = g.getAttribute("normal");
    const gi = g.index;
    const base = v;
    for (let i = 0; i < gp.count; i++) {
      pos[(v + i) * 3] = gp.getX(i);
      pos[(v + i) * 3 + 1] = gp.getY(i);
      pos[(v + i) * 3 + 2] = gp.getZ(i);
      nrm[(v + i) * 3] = gn.getX(i);
      nrm[(v + i) * 3 + 1] = gn.getY(i);
      nrm[(v + i) * 3 + 2] = gn.getZ(i);
    }
    for (let i = 0; i < gi.count; i++) idx[k++] = gi.getX(i) + base;
    v += gp.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

export function rocketGeo() {
  const nose = new THREE.ConeGeometry(0.08, 0.36, 6);
  nose.rotateX(Math.PI / 2);
  nose.translate(0, 0, 0.24);
  const body = new THREE.CylinderGeometry(0.055, 0.078, 0.34, 6);
  body.rotateX(Math.PI / 2);
  const finA = new THREE.BoxGeometry(0.2, 0.016, 0.14);
  finA.translate(0, 0, -0.16);
  const finB = new THREE.BoxGeometry(0.016, 0.2, 0.14);
  finB.translate(0, 0, -0.16);
  return mergeBare([nose, body, finA, finB]);
}

export function flameGeo() {
  const g = new THREE.ConeGeometry(1, 1, 8, 1, true);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, -0.5);
  return g;
}

export function streamGeo() {
  const g = new THREE.BoxGeometry(0.28, 0.28, 1);
  g.translate(0, 0, -0.5);
  return g;
}


export function buildTile() {
  const parts = [];
  const deck = "#C9C6D4";
  const seam = "#B7B3C2";
  const red = "#E23B32";
  const river = "#8EC6DE";
  const stripe = "#F4FBFF";
  for (let i = 0; i < 10; i++) {
    const z = -1 - i * 2;
    parts.push(place(box(3.333, 0.28, 2), deck, 0, null, -3.3335, 0.14, z));
    parts.push(place(box(3.334, 0.28, 2), river, 0, null, 0, 0.14, z));
    parts.push(place(box(3.333, 0.28, 2), deck, 0, null, 3.3335, 0.14, z));
    parts.push(place(box(10, 0.02, 0.05), seam, 0, null, 0, 0.29, -i * 2));
  }
  parts.push(place(box(0.22, 0.04, 20), stripe, 0, null, -1.667, 0.32, -10));
  parts.push(place(box(0.22, 0.04, 20), stripe, 0, null, 1.667, 0.32, -10));
  const girder = box(0.28, 0.55, 20);
  parts.push(place(girder, red, 0, null, -5.05, 0.48, -10));
  parts.push(place(girder, red, 0, null, 5.05, 0.48, -10));
  const rail = box(0.08, 0.08, 20);
  for (let k = 0; k < 2; k++) {
    const x = k === 0 ? -5.05 : 5.05;
    parts.push(place(rail, red, 0, null, x, 0.95, -10));
  }
  const post = box(0.1, 0.7, 0.1);
  for (let i = 0; i < 10; i++) {
    const z = -1 - i * 2;
    parts.push(place(post, red, 0, null, -5.05, 0.85, z));
    parts.push(place(post, red, 0, null, 5.05, 0.85, z));
  }
  return mergeParts(parts);
}

export function buildCrateGeo() {
  const wood = "#C9864A";
  const woodD = "#A86A32";
  const hoop = "#F2F4F6";
  const body = cyl(0.46, 0.46, 1.1, 12);
  const band = cyl(0.5, 0.5, 0.08, 12);
  return mergeParts([
    place(body, wood, 0, null, 0, 0.55, 0),
    place(band, hoop, 0, null, 0, 0.28, 0),
    place(band, hoop, 0, null, 0, 0.82, 0),
    place(cyl(0.47, 0.47, 0.06, 12), woodD, 0, null, 0, 1.07, 0),
  ]);
}

export function buildGateFrame() {
  const post = box(0.18, 3.6, 0.22);
  const beam = box(2.05, 0.26, 0.2);
  return mergeParts([
    place(post, "#E7EEF8", 0, null, -1.0, 1.8, 0),
    place(post, "#E7EEF8", 0, null, 1.0, 1.8, 0),
    place(beam, "#E7EEF8", 0, null, 0, 3.55, 0),
  ]);
}

export function buildPedestal() {
  const col = cyl(0.28, 0.38, 1.1, 7);
  const top = cyl(0.55, 0.55, 0.12, 8);
  return mergeParts([
    place(col, "#C8B49A", 0, null, 0, 0.55, 0),
    place(top, "#E6D3B4", 0, null, 0, 1.12, 0),
  ]);
}

export function bulletGeo() {
  return new THREE.BoxGeometry(0.12, 0.12, 1.5);
}

export function sawDiscGeo() {
  const disc = new THREE.CylinderGeometry(0.3, 0.3, 0.045, 14);
  const hub = new THREE.CylinderGeometry(0.07, 0.07, 0.07, 8);
  const tooth = new THREE.ConeGeometry(0.045, 0.16, 4);
  const parts = [
    place(disc, "#8E98A6", 0, null, 0, 0, 0),
    place(hub, "#5C6570", 0, null, 0, 0.01, 0),
  ];
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    parts.push(place(
      tooth,
      "#C5CED6",
      0, null,
      Math.sin(ang) * 0.34,
      0.03,
      Math.cos(ang) * 0.34,
      1, 1, 1,
      ang,
      Math.PI / 2 - 0.55
    ));
  }
  return mergeParts(parts);
}

export function logGeo() {
  const g = new THREE.CylinderGeometry(0.16, 0.16, 0.78, 7);
  g.rotateX(-Math.PI / 2);
  return g;
}

export function quadGeo() {
  return new THREE.PlaneGeometry(1, 1);
}

export function streakGeo() {
  const flat = new THREE.PlaneGeometry(1, 1);
  flat.rotateX(-Math.PI / 2);
  const side = new THREE.PlaneGeometry(1, 1);
  side.rotateY(Math.PI / 2);
  const geos = [flat, side];
  let vCount = 0;
  let iCount = 0;
  for (let p = 0; p < geos.length; p++) {
    vCount += geos[p].getAttribute("position").count;
    iCount += geos[p].index.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const idx = new Uint32Array(iCount);
  let v = 0;
  let k = 0;
  for (let p = 0; p < geos.length; p++) {
    const g = geos[p];
    const gp = g.getAttribute("position");
    const gn = g.getAttribute("normal");
    const gu = g.getAttribute("uv");
    const gi = g.index;
    const base = v;
    for (let i = 0; i < gp.count; i++) {
      pos[(v + i) * 3] = gp.getX(i);
      pos[(v + i) * 3 + 1] = gp.getY(i);
      pos[(v + i) * 3 + 2] = gp.getZ(i);
      nrm[(v + i) * 3] = gn.getX(i);
      nrm[(v + i) * 3 + 1] = gn.getY(i);
      nrm[(v + i) * 3 + 2] = gn.getZ(i);
      uv[(v + i) * 2] = gu.getX(i);
      uv[(v + i) * 2 + 1] = gu.getY(i);
    }
    for (let i = 0; i < gi.count; i++) idx[k++] = gi.getX(i) + base;
    v += gp.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

export function iceSpikeGeo() {
  const g = new THREE.ConeGeometry(0.2, 1.2, 7, 1);
  g.rotateX(Math.PI / 2);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const rad = Math.hypot(x, y);
    const jag = rad > 0.02 ? (i % 3 === 0 ? 1.85 : 0.5 + 0.35 * Math.abs(Math.cos(i * 1.7))) : 1;
    if (rad > 0.02) {
      pos.setX(i, (x / rad) * rad * jag);
      pos.setY(i, (y / rad) * rad * jag);
    }
    const ang = Math.atan2(y, x);
    const shade = 0.45 + 0.55 * Math.abs(Math.sin(ang * 3 + i));
    const u = Math.max(0, Math.min(1, (z + 0.6) / 1.2));
    col[i * 3] = 0.35 + shade * 0.35 + u * 0.25;
    col[i * 3 + 1] = 0.72 + shade * 0.18 + u * 0.08;
    col[i * 3 + 2] = 0.85 + shade * 0.15;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function buildGrenade() {
  const body = sph(0.16, 14, 12);
  const ridge = new THREE.TorusGeometry(0.145, 0.022, 8, 18);
  return done([
    place(body, "#3FA34A", 0, null, 0, 0, 0, 1, 1.05, 1),
    place(ridge, "#246B32", 0, null, 0, 0, 0, 1, 1, 1, 0, Math.PI / 2),
    place(ridge, "#2E7A38", 0, null, 0, 0.07, 0, 0.86, 0.86, 0.86, 0, Math.PI / 2),
    place(ridge, "#2E7A38", 0, null, 0, -0.07, 0, 0.86, 0.86, 0.86, 0, Math.PI / 2),
    place(cyl(0.04, 0.05, 0.08, 6), "#245C30", 0, null, 0, 0.18, 0),
    place(sph(0.04, 5, 4), "#FF2430", 0, null, 0, 0.22, 0),
  ]);
}
