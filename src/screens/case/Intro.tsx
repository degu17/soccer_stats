import type { Player } from '../../data/players';
import { careerTotals } from '../../lib/stats';
import { sfx } from '../../lib/sound';
import { PhotoSlot, Stamp } from '../../components/ui';

export function Intro({ player, onStart }: { player: Player; onStart: () => void }) {
  const t = careerTotals(player);
  const rows = [
    ['国籍', player.nation],
    ['生まれ', `${player.birth.slice(0, 4)}年`],
    ['身長', `${player.height} cm`],
    ['利き足', `${player.foot}`],
    ['プロ生活', `${t.firstAge}〜${t.lastAge}歳・${t.seasons}シーズン`],
  ];
  return (
    <>
      <div class="grow col intro">
        <article class="dossier sheet">
          <div class="dossier-clip" aria-hidden="true" />
          <header class="dossier-top mono">
            <span>FILE {String(player.file).padStart(2, '0')}</span>
            <span>
              難易度 {'●'.repeat(player.difficulty)}
              {'○'.repeat(3 - player.difficulty)}
            </span>
          </header>
          <div class="dossier-head">
            <PhotoSlot size={78} />
            <div>
              <span class="label">捜査対象</span>
              <h2 class="display">謎の選手 X</h2>
              <p class="note">名前・顔写真は伏せられている</p>
            </div>
          </div>
          <dl class="dossier-rows">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd class="mono">{v}</dd>
              </div>
            ))}
          </dl>
          <span class="dossier-stamp">
            <Stamp text="極秘" size={40} rot={8} />
          </span>
        </article>

        <ol class="plan">
          <li>
            <b class="num">1</b>
            <span>
              目利き<small>数字を見積もる</small>
            </span>
          </li>
          <li>
            <b class="num">2</b>
            <span>
              プロファイル<small>タイプを見抜く</small>
            </span>
          </li>
          <li>
            <b class="num">3</b>
            <span>
              ドロー<small>経歴を描く</small>
            </span>
          </li>
        </ol>
      </div>
      <div class="actions">
        <button
          class="btn btn-primary"
          onClick={() => {
            sfx.tap();
            onStart();
          }}
        >
          捜査開始
        </button>
      </div>
    </>
  );
}
