import * as THREE from "three";
import { toon, pineTexture, skyTexture, writeTRS } from "./mats.js?v=br0";
import { buildTile } from "./build.js?v=br0";

const TILE = 20;
const TILES = 9;

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color(0xe4d4ee);
  scene.fog = new THREE.Fog(0xe4d4ee, 50, 130);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(240, 20, 14),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, depthWrite: false, fog: false })
  );
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  group.add(sky);

  const key = new THREE.DirectionalLight(0xffe2b0, 1.45);
  const rim = new THREE.DirectionalLight(0xf4e6c3, 0.9);
  const hemi = new THREE.HemisphereLight(0xc9b8e6, 0x5d7a48, 0.62);
  scene.add(key, key.target, rim, rim.target, hemi);

  const waterUniforms = { uTime: { value: 0 } };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 980, 1, 1),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: waterUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec3 vW;
        void main() {
          vec3 p = position;
          p.z += sin(position.x * 0.35 + uTime * 0.8) * 0.04;
          vec4 w = modelMatrix * vec4(p, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vW;
        void main() {
          float n = sin(vW.x * 0.55 + uTime) * sin(vW.z * 0.42 - uTime * 1.3);
          vec3 deep = vec3(0.08, 0.32, 0.4);
          vec3 teal = vec3(0.18, 0.56, 0.64);
          vec3 col = mix(deep, teal, n * 0.5 + 0.5);
          float sp = sin(vW.x * 3.1 + uTime * 2.4) * sin(vW.z * 2.7 - uTime * 1.7);
          col += smoothstep(0.86, 1.0, sp) * vec3(0.75, 0.9, 0.95);
          gl_FragColor = vec4(col, 0.94);
        }
      `,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -1.35, -420);
  water.frustumCulled = false;
  group.add(water);

  const shoreMat = toon("#6E8B52");
  const shoreGeo = new THREE.BoxGeometry(18, 0.4, 860);
  const shoreL = new THREE.Mesh(shoreGeo, shoreMat);
  const shoreR = new THREE.Mesh(shoreGeo, shoreMat);
  shoreL.position.set(-20, -0.85, -400);
  shoreR.position.set(20, -0.85, -400);
  group.add(shoreL, shoreR);

  const tile = new THREE.InstancedMesh(buildTile(), toon("#ffffff", { vertexColors: true }), TILES);
  tile.frustumCulled = false;
  tile.count = TILES;
  group.add(tile);

  const bulb = new THREE.SphereGeometry(0.16, 6, 4);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe1a0 });
  const lanterns = new THREE.InstancedMesh(bulb, bulbMat, TILES * 4);
  lanterns.frustumCulled = false;
  lanterns.count = TILES * 4;
  group.add(lanterns);

  const treeGeo = new THREE.PlaneGeometry(3.4, 5.6);
  const treeMat = toon("#ffffff", { map: pineTexture(), alphaTest: 0.4, side: THREE.DoubleSide });
  const treeCount = 220;
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
  trees.frustumCulled = false;
  trees.count = treeCount;
  const treeX = new Float32Array(treeCount);
  const treeZ = new Float32Array(treeCount);
  const treeS = new Float32Array(treeCount);
  for (let i = 0; i < treeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    treeX[i] = side * (12.4 + (i % 5) * 0.35);
    treeZ[i] = 16 - Math.floor(i / 2) * 7.1;
    treeS[i] = 0.85 + (i % 4) * 0.12;
  }
  group.add(trees);

  const hillGeo = new THREE.SphereGeometry(1, 8, 6);
  const hills = new THREE.InstancedMesh(hillGeo, toon("#4E6A48"), 56);
  hills.frustumCulled = false;
  hills.count = 56;
  const hillM = hills.instanceMatrix.array;
  for (let i = 0; i < 56; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const s = 4.5 + (i % 3);
    writeTRS(hillM, i, side * 18.5, -0.4, 20 - Math.floor(i / 2) * 28, 0, s * 1.4, s * 0.55, s);
  }
  hills.instanceMatrix.needsUpdate = true;
  group.add(hills);

  const treeM = trees.instanceMatrix.array;
  for (let i = 0; i < treeCount; i++) writeTRS(treeM, i, treeX[i], 1.6, treeZ[i], 0, treeS[i], treeS[i], treeS[i]);
  trees.instanceMatrix.needsUpdate = true;

  const tileM = tile.instanceMatrix.array;
  const lanM = lanterns.instanceMatrix.array;

  function follow(x, z, half, time) {
    waterUniforms.uTime.value = time;
    sky.position.set(x, 6, z);
    key.position.set(x - 4.5, 12, z + 10);
    key.target.position.set(x, 0.8, z - 10);
    rim.position.set(x + 2, 7, z - 16);
    rim.target.position.set(x, 1.2, z);
    const dist = -z;
    const base = Math.floor(dist / TILE);
    const sx = half / 5;
    let lantern = 0;
    for (let i = 0; i < TILES; i++) {
      const index = base - 1 + i;
      const origin = -index * TILE;
      writeTRS(tileM, i, 0, 0, origin, 0, sx, 1, 1);
      for (let k = 0; k < 2; k++) {
        const side = k === 0 ? -half : half;
        writeTRS(lanM, lantern++, side, 1.15, origin - 2.2, 0, 1, 1, 1);
        writeTRS(lanM, lantern++, side, 1.15, origin - 12.2, 0, 1, 1, 1);
      }
    }
    tile.instanceMatrix.needsUpdate = true;
    lanterns.instanceMatrix.needsUpdate = true;
  }

  follow(0, 0, 5, 0);
  return { follow };
}
