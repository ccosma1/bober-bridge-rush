import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const UP = new THREE.Vector3(0, 1, 0);
const FWD = new THREE.Vector3(0, 0, -1);
const _v = new THREE.Vector3();
const _b = new THREE.Box3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();

function f16(val) {
  const buf = f16._b || (f16._b = new ArrayBuffer(4));
  const f = f16._f || (f16._f = new Float32Array(buf));
  const u = f16._u || (f16._u = new Uint32Array(buf));
  f[0] = val;
  const x = u[0];
  const sign = (x >>> 16) & 0x8000;
  const mant = x & 0x7fffff;
  const exp = (x >>> 23) & 0xff;
  if (exp === 255) return sign | 0x7c00 | (mant ? 0x200 : 0);
  if (!exp) return sign;
  let e = exp - 127 + 15;
  if (e >= 31) return sign | 0x7c00;
  if (e <= 0) return sign;
  return sign | (e << 10) | (mant >> 13);
}

function findBone(root, name) {
  let hit = null;
  root.traverse((o) => {
    if (!hit && o.name === name) hit = o;
  });
  return hit;
}

function skinnedList(root) {
  const list = [];
  root.traverse((o) => {
    if (o.isSkinnedMesh) list.push(o);
  });
  return list;
}

function clusterSkinned(spans, cell) {
  const maps = [];
  let vertCount = 0;
  for (let s = 0; s < spans.length; s++) {
    const mesh = spans[s].mesh;
    mesh.skeleton.update();
    const n = spans[s].count;
    const map = new Int32Array(n);
    const buckets = Object.create(null);
    const src = [];
    for (let i = 0; i < n; i++) {
      mesh.getVertexPosition(i, _v);
      _v.applyMatrix4(mesh.matrixWorld);
      const key = Math.round(_v.x / cell) + ":" + Math.round(_v.y / cell) + ":" + Math.round(_v.z / cell);
      let id = buckets[key];
      if (id === undefined) {
        id = src.length;
        src.push(i);
        buckets[key] = id;
      }
      map[i] = id;
    }
    maps.push(map);
    spans[s].src = src;
    spans[s].offset = vertCount;
    vertCount += src.length;
  }
  const indices = [];
  for (let s = 0; s < spans.length; s++) {
    const idx = spans[s].mesh.geometry.index;
    const map = maps[s];
    const off = spans[s].offset;
    if (!idx) continue;
    for (let i = 0; i < idx.count; i += 3) {
      const a = map[idx.getX(i)] + off;
      const b = map[idx.getX(i + 1)] + off;
      const c = map[idx.getX(i + 2)] + off;
      if (a === b || b === c || a === c) continue;
      indices.push(a, b, c);
    }
  }
  return { vertCount, indices };
}

function posedBox(meshes, box) {
  box.makeEmpty();
  for (let m = 0; m < meshes.length; m++) {
    const mesh = meshes[m];
    mesh.skeleton.update();
    const n = mesh.geometry.attributes.position.count;
    for (let i = 0; i < n; i++) {
      mesh.getVertexPosition(i, _v);
      _v.applyMatrix4(mesh.matrixWorld);
      box.expandByPoint(_v);
    }
  }
  return box;
}

function findClip(gltf, suffix) {
  const anims = gltf.animations || [];
  let best = null;
  for (let i = 0; i < anims.length; i++) {
    const name = anims[i].name || "";
    const ok = name === suffix || name.endsWith("|" + suffix);
    if (!ok) continue;
    if (!best || name.length > best.name.length) best = anims[i];
  }
  return best;
}

