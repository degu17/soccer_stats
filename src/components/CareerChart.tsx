import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { leagueInfo, metricUnit, type EventKind, type Player } from '../data/players';
import { chartMax, metricSeries } from '../lib/stats';
import { sfx } from '../lib/sound';
import { useSize } from './ui';

export type ChartMode = 'draw' | 'compare' | 'story';

interface Props {
  player: Player;
  mode: ChartMode;
  user?: (number | null)[];
  onUser?: (u: (number | null)[]) => void;
  guide?: { value: number; label: string } | null;
  /** Story mode: which numbered beat is emphasised. */
  focus?: number;
  onFocus?: (i: number) => void;
  showEvents?: boolean;
}

const EVENT_COLOR: Record<EventKind, string> = {
  move: '#1b1815',
  injury: '#d33a1d',
  down: '#d33a1d',
  debut: '#2f5d3a',
  return: '#2f5d3a',
  honor: '#8a6a00',
};

const PAD_L = 30;
const PAD_R = 10;
const ROW_H = 17;
const BOTTOM = 44;

function niceStep(max: number) {
  if (max <= 15) return 5;
  if (max <= 40) return 10;
  return 10;
}

export function CareerChart({ player, mode, user, onUser, guide, focus = -1, onFocus, showEvents = true }: Props) {
  const [box, { w, h }] = useSize<HTMLDivElement>();
  const actual = useMemo(() => metricSeries(player), [player]);
  const n = actual.length;
  const yMax = chartMax(player);
  const seasons = player.seasons;

  // Lay out event labels in up to three rows so neighbours never overlap.
  const pins = useMemo(() => {
    if (!showEvents || !w) return { rows: 0, items: [] as { i: number; x: number; row: number; label: string; kind: EventKind; tw: number }[] };
    const plotW = w - PAD_L - PAD_R;
    const colW = plotW / n;
    const rowsEnd: number[] = [];
    const items = player.events
      .map((e) => ({ ...e, i: seasons.findIndex((s) => s.season === e.season) }))
      .filter((e) => e.i >= 0)
      .map((e) => {
        const cx = PAD_L + colW * (e.i + 0.5);
        const tw = e.label.length * 11 + 12;
        const x = Math.max(PAD_L - 6, Math.min(w - PAD_R - tw + 4, cx - tw / 2));
        let row = rowsEnd.findIndex((end) => end + 4 <= x);
        if (row < 0) {
          row = rowsEnd.length;
          rowsEnd.push(0);
        }
        rowsEnd[row] = x + tw;
        return { i: e.i, x, row, label: e.label, kind: e.kind, tw };
      });
    return { rows: rowsEnd.length, items };
  }, [w, n, player, seasons, showEvents]);

  const top = 10 + pins.rows * ROW_H + (pins.rows ? 6 : 0);
  const plotW = Math.max(0, w - PAD_L - PAD_R);
  const plotH = Math.max(0, h - top - BOTTOM);
  const colW = n ? plotW / n : 0;
  const X = (i: number) => PAD_L + colW * (i + 0.5);
  const Y = (v: number) => top + plotH * (1 - v / yMax);

  // ---- drawing ----
  const lastIdx = useRef<number | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const pointToValue = (clientX: number, clientY: number, el: Element) => {
    // Measure against the whole svg: the draw surface itself is offset from the plot origin.
    const r = ((el as SVGGraphicsElement).ownerSVGElement ?? el).getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    const i = Math.max(0, Math.min(n - 1, Math.floor((px - PAD_L) / colW)));
    const v = Math.max(0, Math.min(yMax, Math.round(((top + plotH - py) / plotH) * yMax)));
    return { i, v };
  };

  const paint = (clientX: number, clientY: number, el: Element) => {
    if (!onUser || !userRef.current) return;
    const { i, v } = pointToValue(clientX, clientY, el);
    const next = userRef.current.slice();
    const from = lastIdx.current;
    if (from !== null && from !== i) {
      // Fill skipped columns when the finger moves fast, interpolating from the last value.
      const v0 = next[from] ?? v;
      const dir = i > from ? 1 : -1;
      for (let k = from + dir; k !== i; k += dir) {
        next[k] = Math.round(v0 + ((v - v0) * (k - from)) / (i - from));
      }
    }
    next[i] = v;
    lastIdx.current = i;
    sfx.pencil();
    onUser(next);
  };

  const drawing = mode === 'draw' && !!onUser;

  // ---- reveal animation for compare mode ----
  const actualPath = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const [revealed, setRevealed] = useState(mode !== 'compare');
  useEffect(() => {
    if (mode !== 'compare') {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
    return () => cancelAnimationFrame(id);
  }, [mode]);
  useEffect(() => {
    if (actualPath.current) setLen(actualPath.current.getTotalLength());
  }, [w, h, mode]);

  const pathOf = (vals: (number | null)[]) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null || v === undefined) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const ticks: number[] = [];
  for (let t = 0; t <= yMax; t += niceStep(yMax)) ticks.push(t);

  const ageStep = Math.max(1, Math.ceil(26 / Math.max(colW, 1)));

  // Contiguous league segments for the strip under the axis.
  const segments = useMemo(() => {
    const out: { from: number; to: number; label: string; tier: 1 | 2 }[] = [];
    seasons.forEach((s, i) => {
      const L = leagueInfo(s.league);
      const lastSeg = out.at(-1);
      if (lastSeg && lastSeg.label === L.label) lastSeg.to = i;
      else out.push({ from: i, to: i, label: L.label, tier: L.tier });
    });
    return out;
  }, [seasons]);

  const storyIdx = player.story.map((b) => seasons.findIndex((s) => s.season === b.season));

  return (
    <div class={`chart chart-${mode}`} ref={box}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} class="chart-svg">
          <defs>
            <pattern id="hatch-red" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="#d33a1d" stroke-width="1.4" stroke-opacity="0.35" />
            </pattern>
          </defs>

          {/* grid + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_L} x2={w - PAD_R} y1={Y(t)} y2={Y(t)} class={t === 0 ? 'axis' : 'grid'} />
              <text x={PAD_L - 6} y={Y(t) + 4} class="tick" text-anchor="end">
                {t}
              </text>
            </g>
          ))}
          <text x={4} y={top - 2} class="unit">
            {metricUnit(player)}
          </text>

          {/* graph paper: one column per season, fine horizontal lines between the labelled ones */}
          <g class="paper-grid">
            {actual.map((_, i) => (
              <line key={i} x1={PAD_L + colW * i} x2={PAD_L + colW * i} y1={top} y2={top + plotH} />
            ))}
            <line x1={w - PAD_R} x2={w - PAD_R} y1={top} y2={top + plotH} />
            {Array.from({ length: Math.floor(yMax / (niceStep(yMax) / 5)) + 1 }, (_, k) => k * (niceStep(yMax) / 5)).map((v) => (
              <line key={`h${v}`} x1={PAD_L} x2={w - PAD_R} y1={Y(v)} y2={Y(v)} />
            ))}
          </g>

          {/* event pins */}
          {pins.items.map((p) => (
            <g key={p.label + p.i} class="pin">
              <line x1={X(p.i)} x2={X(p.i)} y1={10 + p.row * ROW_H + 15} y2={top + plotH} stroke={EVENT_COLOR[p.kind]} class="pin-line" />
              <rect x={p.x} y={10 + p.row * ROW_H} width={p.tw} height={15} rx={1.5} stroke={EVENT_COLOR[p.kind]} class="pin-tag" />
              <text x={p.x + p.tw / 2} y={10 + p.row * ROW_H + 11.2} class="pin-text" text-anchor="middle" fill={EVENT_COLOR[p.kind]}>
                {p.label}
              </text>
            </g>
          ))}

          {/* guide line (the number revealed in step 1) */}
          {guide && guide.value > 0 && (
            <g class="guide">
              <line x1={PAD_L} x2={w - PAD_R} y1={Y(guide.value)} y2={Y(guide.value)} />
              <text x={w - PAD_R - 2} y={Y(guide.value) - 5} text-anchor="end">
                {guide.label}
              </text>
            </g>
          )}

          {/* actual career */}
          {mode !== 'draw' && (
            <g>
              {mode === 'story' && <path d={`${pathOf(actual)}L${X(n - 1)} ${Y(0)}L${X(0)} ${Y(0)}Z`} fill="url(#hatch-red)" class="area" />}
              {mode === 'compare' &&
                user &&
                actual.map((a, i) =>
                  user[i] !== null && user[i] !== undefined ? (
                    <line key={i} x1={X(i)} x2={X(i)} y1={Y(a)} y2={Y(user[i]!)} class={`diff ${revealed ? 'on' : ''}`} style={{ transitionDelay: `${0.9 + i * 0.02}s` }} />
                  ) : null,
                )}
              <path
                ref={actualPath}
                d={pathOf(actual)}
                class="line-actual"
                style={
                  mode === 'compare' && len
                    ? { strokeDasharray: len, strokeDashoffset: revealed ? 0 : len, transition: revealed ? 'stroke-dashoffset 1.4s cubic-bezier(.45,.05,.3,1)' : 'none' }
                    : undefined
                }
              />
              {actual.map((a, i) => (
                <circle
                  key={i}
                  cx={X(i)}
                  cy={Y(a)}
                  r={Math.min(3.2, colW / 3.6)}
                  class={`dot-actual ${mode === 'compare' ? (revealed ? 'on' : '') : 'on'}`}
                  style={mode === 'compare' ? { transitionDelay: `${(i / n) * 1.3}s` } : undefined}
                />
              ))}
            </g>
          )}

          {/* user's drawing */}
          {user && (mode === 'draw' || mode === 'compare') && (
            <g class={mode === 'compare' ? 'user-dim' : ''}>
              {/* The turbulence filter is too heavy to re-run on every pointer move, so the live
                  drawing fakes graphite with a soft under-stroke; the filter comes on once it's done. */}
              {mode === 'draw' && <path d={pathOf(user)} class="line-user-soft" />}
              <path d={pathOf(user)} class="line-user" filter={mode === 'draw' ? undefined : 'url(#pencil)'} />
              {user.map((v, i) =>
                v === null ? (
                  mode === 'draw' ? <circle key={i} cx={X(i)} cy={Y(0)} r={Math.min(3.5, colW / 3.5)} class="dot-empty" /> : null
                ) : (
                  <circle key={i} cx={X(i)} cy={Y(v)} r={Math.min(3.2, colW / 3.6)} class="dot-user" />
                ),
              )}
            </g>
          )}

          {/* story markers */}
          {mode === 'story' &&
            storyIdx.map((si, k) =>
              si < 0 ? null : (
                <g
                  key={k}
                  class={`story-mark ${focus === k ? 'is-focus' : ''}`}
                  onClick={() => onFocus?.(k)}
                  style={{ cursor: onFocus ? 'pointer' : 'default' }}
                >
                  <line x1={X(si)} x2={X(si)} y1={Y(actual[si]) - 10} y2={Y(actual[si]) - 4} />
                  <circle cx={X(si)} cy={Y(actual[si]) - 21} r={11} />
                  <text x={X(si)} y={Y(actual[si]) - 16.5} text-anchor="middle">
                    {k + 1}
                  </text>
                </g>
              ),
            )}

          {/* age labels */}
          {seasons.map((s, i) =>
            i % ageStep === 0 || i === n - 1 ? (
              (i === n - 1 && i % ageStep !== 0 && (n - 1) % ageStep < ageStep / 2) ? null : (
                <text key={i} x={X(i)} y={top + plotH + 15} class="age" text-anchor="middle">
                  {s.age}
                  {i === 0 ? '歳' : ''}
                </text>
              )
            ) : null,
          )}

          {/* league strip */}
          {segments.map((sg, k) => {
            const x0 = PAD_L + colW * sg.from + 1;
            const sw = colW * (sg.to - sg.from + 1) - 2;
            const fits = sg.label.length * 10 + 6 <= sw;
            return (
              <g key={k} class={`league tier-${sg.tier}`}>
                <rect x={x0} y={top + plotH + 22} width={Math.max(1, sw)} height={16} rx={1} />
                {fits && (
                  <text x={x0 + sw / 2} y={top + plotH + 33.5} text-anchor="middle">
                    {sg.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* draw surface on top of everything */}
          {drawing && (
            <rect
              x={0}
              y={top - 12}
              width={w}
              height={plotH + 24}
              fill="transparent"
              class="draw-surface"
              onPointerDown={(e) => {
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
                lastIdx.current = null;
                paint(e.clientX, e.clientY, e.currentTarget as Element);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 0 && e.pointerType === 'mouse') return;
                if (!(e.currentTarget as Element).hasPointerCapture(e.pointerId)) return;
                paint(e.clientX, e.clientY, e.currentTarget as Element);
              }}
              onPointerUp={(e) => {
                lastIdx.current = null;
                (e.currentTarget as Element).releasePointerCapture(e.pointerId);
              }}
            />
          )}
        </svg>
      )}
    </div>
  );
}
