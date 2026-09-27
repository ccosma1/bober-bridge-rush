// Dam Run rules. No rendering. World forward is -Z.

export const BUILD = "br2";
export const SIM_CAP = 300;
export const RENDER_CAP = 60;
export const LIVE_CAP = 320;
export const ADVANCE = 8;
export const STEER_MAX = 14;
export const RANGE = 28;

export const GUN_ORDER = ["bow", "long", "smg", "shot", "gerald", "log", "rocket", "flame", "party", "sap"];

export const WEAPONS = {
  bow: { id: "bow", name: "Twig Crossbow", family: "ARROWS", dmg: 10, rate: 3, pellets: 1, spread: 0, pattern: "arrow", falloff: 0, splash: 0, knock: 0, pierce: 0, color: "#F4E6C3", line: "" },
  long: { id: "long", name: "Reed's Longbow", family: "ARROWS", dmg: 55, rate: 0.9, pellets: 1, spread: 0, pattern: "pierce", falloff: 0, splash: 0, knock: 0, pierce: 4, color: "#F7F7FF", line: "Long legs, long shots, rounded numbers." },
  smg: { id: "smg", name: "Acorn SMG", family: "BULLETS", dmg: 6, rate: 9, pellets: 1, spread: (3 * Math.PI) / 180, pattern: "spread", falloff: 0, splash: 0, knock: 0, pierce: 0, color: "#F5C400", line: "" },
  shot: { id: "shot", name: "Pinecone Shotgun", family: "BULLETS", dmg: 7, rate: 1.4, pellets: 5, spread: (25 * Math.PI) / 180, pattern: "fan", falloff: 14, splash: 0, knock: 0.4, pierce: 0, color: "#E86A1A", line: "" },
  gerald: { id: "gerald", name: "Gerald Jr.", family: "BULLETS", dmg: 5, rate: 4, rateMax: 14, pellets: 1, spread: (5 * Math.PI) / 180, pattern: "spin", falloff: 0, splash: 0, knock: 0, pierce: 0, color: "#FF8A2A", line: "Gerald says hold the line." },
  log: { id: "log", name: "Log Launcher", family: "ROCKETS", dmg: 40, rate: 0.8, pellets: 1, spread: 0, pattern: "lob", falloff: 0, splash: 2.2, knock: 1, pierce: 0, color: "#8B5A2B", line: "" },
  rocket: { id: "rocket", name: "Firework Rockets", family: "ROCKETS", dmg: 28, rate: 1.2, pellets: 1, spread: 0, pattern: "home", falloff: 0, splash: 1.5, knock: 0.4, pierce: 0, turn: 180, color: "#FF4FA3", line: "Small splash, big joy." },
  flame: { id: "flame", name: "Maple Flamer", family: "FLAME", dmg: 6, rate: 10, pellets: 1, spread: (30 * Math.PI) / 180, pattern: "cone", falloff: 0, splash: 0, knock: 0, pierce: 0, burn: 15, color: "#FF6A1A", line: "Washes off Suds Knights." },
  party: { id: "party", name: "Party Yeet", family: "JOKE", dmg: 4, rate: 1, pellets: 12, spread: (40 * Math.PI) / 180, pattern: "confetti", falloff: 0, splash: 0, knock: 0, pierce: 0, crit: 0.1, stagger: 0.3, color: "#FF4FA3", line: "Confetti cannon. Surprisingly effective." },
  sap: { id: "sap", name: "Sap Sprayer", family: "JOKE", dmg: 3, rate: 12, pellets: 1, spread: 0, pattern: "stream", falloff: 0, splash: 0, knock: 0, pierce: 0, slow: 2.5, color: "#E0A030", line: "Sticky slow. Clogs hate it." },
};

export const STARTERS = ["bow", "smg", "shot", "log"];
export const UNLOCKS = {
  "1-1": ["long", "gerald", "sap", "party"],
  "1-2": ["rocket", "flame"],
};

export const FAMILY_WEIGHT = { ARROWS: 20, BULLETS: 25, ROCKETS: 20, FLAME: 15, JOKE: 20 };

