import * as THREE from "three";
import { BUILD, highestPlayable, isUnlockedLevel } from "./rules.js?v=br1";
import { createWorld } from "./world.js?v=br1";
import { createPlay } from "./play.js?v=br1";
import { createAudio } from "./audio.js?v=br1";
import { loadSave, rememberWin, rememberGun, writeSave } from "./save.js?v=br1";
import { drawWeaponIcon, setTime } from "./mats.js?v=br1";

const save = loadSave();
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  powerPreference: "high-performance",
  stencil: false,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0xe4d4ee, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.2, 360);
const world = createWorld(scene);
const audio = createAudio();
const play = createPlay(scene, camera, audio);

const hud = document.getElementById("hud");
const title = document.getElementById("title");
const result = document.getElementById("result");
const pauseCard = document.getElementById("pause-card");
const boot = document.getElementById("boot");
const tip = document.getElementById("tip");
const chip = document.getElementById("chip");
const banner = document.getElementById("squad-banner");
const flash = document.getElementById("flash");
const dbg = document.getElementById("dbg");
const barFill = document.getElementById("bar-fill");
const barLabel = document.getElementById("bar-label");
const boberRun = document.getElementById("bober-run");
const boberTotal = document.getElementById("bober-total");
const chipName = document.getElementById("chip-name");
const chipTier = document.getElementById("chip-tier");
const chipCanvas = document.getElementById("chip-icon");
const chipCtx = chipCanvas.getContext("2d");
const resultTitle = document.getElementById("result-title");
const resultCopy = document.getElementById("result-copy");
const resultEarn = document.getElementById("result-earn");
const stars = document.getElementById("stars");
const nextBtn = document.getElementById("btn-next");
const muteBtn = document.getElementById("btn-mute");
const introEl = document.getElementById("intro");
const toastEl = document.getElementById("toast");
const barkEl = document.getElementById("bark");
const levelName = document.getElementById("level-name");
const chipFamily = document.getElementById("chip-family");
const wordEls = document.querySelectorAll("#words .word");
const LEVEL_TILES = ["1-1", "1-2", "1-3"];

let mode = "title";
let hold = false;
let renderScale = 1;
let armed = 0;
let dynAcc = 0;
let dynN = 0;
let dynT = 0;
let fpsAcc = 0;
let fpsN = 0;
let fpsShow = 60;
let showDbg = false;
let tipUntil = 0;
let lastWeapon = "";
let lastTier = 0;
let introLeft = 0;
let queuedLevel = "";
let pointerId = null;
let lastPX = 0;
const taps = [];
const bannerV = new THREE.Vector3();

document.getElementById("build-tag").textContent = BUILD;
boberTotal.textContent = "$BOBER " + save.bober;
boberRun.textContent = "$BOBER " + save.bober;
audio.setMuted(save.settings.mute);
muteBtn.textContent = save.settings.mute ? "Muted" : "Sound";
muteBtn.setAttribute("aria-pressed", save.settings.mute ? "true" : "false");

play.setHooks({
  win(info) {
    save.bober += info.earned;
    rememberWin(save, info.levelId, info.stars);
    paintLevels();
    showResult(true, info);
  },
  lose() {
    showResult(false, null);
  },
  seen(id) {
    rememberGun(save, id);
  },
});

function showResult(won, info) {
  mode = won ? "win" : "lose";
  audio.endFire();
  hud.classList.add("hidden");
  chip.classList.add("hidden");
  tip.classList.add("hidden");
  banner.classList.add("hidden");
  pauseCard.classList.add("hidden");
  introEl.classList.add("hidden");
  toastEl.classList.add("hidden");
  barkEl.classList.add("hidden");
  result.classList.remove("hidden");
  title.classList.add("hidden");
  if (won) {
    resultTitle.textContent = info.winTitle || "BRIDGE HELD!";
    resultCopy.textContent = "Squad " + info.n + " · " + info.kills + " down";
    resultEarn.textContent = "Earned $BOBER " + info.earned;
    nextBtn.classList.remove("hidden");
    if (info.nextId) {
      nextBtn.textContent = "Next";
      nextBtn.disabled = false;
      nextBtn.dataset.level = info.nextId;
    } else {
      nextBtn.textContent = "Chapter 2 coming soon";
      nextBtn.disabled = true;
      nextBtn.dataset.level = "";
    }
    stars.classList.remove("hidden");
    const bits = stars.querySelectorAll("i");
    for (let i = 0; i < bits.length; i++) bits[i].classList.toggle("on", i < info.stars);
    bits[0].parentElement.setAttribute("aria-label", info.stars + " stars");
  } else {
    resultTitle.textContent = "The dam crew needs you!";
    resultCopy.textContent = "";
    resultEarn.textContent = "";
    nextBtn.classList.add("hidden");
    stars.classList.add("hidden");
  }
  boberTotal.textContent = "$BOBER " + save.bober;
  boberRun.textContent = "$BOBER " + save.bober;
}

