// Dam Run rules. No rendering. World forward is -Z.
// br3 gun table. Lab may multiply a tier's DMG; the comment block at the
// bottom of weaponMods records the numbers that passed the gun lab.

export const BUILD = "br3d";
export const SIM_CAP = 300;
export const RENDER_CAP = 60;
export const LIVE_CAP = 320;
export const ADVANCE = 8;
export const STEER_MAX = 14;
export const RANGE = 28;
export const DECK_HALF = 3;
export const BOSS_HALF = 3.6;
export const FORM_GAP = 0.46;
export const LANE_BLOB = 2.15;
export const LANE_X = 1.5;

const DEG = Math.PI / 180;

export const GUN_ORDER = ["bow", "long", "smg", "shot", "gerald", "log", "rocket", "flame", "party", "sap", "beam", "storm", "frost", "rail"];

export const WEAPONS = {
  bow: {
    id: "bow", name: "Twig Crossbow", family: "ARROWS", pattern: "arrow",
    color: "#F4E6C3", pellets: 1, spread: 0, shove: 0.3, len: 1.6, thick: 0.2, heavy: 0, line: "",
    tiers: [
      { dmg: 14, rate: 3.43 },
      { dmg: 17, rate: 3.94 },
      { dmg: 17, rate: 3.94, every: 2, pierce: 1 },
      { dmg: 23, rate: 3.94, every: 2, pierce: 1, splash: 0.6 },
    ],
  },
  long: {
    id: "long", name: "Reed's Longbow", family: "ARROWS", pattern: "pierce",
    color: "#F7F7FF", pellets: 1, spread: 0, shove: 0.5, len: 3, thick: 0.25, heavy: 0,
    line: "Long legs, long shots, rounded numbers.",
    tiers: [
      { dmg: 40, rate: 0.65, pierce: 3 },
      { dmg: 52, rate: 0.75, pierce: 3 },
      { dmg: 67, rate: 0.75, pierce: 4 },
      { dmg: 100, rate: 0.75, pierce: 5 },
    ],
  },
  smg: {
    id: "smg", name: "Acorn SMG", family: "BULLETS", pattern: "spread",
    color: "#F5C400", pellets: 1, spread: 3 * DEG, shove: 0.12, len: 1.5, thick: 0.18, heavy: 0, line: "",
    tiers: [
      { dmg: 12, rate: 4.22 },
      { dmg: 15, rate: 4.85 },
      { dmg: 21, rate: 4.85, spread: 1.5 * DEG },
      { dmg: 25, rate: 5.82, spread: 1.5 * DEG },
    ],
  },
  shot: {
    id: "shot", name: "Pinecone Shotgun", family: "BULLETS", pattern: "fan",
    color: "#E86A1A", pellets: 6, spread: 25 * DEG, falloff: 14, shove: 0.25, len: 1.2, thick: 0.22, heavy: 1, line: "",
    tiers: [
      { dmg: 12, rate: 0.97, pellets: 6 },
      { dmg: 15, rate: 1.12, pellets: 6 },
      { dmg: 18, rate: 1.12, pellets: 7 },
      { dmg: 23, rate: 1.12, pellets: 8 },
    ],
  },
  gerald: {
    id: "gerald", name: "Gerald Jr.", family: "BULLETS", pattern: "spin",
    color: "#3DDC6A", pellets: 1, spread: 4 * DEG, shove: 0.1, len: 1.8, thick: 0.2, heavy: 0,
    spinUp: 0.6, line: "Gerald says hold the line.",
    tiers: [
      { dmg: 12, rate: 3, rateMax: 6.33 },
      { dmg: 15, rate: 3.45, rateMax: 7.28 },
      { dmg: 18, rate: 3.45, rateMax: 7.28, spinUp: 0.3 },
      { dmg: 21, rate: 4.14, rateMax: 8.74, spinUp: 0.3 },
    ],
  },
  log: {
    id: "log", name: "Log Launcher", family: "ROCKETS", pattern: "lob",
    color: "#8B5A2B", pellets: 1, spread: 0, splash: 1.6, shove: 1.5, len: 1.4, thick: 0.35, heavy: 1, line: "",
    tiers: [
      { dmg: 45, rate: 0.49, splash: 1.6 },
      { dmg: 64, rate: 0.56, splash: 1.6 },
      { dmg: 95, rate: 0.56, splash: 1.8 },
      { dmg: 129, rate: 0.56, splash: 2.0 },
    ],
  },
  rocket: {
    id: "rocket", name: "Firework Rockets", family: "ROCKETS", pattern: "home",
    color: "#FF2E63", pellets: 1, spread: 0, splash: 1.2, shove: 1.0, turn: 180, len: 2.2, thick: 0.28, heavy: 1,
    line: "Small splash, big joy.",
    tiers: [
      { dmg: 34, rate: 0.81, splash: 1.2 },
      { dmg: 45, rate: 0.93, splash: 1.2 },
      { dmg: 64, rate: 0.93, splash: 1.4 },
      { dmg: 82, rate: 0.93, splash: 1.6 },
    ],
  },
  party: {
    id: "party", name: "Party Yeet", family: "ROCKETS", pattern: "party",
    color: "#C86BFF", pellets: 5, spread: 0, splash: 0.9, shove: 0.7, len: 2.4, thick: 0.32, heavy: 1,
    line: "Confetti, but make it hurt.",
    tiers: [
      { dmg: 18, rate: 0.39, pellets: 5, splash: 0.9 },
      { dmg: 23, rate: 0.45, pellets: 5, splash: 0.9 },
      { dmg: 27, rate: 0.45, pellets: 6, splash: 0.9 },
      { dmg: 32, rate: 0.45, pellets: 6, splash: 1.1 },
    ],
  },
  flame: {
    id: "flame", name: "Maple Flamer", family: "FLAME", pattern: "cone",
    color: "#FF6A1A", pellets: 1, spread: 30 * DEG, shove: 0, range: 10, coneHits: 3, len: 1.4, thick: 0.22, heavy: 0,
    line: "Washes off Suds Knights.",
    tiers: [
      { dmg: 3.5, rate: 3.0, burn: 4.2, spread: 30 * DEG, coneHits: 3, range: 10 },
      { dmg: 4.5, rate: 3.45, burn: 5.4, spread: 30 * DEG, coneHits: 3, range: 10 },
      { dmg: 4.6, rate: 3.45, burn: 5.6, spread: 36 * DEG, coneHits: 4, range: 10 },
      { dmg: 4.9, rate: 3.45, burn: 6.0, spread: 36 * DEG, coneHits: 5, range: 12 },
    ],
  },
  sap: {
    id: "sap", name: "Sap Burner", family: "FLAME", pattern: "glob",
    color: "#E0A030", pellets: 1, spread: 0, splash: 1.3, shove: 0.8, puddle: 1.3, len: 1.3, thick: 0.3, heavy: 1,
    line: "Sticky. Hot. Clogs hate it.",
    tiers: [
      { dmg: 30, rate: 0.51, burn: 4.5, splash: 1.3, puddle: 1.3 },
      { dmg: 37, rate: 0.59, burn: 5.6, splash: 1.3, puddle: 1.3 },
      { dmg: 44, rate: 0.59, burn: 6.6, splash: 1.5, puddle: 1.5 },
      { dmg: 52, rate: 0.59, burn: 7.7, splash: 1.7, puddle: 1.7 },
    ],
  },
  beam: {
    id: "beam", name: "Beaver Beam", family: "LASER", pattern: "beam",
    color: "#FF2430", pellets: 1, spread: 0, shove: 0, len: 2.4, thick: 0.08, heavy: 0,
    line: "A red line. It does not stop.",
    tiers: [
      { dmg: 3.2, rate: 8 },
      { dmg: 4.0, rate: 9 },
      { dmg: 4.8, rate: 9 },
      { dmg: 6.0, rate: 10 },
    ],
  },
  storm: {
    id: "storm", name: "Storm Acorn", family: "TESLA", pattern: "chain",
    color: "#3A6BFF", pellets: 1, spread: 0, shove: 0.4, len: 1.6, thick: 0.16, heavy: 0, chain: 3,
    line: "One bolt. Three Clogs.",
    tiers: [
      { dmg: 16, rate: 1.2, chain: 3 },
      { dmg: 20, rate: 1.35, chain: 3 },
      { dmg: 24, rate: 1.35, chain: 3 },
      { dmg: 30, rate: 1.5, chain: 3 },
    ],
  },
  frost: {
    id: "frost", name: "Frost Nut", family: "CRYO", pattern: "frost",
    color: "#7DEBFF", pellets: 1, spread: 0, splash: 1.7, shove: 0.6, len: 1.2, thick: 0.28, heavy: 1,
    line: "Icy nuts. Clogs go pale and slow.",
    tiers: [
      { dmg: 28, rate: 0.62, splash: 1.7, slow: 2 },
      { dmg: 36, rate: 0.7, splash: 1.8, slow: 2 },
      { dmg: 44, rate: 0.7, splash: 2.0, slow: 2 },
      { dmg: 54, rate: 0.75, splash: 2.2, slow: 2 },
    ],
  },
  rail: {
    id: "rail", name: "Pine Rail", family: "SNIPER", pattern: "rail",
    color: "#FFF6D8", pellets: 1, spread: 0, shove: 1.2, len: 3.4, thick: 0.22, heavy: 1,
    line: "One shot. The whole line.",
    tiers: [
      { dmg: 28, rate: 0.42, pierce: 40 },
      { dmg: 36, rate: 0.48, pierce: 40 },
      { dmg: 46, rate: 0.48, pierce: 40 },
      { dmg: 58, rate: 0.55, pierce: 40 },
    ],
  },
};

