import * as THREE from "three";

const timeU = { value: 0 };

let gradTex = null;
let pineTex = null;
let blobTex = null;
let digitTex = null;

export function setTime(t) {
  timeU.value = t;
}

export function gradient() {
  if (gradTex) return gradTex;
  const c = document.createElement("canvas");
  c.width = 3;
  c.height = 1;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#241810";
  g.fillRect(0, 0, 1, 1);
  g.fillStyle = "#8A7C70";
  g.fillRect(1, 0, 1, 1);
  g.fillStyle = "#FFFFFF";
  g.fillRect(2, 0, 1, 1);
  gradTex = new THREE.CanvasTexture(c);
  gradTex.magFilter = THREE.NearestFilter;
  gradTex.minFilter = THREE.NearestFilter;
  gradTex.generateMipmaps = false;
  gradTex.colorSpace = THREE.NoColorSpace;
  gradTex.needsUpdate = true;
  return gradTex;
}

export function toon(color, opts) {
  const o = opts || {};
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: gradient(),
    vertexColors: !!o.vertexColors,
    map: o.map || null,
    alphaTest: o.alphaTest || 0,
    transparent: !!o.transparent,
    opacity: o.opacity == null ? 1 : o.opacity,
    side: o.side || THREE.FrontSide,
    depthWrite: o.depthWrite !== false,
  });
}

const ANIM_ATTRS = `
attribute float aPart;
attribute vec3 aPivot;
attribute float aPhase;
attribute float aHit;
uniform float uTime;
`;

function animBegin(amp) {
  const a = amp == null ? 1 : amp;
  const wag = (0.7 * a).toFixed(4);
  const bob = (0.08 * a).toFixed(4);
  const sway = (0.035 * a).toFixed(4);
  return `
vec3 transformed = position;
float tt = uTime * 50.26548 + aPhase;
float sw = sin(tt);
vec3 p = transformed - aPivot;
float pid = aPart;
if (pid > 4.5 && pid < 5.5) {
  float wag = sw * ${wag};
  float cs = cos(wag);
  float sn = sin(wag);
  float x = p.x * cs - p.z * sn;
  float z = p.x * sn + p.z * cs;
  p.x = x;
  p.z = z;
}
transformed = p + aPivot;
transformed.y += abs(sw) * ${bob};
transformed.x += sw * ${sway};
vFlash = clamp(aHit, 0.0, 1.0);
`;
}

const toonByAmp = {};

export function animToon(amp) {
  const key = String(amp == null ? 1 : amp);
  if (toonByAmp[key]) return toonByAmp[key];
  const begin = animBegin(amp);
  const mat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    vertexColors: true,
    gradientMap: gradient(),
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeU;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "varying float vFlash;\n" + ANIM_ATTRS + "\n#include <common>")
      .replace("#include <begin_vertex>", begin);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "varying float vFlash;\n#include <common>")
      .replace(
        "#include <opaque_fragment>",
        "outgoingLight = mix(outgoingLight, vec3(1.0), vFlash);\n#include <opaque_fragment>"
      );
  };
  mat.customProgramCacheKey = () => "bbr-anim-toon-" + key;
  toonByAmp[key] = mat;
  return mat;
}

export function outlineMaterial(push) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uPush: { value: push == null ? 0.04 : push },
      uColor: { value: new THREE.Color("#1E1410") },
    },
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
    fragmentShader: `
      uniform vec3 uColor;
      void main() { gl_FragColor = vec4(uColor, 1.0); }
    `,
  });
  return mat;
}

export function attachOutline(mesh, push) {
  const shell = new THREE.Mesh(mesh.geometry, outlineMaterial(push));
  shell.frustumCulled = false;
  shell.renderOrder = mesh.renderOrder;
  mesh.add(shell);
  return shell;
}

export function outlineAnim(push, amp) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uPush: { value: push == null ? 0.035 : push }, uTime: timeU },
    vertexShader: `
      attribute float aPart;
      attribute vec3 aPivot;
      attribute float aPhase;
      attribute float aHit;
      uniform float uTime;
      uniform float uPush;
      void main() {
        float vFlash;
        ${animBegin(amp)}
        vec3 p2 = transformed + normal * uPush;
        vec4 mv = vec4(p2, 1.0);
        #ifdef USE_INSTANCING
          mv = instanceMatrix * mv;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * mv;
      }
    `,
    fragmentShader: "void main(){ gl_FragColor = vec4(0.118, 0.078, 0.063, 1.0); }",
  });
}

