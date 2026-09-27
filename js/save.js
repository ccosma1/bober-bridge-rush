// Versioned save. Key stays bober_bridge_v1. v1 migrates; anything else starts clean.

import { STARTERS, UNLOCKS } from "./rules.js?v=br3b";

const KEY = "bober_bridge_v1";

function starters() {
  return STARTERS.slice();
}

function blank() {
  return {
    v: 2,
    bober: 0,
    levelsCleared: {},
    stars: {},
    settings: { mute: false, tipSeen: false },
    unlocked: starters(),
    seenGuns: starters(),
  };
}

function asObj(v) {
  return v && typeof v === "object" ? v : {};
}

function uniqGuns(list) {
  const out = [];
  const src = Array.isArray(list) ? list : [];
  for (let i = 0; i < src.length; i++) {
    const id = src[i];
    if (typeof id === "string" && out.indexOf(id) < 0) out.push(id);
  }
  return out;
}

function withUnlocks(data) {
  const guns = uniqGuns((data.unlocked || []).concat(STARTERS));
  const cleared = data.levelsCleared || {};
  if (cleared["1-1"]) {
    const extra = UNLOCKS["1-1"];
    for (let i = 0; i < extra.length; i++) if (guns.indexOf(extra[i]) < 0) guns.push(extra[i]);
  }
  if (cleared["1-2"]) {
    const extra = UNLOCKS["1-2"];
    for (let i = 0; i < extra.length; i++) if (guns.indexOf(extra[i]) < 0) guns.push(extra[i]);
  }
  data.unlocked = guns;
  data.seenGuns = uniqGuns((data.seenGuns && data.seenGuns.length ? data.seenGuns : STARTERS).concat(STARTERS));
  data.v = 2;
  return data;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const d = JSON.parse(raw);
    if (!d || (d.v !== 1 && d.v !== 2)) return blank();
    const settings = d.settings || {};
    const data = {
      v: 2,
      bober: Math.max(0, Math.floor(Number(d.bober) || 0)),
      levelsCleared: asObj(d.levelsCleared),
      stars: asObj(d.stars),
      settings: { mute: !!settings.mute, tipSeen: !!settings.tipSeen },
      unlocked: d.v === 2 ? uniqGuns(d.unlocked) : [],
      seenGuns: d.v === 2 ? uniqGuns(d.seenGuns) : starters(),
    };
    const out = withUnlocks(data);
    if (d.v !== 2) localStorage.setItem(KEY, JSON.stringify(out));
    return out;
  } catch (err) {
    return blank();
  }
}

export function writeSave(data) {
  const out = withUnlocks({
    v: 2,
    bober: Math.max(0, Math.floor(Number(data.bober) || 0)),
    levelsCleared: asObj(data.levelsCleared),
    stars: asObj(data.stars),
    settings: {
      mute: !!(data.settings && data.settings.mute),
      tipSeen: !!(data.settings && data.settings.tipSeen),
    },
    unlocked: uniqGuns(data.unlocked),
    seenGuns: uniqGuns(data.seenGuns),
  });
  localStorage.setItem(KEY, JSON.stringify(out));
  return out;
}

export function rememberWin(data, levelId, stars) {
  const id = typeof levelId === "string" && levelId ? levelId : "1-1";
  if (!data.levelsCleared) data.levelsCleared = {};
  if (!data.stars) data.stars = {};
  data.levelsCleared[id] = true;
  const prev = Number(data.stars[id]) || 0;
  data.stars[id] = Math.max(prev, stars | 0);
  if (UNLOCKS[id]) data.unlocked = uniqGuns((data.unlocked || []).concat(UNLOCKS[id]));
  return writeSave(data);
}

export function rememberGun(data, id) {
  data.seenGuns = uniqGuns((data.seenGuns || []).concat([id]));
  return writeSave(data);
}