export const TIER_TTK = [0, 4.0, 3.0, 2.25, 1.7];

export const STARTERS = ["bow", "smg", "shot", "log"];
export const UNLOCKS = {
  "1-1": ["long", "gerald", "sap", "party", "beam", "storm"],
  "1-2": ["rocket", "flame", "frost", "rail"],
};

export const GUN_COST = {
  long: 90,
  gerald: 110,
  rocket: 130,
  flame: 120,
  party: 100,
  sap: 100,
  beam: 150,
  storm: 160,
  frost: 140,
  rail: 180,
};

export const FAMILY_WEIGHT = {
  ARROWS: 16, BULLETS: 22, ROCKETS: 22, FLAME: 14, LASER: 8, TESLA: 6, CRYO: 6, SNIPER: 6,
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
    bossHp: 3000,
    bossName: "BARON CLOG",
    win: "BRIDGE HELD!",
    events: [
      { at: 32, kind: "gate", pair: [{ op: "add", k: 5 }, { op: "sub", k: 3 }] },
      { at: 52, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "smg", hp: 360, x: -1.5 }] },
      { at: 78, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 4 }] },
      { at: 108, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 3 }] },
      { at: 112, kind: "wave", clog: 40 },
      { at: 164, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 188, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "shot", hp: 620, x: 1.5 }] },
      { at: 214, kind: "gate", pair: [{ op: "add", k: 4 }, { op: "sub", k: 3 }] },
      { at: 256, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 5 }] },
      { at: 248, kind: "wave", clog: 72, suds: 22 },
      { at: 312, kind: "gate", pair: [{ op: "add", k: 12 }, { op: "div", k: 2 }] },
      { at: 336, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "beam", hp: 880, x: -1.5 }] },
      { at: 364, kind: "crate", layout: "single", items: [{ type: "tier", hp: 520, x: 1.5 }] },
      { at: 392, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 6 }] },
      { at: 416, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 4 }] },
      { at: 436, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 428, kind: "wave", clog: 80, suds: 24, hauler: 2, duck: 1 },
      { at: 500, kind: "gate", pair: [{ op: "add", k: 10 }, { op: "sub", k: 6 }] },
      { at: 560, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 8 }] },
      { at: 596, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 3 }] },
      { at: 632, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "div", k: 2 }] },
      { at: 688, kind: "gate", pair: [{ op: "add", k: 4 }, { op: "sub", k: 2 }] },
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
      { at: 54, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "long", hp: 640, x: -1.5 },
        { type: "weapon", gun: "gerald", hp: 640, x: 1.5 },
      ] },
      { at: 86, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 5 }] },
      { at: 120, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 4 }] },
      { at: 122, kind: "wave", clog: 52 },
      { at: 176, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 5 }] },
      { at: 204, kind: "crate", layout: "single", items: [{ type: "weapon", gun: "log", hp: 860, x: -1.5 }] },
      { at: 232, kind: "gate", pair: [{ op: "add", k: 5 }, { op: "sub", k: 3 }] },
      { at: 252, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 3 }] },
      { at: 278, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 270, kind: "wave", clog: 74, suds: 16, hair: 2 },
      { at: 340, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 8 }] },
      { at: 368, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "rocket", hp: 980, x: -1.5 },
        { type: "weapon", gun: "flame", hp: 980, x: 1.5 },
      ] },
      { at: 400, kind: "crate", layout: "single", items: [{ type: "tier", hp: 700, x: 0 }] },
      { at: 428, kind: "gate", pair: [{ op: "add", k: 10 }, { op: "sub", k: 6 }] },
      { at: 456, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 6 }] },
      { at: 478, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 5 }] },
      { at: 470, kind: "wave", clog: 96, suds: 28, hauler: 2, spit: 4, duck: 1 },
      { at: 540, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 3 }] },
      { at: 556, kind: "gate", pair: [{ op: "add", k: 12 }, { op: "div", k: 2 }] },
      { at: 620, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 6 }] },
      { at: 655, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 690, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 748, kind: "gate", pair: [{ op: "mul", k: 3 }, { op: "add", k: 10 }] },
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
      { at: 28, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 6 }] },
      { at: 52, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "party", hp: 900, x: -1.5 },
        { type: "weapon", gun: "sap", hp: 900, x: 1.5 },
      ] },
      { at: 82, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 6 }] },
      { at: 126, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 4 }] },
      { at: 118, kind: "wave", clog: 48, leafN: 2 },
      { at: 176, kind: "gate", pair: [{ op: "add", k: 10 }, { op: "sub", k: 5 }] },
      { at: 204, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "storm", hp: 1100, x: -1.5 },
        { type: "weapon", gun: "frost", hp: 1100, x: 1.5 },
      ] },
      { at: 236, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 4 }] },
      { at: 258, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 4 }] },
      { at: 286, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 5 }] },
      { at: 278, kind: "wave", clog: 84, suds: 20, leaf: 1, duck: 1 },
      { at: 340, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 3 }] },
      { at: 352, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 10 }] },
      { at: 380, kind: "crate", layout: "pair", items: [
        { type: "weapon", gun: "rail", hp: 1280, x: -1.5 },
        { type: "weapon", gun: "bow", hp: 1280, x: 1.5 },
      ] },
      { at: 412, kind: "crate", layout: "single", items: [{ type: "tier", hp: 900, x: 0 }] },
      { at: 444, kind: "gate", pair: [{ op: "add", k: 12 }, { op: "sub", k: 8 }] },
      { at: 476, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 5 }] },
      { at: 500, kind: "gate", pair: [{ op: "add", k: 10 }, { op: "sub", k: 6 }] },
      { at: 492, kind: "wave", clog: 110, suds: 36, hauler: 3, spit: 6, hair: 2, leaf: 2 },
      { at: 578, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 590, kind: "gate", pair: [{ op: "add", k: 14 }, { op: "div", k: 2 }] },
      { at: 623, kind: "gate", pair: [{ op: "add", k: 6 }, { op: "sub", k: 3 }] },
      { at: 656, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 8 }] },
      { at: 692, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 4 }] },
      { at: 728, kind: "gate", pair: [{ op: "add", k: 10 }, { op: "sub", k: 6 }] },
      { at: 764, kind: "gate", pair: [{ op: "add", k: 8 }, { op: "sub", k: 5 }] },
      { at: 800, kind: "gate", pair: [{ op: "mul", k: 3 }, { op: "add", k: 12 }] },
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
  const shown = Math.max(1, Math.min(30, n | 0));
  const spacing = FORM_GAP;
  const rowH = spacing * 0.8660254;
  const cols = Math.max(1, Math.ceil(Math.sqrt(shown)));
  const rows = Math.max(1, Math.ceil(shown / cols));
  const w = Math.max(0, cols - 1) * spacing + spacing * 0.5;
  const h = Math.max(0, rows - 1) * rowH;
  const r = Math.max(0.35, Math.hypot(w * 0.5, h * 0.5) + 0.05);
  const cap = Math.min(r, LANE_BLOB * 0.5);
  const road = Math.max(0.4, (half || DECK_HALF) - 0.55);
  return Math.min(cap, road);
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
  const row = w.tiers[t - 1];
  const spread = row.spread != null ? row.spread : (w.spread || 0);
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
    stagger: 0,
    crit: 0.08,
    color: w.color,
    gold: t >= 4 ? 1 : 0,
    heavy: w.heavy ? 1 : 0,
    spinUp: row.spinUp || w.spinUp || 0.6,
    coneHits: row.coneHits || w.coneHits || 3,
    range: row.range || w.range || 10,
    puddle: row.puddle != null ? row.puddle : (w.puddle || 0),
    len: w.len || 1.6,
    thick: w.thick || 0.2,
  };
}

