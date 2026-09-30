// Dam Run rules. No rendering. World forward is -Z.
// br3 gun table. Lab may multiply a tier's DMG; the comment block at the
// bottom of weaponMods records the numbers that passed the gun lab.

export const BUILD = "br10";
export const SIM_CAP = 300;
export const RENDER_CAP = 60;
export const LIVE_CAP = 320;
export const ADVANCE = 8;
export const WAVE_ADVANCE = 2;
export const STEER_MAX = 14;
export const RANGE = 28;
export const DECK_HALF = 4.5;
export const BOSS_HALF = 4.5;
export const FORM_GAP = 0.58;
export const LANE_BLOB = 7.2;
export const LANE_X = 2.2;
export const GATE_X = 3;
export const PANEL_W = 2.6;
export const DIVIDER_W = 0;
export const AIM_CONE = 12 * Math.PI / 180;
export const CHARGE_LEAD = 34;
export const PINCH_BLOB = 1.2;

const DEG = Math.PI / 180;

export const GUN_ORDER = ["mini", "dambust", "burst", "saw", "rail", "beam", "storm", "flame", "glacier", "barrage", "cone", "aurora"];

const GUN_MIGRATE = {
  bow: "rail", long: "rail", smg: "burst", gerald: "mini", shot: "dambust",
  log: "cone", rocket: "barrage", party: "barrage", sap: "flame", flame: "flame",
  frost: "glacier", beam: "beam", storm: "storm", rail: "rail",
};

export function migrateGun(id) {
  if (WEAPONS[id]) return id;
  return GUN_MIGRATE[id] || "";
}

