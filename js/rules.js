// Dam Run rules. No rendering. World forward is -Z.
// br3 gun table. Lab may multiply a tier's DMG; the comment block at the
// bottom of weaponMods records the numbers that passed the gun lab.

export const BUILD = "br23";
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
export const FORM_MAX_W = 2.4;
export const FORM_MAX_COLS = 4;
export const FORM_LEADER = 1.15;
export const LANE_EDGE = 1.5;
export const RIVER_X = 1.3;
export const RIVER_CAP = [40, 34, 24, 18, 15, 13, 12, 11, 10, 9];
export const RIVER_YELLOW = 0.7;
export const RIVER_RED = 0.9;
export const RIVER_COOL = 4;
export const RIVER_SPILL = 0.25;
export const LANE_BLOB = 7.2;
export const LANE_X = 2.2;
export const GATE_X = 3;
export const PANEL_W = 2.6;
export const DIVIDER_W = 0;
export const AIM_CONE = 42 * Math.PI / 180;
export const CROWD_X = 3.05;
export const CHARGE_LEAD = 14;
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
    id: "mini", name: "Gnasher", family: "BULLETS", pattern: "spin",
    color: "#F5C400", pellets: 1, spread: 6 * DEG, shove: 0, range: 18, len: 1.1, thick: 0.16, heavy: 0, spinUp: 0.45,
    line: "It spins up and chews one lane.",
    tiers: [
      { dmg: 1.15, rate: 12, rateMax: 18, range: 18 },
      { dmg: 1.45, rate: 13, rateMax: 19, range: 18 },
      { dmg: 1.8, rate: 13, rateMax: 20, range: 19 },
      { dmg: 2.2, rate: 14, rateMax: 21, range: 20 },
    ],
  },
  dambust: {
    id: "dambust", name: "Dam Bust", family: "BULLETS", pattern: "fan",
    color: "#E86A1A", pellets: 7, spread: 26 * DEG, shove: 1.1, range: 11, len: 0.9, thick: 0.22, heavy: 0,
    line: "A wide fan of chips. It clears the front rank.",
    tiers: [
      { dmg: 1.25, rate: 7, range: 11, pellets: 7 },
      { dmg: 1.6, rate: 8, range: 11, pellets: 8 },
      { dmg: 2, rate: 8, range: 12, pellets: 8 },
      { dmg: 2.5, rate: 9, range: 13, pellets: 9 },
    ],
  },
  burst: {
    id: "burst", name: "Incisors", family: "BULLETS", pattern: "burst",
    color: "#F4E6C3", pellets: 3, spread: 4 * DEG, shove: 0, range: 16, len: 0.85, thick: 0.14, heavy: 0,
    line: "Three fast bites. The gun you start with.",
    tiers: [
      { dmg: 3.4, rate: 8, range: 16, pellets: 3 },
      { dmg: 4.2, rate: 9, range: 16, pellets: 3 },
      { dmg: 5, rate: 9, range: 17, pellets: 3 },
      { dmg: 6, rate: 10, range: 18, pellets: 4 },
    ],
  },
  saw: {
    id: "saw", name: "Ring Saw", family: "BLADES", pattern: "disc",
    color: "#D8DDE6", pellets: 1, spread: 0, shove: 0.4, range: 14, len: 0.7, thick: 0.2, heavy: 0, bounces: 4,
    line: "A saw that skips across the pack.",
    tiers: [
      { dmg: 3.4, rate: 6, range: 14, bounces: 4 },
      { dmg: 4.2, rate: 7, range: 14, bounces: 5 },
      { dmg: 5.1, rate: 7, range: 15, bounces: 5 },
      { dmg: 6.2, rate: 8, range: 16, bounces: 6 },
    ],
  },
  rail: {
    id: "rail", name: "Pine Rail", family: "BULLETS", pattern: "rail",
    color: "#C9864A", pellets: 1, spread: 1 * DEG, shove: 1.2, range: 22, len: 1.4, thick: 0.12, heavy: 0,
    line: "One long shot. It goes through the line.",
    tiers: [
      { dmg: 5.2, rate: 5, range: 22, pierce: 8 },
      { dmg: 6.4, rate: 5, range: 23, pierce: 10 },
      { dmg: 7.8, rate: 6, range: 24, pierce: 12 },
      { dmg: 9.4, rate: 6, range: 26, pierce: 14 },
    ],
  },
  beam: {
    id: "beam", name: "Red Dart", family: "ENERGY", pattern: "bolt",
    color: "#FF3A1A", pellets: 1, spread: 5 * DEG, shove: 0, range: 16, len: 0.9, thick: 0.12, heavy: 0,
    line: "Fast red darts. They snap.",
    tiers: [
      { dmg: 1.7, rate: 13, range: 16 },
      { dmg: 2.1, rate: 14, range: 16 },
      { dmg: 2.6, rate: 14, range: 17 },
      { dmg: 3.2, rate: 15, range: 18 },
    ],
  },
  storm: {
    id: "storm", name: "Storm Arc", family: "ENERGY", pattern: "spark",
    color: "#4FC3FF", pellets: 1, spread: 8 * DEG, shove: 0, range: 14, len: 0.8, thick: 0.14, heavy: 0, chain: 3,
    line: "A bolt that jumps to the next body.",
    tiers: [
      { dmg: 2.6, rate: 8, range: 14, chain: 3 },
      { dmg: 3.2, rate: 8, range: 15, chain: 4 },
      { dmg: 3.9, rate: 9, range: 15, chain: 4 },
      { dmg: 4.8, rate: 9, range: 16, chain: 5 },
    ],
  },
  flame: {
    id: "flame", name: "Maple Flamer", family: "ELEMENT", pattern: "stream",
    color: "#FF6A1A", pellets: 1, spread: 12 * DEG, shove: 0, range: 11, len: 1.05, thick: 0.3, heavy: 0,
    line: "The one flamethrower. It sticks.",
    tiers: [
      { dmg: 1.6, rate: 12, burn: 4.2, range: 11 },
      { dmg: 2, rate: 13, burn: 4.8, range: 12 },
      { dmg: 2.5, rate: 13, burn: 5.4, range: 12 },
      { dmg: 3.1, rate: 14, burn: 6, range: 13 },
    ],
  },
  glacier: {
    id: "glacier", name: "White Spike", family: "ELEMENT", pattern: "spike",
    color: "#7DEBFF", pellets: 1, spread: 6 * DEG, shove: 0.6, range: 14, len: 0.9, thick: 0.16, heavy: 0,
    line: "Ice that slows the front rank.",
    tiers: [
      { dmg: 2.8, rate: 8, range: 14, slow: 2.2, splash: 1.5 },
      { dmg: 3.4, rate: 8, range: 15, slow: 2.4, splash: 1.6 },
      { dmg: 4.2, rate: 9, range: 15, slow: 2.6, splash: 1.7 },
      { dmg: 5, rate: 9, range: 16, slow: 2.8, splash: 1.9 },
    ],
  },
  barrage: {
    id: "barrage", name: "Lodge Rockets", family: "EXPLOSIVE", pattern: "salvo",
    color: "#FF2E63", pellets: 4, spread: 6 * DEG, shove: 1, range: 16, len: 0.95, thick: 0.18, heavy: 0, splash: 1.15,
    line: "A rack of rockets down the deck.",
    tiers: [
      { dmg: 2.4, rate: 6, range: 16, pellets: 4, splash: 1.15 },
      { dmg: 3, rate: 6, range: 17, pellets: 5, splash: 1.25 },
      { dmg: 3.7, rate: 7, range: 17, pellets: 5, splash: 1.35 },
      { dmg: 4.5, rate: 7, range: 18, pellets: 6, splash: 1.5 },
    ],
  },
  cone: {
    id: "cone", name: "Bell Lob", family: "EXPLOSIVE", pattern: "grenade",
    color: "#6BCB3D", pellets: 1, spread: 8 * DEG, shove: 1.2, range: 13, len: 0.8, thick: 0.22, heavy: 0, splash: 1.8,
    line: "A lobbed bell. It pops in the pack.",
    tiers: [
      { dmg: 3.6, rate: 6, range: 13, splash: 1.8 },
      { dmg: 4.4, rate: 6, range: 14, splash: 2 },
      { dmg: 5.4, rate: 7, range: 14, splash: 2.2 },
      { dmg: 6.6, rate: 7, range: 15, splash: 2.4 },
    ],
  },
  aurora: {
    id: "aurora", name: "Gold Orb", family: "ENERGY", pattern: "orb",
    color: "#F5C400", pellets: 1, spread: 4 * DEG, shove: 0.4, range: 16, len: 0.7, thick: 0.24, heavy: 0, splash: 2.2,
    line: "A gold orb. It chips a line, then bursts on a big body.",
    tiers: [
      { dmg: 3.8, rate: 6, range: 16, splash: 2.2 },
      { dmg: 4.6, rate: 6, range: 17, splash: 2.4 },
      { dmg: 5.6, rate: 7, range: 17, splash: 2.6 },
      { dmg: 6.8, rate: 7, range: 18, splash: 2.8 },
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
  BULLETS: 1, BLADES: 1, ENERGY: 1, ELEMENT: 1, EXPLOSIVE: 1, FLAME: 1,
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

export const LEVELS = {};
export const LEVEL_IDS = [];

const SPAN_CHAPTER = [
  { title: "THE PINE SPAN", theme: 0, intro: "Red bobers hold this span. Shoot the pack, then stand nearer the banner you want." },
  { title: "THE SPILLWAY", theme: 1, intro: "Suds knights and spitters plug the wet span. The banners still pay the toll." },
  { title: "THE CANOPY CUT", theme: 2, intro: "Ducks, leaves, and hairballs drop in from the trees. Keep moving." },
  { title: "THE NIGHT GATE", theme: 3, intro: "Haulers walk the night span. Last through them and face the keeper." },
];

const SPAN_NAMES = [
  ["PINE BRIDGE", "FIRST TOLL", "ROPE WALK", "LOW WATER", "SLUICE", "RUST BOLTS", "DRY BED", "PIPE WORKS", "CRACKED ARCH", "LAST GASKET"],
  ["WET GATE", "FOAM LINE", "DRAIN BEND", "KNIGHT ROW", "SPITTER ARCH", "GREEN WATER", "BROKEN LIP", "SECOND TOLL", "FLOOD STEP", "TUB REACH"],
  ["LEAF GATE", "DUCK DRIFT", "HAIR TURN", "CANOPY", "NEST ARCH", "GREEN ROPE", "BARK SPAN", "THIRD TOLL", "THICKET", "GRUNK CUT"],
  ["NIGHT GATE", "GOLD CABLE", "HAULER ROW", "DARK ARCH", "QUIET TOLL", "BLACK WATER", "FOURTH SPAN", "CROWN WALK", "LAST TOLL", "DAM KEEP"],
];

const KEEPER_NAME = {
  baron: ["LORD DRIP", "BARON CLOG", "CROWN PLUNGER", "RED KEEP"],
  tub: ["BIG TUB", "FOAM TUB", "DUCK TUB", "NIGHT TUB"],
  grunk: ["GRUNK", "WRENCH GRUNK", "TALL GRUNK", "GATE GRUNK"],
};

function gateAt(at, x, op, k) {
  return { at, kind: "gate", x, op, k, side: x < 0 ? 0 : 1 };
}

function gunAt(at, gun) {
  return { at, kind: "crate", layout: "single", items: [{ type: "weapon", gun, hp: 8, x: 0 }] };
}

function pushWave(evs, at, mix) {
  const ev = { at, kind: "wave", clog: mix.clog, spd: mix.spd || 1 };
  if (mix.suds) ev.suds = mix.suds;
  if (mix.hauler) ev.hauler = mix.hauler;
  if (mix.hair) ev.hair = mix.hair;
  if (mix.spit) ev.spit = mix.spit;
  if (mix.duck) ev.duck = mix.duck;
  if (mix.leaf) ev.leaf = mix.leaf;
  evs.push(ev);
}

function waveMix(ch, st, kind) {
  const heat = ch * 2 + ((st / 3) | 0);
  const spd = +(1 + ch * 0.03).toFixed(2);
  // Popcorn between the banners. Reds only, so the squad clears them before the next toll.
  if (kind === "skim") return { clog: 3 + Math.min(2, heat >> 1), spd };
  let clog = kind === "open" ? 8 + Math.min(4, st) : kind === "gate" ? 10 + Math.min(6, heat) : 7 + Math.min(5, heat);
  const ev = { clog, spd };
  if (ch === 0 && st >= 3 && kind === "mid") ev.duck = 1;
  if (ch === 0 && st >= 6 && kind === "gate") ev.suds = 1;
  if (ch === 1 && st >= 2) {
    ev.suds = kind === "open" ? 1 : 2;
    if (kind !== "open") ev.spit = 1 + (st > 6 ? 1 : 0);
    ev.clog = Math.max(6, clog - 2);
  }
  if (ch === 2) {
    ev.duck = 1;
    if (kind !== "open" && st >= 2) ev.leaf = 1;
    if (kind === "mid" && st >= 4) ev.hair = 1;
    if (st >= 2) ev.clog = Math.max(6, clog - 3);
  }
  if (ch === 3) {
    if (st >= 1 && kind !== "open") ev.suds = 1 + (kind === "gate" ? 1 : 0);
    if (st >= 3 && kind === "gate") ev.spit = 1;
    if ((kind === "gate" || kind === "mid") && st >= 5) ev.hauler = 1;
    if (kind === "gate" && st >= 8) ev.hauler = 2;
  }
  return ev;
}

function rowOps(index, row) {
  if (index === 0) {
    return [
      ["add", 4, "add", 1],
      ["add", 6, "mul", 2],
      ["sub", 3, "mul", 2],
      ["add", 8, "add", 2],
    ][row];
  }
  const st = index % 10;
  const ch = (index / 10) | 0;
  const add = 3 + (st % 3);
  const sub = 2 + Math.min(5, ch + (st > 6 ? 2 : 0));
  if (st === 9 && row === 3) return ["sub", 3 + ch, "add", 2];
  return [
    ["add", add, "add", 1],
    ["sub", sub, "mul", 2],
    ["sub", sub + 1, "mul", 2],
    ["add", add, "sub", Math.max(2, sub - 1)],
  ][row];
}

function spanGuns(index) {
  if (index === 0) return ["dambust", "mini", "beam"];
  const pairs = [
    ["saw", "rail"],
    ["storm", "flame"],
    ["glacier", "barrage"],
    ["cone", "aurora"],
    ["burst", "mini"],
    ["dambust", "beam"],
    ["rail", "storm"],
    ["flame", "saw"],
    ["aurora", "glacier"],
    ["barrage", "cone"],
  ];
  return pairs[(index - 1) % pairs.length];
}

function spanRoad(index) {
  const ch = (index / 10) | 0;
  const st = index % 10;
  const guns = spanGuns(index);
  const gap = 74;
  const gates = [68, 68 + gap, 68 + gap * 2, 68 + gap * 3];
  const evs = [];
  pushWave(evs, 16, waveMix(ch, st, "open"));
  for (let r = 0; r < gates.length; r++) {
    const g = gates[r];
    pushWave(evs, g - 10, waveMix(ch, st, "gate"));
    const ops = rowOps(index, r);
    evs.push(gateAt(g, -2.45, ops[0], ops[1]));
    evs.push(gateAt(g, 2.45, ops[2], ops[3]));
    if (r < guns.length) evs.push(gunAt(g + 18, guns[r]));
    if (r < gates.length - 1) {
      pushWave(evs, g + 22, waveMix(ch, st, "skim"));
      pushWave(evs, g + 40, waveMix(ch, st, "mid"));
    }
  }
  const bossAt = gates[3] + 34;
  pushWave(evs, gates[3] + 14, waveMix(ch, st, "skim"));
  evs.push({ at: bossAt, kind: "boss" });
  return evs;
}

for (let i = 0; i < 40; i++) {
  const ch = (i / 10) | 0;
  const st = i % 10;
  const id = (ch + 1) + "-" + (st + 1);
  const chapter = SPAN_CHAPTER[ch];
  const boss = ["baron", "tub", "grunk"][(ch + st) % 3];
  const events = spanRoad(i);
  LEVEL_IDS.push(id);
  LEVELS[id] = {
    id,
    name: id + " " + SPAN_NAMES[ch][st],
    chapter: chapter.title,
    intro: chapter.intro,
    len: events[events.length - 1].at,
    river: 0,
    dam: 1,
    theme: chapter.theme,
    hpMul: +(1 + ch * 0.08 + st * 0.012).toFixed(3),
    baseHp: 8 + ch * 2,
    vol: 6,
    starN: 18 + ch * 4,
    starSec: 28,
    boss,
    bossHp: Math.round((640 + ch * 380 + st * 50) * 0.8),
    bossName: KEEPER_NAME[boss][ch],
    win: "SPAN HELD!",
    events,
  };
}

export function levelOf(id) {
  return LEVELS[id] || LEVELS["1-1"];
}

export function nextLevel(id) {
  const i = LEVEL_IDS.indexOf(id);
  return i >= 0 && i < LEVEL_IDS.length - 1 ? LEVEL_IDS[i + 1] : "";
}

export function highestPlayable(cleared) {
  const done = cleared || {};
  for (let i = 0; i < LEVEL_IDS.length; i++) {
    if (!done[LEVEL_IDS[i]]) return LEVEL_IDS[i];
  }
  return "4-10";
}

export function isUnlockedLevel(id, cleared) {
  const i = LEVEL_IDS.indexOf(id);
  if (i <= 0) return i === 0;
  return !!(cleared && cleared[LEVEL_IDS[i - 1]]);
}


export function crateHp(base, type, explicit) {
  if (explicit) return explicit;
  return Math.max(1, Math.round(base * (CRATE_MUL[type] || 1)));
}

export function laneOf(x) {
  if (x < -LANE_EDGE) return "LEFT";
  if (x > LANE_EDGE) return "RIGHT";
  return "CENTER";
}

export function laneCenter(x) {
  const lane = laneOf(x);
  if (lane === "LEFT") return -3;
  if (lane === "RIGHT") return 3;
  return 0;
}

// Big squads pull in so four soldiers still sit inside one lane.
export function formationGap(n) {
  const shown = Math.max(1, shownCount(n) || 1);
  if (shown >= 40) return 0.46;
  if (shown >= 16) return 0.52;
  return FORM_GAP;
}

// At most four soldiers across. Everyone else stands in a row behind.
export function formationLayout(n) {
  const shown = Math.max(1, shownCount(n) || 1);
  const cols = Math.max(1, Math.min(FORM_MAX_COLS, shown));
  const rows = Math.max(1, Math.ceil(shown / cols));
  const gap = formationGap(shown);
  const w = Math.max(0, cols - 1) * gap;
  const h = Math.max(0, rows - 1) * gap;
  return { shown, cols, rows, w, h, gap };
}

export function barrelNumber(levelId, hp) {
  const rank = Math.max(0, LEVEL_IDS.indexOf(levelId));
  const n = Math.max(1, Math.round(hp || 1));
  if (rank <= 1) return Math.max(6, Math.min(10, n));
  // Keep the printed size, then add one per bridge so later barrels read higher.
  return Math.max(1, Math.min(36, n + rank));
}

// Approach is 40% slower than a 0.5/s fill. Yellow to spill stays on the lead.
export function riverApproach() {
  return 0.3;
}

export function riverRiseRate(rank) {
  const lead = (rank | 0) <= 2 ? 2.5 : 1.5;
  return (1 - RIVER_YELLOW) / lead;
}

export function riverDrainRate() {
  return 0.62;
}

export function riverWarnLead(rank) {
  return (1 - RIVER_YELLOW) / riverRiseRate(rank);
}

export function formationRadius(n, half) {
  const lay = formationLayout(n);
  const r = Math.max(0.35, Math.hypot(lay.w * 0.5, lay.h * 0.5) + 0.22);
  const road = Math.max(0.4, (half || DECK_HALF) - 0.7);
  return Math.min(r, road);
}

export function formationHalfX(n) {
  const lay = formationLayout(n);
  return Math.min(1.35, lay.w * 0.5 + 0.24);
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
  const lay = formationLayout(shown);
  const cols = lay.cols;
  const rows = lay.rows;
  const w = lay.w;
  const h = lay.h;
  const gap = lay.gap;
  const fit = Math.max(0.2, Math.hypot(w * 0.5, h * 0.5) + 0.05);
  let scale = radius > 0 && fit > radius ? radius / fit : 1;
  if (w > FORM_MAX_W) scale = Math.min(scale, FORM_MAX_W / w);
  const sx = gap * scale;
  const sy = gap * scale;
  const front = -FORM_LEADER + gap * 0.95;
  let i = 0;
  for (let r = 0; r < rows && i < shown; r++) {
    const rowCols = Math.min(cols, shown - i);
    const ox = -(rowCols - 1) * sx * 0.5;
    const z = front + r * sy;
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
      if (ev.kind === "wave") waves.push(waveExtent(ev));
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
        if (Math.abs(x) > 3.6) fails.push(id + " crate x " + x);
      }
      if (weapon) gunEvents++;
    }
    if (gunEvents < 2 || gunEvents > 3) fails.push(id + " gun crates " + gunEvents);
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.kind !== "gate") continue;
      let held = 0;
      for (let w = 0; w < waves.length; w++) {
        if (waves[w].front < ev.at && waves[w].end > ev.at) held = 1;
      }
      if (!held) fails.push(id + " gate quiet " + ev.at);
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
        if (waves[w].front > prev && waves[w].front < anchors[i]) crossed = 1;
      }
      const limit = crossed ? 520 : 80;
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
  const rows = {};
  const order = [];
  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i];
    if (ev.kind !== "gate" || ev.at >= at || !ev.op) continue;
    const key = String(ev.at);
    if (!rows[key]) {
      rows[key] = [];
      order.push(key);
    }
    rows[key].push(ev);
  }
  for (let r = 0; r < order.length; r++) {
    const list = rows[order[r]];
    let best = n;
    for (let i = 0; i < list.length; i++) {
      const ev = list[i];
      const tenths = ev.op === "mul" ? Math.round(ev.k * 10) : 0;
      const out = applyGate(n, ev.op, ev.k, tenths);
      if (out > best) best = out;
    }
    n = best;
  }
  return n;
}

