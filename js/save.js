// Versioned save. Bump v when the shape changes; a mismatch starts clean.

const KEY = "bober_bridge_v1";

function blank() {
  return { v: 1, bober: 0, levelsCleared: {}, stars: {}, settings: { mute: false, tipSeen: false } };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const d = JSON.parse(raw);
    if (!d || d.v !== 1) return blank();
    const settings = d.settings || {};
    return {
      v: 1,
      bober: Math.max(0, Math.floor(Number(d.bober) || 0)),
      levelsCleared: d.levelsCleared && typeof d.levelsCleared === "object" ? d.levelsCleared : {},
      stars: d.stars && typeof d.stars === "object" ? d.stars : {},
      settings: { mute: !!settings.mute, tipSeen: !!settings.tipSeen },
    };
  } catch (err) {
    return blank();
  }
}

export function writeSave(data) {
  const out = {
    v: 1,
    bober: Math.max(0, Math.floor(Number(data.bober) || 0)),
    levelsCleared: data.levelsCleared || {},
    stars: data.stars || {},
    settings: {
      mute: !!(data.settings && data.settings.mute),
      tipSeen: !!(data.settings && data.settings.tipSeen),
    },
  };
  localStorage.setItem(KEY, JSON.stringify(out));
  return out;
}

export function rememberWin(data, stars) {
  data.levelsCleared["1-1"] = true;
  const prev = Number(data.stars["1-1"]) || 0;
  data.stars["1-1"] = Math.max(prev, stars);
  return writeSave(data);
}