export function mountRig(gltf) {
  const inner = cloneSkinned(gltf.scene);
  const outer = new THREE.Group();
  outer.add(inner);
  outer.updateMatrixWorld(true);
  let meshes = skinnedList(inner);
  if (!meshes.length) return null;
  posedBox(meshes, _b);
  _b.getSize(_s);
  if (_s.z > _s.y * 1.15) {
    inner.rotation.x = -Math.PI / 2;
    inner.updateMatrixWorld(true);
    posedBox(meshes, _b);
    _b.getSize(_s);
  }
  const wristR = findBone(inner, "Wrist.R") || findBone(inner, "LowerArm.R");
  const wristL = findBone(inner, "Wrist.L") || findBone(inner, "LowerArm.L");
  const front = new THREE.Vector3(0, 0, 1);
  if (wristR && wristL) {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    wristR.getWorldPosition(a);
    wristL.getWorldPosition(b);
    front.crossVectors(UP, a.sub(b));
    if (front.lengthSq() < 1e-6) front.set(0, 0, 1);
    else front.normalize();
  }
  const yaw = new THREE.Quaternion().setFromUnitVectors(front, FWD);
  inner.quaternion.premultiply(yaw);
  inner.updateMatrixWorld(true);
  posedBox(meshes, _b);
  _b.getSize(_s);
  const height = Math.max(0.05, _s.y);
  return { outer, inner, meshes, height, box: _b.clone(), frontCue: "wristR-wristL" };
}

function halfTex(width, height) {
  const data = new Uint16Array(width * height * 4);
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.internalFormat = "RGBA16F";
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.flipY = false;
  tex.needsUpdate = true;
  return { tex, data };
}

function writePos(data, width, x, y, px, py, pz) {
  const o = (y * width + x) * 4;
  data[o] = f16(px);
  data[o + 1] = f16(py);
  data[o + 2] = f16(pz);
  data[o + 3] = f16(1);
}

const VAT_HEAD = `
attribute vec4 aAnim;
attribute float aPart;
attribute float aGlow;
attribute float aFoam;
uniform sampler2D tVatPos;
uniform sampler2D tVatNrm;
uniform float uTime;
uniform vec3 uVatInfo;
varying float vGlow;
varying float vPart;
varying float vFoam;
int gVid;
int gF0;
int gF1;
float gFt;
vec3 vatFetch(sampler2D tex, int frame, int vid) {
  int width = int(uVatInfo.x);
  int rpf = int(uVatInfo.y);
  int x = vid - (vid / width) * width;
  int y = frame * rpf + (vid / width);
  return texelFetch(tex, ivec2(x, y), 0).xyz;
}
void vatFrame() {
  gVid = gl_VertexID;
  float span = max(aAnim.y, 1.0);
  float f = fract(uTime * aAnim.w * uVatInfo.z / span + aAnim.z) * span;
  gF0 = int(aAnim.x) + int(floor(f));
  gF1 = int(aAnim.x) + int(mod(floor(f) + 1.0, span));
  gFt = fract(f);
}
`;

const VAT_NORM = `
vatFrame();
vec3 objectNormal = mix(vatFetch(tVatNrm, gF0, gVid), vatFetch(tVatNrm, gF1, gVid), gFt);
#ifdef USE_TANGENT
  vec3 objectTangent = vec3(tangent.xyz);
#endif
`;

const VAT_VERT = `
vatFrame();
vec3 transformed = mix(vatFetch(tVatPos, gF0, gVid), vatFetch(tVatPos, gF1, gVid), gFt);
vGlow = aGlow;
vPart = aPart;
vFoam = aFoam;
`;
const VAT_VERT_CHILL = `
vatFrame();
vChill = aChill;
vec3 transformed = mix(vatFetch(tVatPos, gF0, gVid), vatFetch(tVatPos, gF1, gVid), gFt);
vGlow = aGlow;
vPart = aPart;
vFoam = aFoam;
vLocal = transformed;
vObjN = objectNormal;
`;

const COLOR_FRAG = `#include <color_fragment>
if (vPart > 1.5 && vPart < 2.5) diffuseColor.rgb *= mix(0.42, 1.0, smoothstep(0.0, 0.55, vFoam));
if (vChill > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.84, 1.0), 0.94);
if (vChill > 0.5) {
  vec3 cell = floor(vLocal * 6.5);
  float fh = fract(sin(dot(cell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  if (fh > 0.94) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.98, 1.0), 0.92);
}
if (vPart > 1.5 && vPart < 2.5) diffuseColor.a *= mix(0.2, 0.62, smoothstep(0.0, 0.55, vFoam));
if (vPart > 4.5 && vPart < 5.5) { diffuseColor.rgb = vec3(0.96, 0.94, 1.0); diffuseColor.a = 1.0; }
if (vPart > 6.5 && vPart < 7.5) diffuseColor.rgb *= vec3(1.05, 1.08, 0.92);
`;

