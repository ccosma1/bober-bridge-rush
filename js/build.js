import * as THREE from "three";

const FUR = "#8B5A2B";
const FUR_D = "#6B4224";
const FUR_L = "#C48A52";
const HAT = "#F5C400";
const CREAM = "#F4E6C3";
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

export function buildSoldier() {
  const head = sph(0.26, 6, 4);
  const muzzle = sph(0.12, 5, 3);
  const ear = cone(0.07, 0.16, 4);
  const tooth = box(0.045, 0.07, 0.03);
  const eye = sph(0.035, 4, 2);
  const hat = cone(0.24, 0.16, 16);
  const brim = cyl(0.3, 0.3, 0.045, 16);
  const body = sph(0.2, 6, 4);
  const leg = cyl(0.075, 0.06, 0.32, 5);
  const arm = cyl(0.05, 0.045, 0.26, 5);
  const tail = box(0.22, 0.045, 0.26);
  const gun = box(0.05, 0.05, 0.28);
  const hipY = 0.38;
  const shY = 0.76;
  const headY = 1.02;
  const parts = [
    place(body, FUR, 0, null, 0, 0.62, 0, 1, 1.05, 0.9),
    place(head, FUR, 0, null, 0, headY, -0.02, 1, 1, 1),
    place(muzzle, CREAM, 0, null, 0, headY - 0.04, -0.2, 1.05, 0.72, 1.15),
    place(ear, FUR_D, 0, null, -0.18, headY + 0.1, 0.02, 1, 1, 1),
    place(ear, FUR_D, 0, null, 0.18, headY + 0.1, 0.02, 1, 1, 1),
    place(eye, INK, 0, null, -0.08, headY + 0.03, -0.22),
    place(eye, INK, 0, null, 0.08, headY + 0.03, -0.22),
    place(tooth, TOOTH, 0, null, -0.035, headY - 0.12, -0.3),
    place(tooth, TOOTH, 0, null, 0.035, headY - 0.12, -0.3),
    place(hat, HAT, 0, null, 0, headY + 0.22, 0),
    place(brim, HAT, 0, null, 0, headY + 0.14, 0),
    place(leg, FUR_D, 1, { x: -0.1, y: hipY, z: 0.02 }, -0.1, hipY - 0.16, 0.02),
    place(leg, FUR_D, 2, { x: 0.1, y: hipY, z: 0.02 }, 0.1, hipY - 0.16, 0.02),
    place(arm, FUR, 3, { x: -0.24, y: shY, z: -0.02 }, -0.24, shY - 0.13, -0.02),
    place(arm, FUR, 4, { x: 0.24, y: shY, z: -0.02 }, 0.24, shY - 0.13, -0.06),
    place(gun, WOOD_D, 4, { x: 0.24, y: shY, z: -0.02 }, 0.28, shY - 0.28, -0.22),
    place(tail, FUR_L, 5, { x: 0, y: 0.46, z: 0.12 }, 0, 0.46, 0.22),
  ];
  const geo = mergeParts(parts);
  return { geo, tris: trisOf(geo) };
}