function starBits(n) {
  const count = Math.max(0, Math.min(3, n | 0));
  return "★★★".slice(0, count) + "☆☆☆".slice(0, 3 - count);
}

function paintLevels() {
  for (let i = 0; i < LEVEL_TILES.length; i++) {
    const id = LEVEL_TILES[i];
    const btn = document.getElementById("lv-" + id);
    if (!btn) continue;
    const open = isUnlockedLevel(id, save.levelsCleared);
    btn.disabled = !open;
    btn.classList.toggle("lock", !open);
    const mark = btn.querySelector(".lv-stars");
    if (mark) {
      const n = save.stars[id] || 0;
      mark.textContent = open ? starBits(n) : "LOCK";
      mark.classList.toggle("earned", open && n > 0);
    }
  }
}

function startRun(id) {
  audio.unlock();
  const levelId = id || queuedLevel || highestPlayable(save.levelsCleared);
  queuedLevel = "";
  play.setLoadout(save);
  play.setLevel(levelId);
  play.start();
  introLeft = 1.2;
  mode = "intro";
  armed = 0;
  document.getElementById("intro-name").textContent = play.view.levelName;
  document.getElementById("intro-line").textContent = play.view.intro;
  introEl.classList.remove("hidden");
  toastEl.classList.add("hidden");
  barkEl.classList.add("hidden");
  title.classList.add("hidden");
  result.classList.add("hidden");
  pauseCard.classList.add("hidden");
  boot.classList.add("hidden");
  hud.classList.remove("hidden");
  chip.classList.remove("hidden");
  banner.classList.remove("hidden");
  flash.classList.add("hidden");
  if (!save.settings.tipSeen) {
    tip.classList.remove("hidden");
    tipUntil = performance.now() + 8000;
  } else {
    tip.classList.add("hidden");
  }
  lastWeapon = "";
  paintHud();
}

function resize() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  const phone = Math.min(w, h) < 700;
  const cap = phone ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, cap) * renderScale;
  camera.userData.viewW = w;
  camera.userData.viewH = h;
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.fov = h >= w ? 58 : 50;
  camera.updateProjectionMatrix();
}

function paintChip() {
  const v = play.view;
  if (v.weaponId === lastWeapon && v.tier === lastTier) return;
  lastWeapon = v.weaponId;
  lastTier = v.tier;
  chipName.textContent = v.weaponName;
  chipTier.textContent = "T" + v.tier + " " + v.tierName;
  chipTier.className = "t" + v.tier;
  chipFamily.textContent = v.family || "";
  chipCtx.clearRect(0, 0, 64, 64);
  chipCtx.fillStyle = "#F4E6C3";
  chipCtx.fillRect(0, 0, 64, 64);
  drawWeaponIcon(chipCtx, v.weaponId, 32, 34, 40);
}

function paintHud() {
  const v = play.view;
  levelName.textContent = v.levelName || "1-1 PINE BRIDGE";
  boberRun.textContent = "$BOBER " + save.bober;
  barFill.style.width = Math.max(0, Math.min(1, v.bar)) * 100 + "%";
  barLabel.textContent = v.barText;
  hud.classList.toggle("boss", v.arena === 1 && mode === "run");
  banner.textContent = String(v.n);
  banner.classList.toggle("big", v.n > 60);
  paintChip();
  if (v.flash && mode !== "intro") {
    flash.textContent = v.flash;
    flash.classList.remove("hidden");
  } else {
    flash.classList.add("hidden");
  }
  if (mode === "run" && v.toastT > 0) {
    toastEl.classList.remove("hidden");
    document.getElementById("toast-name").textContent = v.toastName;
    document.getElementById("toast-line").textContent = v.toastLine;
  } else {
    toastEl.classList.add("hidden");
  }
  if (mode === "run" && v.barkT > 0 && v.bark) {
    barkEl.textContent = v.bark;
    barkEl.classList.remove("hidden");
  } else {
    barkEl.classList.add("hidden");
  }
  if (mode === "run" && !tip.classList.contains("hidden")) {
    if (v.steered || (tipUntil && performance.now() > tipUntil)) {
      tip.classList.add("hidden");
      save.settings.tipSeen = true;
      writeSave(save);
    }
  }
}

