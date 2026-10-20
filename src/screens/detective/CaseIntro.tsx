import type { CaseBundle } from '../../data/caseTypes';
import { suspectById } from '../../data/cases';
import type { CaseProgress } from '../../lib/save';
import { TopBar } from '../../components/ui';
import { Sparkline } from '../../components/Sparkline';
import { IconArrow } from '../../components/icons';
import { tierText } from './CaseBits';

export function CaseIntro({
  bundle,
  progress,
  onBack,
  onStart,
}: {
  bundle: CaseBundle;
  progress: CaseProgress;
  onBack: () => void;
  onStart: () => void;
}) {
  const { caseFile } = bundle;
  const answer = suspectById(caseFile.answerId);
  const hasProgress =
    progress.purchasedClueIds.length > 0 ||
    progress.accusedIds.length > 0 ||
    progress.wrongAccusations > 0;
  const free = caseFile.freeClues[0];
  const difficulty = caseFile.tutorial
    ? 'TUTORIAL'
    : caseFile.difficulty === 'easy'
      ? 'EASY'
      : caseFile.difficulty === 'normal'
        ? 'NORMAL'
        : caseFile.difficulty.toUpperCase();

  return (
    <div class="screen dx-screen dx-intro">
      <TopBar
        onBack={onBack}
        kicker={caseFile.tutorial ? 'TUTORIAL' : `FILE ${String(caseFile.number).padStart(3, '0')}`}
        title="事件カード"
        right={<span class="dx-diff mono">{difficulty}</span>}
      />
      <div class="grow dx-scroll dx-intro-scroll">
        <header class="dx-intro-head">
          <span class="kicker">{caseFile.volumeTitle}</span>
          <h1 class="display">{caseFile.title}</h1>
          {caseFile.subtitle && <p class="dx-subtitle">{caseFile.subtitle}</p>}
          <p class="dx-hook">{caseFile.hook}</p>
        </header>

        <section class="dx-mystery sheet">
          <div class="dx-mystery-top mono">
            <span>UNKNOWN / {caseFile.tutorial ? 'TUTORIAL' : `FILE ${String(caseFile.number).padStart(3, '0')}`}</span>
            <span>容疑者 {caseFile.suspectIds.length}人</span>
          </div>
          <div class="dx-mystery-name">
            <span class="dx-question-mark">?</span>
            <div>
              <h2 class="display">謎の選手 X</h2>
              <p class="mono">
                {answer.position} / {answer.nation}
              </p>
            </div>
          </div>
          <div class="dx-free-clue">
            <span class="dx-free-tag mono">FREE CLUE</span>
            <b>{free.text}</b>
            <small>この条件だけで、全員は残らない。</small>
          </div>
          <Sparkline
            points={answer.sparkline}
            label="謎の選手Xのキャリア曲線。序盤から中盤に山があり、終盤まで続いている。"
          />
          <p class="dx-mystery-note">
            曲線は「試合への出場量」の形。名前・身長・クラブ名は伏せてある。
          </p>
        </section>

        <section class="dx-roll">
          <header class="dx-section-head">
            <span class="kicker">SUSPECTS</span>
            <h2 class="display">容疑者 {caseFile.suspectIds.length}人</h2>
            <span class="dx-rule" />
          </header>
          <ul class="dx-suspect-chips">
            {caseFile.suspectIds.map((id, i) => {
              const s = suspectById(id);
              return (
                <li key={id}>
                  <span class="dx-chip-no mono">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <b>{s.nameJa}</b>
                    <small>
                      {s.position} / {s.height}cm / {tierText(s.lastTier)}
                    </small>
                  </span>
                </li>
              );
            })}
          </ul>
          <p class="dx-note">
            名前は見えても、正解とは限らない。似た{caseFile.suspectIds.length}人から、数字で1人に絞る。
          </p>
        </section>

        {caseFile.tutorial && (
          <div class="dx-tutorial-note">
            <span class="mono">HOW TO PLAY</span>
            <p>
              手がかりを買う → 容疑者が消える → 2枚の証拠で告発。まずは1枚ずつ試そう。
            </p>
          </div>
        )}
      </div>
      <div class="actions dx-actions">
        {hasProgress && (
          <p class="dx-resume-note">
            途中の捜査が残っています（手がかり {progress.purchasedClueIds.length}枚）
          </p>
        )}
        <button class="btn btn-primary ready" onClick={onStart}>
          {hasProgress ? '捜査を続ける' : caseFile.tutorial ? 'チュートリアルを始める' : '捜査を開始する'}
          <IconArrow />
        </button>
      </div>
    </div>
  );
}