export const WEAPONS = {
  mini: {
    id: "mini", name: "Gnasher Minigun", family: "BULLETS", pattern: "spin",
    color: "#F5C400", pellets: 1, spread: 2.2 * DEG, shove: 0.35, len: 1.8, thick: 0.18, heavy: 0,
    spinUp: 0.6, line: "Six barrels. It finds a rhythm.",
    tiers: [
      { dmg: 8.59, rate: 3, rateMax: 6.3 },
      { dmg: 9.67, rate: 3.45, rateMax: 7.3 },
      { dmg: 15, rate: 3.45, rateMax: 7.3, spinUp: 0.3 },
      { dmg: 17.72, rate: 4.1, rateMax: 8.7, spinUp: 0.3 },
    ],
  },
  dambust: {
    id: "dambust", name: "Dam Buster", family: "BULLETS", pattern: "fan",
    color: "#E86A1A", pellets: 9, spread: 26 * DEG, falloff: 14, shove: 1.5, len: 1.2, thick: 0.28, heavy: 1,
    line: "Close range flips a Clog.",
    tiers: [
      { dmg: 5.82, rate: 0.97, pellets: 9 },
      { dmg: 7.5, rate: 1.12, pellets: 9 },
      { dmg: 9.52, rate: 1.12, pellets: 10 },
      { dmg: 10.48, rate: 1.12, pellets: 12 },
    ],
  },
  burst: {
    id: "burst", name: "Incisor Rifle", family: "BULLETS", pattern: "burst",
    color: "#4FC3FF", pellets: 3, spread: 0, shove: 0.2, len: 2.6, thick: 0.16, heavy: 0,
    line: "Three rounds. The third bites deeper.",
    tiers: [
      { dmg: 8.7, rate: 1.6, pellets: 3 },
      { dmg: 11.17, rate: 1.84, pellets: 3 },
      { dmg: 12.13, rate: 1.84, pellets: 4 },
      { dmg: 15.44, rate: 2.1, pellets: 4, pierce: 1 },
    ],
  },
  saw: {
    id: "saw", name: "Buzzblade", family: "BLADES", pattern: "disc",
    color: "#D8DDE6", pellets: 1, spread: 0, shove: 0.4, len: 0.5, thick: 0.5, heavy: 1,
    line: "It bounces. A kill splits it.",
    tiers: [
      { dmg: 12.99, rate: 0.9, bounces: 3 },
      { dmg: 15.34, rate: 1.04, bounces: 3 },
      { dmg: 17.14, rate: 1.04, bounces: 4, burn: 3 },
      { dmg: 15.19, rate: 1.2, bounces: 5 },
    ],
  },
  rail: {
    id: "rail", name: "Pine Rail", family: "ENERGY", pattern: "rail",
    color: "#FFF6D8", pellets: 1, spread: 0, shove: 1.2, len: 2.8, thick: 0.3, heavy: 1,
    charge: 0.45, line: "Coils light. Then the whole line.",
    tiers: [
      { dmg: 15.35, rate: 0.42, pierce: 40 },
      { dmg: 18.41, rate: 0.48, pierce: 40 },
      { dmg: 29.5, rate: 0.48, pierce: 40 },
      { dmg: 14.6, rate: 0.55, pierce: 40 },
    ],
  },
  beam: {
    id: "beam", name: "Beaver Beam", family: "ENERGY", pattern: "bolt",
    color: "#FF2430", pellets: 1, spread: 0.8 * DEG, shove: 0, len: 0.9, thick: 0.12, heavy: 0,
    line: "Red bolts. They do not sit still.",
    tiers: [
      { dmg: 4.82, rate: 10 },
      { dmg: 5.09, rate: 11.3 },
      { dmg: 5.47, rate: 11.3 },
      { dmg: 5.5, rate: 12.5 },
    ],
  },
  storm: {
    id: "storm", name: "Storm Tail", family: "ENERGY", pattern: "spark",
    color: "#3A6BFF", pellets: 1, spread: 0, shove: 0.4, len: 0.35, thick: 0.35, heavy: 0, chain: 3,
    line: "A spark ball. Then it leaps.",
    tiers: [
      { dmg: 12.91, rate: 1.2, chain: 3 },
      { dmg: 16.36, rate: 1.35, chain: 3 },
      { dmg: 17.62, rate: 1.35, chain: 4 },
      { dmg: 21, rate: 1.5, chain: 5 },
    ],
  },
  flame: {
    id: "flame", name: "Maple Flamer", family: "ELEMENT", pattern: "stream",
    color: "#FF6A1A", pellets: 1, spread: 12 * DEG, shove: 0, range: 10, len: 0.4, thick: 0.25, heavy: 0,
    line: "Washes off Suds Knights.",
    tiers: [
      { dmg: 1.33, rate: 14, burn: 4.2, range: 10 },
      { dmg: 1.8, rate: 14, burn: 5.4, range: 10 },
      { dmg: 2.67, rate: 14, burn: 5.6, range: 13 },
      { dmg: 3.78, rate: 14, burn: 6.0, range: 13 },
    ],
  },
  glacier: {
    id: "glacier", name: "Glacier Gun", family: "ELEMENT", pattern: "spike",
    color: "#7DEBFF", pellets: 1, spread: 0, splash: 1.7, shove: 0.4, len: 1.1, thick: 0.28, heavy: 1,
    line: "Three freezes and they shatter.",
    tiers: [
      { dmg: 2.07, rate: 0.62, splash: 1.7, slow: 2.4 },
      { dmg: 6.15, rate: 0.7, splash: 1.8, slow: 2.4 },
      { dmg: 9.35, rate: 0.7, splash: 2.0, slow: 2.4 },
      { dmg: 16.41, rate: 0.75, splash: 2.2, slow: 2.4 },
    ],
  },
  barrage: {
    id: "barrage", name: "Lodge Barrage", family: "EXPLOSIVE", pattern: "salvo",
    color: "#FF2E63", pellets: 6, spread: 0, splash: 1.1, shove: 1.1, turn: 90, len: 1.4, thick: 0.22, heavy: 1,
    line: "Six tubes. Soft homing.",
    tiers: [
      { dmg: 3.6, rate: 0.71, pellets: 6, splash: 1.1 },
      { dmg: 5.09, rate: 0.82, pellets: 6, splash: 1.1 },
      { dmg: 6.38, rate: 0.82, pellets: 8, splash: 1.1 },
      { dmg: 7.37, rate: 0.9, pellets: 10, splash: 1.1 },
    ],
  },
  cone: {
    id: "cone", name: "Cone Grenadier", family: "EXPLOSIVE", pattern: "grenade",
    color: "#6BCB3D", pellets: 1, spread: 0, splash: 1.8, shove: 1.4, len: 0.42, thick: 0.42, heavy: 1,
    line: "It bounces. Then the deck rings.",
    tiers: [
      { dmg: 23.2, rate: 0.49, splash: 1.8 },
      { dmg: 26.5, rate: 0.56, splash: 1.8 },
      { dmg: 38.6, rate: 0.56, splash: 1.8 },
      { dmg: 67.8, rate: 0.6, splash: 1.8 },
    ],
  },
  aurora: {
    id: "aurora", name: "Aurora Cannon", family: "ENERGY", pattern: "orb",
    color: "#3DFFB0", pellets: 1, spread: 0, splash: 2.4, shove: 0.6, len: 0.7, thick: 0.7, heavy: 1,
    line: "It walks the bridge, then it pops.",
    tiers: [
      { dmg: 25, rate: 0.4, splash: 2.4 },
      { dmg: 30.2, rate: 0.46, splash: 2.4 },
      { dmg: 60.7, rate: 0.46, splash: 2.4 },
      { dmg: 66.5, rate: 0.5, splash: 2.4 },
    ],
  },
};

export const TIER_TTK = [0, 4.0, 3.0, 2.25, 1.7];

export const STARTERS = ["burst"];
export const UNLOCKS = {
  "1-1": ["mini", "dambust", "saw", "beam", "storm", "cone"],
  "1-2": ["rail", "flame", "glacier", "barrage", "aurora"],
};

export const GUN_COST = {
  mini: 90,
  dambust: 100,
  saw: 110,
  rail: 180,
  beam: 150,
  storm: 160,
  flame: 120,
  glacier: 140,
  barrage: 130,
  cone: 100,
  aurora: 170,
};

export const FAMILY_WEIGHT = {
  BULLETS: 1, BLADES: 1, ENERGY: 1, ELEMENT: 1, EXPLOSIVE: 1,
};

