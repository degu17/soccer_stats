import { useState } from 'preact/hooks';
import { metricName, type Player } from '../../data/players';
import { sfx } from '../../lib/sound';
import { CareerChart } from '../../components/CareerChart';
import { PrintPhoto } from '../../components/ui';
import { IconArrow, IconShare } from '../../components/icons';

export function Story({ player, onShare, onNext, nextLabel }: { player: Player; onShare: () => void; onNext: () => void; nextLabel: string }) {
  const [focus, setFocus] = useState(0);
  const c = player.credit;
  return (
    <>
      <div class="grow col story">
        <header class="story-head">
          <PrintPhoto src={player.photo} w={46} h={54} color />
          <div>
            <span class="kicker">数字の物語</span>
            <h2 class="display">{player.nameJa}</h2>
          </div>
        </header>
        <figure class="story-fig sheet">
          <div class="story-chart">
            <CareerChart
              player={player}
              mode="story"
              focus={focus}
              showEvents={false}
              onFocus={(i) => {
                sfx.tap();
                setFocus(i);
              }}
            />
          </div>
          <figcaption class="mono">
            図　{metricName(player)}の推移（横軸＝シーズン開始時の年齢）
          </figcaption>
        </figure>
        <ol class="beats">
          {player.story.map((b, i) => (
            <li key={i}>
              <button
                class={`beat ${focus === i ? 'is-focus' : ''}`}
                onClick={() => {
                  sfx.tap();
                  setFocus(i);
                }}
              >
                <b class="beat-n num">{i + 1}</b>
                <span>
                  <strong>
                    <em class="beat-age mono">{player.seasons.find((s) => s.season === b.season)?.age}歳</em>
                    {b.title}
                  </strong>
                  <small>{b.text}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p class="credit mono">
          写真：{c.author}／<a href={c.source} target="_blank" rel="noopener">Wikimedia Commons</a>（
          {c.licenseUrl ? (
            <a href={c.licenseUrl} target="_blank" rel="noopener">
              {c.license}
            </a>
          ) : (
            c.license
          )}
          ・トリミング）
        </p>
      </div>
      <div class="actions btn-row">
        <button class="btn btn-ghost" onClick={onShare}>
          <IconShare /> 共有
        </button>
        <button class="btn btn-primary" onClick={onNext}>
          {nextLabel} <IconArrow />
        </button>
      </div>
    </>
  );
}