export function waveMods(expect, rank) {
  const e = Math.max(3, expect || 3);
  const scale = e / 20;
  let nMul = Math.min(1.65, Math.pow(Math.max(1, scale), 0.34));
  let hpMul = Math.min(14, 1.35 + e * 0.04);
  // A squad that has not doubled yet meets half a pack. The road fills in after the tolls.
  if (e < 14) {
    nMul = 0.5;
    hpMul = 1.05;
  } else if ((rank | 0) <= 2) {
    nMul *= 0.7;
    hpMul *= 0.68;
  }
  return { nMul, hpMul };
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
    const evs = LEVELS[id].events;
    const waves = [];
    const groups = {};
    const ats = [];
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.kind === "wave") waves.push(waveExtent(ev));
      if (ev.kind !== "gate") continue;
      const key = String(ev.at);
      if (!groups[key]) {
        groups[key] = [];
        ats.push(ev.at);
      }
      groups[key].push(ev);
    }
    ats.sort(function (a, b) { return a - b; });
    for (let i = 0; i < ats.length; i++) {
      const list = groups[String(ats[i])];
      if (list.length < 2 || list.length > 3) fails.push(id + " choice " + ats[i] + " n " + list.length);
      for (let a = 0; a < list.length; a++) {
        const x = list[a].x;
        if (x == null || Math.abs(x) < 1.4 || Math.abs(x) > 3.6) fails.push(id + " gate x " + ats[i]);
        for (let b = a + 1; b < list.length; b++) {
          if (Math.abs(list[a].x - list[b].x) < 1.8) fails.push(id + " gate pair " + ats[i]);
        }
      }
      let held = 0;
      for (let w = 0; w < waves.length; w++) {
        if (waves[w].front < ats[i] && waves[w].end > ats[i]) held = 1;
      }
      if (!held) fails.push(id + " choice quiet " + ats[i]);
      if (i > 0 && ats[i] - ats[i - 1] < 70) fails.push(id + " row gap " + ats[i - 1] + ".." + ats[i]);
    }
    for (let i = 0; i < evs.length; i++) {
      if (evs[i].kind !== "crate") continue;
      const items = evs[i].items || [];
      for (let k = 0; k < items.length; k++) {
        if (Math.abs(items[k].x || 0) > 3.6) fails.push(id + " crate x " + evs[i].at);
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
  lines.push("spans: a pack sits between the banners");
  lines.push("road clearance: every gate row is inside a live wave");
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

  eq(weaponMods("burst", 1).dmg, 3.4, "t1 dmg");
  eq(Math.round(weaponMods("burst", 1).rate * 10), 80, "t1 rate");
  eq(weaponMods("burst", 1).pattern, "burst", "burst bites");
  eq(weaponMods("dambust", 1).pattern, "fan", "bust fan");
  eq(weaponMods("mini", 1).pattern, "spin", "mini spin");
  eq(weaponMods("mini", 1).rate >= 12 ? 1 : 0, 1, "mini fast");
  eq(weaponMods("beam", 1).pattern, "bolt", "beam dart");
  eq(weaponMods("beam", 1).pierce, 0, "beam no pierce");
  eq(Math.round(weaponMods("flame", 1).dmg * 10), 16, "flame dmg");
  eq(weaponMods("flame", 1).pattern, "stream", "flame stream");
  eq(Math.round(weaponMods("glacier", 1).slow * 10), 22, "glacier slow");
  eq(weaponMods("storm", 1).chain, 3, "storm chain");
  eq(weaponMods("rail", 1).pierce, 8, "rail pierce");
  eq(weaponMods("rail", 1).charge, 0, "rail no charge");
  eq(weaponMods("saw", 1).bounces, 4, "saw bounce");
  eq(weaponMods("aurora", 1).pattern, "orb", "aurora orb");
  const pats = {};
  let streams = 0;
  for (let gi = 0; gi < GUN_ORDER.length; gi++) {
    const gm = weaponMods(GUN_ORDER[gi], 1);
    pats[gm.pattern] = 1;
    if (gm.pattern === "stream") streams++;
    if (gm.rate < 5) fails.push("slow gun " + gm.id);
  }
  if (Object.keys(pats).length < 8) fails.push("pattern kinds " + Object.keys(pats).length);
  if (streams !== 1) fails.push("streams " + streams);
  eq(GUN_ORDER.length, 12, "12 guns");
  eq(laneOf(-3), "LEFT", "lane left");
  eq(laneOf(-1.51), "LEFT", "lane left edge");
  eq(laneOf(-1.5), "CENTER", "lane center left");
  eq(laneOf(0), "CENTER", "lane center");
  eq(laneOf(1.5), "CENTER", "lane center right");
  eq(laneOf(3), "RIGHT", "lane right");
  const wide200 = formationLayout(200);
  if (wide200.w > FORM_MAX_W) fails.push("form width " + wide200.w);
  const formNs = [5, 18, 50, 200];
  for (let fi = 0; fi < formNs.length; fi++) {
    const fn = formNs[fi];
    const lay = formationLayout(fn);
    if (lay.cols > FORM_MAX_COLS) fails.push("form cols " + fn + " " + lay.cols);
    if (lay.w > 2.4 + 1e-6) fails.push("form cap " + fn + " " + lay.w.toFixed(3));
    const fxs = new Float32Array(RENDER_CAP);
    const fzs = new Float32Array(RENDER_CAP);
    const got = formationOffsets(fn, 8, fxs, fzs);
    let lo = 99;
    let hi = -99;
    let z0 = 99;
    let z1 = -99;
    for (let i = 0; i < got; i++) {
      if (fxs[i] < lo) lo = fxs[i];
      if (fxs[i] > hi) hi = fxs[i];
      if (fzs[i] < z0) z0 = fzs[i];
      if (fzs[i] > z1) z1 = fzs[i];
    }
    if (hi - lo > 2.4 + 1e-4) fails.push("form span " + fn + " " + (hi - lo).toFixed(3));
    if (got > FORM_MAX_COLS && !(z1 > z0 + 0.2)) fails.push("form rows " + fn);
    let sx = 0;
    let sn = 0;
    for (let i = 0; i < got; i++) {
      if (fzs[i] > z0 + 0.05) continue;
      sx += fxs[i];
      sn++;
    }
    if (sn > 1 && Math.abs(sx / sn) > 0.05) fails.push("form front " + fn);
  }
  for (let i = 0; i < LEVEL_IDS.length; i++) {
    const lead = riverWarnLead(i);
    const need = i <= 2 ? 2.5 : 1.5;
    if (lead + 1e-6 < need) fails.push("warn lead " + i + " " + lead.toFixed(2));
  }
  if (RIVER_COOL < 4) fails.push("overflow cool " + RIVER_COOL);
  if (RIVER_SPILL < 0.2 || RIVER_SPILL > 0.3) fails.push("spill frac " + RIVER_SPILL);
  if (riverDrainRate() <= riverApproach()) fails.push("drain slower than fill");
  eq(barrelNumber("1-1", 14), 10, "barrel 1-1");
  eq(barrelNumber("1-2", 4), 6, "barrel 1-2");
  if (barrelNumber("1-10", 8) <= barrelNumber("1-3", 8)) fails.push("barrel scale");
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
  eq(Math.round(weaponMods("burst", 4).rate * 10), 100, "burst t4 rate");
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
  eq(expectedSquad(LEVELS["1-1"], 2000), 36, "choice squad");
  eq(LEVEL_IDS.length, 40, "forty levels");
  eq(nextLevel("1-3"), "1-4", "path 1-4");
  eq(nextLevel("1-10"), "2-1", "chapter 2");
  eq(nextLevel("4-10"), "", "last span");
  eq(highestPlayable({}), "1-1", "highest fresh");
  eq(highestPlayable({ "1-1": true }), "1-2", "highest 2");
  eq(highestPlayable({ "1-1": true, "1-2": true, "1-3": true }), "1-4", "highest 4");
  eq(highestPlayable(Object.fromEntries(LEVEL_IDS.slice(0, 9).map(function (id) { return [id, true]; }))), "1-10", "highest 10");
  eq(highestPlayable(Object.fromEntries(LEVEL_IDS.slice(0, 39).map(function (id) { return [id, true]; }))), "4-10", "highest 40");
  eq(isUnlockedLevel("1-10", { "1-9": true }), true, "unlock 10");
  eq(isUnlockedLevel("1-10", { "1-8": true }), false, "lock 10");
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
  let zFront = 99;
  let zBack = -99;
  for (let i = 0; i < shown; i++) {
    if (Math.abs(xs[i]) > wide) wide = Math.abs(xs[i]);
    if (zs[i] < zFront) zFront = zs[i];
    if (zs[i] > zBack) zBack = zs[i];
  }
  if (wide * 2 > 2.4 + 1e-4) fails.push("blob wide " + wide);
  if (!(zBack > zFront)) fails.push("rows forward");
  if (Math.abs(clampLane(9, 1, 5) - 4) > 1e-6) fails.push("clamp lane");
  if (Math.abs(clampLane(9, 1, DECK_HALF) - (DECK_HALF - 1)) > 1e-6) fails.push("clamp deck");
  for (let i = 0; i < ENEMY.length; i++) {
    if (ENEMY[i].id === "leaf") continue;
    if (ENEMY[i].tall < 0.95) fails.push("short " + ENEMY[i].id);
  }
  return fails;
}