export const ENEMY = [
  { id: "clog", name: "Clogling", hp: 10, speed: 5.5, bite: 1, rad: 0.7, lat: 2.2, y: 0.86, tall: 1.6, bulk: 1.34 },
  { id: "suds", name: "Suds Knight", hp: 50, foam: 40, speed: 3.5, bite: 2, rad: 0.8, lat: 1.4, y: 1.08, tall: 2.0, bulk: 1.26 },
  { id: "hauler", name: "Sludge Hauler", hp: 400, speed: 2.5, bite: 5, rad: 1.08, lat: 1.5, y: 1.42, tall: 2.6, bulk: 1.24 },
  { id: "hair", name: "Hairball", hp: 30, speed: 6, bite: 1, rad: 0.5, lat: 0, y: 0.5, tall: 1.0, bulk: 1 },
  { id: "spit", name: "Pipe Spitter", hp: 70, speed: 8, bite: 2, rad: 0.74, lat: 1.15, y: 0.98, tall: 1.8, bulk: 1.2 },
  { id: "leaf", name: "Leaf Swarm", hp: 4, speed: 8, bite: 0, rad: 0.32, lat: 0.4, y: 1.05, tall: 1.1, bulk: 1 },
  { id: "duck", name: "Rubber Duck", hp: 30, speed: 3, bite: 0, rad: 0.42, lat: 3, y: 0.5, tall: 1.0, bulk: 1 },
];

export const BOSS_TALL = { baron: 5, tub: 5.5, grunk: 6 };

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
    bossHp: 3800,
    bossName: "BARON CLOG",
    win: "BRIDGE HELD!",
    events: [
      { at: 24, kind: "gate", side: 1, op: "add", k: 5 },
      { at: 52, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 8, x: -2.6 },
        { type: "volunteer", hp: 6, x: 2.4 },
      ] },
      { at: 86, kind: "gate", side: 0, op: "mul", k: 2 },
      { at: 112, kind: "wave", clog: 40 },
      { at: 128, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 10, x: -3.1 },
        { type: "volunteer", hp: 12, x: 2.6 },
      ] },
      { at: 150, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "dambust", hp: 12, x: 1.8 }] },
      { at: 190, kind: "gate", side: 1, op: "add", k: 8 },
      { at: 214, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 14, x: -2.4 },
        { type: "volunteer", hp: 16, x: 0.2 },
        { type: "volunteer", hp: 14, x: 2.8 },
      ] },
      { at: 236, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "mini", hp: 16, x: -2.0 }] },
      { at: 248, kind: "wave", clog: 72, suds: 22 },
      { at: 300, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 18, x: -3.0 },
        { type: "volunteer", hp: 20, x: 1.6 },
      ] },
      { at: 340, kind: "gate", side: 0, op: "add", k: 6 },
      { at: 366, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "beam", hp: 18, x: 2.4 }] },
      { at: 392, kind: "gate", side: 1, op: "sub", k: 3 },
      { at: 428, kind: "wave", clog: 80, suds: 24, hauler: 2, duck: 1 },
      { at: 456, kind: "crate", layout: "single", items: [{ type: "tier", hp: 20, x: -1.6 }] },
      { at: 520, kind: "gate", side: 0, op: "add", k: 10 },
      { at: 560, kind: "gate", side: 1, op: "add", k: 8 },
      { at: 600, kind: "gate", side: 0, op: "sub", k: 2 },
      { at: 640, kind: "gate", side: 1, op: "add", k: 6 },
      { at: 672, kind: "gate", side: 0, op: "add", k: 4 },
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
      { at: 26, kind: "gate", side: 1, op: "add", k: 6 },
      { at: 48, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 8, x: -2.8 },
        { type: "volunteer", hp: 10, x: 2.5 },
      ] },
      { at: 54, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "rail", hp: 14, x: -1.6 },
        { type: "weapon", gun: "flame", hp: 14, x: 1.8 },
      ] },
      { at: 84, kind: "gate", side: 0, op: "mul", k: 2 },
      { at: 122, kind: "wave", clog: 52 },
      { at: 200, kind: "gate", side: 1, op: "add", k: 5 },
      { at: 224, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "glacier", hp: 18, x: -2.2 }] },
      { at: 270, kind: "wave", clog: 74, suds: 16, hair: 2 },
      { at: 360, kind: "gate", side: 0, op: "add", k: 10 },
      { at: 400, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "barrage", hp: 20, x: -2.4 },
        { type: "weapon", gun: "aurora", hp: 20, x: 2.2 },
      ] },
      { at: 430, kind: "gate", side: 1, op: "sub", k: 4 },
      { at: 470, kind: "wave", clog: 70, suds: 18, hauler: 1, spit: 1, duck: 1 },
      { at: 560, kind: "gate", side: 0, op: "add", k: 8 },
      { at: 588, kind: "crate", layout: "single", items: [{ type: "tier", hp: 24, x: 1.4 }] },
      { at: 620, kind: "gate", side: 1, op: "add", k: 8 },
      { at: 660, kind: "gate", side: 0, op: "sub", k: 3 },
      { at: 700, kind: "gate", side: 1, op: "add", k: 6 },
      { at: 740, kind: "gate", side: 0, op: "add", k: 10 },
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
    bossHp: 2000,
    bossName: "GRUNK THE PLUMBER",
    win: "DAM HELD!",
    events: [
      { at: 28, kind: "gate", side: 1, op: "add", k: 6 },
      { at: 52, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 30, x: -3.0 },
        { type: "weapon", gun: "storm", hp: 24, x: -0.4 },
        { type: "weapon", gun: "cone", hp: 24, x: 2.6 },
      ] },
      { at: 76, kind: "gate", side: 0, op: "mul", k: 2 },
      { at: 118, kind: "wave", clog: 22, leafN: 1 },
      { at: 200, kind: "gate", side: 1, op: "add", k: 6 },
      { at: 236, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "saw", hp: 28, x: -2.2 },
        { type: "weapon", gun: "burst", hp: 28, x: 2.2 },
      ] },
      { at: 278, kind: "wave", clog: 36, suds: 8, leaf: 1, duck: 1 },
      { at: 370, kind: "gate", side: 0, op: "add", k: 10 },
      { at: 400, kind: "crate", layout: "single", items: [{ type: "tier", hp: 36, x: 1.2 }] },
      { at: 430, kind: "gate", side: 1, op: "sub", k: 5 },
      { at: 492, kind: "wave", clog: 36, suds: 6, hauler: 1, spit: 1, hair: 1, leaf: 1 },
      { at: 580, kind: "gate", side: 1, op: "add", k: 8 },
      { at: 610, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 40, x: -2.4 },
        { type: "volunteer", hp: 36, x: 2.2 },
      ] },
      { at: 640, kind: "gate", side: 0, op: "add", k: 6 },
      { at: 670, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 28, x: -1.2 },
        { type: "volunteer", hp: 32, x: 2.8 },
      ] },
      { at: 700, kind: "gate", side: 1, op: "sub", k: 4 },
      { at: 730, kind: "crate", layout: "single", items: [{ type: "volunteer", hp: 44, x: 0.6 }] },
      { at: 760, kind: "gate", side: 0, op: "add", k: 10 },
      { at: 790, kind: "crate", layout: "row", items: [
        { type: "volunteer", hp: 24, x: -2.8 },
        { type: "volunteer", hp: 20, x: 1.8 },
      ] },
      { at: 820, kind: "gate", side: 1, op: "add", k: 8 },
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
  const shown = Math.max(1, Math.min(RENDER_CAP, n | 0));
  const spacing = FORM_GAP;
  const cols = Math.max(1, Math.ceil(Math.sqrt(shown)));
  const rows = Math.max(1, Math.ceil(shown / cols));
  const w = Math.max(0, cols - 1) * spacing;
  const h = Math.max(0, rows - 1) * spacing;
  const r = Math.max(0.35, Math.hypot(w * 0.5, h * 0.5) + 0.22);
  const road = Math.max(0.4, (half || DECK_HALF) - 0.7);
  return Math.min(r, road);
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