export const ENEMY = [
  { id: "clog", name: "Clogling", hp: 10, speed: 5.5, bite: 1, rad: 0.42, lat: 2.4, y: 0.42 },
  { id: "suds", name: "Suds Knight", hp: 50, foam: 40, speed: 3.5, bite: 2, rad: 0.58, lat: 1.5, y: 0.5 },
  { id: "hauler", name: "Sludge Hauler", hp: 400, speed: 2.5, bite: 5, rad: 1.12, lat: 1.8, y: 0.95 },
  { id: "hair", name: "Hairball", hp: 30, speed: 6, bite: 1, rad: 0.4, lat: 0, y: 0.4 },
  { id: "spit", name: "Pipe Spitter", hp: 70, speed: 8, bite: 2, rad: 0.5, lat: 1.2, y: 0.7 },
  { id: "leaf", name: "Leaf Swarm", hp: 4, speed: 8, bite: 0, rad: 0.28, lat: 0.4, y: 0.9 },
  { id: "duck", name: "Rubber Duck", hp: 30, speed: 3, bite: 0, rad: 0.36, lat: 3, y: 0.36 },
];

const CRATE_MUL = { weapon: 1, volunteer: 0.6, tier: 1.2, mystery: 1, duck: 0.5, forged: 0.8 };

export const LEVELS = {
  "1-1": {
    id: "1-1",
    name: "1-1 PINE BRIDGE",
    chapter: "THE DAM RUNS DRY",
    intro: "The river is three inches lower than yesterday.",
    len: 700,
    river: 0,
    dam: 1,
    theme: 0,
    hpMul: 1,
    baseHp: 480,
    vol: 8,
    starN: 30,
    starSec: 20,
    boss: "baron",
    bossHp: 3000,
    bossName: "BARON CLOG",
    win: "BRIDGE HELD!",
    events: [
      { at: 26, kind: "gate", pair: [{ op: "add", k: 5 }, { op: "sub", k: 3 }] },
      { at: 52, kind: "wave", clog: 40 },
      { at: 155, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "smg", hp: 480 }] },
      { at: 200, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 4 }] },
      { at: 240, kind: "wave", clog: 60, suds: 30 },
      { at: 345, kind: "rack", rack: "standard", slots: [
        { kind: "gun", gun: "shot" },
        { kind: "gun", gun: "smg" },
        { kind: "gun", gun: "bow", bonus: 1 },
      ] },
      { at: 395, kind: "gate", pair: [{ op: "add", k: 12 }, { op: "div", k: 2 }] },
      { at: 440, kind: "wave", clog: 130, suds: 68, hauler: 2, duck: 1 },
      { at: 590, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "log", hp: 968 }] },
      { at: 700, kind: "boss" },
    ],
  },
  "1-2": {
    id: "1-2",
    name: "1-2 SPILLWAY BRIDGE",
    chapter: "THE DAM RUNS DRY",
    intro: "Something is pulling the plug.",
    len: 780,
    river: -0.3,
    dam: 1.35,
    theme: 1,
    hpMul: 1.09,
    baseHp: 700,
    vol: 8,
    starN: 35,
    starSec: 25,
    boss: "tub",
    bossHp: 2500,
    bossName: "BIG TUB",
    win: "BRIDGE HELD!",
    events: [
      { at: 30, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 4 }] },
      { at: 62, kind: "wave", clog: 60 },
      { at: 165, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "long" },
        { type: "volunteer" },
      ] },
      { at: 220, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 8 }] },
      { at: 260, kind: "wave", clog: 90, suds: 10, hair: 2 },
      { at: 370, kind: "rack", rack: "mixed", slots: [
        { kind: "gun", gun: "gerald" },
        { kind: "tier" },
        { kind: "vol", n: 10 },
      ] },
      { at: 450, kind: "crate", layout: "single", items: [{ type: "forged", x: 2.4 }] },
      { at: 500, kind: "crate", layout: "single", items: [{ type: "duck", x: -2.4 }] },
      { at: 560, kind: "gate", pair: [{ op: "add", k: 14 }, { op: "div", k: 2 }] },
      { at: 610, kind: "wave", clog: 150, suds: 61, hauler: 2, spit: 4, hair: 2, duck: 1 },
      { at: 700, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "party" },
        { type: "weapon", gun: "sap" },
      ] },
      { at: 780, kind: "boss" },
    ],
  },
  "1-3": {
    id: "1-3",
    name: "1-3 DAM FACE",
    chapter: "THE DAM RUNS DRY",
    intro: "Somebody is unbolting the dam.",
    len: 860,
    river: -0.6,
    dam: 1.75,
    theme: 2,
    hpMul: 1.18,
    baseHp: 1000,
    vol: 12,
    starN: 50,
    starSec: 35,
    boss: "grunk",
    bossHp: 5000,
    bossName: "GRUNK THE PLUMBER",
    win: "DAM HELD!",
    events: [
      { at: 28, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 5 }] },
      { at: 60, kind: "wave", clog: 80, leaf: 1 },
      { at: 155, kind: "crate", layout: "row", items: [
        { type: "tier" },
        { type: "mystery" },
        { type: "volunteer" },
      ] },
      { at: 230, kind: "gate", pair: [{ op: "add", k: 10 }, { op: "sub", k: 6 }] },
      { at: 270, kind: "wave", clog: 120, suds: 12, leaf: 2, duck: 1 },
      { at: 380, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "rocket" }] },
      { at: 450, kind: "rack", rack: "family", banner: "BULLETS", slots: [
        { kind: "gun", gun: "smg" },
        { kind: "gun", gun: "shot" },
        { kind: "gun", gun: "gerald" },
      ] },
      { at: 510, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "flame", x: -2.4 }] },
      { at: 580, kind: "gate", pair: [{ op: "mul", k: 3 }, { op: "add", k: 20 }] },
      { at: 630, kind: "wave", clog: 155, suds: 67, hauler: 3, spit: 6, hair: 4, leaf: 3, duck: 1 },
      { at: 760, kind: "crate", layout: "pair", items: [
        { type: "tier" },
        { type: "forged" },
      ] },
      { at: 860, kind: "boss" },
    ],
  },
};

