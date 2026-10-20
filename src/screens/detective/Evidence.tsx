import { useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { CaseBundle, Clue, SuspectProfile } from '../../data/caseTypes';
import type { CaseProgress } from '../../lib/save';
import {
  evaluateEvidence,
  initialCandidates,
  matchesEffect,
} from '../../lib/caseEngine';
import { TopBar } from '../../components/ui';
import { IconCheck, IconChevron } from '../../components/icons';
import { sfx } from '../../lib/sound';
import { Coach, Modal, tierText } from './CaseBits';

export function Evidence({
  bundle,
  progress,
  assist,
  onBack,
  onSelection,
  onAccuse,
  coach,
  coachStep,
}: {
  bundle: CaseBundle;
  progress: CaseProgress;
  assist: boolean;
  onBack: () => void;
  onSelection: (suspectId: string | null, evidenceIds: string[]) => void;
  onAccuse: (suspectId: string, evidenceIds: string[]) => void;
  coach?: ComponentChildren;
  coachStep?: string;
}) {
  const { caseFile } = bundle;
  const [confirming, setConfirming] = useState(false);
  const [limitNote, setLimitNote] = useState(false);
  const purchased = useMemo(
    () => caseFile.clues.filter((clue) => progress.purchasedClueIds.includes(clue.id)),
    [caseFile.clues, progress.purchasedClueIds],
  );
  const initial = useMemo(() => initialCandidates(bundle), [bundle]);
  const remaining = initial.filter(
    (suspect) =>
      !progress.accusedIds.includes(suspect.id) &&
      progress.marks[suspect.id] !== 'eliminated' &&
      (!assist || purchased.every((clue) => matchesEffect(clue.effect, suspect))),
  );
  const suspects = caseFile.suspectIds
    .map((id) => bundle.suspects.find((s) => s.id === id))
    .filter((s): s is SuspectProfile => Boolean(s));
  const selectedSuspect =
    remaining.find((s) => s.id === progress.selectedSuspectId) ?? null;
  const evidenceIds = progress.selectedEvidenceIds.slice(0, caseFile.scoring.evidenceCount);
  const evaluation = evaluateEvidence(bundle, progress.purchasedClueIds, evidenceIds);
  const canAccuse = Boolean(selectedSuspect) && evidenceIds.length === caseFile.scoring.evidenceCount;

  const chooseSuspect = (id: string) => {
    if (progress.accusedIds.includes(id)) return;
    if (!remaining.some((s) => s.id === id)) return;
    sfx.tap();
    onSelection(id === progress.selectedSuspectId ? null : id, evidenceIds);
  };

  const chooseEvidence = (clue: Clue) => {
    if (evidenceIds.includes(clue.id)) {
      sfx.tap();
      onSelection(selectedSuspect?.id ?? null, evidenceIds.filter((id) => id !== clue.id));
      setLimitNote(false);
      return;
    }
    if (evidenceIds.length >= caseFile.scoring.evidenceCount) {
      sfx.bad();
      setLimitNote(true);
      return;
    }
    sfx.tap();
    setLimitNote(false);
    onSelection(selectedSuspect?.id ?? null, [...evidenceIds, clue.id]);
  };

  const accuse = () => {
    if (!selectedSuspect || evidenceIds.length !== 2) return;
    setConfirming(false);
    onAccuse(selectedSuspect.id, evidenceIds);
  };

  return (
    <div class="screen dx-screen dx-evidence">
      <TopBar
        onBack={onBack}
        kicker="ACCUSATION"
        title="告発"
        right={
          assist ? (
            <span class="dx-remain dx-remain-top" aria-live="polite">
              残り <b>{remaining.length}</b>人
            </span>
          ) : (
            <span class="dx-remain dx-remain-top mono">
              購入済み <b>{purchased.length}</b>/{caseFile.clues.length}
            </span>
          )
        }
      />
      <div class="grow dx-scroll dx-evidence-scroll">
        {coach && <Coach step={coachStep}>{coach}</Coach>}

        <section class="dx-evidence-step">
          <header class="dx-step-head">
            <span class="dx-step-no mono">01</span>
            <div>
              <h2 class="display">容疑者を選ぶ</h2>
              <p>
                {assist
                  ? '消去済みの人物は選べない。残った候補から1人。'
                  : '手がかりとの矛盾は、告発してから明らかになる。候補から1人。'}
              </p>
            </div>
          </header>
          <div class="dx-pick-list">
            {suspects.map((suspect) => {
              const alive = remaining.some((s) => s.id === suspect.id);
              const selected = selectedSuspect?.id === suspect.id;
              return (
                <button
                  key={suspect.id}
                  class={`dx-pick ${selected ? 'is-selected' : ''} ${alive ? '' : 'is-out'}`}
                  aria-pressed={selected}
                  disabled={!alive}
                  onClick={() => chooseSuspect(suspect.id)}
                >
                  <span class={`dx-radio ${selected ? 'is-on' : ''}`} aria-hidden="true">
                    {selected ? <IconCheck /> : null}
                  </span>
                  <span class="dx-pick-main">
                    <span class="dx-pick-name">
                      <b>{suspect.nameJa}</b>
                      <small class="mono">
                        {suspect.height}cm / {suspect.foot}足
                      </small>
                    </span>
                    <span class="dx-pick-meta">
                      {suspect.clubCount}クラブ ・ {suspect.overseas ? '海外○' : '海外×'} ・ 最終季{' '}
                      {tierText(suspect.lastTier)} ・ MVP {suspect.mvpCount}
                    </span>
                  </span>
                  {!alive && <span class="dx-out-tag mono">OUT</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section class="dx-evidence-step">
          <header class="dx-step-head">
            <span class="dx-step-no mono">02</span>
            <div>
              <h2 class="display">証拠を2枚選ぶ</h2>
              <p>購入済みの手がかりから、2枚だけ。</p>
            </div>
          </header>
          <div class="dx-evidence-grid">
            {purchased.map((clue) => {
              const order = evidenceIds.indexOf(clue.id);
              const on = order >= 0;
              return (
                <button
                  key={clue.id}
                  class={`dx-evidence-card ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => chooseEvidence(clue)}
                >
                  <span class="dx-evidence-check mono">{on ? order + 1 : '+'}</span>
                  <span class="dx-evidence-title">{clue.title}</span>
                  <span class="dx-evidence-answer">→ {clue.answerText}</span>
                  <span class="dx-evidence-cost mono">{clue.cost}pt</span>
                </button>
              );
            })}
          </div>
          {purchased.length === 0 && (
            <p class="dx-empty-line">手がかりを買うと、ここに証拠候補が並ぶ。</p>
          )}
          {limitNote && <p class="dx-error">証拠は2枚まで。1枚外してから選び直そう。</p>}
        </section>

        <section
          class={`dx-eval ${
            assist && evaluation.tight
              ? 'is-tight'
              : assist && evaluation.pairValid
                ? 'is-valid'
                : ''
          }`}
        >
          <span class="kicker">EVIDENCE PREVIEW</span>
          {evidenceIds.length < 2 ? (
            <p>
              あと<b>{2 - evidenceIds.length}枚</b>
              {assist ? '選ぶと、残る人数を確認できる。' : '選ぶと、告発できる。'}
            </p>
          ) : assist ? (
            <>
              <p class="dx-eval-count">
                この2枚で残る: <b>{evaluation.remainingIds.length}人</b>
              </p>
              <p class="dx-eval-message">{evaluation.message}</p>
              {evaluation.remainingIds.length > 0 && (
                <p class="dx-eval-names">
                  {evaluation.remainingIds
                    .map((id) => bundle.suspects.find((s) => s.id === id)?.nameJa)
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              )}
            </>
          ) : (
            <p>判定は告発後に表示される。自分の推理を信じよう。</p>
          )}
        </section>
      </div>

      <div class="actions dx-actions">
        {assist && evaluation.validSelection && !evaluation.pairValid && (
          <p class="dx-warning">この2枚では1人に絞れない。それでも告発できる。</p>
        )}
        <button class="btn btn-primary" disabled={!canAccuse} onClick={() => setConfirming(true)}>
          この証拠で告発する <IconChevron />
        </button>
      </div>

      {confirming && selectedSuspect && (
        <Modal
          kicker="FINAL ACCUSATION"
          title={`${selectedSuspect.nameJa}を告発する`}
          onClose={() => setConfirming(false)}
          footer={
            <div class="dx-btn-row">
              <button class="btn btn-primary" onClick={accuse}>
                告発する
              </button>
              <button class="btn btn-ghost" onClick={() => setConfirming(false)}>
                戻る
              </button>
            </div>
          }
        >
          <p class="dx-note">証拠:</p>
          <ul class="dx-confirm-evidence">
            {evidenceIds.map((id) => {
              const clue = caseFile.clues.find((c) => c.id === id);
              return clue ? (
                <li key={id}>
                  <b>{clue.title}</b>
                  <span>→ {clue.answerText}</span>
                </li>
              ) : null;
            })}
          </ul>
          <p class="dx-confirm-copy">この2枚で、ただ1人に絞れると証明する。</p>
        </Modal>
      )}
    </div>
  );
}