export function buildBober() {
  // Head parts are yawed so the smug face reads from the chase camera behind him.
  const yaw = Math.PI;
  const headY = 1.55;
  const head = { x: 0, y: headY, z: 0.02 };
  const shY = 1.12;
  const hipY = 0.58;
  const headGeo = sph(0.42, 12, 9);
  const muzzle = sph(0.2, 10, 7);
  const ear = cone(0.1, 0.22, 6);
  const eye = sph(0.055, 6, 4);
  const lid = box(0.1, 0.03, 0.04);
  const tooth = box(0.07, 0.11, 0.04);
  const hat = cone(0.4, 0.24, 10);
  const brim = cyl(0.5, 0.5, 0.06, 10);
  const body = sph(0.34, 10, 8);
  const belly = sph(0.18, 8, 6);
  const leg = cyl(0.11, 0.09, 0.48, 7);
  const arm = cyl(0.08, 0.07, 0.4, 6);
  const tail = box(0.36, 0.06, 0.42);
  const gun = box(0.07, 0.07, 0.46);
  const brow = box(0.1, 0.035, 0.04);
  const cheek = sph(0.07, 5, 3);
  const nose = sph(0.045, 5, 3);
  const smile = box(0.16, 0.03, 0.03);
  const parts = [
    place(body, FUR, 0, null, 0, 0.95, 0, 1.05, 1.15, 0.95),
    place(belly, CREAM, 0, null, 0, 0.9, -0.18, 1, 1.1, 0.7),
    orbit(headGeo, FUR, 0, head, 0, 0, 0, yaw, 1, 0.96, 1),
    orbit(muzzle, CREAM, 0, head, 0, -0.08, -0.3, yaw, 1.15, 0.75, 1.2),
    orbit(nose, NOSE, 0, head, 0, -0.02, -0.48, yaw, 1, 0.8, 1),
    orbit(ear, FUR_D, 0, head, -0.32, 0.16, 0, yaw, 1, 1.1, 1),
    orbit(ear, FUR_D, 0, head, 0.32, 0.16, 0, yaw, 1, 1.1, 1),
    orbit(eye, INK, 0, head, -0.13, 0.07, -0.4, yaw, 1.2, 1.15, 0.65),
    orbit(eye, INK, 0, head, 0.13, 0.03, -0.4, yaw, 1.05, 0.9, 0.65),
    orbit(lid, FUR, 0, head, -0.13, 0.14, -0.34, yaw),
    orbit(lid, FUR, 0, head, 0.13, 0.1, -0.34, yaw),
    orbit(brow, INK, 0, head, -0.15, 0.16, -0.32, yaw, 1.1, 1, 1),
    orbit(brow, INK, 0, head, 0.16, 0.1, -0.32, yaw),
    orbit(tooth, TOOTH, 0, head, -0.05, -0.22, -0.5, yaw),
    orbit(tooth, TOOTH, 0, head, 0.05, -0.2, -0.5, yaw, 1, 0.85, 1),
    orbit(smile, INK, 0, head, 0.08, -0.16, -0.44, yaw),
    orbit(cheek, BLUSH, 0, head, -0.24, -0.08, -0.24, yaw),
    orbit(cheek, BLUSH, 0, head, 0.24, -0.08, -0.22, yaw),
    orbit(hat, HAT, 0, head, 0, 0.36, 0, yaw),
    orbit(brim, HAT, 0, head, 0, 0.24, -0.02, yaw),
    place(leg, FUR_D, 1, { x: -0.16, y: hipY, z: 0 }, -0.16, hipY - 0.24, 0),
    place(leg, FUR_D, 2, { x: 0.16, y: hipY, z: 0 }, 0.16, hipY - 0.24, 0),
    place(arm, FUR, 3, { x: -0.4, y: shY, z: 0 }, -0.4, shY - 0.2, -0.05),
    place(arm, FUR, 4, { x: 0.4, y: shY, z: 0 }, 0.4, shY - 0.18, -0.08),
    place(gun, WOOD_D, 4, { x: 0.4, y: shY, z: 0 }, 0.46, shY - 0.42, -0.32),
    place(tail, FUR_L, 5, { x: 0, y: 0.7, z: 0.2 }, 0, 0.68, 0.38),
  ];
  const geo = mergeParts(parts);
  return { geo, tris: trisOf(geo) };
}

