import { useMemo, useState } from 'preact/hooks';
import { PLAYERS, POSITIONS, type Player } from '../../data/players';
import { MAX } from '../../lib/score';
import { sfx } from '../../lib/sound';
import { IconArrow } from '../../components/icons';
import { PhotoSlot, Scribble, Strike } from '../../components/ui';

function shuffle<T>(xs: T[]) {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Bonus({ player, onDone }: { player: Player; onDone: (score: number) => void }) {
  const options = useMemo(() => shuffle([player, ...shuffle(PLAYERS.filter((p) => p.id !== player.id)).slice(0, 3)]), [player]);
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === player.id;
  const score = correct ? MAX.bonus : 0;

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === player.id) sfx.great();
    else if (id !== 'skip') sfx.bad();
    else sfx.tap();
  };

  return (
    <>
      <div class="grow col bonus">
        <section class="q">
          <span class="kicker">ボーナス ― 容疑者の特定（+{MAX.bonus}pt）</span>
          <h2 class="q-text display q-sm">この選手、だれだ？</h2>
        </section>
        <div class="bonus-recap">
          <PhotoSlot size={48} label={false} />
          <p class="mono">
            {player.nation}／{POSITIONS[player.position].role}
            <br />
            {player.birth.slice(0, 4)}年生まれ・{player.height}cm
          </p>
        </div>
        <ol class="suspects">
          {options.map((o, i) => {
            const isPicked = picked === o.id;
            const isAnswer = picked && o.id === player.id;
            return (
              <li key={o.id}>
                <button class={`suspect ${picked && !isPicked && !isAnswer ? 'is-dim' : ''}`} disabled={!!picked} onClick={() => choose(o.id)}>
                  <span class="suspect-no mono">{String.fromCharCode(65 + i)}</span>
                  <span class="suspect-name">
                    <b>{o.nameJa}</b>
                    <small class="mono">{o.nameEn}</small>
                  </span>
                  {isAnswer && <Scribble color={isPicked ? 'var(--blue)' : 'var(--red)'} seed={i + 2} />}
                  {isPicked && !correct && <Strike />}
                </button>
              </li>
            );
          })}
        </ol>
        <button class="bonus-skip" disabled={!!picked} onClick={() => choose('skip')}>
          わからない（減点なしでスキップ）
        </button>
        <p class={`bonus-result ${correct ? 'ok' : ''}`}>{picked ? (correct ? `お見事。+${MAX.bonus}pt` : '正体は、次のページで。') : ''}</p>
      </div>
      <div class="actions">
        <button class={`btn btn-primary ${picked ? 'ready' : ''}`} disabled={!picked} onClick={() => onDone(score)}>
          ファイルを開く <IconArrow />
        </button>
      </div>
    </>
  );
}
