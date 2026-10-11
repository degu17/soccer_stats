import { PLAYERS } from '../data/players';
import { MAX_TOTAL } from '../lib/score';
import { sfx } from '../lib/sound';
import { useApp } from '../state';
import { PhotoSlot, PrintPhoto, RankStamp, TopBar } from '../components/ui';

export function Board() {
  const app = useApp();
  const solved = PLAYERS.filter((p) => app.save.results[p.id]);
  const total = solved.reduce((a, p) => a + app.save.results[p.id].best, 0);
  const allDone = solved.length === PLAYERS.length;
  return (
    <div class="screen">
      <TopBar
        onBack={() => app.go({ name: 'title' })}
        kicker="CASE LEDGER"
        title="事件簿"
        right={
          <button
            class="ledger-total"
            disabled={!allDone}
            onClick={() => {
              sfx.tap();
              app.go({ name: 'complete' });
            }}
          >
            <span class="label">解決</span>
            <b class="num">
              {solved.length}
              <small>/{PLAYERS.length}</small>
            </b>
          </button>
        }
      />
      <div class="ledger-head mono">
        <span>No.</span>
        <span>対象</span>
        <span>{allDone ? `総合 ${total}/${MAX_TOTAL * PLAYERS.length}` : '難易度'}</span>
        <span>状況</span>
      </div>
      <ol class="ledger grow">
        {PLAYERS.map((p, i) => {
          const r = app.save.results[p.id];
          return (
            <li key={p.id} class="rise" style={{ animationDelay: `${i * 30}ms` }}>
              <button
                class={`ledger-row ${r ? 'is-solved' : ''}`}
                onClick={() => {
                  sfx.tap();
                  app.go({ name: 'case', id: p.id });
                }}
              >
                <span class="ledger-no mono">{String(p.file).padStart(2, '0')}</span>
                <span class="ledger-photo">{r ? <PrintPhoto src={p.photo} w={34} h={40} /> : <PhotoSlot size={34} label={false} />}</span>
                <span class="ledger-name">
                  <b>{r ? p.short : '謎の選手'}</b>
                  <small class="mono">
                    {r ? `BEST ${r.best}pt` : `${p.nation === '日本' ? '国内' : '海外'}・${p.seasons.length}シーズン`}
                  </small>
                </span>
                <span class="ledger-diff mono" aria-label={`難易度${p.difficulty}`}>
                  {'●'.repeat(p.difficulty)}
                  <i>{'○'.repeat(3 - p.difficulty)}</i>
                </span>
                <span class="ledger-status">{r ? <RankStamp rank={r.bestRank} size={30} /> : <span class="open-tag mono">未解決</span>}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p class="ledger-foot mono">{solved.length ? '解決済みの事件も再捜査できる' : '●が少ないほどやさしい。どこからでも捜査できる'}</p>
    </div>
  );
}
