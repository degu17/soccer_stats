import { CASES } from '../data/cases';
import { useApp } from '../state';
import { sfx } from '../lib/sound';
import { TopBar } from '../components/ui';
import { IconArrow } from '../components/icons';

const STEPS = [
  {
    n: '01',
    title: '事件カードを読む',
    body: '名前を伏せた「謎の選手X」と、無料の手がかりが1つ。まずは容疑者カードの数字を並べて見る。',
    art: 'file',
  },
  {
    n: '02',
    title: '手がかりを買って、消す',
    body: '6ptの予算で手がかりを買う。条件に合わない容疑者は×。残った候補と予算を見ながら、次の1枚を選ぶ。',
    art: 'cross',
  },
  {
    n: '03',
    title: '2枚の証拠で告発する',
    body: '最後に1人を選び、購入済みの手がかりから2枚を証拠に。2枚を重ねて1人だけ残れば、推理の完成。',
    art: 'chain',
  },
] as const;

export function HowTo() {
  const app = useApp();
  const tutorial = CASES.find((c) => c.tutorial);
  const go = () => {
    sfx.tap();
    if (!app.save.tutorialSeen && tutorial) {
      app.go({ name: 'case', id: tutorial.id });
    } else {
      app.go({ name: 'board' });
    }
  };

  return (
    <div class="screen dx-screen dx-howto">
      <TopBar onBack={() => app.go({ name: 'title' })} kicker="BRIEFING" title="あそびかた" />
      <div class="grow dx-scroll dx-howto-scroll">
        <header class="dx-howto-head">
          <span class="kicker">HOW TO INVESTIGATE</span>
          <h1 class="display">
            数字を読む。<br />
            容疑者を消す。
          </h1>
          <p>
            サッカーの知識は要らない。容疑者カードに書かれた数字と、買った手がかりを照合するだけ。
          </p>
        </header>

        <ol class="dx-howto-list">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span class="dx-howto-no mono">{step.n}</span>
              <div class="dx-howto-copy">
                <h2 class="display">{step.title}</h2>
                <p>{step.body}</p>
              </div>
              <HowArt kind={step.art} />
            </li>
          ))}
        </ol>

        <section class="dx-howto-rules sheet">
          <span class="kicker">THE RULES</span>
          <dl>
            <div>
              <dt>予算</dt>
              <dd>1事件6pt。手がかりは1〜3pt。使わずに残すほど効率点が高い。</dd>
            </div>
            <div>
              <dt>証拠</dt>
              <dd>購入済みの手がかりから2枚。両方に当てはまる人物が1人だけなら成立。</dd>
            </div>
            <div>
              <dt>得点</dt>
              <dd>正解50 + 証拠30/20/10 + 効率20 − 誤告発10。90点以上でS。</dd>
            </div>
            <div>
              <dt>失敗</dt>
              <dd>誤告発しても事件は終わらない。その人物が×になり、−10点。</dd>
            </div>
          </dl>
        </section>

        <p class="dx-howto-foot">
          迷ったら、安い手がかりから。<span class="marker">1枚で消える人数より、2枚の交点を見る。</span>
        </p>
      </div>
      <div class="actions dx-actions">
        <button class="btn btn-primary" onClick={go}>
          {!app.save.tutorialSeen && tutorial ? 'チュートリアルを始める' : '事件ファイルへ'}
          <IconArrow />
        </button>
      </div>
    </div>
  );
}

function HowArt({ kind }: { kind: 'file' | 'cross' | 'chain' }) {
  return (
    <svg viewBox="0 0 78 64" class="dx-how-art" aria-hidden="true">
      {kind === 'file' && (
        <>
          <rect x="7" y="4" width="64" height="56" rx="2" fill="#f7f2e7" stroke="#1b1815" stroke-width="1.4" />
          <rect x="14" y="11" width="50" height="9" fill="#1b1815" opacity="0.08" />
          <text x="39" y="40" text-anchor="middle" font-family="'Dela Gothic One',sans-serif" font-size="26" fill="#d33a1d">
            ?
          </text>
          <line x1="15" y1="49" x2="63" y2="49" stroke="#1b1815" stroke-width="1" stroke-dasharray="2 2" />
        </>
      )}
      {kind === 'cross' && (
        <>
          <rect x="5" y="6" width="68" height="12" fill="#f7f2e7" stroke="#1b1815" stroke-width="1" />
          <rect x="5" y="24" width="68" height="12" fill="#f7f2e7" stroke="#1b1815" stroke-width="1" />
          <rect x="5" y="42" width="68" height="12" fill="#f7f2e7" stroke="#1b1815" stroke-width="1" />
          <circle cx="14" cy="12" r="3.5" fill="none" stroke="#2152a6" stroke-width="1.5" />
          <circle cx="14" cy="30" r="3.5" fill="none" stroke="#2152a6" stroke-width="1.5" />
          <path d="M58 8l8 8M66 8l-8 8" stroke="#d33a1d" stroke-width="2" />
          <path d="M58 26l8 8M66 26l-8 8" stroke="#d33a1d" stroke-width="2" />
          <line x1="25" y1="12" x2="48" y2="12" stroke="#958c7e" stroke-width="1.4" />
          <line x1="25" y1="30" x2="45" y2="30" stroke="#958c7e" stroke-width="1.4" />
          <line x1="25" y1="48" x2="52" y2="48" stroke="#958c7e" stroke-width="1.4" />
        </>
      )}
      {kind === 'chain' && (
        <>
          <rect x="7" y="9" width="41" height="30" rx="1" transform="rotate(-7 27 24)" fill="#f7f2e7" stroke="#1b1815" stroke-width="1.2" />
          <rect x="30" y="25" width="41" height="30" rx="1" transform="rotate(6 50 40)" fill="#f7f2e7" stroke="#1b1815" stroke-width="1.2" />
          <circle cx="49" cy="38" r="10" fill="none" stroke="#d33a1d" stroke-width="1.6" />
          <path d="M44 38l3.5 3.5L55 33" fill="none" stroke="#d33a1d" stroke-width="1.8" />
          <line x1="14" y1="19" x2="38" y2="19" stroke="#958c7e" stroke-width="1.2" />
          <line x1="36" y1="46" x2="61" y2="46" stroke="#958c7e" stroke-width="1.2" />
        </>
      )}
    </svg>
  );
}