const ROUGH_FRAG = `#include <roughnessmap_fragment>
if (vGlow < 0.5 && vPart < 0.5) {
  float rg = texture2D(tRough, vLocal.xz * 2.6 + vLocal.yy * 0.17).g;
  float pore = texture2D(tRough, vLocal.xy * 9.0).g;
  roughnessFactor = mix(0.5, 1.0, rg);
  roughnessFactor = mix(roughnessFactor, pore, 0.38);
} else if (vPart > 1.5 && vPart < 2.5) {
  roughnessFactor = 0.12;
} else if (vGlow > 0.5 || (vPart > 6.5 && vPart < 7.5)) {
  roughnessFactor = 0.22;
}
`;

const OPAQUE_FRAG = `
float rimNd = saturate(dot(normalize(normal), normalize(vViewPosition)));
float rim = pow(1.0 - rimNd, 2.6);
outgoingLight *= mix(1.0, 0.2, rim);
outgoingLight += vec3(0.72, 0.22, 1.0) * vGlow * 1.15;
#include <opaque_fragment>
`;

function hideCanvas(size, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function hideTextures() {
  if (hideTextures.cache) return hideTextures.cache;
  const map = hideCanvas(128, (ctx, s) => {
    ctx.fillStyle = "#c4a07a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = i % 2 ? "#6b4a30" : "#efe0cc";
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const x = (i * 19) % s;
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 12, s * 0.33, x - 14, s * 0.66, x + 6, s);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 48; i++) {
      const x = (i * 37) % s;
      const y = (i * 53) % s;
      ctx.fillStyle = i % 6 === 0 ? "#7d9a55" : i % 3 === 0 ? "#4a3424" : "#e6d0b4";
      ctx.beginPath();
      ctx.ellipse(x, y, 5 + (i % 8), 3 + (i % 5), i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const rough = hideCanvas(128, (ctx, s) => {
    ctx.fillStyle = "#9a9a9a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const v = 40 + ((i * 47) % 200);
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.fillRect((i * 17) % s, (i * 29) % s, 3 + (i % 10), 2 + (i % 7));
    }
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 13) % s, 0);
      ctx.lineTo((i * 13 + 40) % s, s);
      ctx.stroke();
    }
  });
  rough.colorSpace = THREE.NoColorSpace;
  hideTextures.cache = { map: map, rough: rough };
  return hideTextures.cache;
}

function patchVat(shader, uniforms) {
  shader.uniforms.tVatPos = uniforms.tVatPos;
  shader.uniforms.tVatNrm = uniforms.tVatNrm;
  shader.uniforms.uTime = uniforms.uTime;
  shader.uniforms.uVatInfo = uniforms.uVatInfo;
  if (uniforms.tMud) shader.uniforms.tMud = uniforms.tMud;
  if (uniforms.tRough) shader.uniforms.tRough = uniforms.tRough;
  const colorPass = shader.fragmentShader.indexOf("color_fragment") >= 0;
  const vertVary = colorPass
    ? "\nattribute float aChill;\nvarying float vChill;\nvarying vec3 vLocal;\nvarying vec3 vObjN;\n"
    : "\n";
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", VAT_HEAD + vertVary + "#include <common>")
    .replace("#include <begin_vertex>", colorPass ? VAT_VERT_CHILL : VAT_VERT)
    .replace("#include <beginnormal_vertex>", VAT_NORM);
  const fragVary = "varying float vGlow;\nvarying float vPart;\nvarying float vFoam;\n" + (colorPass
    ? "varying float vChill;\nvarying vec3 vLocal;\nvarying vec3 vObjN;\nuniform sampler2D tMud;\nuniform sampler2D tRough;\n"
    : "") + "#include <common>\n";
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", fragVary)
    .replace("#include <color_fragment>", colorPass ? COLOR_FRAG : "#include <color_fragment>")
    .replace("#include <roughnessmap_fragment>", colorPass ? ROUGH_FRAG : "#include <roughnessmap_fragment>")
    .replace("#include <opaque_fragment>", colorPass ? OPAQUE_FRAG : "#include <opaque_fragment>");
}

