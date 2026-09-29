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
    mini: { f: 160, d: 0.055, type: "sawtooth", g: 0.055, slide: 0.72, n: 900, ng: 0.03 },
    dambust: { f: 110, d: 0.09, type: "square", g: 0.07, slide: 0.4, n: 280, ng: 0.08 },
    burst: { f: 740, d: 0.042, type: "square", g: 0.05, slide: 0.62, n: 1800, ng: 0.02 },
    saw: { f: 320, d: 0.07, type: "sawtooth", g: 0.045, slide: 1.35, n: 2400, ng: 0.015 },
    rail: { f: 70, d: 0.14, type: "square", g: 0.07, slide: 0.35, n: 180, ng: 0.04 },
    beam: { f: 1560, d: 0.04, type: "sine", g: 0.04, slide: 1.7, n: 3200, ng: 0.012 },
    storm: { f: 240, d: 0.07, type: "sawtooth", g: 0.055, slide: 2.4, n: 1400, ng: 0.04 },
    flame: { f: 96, d: 0.11, type: "sawtooth", g: 0.045, slide: 0.7, n: 420, ng: 0.06 },
    glacier: { f: 980, d: 0.08, type: "triangle", g: 0.05, slide: 1.55, n: 2600, ng: 0.012 },
    barrage: { f: 186, d: 0.1, type: "sawtooth", g: 0.06, slide: 0.42, n: 240, ng: 0.04 },
    cone: { f: 150, d: 0.1, type: "triangle", g: 0.06, slide: 0.38, n: 200, ng: 0.05 },
    aurora: { f: 520, d: 0.12, type: "sine", g: 0.05, slide: 1.25, n: 1600, ng: 0.015 },
    tick: { f: 460, d: 0.04, type: "square", g: 0.045, slide: 1.2, n: 1100, ng: 0.02 },
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
