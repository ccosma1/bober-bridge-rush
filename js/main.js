import * as THREE from "three";
import { BUILD } from "./rules.js?v=br0";
import { createWorld } from "./world.js?v=br0";
import { createPlay } from "./play.js?v=br0";
import { createAudio } from "./audio.js?v=br0";
import { loadSave, rememberWin, writeSave } from "./save.js?v=br0";
import { drawWeaponIcon, setTime } from "./mats.js?v=br0";

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
    rememberWin(save, info.stars);
    showResult(true, info);
  },
  lose() {
    showResult(false, null);
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
  result.classList.remove("hidden");
  title.classList.add("hidden");
  if (won) {
    resultTitle.textContent = "BRIDGE HELD!";
    resultCopy.textContent = "Squad " + info.n + " · " + info.kills + " down";
    resultEarn.textContent = "Earned $BOBER " + info.earned;
    nextBtn.classList.remove("hidden");
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

function startRun() {
  audio.unlock();
  play.start();
  mode = "run";
  armed = 0;
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
  chipCtx.clearRect(0, 0, 64, 64);
  chipCtx.fillStyle = "#F4E6C3";
  chipCtx.fillRect(0, 0, 64, 64);
  drawWeaponIcon(chipCtx, v.weaponId, 32, 34, 40);
}

function paintHud() {
  const v = play.view;
  boberRun.textContent = "$BOBER " + save.bober;
  barFill.style.width = Math.max(0, Math.min(1, v.bar)) * 100 + "%";
  barLabel.textContent = v.barText;
  hud.classList.toggle("boss", v.arena === 1 && mode === "run");
  banner.textContent = String(v.n);
  banner.classList.toggle("big", v.n > 60);
  paintChip();
  if (v.flash) {
    flash.textContent = v.flash;
    flash.classList.remove("hidden");
  } else {
    flash.classList.add("hidden");
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

function toggleDbg() {
  showDbg = !showDbg;
  dbg.classList.toggle("hidden", !showDbg);
}

function frame(now) {
  requestAnimationFrame(frame);
  const real = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!hold) {
    if (mode === "run" || mode === "pause") {
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
  world.follow(v.squadX, v.squadZ, v.half, play.time);
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
  if (mode === "run" || mode === "pause") {
    paintHud();
    placeBanner();
  }
  if (showDbg) {
    dbg.textContent =
      "FPS " + fpsShow.toFixed(0) +
      "\nENEMIES " + v.enemies +
      "\nDRAWS " + v.calls +
      "\nSCALE " + renderScale.toFixed(1) +
      "\n" + BUILD;
  }
}

let last = performance.now();

function onPointerDown(e) {
  if (e.target.closest && e.target.closest("button, a")) return;
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
  if (mode !== "run") return;
  if (e.code === "KeyA" || e.code === "ArrowLeft") play.setAxis(-1);
  else if (e.code === "KeyD" || e.code === "ArrowRight") play.setAxis(1);
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyA" || e.code === "ArrowLeft" || e.code === "KeyD" || e.code === "ArrowRight") play.setAxis(0);
});

document.getElementById("btn-start").addEventListener("click", startRun);
document.getElementById("btn-retry").addEventListener("click", startRun);
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

resize();
boot.classList.add("hidden");
document.getElementById("btn-start").disabled = false;

window.__bridge = {
  ready: true,
  hold(v) { hold = !!v; },
  start: startRun,
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
  setAxis: play.setAxis,
  drag(px) { play.drag(px * play.view.mPerPx); },
  mpp() { return play.view.mPerPx; },
  fps() { return fpsShow; },
  calls() { return play.view.calls; },
  scale() { return renderScale; },
  mode() { return mode; },
};

requestAnimationFrame(frame);