export function writeTRS(el, i, x, y, z, yaw, sx, sy, sz) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const o = i * 16;
  el[o] = c * sx;
  el[o + 1] = 0;
  el[o + 2] = -s * sx;
  el[o + 3] = 0;
  el[o + 4] = 0;
  el[o + 5] = sy;
  el[o + 6] = 0;
  el[o + 7] = 0;
  el[o + 8] = s * sz;
  el[o + 9] = 0;
  el[o + 10] = c * sz;
  el[o + 11] = 0;
  el[o + 12] = x;
  el[o + 13] = y;
  el[o + 14] = z;
  el[o + 15] = 1;
}

export function writeQuat(el, i, x, y, z, s, qx, qy, qz, qw) {
  const xx = qx * qx;
  const yy = qy * qy;
  const zz = qz * qz;
  const xy = qx * qy;
  const xz = qx * qz;
  const yz = qy * qz;
  const wx = qw * qx;
  const wy = qw * qy;
  const wz = qw * qz;
  const o = i * 16;
  el[o] = (1 - 2 * (yy + zz)) * s;
  el[o + 1] = 2 * (xy + wz) * s;
  el[o + 2] = 2 * (xz - wy) * s;
  el[o + 3] = 0;
  el[o + 4] = 2 * (xy - wz) * s;
  el[o + 5] = (1 - 2 * (xx + zz)) * s;
  el[o + 6] = 2 * (yz + wx) * s;
  el[o + 7] = 0;
  el[o + 8] = 2 * (xz + wy) * s;
  el[o + 9] = 2 * (yz - wx) * s;
  el[o + 10] = (1 - 2 * (xx + yy)) * s;
  el[o + 11] = 0;
  el[o + 12] = x;
  el[o + 13] = y;
  el[o + 14] = z;
  el[o + 15] = 1;
}

// Log mesh is authored along -Z. Ry(yaw) * Rz(roll).
export function writeLog(el, i, x, y, z, yaw, roll, s) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const o = i * 16;
  el[o] = cy * cr * s;
  el[o + 1] = sr * s;
  el[o + 2] = -sy * cr * s;
  el[o + 3] = 0;
  el[o + 4] = -cy * sr * s;
  el[o + 5] = cr * s;
  el[o + 6] = sy * sr * s;
  el[o + 7] = 0;
  el[o + 8] = sy * s;
  el[o + 9] = 0;
  el[o + 10] = cy * s;
  el[o + 11] = 0;
  el[o + 12] = x;
  el[o + 13] = y;
  el[o + 14] = z;
  el[o + 15] = 1;
}

export function pineTexture() {
  if (pineTex) return pineTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 128, 256);
  g.fillStyle = "#6B4224";
  g.fillRect(56, 176, 16, 74);
  g.fillStyle = "#1C4030";
  g.beginPath();
  g.moveTo(64, 12);
  g.lineTo(22, 132);
  g.lineTo(106, 132);
  g.fill();
  g.fillStyle = "#2C6844";
  g.beginPath();
  g.moveTo(64, 52);
  g.lineTo(12, 188);
  g.lineTo(116, 188);
  g.fill();
  g.fillStyle = "#3E7C52";
  g.beginPath();
  g.moveTo(64, 96);
  g.lineTo(4, 228);
  g.lineTo(124, 228);
  g.fill();
  pineTex = new THREE.CanvasTexture(c);
  pineTex.colorSpace = THREE.SRGBColorSpace;
  pineTex.needsUpdate = true;
  return pineTex;
}

export function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, "rgba(20,12,8,0.5)");
  grd.addColorStop(1, "rgba(20,12,8,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  blobTex.colorSpace = THREE.SRGBColorSpace;
  blobTex.needsUpdate = true;
  return blobTex;
}

export function digitAtlas() {
  if (digitTex) return digitTex;
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 64;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 640, 64);
  g.font = "900 52px Arial Black, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 3;
  g.strokeStyle = "#1E1410";
  g.fillStyle = "#FFFFFF";
  for (let d = 0; d < 10; d++) {
    const x = d * 64 + 32;
    g.strokeText(String(d), x, 34);
    g.fillText(String(d), x, 34);
  }
  digitTex = new THREE.CanvasTexture(c);
  digitTex.colorSpace = THREE.SRGBColorSpace;
  digitTex.magFilter = THREE.LinearFilter;
  digitTex.minFilter = THREE.LinearFilter;
  digitTex.generateMipmaps = false;
  digitTex.needsUpdate = true;
  return digitTex;
}