// Visible shots in one volley. Big squads fire fewer, fatter shots.
export function volleyPlan(n) {
  const count = Math.max(0, n | 0);
  const shown = Math.min(count, RENDER_CAP);
  let m = 1;
  if (count > 150) m = 5;
  else if (count > 60) m = 3;
  else if (count > 20) m = 2;
  const vis = shown <= 0 ? 0 : Math.max(1, Math.round(shown / m));
  return { m, vis, thick: Math.min(1.8, Math.sqrt(m)) };
}

export function weaponMods(id, tier) {
  const w = WEAPONS[id] || WEAPONS.burst;
  const t = Math.max(1, Math.min(4, tier | 0));
  const row = w.tiers[t - 1];
  const spread = row.spread != null ? row.spread : (w.spread || 0);
  const size = t >= 4 ? 1.35 : t >= 2 ? 1.15 : 1;
  return {
    id: w.id,
    name: w.name,
    family: w.family,
    line: w.line,
    tier: t,
    dmg: row.dmg,
    rate: row.rate,
    rateMax: row.rateMax || row.rate,
    pellets: row.pellets || w.pellets || 1,
    spread,
    pattern: w.pattern,
    falloff: w.falloff || 0,
    splash: row.splash != null ? row.splash : (w.splash || 0),
    knock: row.shove != null ? row.shove : (w.shove || 0),
    shove: row.shove != null ? row.shove : (w.shove || 0),
    pierce: row.pierce || 0,
    every: row.every || 0,
    turn: w.turn || 0,
    burn: row.burn || 0,
    slow: row.slow || 0,
    chain: row.chain || w.chain || 0,
    bounces: row.bounces || w.bounces || 0,
    charge: w.charge || 0,
    stagger: 0,
    crit: 0.08,
    color: w.color,
    gold: t >= 4 ? 1 : 0,
    heavy: w.heavy ? 1 : 0,
    spinUp: row.spinUp != null ? row.spinUp : (w.spinUp || 0),
    coneHits: row.coneHits || w.coneHits || 2,
    range: row.range || w.range || RANGE,
    puddle: row.puddle != null ? row.puddle : (w.puddle || 0),
    len: (w.len || 1.6) * size,
    thick: (w.thick || 0.2) * size,
  };
}

// Lab rescales damage only. Rate and pattern stay on the weapon row.
export const TUNED = {};

export function tunedMods(id, tier) {
  const mods = weaponMods(id, tier);
  const row = TUNED[id + ":" + mods.tier];
  if (!row) return mods;
  if (typeof row === "number") {
    mods.dmg = row;
    return mods;
  }
  if (row.dmg) mods.dmg = row.dmg;
  return mods;
}

export function tierAfterPickup(curId, curTier, nextId, bonus) {
  const cur = WEAPONS[curId] || WEAPONS.burst;
  const next = WEAPONS[nextId] || WEAPONS.burst;
  let t = cur.id === next.id ? curTier + 1 : curTier;
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
  if (!g.k) return "0";
  const n = String(Math.max(0, Math.round(g.k)));
  if (g.op === "add") return "+" + n;
  if (g.op === "sub") return "-" + n;
  return "/" + n;
}

