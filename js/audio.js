// Pooled WebAudio. Fire notes are short synth voices: 4 at once, 12 per second.

export function createAudio() {
  let ctx = null;
  let master = null;
  let noise = null;
  let muted = false;
  let squeakN = 0;
  const fireAt = [];
  const voiceUntil = [];
  const FIRE = {
    mini: { f: 120, d: 0.045, type: "sawtooth", g: 0.04, slide: 0.55, n: 420, ng: 0.07 },
    dambust: { f: 78, d: 0.06, type: "sawtooth", g: 0.05, slide: 0.4, n: 260, ng: 0.09 },
    burst: { f: 96, d: 0.05, type: "sawtooth", g: 0.045, slide: 0.5, n: 360, ng: 0.07 },
    saw: { f: 88, d: 0.05, type: "sawtooth", g: 0.045, slide: 0.48, n: 340, ng: 0.075 },
    rail: { f: 70, d: 0.055, type: "sawtooth", g: 0.04, slide: 0.42, n: 240, ng: 0.08 },
    beam: { f: 140, d: 0.04, type: "sawtooth", g: 0.04, slide: 0.62, n: 520, ng: 0.06 },
    storm: { f: 110, d: 0.05, type: "sawtooth", g: 0.045, slide: 0.52, n: 400, ng: 0.07 },
    flame: { f: 90, d: 0.055, type: "sawtooth", g: 0.05, slide: 0.5, n: 380, ng: 0.08 },
    glacier: { f: 150, d: 0.04, type: "sawtooth", g: 0.035, slide: 0.6, n: 560, ng: 0.055 },
    barrage: { f: 84, d: 0.05, type: "sawtooth", g: 0.05, slide: 0.45, n: 300, ng: 0.085 },
    cone: { f: 74, d: 0.06, type: "sawtooth", g: 0.05, slide: 0.4, n: 250, ng: 0.09 },
    aurora: { f: 100, d: 0.05, type: "sawtooth", g: 0.045, slide: 0.5, n: 440, ng: 0.065 },
    tick: { f: 130, d: 0.04, type: "sawtooth", g: 0.04, slide: 0.55, n: 480, ng: 0.06 },
  };

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

  function noteTone(id, spin) {
    const c = ac();
    const now = c.currentTime;
    let drop = 0;
    while (drop < fireAt.length && now - fireAt[drop] >= 1) drop++;
    if (drop) fireAt.splice(0, drop);
    let aged = 0;
    while (aged < voiceUntil.length && voiceUntil[aged] <= now) aged++;
    if (aged) voiceUntil.splice(0, aged);
    if (fireAt.length >= 12 || voiceUntil.length >= 4) return;
    const row = FIRE[id] || FIRE.tick;
    const spinK = id === "mini" ? 0.72 + Math.max(0, Math.min(1, spin || 0)) * 0.7 : 1;
    const freq = Math.max(48, row.f * spinK);
    const dur = row.d;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(row.g, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    g.connect(master);
    const o = c.createOscillator();
    o.type = row.type;
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * row.slide), now + dur);
    o.connect(g);
    const o2 = c.createOscillator();
    o2.type = row.type;
    const det = freq * 1.03;
    o2.frequency.setValueAtTime(det, now);
    o2.frequency.exponentialRampToValueAtTime(Math.max(40, det * row.slide), now + dur);
    const g2 = c.createGain();
    g2.gain.value = 0.35;
    o2.connect(g2);
    g2.connect(g);
    const src = c.createBufferSource();
    src.buffer = noise;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = row.n;
    const ng = c.createGain();
    ng.gain.setValueAtTime(row.ng, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(ng);
    ng.connect(master);
    const stop = now + dur + 0.02;
    fireAt.push(now);
    voiceUntil.push(stop);
    o.start(now);
    o2.start(now);
    src.start(now);
    o.stop(stop);
    o2.stop(stop);
    src.stop(stop);
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
      try { noteTone(id, spin); } catch (err) { /* ignore */ }
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
    endFire() {},
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
