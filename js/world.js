import * as THREE from "three";
import { toon, pineTexture, skyTexture, writeTRS } from "./mats.js?v=br1";
import { buildTile } from "./build.js?v=br1";

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
    new THREE.PlaneGeometry(90, 1600, 1, 1),
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
  water.position.set(0, -1.35, -520);
  water.frustumCulled = false;
  group.add(water);

  const shoreMat = toon("#6E8B52");
  const shoreGeo = new THREE.BoxGeometry(18, 0.4, 1500);
  const shoreL = new THREE.Mesh(shoreGeo, shoreMat);
  const shoreR = new THREE.Mesh(shoreGeo, shoreMat);
  shoreL.position.set(-20, -0.85, -520);
  shoreR.position.set(20, -0.85, -520);
  group.add(shoreL, shoreR);

  const mudMat = toon("#5A4638");
  const mudGeo = new THREE.BoxGeometry(2.4, 0.9, 1500);
  const mudL = new THREE.Mesh(mudGeo, mudMat);
  const mudR = new THREE.Mesh(mudGeo, mudMat);
  mudL.position.set(-6.6, -1.75, -520);
  mudR.position.set(6.6, -1.75, -520);
  group.add(mudL, mudR);

  const dam = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 11, 2.2), toon("#C8C2B4"));
  wall.position.y = 4.2;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.6, 2.6), toon("#A8A090"));
  lip.position.y = 9.6;
  const streak = new THREE.Mesh(new THREE.BoxGeometry(1.1, 8, 0.2), toon("#8A7A68"));
  streak.position.set(-3.2, 4, 1.2);
  const streak2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.5, 0.2), toon("#7A6A58"));
  streak2.position.set(2.4, 3.2, 1.2);
  dam.add(wall, lip, streak, streak2);
  const steps = new THREE.InstancedMesh(new THREE.BoxGeometry(7, 0.28, 1.4), toon("#B7B1A4"), 6);
  steps.frustumCulled = false;
  const stepM = steps.instanceMatrix.array;
  for (let i = 0; i < 6; i++) writeTRS(stepM, i, 0, -0.4 - i * 0.28, 2.2 + i * 1.5, 0, 1, 1, 1);
  steps.instanceMatrix.needsUpdate = true;
  dam.add(steps);
  group.add(dam);

  const tileMat = toon("#ffffff", { vertexColors: true });
  const tile = new THREE.InstancedMesh(buildTile(), tileMat, TILES);
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

  function follow(x, z, half, time, river, damScale, theme) {
    waterUniforms.uTime.value = time;
    const drop = river || 0;
    const look = theme || 0;
    water.position.y = -1.35 + drop;
    const scale = damScale || 1;
    dam.position.set(look >= 2 ? 7.5 : 0, drop, z - (look >= 2 ? 28 : 78));
    dam.scale.set(scale, scale, scale);
    steps.visible = look >= 1;
    if (look >= 2) tileMat.color.set("#C9C3B6");
    else if (look >= 1) tileMat.color.set("#DDD6CC");
    else tileMat.color.set("#ffffff");
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
