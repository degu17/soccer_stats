import { useEffect, useRef, useState } from 'preact/hooks';
import type { Player } from '../../data/players';
import { estimateMeaning, estimateTarget } from '../../lib/stats';
import { estimateScore, estimateVerdict } from '../../lib/score';
import { sfx } from '../../lib/sound';
import { Stamp, useCountUp, useSize } from '../../components/ui';
import { IconArrow, IconMinus, IconPlus } from '../../components/icons';

export function Estimate({ player, coach, onDone }: { player: Player; coach: boolean; onDone: (score: number) => void }) {
  const t = estimateTarget(player);
  const [guess, setGuess] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const score = guess === null ? 0 : estimateScore(guess, t.value, t.max);
  const verdict = estimateVerdict(score);
  const shown = useCountUp(t.value, submitted, 1100, sfx.count);
  const counted = submitted && shown === t.value;

  useEffect(() => {
    if (!counted) return;
    sfx.stamp();
    if (verdict.tone === 'great') setTimeout(sfx.great, 150);
  }, [counted]);

  const nudge = t.step === 1 ? 1 : 10;
  const set = (v: number) => {
    const nv = Math.max(0, Math.min(t.max, Math.round(v / t.step) * t.step));
    if (nv !== guess) sfx.tick();
    setGuess(nv);
  };

  return (
    <>
      <div class="grow col estimate">
        <section class="q">
          <span class="kicker">手がかり 1 ― 数字の目利き</span>
          <h2 class="q-text display">
            {t.question.split('\n').map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </h2>
          <p class="note">{t.hint}</p>
        </section>

        <div class="estimate-figure grow col center">
          {!submitted ? (
            <div class={`big-number ${guess === null ? 'is-empty' : ''}`}>
              <span class="num">{guess ?? '?'}</span>
              <small>{t.unit}</small>
            </div>
          ) : (
            <div class="tally">
              <div>
                <span class="label">あなたの予想</span>
                <b class="num pencil-text">
                  {guess}
                  <small>{t.unit}</small>
                </b>
              </div>
              <div>
                <span class="label">正解</span>
                <b class="num answer-text">
                  {shown}
                  <small>{t.unit}</small>
                </b>
              </div>
            </div>
          )}
          {coach && guess === null && <p class="hint-bubble">物差しをなぞって、目盛りを合わせよう</p>}
        </div>

        <Ruler
          max={t.max}
          value={guess}
          onChange={submitted ? undefined : set}
          answer={submitted ? t.value : null}
          others={submitted ? t.others : []}
        />
        {!submitted ? (
          <div class="nudges">
            <button class="nudge" aria-label={`${nudge}${t.unit}へらす`} onClick={() => set((guess ?? t.max / 2) - nudge)}>
              <IconMinus />
            </button>
            <span class="mono">
              微調整 ±{nudge}
              {t.unit}
            </span>
            <button class="nudge" aria-label={`${nudge}${t.unit}ふやす`} onClick={() => set((guess ?? t.max / 2) + nudge)}>
              <IconPlus />
            </button>
          </div>
        ) : (
          <div class={`verdict-line ${counted ? 'on' : ''}`}>
            <div class="verdict-row">
              {counted && <Stamp text={verdict.word.replace(/[！…]/g, '')} size={34} rot={-6} animate cls={`verdict-${verdict.tone}`} />}
              <span class="verdict-pts mono">{counted ? `+${score}pt` : ''}</span>
            </div>
            <p class="meaning">{counted ? estimateMeaning(player) : ''}</p>
          </div>
        )}
      </div>
      <div class="actions">
        {!submitted ? (
          <button
            class="btn btn-primary"
            disabled={guess === null}
            onClick={() => {
              sfx.tap();
              setSubmitted(true);
            }}
          >
            この数字で決定
          </button>
        ) : (
          <button class={`btn btn-primary ${counted ? 'ready' : ''}`} disabled={!counted} onClick={() => onDone(score)}>
            次の手がかりへ <IconArrow />
          </button>
        )}
      </div>
    </>
  );
}

/** A printed ruler. Interactive while guessing; afterwards it shows the guess, the answer and the other nine. */
function Ruler({
  max,
  value,
  onChange,
  answer,
  others,
}: {
  max: number;
  value: number | null;
  onChange?: (v: number) => void;
  answer: number | null;
  others: number[];
}) {
  const [box, { w }] = useSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (answer === null) return;
    const id = setTimeout(() => setGo(true), 80);
    return () => clearTimeout(id);
  }, [answer]);

  const pad = 14;
  const H = 108;
  const top = 34; // ruler body spans y = top .. top + 38
  const X = (v: number) => pad + ((w - pad * 2) * Math.max(0, Math.min(max, v))) / max;
  const minor = max === 50 ? 1 : 20;
  const major = max === 50 ? 5 : 100;
  const labelEvery = max === 50 ? 10 : 200;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += minor) ticks.push(v);

  const fromPointer = (clientX: number) => {
    if (!onChange || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    onChange(((clientX - r.left - pad) / (r.width - pad * 2)) * max);
  };
  const clampLabel = (x: number) => Math.max(pad + 24, Math.min(w - pad - 24, x));

  return (
    <div class={`ruler ${onChange ? 'is-live' : ''}`} ref={box}>
      {w > 0 && (
        <svg
          ref={svgRef}
          width={w}
          height={H}
          viewBox={`0 0 ${w} ${H}`}
          onPointerDown={(e) => {
            if (!onChange) return;
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            fromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) fromPointer(e.clientX);
          }}
        >
          <rect x={3} y={top} width={w - 6} height={38} class="ruler-body" />
          {ticks.map((v) => (
            <line key={v} x1={X(v)} x2={X(v)} y1={top} y2={top + (v % labelEvery === 0 ? 15 : v % major === 0 ? 10 : 5)} class="ruler-tick" />
          ))}
          {ticks
            .filter((v) => v % labelEvery === 0)
            .map((v) => (
              <text key={v} x={X(v)} y={top + 29} class="ruler-num" text-anchor="middle" opacity={answer !== null && go && Math.abs(X(v) - X(answer)) < 14 ? 0.15 : 1}>
                {v}
              </text>
            ))}

          {/* the other nine, as small ink notches under the ruler */}
          {others.map((o, i) => (
            <path key={i} d={`M${X(o)} ${top + 38} l-3.5 6 h7 z`} class={`ruler-other ${go ? 'on' : ''}`} style={{ transitionDelay: `${0.8 + i * 0.05}s` }} />
          ))}

          {/* the guess: a blue pencil mark */}
          {value !== null && (
            <g class="ruler-guess">
              <line x1={X(value)} x2={X(value)} y1={top - 14} y2={top + 38} filter="url(#pencil)" />
              <path d={`M${X(value)} ${top - 2} l-5 -9 h10 z`} filter="url(#pencil)" />
              {answer !== null && (
                <text x={clampLabel(X(value))} y={top - 18} text-anchor="middle">
                  あなた {value}
                </text>
              )}
            </g>
          )}
          {value === null && onChange && <line x1={X(max / 2)} x2={X(max / 2)} y1={top - 10} y2={top + 38} class="ruler-ghost" />}

          {/* the answer: printed in red, sliding in from zero */}
          {answer !== null && (
            <g class="ruler-answer" style={{ transform: `translateX(${go ? X(answer) : X(0)}px)` }}>
              <line x1={0} x2={0} y1={top - 4} y2={top + 48} />
              <path d={`M0 ${top + 47} l-6 10 h12 z`} />
              <text y={H - 1} text-anchor="middle">
                正解
              </text>
            </g>
          )}
        </svg>
      )}
      {answer !== null && (
        <p class="ruler-legend mono">
          <i /> ＝ ほかの9人
        </p>
      )}
    </div>
  );
}
