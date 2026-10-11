import { PLAYERS } from '../data/players';
import { TERMS } from '../lib/glossary';
import { sfx } from '../lib/sound';
import { useApp } from '../state';
import { IconSoundOff, IconSoundOn } from '../components/icons';

export function Title() {
  const app = useApp();
  const solved = PLAYERS.filter((p) => app.save.results[p.id]).length;
  const start = () => {
    sfx.tap();
    app.go(app.save.tutorialSeen || solved ? { name: 'board' } : { name: 'howto', then: { name: 'board' } });
  };
  return (
    <div class="screen title-screen">
      <div class="masthead">
        <span>No.001</span>
        <span class="masthead-mid">STATS DETECTIVE</span>
        <button class="icon-btn masthead-sound" aria-label={app.save.sound ? '音をオフ' : '音をオン'} onClick={app.toggleSound}>
          {app.save.sound ? <IconSoundOn /> : <IconSoundOff />}
        </button>
      </div>

      <div class="grow col title-main">
        <h1 class="headline">
          <span class="headline-1">この数字、</span>
          <span class="headline-2">
            だれ<em>？</em>
          </span>
        </h1>

        <figure class="title-fig sheet">
          <TitleArt />
          <figcaption>
            <b>図1</b> ある選手の、シーズンごとの得点。名前は伏せてある。
          </figcaption>
        </figure>

        <p class="lede">
          名前も顔も伏せられた<b>10人</b>の選手。
          <br />
          残された手がかりは、<span class="marker">数字だけ</span>だ。
        </p>
      </div>

      <div class="actions title-actions">
        <button class="btn btn-primary" onClick={start}>
          {solved ? `捜査を続ける（${solved}/${PLAYERS.length} 解決）` : '捜査をはじめる'}
        </button>
        <div class="title-links">
          <button
            onClick={() => {
              sfx.tap();
              app.go({ name: 'howto', then: { name: 'title' } });
            }}
          >
            遊び方
          </button>
          <button
            onClick={() => {
              sfx.tap();
              app.go({ name: 'glossary' });
            }}
          >
            用語ノート <span class="mono">{app.save.terms.length}/{TERMS.length}</span>
          </button>
          <button
            onClick={() => {
              sfx.tap();
              app.go({ name: 'credits' });
            }}
          >
            クレジット
          </button>
        </div>
      </div>
    </div>
  );
}

/** Printed career line (red ink) with the detective's pencil guess and a circled peak. */
function TitleArt() {
  // Fictional career (not one of the ten files) so the cover doesn't spoil anything.
  const real = [3, 8, 12, 17, 14, 19, 22, 17, 23, 26, 20, 24, 27, 22, 18, 13, 15, 9, 6, 2];
  const guess = [6, 9, 12, 14, 16, 17, 18, 19, 19, 20, 20, 19, 18, 17, 15, 13, 11, 9, 7, 5];
  const X = (i: number) => 28 + i * 14;
  const Y = (v: number) => 128 - v * 4;
  const path = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(v)}`).join('');
  return (
    <svg class="title-art" viewBox="0 0 320 150" aria-hidden="true">
      <g class="ta-grid">
        {Array.from({ length: 15 }, (_, i) => (
          <line key={`v${i}`} x1={20 + i * 20} x2={20 + i * 20} y1={12} y2={130} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1={20} x2={300} y1={10 + i * 24} y2={10 + i * 24} />
        ))}
      </g>
      <line x1={20} x2={302} y1={128} y2={128} class="ta-axis" />
      <line x1={20} x2={20} y1={8} y2={128} class="ta-axis" />
      <path d={path(guess)} class="ta-guess" filter="url(#pencil)" />
      <path d={path(real)} class="ta-real" pathLength={1} />
      {real.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r={2.4} class="ta-dot" style={{ animationDelay: `${0.25 + i * 0.05}s` }} />
      ))}
      <g class="ta-note">
        <ellipse cx={X(12)} cy={Y(27)} rx={15} ry={11} class="ta-circle" pathLength={1} />
        <path d={`M${X(12) + 14} ${Y(27) - 4} q 16 -8 28 -2`} class="ta-arrow" pathLength={1} />
        <text x={X(12) + 46} y={Y(27) - 1} class="ta-hand">
          ピーク？
        </text>
      </g>
    </svg>
  );
}