export const LEVEL_IDS = ["1-1", "1-2", "1-3"];

export function levelOf(id) {
  return LEVELS[id] || LEVELS["1-1"];
}

export function nextLevel(id) {
  const i = LEVEL_IDS.indexOf(id);
  return i >= 0 && i < LEVEL_IDS.length - 1 ? LEVEL_IDS[i + 1] : "";
}

export function highestPlayable(cleared) {
  if (cleared && cleared["1-2"]) return "1-3";
  if (cleared && cleared["1-1"]) return "1-2";
  return "1-1";
}

export function isUnlockedLevel(id, cleared) {
  if (id === "1-1") return true;
  if (id === "1-2") return !!(cleared && cleared["1-1"]);
  if (id === "1-3") return !!(cleared && cleared["1-2"]);
  return false;
}

export function crateHp(base, type, explicit) {
  if (explicit) return explicit;
  return Math.max(1, Math.round(base * (CRATE_MUL[type] || 1)));
}

export function formationRadius(n, half) {
  const shown = Math.max(1, Math.min(60, n | 0));
  const spacing = 0.75;
  const rowH = spacing * 0.8660254;
  const cols = Math.max(1, Math.ceil(Math.sqrt(shown)));
  const rows = Math.max(1, Math.ceil(shown / cols));
  const w = Math.max(0, cols - 1) * spacing + spacing * 0.5;
  const h = Math.max(0, rows - 1) * rowH;
  const r = Math.max(0.4, Math.hypot(w * 0.5, h * 0.5) + 0.05);
  return Math.min(r, Math.max(0.45, half - 0.7));
}

export function clampLane(x, radius, half) {
  const lim = Math.max(0, half - radius);
  return Math.max(-lim, Math.min(lim, x));
}

export function shownCount(n) {
  return Math.max(0, Math.min(RENDER_CAP, n | 0));
}

export function squadDmgMul(n) {
  return 1 + Math.max(0, n - RENDER_CAP) * 0.015;
}

export function weaponMods(id, tier) {
  const w = WEAPONS[id] || WEAPONS.bow;
  const t = Math.max(1, Math.min(4, tier | 0));
  const rateMul = t >= 2 ? 1.15 : 1;
  const extra = t >= 3 ? 1 : 0;
  const gold = t >= 4;
  let pierce = w.pierce || 0;
  let splash = w.splash || 0;
  let turn = w.turn || 0;
  let burn = w.burn || 0;
  let slow = w.slow || 0;
  let stagger = w.stagger || 0;
  let crit = w.crit || 0;
  let spread = w.spread || 0;
  if (w.pattern === "pierce") pierce += extra;
  if (w.pattern === "cone") spread += extra * (8 * Math.PI) / 180;
  if (gold) {
    if (w.pattern === "pierce") pierce += 2;
    if (splash) splash *= 1.4;
    if (turn) turn *= 1.4;
    if (burn) burn *= 1.4;
    if (slow) slow *= 1.4;
    if (stagger) stagger *= 1.4;
    if (w.pattern === "confetti") crit = 0.14;
  }
  return {
    id: w.id,
    name: w.name,
    family: w.family,
    line: w.line,
    tier: t,
    dmg: w.dmg * Math.pow(1.35, t - 1),
    rate: w.rate * rateMul,
    rateMax: (w.rateMax || w.rate) * rateMul,
    pellets: (w.pellets || 1) + (w.pattern === "cone" || w.pattern === "stream" ? 0 : extra),
    spread,
    pattern: w.pattern,
    falloff: w.falloff || 0,
    splash,
    knock: w.knock || 0,
    pierce,
    turn,
    burn,
    slow,
    stagger,
    crit,
    color: w.color,
    gold,
  };
}