export function gateBlue(op) {
  return op === "add" || op === "mul";
}

function gateAddCap(g) {
  if (g.baseOp === "sub") return Math.max(1, 15 - g.baseK);
  if (g.baseOp === "div") return 15;
  return (g.baseK || 0) + 15;
}

export function shootGate(g, hits) {
  g.frac += hits;
  let changed = false;
  const need = g.op === "mul" ? 18 : 6;
  const cap = gateAddCap(g);
  let guard = 0;
  while (g.frac >= need && guard++ < 64) {
    if (g.op === "mul" && g.tenths >= g.baseTenths + 10) {
      g.frac = need - 1;
      break;
    }
    if (g.op === "add" && g.k >= cap) {
      g.frac = need - 1;
      break;
    }
    g.frac -= need;
    changed = true;
    if (g.op === "add") g.k += 1;
    else if (g.op === "sub") {
      if (g.k > 0) g.k -= 1;
      else {
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
  return { op, k, tenths, baseTenths: tenths, baseOp: op, baseK: k, frac: 0 };
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

export function clogHit(type, hp, foam, dmg, splash, pierce, flame) {
  if (type === 5) return { hp: 0, foam: 0, dealt: Math.max(hp, dmg), burst: 0 };
  if (type === 1 && foam > 0) {
    const mul = flame ? 1.5 : splash ? 1 : 0.75;
    const f = dmg * mul;
    const next = foam - f;
    if (next > 0) return { hp, foam: next, dealt: f, burst: 0 };
    const overflow = dmg - foam / mul;
    const body = hp - (overflow > 0 ? overflow : 0);
    return { hp: body, foam: 0, dealt: f, burst: 1 };
  }
  let dealt = dmg;
  if (type === 2 && !splash && !pierce && !flame) dealt *= 0.75;
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
  const i = Math.min(GUN_ORDER.length - 1, Math.max(0, (rnd() * GUN_ORDER.length) | 0));
  return GUN_ORDER[i];
}

export function formationOffsets(n, radius, outX, outZ) {
  const shown = shownCount(n);
  if (!shown) return 0;
  const spacing = FORM_GAP;
  const rowH = spacing;
  let cols = Math.max(1, Math.ceil(Math.sqrt(shown)));
  let rows = Math.ceil(shown / cols);
  const w = Math.max(0, cols - 1) * spacing;
  const h = Math.max(0, rows - 1) * rowH;
  const fit = Math.max(0.2, Math.hypot(w * 0.5, h * 0.5) + 0.05);
  let scale = radius > 0 && fit > radius ? radius / fit : 1;
  if (w > LANE_BLOB) scale = Math.min(scale, LANE_BLOB / w);
  const sx = spacing * scale;
  const sy = rowH * scale;
  let i = 0;
  for (let r = 0; r < rows && i < shown; r++) {
    const rowCols = Math.min(cols, shown - i);
    const ox = -(rowCols - 1) * sx * 0.5;
    const z = (r - (rows - 1) * 0.5) * sy;
    for (let c = 0; c < rowCols; c++) {
      outX[i] = ox + c * sx;
      outZ[i] = z;
      i++;
    }
  }
  return shown;
}

export function enemyGap(type) {
  if (type === 5) return 0.72;
  return Math.max(0.9, ENEMY[type].rad * 1.75);
}

export function laneCols(type, count, half) {
  const n = count | 0;
  if (n <= 0) return 1;
  const edge = Math.max(0.6, (half || DECK_HALF) - 0.42);
  const fit = Math.max(1, Math.floor((edge * 2) / enemyGap(type)) + 1);
  return Math.max(1, Math.min(n, fit));
}

export function packAdvance(type, count, half) {
  const n = count | 0;
  if (n <= 0) return 0;
  const cols = laneCols(type, n, half);
  return Math.ceil(n / cols) * enemyGap(type) * 0.86;
}

export function waveBodies(ev) {
  let n = (ev.clog || 0) + (ev.suds || 0) + (ev.hauler || 0) + (ev.hair || 0) + (ev.spit || 0) + (ev.duck || 0);
  if (ev.leafN) n += ev.leafN;
  else if (ev.leaf) n += ev.leaf * 8;
  return n;
}

// Road the charging pack occupies. Rhythm uses this span. Scaling does not.
export function waveExtent(ev) {
  const n = Math.max(1, waveBodies(ev));
  const depth = Math.min(16, 3 + Math.sqrt(n) * 1.1);
  return { front: ev.at, end: ev.at + CHARGE_LEAD + depth };
}

export function layoutIssues() {
  const fails = [];
  const seen = {};
  for (let li = 0; li < LEVEL_IDS.length; li++) {
    const id = LEVEL_IDS[li];
    const evs = LEVELS[id].events;
    const waves = [];
    let gunEvents = 0;
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.kind === "wave") waves.push(waveExtent(ev, DECK_HALF));
      if (ev.kind !== "crate") continue;
      const items = ev.items || [];
      let weapon = 0;
      for (let k = 0; k < items.length; k++) {
        const item = items[k];
        if (item.type === "weapon") {
          seen[item.gun] = 1;
          weapon = 1;
        }
        const x = item.x || 0;
        if (Math.abs(x) > DECK_HALF - 0.4) fails.push(id + " crate x " + x);
      }
      if (weapon) gunEvents++;
    }
    if (gunEvents < 2 || gunEvents > 3) fails.push(id + " gun crates " + gunEvents);
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.kind !== "gate") continue;
      let prevEnd = -1e9;
      let nextAt = 1e9;
      for (let w = 0; w < waves.length; w++) {
        if (waves[w].end <= ev.at && waves[w].end > prevEnd) prevEnd = waves[w].end;
        if (waves[w].front >= ev.at - 0.01 && waves[w].front < nextAt) nextAt = waves[w].front;
        if (waves[w].front < ev.at && waves[w].end > ev.at - 6) fails.push(id + " wave in strip " + ev.at);
      }
      for (let j = 0; j < evs.length; j++) {
        if (j === i) continue;
        const o = evs[j];
        if (o.kind !== "crate" && o.kind !== "gate") continue;
        if (o.at > ev.at && o.at < nextAt) nextAt = o.at;
        if (o.at > ev.at - 6 && o.at < ev.at) fails.push(id + " strip " + ev.at);
      }
      if (prevEnd > -1e8 && ev.at < prevEnd + 20) fails.push(id + " gate " + ev.at + " after " + prevEnd.toFixed(1));
      if (nextAt < 1e8 && nextAt < ev.at + 12) fails.push(id + " gate " + ev.at + " before " + nextAt);
    }
    const anchors = [];
    for (let i = 0; i < evs.length; i++) {
      if (evs[i].kind === "gate" || evs[i].kind === "crate") anchors.push(evs[i].at);
    }
    anchors.sort(function (a, b) { return a - b; });
    let prev = 0;
    for (let i = 0; i < anchors.length; i++) {
      let crossed = 0;
      for (let w = 0; w < waves.length; w++) {
        if (waves[w].front < anchors[i] && waves[w].end > prev) crossed = 1;
      }
      const limit = crossed ? 160 : 48.05;
      if (anchors[i] - prev > limit) fails.push(id + " gap " + prev + ".." + anchors[i]);
      prev = anchors[i];
    }
  }
  for (let i = 0; i < GUN_ORDER.length; i++) {
    if (!seen[GUN_ORDER[i]]) fails.push("crate missing " + GUN_ORDER[i]);
  }
  const first = [];
  const evs = LEVELS["1-1"].events;
  for (let i = 0; i < evs.length; i++) {
    if (evs[i].kind !== "crate") continue;
    const items = evs[i].items || [];
    for (let k = 0; k < items.length; k++) if (items[k].type === "weapon") first.push(items[k].gun);
  }
  if (first.join(",") !== "dambust,mini,beam") fails.push("1-1 guns " + first.join(","));
  return fails;
}