function placeBanner() {
  const v = play.view;
  bannerV.set(v.squadX, v.bannerY, v.squadZ);
  bannerV.project(camera);
  if (bannerV.z > 1 || mode !== "run") {
    banner.classList.add("hidden");
    return;
  }
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  banner.classList.remove("hidden");
  banner.style.left = (bannerV.x * 0.5 + 0.5) * w + "px";
  banner.style.top = (-bannerV.y * 0.5 + 0.5) * h + "px";
}

function placeWords() {
  const list = play.view.words;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  for (let i = 0; i < wordEls.length; i++) {
    const item = list ? list[i] : null;
    const el = wordEls[i];
    if (!item || !item.on || (mode !== "run" && mode !== "intro")) {
      el.classList.add("hidden");
      continue;
    }
    bannerV.set(item.x, item.y, item.z);
    bannerV.project(camera);
    if (bannerV.z > 1) {
      el.classList.add("hidden");
      continue;
    }
    el.classList.remove("hidden");
    el.textContent = item.text;
    el.style.left = (bannerV.x * 0.5 + 0.5) * w + "px";
    el.style.top = (-bannerV.y * 0.5 + 0.5) * h + "px";
    el.style.opacity = String(Math.max(0.15, Math.min(1, item.life)));
  }
}

function toggleDbg() {
  showDbg = !showDbg;
  dbg.classList.toggle("hidden", !showDbg);
}

function frame(now) {
  requestAnimationFrame(frame);
  const real = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!hold) {
    if (mode === "intro") {
      introLeft -= real;
      if (introLeft <= 0) {
        introLeft = 0;
        mode = "run";
        introEl.classList.add("hidden");
      }
    } else if (mode === "run" || mode === "pause") {
      if (mode === "run") {
        play.tick(real);
        play.tickReal(real);
        armed += real;
        dynAcc += real * 1000;
        dynN++;
        dynT += real;
        if (dynT >= 1 && armed > 2) {
          const avg = dynAcc / Math.max(1, dynN);
          const prev = renderScale;
          if (avg > 20) renderScale = Math.max(0.6, Math.round((renderScale - 0.1) * 10) / 10);
          else if (avg < 14 && renderScale < 0.999) renderScale = Math.min(1, Math.round((renderScale + 0.1) * 10) / 10);
          dynAcc = 0;
          dynN = 0;
          dynT = 0;
          if (prev !== renderScale) resize();
        }
      }
    } else {
      play.tickTitle(real);
    }
  }
  const v = play.view;
  const camX = v.squadX * 0.4;
  camera.position.set(camX, 9, v.squadZ + 11);
  camera.lookAt(camX, 1.15, v.squadZ - 14);
  camera.updateMatrixWorld();
  world.follow(v.squadX, v.squadZ, v.half, play.time, v.river, v.dam, v.theme);
  setTime(play.time);
  play.sync(camera);
  renderer.render(scene, camera);
  v.calls = renderer.info.render.calls;
  fpsAcc += real;
  fpsN++;
  if (fpsAcc >= 0.4) {
    fpsShow = fpsN / fpsAcc;
    fpsAcc = 0;
    fpsN = 0;
  }
  if (mode === "run" || mode === "pause" || mode === "intro") {
    paintHud();
    placeBanner();
    placeWords();
  }
  if (showDbg) {
    const c = v.counts || [0, 0, 0, 0, 0, 0, 0];
    dbg.textContent =
      "FPS " + fpsShow.toFixed(0) +
      "\nENEMIES " + v.enemies +
      "\nDRAWS " + v.calls +
      "\nSCALE " + renderScale.toFixed(1) +
      "\n" + (v.weaponName || "") + " T" + v.tier + " " + (v.family || "") +
      "\nclog " + c[0] + " suds " + c[1] + " haul " + c[2] +
      "\nhair " + c[3] + " spit " + c[4] + " leaf " + c[5] + " duck " + c[6] +
      "\nG gun   T tier" +
      "\n" + BUILD;
  }
}