function beast(kind) {
  const parts = [];
  if (kind === "rat") {
    const body = sph(0.32, 6, 4);
    const head = sph(0.2, 5, 4);
    const ear = cone(0.06, 0.12, 4);
    const eye = sph(0.04, 4, 2);
    const leg = cyl(0.05, 0.04, 0.18, 4);
    const tail = cyl(0.03, 0.015, 0.28, 4);
    const brow = box(0.06, 0.025, 0.03);
    parts.push(
      place(body, MUD, 0, null, 0, 0.42, 0, 1, 0.8, 1.25),
      place(head, MUD, 0, null, 0, 0.62, -0.28, 1, 0.9, 1),
      place(ear, MUD_D, 0, null, -0.12, 0.78, -0.22),
      place(ear, MUD_D, 0, null, 0.12, 0.78, -0.22),
      place(eye, PURPLE, 0, null, -0.07, 0.66, -0.42),
      place(eye, PURPLE, 0, null, 0.07, 0.66, -0.42),
      place(brow, INK, 0, null, -0.07, 0.74, -0.4),
      place(brow, INK, 0, null, 0.07, 0.74, -0.4),
      place(leg, MUD_D, 1, { x: -0.12, y: 0.28, z: -0.08 }, -0.12, 0.18, -0.08),
      place(leg, MUD_D, 2, { x: 0.12, y: 0.28, z: -0.08 }, 0.12, 0.18, -0.08),
      place(leg, MUD_D, 1, { x: -0.12, y: 0.28, z: 0.12 }, -0.12, 0.18, 0.12),
      place(leg, MUD_D, 2, { x: 0.12, y: 0.28, z: 0.12 }, 0.12, 0.18, 0.12),
      place(tail, MUD_D, 5, { x: 0, y: 0.4, z: 0.28 }, 0, 0.4, 0.42, 1, 1, 1, 0, Math.PI / 2)
    );
  } else if (kind === "beetle") {
    const body = sph(0.38, 7, 5);
    const shell = sph(0.28, 6, 4);
    const head = sph(0.16, 5, 4);
    const eye = sph(0.045, 4, 2);
    const horn = cone(0.05, 0.2, 4);
    const leg = cyl(0.045, 0.04, 0.2, 4);
    parts.push(
      place(body, MUD_D, 0, null, 0, 0.4, 0.05, 1.15, 0.7, 1.2),
      place(shell, SHELL, 0, null, 0, 0.58, 0.05, 1.2, 0.55, 1.15),
      place(head, MUD, 0, null, 0, 0.42, -0.36),
      place(horn, SHELL, 0, null, 0, 0.52, -0.48, 1, 1, 1),
      place(eye, PURPLE, 0, null, -0.08, 0.46, -0.48),
      place(eye, PURPLE, 0, null, 0.08, 0.46, -0.48),
      place(leg, MUD, 1, { x: -0.22, y: 0.28, z: 0 }, -0.28, 0.16, -0.05),
      place(leg, MUD, 2, { x: 0.22, y: 0.28, z: 0 }, 0.28, 0.16, -0.05),
      place(leg, MUD, 1, { x: -0.2, y: 0.28, z: 0.16 }, -0.26, 0.16, 0.16),
      place(leg, MUD, 2, { x: 0.2, y: 0.28, z: 0.16 }, 0.26, 0.16, 0.16)
    );
  } else {
    const body = sph(0.7, 8, 6);
    const head = sph(0.4, 8, 6);
    const muzzle = sph(0.22, 6, 4);
    const ear = sph(0.1, 5, 3);
    const eye = sph(0.07, 5, 3);
    const brow = box(0.12, 0.04, 0.04);
    const arm = cyl(0.12, 0.1, 0.4, 5);
    const leg = cyl(0.14, 0.12, 0.36, 5);
    const belly = sph(0.36, 6, 4);
    parts.push(
      place(body, MUD, 0, null, 0, 0.95, 0, 1.15, 1, 1.2),
      place(belly, CREAM, 0, null, 0, 0.85, -0.35, 0.9, 1, 0.6),
      place(head, MUD, 0, null, 0, 1.55, -0.35, 1.1, 0.95, 1),
      place(muzzle, CREAM, 0, null, 0, 1.4, -0.68, 1.1, 0.75, 1),
      place(ear, MUD_D, 0, null, -0.32, 1.85, -0.2, 1, 1.3, 0.6),
      place(ear, MUD_D, 0, null, 0.32, 1.85, -0.2, 1, 1.3, 0.6),
      place(eye, PURPLE, 0, null, -0.16, 1.62, -0.68),
      place(eye, PURPLE, 0, null, 0.16, 1.62, -0.68),
      place(brow, INK, 0, null, -0.16, 1.76, -0.66, 1.2, 1, 1),
      place(brow, INK, 0, null, 0.16, 1.76, -0.66, 1.2, 1, 1),
      place(arm, MUD_D, 3, { x: -0.7, y: 1.15, z: -0.1 }, -0.78, 0.95, -0.15),
      place(arm, MUD_D, 4, { x: 0.7, y: 1.15, z: -0.1 }, 0.78, 0.95, -0.15),
      place(leg, MUD_D, 1, { x: -0.28, y: 0.5, z: 0.05 }, -0.28, 0.28, 0.05),
      place(leg, MUD_D, 2, { x: 0.28, y: 0.5, z: 0.05 }, 0.28, 0.28, 0.05)
    );
  }
  const geo = mergeParts(parts);
  return { geo, tris: trisOf(geo) };
}

