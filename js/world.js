import * as THREE from "three";
import { toon, pineTexture, skyTexture, goldenSkyTexture, writeTRS } from "./mats.js?v=br7";
import { buildTile } from "./build.js?v=br7";

const TILE = 20;
const TILES = 10;
const PYLONS = 28;

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color(0xc5d4df);
  scene.fog = new THREE.Fog(0xc5d5e0, 60, 260);

  const runSky = skyTexture();
  const warmSky = goldenSkyTexture();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 18, 12),
    new THREE.MeshBasicMaterial({ map: runSky, side: THREE.BackSide, depthWrite: false, fog: false })
  );
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  group.add(sky);

  const key = new THREE.DirectionalLight(0xffe6c4, 2.2);
  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6b5e4a, 0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 52;
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 20;
  key.shadow.camera.bottom = -10;
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
          vec3 deep = vec3(0.302, 0.435, 0.498);
          vec3 teal = vec3(0.498, 0.639, 0.690);
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
  const edgeM = edges.instanceMatrix.array;
  const bulbM = bulbs.instanceMatrix.array;
  const pyM = pylons.instanceMatrix.array;
  const foM = foam.instanceMatrix.array;

  let titleMood = 0;
  function setTitleMood(on) {
    titleMood = on ? 1 : 0;
  }

  function follow(x, z, half, time, river, damScale, theme) {
    waterUniforms.uTime.value = time;
    const drop = river || 0;
    const scale = damScale || 1;
    water.position.y = -1.2 + drop;
    dam.position.set(0, drop, z - 96);
    dam.scale.set(scale, scale, scale);
    sky.position.set(x, 8, z);
    if (titleMood) {
      key.color.setHex(0xff7a32);
      key.intensity = 3.15;
      key.position.set(x + 16, 4.6, z + 14);
      key.target.position.set(x - 1.2, 0.7, z - 10);
      hemi.color.setHex(0xffb090);
      hemi.groundColor.setHex(0x5a3020);
      hemi.intensity = 0.5;
      scene.background.setHex(0xf29a78);
      if (scene.fog) {
        scene.fog.color.setHex(0xf0b48a);
        scene.fog.near = 26;
        scene.fog.far = 96;
      }
      if (sky.material.map !== warmSky) sky.material.map = warmSky;
      key.shadow.camera.left = -18;
      key.shadow.camera.right = 18;
      key.shadow.camera.top = 24;
      key.shadow.camera.bottom = -16;
      key.shadow.camera.far = 72;
      key.shadow.camera.updateProjectionMatrix();
    } else {
      key.color.setHex(0xffe6c4);
      key.intensity = 2.2;
      key.position.set(x - 12, 22, z - 18);
      key.target.position.set(x, 1.2, z - 18);
      hemi.color.setHex(0xcfe3ff);
      hemi.groundColor.setHex(0x6b5e4a);
      hemi.intensity = 0.6;
      scene.background.setHex(0xc5d4df);
      if (scene.fog && scene.fog.far < 200) {
        scene.fog.color.setHex(0xc5d5e0);
        scene.fog.near = 60;
        scene.fog.far = 260;
      }
      if (sky.material.map !== runSky) sky.material.map = runSky;
      key.shadow.camera.left = -12;
      key.shadow.camera.right = 12;
      key.shadow.camera.top = 20;
      key.shadow.camera.bottom = -10;
      key.shadow.camera.far = 52;
      key.shadow.camera.updateProjectionMatrix();
    }
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
    const pBase = Math.floor(dist / 25);
    for (let i = 0; i < PYLONS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const index = pBase - 1 + ((i / 2) | 0);
      const pz = -index * 25;
      const px = side * (half + 2.15);
      writeTRS(pyM, i, px, -0.2 + drop, pz, 0, 1, 1, 1);
      writeTRS(foM, i, px, -0.85 + drop, pz, 0, 1, 1, 1);
    }
    tile.instanceMatrix.needsUpdate = true;
    edges.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;
    pylons.instanceMatrix.needsUpdate = true;
    foam.instanceMatrix.needsUpdate = true;
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
        const shore = 6.5 + kit.halfX * kit.s + (c % 3) * 1.1;
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
    if (env.concrete) {
      tile.material = new THREE.MeshStandardMaterial({
        color: 0xa9b7c2,
        map: env.concrete,
        normalMap: env.concreteNor || null,
        aoMap: env.concreteArm || null,
        roughnessMap: env.concreteArm || null,
        metalnessMap: env.concreteArm || null,
        roughness: 1,
        metalness: 1,
        vertexColors: true,
      });
      const tint = tile.geometry.getAttribute("color");
      if (tint) {
        for (let i = 0; i < tint.count; i++) {
          const lum = (tint.getX(i) + tint.getY(i) + tint.getZ(i)) / 3;
          if (lum < 0.42) tint.setXYZ(i, 0.55, 0.58, 0.62);
          else tint.setXYZ(i, 1, 1, 1);
        }
        tint.needsUpdate = true;
      }
      tile.receiveShadow = true;
    }
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
        color: 0x66899a,
        normalMap: env.water,
        roughness: 0.2,
        metalness: 0.64,
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
