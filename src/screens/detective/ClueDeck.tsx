import { useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { CaseBundle, Clue } from '../../data/caseTypes';
import type { CaseProgress } from '../../lib/save';
import { initialCandidates, remainingForClue, tokensUsed } from '../../lib/caseEngine';
import { TopBar } from '../../components/ui';
import { IconArrow, IconCheck } from '../../components/icons';
import { sfx } from '../../lib/sound';
import { BudgetMeter, Coach, Modal } from './CaseBits';

export function ClueDeck({
  bundle,
  progress,
  assist,
  onBack,
  onBuy,
  coach,
  coachStep,
  guideClueId,
}: {
  bundle: CaseBundle;
  progress: CaseProgress;
  assist: boolean;
  onBack: () => void;
  onBuy: (clueId: string) => boolean;
  coach?: ComponentChildren;
  coachStep?: string;
  guideClueId?: string;
}) {
  const { caseFile } = bundle;
  const [confirm, setConfirm] = useState<Clue | null>(null);
  const [result, setResult] = useState<Clue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const used = tokensUsed(bundle, progress.purchasedClueIds);
  const remaining = caseFile.scoring.tokens - used;
  const initialCount = useMemo(() => initialCandidates(bundle).length, [bundle]);

  const openBuy = (clue: Clue) => {
    if (progress.purchasedClueIds.includes(clue.id)) return;
    if (clue.cost > remaining) {
      sfx.bad();
      setError(`残り${remaining}pt。この手がかりは${clue.cost}ptです。`);
      return;
    }
    sfx.tap();
    setError(null);
    setConfirm(clue);
  };

  const buy = () => {
    if (!confirm) return;
    const ok = onBuy(confirm.id);
    if (!ok) {
      setError('購入できませんでした。残りポイントを確認してください。');
      return;
    }
    sfx.stamp();
    setConfirm(null);
    setResult(confirm);
  };

  const resultMatches = result ? remainingForClue(bundle, result.id) : [];

  return (
    <div class="screen dx-screen dx-deck">
      <TopBar
        onBack={onBack}
        kicker="CLUE DECK"
        title="手がかりデッキ"
        right={<BudgetMeter used={used} total={caseFile.scoring.tokens} />}
      />
      <div class="grow dx-scroll dx-deck-scroll">
        <header class="dx-deck-head">
          <p class="dx-deck-lead">
            {caseFile.clues.length}枚から選ぶ。全部は買えない。<b>残り{remaining}pt</b>で、どこまで絞るか。
          </p>
          <p class="dx-note">
            {assist
              ? '手がかりは「容疑者を消す条件」。買うと答えと該当者が表示され、捜査メモに反映される。'
              : '手がかりは「容疑者を消す条件」。買うと答えが表示される。該当者は自分で容疑者カードと照合する。'}
          </p>
        </header>

        {coach && <Coach step={coachStep}>{coach}</Coach>}

        <div class="dx-clue-deck">
          {caseFile.clues.map((clue, i) => {
            const paid = progress.purchasedClueIds.includes(clue.id);
            const poor = !paid && clue.cost > remaining;
            const guide = guideClueId === clue.id;
            return (
              <article
                key={clue.id}
                class={`dx-clue ${paid ? 'is-paid' : ''} ${poor ? 'is-poor' : ''} ${guide ? 'is-guide' : ''}`}
              >
                <header class="dx-clue-head">
                  <span class="dx-clue-no mono">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h2>{clue.title}</h2>
                    <p class="mono">{clue.question}</p>
                  </div>
                  <span class="dx-clue-cost mono">{clue.cost}pt</span>
                </header>
                <p class="dx-clue-reveal">{clue.revealText}</p>
                {paid ? (
                  <div class="dx-clue-answer">
                    <span class="dx-paid-stamp mono">PAID</span>
                    <p>
                      答え: <b>{clue.answerText}</b>
                    </p>
                    <p class="dx-clue-matches">
                      {assist
                        ? `該当: ${remainingForClue(bundle, clue.id).map((s) => s.nameJa).join(' / ')}`
                        : '該当者: 容疑者カードと自分で照合'}
                    </p>
                    <p class="dx-clue-eliminated">
                      {assist
                        ? `${initialCount - remainingForClue(bundle, clue.id).length}人を消去`
                        : 'メモは自動更新されない'}
                    </p>
                    <span class="dx-clue-check" aria-hidden="true">
                      <IconCheck />
                    </span>
                  </div>
                ) : (
                  <button
                    class={`dx-buy ${guide ? 'is-guide' : ''}`}
                    disabled={poor}
                    onClick={() => openBuy(clue)}
                  >
                    {poor ? `残り${remaining}ptでは買えない` : guide ? 'この手がかりを買う（おすすめ）' : 'この手がかりを買う'}
                    <span class="mono">{clue.cost}pt</span>
                  </button>
                )}
              </article>
            );
          })}
        </div>
        <p class="dx-note dx-deck-foot">
          購入済み: {progress.purchasedClueIds.length ? caseFile.clues.filter((c) => progress.purchasedClueIds.includes(c.id)).map((c) => c.title).join(' / ') : 'なし'}
        </p>
      </div>

      <div class="actions dx-actions">
        <button class="btn btn-ghost" onClick={onBack}>
          捜査に戻る <IconArrow />
        </button>
      </div>

      {confirm && (
        <Modal
          kicker="BUY CLUE"
          title={confirm.title}
          onClose={() => setConfirm(null)}
          footer={
            <div class="dx-btn-row">
              <button class="btn btn-primary" onClick={buy}>
                買う <span class="mono">{confirm.cost}pt</span>
              </button>
              <button class="btn btn-ghost" onClick={() => setConfirm(null)}>
                やめる
              </button>
            </div>
          }
        >
          <p class="dx-modal-q">{confirm.question}</p>
          <p class="dx-note">
            {assist
              ? '購入すると答えと該当する容疑者が表示され、捜査メモに反映されます。'
              : '購入すると答えが表示されます。容疑者カードとの照合は自分で行います。'}
            残り{remaining}pt。
          </p>
          {error && <p class="dx-error">{error}</p>}
        </Modal>
      )}

      {result && (
        <Modal
          kicker={`PAID / ${result.cost}pt`}
          title={result.title}
          onClose={() => setResult(null)}
          footer={
            <div class="dx-btn-row">
              <button class="btn btn-primary" onClick={onBack}>
                捜査に戻る <IconArrow />
              </button>
              <button class="btn btn-ghost" onClick={() => setResult(null)}>
                続けて買う
              </button>
            </div>
          }
        >
          <div class="dx-buy-result">
            <span class="dx-paid-stamp mono">PAID</span>
            <p class="dx-buy-answer">
              答え: <b>{result.answerText}</b>
            </p>
            <p class="dx-buy-matches">
              該当: {assist ? resultMatches.map((s) => s.nameJa).join(' / ') : '自分で容疑者カードと照合'}
            </p>
            <p class="dx-buy-eliminated">→ {initialCount - resultMatches.length}人を消去</p>
            <p class="dx-buy-note">
              {assist
                ? `「${result.revealText}」手がかりが増えたら、容疑者タブで残りを確認しよう。`
                : `「${result.revealText}」手がかりが増えたら、容疑者カードと自分で照合しよう。`}
            </p>
          </div>
          {assist && resultMatches.length === 1 && (
            <p class="dx-note">この1枚だけで正解が決まる。だが、証拠としては「補強」扱いになる。</p>
          )}
        </Modal>
      )}

      {error && !confirm && (
        <div class="dx-inline-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
