import { useEffect } from 'preact/hooks';
import { PLAYERS } from '../data/players';
import { MAX_TOTAL, RANK_TITLE, rankOf, type Rank } from '../lib/score';
import { shareAllText, shareOrCopy } from '../lib/share';
import { sfx } from '../lib/sound';
import { useApp } from '../state';
import { PrintPhoto, RankStamp, Stamp, TopBar, useCountUp, useTimeline } from '../components/ui';
import { IconShare } from '../components/icons';

export function Complete() {
  const app = useApp();
  const results = PLAYERS.map((p) => ({ p, r: app.save.results[p.id] }));
  const total = results.reduce((a, x) => a + (x.r?.best ?? 0), 0);
  const max = MAX_TOTAL * PLAYERS.length;
  // Overall rank uses the same thresholds as a single case, applied to the per-case average.
  const rank: Rank = rankOf(total / PLAYERS.length);
  const stage = useTimeline([300, 1000, 2100]);
  const shown = useCountUp(total, stage >= 2, 1200, sfx.count);

  useEffect(() => {
    if (stage === 1 || stage === 3) sfx.stamp();
  }, [stage]);

  const share = () => {
    const text = shareAllText(total, max, rank);
    void shareOrCopy(text, app.toast);
  };


  return (
    <div class="screen complete">
      <TopBar onBack={() => app.go({ name: 'board' })} kicker="CASE CLOSED" title="捜査報告書" />
      <article class="report-doc sheet grow">
        <header class="doc-head">
          <span class="kicker">全10事件</span>
          <h2 class="display">捜査完了</h2>
          {stage >= 1 && (
            <span class="doc-stamp">
              <Stamp text="完了" size={44} rot={10} animate />
            </span>
          )}
        </header>
        <div class="contact-sheet">
          {results.map(({ p, r }) => (
            <div key={p.id} class="contact">
              <PrintPhoto src={p.photo} w="100%" h="100%" />
              <span class="contact-name mono">{p.short}</span>
              {r && (
                <span class="contact-rank">
                  <RankStamp rank={r.bestRank} size={22} />
                </span>
              )}
            </div>
          ))}
        </div>
        <div class="doc-score">
          <div>
            <span class="label">総合スコア（各事件のベスト合計）</span>
            <b class="num">
              {shown}
              <small class="mono">/{max}</small>
            </b>
          </div>
          <span class="doc-rank">
            {stage >= 3 && (
              <>
                <RankStamp rank={rank} size={56} animate />
                <em>{RANK_TITLE[rank]}</em>
              </>
            )}
          </span>
        </div>
        <p class="doc-note">
          数字の裏には、いつも人の物語がある。
          <br />
          次に試合を見るときは、
          <br />
          スタッツにも目を向けてみよう。
        </p>
      </article>
      <div class="actions btn-row">
        <button class="btn btn-ghost" onClick={share}>
          <IconShare /> 共有
        </button>
        <button
          class="btn btn-primary"
          onClick={() => {
            sfx.tap();
            app.go({ name: 'board' });
          }}
        >
          事件簿へ戻る
        </button>
      </div>
    </div>
  );
}
