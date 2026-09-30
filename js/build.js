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

function guardParts(s, scarf) {
  const leg = box(0.11, 0.3, 0.12);
  const foot = box(0.12, 0.06, 0.18);
  const body = box(0.38, 0.4, 0.28);
  const vest = box(0.4, 0.28, 0.12);
  const head = box(0.32, 0.28, 0.3);
  const muzzle = box(0.2, 0.12, 0.16);
  const tooth = box(0.045, 0.07, 0.04);
  const eye = box(0.055, 0.05, 0.03);
  const glint = box(0.02, 0.02, 0.02);
  const ear = cone(0.06, 0.14, 4);
  const dome = cyl(0.12, 0.145, 0.07, 6);
  const brim = cyl(0.16, 0.16, 0.018, 7);
  const arm = box(0.08, 0.26, 0.08);
  const paw = box(0.08, 0.07, 0.08);
  const stock = box(0.07, 0.08, 0.28);
  const barrel = box(0.045, 0.045, 0.34);
  const tail = box(0.34, 0.06, 0.36);
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
    put(leg, FUR_D, 0, null, -0.1, 0.16, 0.02),
    put(leg, FUR_D, 0, null, 0.1, 0.16, 0.02),
    put(foot, FUR_D, 0, null, -0.1, 0.03, -0.02),
    put(foot, FUR_D, 0, null, 0.1, 0.03, -0.02),
    put(body, FUR, 0, null, 0, 0.5, 0),
    put(vest, "#5B6B3A", 0, null, 0, 0.52, -0.14),
    put(head, FUR, 0, null, 0, 0.82, -0.02),
    put(muzzle, CREAM, 0, null, 0, 0.76, -0.2),
    put(tooth, TOOTH, 0, null, -0.04, 0.68, -0.28),
    put(tooth, TOOTH, 0, null, 0.04, 0.68, -0.28),
    put(eye, INK, 0, null, -0.08, 0.86, -0.18),
    put(eye, INK, 0, null, 0.08, 0.86, -0.18),
    put(glint, "#FFFFFF", 0, null, -0.06, 0.88, -0.2),
    put(glint, "#FFFFFF", 0, null, 0.1, 0.88, -0.2),
    put(ear, FUR_D, 0, null, -0.16, 0.98, 0),
    put(ear, FUR_D, 0, null, 0.16, 0.98, 0),
    put(dome, HAT, 0, null, 0, 0.99, -0.02),
    put(brim, HAT, 0, null, 0, 0.95, -0.02),
    put(arm, FUR, 0, null, -0.24, 0.5, -0.08),
    put(arm, FUR, 0, null, 0.24, 0.5, -0.12),
    put(paw, FUR_L, 0, null, -0.16, 0.4, -0.22),
    put(paw, FUR_L, 0, null, 0.1, 0.4, -0.24),
    put(stock, WOOD_D, 0, null, 0, 0.42, -0.28),
    put(barrel, "#3C4148", 0, null, 0, 0.44, -0.52),
    put(tail, "#3A2416", 5, { x: 0, y: 0.4, z: 0.16 }, 0, 0.4, 0.32),
  ];
  if (scarf) parts.push(put(box(0.36, 0.08, 0.3), "#C23B4A", 0, null, 0, 0.7, 0.02));
  return parts;
}

export function buildSoldier() {
  const geo = mergeParts(guardParts(1, false));
  return { geo, tris: trisOf(geo) };
}

