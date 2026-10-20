import { CASES, suspectById } from '../data/cases';
import { ACHIEVEMENTS } from '../data/achievements';
import { useApp } from '../state';
import { sfx } from '../lib/sound';
import { PhotoSlot, PrintPhoto, RankStamp, TopBar } from '../components/ui';
import { IconArrow, IconChevron } from '../components/icons';

const difficultyLabel = (difficulty: string) =>
  difficulty === 'easy' ? 'EASY' : difficulty === 'normal' ? 'NORMAL' : difficulty.toUpperCase();

export function Board() {
  const app = useApp();
  const { save } = app;
  const solvedCount = CASES.filter((c) => Boolean(save.results[c.id])).length;
  const allClear = solvedCount === CASES.length;
  const unlocked = new Set(save.achievements);
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;

  return (
    <div class="screen dx-screen dx-board">
      <TopBar
        onBack={() => app.go({ name: 'title' })}
        kicker="CASE LEDGER"
        title="事件ファイル"
        right={<span class="score-pill mono no-pt">{solvedCount}/{CASES.length}</span>}
      />
      <div class="grow dx-scroll dx-board-scroll">
        <header class="dx-board-head">
          <div>
            <span class="kicker">VOL.1</span>
            <h1 class="display">日本代表の系譜</h1>
            <p>似た容疑者から、数字で1人に絞る。全{CASES.length}事件。</p>
          </div>
          {allClear && (
            <div class="dx-all-clear">
              <RankStamp rank="S" size={58} animate />
              <span class="mono">ALL CLEAR</span>
            </div>
          )}
        </header>

        <ol class="dx-case-list">
          {CASES.map((caseFile) => {
            const result = save.results[caseFile.id];
            const progress = save.progress[caseFile.id];
            const solved = Boolean(result);
            const inProgress = Boolean(progress && progress.phase !== 'intro' && !solved);
            return (
              <li key={caseFile.id}>
                <button class="dx-case-row" onClick={() => {
                  sfx.tap();
                  app.go({ name: 'case', id: caseFile.id });
                }}>
                  <span class={`dx-case-no ${caseFile.tutorial ? 'is-tutorial' : ''}`}>
                    <small class="mono">{caseFile.tutorial ? 'TUTORIAL' : 'FILE'}</small>
                    <b class="num">{caseFile.tutorial ? '00' : String(caseFile.number).padStart(3, '0')}</b>
                  </span>
                  <span class="dx-case-main">
                    <span class="dx-case-top">
                      <b>{caseFile.title}</b>
                      <span class={`dx-diff mono ${caseFile.tutorial ? 'is-tutorial' : ''}`}>
                        {caseFile.tutorial ? 'TUTORIAL' : difficultyLabel(caseFile.difficulty)}
                      </span>
                    </span>
                    <span class="dx-case-sub">{caseFile.subtitle}</span>
                    <span class="dx-case-meta">
                      <span>{caseFile.suspectIds.length}人</span>
                      <span>{caseFile.clues.length}手がかり</span>
                      <span>約{caseFile.estimatedMinutes}分</span>
                      {inProgress && <span class="dx-case-progress">手がかり{progress?.purchasedClueIds.length ?? 0}枚</span>}
                    </span>
                  </span>
                  <span class="dx-case-side">
                    {solved ? (
                      <>
                        <RankStamp rank={result.bestRank} size={38} />
                        <small class="mono">{result.bestScore}点</small>
                      </>
                    ) : inProgress ? (
                      <>
                        <span class="dx-open-tag mono">OPEN</span>
                        <small class="mono">続きから</small>
                      </>
                    ) : (
                      <>
                        <span class="dx-unopened mono">未解決</span>
                        <IconChevron />
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <section class="dx-collection">
          <div class="dx-section-head">
            <span class="kicker">IDENTIFIED</span>
            <h2 class="display">正体判明</h2>
            <span class="dx-rule" />
            <span class="dx-section-count mono">{solvedCount}/{CASES.length}</span>
          </div>
          <div class="dx-collection-grid">
            {CASES.map((caseFile) => {
              const result = save.results[caseFile.id];
              const answer = result ? suspectById(caseFile.answerId) : null;
              return (
                <article class={`dx-collect ${answer ? 'is-open' : ''}`} key={caseFile.id}>
                  {answer?.photo ? (
                    <PrintPhoto src={answer.photo} alt={answer.nameJa} w="100%" h={104} color />
                  ) : (
                    <PhotoSlot size={78} label={false} />
                  )}
                  <div>
                    <span class="dx-collect-file mono">
                      {caseFile.tutorial ? 'TUTORIAL' : `FILE ${String(caseFile.number).padStart(3, '0')}`}
                    </span>
                    <b>{answer ? answer.nameJa : '？？？'}</b>
                    <small>{answer ? `${answer.position} / ${answer.height}cm` : '未解決'}</small>
                  </div>
                  {result && <RankStamp rank={result.bestRank} size={30} />}
                </article>
              );
            })}
          </div>
          <p class="dx-note">事件を解決すると、正体の写真と名前がここに残る。</p>
        </section>

        <section class="dx-achievements">
          <div class="dx-section-head">
            <span class="kicker">ACHIEVEMENTS</span>
            <h2 class="display">実績</h2>
            <span class="dx-rule" />
            <span class="dx-section-count mono">{unlockedCount}/{ACHIEVEMENTS.length}</span>
          </div>
          <div class="dx-ach-grid">
            {ACHIEVEMENTS.map((achievement) => {
              const on = unlocked.has(achievement.id);
              return (
                <article
                  class={`dx-ach ${on ? 'is-on' : ''}`}
                  key={achievement.id}
                  aria-label={`${achievement.title}。${achievement.detail}。${on ? '解除済み' : '未解除'}`}
                >
                  <span class="dx-ach-mark" aria-hidden="true">{on ? achievement.mark : '?'}</span>
                  <div>
                    <b>{achievement.title}</b>
                    <small>{achievement.detail}</small>
                    <span class={`dx-ach-state mono ${on ? 'is-on' : ''}`}>
                      {on ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          <p class="dx-note">事件を解くほど、捜査記録にスタンプが増える。</p>
        </section>

        <div class="dx-board-links">
          <button class="dx-board-link" onClick={() => app.go({ name: 'glossary' })}>
            <span class="mono">NOTEBOOK</span>
            <b>用語ノート</b>
            <small>{save.terms.length}語</small>
            <IconArrow />
          </button>
          <button class="dx-board-link" onClick={() => app.go({ name: 'credits' })}>
            <span class="mono">CREDITS</span>
            <b>クレジット</b>
            <small>写真・出典</small>
            <IconArrow />
          </button>
        </div>
      </div>
    </div>
  );
}