export function tierAfterPickup(curId, curTier, nextId, bonus) {
  const cur = WEAPONS[curId] || WEAPONS.bow;
  const next = WEAPONS[nextId] || WEAPONS.bow;
  let t;
  if (cur.id === next.id) t = curTier + 1;
  else if (cur.family === next.family) t = curTier;
  else t = Math.max(1, curTier - 1);
  t += bonus || 0;
  return Math.max(1, Math.min(4, t));
}

export function applyGate(n, op, k, tenths) {
  let out = n;
  if (op === "add") out = n + k;
  else if (op === "sub") out = n > k ? n - k : 0;
  else if (op === "div") out = Math.max(1, Math.ceil(n / k));
  else if (op === "mul") out = Math.floor((n * tenths) / 10);
  if (out <= 0) return 0;
  return Math.min(SIM_CAP, out);
}

export function gateLabel(g) {
  if (g.op === "mul") {
    const whole = Math.floor(g.tenths / 10);
    const frac = g.tenths % 10;
    return frac ? "x" + whole + "." + frac : "x" + whole;
  }
  const n = String(Math.max(0, Math.round(g.k)));
  if (g.op === "add") return "+" + n;
  if (g.op === "sub") return "-" + n;
  return "/" + n;
}

export function gateBlue(op) {
  return op === "add" || op === "mul";
}

export function shootGate(g, hits) {
  g.frac += hits;
  let changed = false;
  const need = g.op === "mul" ? 18 : 6;
  let guard = 0;
  while (g.frac >= need && guard++ < 64) {
    if (g.op === "mul" && g.tenths >= g.baseTenths + 10) {
      g.frac = need - 1;
      break;
    }
    g.frac -= need;
    changed = true;
    if (g.op === "add") g.k += 1;
    else if (g.op === "sub") {
      g.k -= 1;
      if (g.k <= 0) {
        g.op = "add";
        g.k = 1;
      }
    } else if (g.op === "div") {
      if (g.k > 1) g.k -= 1;
      else {
        g.op = "add";
        g.k = 1;
      }
    } else if (g.op === "mul") {
      g.tenths += 1;
      if (g.tenths > g.baseTenths + 10) g.tenths = g.baseTenths + 10;
    }
  }
  return changed;
}

export function freshGate(op, k) {
  const tenths = Math.round(k * 10);
  return { op, k, tenths, baseTenths: tenths, frac: 0 };
}

export function starsFor(won, n, crateRammed, bossSec, starN, starSec) {
  if (!won) return 0;
  const needN = starN == null ? 25 : starN;
  const needSec = starSec == null ? 20 : starSec;
  if (!crateRammed && bossSec < needSec) return 3;
  if (n >= needN) return 2;
  return 1;
}

export function boberReward(kills, cratesOpened, stars, duckKills, duckCrates) {
  const bonus = [0, 50, 100, 150][stars] || 0;
  return Math.floor(kills / 10) + cratesOpened * 20 + 150 + bonus + (duckKills || 0) * 25 + (duckCrates || 0) * 40;
}

export function clogHit(type, hp, foam, dmg, splash, pierce, flame, sapped) {
  let dealt = dmg * (sapped ? 1.25 : 1);
  if (type === 5 && flame) return { hp: 0, foam: 0, dealt: hp, burst: 0 };
  if (type === 1 && foam > 0) {
    let f = dealt;
    if (flame) f *= 3;
    else if (!splash && !pierce) f *= 0.4;
    const next = foam - f;
    return { hp, foam: next > 0 ? next : 0, dealt: f, burst: next <= 0 ? 1 : 0 };
  }
  if (type === 2 && !splash && !pierce) dealt *= 0.4;
  return { hp: hp - dealt, foam: 0, dealt, burst: 0 };
}