export function buildBober() {
  const geo = mergeParts(guardParts(1.18, true));
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

export function buildClogling() {
  const lump = sph(0.16, 5, 4);
  const eye = sph(0.045, 4, 3);
  const leaf = cone(0.06, 0.14, 4);
  const arm = box(0.08, 0.08, 0.22);
  return done([
    place(lump, CLOG, 0, null, 0, 0.32, 0, 1.35, 1.05, 1.2),
    place(lump, CLOG_D, 0, null, 0.12, 0.4, 0.08, 0.8, 0.7, 0.85),
    place(lump, CLOG, 0, null, -0.1, 0.28, -0.06, 0.7, 0.65, 0.7),
    place(lump, CLOG, 0, null, 0, 0.52, -0.12, 0.85, 0.75, 0.8),
    place(leaf, LEAF, 0, null, -0.08, 0.66, -0.04),
    place(leaf, LEAF, 0, null, 0.1, 0.7, 0.02, 0.8, 1.1, 0.8),
    place(leaf, "#6E9440", 0, null, 0.02, 0.62, 0.1, 0.7, 0.8, 0.7),
    place(eye, EYE, 0, null, -0.07, 0.52, -0.26),
    place(eye, EYE, 0, null, 0.07, 0.52, -0.26),
    place(arm, CLOG_D, 0, null, -0.18, 0.36, -0.22),
    place(arm, CLOG_D, 0, null, 0.18, 0.34, -0.24),
  ]);
}

export function buildSuds() {
  const bubble = sph(0.16, 5, 4);
  const eye = sph(0.04, 4, 3);
  return done([
    place(bubble, CLOG, 0, null, 0, 0.36, 0.05, 0.9, 0.8, 0.85),
    place(bubble, FOAM, 0, null, 0, 0.48, 0, 1.45, 1.2, 1.35),
    place(bubble, FOAM, 0, null, -0.22, 0.62, -0.08, 0.75, 0.75, 0.75),
    place(bubble, FOAM, 0, null, 0.24, 0.4, 0.1, 0.6, 0.6, 0.6),
    place(bubble, FOAM, 0, null, 0.05, 0.72, 0.12, 0.5, 0.5, 0.5),
    place(bubble, FOAM, 0, null, -0.08, 0.3, -0.16, 0.55, 0.55, 0.55),
    place(eye, EYE, 0, null, -0.07, 0.5, -0.28),
    place(eye, EYE, 0, null, 0.07, 0.5, -0.28),
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

export function buildHairball() {
  const core = sph(0.22, 6, 5);
  const tuft = cone(0.045, 0.22, 4);
  const eye = sph(0.055, 5, 4);
  const tooth = box(0.035, 0.07, 0.03);
  const parts = [
    place(core, "#4A3828", 0, null, 0, 0.4, 0, 1.15, 1.05, 1.2),
    place(sph(0.1, 5, 4), "#3A2A22", 0, null, 0, 0.34, -0.16, 1.1, 0.7, 0.8),
  ];
  for (let i = 0; i < 22; i++) {
    const ang = (i / 22) * Math.PI * 2;
    const lift = 0.22 + (i % 5) * 0.08;
    const rad = 0.16 + (i % 3) * 0.05;
    const len = 0.7 + (i % 4) * 0.22;
    parts.push(place(
      tuft,
      i % 3 === 0 ? "#6B5340" : i % 3 === 1 ? "#8A6A48" : "#3E2E24",
      0, null,
      Math.cos(ang) * rad,
      lift,
      Math.sin(ang) * rad * 0.75,
      0.7 + (i % 3) * 0.25,
      len,
      0.7,
      ang,
      0.9 + (i % 4) * 0.35
    ));
  }
  parts.push(place(eye, "#E6B0FF", 0, null, -0.08, 0.42, -0.2));
  parts.push(place(eye, "#E6B0FF", 0, null, 0.09, 0.41, -0.2));
  parts.push(place(sph(0.025, 4, 3), "#FFFFFF", 0, null, -0.06, 0.45, -0.24));
  parts.push(place(sph(0.025, 4, 3), "#FFFFFF", 0, null, 0.11, 0.44, -0.24));
  parts.push(place(tooth, "#FFF6E4", 0, null, -0.05, 0.28, -0.24));
  parts.push(place(tooth, "#FFF6E4", 0, null, 0.02, 0.27, -0.25));
  parts.push(place(tooth, "#FFF6E4", 0, null, 0.08, 0.28, -0.23));
  return done(parts);
}

export function buildSpitter() {
  const body = box(0.36, 0.42, 0.3);
  const head = box(0.26, 0.22, 0.24);
  const eye = box(0.06, 0.05, 0.03);
  const pipe = cyl(0.07, 0.09, 0.62, 5);
  return done([
    place(body, CLOG, 0, null, 0, 0.46, 0.04),
    place(head, CLOG, 0, null, 0, 0.78, -0.06),
    place(eye, EYE, 0, null, -0.07, 0.82, -0.18),
    place(eye, EYE, 0, null, 0.07, 0.82, -0.18),
    place(pipe, "#8A5A3A", 0, null, 0.22, 0.7, -0.32, 1, 1, 1, 0.4, Math.PI / 2.4),
    place(box(0.1, 0.16, 0.1), CLOG_D, 0, null, -0.1, 0.12, 0.04),
    place(box(0.1, 0.16, 0.1), CLOG_D, 0, null, 0.1, 0.12, 0.04),
  ]);
}

export function buildLeaf() {
  const body = sph(0.16, 5, 4);
  const wing = cone(0.12, 0.3, 4);
  const eye = sph(0.028, 3, 2);
  const parts = [];
  const greens = ["#8FBF4A", "#6E9440", "#C6DE62", "#4E7A32", "#A8D15A"];
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 + 0.4;
    const rad = 0.34 + (i % 2) * 0.12;
    const cx = Math.cos(ang) * rad;
    const cy = (i - 2) * 0.16;
    const cz = Math.sin(ang) * rad * 0.45;
    const pivot = { x: cx, y: cy, z: cz };
    const col = greens[i];
    parts.push(place(body, col, 0, pivot, cx, cy, cz, 1.05, 0.72, 1.25));
    parts.push(place(wing, "#2F5A22", 6, pivot, cx - 0.2, cy + 0.02, cz, 1.2, 0.42, 0.9, 0.7, 0.2));
    parts.push(place(wing, col, 6, pivot, cx + 0.2, cy + 0.02, cz, 1.2, 0.42, 0.9, -0.7, -0.15));
    parts.push(place(eye, "#E6B0FF", 0, pivot, cx - 0.04, cy + 0.04, cz - 0.12));
    parts.push(place(eye, "#E6B0FF", 0, pivot, cx + 0.05, cy + 0.03, cz - 0.12));
  }
  return done(parts);
}

export function buildDuck() {
  const body = sph(0.26, 6, 5);
  const head = sph(0.15, 5, 4);
  const beak = cone(0.05, 0.2, 5);
  const wing = cone(0.045, 0.18, 4);
  const foot = box(0.1, 0.028, 0.14);
  const eye = sph(0.032, 4, 3);
  const tooth = box(0.022, 0.055, 0.02);
  const wart = sph(0.03, 3, 2);
  const pivot = { x: 0, y: 0.4, z: 0.02 };
  return done([
    place(body, "#FFE14A", 0, null, 0, 0.36, 0, 1.35, 0.95, 1.2),
    place(sph(0.1, 4, 3), "#FFF6C2", 0, null, 0, 0.42, -0.12, 0.85, 0.5, 0.55),
    place(head, "#FFD23A", 0, null, 0, 0.7, -0.14, 1.05, 0.92, 1.08),
    place(cone(0.07, 0.2, 4), "#E23B3B", 0, null, 0, 1.02, -0.1, 1.15, 1.45, 1, 0, 0.15),
    place(cone(0.045, 0.14, 3), "#C4232A", 0, null, -0.09, 0.94, -0.06, 1, 1.25, 1, 0.45),
    place(cone(0.045, 0.14, 3), "#C4232A", 0, null, 0.09, 0.94, -0.06, 1, 1.25, 1, -0.45),
    place(beak, "#F07A18", 0, null, 0, 0.76, -0.4, 1.45, 0.42, 1.25, 0, Math.PI / 2),
    place(beak, "#C45A10", 0, null, 0, 0.5, -0.38, 1.25, 0.34, 1.15, 0, Math.PI / 2),
    place(tooth, "#FFF6E4", 0, null, -0.07, 0.62, -0.62, 1.8, 2.4, 1.4),
    place(tooth, "#FFF6E4", 0, null, 0, 0.58, -0.7, 1.7, 2.8, 1.5),
    place(tooth, "#FFF6E4", 0, null, 0.07, 0.62, -0.62, 1.8, 2.4, 1.4),
    place(eye, "#1E1410", 0, null, -0.08, 0.78, -0.26),
    place(eye, "#1E1410", 0, null, 0.085, 0.78, -0.26),
    place(sph(0.014, 3, 2), "#FFFFFF", 0, null, -0.065, 0.8, -0.28),
    place(sph(0.014, 3, 2), "#FFFFFF", 0, null, 0.1, 0.8, -0.28),
    place(cyl(0.022, 0.03, 0.12, 5), "#E6B0FF", 0, null, 0.02, 1.02, -0.1),
    place(sph(0.07, 5, 4), "#D070FF", 0, null, 0.03, 1.14, -0.16),
    place(sph(0.026, 4, 3), "#140818", 0, null, 0.03, 1.15, -0.21),
    place(box(0.07, 0.018, 0.02), "#C45A10", 0, null, -0.07, 0.82, -0.26, 1, 1, 1, 0.35),
    place(box(0.07, 0.018, 0.02), "#C45A10", 0, null, 0.075, 0.82, -0.26, 1, 1, 1, -0.35),
    place(wing, "#F0C030", 6, pivot, -0.38, 0.42, -0.02, 0.7, 1.7, 1.15, 0.85),
    place(wing, "#E8A020", 6, pivot, -0.46, 0.38, 0.02, 0.5, 1.3, 0.95, 1.15),
    place(wing, "#F0C030", 6, pivot, 0.38, 0.42, -0.02, 0.7, 1.7, 1.15, -0.85),
    place(wing, "#E8A020", 6, pivot, 0.46, 0.38, 0.02, 0.5, 1.3, 0.95, -1.15),
    place(cone(0.06, 0.16, 4), "#E8A020", 5, pivot, 0, 0.38, 0.26, 1, 0.55, 1, 0, -0.85),
    place(cone(0.035, 0.11, 3), "#FFD23A", 5, pivot, 0.05, 0.42, 0.24, 1, 0.45, 1, 0.25, -0.6),
    place(cone(0.035, 0.11, 3), "#FFD23A", 5, pivot, -0.05, 0.42, 0.24, 1, 0.45, 1, -0.25, -0.6),
    place(wart, "#F6C21A", 0, null, 0.18, 0.46, 0.06, 0.9, 0.6, 0.7),
    place(wart, "#E0A010", 0, null, -0.16, 0.32, 0.08, 0.75, 0.5, 0.65),
    place(foot, "#E86A1A", 0, null, -0.1, 0.04, 0),
    place(foot, "#E86A1A", 0, null, 0.1, 0.04, 0),
    place(box(0.018, 0.016, 0.05), "#C45A10", 0, null, -0.14, 0.045, -0.07),
    place(box(0.018, 0.016, 0.05), "#C45A10", 0, null, 0.14, 0.045, -0.07),
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
  const deck = "#B9B2A6";
  const seam = "#8E877C";
  const wet = "#7A746A";
  for (let i = 0; i < 10; i++) {
    parts.push(place(box(10, 0.28, 2), deck, 0, null, 0, 0.14, -1 - i * 2));
    parts.push(place(box(10, 0.035, 0.07), seam, 0, null, 0, 0.3, -i * 2));
    if (i % 3 === 1) {
      parts.push(place(box(2.4, 0.02, 1.15), wet, 0, null, i % 2 ? -1.6 : 1.5, 0.305, -1.4 - i * 2));
    }
  }
  const para = box(0.42, 0.8, 20);
  parts.push(place(para, "#A39C90", 0, null, -5.12, 0.55, -10));
  parts.push(place(para, "#A39C90", 0, null, 5.12, 0.55, -10));
  const rail = box(0.05, 0.05, 20);
  const post = box(0.07, 0.62, 0.07);
  for (let k = 0; k < 2; k++) {
    const x = k === 0 ? -5.12 : 5.12;
    parts.push(place(rail, "#3C4148", 0, null, x, 0.78, -10));
    parts.push(place(rail, "#3C4148", 0, null, x, 1.08, -10));
  }
  for (let i = 0; i < 10; i++) {
    const z = -1 - i * 2;
    parts.push(place(post, "#3C4148", 0, null, -5.12, 0.9, z));
    parts.push(place(post, "#3C4148", 0, null, 5.12, 0.9, z));
  }
  const pole = box(0.09, 2.1, 0.09);
  const arm = box(0.46, 0.06, 0.06);
  parts.push(place(pole, "#3C4148", 0, null, -5.12, 1.55, -10));
  parts.push(place(pole, "#3C4148", 0, null, 5.12, 1.55, -10));
  parts.push(place(arm, "#3C4148", 0, null, -4.86, 2.5, -10));
  parts.push(place(arm, "#3C4148", 0, null, 4.86, 2.5, -10));
  return mergeParts(parts);
}

export function buildCrateGeo() {
  const parts = [place(box(2.15, 2.15, 1.15), "#E8B530", 0, null, 0, 1.08, 0)];
  parts.push(place(box(2.22, 0.22, 1.22), "#C4922A", 0, null, 0, 1.55, 0));
  parts.push(place(box(2.22, 0.14, 1.22), "#A97820", 0, null, 0, 0.14, 0));
  parts.push(place(box(0.9, 0.06, 0.06), "#F3D27A", 0, null, 0, 1.78, 0.6));
  return mergeParts(parts);
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
  const body = sph(0.16, 8, 6);
  const ridge = new THREE.TorusGeometry(0.15, 0.028, 4, 10);
  return done([
    place(body, "#3FA34A", 0, null, 0, 0, 0, 1, 1.05, 1),
    place(ridge, "#246B32", 0, null, 0, 0, 0, 1, 1, 1, 0, Math.PI / 2),
    place(ridge, "#2E7A38", 0, null, 0, 0.07, 0, 0.86, 0.86, 0.86, 0, Math.PI / 2),
    place(ridge, "#2E7A38", 0, null, 0, -0.07, 0, 0.86, 0.86, 0.86, 0, Math.PI / 2),
    place(cyl(0.04, 0.05, 0.08, 6), "#245C30", 0, null, 0, 0.18, 0),
    place(sph(0.04, 5, 4), "#FF2430", 0, null, 0, 0.22, 0),
  ]);
}
