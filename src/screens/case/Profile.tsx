import { useState } from 'preact/hooks';
import { PLAYERS, POSITIONS, type Player, type Position } from '../../data/players';
import { careerTotals, PER_GAME_BANDS } from '../../lib/stats';
import { PROFILE_POINTS } from '../../lib/score';
import { sfx } from '../../lib/sound';
import { Scribble, Strike } from '../../components/ui';
import { IconArrow } from '../../components/icons';

interface Row {
  key: string;
  label: string;
  value: string;
  unit: string;
  explain: string;
}

const ORDER: Position[] = ['FW', 'MF', 'DF', 'GK'];

const WHY: Record<Position, (perGame: number) => string> = {
  FW: (pg) => `約${Math.max(1, Math.round((1 / pg) * 10) / 10)}試合に1点。ゴールを奪うのが仕事の点取り屋だ。`,
  MF: (pg) => `約${Math.round(1 / pg)}試合に1点。点も取るが、主役はパスで試合を組み立てること。`,
  DF: (pg) => `約${Math.round(1 / pg)}試合に1点。得点はたまに決める程度で、本業は守ること。`,
  GK: () => '得点はゼロ。ゴールを守るのが仕事だから、出場数こそが勲章。',
};

export function Profile({ player, coach, onDone }: { player: Player; coach: boolean; onDone: (score: number) => void }) {
  const t = careerTotals(player);
  const rows: Row[] = [
    { key: 'apps', label: '通算出場', value: `${t.apps}`, unit: '試合', explain: 'リーグ戦に出た試合の合計。長く活躍した人ほど多い。' },
    { key: 'goals', label: '通算得点', value: `${t.goals}`, unit: '点', explain: 'リーグ戦で決めたゴールの合計。' },
    { key: 'pergame', label: '1試合あたり得点', value: t.perGame.toFixed(2), unit: '点', explain: '得点÷出場数。0.5なら「2試合に1点」。役割が一番よく表れる。' },
    { key: 'best', label: 'シーズン最多得点', value: `${t.bestGoals}`, unit: '点', explain: '一番ゴールを決めたシーズンの得点。' },
    { key: 'clubs', label: '所属クラブ', value: `${t.clubs}`, unit: 'クラブ', explain: 'プロとしてプレーしたクラブの数。' },
    { key: 'countries', label: 'プレーした国', value: `${t.countries}`, unit: 'か国', explain: 'リーグ戦を戦った国の数。海外挑戦の多さがわかる。' },
  ];
  const [info, setInfo] = useState<string | null>(null);
  const [wrong, setWrong] = useState<Position[]>([]);
  const [shaking, setShaking] = useState<Position | null>(null);
  const [solved, setSolved] = useState(false);
  const score = PROFILE_POINTS[Math.min(wrong.length, PROFILE_POINTS.length - 1)];
  const hinted = wrong.length > 0 && !solved;

  const pick = (p: Position) => {
    if (solved || wrong.includes(p)) return;
    if (p === player.position) {
      sfx.great();
      setSolved(true);
      setInfo(null);
    } else {
      sfx.bad();
      setWrong((w) => [...w, p]);
      setShaking(p);
      setTimeout(() => setShaking(null), 420);
    }
  };

  const footnote = info
    ? `※ ${rows.find((r) => r.key === info)!.explain}`
    : hinted
      ? '※ ヒント：「1試合あたり得点」に注目。'
      : coach
        ? '※ 項目をタップすると、数字の意味が出る。'
        : '※ 数字の組み合わせから、役割を見抜け。';

  return (
    <>
      <div class={`grow col profile ${solved ? 'is-solved' : ''}`}>
        <section class="q">
          <span class="kicker">手がかり 2 ― プロファイリング</span>
          <h2 class="q-text display q-sm">この選手のタイプは？</h2>
        </section>

        <div class="report sheet">
          <header class="report-head mono">
            <span>SCOUTING REPORT</span>
            <span>リーグ戦のみ</span>
          </header>
          <div class="report-rows">
            {rows.map((r) => (
              <button
                key={r.key}
                class={`report-row ${info === r.key ? 'is-open' : ''} ${r.key === 'pergame' && (hinted || solved) ? 'is-key' : ''}`}
                onClick={() => {
                  sfx.tap();
                  setInfo(info === r.key ? null : r.key);
                }}
              >
                <span class="report-label">{r.label}</span>
                <i class="leader" />
                <span class="report-value">
                  <b class="num">{r.value}</b>
                  <small>{r.unit}</small>
                </span>
              </button>
            ))}
          </div>
          <p class={`report-foot ${hinted && !info ? 'is-hint' : ''}`}>{footnote}</p>
        </div>

        {!solved ? (
          <div class="checks">
            <span class="label">判定（ひとつ選ぶ）</span>
            <div class="check-grid">
              {ORDER.map((p) => (
                <button key={p} class={`check ${wrong.includes(p) ? 'is-wrong' : ''} ${shaking === p ? 'shake' : ''}`} disabled={wrong.includes(p)} onClick={() => pick(p)}>
                  <span class="check-box" />
                  <span class="check-pos mono">{p}</span>
                  <span class="check-name">{POSITIONS[p].name}</span>
                  {wrong.includes(p) && <Strike />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div class="profile-result rise">
            <div class="verdict-row">
              <span class="picked">
                <span class="mono">{player.position}</span> {POSITIONS[player.position].name}
                <Scribble color="var(--red)" seed={3} />
              </span>
              <span class="verdict-pts mono">+{score}pt</span>
            </div>
            <PerGameMeter player={player} />
            <p class="meaning">{WHY[player.position](t.perGame)}</p>
          </div>
        )}
      </div>
      <div class="actions">
        <button class={`btn btn-primary ${solved ? 'ready' : ''}`} disabled={!solved} onClick={() => onDone(score)}>
          次の手がかりへ <IconArrow />
        </button>
      </div>
    </>
  );
}

/** Piecewise scale: each position band gets a quarter of the bar, so GK/DF stay readable. */
function bandPos(v: number) {
  const i = PER_GAME_BANDS.findIndex((b) => v < b.to);
  const k = i < 0 ? PER_GAME_BANDS.length - 1 : i;
  const b = PER_GAME_BANDS[k];
  const within = Math.max(0, Math.min(1, (v - b.from) / (b.to - b.from)));
  return ((k + within) / PER_GAME_BANDS.length) * 100;
}

function PerGameMeter({ player }: { player: Player }) {
  const pg = careerTotals(player).perGame;
  const others = PLAYERS.filter((p) => p.id !== player.id).map((p) => careerTotals(p).perGame);
  return (
    <div class="meter">
      <div class="meter-head">
        <span class="label">1試合あたり得点の目安</span>
        <b class="num">{pg.toFixed(2)}</b>
      </div>
      <div class="meter-bar">
        {PER_GAME_BANDS.map((b) => (
          <div key={b.pos} class={`meter-band ${b.pos === player.position ? 'is-on' : ''}`}>
            <span class="mono">{b.label}</span>
          </div>
        ))}
        {others.map((o, i) => (
          <i key={i} class="meter-other" style={{ left: `${bandPos(o)}%` }} />
        ))}
        <b class="meter-pin" style={{ left: `${bandPos(pg)}%` }} />
      </div>
      <div class="meter-scale mono">
        <span style={{ left: '0%' }}>0</span>
        <span style={{ left: '25%' }}>0.01</span>
        <span style={{ left: '50%' }}>0.1</span>
        <span style={{ left: '75%' }}>0.3</span>
        <span style={{ left: '100%' }}>0.8+</span>
      </div>
    </div>
  );
}
