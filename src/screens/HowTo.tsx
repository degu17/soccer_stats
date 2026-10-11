import { sfx } from '../lib/sound';
import { useApp, type Route } from '../state';
import { TopBar } from '../components/ui';
import { IconArrow } from '../components/icons';

const STEPS = [
  { n: '1', title: '数字の目利き', body: '「何点取った？」を物差しで予想。近いほど高得点。', art: 'ruler' },
  { n: '2', title: 'プロファイリング', body: 'スカウティング・レポートの数字から、FW・MF・DF・GKを見抜く。', art: 'report' },
  { n: '3', title: 'キャリア・ドロー', body: '移籍やケガを手がかりに、毎年の成績を鉛筆で描く。本物と重ねて答え合わせ。', art: 'draw' },
] as const;

export function HowTo({ then }: { then: Route }) {
  const app = useApp();
  return (
    <div class="screen">
      <TopBar onBack={() => app.go(then.name === 'board' ? { name: 'title' } : then)} kicker="BRIEFING" title="捜査の手順" />
      <div class="grow col howto">
        <p class="howto-lead">
          謎の選手の<b>スタッツ</b>（成績の数字）から、3つの手がかりで正体に迫る。
        </p>
        <ol class="howto-list">
          {STEPS.map((s, i) => (
            <li key={s.n} class="rise" style={{ animationDelay: `${i * 90}ms` }}>
              <span class="howto-n num">{s.n}</span>
              <div>
                <b>{s.title}</b>
                <span>{s.body}</span>
              </div>
              <HowArt kind={s.art} />
            </li>
          ))}
        </ol>
        <p class="howto-foot">
          最後に正体と、数字に隠れた物語が明かされる。
          <br />
          名前を知らなくても大丈夫。<span class="marker">推理で勝負だ。</span>
        </p>
      </div>
      <div class="actions">
        <button
          class="btn btn-primary"
          onClick={() => {
            sfx.tap();
            app.go(then);
          }}
        >
          了解 <IconArrow />
        </button>
      </div>
    </div>
  );
}

function HowArt({ kind }: { kind: 'ruler' | 'report' | 'draw' }) {
  return (
    <svg viewBox="0 0 64 48" class="how-art" aria-hidden="true">
      {kind === 'ruler' && (
        <>
          <rect x="3" y="18" width="58" height="16" fill="#f7f2e7" stroke="#1b1815" stroke-width="1.2" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={7 + i * 4.6} x2={7 + i * 4.6} y1="18" y2={i % 5 === 0 ? 27 : 23} stroke="#1b1815" stroke-width="1" />
          ))}
          <path d="M38 6 L38 34" stroke="#d33a1d" stroke-width="1.6" />
          <path d="M34 4 L42 4 L38 10 Z" fill="#d33a1d" />
        </>
      )}
      {kind === 'report' && (
        <>
          <rect x="10" y="4" width="44" height="40" fill="#f7f2e7" stroke="#1b1815" stroke-width="1.2" />
          {[13, 20, 27, 34].map((y) => (
            <line key={y} x1="15" x2="49" y1={y} y2={y} stroke="#958c7e" stroke-dasharray="1.5 2" />
          ))}
          <ellipse cx="40" cy="27" rx="11" ry="6" fill="none" stroke="#2152a6" stroke-width="1.8" />
        </>
      )}
      {kind === 'draw' && (
        <>
          <path d="M4 40 H60 M4 40 V4" stroke="#1b1815" stroke-width="1.2" fill="none" />
          <path d="M8 34 L18 22 L28 28 L40 10 L54 24" fill="none" stroke="#d33a1d" stroke-width="2" />
          <path d="M8 30 L18 28 L28 22 L40 18 L54 28" fill="none" stroke="#2152a6" stroke-width="2" stroke-dasharray="3 2.5" />
        </>
      )}
    </svg>
  );
}