export function hairGrowth(age) {
  const hpScale = Math.min(3, Math.pow(1.12, age));
  const radScale = Math.min(3, Math.pow(1.08, age));
  const growth = (hpScale - 1) * 1.5;
  const bite = 1 + Math.floor(growth * 2);
  return { hpScale, radScale, growth, bite: bite > 7 ? 7 : bite };
}

export function mysteryPick(unlocked, rnd) {
  const fams = ["ARROWS", "BULLETS", "ROCKETS", "FLAME", "JOKE"];
  let total = 0;
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < unlocked.length; i++) {
    const w = WEAPONS[unlocked[i]];
    if (!w) continue;
    const fi = fams.indexOf(w.family);
    if (fi < 0) continue;
    if (counts[fi] === 0) total += FAMILY_WEIGHT[w.family];
    counts[fi]++;
  }
  if (total <= 0) return "bow";
  let r = rnd() * total;
  let fam = fams[0];
  for (let i = 0; i < fams.length; i++) {
    if (!counts[i]) continue;
    r -= FAMILY_WEIGHT[fams[i]];
    if (r <= 0) {
      fam = fams[i];
      break;
    }
  }
  const bucket = [];
  for (let i = 0; i < unlocked.length; i++) {
    const w = WEAPONS[unlocked[i]];
    if (w && w.family === fam) bucket.push(w.id);
  }
  if (!bucket.length) return "bow";
  return bucket[Math.min(bucket.length - 1, (rnd() * bucket.length) | 0)];
}

export function formationOffsets(n, radius, outX, outZ) {
  const shown = shownCount(n);
  if (!shown) return 0;
  const spacing = 0.75;
  const rowH = spacing * 0.8660254;
  let cols = Math.max(1, Math.ceil(Math.sqrt(shown)));
  let rows = Math.ceil(shown / cols);
  const w = Math.max(0, cols - 1) * spacing + spacing * 0.5;
  const h = Math.max(0, rows - 1) * rowH;
  const fit = Math.max(0.2, Math.hypot(w * 0.5, h * 0.5) + 0.05);
  const scale = radius > 0 && fit > radius ? radius / fit : 1;
  const sx = spacing * scale;
  const sy = rowH * scale;
  let i = 0;
  for (let r = 0; r < rows && i < shown; r++) {
    const rowCols = Math.min(cols, shown - i);
    const ox = ((r & 1) ? sx * 0.5 : 0) - (rowCols - 1) * sx * 0.5;
    const z = (r - (rows - 1) * 0.5) * sy;
    for (let c = 0; c < rowCols; c++) {
      outX[i] = ox + c * sx;
      outZ[i] = z;
      i++;
    }
  }
  return shown;
}

