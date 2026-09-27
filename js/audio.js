// Pooled WebAudio. Gunfire is one loop per weapon, gated by a gain, never one node per bullet.

export function createAudio() {
  let ctx = null;
  let master = null;
  let noise = null;
  const loops = {};
  const oscs = {};
  let muted = false;
  let current = "";
  let squeakN = 0;

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.22;
      master.connect(ctx.destination);
      const len = ctx.sampleRate;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      let s = 1;
      for (let i = 0; i < len; i++) {
        s = (s * 16807) % 2147483647;
        data[i] = s / 2147483647 * 2 - 1;
      }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function blip(freq, dur, type, gain, slide) {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), c.currentTime + dur);
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }

  function burst(dur, gain, freq) {
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = noise;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq || 420;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start();
    src.stop(c.currentTime + dur + 0.02);
  }

  function ensureLoop(id) {
    if (loops[id]) return loops[id];
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    const osc = c.createOscillator();
    osc.type = id === "log" ? "triangle" : "square";
    const g = c.createGain();
    g.gain.value = 0;
    const mix = c.createGain();
    src.connect(filter);
    filter.connect(mix);
    osc.connect(mix);
    mix.connect(g);
    g.connect(master);
    const tune = {
      bow: [420, 110, 0.45, "triangle"],
      long: [520, 220, 0.28, "sine"],
      smg: [1400, 90, 0.55, "square"],
      shot: [240, 70, 0.7, "square"],
      gerald: [180, 70, 0.5, "sawtooth"],
      log: [160, 54, 0.8, "triangle"],
      rocket: [240, 90, 0.4, "sawtooth"],
      flame: [140, 48, 0.85, "sawtooth"],
      party: [660, 330, 0.35, "square"],
      sap: [200, 60, 0.75, "triangle"],
    };
    const row = tune[id] || tune.bow;
    filter.frequency.value = row[0];
    osc.frequency.value = row[1];
    mix.gain.value = row[2];
    osc.type = row[3];
    src.start();
    osc.start();
    loops[id] = g;
    oscs[id] = osc;
    return g;
  }

  return {
    unlock() {
      try { ac(); } catch (err) { /* ignore */ }
    },
    setMuted(v) {
      muted = !!v;
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.22, ctx.currentTime, 0.02);
    },
    beginTick() {
      squeakN = 0;
    },
    noteFire(id, spin) {
      try {
        const g = ensureLoop(id);
        if (current !== id) {
          if (current && loops[current]) loops[current].gain.setTargetAtTime(0, ctx.currentTime, 0.03);
          current = id;
        }
        const level = id === "smg" || id === "gerald" ? 0.18 : id === "shot" || id === "party" ? 0.2 : id === "log" || id === "rocket" ? 0.24 : id === "flame" ? 0.16 : id === "sap" ? 0.14 : 0.11;
        g.gain.setTargetAtTime(level, ctx.currentTime, 0.02);
        if (id === "gerald" && oscs[id]) {
          const f = 70 + Math.max(0, Math.min(1, spin || 0)) * 210;
          oscs[id].frequency.setTargetAtTime(f, ctx.currentTime, 0.04);
        }
      } catch (err) { /* ignore */ }
    },
    squeak() {
      if (squeakN >= 6) return;
      squeakN++;
      try { blip(720 + squeakN * 40, 0.045, "square", 0.045, 1.7); } catch (err) { /* ignore */ }
    },
    quack() {
      try {
        blip(520, 0.08, "square", 0.1, 0.7);
        blip(340, 0.1, "triangle", 0.08, 0.8);
      } catch (err) { /* ignore */ }
    },
    pop() {
      try { blip(880, 0.07, "square", 0.06, 1.8); } catch (err) { /* ignore */ }
    },
    endFire() {
      try {
        if (current && loops[current] && ctx) loops[current].gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      } catch (err) { /* ignore */ }
    },
    hold(v) {
      try {
        if (!ctx) return;
        if (v) ctx.suspend();
        else if (ctx.state === "suspended") ctx.resume();
      } catch (err) { /* ignore */ }
    },
    gate() {
      try { blip(520, 0.12, "square", 0.16, 1.6); } catch (err) { /* ignore */ }
    },
    crack() {
      try { burst(0.18, 0.3, 280); blip(180, 0.16, "sawtooth", 0.1, 0.4); } catch (err) { /* ignore */ }
    },
    bossIn() {
      try {
        blip(196, 0.18, "sawtooth", 0.1, 0.7);
        setTimeout(() => { try { blip(146, 0.28, "triangle", 0.1, 0.8); } catch (err) { /* ignore */ } }, 160);
      } catch (err) { /* ignore */ }
    },
    bossOut() {
      try {
        blip(220, 0.14, "square", 0.1, 1.4);
        setTimeout(() => { try { blip(330, 0.16, "square", 0.08, 1.2); } catch (err) { /* ignore */ } }, 140);
        setTimeout(() => { try { blip(440, 0.28, "triangle", 0.08, 1); } catch (err) { /* ignore */ } }, 280);
      } catch (err) { /* ignore */ }
    },
    hurt() {
      try { blip(110, 0.08, "square", 0.08, 0.5); } catch (err) { /* ignore */ }
    },
    lose() {
      try { blip(180, 0.3, "sawtooth", 0.08, 0.45); } catch (err) { /* ignore */ }
    },
  };
}
