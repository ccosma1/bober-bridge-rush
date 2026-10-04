import * as THREE from "three";
import { toon, pineTexture, skyTexture, goldenSkyTexture, writeTRS } from "./mats.js?v=br20";
import { buildTile } from "./build.js?v=br20";

const TILE = 20;
const TILES = 10;
const PYLONS = 28;

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color(0x9fd4f5);
  scene.fog = new THREE.Fog(0xc5e4f5, 80, 320);

  const runSky = skyTexture();
  const warmSky = goldenSkyTexture();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 18, 12),
    new THREE.MeshBasicMaterial({ map: runSky, side: THREE.BackSide, depthWrite: false, fog: false })
  );
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  group.add(sky);

  const key = new THREE.DirectionalLight(0xfff4e0, 2.6);
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a9390, 0.85);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 80;
  key.shadow.camera.left = -16;
  key.shadow.camera.right = 16;
  key.shadow.camera.top = 24;
  key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0008;
  scene.add(key, key.target, hemi);

  const waterUniforms = { uTime: { value: 0 } };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 1700, 1, 1),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: waterUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec3 vW;
        void main() {
          vec3 p = position;
          p.z += sin(position.x * 0.45 + uTime * 0.9) * 0.06;
          vec4 w = modelMatrix * vec4(p, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vW;
        void main() {
          float n = sin(vW.x * 0.62 + uTime * 1.1) * sin(vW.z * 0.48 - uTime * 1.4);
          vec3 deep = vec3(0.12, 0.48, 0.82);
          vec3 teal = vec3(0.28, 0.72, 0.95);
          vec3 col = mix(deep, teal, n * 0.5 + 0.5);
          float rip = sin(vW.x * 1.15 + vW.z * 0.37 + uTime * 1.3);
          float rip2 = sin(vW.z * 0.83 - vW.x * 0.21 - uTime * 0.9);
          float glint = smoothstep(0.93, 1.0, rip * rip2) * smoothstep(0.15, 0.7, sin(vW.x * 0.17 + vW.z * 0.11));
          col += glint * vec3(1.0, 0.96, 0.82) * 0.75;
          gl_FragColor = vec4(col, 0.96);
        }
      `,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -1.2, -560);
  water.frustumCulled = false;
  group.add(water);

  const deckFlowUniforms = { uTime: { value: 0 } };
  const deckFlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.85, 90),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: deckFlowUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float flow = sin(vUv.y * 48.0 - uTime * 1.6) * 0.5 + 0.5;
          float flow2 = sin(vUv.x * 18.0 + vUv.y * 22.0 - uTime * 0.9);
          float band = smoothstep(0.35, 0.85, flow) * 0.55;
          vec3 col = mix(vec3(0.45, 0.72, 0.86), vec3(0.82, 0.94, 1.0), band);
          float alpha = 0.22 + flow2 * 0.06 + band * 0.1;
          float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          gl_FragColor = vec4(col, alpha * edge);
        }
      `,
    })
  );
  deckFlow.rotation.x = -Math.PI / 2;
  deckFlow.position.set(0, 0.345, 0);
  deckFlow.frustumCulled = false;
  deckFlow.renderOrder = 1;
  deckFlow.visible = false;
  group.add(deckFlow);

  const dam = new THREE.Group();
  const segN = 16;
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(3.4, 16, 2.4), toon("#C9C3B4"), segN);
  wall.frustumCulled = false;
  const wM = wall.instanceMatrix.array;
  for (let i = 0; i < segN; i++) {
    const a = -0.72 + (i / (segN - 1)) * 1.44;
    const x = Math.sin(a) * 26;
    const z = (Math.cos(a) - 1) * 14;
    writeTRS(wM, i, x, 8, z, -a, 1, 1, 1);
  }
  wall.instanceMatrix.needsUpdate = true;
  const lip = new THREE.InstancedMesh(new THREE.BoxGeometry(3.6, 1.1, 3.1), toon("#B7B1A4"), segN);
  lip.frustumCulled = false;
  const lM = lip.instanceMatrix.array;
  for (let i = 0; i < segN; i++) {
    const a = -0.72 + (i / (segN - 1)) * 1.44;
    writeTRS(lM, i, Math.sin(a) * 26, 16.4, (Math.cos(a) - 1) * 14, -a, 1, 1, 1);
  }
  lip.instanceMatrix.needsUpdate = true;
  const spillMat = new THREE.MeshBasicMaterial({
    color: 0xd5e8f2,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    toneMapped: false,
  });
  const spills = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.7, 12), spillMat, 5);
  spills.frustumCulled = false;
  const sM = spills.instanceMatrix.array;
  for (let i = 0; i < 5; i++) {
    const a = -0.45 + i * 0.22;
    writeTRS(sM, i, Math.sin(a) * 26, 8, (Math.cos(a) - 1) * 14 + 1.4, -a, 1, 1, 1);
  }
  spills.instanceMatrix.needsUpdate = true;
  dam.add(wall, lip, spills);
  group.add(dam);

  const tile = new THREE.InstancedMesh(buildTile(), toon("#ffffff", { vertexColors: true }), TILES);
  tile.frustumCulled = false;
  tile.count = TILES;
  tile.receiveShadow = true;
  group.add(tile);
  const edges = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.14, 0.03, 20),
    new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.55, metalness: 0 }),
    TILES * 2
  );
  edges.frustumCulled = false;
  edges.count = TILES * 2;
  edges.receiveShadow = true;
  group.add(edges);

  const bulb = new THREE.SphereGeometry(0.16, 6, 4);
  const bulbs = new THREE.InstancedMesh(
    bulb,
    new THREE.MeshBasicMaterial({ color: 0xffe6c4, toneMapped: false }),
    TILES * 2
  );
  bulbs.frustumCulled = false;
  bulbs.count = TILES * 2;
  group.add(bulbs);

  const pylonGeo = new THREE.BoxGeometry(1.3, 2.4, 1.3);
  const pylons = new THREE.InstancedMesh(pylonGeo, toon("#A39C90"), PYLONS);
  pylons.frustumCulled = false;
  pylons.count = PYLONS;
  group.add(pylons);
  const foam = new THREE.InstancedMesh(
    new THREE.TorusGeometry(1.15, 0.12, 5, 10),
    new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }),
    PYLONS
  );
  foam.frustumCulled = false;
  foam.count = 0;
  foam.visible = false;
  group.add(foam);

  const SPAN = 26;
  const T_N = 12;
  const SEG = 8;
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 16, 0.46), toon("#E23B32"), T_N * 2);
  posts.frustumCulled = false;
  posts.count = T_N * 2;
  group.add(posts);
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.28, 0.36), toon("#E23B32"), T_N);
  beams.frustumCulled = false;
  beams.count = T_N;
  group.add(beams);
  const cables = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 1), toon("#6E1814"), T_N * 2 * SEG);
  cables.frustumCulled = false;
  cables.count = T_N * 2 * SEG;
  group.add(cables);
  const hangs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 1, 0.045), toon("#8A2420"), T_N * 2 * SEG);
  hangs.frustumCulled = false;
  hangs.count = T_N * 2 * SEG;
  group.add(hangs);
  const postMA = posts.instanceMatrix.array;
  const beamMA = beams.instanceMatrix.array;
  const cableMA = cables.instanceMatrix.array;
  const hangMA = hangs.instanceMatrix.array;

  const treeGeo = new THREE.PlaneGeometry(3.2, 6.2);
  const trees = new THREE.InstancedMesh(
    treeGeo,
    toon("#ffffff", { map: pineTexture(), alphaTest: 0.35, side: THREE.DoubleSide }),
    80
  );
  trees.frustumCulled = false;
  trees.count = 80;
  group.add(trees);
  const treeM = trees.instanceMatrix.array;
  for (let i = 0; i < 80; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const layer = (i / 2) % 3;
    const x = side * (16 + layer * 4.5 + (i % 3) * 0.4);
    const z = 30 - Math.floor(i / 2) * 18;
    const sc = 1.1 + layer * 0.35;
    writeTRS(treeM, i, x, 1.2 + layer * 0.4, z, 0, sc, sc * (1.1 + layer * 0.15), sc);
  }
  trees.instanceMatrix.needsUpdate = true;

  const hillCols = [toon("#8E9EA4"), toon("#A7B4B8"), toon("#7E929C")];
  const hills = [];
  for (let layer = 0; layer < 3; layer++) {
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), hillCols[layer], 18);
    mesh.frustumCulled = false;
    mesh.count = 18;
    const m = mesh.instanceMatrix.array;
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const s = 8 + layer * 3 + (i % 3);
      writeTRS(m, i, side * (32 + layer * 12), -6.5 - layer * 2.2, 70 - Math.floor(i / 2) * 58 - layer * 14, 0, s * 1.15, s * 1.7, s * 1.05);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    hills.push(mesh);
  }

  const tileM = tile.instanceMatrix.array;
  const edgeM = edges.instanceMatrix.array;
  const bulbM = bulbs.instanceMatrix.array;
  const pyM = pylons.instanceMatrix.array;
  const foM = foam.instanceMatrix.array;

  const _proj = new THREE.Vector3();
  const _fwd = new THREE.Vector3();

  function writeCable(el, i, x, y, z, pitch, len) {
    const c = Math.cos(pitch);
    const s = Math.sin(pitch);
    const o = i * 16;
    el[o] = 1;
    el[o + 1] = 0;
    el[o + 2] = 0;
    el[o + 3] = 0;
    el[o + 4] = 0;
    el[o + 5] = c;
    el[o + 6] = s;
    el[o + 7] = 0;
    el[o + 8] = 0;
    el[o + 9] = -s * len;
    el[o + 10] = c * len;
    el[o + 11] = 0;
    el[o + 12] = x;
    el[o + 13] = y;
    el[o + 14] = z;
    el[o + 15] = 1;
  }

  let titleMood = 0;
  function setTitleMood(on) {
    titleMood = on ? 1 : 0;
  }

  function follow(x, z, half, time, river, damScale, theme, cam) {
    waterUniforms.uTime.value = time;
    deckFlowUniforms.uTime.value = time;
    deckFlow.position.set(0, 0.345, z - 18);
    const drop = river || 0;
    const scale = damScale || 1;
    water.position.y = -1.2 + drop;
    dam.position.set(0, drop - 8, z - 220);
    dam.scale.set(scale * 0.5, scale * 0.5, scale * 0.5);
    sky.position.set(x, 8, z);
    titleMood;
    warmSky;
    key.color.setHex(0xfff4e0);
    key.intensity = 2.6;
    key.position.set(x - 10, 24, z + 14);
    key.target.position.set(x, 0.5, z - 24);
    hemi.color.setHex(0xcfe6ff);
    hemi.groundColor.setHex(0x8a9390);
    hemi.intensity = 0.85;
    scene.background.setHex(0x9fd4f5);
    if (scene.fog) {
      scene.fog.color.setHex(0xc5e4f5);
      scene.fog.near = 80;
      scene.fog.far = 320;
    }
    if (sky.material.map !== runSky) sky.material.map = runSky;
    key.shadow.camera.left = -16;
    key.shadow.camera.right = 16;
    key.shadow.camera.top = 24;
    key.shadow.camera.bottom = -16;
    key.shadow.camera.far = 80;
    key.shadow.camera.updateProjectionMatrix();
    const dist = -z;
    const base = Math.floor(dist / TILE);
    const sx = half / 5;
    let bulbI = 0;
    for (let i = 0; i < TILES; i++) {
      const index = base - 1 + i;
      const origin = -index * TILE;
      writeTRS(tileM, i, 0, 0, origin, 0, sx, 1, 1);
      writeTRS(edgeM, i * 2, -4.7 * sx, 0.31, origin - 10, 0, 1, 1, 1);
      writeTRS(edgeM, i * 2 + 1, 4.7 * sx, 0.31, origin - 10, 0, 1, 1, 1);
      writeTRS(bulbM, bulbI++, -4.7 * sx, 2.55, origin - 10, 0, 1, 1, 1);
      writeTRS(bulbM, bulbI++, 4.7 * sx, 2.55, origin - 10, 0, 1, 1, 1);
    }
    pylons.count = 0;
    pylons.visible = false;
    foam.count = 0;
    foam.visible = false;
    bulbs.count = 0;
    bulbs.visible = false;
    edges.count = 0;
    edges.visible = false;
    const deckAhead = -(base + TILES - 1) * TILE;
    const deckBehind = -(base - 1) * TILE;
    const onDeck = (pz) => pz <= deckBehind - 1 && pz >= deckAhead + 1;
    const tBase = Math.floor(dist / SPAN);
    const desktop = !!(cam && cam.aspect > 1.2 && cam.fov < 50);
    const tooClose = (pz) => !!(cam && Math.abs(pz - cam.position.z) < 2.2);
    const beamAbove = cam ? cam.position.y + 2.6 : 14.2;
    if (!desktop) {
      for (let i = 0; i < T_N; i++) {
        const tz = -(tBase - 1 + i) * SPAN;
        const tx = half + 0.05;
        const towerOn = onDeck(tz) && !tooClose(tz);
        if (towerOn) {
          writeTRS(postMA, i * 2, -tx, 8, tz, 0, 1, 1, 1);
          writeTRS(postMA, i * 2 + 1, tx, 8, tz, 0, 1, 1, 1);
        } else {
          writeTRS(postMA, i * 2, 0, -40, 0, 0, 0, 0, 0);
          writeTRS(postMA, i * 2 + 1, 0, -40, 0, 0, 0, 0, 0);
        }
        const ahead = -tz - dist;
        const beamY = Math.max(15.6, beamAbove);
        const showBeam = towerOn && beamY >= beamAbove && (ahead < -8 || ahead > 18);
        const bw = showBeam ? half * 2 + 0.9 : 0;
        if (showBeam) writeTRS(beamMA, i, 0, beamY, tz, 0, bw, 1, 1);
        else writeTRS(beamMA, i, 0, -40, 0, 0, 0, 0, 0);
        for (let side = 0; side < 2; side++) {
          const cx = side === 0 ? -tx : tx;
          for (let s = 0; s < SEG; s++) {
            const idx = (i * 2 + side) * SEG + s;
            const u0 = s / SEG;
            const u1 = (s + 1) / SEG;
            const z0 = tz - u0 * SPAN;
            const z1 = tz - u1 * SPAN;
            if (!onDeck(z0) || !onDeck(z1) || tooClose((z0 + z1) * 0.5)) {
              writeTRS(cableMA, idx, 0, -40, 0, 0, 0, 0, 0);
              writeTRS(hangMA, idx, 0, -40, 0, 0, 0, 0, 0);
              continue;
            }
            const y0 = 15.7 - Math.sin(u0 * Math.PI) * 9.4;
            const y1 = 15.7 - Math.sin(u1 * Math.PI) * 9.4;
            const dy = y1 - y0;
            const dz = z1 - z0;
            const len = Math.hypot(dy, dz) || 0.001;
            writeCable(cableMA, idx, cx, (y0 + y1) * 0.5, (z0 + z1) * 0.5, Math.atan2(-dy, dz), len);
            const dropH = Math.max(0.3, (y0 + y1) * 0.5 - 1.05);
            writeTRS(hangMA, idx, cx, 1.05 + dropH * 0.5, (z0 + z1) * 0.5, 0, 1, dropH, 1);
          }
        }
      }
    } else {
      cam.getWorldDirection(_fwd);
      const cx0 = cam.position.x;
      const cy0 = cam.position.y;
      const cz0 = cam.position.z;
      const inFront = (px, py, pz) => (px - cx0) * _fwd.x + (py - cy0) * _fwd.y + (pz - cz0) * _fwd.z > 1.5;
      const normSy = (px, py, pz) => {
        _proj.set(px, py, pz).project(cam);
        return (1 - _proj.y) * 0.5;
      };
      const tops = new Array(T_N);
      for (let i = 0; i < T_N; i++) {
        const tz = -(tBase - 1 + i) * SPAN;
        const tx = half + 0.05;
        if (!onDeck(tz) || !inFront(tx, 1, tz) || normSy(tx, 0.4, tz) < 0.1) {
          tops[i] = 0;
          continue;
        }
        let lo = 0.4;
        let hi = 16;
        for (let k = 0; k < 8; k++) {
          const mid = (lo + hi) * 0.5;
          if (normSy(tx, mid, tz) >= 0.1) lo = mid;
          else hi = mid;
        }
        tops[i] = lo >= 3.2 ? lo : 0;
      }
      for (let i = 0; i < T_N; i++) {
        const tz = -(tBase - 1 + i) * SPAN;
        const tx = half + 0.05;
        const top = tops[i] > 0 && !tooClose(tz) ? tops[i] : 0;
        if (top > 0) {
          const sy = top / 16;
          writeTRS(postMA, i * 2, -tx, top * 0.5, tz, 0, 1, sy, 1);
          writeTRS(postMA, i * 2 + 1, tx, top * 0.5, tz, 0, 1, sy, 1);
        } else {
          writeTRS(postMA, i * 2, 0, -40, 0, 0, 0, 0, 0);
          writeTRS(postMA, i * 2 + 1, 0, -40, 0, 0, 0, 0, 0);
        }
        const ahead = -tz - dist;
        const beamY = Math.max(15.6, beamAbove);
        const showBeam = top >= beamY - 0.4 && (ahead < -8 || ahead > 18);
        if (showBeam) writeTRS(beamMA, i, 0, beamY, tz, 0, half * 2 + 0.9, 1, 1);
        else writeTRS(beamMA, i, 0, -40, 0, 0, 0, 0, 0);
        const farTop = i + 1 < T_N ? tops[i + 1] : 0;
        const spanOn = top > 0 && farTop > 0;
        const crown0 = top - 0.2;
        const crown1 = farTop - 0.2;
        const sag = spanOn ? Math.min(4.2, Math.max(0.6, (crown0 + crown1) * 0.5 - 1.85)) : 0;
        for (let side = 0; side < 2; side++) {
          const cx = side === 0 ? -tx : tx;
          for (let s = 0; s < SEG; s++) {
            const idx = (i * 2 + side) * SEG + s;
            const u0 = s / SEG;
            const u1 = (s + 1) / SEG;
            const z0 = tz - u0 * SPAN;
            const z1 = tz - u1 * SPAN;
            if (!spanOn || !onDeck(z0) || !onDeck(z1) || tooClose((z0 + z1) * 0.5)) {
              writeTRS(cableMA, idx, 0, -40, 0, 0, 0, 0, 0);
              writeTRS(hangMA, idx, 0, -40, 0, 0, 0, 0, 0);
              continue;
            }
            const y0 = crown0 + (crown1 - crown0) * u0 - Math.sin(u0 * Math.PI) * sag;
            const y1 = crown0 + (crown1 - crown0) * u1 - Math.sin(u1 * Math.PI) * sag;
            const dy = y1 - y0;
            const dz = z1 - z0;
            const len = Math.hypot(dy, dz) || 0.001;
            writeCable(cableMA, idx, cx, (y0 + y1) * 0.5, (z0 + z1) * 0.5, Math.atan2(-dy, dz), len * 1.08);
            writeTRS(hangMA, idx, 0, -40, 0, 0, 0, 0, 0);
          }
        }
      }
    }
    tile.instanceMatrix.needsUpdate = true;
    posts.instanceMatrix.needsUpdate = true;
    beams.instanceMatrix.needsUpdate = true;
    cables.instanceMatrix.needsUpdate = true;
    hangs.instanceMatrix.needsUpdate = true;
    pyM;
    foM;
    if (water.material.normalMap) {
      water.material.normalMap.offset.set((time * 0.03) % 1, (time * 0.015) % 1);
    }
    for (let c = 0; c < cityKits.length; c++) {
      const kit = cityKits[c];
      const arr = kit.mesh.instanceMatrix.array;
      for (let k = 0; k < kit.count; k++) {
        const row = k;
        const side = (c + k) % 2 === 0 ? -1 : 1;
        const depth = (row === 0 ? 88 : 168) + (c % 5) * 10;
        const shore = half + 14 + kit.halfX * kit.s + (c % 3) * 1.1;
        const cx = side * shore;
        const cz = z - depth;
        const y = -1.15 - kit.minY * kit.s;
        writeTRS(arr, k, cx, y, cz, side < 0 ? 0.15 : -0.15, kit.s, kit.s, kit.s);
      }
      kit.mesh.instanceMatrix.needsUpdate = true;
    }
    theme;
  }

  wall.material = wall.material.clone();
  wall.material.fog = false;
  wall.material.color.lerp(new THREE.Color("#d5dde3"), 0.35);
  lip.material = lip.material.clone();
  lip.material.fog = false;

  const cityRoot = new THREE.Group();
  const cityKits = [];
  group.add(cityRoot);

  function setShadow(width) {
    const n = width < 900 ? 1024 : 2048;
    if (key.shadow.mapSize.x !== n) {
      key.shadow.mapSize.set(n, n);
      key.shadow.needsUpdate = true;
    }
  }

  function applyArt(renderer, env) {
    if (!env) return;
    if (env.concrete) tile.receiveShadow = true;
    if (env.hdr && renderer) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const map = pmrem.fromEquirectangular(env.hdr).texture;
      scene.environment = map;
      scene.environmentIntensity = 0.6;
      env.hdr.dispose();
      pmrem.dispose();
    }
    if (env.water) {
      env.water.wrapS = env.water.wrapT = THREE.RepeatWrapping;
      env.water.repeat.set(4, 16);
      water.material = new THREE.MeshStandardMaterial({
        color: 0x2e92e0,
        normalMap: env.water,
        roughness: 0.32,
        metalness: 0.08,
        transparent: true,
        opacity: 0.94,
      });
    }
    const list = env.city || [];
    const haze = new THREE.Color("#c5d4df");
    for (let i = 0; i < list.length; i++) {
      const src = list[i].scene || list[i];
      const count = 2;
      src.updateMatrixWorld(true);
      const chunks = [];
      src.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        chunks.push(g);
      });
      if (!chunks.length) continue;
      let geo = chunks[0];
      if (chunks.length > 1) {
        let countV = 0;
        for (let c = 0; c < chunks.length; c++) countV += chunks[c].getAttribute("position").count;
        const arr = new Float32Array(countV * 3);
        let o = 0;
        for (let c = 0; c < chunks.length; c++) {
          const p = chunks[c].getAttribute("position").array;
          arr.set(p, o);
          o += p.length;
        }
        geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        geo.computeVertexNormals();
      }
      geo.computeBoundingBox();
      const box = geo.boundingBox;
      const sizeY = Math.max(0.2, box.max.y - box.min.y);
      const height = 8 + (i % 5) * 2;
      const s = height / sizeY;
      const matSrc = new THREE.MeshStandardMaterial({ color: 0xb7c3c9, roughness: 0.8 });
      src.traverse((o) => {
        if (o.isMesh && o.material && o.material.color) matSrc.color.copy(o.material.color);
      });
      matSrc.fog = false;
      matSrc.color.lerp(haze, i > 7 ? 0.42 : 0.18);
      const mesh = new THREE.InstancedMesh(geo, matSrc, count);
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      cityKits.push({
        mesh,
        count,
        s,
        minY: box.min.y,
        halfX: (box.max.x - box.min.x) * 0.5,
      });
      cityRoot.add(mesh);
    }
    if (cityKits.length) {
      trees.visible = false;
      for (let h = 0; h < hills.length; h++) hills[h].visible = false;
    }
  }

  follow(0, 0, 3, 0);
  return { follow, applyArt, setShadow, setTitleMood };
}