export function digitMaterial() {
  const mat = new THREE.MeshBasicMaterial({
    map: digitAtlas(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "attribute float aDigit;\n#include <common>")
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
#ifdef USE_MAP
vMapUv.x = (uv.x + aDigit) * 0.1;
#endif`
      );
  };
  mat.customProgramCacheKey = () => "bbr-digit-1";
  return mat;
}

export function paintSign(ctx, canvas, text) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  let size = 176;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
  while (size > 72 && ctx.measureText(text).width > w * 0.9) {
    size -= 8;
    ctx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
  }
  ctx.lineWidth = Math.max(12, size * 0.12);
  ctx.strokeStyle = "#1E1410";
  ctx.strokeText(text, w / 2, h / 2 + 6);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, w / 2, h / 2 + 6);
}

export function makeSign() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, tex };
}

export function drawWeaponIcon(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (id === "long") {
    ctx.strokeStyle = "#F7F7FF";
    ctx.lineWidth = Math.max(3, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.16);
    ctx.quadraticCurveTo(0, -s * 0.42, s * 0.42, s * 0.16);
    ctx.stroke();
    ctx.strokeStyle = "#E8E8F4";
    ctx.beginPath();
    ctx.moveTo(0, s * 0.16);
    ctx.lineTo(0, -s * 0.34);
    ctx.stroke();
  } else if (id === "beam") {
    ctx.strokeStyle = "#FF2430";
    ctx.lineWidth = Math.max(4, s * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.36);
    ctx.lineTo(0, -s * 0.42);
    ctx.stroke();
    ctx.fillStyle = "#FF2430";
    ctx.fillRect(-s * 0.16, -s * 0.08, s * 0.32, s * 0.16);
  } else if (id === "storm") {
    ctx.strokeStyle = "#3A6BFF";
    ctx.lineWidth = Math.max(3, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, s * 0.32);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s * 0.08, 0);
    ctx.lineTo(s * 0.22, -s * 0.36);
    ctx.stroke();
  } else if (id === "frost") {
    ctx.fillStyle = "#7DEBFF";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 0.22, 0);
    ctx.lineTo(0, s * 0.4);
    ctx.lineTo(-s * 0.22, 0);
    ctx.fill();
  } else if (id === "rail") {
    ctx.fillStyle = "#FFF6D8";
    ctx.fillRect(-s * 0.06, -s * 0.42, s * 0.12, s * 0.84);
    ctx.fillStyle = "#8B5A2B";
    ctx.fillRect(-s * 0.16, s * 0.12, s * 0.32, s * 0.16);
  } else if (id === "gerald") {
    ctx.fillStyle = "#3DDC6A";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-s * 0.18 + i * s * 0.12, s * 0.08, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#6B4224";
    ctx.fillRect(-s * 0.28, -s * 0.08, s * 0.56, s * 0.12);
  } else if (id === "rocket") {
    ctx.fillStyle = "#FF4FA3";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 0.2, s * 0.22);
    ctx.lineTo(-s * 0.2, s * 0.22);
    ctx.fill();
    ctx.fillStyle = "#F5C400";
    ctx.fillRect(-s * 0.06, s * 0.22, s * 0.12, s * 0.14);
  } else if (id === "flame") {
    ctx.fillStyle = "#FF6A1A";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.32, 0, 0, s * 0.36);
    ctx.quadraticCurveTo(-s * 0.32, 0, 0, -s * 0.4);
    ctx.fill();
    ctx.fillStyle = "#F5C400";
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "party") {
    const cols = ["#F5C400", "#4FC3FF", "#FF4FA3", "#7FA64A"];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = cols[i % 4];
      ctx.fillRect(-s * 0.3 + (i % 4) * s * 0.16, -s * 0.28 + ((i / 4) | 0) * s * 0.22, s * 0.1, s * 0.08);
    }
  } else if (id === "sap") {
    ctx.fillStyle = "#E0A030";
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.16, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, s * 0.32, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "smg") {
    ctx.fillStyle = "#C89600";
    ctx.beginPath();
    ctx.ellipse(0, 4, s * 0.28, s * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F5C400";
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.22, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6B4224";
    ctx.fillRect(-s * 0.06, -s * 0.34, s * 0.12, s * 0.16);
  } else if (id === "shot") {
    ctx.fillStyle = "#E86A1A";
    for (let i = 0; i < 5; i++) {
      const y = -s * 0.34 + i * s * 0.16;
      const w = s * (0.18 + i * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + s * 0.14);
      ctx.lineTo(-w, y + s * 0.14);
      ctx.fill();
    }
  } else if (id === "log") {
    ctx.fillStyle = "#8B5A2B";
    ctx.fillRect(-s * 0.42, -s * 0.16, s * 0.84, s * 0.32);
    ctx.fillStyle = "#C48A52";
    ctx.fillRect(-s * 0.42, -s * 0.16, s * 0.1, s * 0.32);
    ctx.strokeStyle = "#5A3818";
    ctx.lineWidth = 2;
    ctx.strokeRect(-s * 0.42, -s * 0.16, s * 0.84, s * 0.32);
  } else {
    ctx.strokeStyle = "#6B4224";
    ctx.lineWidth = Math.max(3, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, s * 0.2);
    ctx.lineTo(s * 0.28, -s * 0.08);
    ctx.stroke();
    ctx.fillStyle = "#F4E6C3";
    ctx.beginPath();
    ctx.arc(s * 0.32, -s * 0.12, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hatIcon(ctx, cx, cy, s) {
  ctx.fillStyle = "#F5C400";
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.28, cy);
  ctx.lineTo(cx - s * 0.16, cy - s * 0.28);
  ctx.lineTo(cx + s * 0.16, cy - s * 0.28);
  ctx.lineTo(cx + s * 0.28, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - s * 0.4, cy, s * 0.8, s * 0.08);
}

function sealIcon(ctx, cx, cy, s) {
  ctx.fillStyle = "#C23B4A";
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F4E6C3";
  ctx.lineWidth = Math.max(2, s * 0.04);
  ctx.stroke();
}

export function paintGateSign(ctx, canvas, text, blue) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = blue ? "rgba(47,123,255,0.92)" : "rgba(229,57,53,0.92)";
  ctx.fillRect(0, 0, w, h);
  let size = 210;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
  while (size > 96 && ctx.measureText(text).width > w * 0.9) {
    size -= 10;
    ctx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
  }
  ctx.lineWidth = Math.max(14, size * 0.1);
  ctx.strokeStyle = "#1E1410";
  ctx.strokeText(text, w / 2, h * 0.52);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, w / 2, h * 0.52);
}

