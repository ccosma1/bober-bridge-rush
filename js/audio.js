// Pooled WebAudio. Gunfire is one loop per weapon, gated by a gain, never one node per bullet.

export function createAudio() {
  let ctx = null;
  let master = null;
  let noise = null;
  const loops = {};
  let muted = false;
  let current = "";

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
    if (id === "pistol") {
      filter.frequency.value = 680;
      osc.frequency.value = 140;
      mix.gain.value = 0.35;
    } else if (id === "smg") {
      filter.frequency.value = 1400;
      osc.frequency.value = 90;
      mix.gain.value = 0.55;
    } else if (id === "shot") {
      filter.frequency.value = 240;
      osc.frequency.value = 70;
      mix.gain.value = 0.7;
    } else {
      filter.frequency.value = 160;
      osc.frequency.value = 54;
      mix.gain.value = 0.8;
    }
    src.start();
    osc.start();
    loops[id] = g;
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
    noteFire(id) {
      try {
        const g = ensureLoop(id);
        if (current !== id) {
          if (current && loops[current]) loops[current].gain.setTargetAtTime(0, ctx.currentTime, 0.03);
          current = id;
        }
        const level = id === "smg" ? 0.18 : id === "shot" ? 0.22 : id === "log" ? 0.26 : 0.12;
        g.gain.setTargetAtTime(level, ctx.currentTime, 0.02);
      } catch (err) { /* ignore */ }
    },
    endFire() {
      try {
        if (current && loops[current] && ctx) loops[current].gain.setTargetAtTime(0, ctx.currentTime, 0.05);
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
