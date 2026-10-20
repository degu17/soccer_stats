import { useEffect } from 'preact/hooks';
import type { CaseBundle, CaseFile, ScoreResult } from '../../data/caseTypes';
import type { CaseProgress } from '../../lib/save';
import { shareOrCopy } from '../../lib/share';
import { sfx } from '../../lib/sound';
import { rankForScore, RANK_TITLE } from '../../lib/caseEngine';
import { TopBar, RankStamp, useCountUp, useTimeline } from '../../components/ui';
import { IconArrow, IconRetry, IconShare } from '../../components/icons';

export function CaseResult({
  bundle,
  nextCase,
  progress,
  score,
  best,
  isBest,
  firstClear,
  onRetry,
  onNext,
  onBoard,
  toast,
}: {
  bundle: CaseBundle;
  nextCase?: CaseFile;
  progress: CaseProgress;
  score: ScoreResult;
  best: number;
  isBest: boolean;
  firstClear: boolean;
  onRetry: () => void;
  onNext: () => void;
  onBoard: () => void;
  toast: (message: string) => void;
}) {
  const { caseFile } = bundle;
  const rank = rankForScore(score.total);
  const stage = useTimeline([280, 850, 1500]);
  const shown = useCountUp(score.total, stage >= 1, 900, sfx.count);
  const evidence = score.evidenceScore === 30 ? 'タイト' : score.evidenceScore === 20 ? '有効' : score.evidenceScore === 10 ? '弱い' : '不成立';
  const elapsedSec = Math.max(
    1,
    Math.round((new Date(progress.updatedAt).getTime() - new Date(progress.startedAt).getTime()) / 1000),
  );
  const elapsed = `${Math.floor(elapsedSec / 60)}分${String(elapsedSec % 60).padStart(2, '0')}秒`;
  const usedTitles = caseFile.clues
    .filter((clue) => progress.purchasedClueIds.includes(clue.id))
    .map((clue) => clue.title);

  useEffect(() => {
    if (stage === 1) sfx.stamp();
    if (stage === 2) sfx.good();
  }, [stage]);

  const share = () => {
    const file = caseFile.tutorial ? 'TUTORIAL' : `FILE ${String(caseFile.number).padStart(3, '0')}`;
    const text = [
      `🔎 スタッツ探偵 ${file}「${caseFile.title}」`,
      `${rank} ${RANK_TITLE[rank]} ${score.total}点 / 手がかり${progress.purchasedClueIds.length}枚`,
      `${evidence}な証拠で決着。あなたは何枚で解ける？`,
      '#スタッツ探偵',
    ].join('\n');
    void shareOrCopy(text, toast);
  };

  return (
    <div class="screen dx-screen dx-result">
      <TopBar
        onBack={onBoard}
        kicker={caseFile.tutorial ? 'TUTORIAL REPORT' : `FILE ${String(caseFile.number).padStart(3, '0')} / REPORT`}
        title="捜査報告書"
      />
      <div class="grow dx-scroll dx-result-scroll">
        <header class={`dx-result-hero ${stage >= 1 ? 'on' : ''}`}>
          <div class="dx-result-stamp">
            {stage >= 1 && <RankStamp rank={rank} size={92} animate />}
            <span class="dx-result-rank-title">{RANK_TITLE[rank]}</span>
          </div>
          <div class="dx-result-total">
            <span class="kicker">TOTAL SCORE</span>
            <b class="num">
              {shown}
              <small class="mono">/100</small>
            </b>
            <p class="dx-result-file">{caseFile.title}</p>
          </div>
        </header>

        <section class={`dx-receipt ${stage >= 2 ? 'on' : ''}`}>
          <div class="dx-receipt-row">
            <span>正解</span>
            <i class="dx-leader" />
            <b class="mono">+{score.correctScore}</b>
          </div>
          <div class="dx-receipt-row">
            <span>証拠（2枚・{evidence}）</span>
            <i class="dx-leader" />
            <b class="mono">+{score.evidenceScore}</b>
          </div>
          <div class="dx-receipt-row">
            <span>効率（残り{score.tokensRemaining}/{caseFile.scoring.tokens}pt）</span>
            <i class="dx-leader" />
            <b class="mono">+{score.efficiencyScore}</b>
          </div>
          <div class="dx-receipt-row">
            <span>誤告発</span>
            <i class="dx-leader" />
            <b class="mono">−{score.wrongPenalty}</b>
          </div>
          <div class="dx-receipt-total">
            <span>合計</span>
            <b class="num">{score.total}</b>
            <span class="mono">/100</span>
          </div>
        </section>

        <section class={`dx-result-meta ${stage >= 2 ? 'on' : ''}`}>
          <div>
            <span class="label">使用手がかり</span>
            <b>{progress.purchasedClueIds.length}枚</b>
            <small>{usedTitles.join(' / ') || 'なし'}</small>
          </div>
          <div>
            <span class="label">誤告発</span>
            <b>{progress.wrongAccusations}回</b>
            <small>{progress.wrongAccusations ? `−${score.wrongPenalty}点` : 'パーフェクト'}</small>
          </div>
          <div>
            <span class="label">捜査時間</span>
            <b>{elapsed}</b>
            <small>事件開始から告発まで</small>
          </div>
          <div>
            <span class="label">自己ベスト</span>
            <b>
              {rankForScore(best)} / {best}
            </b>
            <small>{firstClear ? '初回解決' : isBest ? '自己ベスト更新' : '記録を更新しよう'}</small>
          </div>
        </section>

        {isBest && <span class="dx-new-best mono rise">NEW BEST</span>}

        <p class="dx-next-goal">
          {rank === 'S'
            ? 'この調子。次の事件でも、2枚の交点を探そう。'
            : rank === 'A'
              ? 'あと1枚減らすとS。同じ群の手がかりに注意。'
              : rank === 'B'
                ? '証拠2枚で1人に絞れる組を探そう。'
                : 'まずは安い手がかりを2枚。証拠の組み合わせを確認。'}
        </p>

        <div class="dx-result-actions">
          <button class="btn btn-primary" disabled={stage < 2} onClick={onNext}>
            {nextCase ? (
              <>
                次の事件へ{' '}
                <small class="dx-btn-sub">
                  {nextCase.tutorial ? 'チュートリアル' : `FILE ${String(nextCase.number).padStart(3, '0')}`}
                </small>
              </>
            ) : (
              <>
                事件ファイルへ <IconArrow />
              </>
            )}
          </button>
          <div class="dx-result-subactions">
            <button class="btn btn-ghost" onClick={onRetry}>
              <IconRetry /> もう一度
            </button>
            <button class="btn btn-ghost" onClick={share}>
              <IconShare /> シェア
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
