import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Rank } from '../lib/score';
import { sfx } from '../lib/sound';
import { IconBack } from './icons';

/** SVG filters shared by the whole app: worn stamp ink and a rough pencil line. */
export function InkDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="ink-worn" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.62" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="eaten" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="2" result="warp" />
          <feDisplacementMap in="eaten" in2="warp" scale="2.5" />
        </filter>
        <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.8" result="wobble" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.5" result="tooth" />
          <feComposite in="wobble" in2="tooth" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

export function TopBar(props: { onBack?: () => void; kicker?: string; title: string; right?: ComponentChildren }) {
  return (
    <header class="topbar">
      {props.onBack && (
        <button
          class="icon-btn"
          aria-label="もどる"
          onClick={() => {
            sfx.tap();
            props.onBack!();
          }}
        >
          <IconBack />
        </button>
      )}
      <div class="topbar-title">
        {props.kicker && <small>{props.kicker}</small>}
        <strong>{props.title}</strong>
      </div>
      {props.right}
    </header>
  );
}

/** Running score; `gain` (points from the step just finished) floats up once as "+N". */
export function ScorePill({ value, gain = 0 }: { value: number; gain?: number }) {
  return (
    <span class="score-pill">
      {value}
      {gain > 0 && <em class="score-float">+{gain}</em>}
    </span>
  );
}

export function Steps({ now }: { now: number }) {
  return (
    <div class="steps" aria-label={`ステップ ${now + 1}/3`}>
      {[0, 1, 2].map((i) => (
        <i key={i} class={i < now ? 'done' : i === now ? 'now' : ''}>
          {i + 1}
        </i>
      ))}
    </div>
  );
}

/** Empty, hatched photo slot standing in for the unknown player. */
export function PhotoSlot({ size, label = true }: { size: number; label?: boolean }) {
  return (
    <span class="photo-slot" style={{ width: size, height: size * 1.2, fontSize: size * 0.42 }} aria-hidden="true">
      ?{label && size >= 64 && <small class="photo-slot-label">NO PHOTO</small>}
    </span>
  );
}

/** A halftone print of a player's photo. */
export function PrintPhoto({ src, alt = '', w, h, color = false, cls = '' }: { src: string; alt?: string; w: number | string; h: number | string; color?: boolean; cls?: string }) {
  return (
    <span class={`print-photo ${color ? 'color' : ''} ${cls}`} style={{ width: w, height: h, display: 'block' }}>
      <img src={src} alt={alt} draggable={false} />
    </span>
  );
}

/**
 * Rubber stamp drawn in SVG so the worn-ink filter works everywhere.
 * `text` is usually a rank letter; longer words get a wider rectangular stamp.
 */
export function Stamp({ text, size = 44, animate = false, rot = -9, cls = '' }: { text: string; size?: number; animate?: boolean; rot?: number; cls?: string }) {
  const wide = text.length > 1;
  if (!wide && size < 26) {
    // Too small for a legible ring: a solid printed label instead.
    return (
      <svg class={`stamp-svg ${cls}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={text}>
        <rect x={1} y={1} width={size - 2} height={size - 2} rx={2} fill="currentColor" />
        <text x={size / 2} y={size / 2 + 0.5} text-anchor="middle" dominant-baseline="central" font-family="'Dela Gothic One', sans-serif" font-size={size * 0.62} fill="#f7f2e7">
          {text}
        </text>
      </svg>
    );
  }
  const w = wide ? size * (0.62 * text.length + 0.5) : size;
  const h = size;
  return (
    <svg class={`stamp-svg ${animate ? 'stamp-in' : ''} ${cls}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={text}>
      <g transform={`rotate(${rot} ${w / 2} ${h / 2})`} filter="url(#ink-worn)" fill="currentColor" stroke="currentColor">
        {wide ? (
          <rect x={2} y={2} width={w - 4} height={h - 4} rx={4} fill="none" stroke-width={Math.max(2, size * 0.07)} />
        ) : (
          // Double ring with a "RANK" label, so a lone letter never reads as a © mark.
          <>
            <circle cx={w / 2} cy={h / 2} r={h / 2 - 2} fill="none" stroke-width={Math.max(1.6, size * 0.06)} />
            <circle cx={w / 2} cy={h / 2} r={h / 2 - 2 - size * 0.1} fill="none" stroke-width={Math.max(0.8, size * 0.025)} />
            {size >= 26 && (
              <text x={w / 2} y={h * 0.3} text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-weight="600" font-size={size * 0.13} stroke="none" letter-spacing={size * 0.02}>
                RANK
              </text>
            )}
          </>
        )}
        {wide && <rect x={size * 0.15} y={size * 0.15} width={w - size * 0.3} height={h - size * 0.3} rx={2} fill="none" stroke-width={1} />}
        <text
          x={w / 2}
          y={h / 2 + size * (wide ? 0.02 : 0.1)}
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'Dela Gothic One', sans-serif"
          font-size={wide ? size * 0.42 : size * (size >= 26 ? 0.46 : 0.56)}
          stroke="none"
          letter-spacing={wide ? size * 0.05 : 0}
        >
          {text}
        </text>
      </g>
    </svg>
  );
}

export function RankStamp({ rank, size = 44, animate = false }: { rank: Rank; size?: number; animate?: boolean }) {
  return <Stamp text={rank} size={size} animate={animate} cls={`rank-${rank}`} rot={-12} />;
}

/** Wobbly hand-drawn loop around something, drawn on with a pen-stroke animation. */
export function Scribble({ color = 'var(--blue)', seed = 1 }: { color?: string; seed?: number }) {
  const pts: string[] = [];
  const turns = 1.18;
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2 - 2.2;
    const wob = 1 + 0.05 * Math.sin(t * 3 + seed) + 0.03 * Math.cos(t * 5 + seed * 2);
    const drift = 1 + (i / steps) * 0.06;
    const x = 50 + 47 * wob * drift * Math.cos(t);
    const y = 50 + 42 * wob * drift * Math.sin(t);
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return (
    <svg class="scribble" viewBox="-4 -4 108 108" preserveAspectRatio="none" aria-hidden="true">
      <path d={pts.join('')} fill="none" stroke={color} stroke-width="2.6" stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength={1} />
    </svg>
  );
}

/** Two quick red strokes crossing something out. */
export function Strike() {
  return (
    <svg class="strike" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M8 22 L92 80" pathLength={1} />
      <path d="M90 18 L12 84" pathLength={1} style={{ animationDelay: '0.12s' }} />
    </svg>
  );
}

/** Animated number that counts up to `value`, starting when `run` becomes true. */
export function useCountUp(value: number, run: boolean, ms = 900, onTick?: () => void) {
  const [v, setV] = useState(0);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  useEffect(() => {
    if (!run) {
      setV(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    let last = -1;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const eased = 1 - (1 - k) ** 3;
      const cur = Math.round(value * eased);
      if (cur !== last) {
        last = cur;
        tickRef.current?.();
      }
      setV(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, run, ms]);
  return v;
}

/** Measures an element's content box; charts draw in real pixels so lines stay crisp. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** How many of the timed steps (ms offsets) have elapsed: drives staged reveals. */
export function useTimeline(steps: number[], run = true) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    setN(0);
    const ids = steps.map((ms, i) => window.setTimeout(() => setN(i + 1), ms));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);
  return n;
}
