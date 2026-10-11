import { useEffect } from 'preact/hooks';
import { POSITIONS, type Player } from '../../data/players';
import { MAX, MAX_TOTAL, RANK_TITLE, rankOf } from '../../lib/score';
import type { CaseScores } from '../../lib/store';
import { sfx } from '../../lib/sound';
import { PrintPhoto, RankStamp, Stamp, useCountUp, useTimeline } from '../../components/ui';
import { IconArrow } from '../../components/icons';

export function Reveal({ player, scores, isBest, onNext }: { player: Player; scores: CaseScores; isBest: boolean; onNext: () => void }) {
  const total = scores.estimate + scores.profile + scores.draw + scores.bonus;
  const rank = rankOf(total);
  // 1: photo slides out, 2: photo develops, 3: name + "identified" stamp, 4: receipt, 5: total, 6: rank stamp
  const stage = useTimeline([250, 1050, 1350, 1900, 2500, 3300]);
  const shownTotal = useCountUp(total, stage >= 5, 800, sfx.count);

  useEffect(() => {
    sfx.whoosh();
  }, []);
  useEffect(() => {
    if (stage === 2) sfx.reveal();
    if (stage === 3 || stage === 6) sfx.stamp();
  }, [stage]);

  const rows: [string, number, number][] = [
    ['数字の目利き', scores.estimate, MAX.estimate],
    ['プロファイリング', scores.profile, MAX.profile],
    ['キャリア・ドロー', scores.draw, MAX.draw],
    ['容疑者の特定', scores.bonus, MAX.bonus],
  ];
  const parts = player.nameJa.split('・');

  return (
    <>
      <div class="grow col reveal">
        <div class="reveal-top">
          <div class={`snapshot ${stage >= 1 ? 'on' : ''}`}>
            <svg class="clip" viewBox="0 0 24 60" aria-hidden="true">
              <path d="M8 46 V10 a6 6 0 0 1 12 0 V50 a9 9 0 0 1 -18 0 V16" fill="none" stroke="#7d7a74" stroke-width="2.4" stroke-linecap="round" />
            </svg>
            <PrintPhoto src={player.photo} alt={player.nameJa} w="100%" h="100%" color />
          </div>
          <div class={`reveal-name ${stage >= 3 ? 'on' : ''}`}>
            <span class="kicker">FILE {String(player.file).padStart(2, '0')} の正体</span>
            <h2 class={`display ${Math.max(...player.nameJa.split(/[・ ]/).map((w) => w.length)) > 5 ? 'is-long' : ''}`}>
              {parts.length > 1 ? (
                <>
                  <small>{parts.slice(0, -1).join('・')}・</small>
                  {parts.at(-1)}
                </>
              ) : (
                // Japanese names: family name and given name on their own lines, poster-style.
                player.nameJa.split(' ').map((w) => <span key={w}>{w}</span>)
              )}
            </h2>
            <p class="mono reveal-meta">
              {player.nation}／{player.position}・{POSITIONS[player.position].name}
            </p>
            <span class="reveal-stamp">{stage >= 3 && <Stamp text="正体判明" size={36} rot={-6} animate />}</span>
          </div>
        </div>
        <p class={`reveal-catch ${stage >= 3 ? 'on' : ''}`}>{player.catchcopy}</p>

        <div class={`receipt sheet ${stage >= 4 ? 'on' : ''}`}>
          {rows.map(([label, v, max]) => (
            <div class="receipt-row" key={label}>
              <span>{label}</span>
              <i class="leader" />
              <b class="mono">
                {v}
                <small>/{max}</small>
              </b>
            </div>
          ))}
          <div class="receipt-total">
            <span>合計</span>
            <b class="num">
              {shownTotal}
              <small class="mono">/{MAX_TOTAL}</small>
            </b>
            <span class="receipt-rank">
              {stage >= 6 && (
                <>
                  <RankStamp rank={rank} size={52} animate />
                  <em>{RANK_TITLE[rank]}</em>
                </>
              )}
            </span>
          </div>
          {stage >= 6 && isBest && <span class="best-tag mono rise">自己ベスト更新</span>}
        </div>
      </div>
      <div class="actions">
        <button class={`btn btn-primary ${stage >= 6 ? 'ready' : ''}`} disabled={stage < 6} onClick={onNext}>
          数字の物語を読む <IconArrow />
        </button>
      </div>
    </>
  );
}
