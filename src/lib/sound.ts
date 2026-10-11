// Tiny synthesized sound effects (no audio files). Created lazily on the first user gesture.

let ctx: AudioContext | null = null;
let enabled = true;
let lastTick = 0;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac() {
  if (!enabled) return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slide?: number } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
  const peak = opts.gain ?? 0.12;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, gain = 0.15, delay = 0, lowpass = 900) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

function buzz(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
}

// A typewriter-and-rubber-stamp palette to match the paper case-file look.
export const sfx = {
  /** typewriter key */
  tap() {
    noise(0.03, 0.35, 0, 4200);
    tone(1800, 0.018, { type: 'square', gain: 0.025 });
    buzz(8);
  },
  /** ruler detent */
  tick() {
    const now = performance.now();
    if (now - lastTick < 40) return;
    lastTick = now;
    noise(0.012, 0.18, 0, 6000);
  },
  /** graphite on paper */
  pencil() {
    const now = performance.now();
    if (now - lastTick < 60) return;
    lastTick = now;
    noise(0.06, 0.07, 0, 2600);
  },
  good() {
    tone(1320, 0.5, { type: 'sine', gain: 0.07 });
    buzz(20);
  },
  /** typewriter carriage bell */
  great() {
    tone(2093, 0.9, { type: 'sine', gain: 0.09 });
    tone(4186, 0.5, { type: 'sine', gain: 0.025 });
    buzz(30);
  },
  bad() {
    noise(0.12, 0.4, 0, 300);
    tone(110, 0.18, { type: 'sine', gain: 0.18, slide: 70 });
    buzz(60);
  },
  /** counter wheel */
  count() {
    noise(0.01, 0.12, 0, 5000);
  },
  /** paper sliding out of a folder */
  whoosh() {
    noise(0.45, 0.1, 0, 1400);
  },
  stamp() {
    noise(0.16, 0.6, 0, 380);
    tone(80, 0.16, { type: 'sine', gain: 0.28, slide: 45 });
    buzz(40);
  },
  reveal() {
    tone(1568, 0.7, { type: 'sine', gain: 0.06 });
    tone(2093, 0.9, { type: 'sine', gain: 0.06, delay: 0.12 });
  },
};