export function expectedSquad(level, at) {
  let n = 3;
  const evs = (level && level.events) || [];
  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i];
    if (ev.kind !== "gate" || ev.at >= at || !ev.op) continue;
    const tenths = ev.op === "mul" ? Math.round(ev.k * 10) : 0;
    const out = applyGate(n, ev.op, ev.k, tenths);
    if (out > n) n = out;
  }
  return n;
}

export function waveMods(expect) {
  const e = Math.max(3, expect || 3);
  const scale = e / 20;
  return {
    nMul: Math.min(1.65, Math.pow(Math.max(1, scale), 0.34)),
    hpMul: Math.min(14, 1.35 + e * 0.04),
  };
}

export function bossMods(expect) {
  const e = Math.max(3, expect || 3);
  return Math.min(13, Math.max(1, e / 23));
}

// Boss summons are a short pack. Keep them up long enough to bite, not long enough to outlast the fight.
export function bossClogMul(expect) {
  const e = Math.max(3, expect || 3);
  return Math.min(1100, Math.max(8, e * 3.55));
}

function gateSpecial(ev) {
  return ev.op === "mul" || ev.op === "div" ? 1 : 0;
}

export function rhythmIssues() {
  const fails = [];
  for (let li = 0; li < LEVEL_IDS.length; li++) {
    const id = LEVEL_IDS[li];
    const level = LEVELS[id];
    const evs = level.events;
    const items = [{ at: 0, end: 0, kind: "start" }];
    const waves = [];
    const gates = [];
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.kind === "wave") {
        const ext = waveExtent(ev);
        items.push({ at: ev.at, end: ext.end, kind: "wave" });
        waves.push(ext);
      } else if (ev.kind === "gate" || ev.kind === "crate") {
        items.push({ at: ev.at, end: ev.at, kind: ev.kind });
        if (ev.kind === "gate") gates.push(ev);
      }
    }
    items.push({ at: level.len, end: level.len, kind: "boss" });
    items.sort(function (a, b) { return a.at - b.at; });
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      if (g.side !== 0 && g.side !== 1) fails.push(id + " gate side " + g.at);
      for (let w = 0; w < waves.length; w++) {
        const road = waves[w];
        if (g.at > road.front - 20 && g.at < road.end + 20) {
          fails.push(id + " gate " + g.at + " on road " + road.front + ".." + road.end.toFixed(1));
        }
      }
      if (i === 0) continue;
      const prev = gates[i - 1];
      const gap = g.at - prev.at;
      if (gap < 28) fails.push(id + " gate gap " + prev.at + ".." + g.at);
    }
    for (let i = 0; i < evs.length; i++) {
      if (evs[i].kind !== "crate") continue;
      for (let g = 0; g < gates.length; g++) {
        const at = gates[g].at;
        if (Math.abs(evs[i].at - at) < 20) fails.push(id + " crate " + evs[i].at + " near gate " + at);
      }
    }
  }
  return fails;
}

