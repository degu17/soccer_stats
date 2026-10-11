import { useState } from 'preact/hooks';
import { TERMS } from '../lib/glossary';
import { sfx } from '../lib/sound';
import { useApp } from '../state';
import { TopBar } from '../components/ui';

export function Glossary() {
  const app = useApp();
  const unlocked = TERMS.filter((t) => app.save.terms.includes(t.id));
  const [sel, setSel] = useState<string | null>(unlocked[0]?.id ?? null);
  const term = TERMS.find((t) => t.id === sel);
  return (
    <div class="screen">
      <TopBar onBack={() => app.go({ name: 'title' })} kicker="NOTEBOOK" title="用語ノート" right={<span class="score-pill mono no-pt">{unlocked.length}/{TERMS.length}</span>} />
      <p class="note glossary-lead">事件を解くたびに、スタッツの言葉が書き足されていく。</p>
      <ol class="term-index">
        {TERMS.map((t, i) => {
          const open = app.save.terms.includes(t.id);
          return (
            <li key={t.id}>
              <button
                class={`term ${open ? '' : 'is-locked'} ${sel === t.id ? 'is-sel' : ''}`}
                disabled={!open}
                onClick={() => {
                  sfx.tap();
                  setSel(t.id);
                }}
              >
                <span class="term-no mono">{String(i + 1).padStart(2, '0')}</span>
                <b>{open ? t.word : '・・・・'}</b>
              </button>
            </li>
          );
        })}
      </ol>
      <article class="term-detail sheet grow">
        {term ? (
          <div class="rise" key={term.id}>
            <h3 class="display">{term.word}</h3>
            <p class="term-short mono">{term.short}</p>
            <p class="term-body">{term.body}</p>
          </div>
        ) : (
          <p class="note">まだ何も書かれていない。事件を捜査すると、言葉が集まっていく。</p>
        )}
      </article>
    </div>
  );
}
