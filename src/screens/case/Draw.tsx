import { useEffect, useMemo, useState } from 'preact/hooks';
import { metricUnit, type Player } from '../../data/players';
import { chartMax, estimateTarget, metricSeries } from '../../lib/stats';
import { drawScore } from '../../lib/score';
import { sfx } from '../../lib/sound';
import { CareerChart } from '../../components/CareerChart';
import { Stamp, useCountUp } from '../../components/ui';
import { IconArrow, IconRetry } from '../../components/icons';

export function Draw({ player, coach, onDone }: { player: Player; coach: boolean; onDone: (score: number) => void }) {
  const actual = useMemo(() => metricSeries(player), [player]);
  const n = actual.length;
  const [user, setUser] = useState<(number | null)[]>(() => Array(n).fill(null));
  const [phase, setPhase] = useState<'draw' | 'compare'>('draw');
  const filled = user.filter((v) => v !== null).length;
  const yMax = chartMax(player);
  const score = phase === 'compare' ? drawScore(user as number[], actual, yMax) : 0;
  const [showScore, setShowScore] = useState(false);
  const shown = useCountUp(score, showScore, 900, sfx.count);
  const what = player.metric === 'goals' ? '得点' : '出場試合数';

  useEffect(() => {
    if (phase !== 'compare') return;
    sfx.whoosh();
    const id = setTimeout(() => {
      setShowScore(true);
      sfx.stamp();
      if (score >= 80) setTimeout(sfx.great, 150);
    }, 1700);
    return () => clearTimeout(id);
  }, [phase]);

  const guide =
    player.metric === 'goals'
      ? { value: estimateTarget(player).value, label: `最多 ${estimateTarget(player).value}点（手がかり1）` }
      : { value: 38, label: '全試合 ≒ 34〜38' };

  // Point at the single season the player misjudged most: the most instructive spot on the chart.
  const miss = useMemo(() => {
    if (phase !== 'compare') return null;
    let k = 0;
    actual.forEach((a, i) => {
      if (Math.abs((user[i] ?? 0) - a) > Math.abs((user[k] ?? 0) - actual[k])) k = i;
    });
    return { s: player.seasons[k], real: actual[k], mine: user[k] };
  }, [phase]);

  const verdict = score >= 85 ? '名推理' : score >= 70 ? '鋭い' : score >= 50 ? 'まずまず' : '読み違い';

  return (
    <>
      <div class="grow col draw">
        <section class="q q-row">
          {showScore ? (
            <div class="draw-result rise">
              <span class="kicker">答え合わせ ― 一致度</span>
              <div class="draw-result-row">
                <b class="num">
                  {shown}
                  <small>%</small>
                </b>
                <Stamp text={verdict} size={32} rot={-7} animate cls={score >= 70 ? 'verdict-great' : score >= 50 ? 'verdict-ok' : 'verdict-bad'} />
              </div>
            </div>
          ) : (
            <div>
              <span class="kicker">手がかり 3 ― キャリア・ドロー</span>
              <h2 class="q-text display q-sm">
                毎シーズンの<span class="marker">{what}</span>を描け
              </h2>
            </div>
          )}
        </section>

        <div class="draw-legend mono">
          {phase === 'draw' ? (
            <>
              <span>イベントとリーグ帯が手がかり</span>
              <span class="draw-count">
                {filled}/{n}
              </span>
            </>
          ) : (
            <>
              <span class="legend-compare">
                <i class="lg-user" /> あなた
                <i class="lg-actual" /> 実際
              </span>
              <span>単位：{metricUnit(player)}</span>
            </>
          )}
        </div>

        <div class="chart-box sheet grow">
          <CareerChart player={player} mode={phase} user={user} onUser={phase === 'draw' ? setUser : undefined} guide={guide} />
          {coach && phase === 'draw' && filled === 0 && (
            <div class="finger-hint" aria-hidden="true">
              <svg class="finger-path" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M4 30 C 25 28, 35 8, 55 14 S 85 30, 96 22" pathLength={1} />
              </svg>
              <p class="hint-bubble">左から右へ、鉛筆でなぞるように描こう</p>
            </div>
          )}
        </div>
        {miss && (
          <p class={`draw-note mono ${showScore ? 'on' : ''}`}>
            一番のズレ ▶ {miss.s.age}歳（{miss.s.season}）実際 <b class="red">{miss.real}</b> ／ あなた <b class="blue">{miss.mine}</b>
          </p>
        )}
      </div>
      <div class="actions">
        {phase === 'draw' ? (
          <div class="btn-row">
            <button
              class="btn btn-ghost"
              disabled={filled === 0}
              onClick={() => {
                sfx.tap();
                setUser(Array(n).fill(null));
              }}
            >
              <IconRetry /> 消す
            </button>
            <button
              class={`btn btn-primary ${filled === n ? 'ready' : ''}`}
              disabled={filled < n}
              onClick={() => {
                sfx.tap();
                setPhase('compare');
              }}
            >
              {filled < n ? `あと ${n - filled} シーズン` : '答え合わせ'}
            </button>
          </div>
        ) : (
          <button class={`btn btn-primary ${showScore ? 'ready' : ''}`} disabled={!showScore} onClick={() => onDone(score)}>
            正体に迫る <IconArrow />
          </button>
        )}
      </div>
    </>
  );
}
