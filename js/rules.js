// Pure Pine Bridge rules. No rendering. Forward in the world is -Z.

export const BUILD = "br0";
export const SIM_CAP = 300;
export const RENDER_CAP = 60;
export const ADVANCE = 8;
export const STEER_MAX = 14;
export const RANGE = 28;
export const LEVEL_M = 700;
export const ARENA_AT = 700;

export const WEAPONS = {
  pistol: { id: "pistol", name: "Twig Pistol", dmg: 10, rate: 3, pellets: 1, spread: 0, pattern: "straight", falloff: 0, splash: 0, knock: 0, color: "#F4E6C3" },
  smg: { id: "smg", name: "Acorn SMG", dmg: 6, rate: 9, pellets: 1, spread: (3 * Math.PI) / 180, pattern: "spread", falloff: 0, splash: 0, knock: 0, color: "#F5C400" },
  shot: { id: "shot", name: "Pinecone Shotgun", dmg: 7, rate: 1.4, pellets: 5, spread: (25 * Math.PI) / 180, pattern: "fan", falloff: 14, splash: 0, knock: 0, color: "#E86A1A" },
  log: { id: "log", name: "Log Launcher", dmg: 40, rate: 0.8, pellets: 1, spread: 0, pattern: "lob", falloff: 0, splash: 2.2, knock: 1, color: "#8B5A2B" },
};

// Left gate is -X, right gate is +X. Distances are metres from the start line.
export const SCRIPT = [
  { at: 26, kind: "gate", pair: [{ op: "add", k: 5 }, { op: "sub", k: 3 }] },
  { at: 52, kind: "wave", id: "S", rat: 40, beetle: 0, brute: 0 },
  { at: 155, kind: "crate", weapon: "smg", hp: 480 },
  { at: 200, kind: "gate", pair: [{ op: "mul", k: 2 }, { op: "add", k: 4 }] },
  { at: 240, kind: "wave", id: "M", rat: 60, beetle: 30, brute: 0 },
  { at: 345, kind: "rack" },
  { at: 395, kind: "gate", pair: [{ op: "add", k: 12 }, { op: "div", k: 2 }] },
  { at: 440, kind: "wave", id: "L", rat: 130, beetle: 68, brute: 2 },
  { at: 590, kind: "crate", weapon: "log", hp: 968 },
  { at: 700, kind: "boss" },
];

export function formationRadius(n, half) {
  const r = 0.45 * Math.sqrt(Math.max(1, n));
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
  const w = WEAPONS[id] || WEAPONS.pistol;
  const t = Math.max(1, Math.min(3, tier | 0));
  return {
    id: w.id,
    name: w.name,
    tier: t,
    dmg: w.dmg * Math.pow(1.35, t - 1),
    rate: w.rate * (t >= 2 ? 1.15 : 1),
    pellets: w.pellets + (t >= 3 ? 1 : 0),
    spread: w.spread,
    pattern: w.pattern,
    falloff: w.falloff,
    splash: w.splash,
    knock: w.knock,
    color: w.color,
  };
}

export function tierAfterPickup(curId, curTier, nextId, bonus) {
  let t = nextId === curId ? curTier + 1 : Math.max(1, curTier - 1);
  t += bonus || 0;
  return Math.max(1, Math.min(3, t));
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

// + / - / / grow by 1 step per 6 hits. x grows 0.1 per 18 hits, capped at +1.0.
// A minus that reaches 0 flips blue to +1. A divisor that reaches 1 flips to +1.
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
  return {
    op,
    k: op === "mul" ? k : k,
    tenths,
    baseTenths: tenths,
    frac: 0,
  };
}

export function starsFor(won, n, crateRammed, bossSec) {
  if (!won) return 0;
  if (!crateRammed && bossSec < 20) return 3;
  if (n >= 25) return 2;
  return 1;
}

export function boberReward(kills, cratesOpened, stars) {
  const bonus = [0, 50, 100, 150][stars] || 0;
  return Math.floor(kills / 10) + cratesOpened * 20 + 150 + bonus;
}

const GA = Math.PI * (3 - Math.sqrt(5));

export function formationOffsets(n, radius, outX, outZ) {
  const shown = shownCount(n);
  for (let i = 0; i < shown; i++) {
    const r = radius * Math.sqrt((i + 0.5) / shown);
    const a = i * GA;
    outX[i] = Math.cos(a) * r;
    outZ[i] = Math.sin(a) * r;
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

  eq(weaponMods("pistol", 1).dmg, 10, "t1 dmg");
  eq(Math.round(weaponMods("pistol", 2).dmg * 100), 1350, "t2 dmg");
  eq(Math.round(weaponMods("pistol", 2).rate * 100), 345, "t2 rate");
  eq(weaponMods("shot", 3).pellets, 6, "t3 pellets");
  eq(tierAfterPickup("pistol", 1, "smg", 0), 1, "swap t1");
  eq(tierAfterPickup("smg", 2, "smg", 0), 3, "same tier");
  eq(tierAfterPickup("smg", 1, "pistol", 1), 2, "rack pistol");
  eq(starsFor(true, 30, 0, 10), 3, "star3");
  eq(starsFor(true, 30, 1, 10), 2, "star2");
  eq(starsFor(true, 10, 1, 5), 1, "star1");
  eq(starsFor(true, 10, 0, 20), 1, "star boundary");
  eq(starsFor(false, 40, 0, 1), 0, "no win");
  eq(boberReward(25, 2, 3), 342, "reward");
  eq(Math.round(squadDmgMul(60) * 100), 100, "no bonus at 60");
  eq(Math.round(squadDmgMul(62) * 1000), 1030, "over 60");

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