export function paintCrateFace(ctx, canvas, kind, id, hp, extra) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (kind === "volunteer") {
    ctx.fillStyle = "#3E6B45";
    ctx.fillRect(0, 0, w, h);
    hatIcon(ctx, w * 0.5, h * 0.28, w * 0.5);
    ctx.font = "900 64px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#F4E6C3";
    ctx.fillText(extra || "+8", w * 0.5, h * 0.5);
  } else if (kind === "tier") {
    ctx.fillStyle = "#8E99A4";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 72px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TIER UP", w * 0.5, h * 0.38);
  } else if (kind === "mystery") {
    ctx.fillStyle = "#5A3E86";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#F4E6C3";
    ctx.font = "900 120px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("?", w * 0.5, h * 0.36);
  } else if (kind === "duck") {
    ctx.fillStyle = "#E6C15A";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#F5C400";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.32, w * 0.16, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E86A1A";
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.32);
    ctx.lineTo(w * 0.78, h * 0.36);
    ctx.lineTo(w * 0.62, h * 0.4);
    ctx.fill();
  } else {
    ctx.fillStyle = kind === "forged" ? "#6A4038" : "#E8B530";
    ctx.fillRect(0, 0, w, h);
    if (id) drawWeaponIcon(ctx, id, w * 0.5, h * 0.3, w * 0.36);
    if (kind === "forged") sealIcon(ctx, w * 0.82, h * 0.18, w * 0.28);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function paintCrateHp(ctx, canvas, hp) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const text = String(Math.max(0, hp | 0));
  let size = 220;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
  while (size > 96 && ctx.measureText(text).width > w * 0.92) {
    size -= 10;
    ctx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
  }
  ctx.lineWidth = Math.max(18, size * 0.16);
  ctx.strokeStyle = "#1E1410";
  ctx.strokeText(text, w / 2, h * 0.52);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, w / 2, h * 0.52);
}

export function skyTexture() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "#8ECAEF");
  grd.addColorStop(0.28, "#C5DFF3");
  grd.addColorStop(0.52, "#F6E7D0");
  grd.addColorStop(0.68, "#F3D2AE");
  grd.addColorStop(1, "#E7C49A");
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