let vatKeyN = 1;
function makeMat(uniforms, color) {
  const key = "bbr-vat-" + (vatKeyN++);
  const hide = hideTextures();
  uniforms.tMud = uniforms.tMud || { value: hide.map };
  uniforms.tRough = uniforms.tRough || { value: hide.rough };
  const mat = new THREE.MeshStandardMaterial({
    color: color || 0xffffff,
    roughness: 0.86,
    metalness: 0.04,
    vertexColors: true,
  });
  mat.userData.uTime = uniforms.uTime;
  mat.onBeforeCompile = (shader) => patchVat(shader, uniforms);
  mat.customProgramCacheKey = () => key;
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.skinning = false;
  depth.onBeforeCompile = (shader) => patchVat(shader, uniforms);
  depth.customProgramCacheKey = () => key + "-d";
  return { mat, depth };
}

function boxGeo(w, h, d, dx, dy, dz) {
  const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  g.translate(dx, dy, dz);
  return g;
}

function appendExtra(bucket, bone, geo, part, color, glow) {
  const pos = geo.attributes.position;
  const idx = geo.index;
  const local = [];
  bone.updateMatrixWorld(true);
  _m.copy(bone.matrixWorld).invert();
  for (let i = 0; i < pos.count; i++) {
    _v.fromBufferAttribute(pos, i).applyMatrix4(_m);
    local.push(_v.x, _v.y, _v.z);
  }
  const indices = [];
  if (idx) {
    for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i));
  }
  bucket.push({ bone, local, indices, part, color, glow: glow || 0 });
}