export function buildRat() {
  return beast("rat");
}
export function buildBeetle() {
  return beast("beetle");
}
export function buildBrute() {
  return beast("brute");
}

export function buildBoss() {
  const headY = 2.55;
  const yaw = 0;
  const head = sph(0.72, 14, 10);
  const body = sph(1.05, 14, 10);
  const belly = sph(0.62, 10, 8);
  const muzzle = sph(0.34, 10, 7);
  const ear = sph(0.16, 6, 4);
  const eye = sph(0.1, 6, 4);
  const brow = box(0.22, 0.06, 0.05);
  const tooth = box(0.08, 0.14, 0.05);
  const cheek = sph(0.12, 5, 3);
  const nose = sph(0.08, 5, 3);
  const arm = cyl(0.18, 0.16, 0.7, 7);
  const leg = cyl(0.22, 0.18, 0.5, 7);
  const cape = box(1.5, 1.7, 0.08);
  const crownBand = cyl(0.52, 0.52, 0.16, 8);
  const spike = cone(0.1, 0.32, 5);
  const gem = sph(0.1, 6, 4);
  const stump = cyl(0.85, 1.05, 0.7, 8);
  const root = cone(0.16, 0.4, 5);
  const mud = sph(0.14, 5, 3);
  const parts = [
    place(stump, WOOD_D, 0, null, 0, 0.35, 0.15, 1, 1, 1),
    place(root, WOOD, 0, null, -0.7, 0.15, 0.3, 1, 1, 1, 0.4),
    place(root, WOOD, 0, null, 0.75, 0.12, -0.1, 1, 1, 1, -0.3),
    place(body, MUD, 0, null, 0, 1.45, 0, 1.25, 1.05, 1.15),
    place(belly, "#C4A882", 0, null, 0, 1.3, -0.55, 1, 1.1, 0.7),
    place(mud, MUD_D, 0, null, 0.4, 1.7, 0.55),
    place(mud, MUD_D, 0, null, -0.55, 1.2, 0.4, 1.3, 0.8, 1),
    place(head, MUD, 0, null, 0, headY, -0.15, 1.05, 0.95, 1, yaw),
    place(muzzle, CREAM, 0, null, 0, headY - 0.15, -0.72, 1.2, 0.75, 1.1, yaw),
    place(nose, NOSE, 0, null, 0, headY - 0.05, -1.02, 1, 0.8, 1, yaw),
    place(ear, MUD_D, 0, null, -0.55, headY + 0.35, -0.05, 1, 1.4, 0.55, yaw),
    place(ear, MUD_D, 0, null, 0.55, headY + 0.35, -0.05, 1, 1.4, 0.55, yaw),
    place(eye, PURPLE, 0, null, -0.24, headY + 0.08, -0.72, 1, 1, 1, yaw),
    place(eye, PURPLE, 0, null, 0.24, headY + 0.08, -0.72, 1, 1, 1, yaw),
    place(brow, INK, 0, null, -0.26, headY + 0.28, -0.66, 1.3, 1, 1, yaw),
    place(brow, INK, 0, null, 0.28, headY + 0.22, -0.66, 1.1, 1, 1, yaw),
    place(tooth, TOOTH, 0, null, -0.08, headY - 0.38, -1.0, 1, 1, 1, yaw),
    place(tooth, TOOTH, 0, null, 0.08, headY - 0.36, -1.0, 1, 0.9, 1, yaw),
    place(cheek, BLUSH, 0, null, -0.4, headY - 0.12, -0.45, 1, 1, 1, yaw),
    place(cheek, BLUSH, 0, null, 0.4, headY - 0.12, -0.45, 1, 1, 1, yaw),
    place(arm, MUD_D, 3, { x: -1.05, y: 1.7, z: -0.1 }, -1.15, 1.35, -0.15),
    place(arm, MUD_D, 4, { x: 1.05, y: 1.7, z: -0.1 }, 1.15, 1.35, -0.15),
    place(leg, MUD_D, 1, { x: -0.4, y: 0.7, z: 0.1 }, -0.42, 0.45, 0.15),
    place(leg, MUD_D, 2, { x: 0.4, y: 0.7, z: 0.1 }, 0.42, 0.45, 0.15),
    place(cape, CAPE, 0, null, 0, 1.9, 0.85, 1, 1, 1),
    place(crownBand, "#C9A24A", 0, null, 0, headY + 0.78, -0.12),
    place(spike, "#E6C15A", 0, null, 0, headY + 1.02, -0.12),
    place(spike, "#E6C15A", 0, null, -0.28, headY + 0.92, -0.05),
    place(spike, "#E6C15A", 0, null, 0.28, headY + 0.92, -0.05),
    place(gem, "#F4E6C3", 0, null, 0, headY + 0.78, -0.55),
  ];
  const geo = mergeParts(parts);
  return { geo, tris: trisOf(geo), crownLocal: new THREE.Vector3(0, headY + 1.02, -0.12) };
}