// Gun lab writes tuned DMG here when a tier is outside the band.
// The authored G4 table stays. A 3-pass lab (N=20, 1-1 HP) finished at
// tier means 4.25 / 3.57 / 3.20 / 2.92 s against 4.0 / 3.0 / 2.25 / 1.7.
// Past the one-shot line, more DMG did not shorten TTK: the hex is deeper
// than the old 28 m reach, and a lob volley lands together. The 3x cap
// was hit without bringing T3 or T4 into band, so those multipliers were
// not kept.
export const TUNED = {};

export function tunedMods(id, tier) {
  const mods = weaponMods(id, tier);
  const key = id + ":" + mods.tier;
  if (TUNED[key]) mods.dmg = TUNED[key];
  return mods;
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
  const fams = ["ARROWS", "BULLETS", "ROCKETS", "FLAME", "LASER", "TESLA", "CRYO", "SNIPER"];
  let total = 0;
  const counts = [0, 0, 0, 0, 0, 0, 0, 0];
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
  const spacing = FORM_GAP;
  const rowH = spacing * 0.8660254;
  let cols = Math.max(1, Math.ceil(Math.sqrt(shown)));
  let rows = Math.ceil(shown / cols);
  const w = Math.max(0, cols - 1) * spacing + spacing * 0.5;
  const h = Math.max(0, rows - 1) * rowH;
  const fit = Math.max(0.2, Math.hypot(w * 0.5, h * 0.5) + 0.05);
  let scale = radius > 0 && fit > radius ? radius / fit : 1;
  if (w > LANE_BLOB) scale = Math.min(scale, LANE_BLOB / w);
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

export function waveExtent(ev, half) {
  let cursor = ev.at + 21;
  let end = cursor;
  const seq = [];
  if (ev.clog) seq.push([0, ev.clog]);
  if (ev.hauler) seq.push([2, ev.hauler]);
  if (ev.suds) seq.push([1, ev.suds]);
  if (ev.hair) seq.push([3, ev.hair]);
  if (ev.spit) seq.push([4, ev.spit]);
  if (ev.leafN) seq.push([5, ev.leafN]);
  else if (ev.leaf) {
    for (let s = 0; s < ev.leaf; s++) seq.push([5, 8]);
  }
  if (ev.duck) seq.push([6, ev.duck]);
  for (let i = 0; i < seq.length; i++) {
    if (i) cursor += 0.8;
    const type = seq[i][0];
    const n = seq[i][1];
    const step = enemyGap(type) * 0.86;
    const rows = Math.ceil(n / laneCols(type, n, half));
    end = cursor + Math.max(0, rows - 1) * step;
    cursor += rows * step;
  }
  return { front: ev.at + 21, end };
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
        const lane = Math.abs(x) < 0.05 || Math.abs(Math.abs(x) - LANE_X) < 0.05;
        if (!lane) fails.push(id + " crate x " + x);
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
      if (prevEnd > -1e8 && ev.at < prevEnd + 12) fails.push(id + " gate " + ev.at + " after " + prevEnd.toFixed(1));
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
      const limit = crossed ? 84 : 64;
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
  if (first.join(",") !== "smg,shot,beam") fails.push("1-1 guns " + first.join(","));
  return fails;
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

  eq(weaponMods("bow", 1).dmg, 14, "t1 dmg");
  eq(Math.round(weaponMods("bow", 2).rate * 100), 394, "t2 rate");
  eq(weaponMods("bow", 2).dmg, 17, "t2 dmg");
  eq(weaponMods("shot", 1).pellets, 6, "t1 pellets");
  eq(weaponMods("shot", 3).pellets, 7, "t3 pellets");
  eq(weaponMods("shot", 4).pellets, 8, "t4 pellets");
  eq(weaponMods("long", 1).pierce, 3, "pierce");
  eq(weaponMods("long", 3).pierce, 4, "t3 pierce");
  eq(weaponMods("long", 4).pierce, 5, "t4 pierce");
  eq(Math.round(weaponMods("log", 4).splash * 10), 20, "t4 splash");
  eq(Math.round(weaponMods("party", 1).crit * 100), 8, "crit");
  eq(weaponMods("party", 1).family, "ROCKETS", "party family");
  eq(weaponMods("party", 3).pellets, 6, "party t3");
  eq(weaponMods("sap", 1).name, "Sap Burner", "sap name");
  eq(weaponMods("sap", 1).pattern, "glob", "sap glob");
  eq(weaponMods("sap", 1).slow, 0, "no slow");
  eq(weaponMods("frost", 1).slow, 2, "frost slow");
  eq(weaponMods("storm", 1).chain, 3, "storm chain");
  eq(weaponMods("rail", 1).pierce, 40, "rail pierce");
  eq(weaponMods("beam", 1).pattern, "beam", "beam pattern");
  eq(GUN_ORDER.length, 14, "14 guns");
  eq(DECK_HALF, 3, "deck half");
  eq(BOSS_HALF, 3.6, "boss half");
  eq(BOSS_TALL.grunk, 6, "grunk tall");
  eq(ENEMY[0].tall, 1.6, "clog tall");
  eq(ENEMY[1].tall, 2.0, "suds tall");
  eq(ENEMY[2].tall, 2.6, "hauler tall");
  eq(ENEMY[4].tall, 1.8, "spit tall");
  eq(weaponMods("flame", 4).gold, 1, "gold");
  eq(weaponMods("flame", 4).coneHits, 5, "flame t4 hits");
  eq(Math.round(weaponMods("smg", 4).rate * 100), 582, "smg t4 rate");
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

  const pick = mysteryPick(["bow", "smg", "shot", "log"], () => 0.01);
  if (STARTERS.indexOf(pick) < 0) fails.push("mystery locked " + pick);
  eq(highestPlayable({}), "1-1", "highest fresh");
  eq(highestPlayable({ "1-1": true }), "1-2", "highest 2");
  eq(nextLevel("1-3"), "", "no chapter 2");
  const layout = layoutIssues();
  for (let i = 0; i < layout.length; i++) fails.push(layout[i]);
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
  if (Math.abs(clampLane(9, 1, DECK_HALF) - 2) > 1e-6) fails.push("clamp deck");
  for (let i = 0; i < ENEMY.length; i++) {
    if (ENEMY[i].id === "leaf") continue;
    if (ENEMY[i].tall < 0.95) fails.push("short " + ENEMY[i].id);
  }
  return fails;
}