export function selfTestRules() {
  const fails = [];
  const eq = (got, want, msg) => {
    if (got !== want) fails.push(msg + " got " + got + " want " + want);
  };
  eq(applyGate(10, "mul", 2, 20), 20, "x2");
  eq(applyGate(7, "mul", 2.1, 21), 14, "x2.1");
  eq(applyGate(10, "div", 2, 20), 5, "/2");
  eq(applyGate(11, "div", 2, 20), 6, "ceil /2");
  eq(applyGate(3, "sub", 5, 50), 0, "minus wipe");
  eq(applyGate(8, "sub", 3, 30), 5, "minus");
  eq(applyGate(3, "add", 5, 50), 8, "add");
  eq(applyGate(200, "mul", 2, 20), 300, "cap");

  const plus = freshGate("add", 5);
  shootGate(plus, 6);
  eq(plus.k, 6, "+ shoot");
  eq(gateLabel(plus), "+6", "+ label");

  const minus = freshGate("sub", 1);
  shootGate(minus, 6);
  eq(minus.op, "add", "minus flip op");
  eq(minus.k, 1, "minus flip k");
  eq(gateBlue(minus.op), true, "minus flip blue");

  const mul = freshGate("mul", 2);
  shootGate(mul, 18);
  eq(mul.tenths, 21, "x step");
  eq(gateLabel(mul), "x2.1", "x label");
  shootGate(mul, 18 * 20);
  eq(mul.tenths, 30, "x cap");

  const div = freshGate("div", 2);
  shootGate(div, 6);
  eq(div.op + div.k, "div1", "div step");
  shootGate(div, 6);
  eq(div.op + div.k, "add1", "div flip");

  eq(weaponMods("bow", 1).dmg, 10, "t1 dmg");
  eq(Math.round(weaponMods("bow", 2).dmg * 100), 1350, "t2 dmg");
  eq(Math.round(weaponMods("bow", 2).rate * 100), 345, "t2 rate");
  eq(weaponMods("shot", 3).pellets, 6, "t3 pellets");
  eq(weaponMods("long", 1).pierce, 4, "pierce");
  eq(weaponMods("long", 3).pierce, 5, "t3 pierce");
  eq(weaponMods("long", 4).pierce, 7, "t4 pierce");
  eq(Math.round(weaponMods("log", 4).splash * 10), 31, "t4 splash");
  eq(Math.round(weaponMods("party", 4).crit * 100), 14, "t4 crit");
  eq(weaponMods("flame", 4).gold ? 1 : 0, 1, "gold");
  eq(tierAfterPickup("bow", 1, "smg", 0), 1, "swap family");
  eq(tierAfterPickup("smg", 2, "smg", 0), 3, "same tier");
  eq(tierAfterPickup("smg", 3, "shot", 0), 3, "same family");
  eq(tierAfterPickup("smg", 3, "log", 0), 2, "other family");
  eq(tierAfterPickup("smg", 1, "bow", 1), 2, "rack bow");
  eq(tierAfterPickup("smg", 4, "smg", 0), 4, "cap t4");
  eq(starsFor(true, 30, 0, 10), 3, "star3");
  eq(starsFor(true, 30, 1, 10), 2, "star2");
  eq(starsFor(true, 10, 1, 5), 1, "star1");
  eq(starsFor(true, 10, 0, 20), 1, "star boundary");
  eq(starsFor(true, 40, 0, 24, 35, 25), 3, "star3 l2");
  eq(starsFor(true, 35, 1, 10, 35, 25), 2, "star2 l2");
  eq(starsFor(false, 40, 0, 1), 0, "no win");
  eq(boberReward(25, 2, 3), 342, "reward");
  eq(boberReward(0, 0, 1, 1, 1), 265, "duck pay");
  eq(Math.round(squadDmgMul(60) * 100), 100, "no bonus at 60");
  eq(Math.round(squadDmgMul(62) * 1000), 1030, "over 60");

  const foam = clogHit(1, 50, 40, 10, 0, 0, 0, 0);
  eq(Math.round(foam.foam), 36, "foam chip");
  const flameFoam = clogHit(1, 50, 40, 10, 0, 0, 1, 0);
  eq(Math.round(flameFoam.foam), 10, "flame foam");
  const leaf = clogHit(5, 4, 0, 1, 0, 0, 1, 0);
  eq(leaf.hp, 0, "flame leaf");
  const sapped = clogHit(0, 10, 0, 8, 0, 0, 0, 1);
  eq(sapped.dealt, 10, "sap bonus");
  const pierceHaul = clogHit(2, 400, 0, 10, 0, 1, 0, 0);
  eq(pierceHaul.dealt, 10, "pierce hauler");
  const frontHaul = clogHit(2, 400, 0, 10, 0, 0, 0, 0);
  eq(frontHaul.dealt, 4, "front hauler");
  const grown = hairGrowth(40);
  eq(grown.bite, 7, "hair bite");
  eq(grown.hpScale, 3, "hair cap");

  const pick = mysteryPick(["bow", "smg", "shot", "log"], () => 0.01);
  if (STARTERS.indexOf(pick) < 0) fails.push("mystery locked " + pick);
  eq(highestPlayable({}), "1-1", "highest fresh");
  eq(highestPlayable({ "1-1": true }), "1-2", "highest 2");
  eq(nextLevel("1-3"), "", "no chapter 2");
  eq(LEVELS["1-1"].events.length, 10, "pine events");
  eq(LEVELS["1-2"].events[9].clog + LEVELS["1-2"].events[9].suds + 2 + 4 + 2 + 1, 220, "wave l2");
  eq(crateHp(700, "duck"), 350, "duck hp");
  eq(crateHp(1000, "forged"), 800, "forged hp");

  const xs = new Float32Array(64);
  const zs = new Float32Array(64);
  const rad = formationRadius(40, 5);
  const shown = formationOffsets(40, rad, xs, zs);
  eq(shown, 40, "shown");
  for (let i = 0; i < shown; i++) {
    if (xs[i] * xs[i] + zs[i] * zs[i] > rad * rad + 1e-6) fails.push("formation outside");
  }
  if (Math.abs(clampLane(9, 1, 5) - 4) > 1e-6) fails.push("clamp lane");
  return fails;
}