export function buildTile() {
  const parts = [];
  for (let i = 0; i < 40; i++) {
    const plank = box(10, 0.2, 0.46);
    const col = i % 2 === 0 ? WOOD : "#8D5A32";
    parts.push(place(plank, col, 0, null, 0, 0.1, -0.25 - i * 0.5));
  }
  const railL = box(0.16, 0.42, 20);
  const railR = box(0.16, 0.42, 20);
  parts.push(place(railL, WOOD_D, 0, null, -5.05, 0.5, -10));
  parts.push(place(railR, WOOD_D, 0, null, 5.05, 0.5, -10));
  for (let i = 0; i < 5; i++) {
    const post = box(0.22, 0.95, 0.22);
    const z = -2 - i * 4;
    parts.push(place(post, "#6E4528", 0, null, -5.05, 0.55, z));
    parts.push(place(post, "#6E4528", 0, null, 5.05, 0.55, z));
  }
  return mergeParts(parts);
}

export function buildCrateGeo() {
  const body = box(3.3, 1.7, 2.2);
  const lid = box(3.4, 0.28, 2.3);
  const band = box(3.42, 0.22, 0.18);
  const band2 = box(0.16, 1.5, 2.32);
  const parts = [
    place(body, WOOD, 0, null, 0, 0.95, 0),
    place(lid, WOOD_D, 0, null, 0, 1.88, 0),
    place(band, STEEL, 0, null, 0, 1.15, 1.02),
    place(band, STEEL, 0, null, 0, 1.15, -1.02),
    place(band2, STEEL, 0, null, -1.15, 0.95, 0),
    place(band2, STEEL, 0, null, 1.15, 0.95, 0),
  ];
  return mergeParts(parts);
}

export function buildGateFrame() {
  const post = box(0.28, 3.3, 0.28);
  const beam = box(4.7, 0.32, 0.28);
  const sill = box(4.7, 0.16, 0.24);
  const parts = [
    place(post, "#F4E6C3", 0, null, -2.2, 1.65, 0),
    place(post, "#F4E6C3", 0, null, 2.2, 1.65, 0),
    place(beam, "#F4E6C3", 0, null, 0, 3.35, 0),
    place(sill, "#F4E6C3", 0, null, 0, 0.12, 0),
  ];
  return mergeParts(parts);
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
  return new THREE.BoxGeometry(0.1, 0.1, 0.62);
}

export function logGeo() {
  const g = new THREE.CylinderGeometry(0.16, 0.16, 0.78, 7);
  g.rotateX(-Math.PI / 2);
  return g;
}

export function quadGeo() {
  return new THREE.PlaneGeometry(1, 1);
}