let last = performance.now();

function skipIntro() {
  if (mode !== "intro") return;
  introLeft = 0;
  mode = "run";
  introEl.classList.add("hidden");
}

function onPointerDown(e) {
  if (e.target.closest && e.target.closest("button, a")) return;
  if (mode === "intro") {
    skipIntro();
    return;
  }
  if (mode !== "run") return;
  pointerId = e.pointerId;
  lastPX = e.clientX;
  play.pointerDown(true);
}

function onPointerMove(e) {
  if (pointerId !== e.pointerId || mode !== "run") return;
  const dx = e.clientX - lastPX;
  lastPX = e.clientX;
  if (dx) play.drag(dx * play.view.mPerPx);
}

function onPointerUp(e) {
  if (pointerId !== e.pointerId) return;
  pointerId = null;
  play.pointerDown(false);
}

window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyF") toggleDbg();
  if (showDbg && mode === "run" && e.code === "KeyG") play.cycleGun();
  if (showDbg && mode === "run" && e.code === "KeyT") play.bumpTier();
  if (mode !== "run") return;
  if (e.code === "KeyA" || e.code === "ArrowLeft") play.setAxis(-1);
  else if (e.code === "KeyD" || e.code === "ArrowRight") play.setAxis(1);
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyA" || e.code === "ArrowLeft" || e.code === "KeyD" || e.code === "ArrowRight") play.setAxis(0);
});

document.getElementById("btn-start").addEventListener("click", () => startRun(highestPlayable(save.levelsCleared)));
document.getElementById("btn-retry").addEventListener("click", () => startRun(play.view.levelId));
document.getElementById("btn-next").addEventListener("click", () => {
  const id = nextBtn.dataset.level;
  if (!id || nextBtn.disabled) return;
  startRun(id);
});
document.getElementById("level-row").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || btn.disabled) return;
  startRun(btn.dataset.level);
});
document.getElementById("btn-resume").addEventListener("click", () => {
  pauseCard.classList.add("hidden");
  hud.classList.remove("hidden");
  mode = "run";
});
document.getElementById("btn-pause").addEventListener("click", () => {
  if (mode !== "run") return;
  mode = "pause";
  audio.endFire();
  pauseCard.classList.remove("hidden");
});
muteBtn.addEventListener("click", () => {
  save.settings.mute = !save.settings.mute;
  writeSave(save);
  audio.setMuted(save.settings.mute);
  muteBtn.textContent = save.settings.mute ? "Muted" : "Sound";
  muteBtn.setAttribute("aria-pressed", save.settings.mute ? "true" : "false");
});
document.getElementById("dbg-hot").addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  const t = performance.now();
  taps.push(t);
  while (taps.length && t - taps[0] > 900) taps.shift();
  if (taps.length >= 3) {
    taps.length = 0;
    toggleDbg();
  }
});

window.addEventListener("resize", resize);
if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);

paintLevels();
resize();
boot.classList.add("hidden");
document.getElementById("btn-start").disabled = false;

window.__bridge = {
  ready: true,
  hold(v) { hold = !!v; },
  start(id) { startRun(id); },
  skipIntro,
  step(dt) { play.step(dt); },
  rush(sec) { play.step(sec); },
  selfTest() { return play.selfTest(); },
  snapshot() { return play.snapshot(); },
  spawnPack: play.spawnPack,
  killAll: play.killAll,
  setSquad: play.setSquad,
  hurtCrate: play.hurtCrate,
  damageGate: play.damageGate,
  forceRack: play.forceRack,
  debugWin() { play.debugWin(); },
  debugLose() { play.debugLose(); },
  killBoss() { play.killBoss(); },
  setBot: play.setBot,
  setLevel(id) { queuedLevel = id; play.setLevel(id); },
  setLoadout(data) { play.setLoadout(data); },
  cycleGun() { play.cycleGun(); },
  bumpTier() { play.bumpTier(); },
  openCrate(i) { return play.openCrate(i); },
  setAxis: play.setAxis,
  drag(px) { play.drag(px * play.view.mPerPx); },
  mpp() { return play.view.mPerPx; },
  fps() { return fpsShow; },
  calls() { return play.view.calls; },
  scale() { return renderScale; },
  mode() { return mode; },
};

requestAnimationFrame(frame);
