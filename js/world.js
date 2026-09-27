import * as THREE from "three";
import { toon, pineTexture, skyTexture, writeTRS } from "./mats.js?v=br2";
import { buildTile } from "./build.js?v=br2";

const TILE = 20;
const TILES = 10;
const PYLONS = 28;

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color(0xd7e4ee);
  scene.fog = new THREE.Fog(0xd7e4ee, 45, 140);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 18, 12),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, depthWrite: false, fog: false })
  );
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  group.add(sky);

  const key = new THREE.DirectionalLight(0xffe6c4, 2.2);
  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6b5e4a, 0.6);
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
          vec3 deep = vec3(0.07, 0.22, 0.30);
          vec3 teal = vec3(0.18, 0.431, 0.525);
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
  group.add(tile);

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
  foam.count = PYLONS;
  group.add(foam);

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
  const bulbM = bulbs.instanceMatrix.array;
  const pyM = pylons.instanceMatrix.array;
  const foM = foam.instanceMatrix.array;

  function follow(x, z, half, time, river, damScale, theme) {
    waterUniforms.uTime.value = time;
    const drop = river || 0;
    const scale = damScale || 1;
    water.position.y = -1.2 + drop;
    dam.position.set(0, drop, z - 96);
    dam.scale.set(scale, scale, scale);
    sky.position.set(x, 8, z);
    key.position.set(x - 12, 22, z - 18);
    key.target.position.set(x, 1.2, z - 8);
    const dist = -z;
    const base = Math.floor(dist / TILE);
    const sx = half / 5;
    let bulbI = 0;
    for (let i = 0; i < TILES; i++) {
      const index = base - 1 + i;
      const origin = -index * TILE;
      writeTRS(tileM, i, 0, 0, origin, 0, sx, 1, 1);
      writeTRS(bulbM, bulbI++, -4.7 * sx, 2.55, origin - 10, 0, 1, 1, 1);
      writeTRS(bulbM, bulbI++, 4.7 * sx, 2.55, origin - 10, 0, 1, 1, 1);
    }
    const pBase = Math.floor(dist / 25);
    for (let i = 0; i < PYLONS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const index = pBase - 1 + ((i / 2) | 0);
      const pz = -index * 25;
      const px = side * (7.4 + (half - 5) * 0.3);
      writeTRS(pyM, i, px, -0.2 + drop, pz, 0, 1, 1, 1);
      writeTRS(foM, i, px, -0.85 + drop, pz, 0, 1, 1, 1);
    }
    tile.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;
    pylons.instanceMatrix.needsUpdate = true;
    foam.instanceMatrix.needsUpdate = true;
    theme;
  }

  follow(0, 0, 5, 0);
  return { follow };
}