export function bakeCrowd(gltf, opt) {
  const mounted = mountRig(gltf);
  if (!mounted) throw new Error("no skin");
  const { inner, meshes } = mounted;
  const scale = (opt.height || 1) / mounted.height;
  inner.scale.multiplyScalar(scale);
  if (opt.squash) {
    inner.scale.x *= opt.squash[0];
    inner.scale.y *= opt.squash[1];
    inner.scale.z *= opt.squash[2];
    inner.updateMatrixWorld(true);
    posedBox(meshes, mounted.box);
    const squashed = Math.max(0.05, mounted.box.max.y - mounted.box.min.y);
    inner.scale.multiplyScalar((opt.height || 1) / squashed);
  }
  inner.updateMatrixWorld(true);
  const clips = [];
  const wanted = opt.clips || [];
  for (let i = 0; i < wanted.length; i++) {
    const clip = findClip(gltf, wanted[i].name);
    if (clip) clips.push({ name: wanted[i].name, frames: wanted[i].frames, clip });
  }
  if (!clips.length && gltf.animations && gltf.animations.length) {
    clips.push({ name: "fallback", frames: 8, clip: gltf.animations[0] });
  }
  const extras = [];
  if (opt.decorate) {
    opt.decorate({
      inner,
      bone: (name) => findBone(inner, name),
      add(boneName, geo, part, color, glow) {
        const bone = findBone(inner, boneName);
        if (!bone) return;
        appendExtra(extras, bone, geo, part, color, glow);
      },
      box: boxGeo,
    });
  }
  let vertCount = 0;
  const spans = [];
  let rawTris = 0;
  for (let m = 0; m < meshes.length; m++) {
    const n = meshes[m].geometry.attributes.position.count;
    spans.push({ mesh: meshes[m], offset: vertCount, count: n, src: null });
    vertCount += n;
    const idx = meshes[m].geometry.index;
    if (idx) rawTris += idx.count / 3;
  }
  const indices = [];
  const maxTris = opt.maxTris || 0;
  if (maxTris && rawTris > maxTris) {
    let clustered = null;
    const cells = [0.012, 0.02, 0.03, 0.045, 0.06, 0.08];
    for (let attempt = 0; attempt < cells.length; attempt++) {
      clustered = clusterSkinned(spans, cells[attempt]);
      if (clustered.indices.length / 3 <= maxTris) break;
    }
    vertCount = clustered.vertCount;
    for (let i = 0; i < clustered.indices.length; i++) indices.push(clustered.indices[i]);
  } else {
    for (let s = 0; s < spans.length; s++) {
      const n = spans[s].count;
      const src = new Array(n);
      for (let i = 0; i < n; i++) src[i] = i;
      spans[s].src = src;
    }
  }
  let extraVerts = 0;
  for (let e = 0; e < extras.length; e++) extraVerts += extras[e].local.length / 3;
  const totalV = vertCount + extraVerts;
  const width = Math.min(2048, Math.max(1, totalV));
  const rpf = Math.ceil(totalV / width);
  let frames = 0;
  for (let i = 0; i < clips.length; i++) frames += clips[i].frames;
  if (!frames) frames = 1;
  const height = frames * rpf;
  const posTex = halfTex(width, height);
  const nrmTex = halfTex(width, height);
  const mixer = new THREE.AnimationMixer(inner);
  const positions = new Float32Array(totalV * 3);
  const normals = new Float32Array(totalV * 3);
  const colors = new Float32Array(totalV * 3);
  const part = new Float32Array(totalV);
  const glow = new Float32Array(totalV);
  if (!indices.length) {
    for (let s = 0; s < spans.length; s++) {
      const mesh = spans[s].mesh;
      const idx = mesh.geometry.index;
      const off = spans[s].offset;
      if (idx) {
        for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + off);
      }
    }
  }
  let extraOff = vertCount;
  for (let e = 0; e < extras.length; e++) {
    const ex = extras[e];
    const n = ex.local.length / 3;
    for (let i = 0; i < ex.indices.length; i++) indices.push(ex.indices[i] + extraOff);
    for (let i = 0; i < n; i++) {
      part[extraOff + i] = ex.part;
      glow[extraOff + i] = ex.glow;
      colors[(extraOff + i) * 3] = ex.color.r;
      colors[(extraOff + i) * 3 + 1] = ex.color.g;
      colors[(extraOff + i) * 3 + 2] = ex.color.b;
    }
    ex.offset = extraOff;
    extraOff += n;
  }
  let frameBase = 0;
  const clipInfo = {};
  const nrmAcc = new THREE.Vector3();
  for (let c = 0; c < clips.length; c++) {
    const spec = clips[c];
    const action = mixer.clipAction(spec.clip);
    action.play();
    clipInfo[spec.name] = { start: frameBase, frames: spec.frames };
    for (let f = 0; f < spec.frames; f++) {
      mixer.setTime((f / spec.frames) * (spec.clip.duration || 1));
      inner.updateMatrixWorld(true);
      for (let s = 0; s < spans.length; s++) {
        const mesh = spans[s].mesh;
        mesh.skeleton.update();
        const off = spans[s].offset;
        const src = spans[s].src;
        const n = src.length;
        for (let i = 0; i < n; i++) {
          mesh.getVertexPosition(src[i], _v);
          _v.applyMatrix4(mesh.matrixWorld);
          const o = (off + i) * 3;
          positions[o] = _v.x;
          positions[o + 1] = _v.y;
          positions[o + 2] = _v.z;
        }
      }
      for (let e = 0; e < extras.length; e++) {
        const ex = extras[e];
        ex.bone.updateMatrixWorld(true);
        const n = ex.local.length / 3;
        for (let i = 0; i < n; i++) {
          _v.set(ex.local[i * 3], ex.local[i * 3 + 1], ex.local[i * 3 + 2]).applyMatrix4(ex.bone.matrixWorld);
          const o = (ex.offset + i) * 3;
          positions[o] = _v.x;
          positions[o + 1] = _v.y;
          positions[o + 2] = _v.z;
        }
      }
      normals.fill(0);
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c3 = indices[i + 2] * 3;
        _v.set(positions[b] - positions[a], positions[b + 1] - positions[a + 1], positions[b + 2] - positions[a + 2]);
        _p.set(positions[c3] - positions[a], positions[c3 + 1] - positions[a + 1], positions[c3 + 2] - positions[a + 2]);
        nrmAcc.crossVectors(_v, _p);
        for (let k = 0; k < 3; k++) {
          const id = indices[i + k] * 3;
          normals[id] += nrmAcc.x;
          normals[id + 1] += nrmAcc.y;
          normals[id + 2] += nrmAcc.z;
        }
      }
      const row0 = (frameBase + f) * rpf;
      for (let i = 0; i < totalV; i++) {
        const o = i * 3;
        const nx = normals[o];
        const ny = normals[o + 1];
        const nz = normals[o + 2];
        const nl = Math.hypot(nx, ny, nz) || 1;
        const x = i - Math.floor(i / width) * width;
        const y = row0 + Math.floor(i / width);
        writePos(posTex.data, width, x, y, positions[o], positions[o + 1], positions[o + 2]);
        writePos(nrmTex.data, width, x, y, nx / nl, ny / nl, nz / nl);
      }
    }
    action.stop();
    frameBase += spec.frames;
  }
  mixer.stopAllAction();
  let yMin = mounted.box.min.y * scale;
  let yMax = mounted.box.max.y * scale;
  if (opt.squash) {
    yMin = Infinity;
    yMax = -Infinity;
    for (let i = 0; i < vertCount; i++) {
      const y = positions[i * 3 + 1];
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  const spanY = Math.max(0.001, yMax - yMin);
  const col = new THREE.Color();
  for (let s = 0; s < spans.length; s++) {
    const mesh = spans[s].mesh;
    const name = mesh.name || "";
    for (let i = 0; i < spans[s].src.length; i++) {
      const o = (spans[s].offset + i) * 3;
      const yNorm = (positions[o + 1] - yMin) / spanY;
      const nx = normals[o];
      const ny = normals[o + 1];
      const nz = normals[o + 2];
      const nl = Math.hypot(nx, ny, nz) || 1;
      if (opt.recolor) opt.recolor(col, name, yNorm, positions[o], positions[o + 1], positions[o + 2], nx / nl, ny / nl, nz / nl);
      else col.set("#888888");
      colors[o] = col.r;
      colors[o + 1] = col.g;
      colors[o + 2] = col.b;
    }
  }
  const geo = new THREE.BufferGeometry();
  const base = new Float32Array(totalV * 3);
  base.set(positions);
  geo.setAttribute("position", new THREE.BufferAttribute(base, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals.slice(), 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aPart", new THREE.BufferAttribute(part, 1));
  geo.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  const uniforms = {
    tVatPos: { value: posTex.tex },
    tVatNrm: { value: nrmTex.tex },
    uTime: { value: 0 },
    uVatInfo: { value: new THREE.Vector3(width, rpf, opt.fps || 12) },
  };
  posTex.tex.needsUpdate = true;
  nrmTex.tex.needsUpdate = true;
  const made = makeMat(uniforms);
  made.mat.userData.vatPos = posTex.tex;
  made.mat.userData.vatW = width;
  made.mat.userData.vatH = height;
  let socket = null;
  const hand = findBone(inner, opt.socketBone || "Wrist.R");
  if (hand && clips.length) {
    const sock = halfTex(4, frames);
    frameBase = 0;
    for (let c = 0; c < clips.length; c++) {
      const spec = clips[c];
      const action = mixer.clipAction(spec.clip);
      action.play();
      for (let f = 0; f < spec.frames; f++) {
        mixer.setTime((f / spec.frames) * (spec.clip.duration || 1));
        inner.updateMatrixWorld(true);
        hand.updateMatrixWorld(true);
        hand.getWorldPosition(_p);
        _m.makeTranslation(_p.x, _p.y, _p.z - 0.02);
        const e = _m.elements;
        for (let col = 0; col < 4; col++) {
          writePos(sock.data, 4, col, frameBase + f, e[col * 4], e[col * 4 + 1], e[col * 4 + 2]);
          const o = ((frameBase + f) * 4 + col) * 4;
          sock.data[o + 3] = f16(e[col * 4 + 3]);
        }
      }
      action.stop();
      frameBase += spec.frames;
    }
    sock.tex.needsUpdate = true;
    socket = sock.tex;
  }
  const tris = Math.floor(indices.length / 3);
  return { geo, mat: made.mat, depth: made.depth, clips: clipInfo, socket, tris, uniforms, height: opt.height };
}

export function staticMerge(root, targetLen) {
  const geos = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    geos.push(g);
  });
  if (!geos.length) return null;
  const geo = geos.length === 1 ? geos[0] : THREE.BufferGeometryUtils
    ? null
    : geos[0];
  let merged = geos[0];
  if (geos.length > 1) {
    const positions = [];
    const indices = [];
    let off = 0;
    for (let i = 0; i < geos.length; i++) {
      const p = geos[i].attributes.position;
      const id = geos[i].index;
      for (let k = 0; k < p.count; k++) positions.push(p.getX(k), p.getY(k), p.getZ(k));
      if (id) for (let k = 0; k < id.count; k++) indices.push(id.getX(k) + off);
      else for (let k = 0; k < p.count; k++) indices.push(off + k);
      off += p.count;
    }
    merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    merged.setIndex(indices);
  }
  merged.computeBoundingBox();
  const size = merged.boundingBox.getSize(_s);
  if (size.x > size.z) merged.rotateY(Math.PI / 2);
  merged.computeBoundingBox();
  const len = Math.max(0.001, merged.boundingBox.max.z - merged.boundingBox.min.z);
  const s = (targetLen || 0.55) / len;
  merged.scale(s, s, s);
  merged.computeBoundingBox();
  merged.translate(
    -(merged.boundingBox.min.x + merged.boundingBox.max.x) * 0.5,
    -merged.boundingBox.min.y,
    -merged.boundingBox.max.z
  );
  merged.computeVertexNormals();
  return merged;
}

const SOCK_HEAD = `
attribute vec4 aAnim;
attribute float aFire;
uniform sampler2D tSocket;
uniform float uTime;
uniform vec3 uVatInfo;
uniform float uKick;
uniform float uPitch;
mat4 sockAt(int frame) {
  mat4 m;
  m[0] = texelFetch(tSocket, ivec2(0, frame), 0);
  m[1] = texelFetch(tSocket, ivec2(1, frame), 0);
  m[2] = texelFetch(tSocket, ivec2(2, frame), 0);
  m[3] = texelFetch(tSocket, ivec2(3, frame), 0);
  return m;
}
`;

export function socketMaterial(color, socketTex, sharedTime, vatInfo) {
  const mat = new THREE.MeshStandardMaterial({
    color: color || 0xf4e6c3,
    roughness: 0.45,
    metalness: 0.25,
  });
  const uniforms = {
    tSocket: { value: socketTex },
    uTime: sharedTime,
    uVatInfo: { value: vatInfo },
    uKick: { value: 0.06 },
    uPitch: { value: 0.105 },
  };
  mat.userData.kick = uniforms.uKick;
  mat.userData.pitch = uniforms.uPitch;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tSocket = uniforms.tSocket;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uVatInfo = uniforms.uVatInfo;
    shader.uniforms.uKick = uniforms.uKick;
    shader.uniforms.uPitch = uniforms.uPitch;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", SOCK_HEAD + "\n#include <common>")
      .replace("#include <begin_vertex>", `
        float span = max(aAnim.y, 1.0);
        float f = fract(uTime * aAnim.w * uVatInfo.z / span + aAnim.z) * span;
        int frame = int(aAnim.x) + int(floor(f));
        vec3 transformed = (sockAt(frame) * vec4(position, 1.0)).xyz;
        float k = clamp(1.0 - (uTime - aFire) / 0.08, 0.0, 1.0);
        float pitch = k * uPitch;
        float cy = cos(pitch);
        float sy = sin(pitch);
        float y = transformed.y * cy - transformed.z * sy;
        float z = transformed.y * sy + transformed.z * cy;
        transformed.y = y;
        transformed.z = z + k * uKick;
      `);
  };
  mat.customProgramCacheKey = () => "bbr-sock-1" + (color || "");
  return mat;
}

export { boxGeo };