export function rhythmText() {
  const lines = [];
  for (let li = 0; li < LEVEL_IDS.length; li++) {
    const id = LEVEL_IDS[li];
    const level = LEVELS[id];
    lines.push("LEVEL " + id);
    lines.push("distance m | time s | type");
    const rows = [{ at: 0, kind: "start" }];
    for (let i = 0; i < level.events.length; i++) {
      const ev = level.events[i];
      if (ev.kind === "wave" || ev.kind === "gate" || ev.kind === "crate" || ev.kind === "boss") {
        let kind = ev.kind;
        if (ev.kind === "crate") {
          const items = ev.items || [];
          let tier = 0;
          let gun = "";
          for (let k = 0; k < items.length; k++) {
            if (items[k].type === "tier") tier = 1;
            if (items[k].type === "weapon") gun = gun ? gun + "+" + items[k].gun : items[k].gun;
          }
          kind = tier ? "crate tier" : "crate " + (gun || "item");
        }
        if (ev.kind === "wave") {
          const ext = waveExtent(ev, DECK_HALF);
          kind = "wave end " + ext.end.toFixed(1);
        }
        rows.push({ at: ev.at, kind: kind });
      }
    }
    if (!rows.length || rows[rows.length - 1].kind !== "boss") rows.push({ at: level.len, kind: "boss" });
    rows.sort(function (a, b) { return a.at - b.at; });
    for (let i = 0; i < rows.length; i++) {
      const t = rows[i].at / ADVANCE;
      lines.push(rows[i].at.toFixed(1) + " | " + t.toFixed(2) + " | " + rows[i].kind);
    }
    lines.push("");
  }
  const fails = rhythmIssues();
  lines.push(fails.length ? "RHYTHM FAIL" : "RHYTHM PASS");
  lines.push("empty stretch: no more than 48 m of road outside a wave body without a gate or crate");
  lines.push("road clearance: no gate within 20 m of Clogs still on the road");
  for (let i = 0; i < fails.length; i++) lines.push(fails[i]);
  return lines.join("\n");
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
  eq(gateLabel(plus), "+5", "+ fresh");
  eq(applyGate(3, "sub", 2, 20), 1, "first half lives");
  shootGate(plus, 6);
  eq(plus.k, 6, "+ shoot");
  eq(gateLabel(plus), "+6", "+ label");
  shootGate(plus, 6 * 40);
  eq(plus.k, 20, "+ cap");

  const minus = freshGate("sub", 1);
  shootGate(minus, 6);
  eq(minus.op, "sub", "minus zero op");
  eq(minus.k, 0, "minus zero");
  eq(gateLabel(minus), "0", "zero label");
  eq(gateBlue(minus.op), false, "zero stays red");
  shootGate(minus, 6);
  eq(minus.op, "add", "minus flip op");
  eq(minus.k, 1, "minus flip k");
  eq(gateBlue(minus.op), true, "minus flip blue");
  shootGate(minus, 6 * 40);
  eq(minus.k, 14, "minus cap");

  const red = freshGate("sub", 3);
  const other = freshGate("add", 4);
  shootGate(red, 6 * 40);
  eq(red.op, "add", "red positive");
  eq(red.k, 12, "red cap");
  eq(other.op, "add", "other half op");
  eq(other.k, 4, "other half k");

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
  shootGate(div, 6 * 40);
  eq(div.k, 15, "div cap");

  eq(weaponMods("burst", 1).dmg, 8.7, "t1 dmg");
  eq(Math.round(weaponMods("burst", 1).rate * 100), 160, "t1 rate");
  eq(weaponMods("burst", 3).pellets, 4, "t3 burst");
  eq(weaponMods("burst", 4).pierce, 1, "t4 pierce");
  eq(weaponMods("dambust", 1).pellets, 9, "t1 pellets");
  eq(weaponMods("dambust", 4).pellets, 12, "t4 pellets");
  eq(weaponMods("mini", 1).pattern, "spin", "mini spin");
  eq(Math.round(weaponMods("mini", 1).rateMax * 10), 63, "mini max");
  eq(Math.round(weaponMods("beam", 1).dmg * 10), 48, "beam dmg");
  eq(weaponMods("beam", 1).pattern, "bolt", "beam bolts");
  eq(Math.round(weaponMods("flame", 1).dmg * 10), 13, "flame dmg");
  eq(weaponMods("flame", 1).pattern, "stream", "flame stream");
  eq(Math.round(weaponMods("glacier", 1).slow * 10), 24, "glacier slow");
  eq(weaponMods("storm", 1).chain, 3, "storm chain");
  eq(weaponMods("storm", 4).chain, 5, "storm t4");
  eq(weaponMods("rail", 1).pierce, 40, "rail pierce");
  eq(Math.round(weaponMods("rail", 1).charge * 100), 45, "rail charge");
  eq(weaponMods("saw", 1).bounces, 3, "saw bounce");
  eq(weaponMods("aurora", 1).pattern, "orb", "aurora orb");
  eq(GUN_ORDER.length, 12, "12 guns");
  eq(DECK_HALF, 4.5, "deck half");
  eq(BOSS_HALF, 4.5, "boss half");
  eq(GATE_X, 3, "gate x");
  eq(PANEL_W, 2.6, "panel");
  eq(BOSS_TALL.grunk, 6, "grunk tall");
  eq(ENEMY[0].tall, 1.6, "clog tall");
  eq(ENEMY[1].tall, 2.0, "suds tall");
  eq(ENEMY[2].tall, 2.6, "hauler tall");
  eq(ENEMY[4].tall, 1.8, "spit tall");
  eq(weaponMods("flame", 4).gold, 1, "gold");
  eq(Math.round(weaponMods("burst", 4).rate * 100), 210, "burst t4 rate");
  eq(migrateGun("bow"), "rail", "migrate bow");
  eq(migrateGun("smg"), "burst", "migrate smg");
  eq(migrateGun("gerald"), "mini", "migrate gerald");
  eq(migrateGun("frost"), "glacier", "migrate frost");
  eq(migrateGun("log"), "cone", "migrate log");
  eq(migrateGun("nope"), "", "migrate drop");
  eq(migrateGun("beam"), "beam", "migrate keep");
  eq(tierAfterPickup("burst", 1, "mini", 0), 1, "swap family");
  eq(tierAfterPickup("burst", 2, "burst", 0), 3, "same tier");
  eq(tierAfterPickup("burst", 3, "dambust", 0), 3, "same family");
  eq(tierAfterPickup("burst", 3, "cone", 0), 3, "other family");
  eq(tierAfterPickup("burst", 1, "mini", 1), 2, "rack bonus");
  eq(tierAfterPickup("burst", 4, "burst", 0), 4, "cap t4");
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

  const foam = clogHit(1, 50, 40, 10, 0, 0, 0);
  eq(Math.round(foam.foam * 10), 325, "foam chip");
  const flameFoam = clogHit(1, 50, 40, 10, 0, 0, 1);
  eq(Math.round(flameFoam.foam), 25, "flame foam");
  const splashFoam = clogHit(1, 50, 40, 10, 1, 0, 0);
  eq(Math.round(splashFoam.foam), 30, "splash foam");
  const leaf = clogHit(5, 4, 0, 1, 0, 0, 0);
  eq(leaf.hp, 0, "any leaf");
  const pierceHaul = clogHit(2, 400, 0, 10, 0, 1, 0);
  eq(pierceHaul.dealt, 10, "pierce hauler");
  const flameHaul = clogHit(2, 400, 0, 10, 0, 0, 1);
  eq(flameHaul.dealt, 10, "flame hauler");
  const frontHaul = clogHit(2, 400, 0, 10, 0, 0, 0);
  eq(Math.round(frontHaul.dealt * 10), 75, "front hauler");
  const grown = hairGrowth(40);
  eq(grown.bite, 7, "hair bite");
  eq(grown.hpScale, 3, "hair cap");

  const pick = mysteryPick(GUN_ORDER, () => 0.01);
  if (GUN_ORDER.indexOf(pick) < 0) fails.push("mystery locked " + pick);
  const plan = volleyPlan(300);
  eq(plan.m, 5, "volley m");
  eq(plan.vis, 12, "volley vis");
  eq(highestPlayable({}), "1-1", "highest fresh");
  eq(highestPlayable({ "1-1": true }), "1-2", "highest 2");
  eq(nextLevel("1-3"), "", "no chapter 2");
  const layout = layoutIssues();
  for (let i = 0; i < layout.length; i++) fails.push(layout[i]);
  const rhythm = rhythmIssues();
  for (let i = 0; i < rhythm.length; i++) fails.push(rhythm[i]);
  eq(crateHp(700, "duck"), 350, "duck hp");
  eq(crateHp(1000, "forged"), 800, "forged hp");
  if (JSON.stringify(WEAPONS).indexOf("Sap Sprayer") >= 0) fails.push("sap sprayer name");
  if (JSON.stringify(WEAPONS).indexOf("JOKE") >= 0) fails.push("joke family");

  const xs = new Float32Array(64);
  const zs = new Float32Array(64);
  const rad = formationRadius(40, 5);
  const shown = formationOffsets(40, rad, xs, zs);
  eq(shown, 40, "shown");
  let wide = 0;
  for (let i = 0; i < shown; i++) {
    if (xs[i] * xs[i] + zs[i] * zs[i] > rad * rad + 1e-4) fails.push("formation outside");
    if (Math.abs(xs[i]) > wide) wide = Math.abs(xs[i]);
  }
  if (wide * 2 > LANE_BLOB + 0.2) fails.push("blob wide " + wide);
  if (Math.abs(clampLane(9, 1, 5) - 4) > 1e-6) fails.push("clamp lane");
  if (Math.abs(clampLane(9, 1, DECK_HALF) - (DECK_HALF - 1)) > 1e-6) fails.push("clamp deck");
  for (let i = 0; i < ENEMY.length; i++) {
    if (ENEMY[i].id === "leaf") continue;
    if (ENEMY[i].tall < 0.95) fails.push("short " + ENEMY[i].id);
  }
  return fails;
}
