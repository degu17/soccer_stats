import type { ComponentChildren } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import type { CaseBundle, SuspectProfile } from '../../data/caseTypes';
import type { CaseProgress, SuspectMark } from '../../lib/save';
import {
  initialCandidates,
  matchesEffect,
  remainingForClue,
  tokensUsed,
} from '../../lib/caseEngine';
import { PhotoSlot, PrintPhoto } from '../../components/ui';
import { IconArrow, IconChevron } from '../../components/icons';
import { sfx } from '../../lib/sound';
import {
  BudgetMeter,
  ClueSummary,
  Coach,
  GameBar,
  MarkBadge,
  Modal,
  SuspectRow,
  tierText,
} from './CaseBits';

export function Investigate({
  bundle,
  progress,
  assist,
  onPause,
  onDeck,
  onEvidence,
  onToggleMark,
  coach,
  coachStep,
}: {
  bundle: CaseBundle;
  progress: CaseProgress;
  assist: boolean;
  onPause: () => void;
  onDeck: () => void;
  onEvidence: () => void;
  onToggleMark: (id: string) => void;
  coach?: ComponentChildren;
  coachStep?: string;
}) {
  const { caseFile } = bundle;
  const [tab, setTab] = useState<'suspects' | 'clues'>('suspects');
  const [detail, setDetail] = useState<SuspectProfile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initial = useMemo(() => initialCandidates(bundle), [bundle]);
  const used = tokensUsed(bundle, progress.purchasedClueIds);
  const purchased = caseFile.clues.filter((clue) => progress.purchasedClueIds.includes(clue.id));
  const remaining = initial.filter(
    (suspect) =>
      !progress.accusedIds.includes(suspect.id) &&
      purchased.every((clue) => matchesEffect(clue.effect, suspect)),
  ).length;

  const reasonFor = (suspect: SuspectProfile): string | undefined => {
    const free = caseFile.freeClues.find((f) => !matchesEffect(f.effect, suspect));
    if (free) return free.text;
    if (assist) {
      const contradicting = purchased.find((clue) => !matchesEffect(clue.effect, suspect));
      if (contradicting) return `${contradicting.title}は「${contradicting.answerText}」`;
    }
    if (progress.accusedIds.includes(suspect.id)) return '誤告発で除外';
    if (progress.marks[suspect.id] === 'eliminated') return 'メモで除外';
    return undefined;
  };

  const switchTab = (next: 'suspects' | 'clues') => {
    sfx.tap();
    setTab(next);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
  };

  const detailReason = detail ? reasonFor(detail) : undefined;

  return (
    <div class="screen dx-screen dx-investigate">
      <GameBar
        file={caseFile.tutorial ? 'TUTORIAL' : `FILE ${String(caseFile.number).padStart(3, '0')}`}
        title={caseFile.title}
        onPause={onPause}
        right={
          <div class="dx-game-meta">
            {assist ? (
              <span class="dx-remain" aria-live="polite">
                残り <b>{remaining}</b>人
              </span>
            ) : (
              <span class="dx-remain mono">
                購入済み <b>{purchased.length}</b>/{caseFile.clues.length}
              </span>
            )}
            <BudgetMeter used={used} total={caseFile.scoring.tokens} />
          </div>
        }
      />

      {coach && <Coach step={coachStep}>{coach}</Coach>}

      <div class="dx-tabs" role="tablist" aria-label="捜査メモ">
        <button
          class={`dx-tab ${tab === 'suspects' ? 'is-on' : ''}`}
          role="tab"
          aria-selected={tab === 'suspects'}
          onClick={() => switchTab('suspects')}
        >
          容疑者 <b>{caseFile.suspectIds.length}</b>
        </button>
        <button
          class={`dx-tab ${tab === 'clues' ? 'is-on' : ''}`}
          role="tab"
          aria-selected={tab === 'clues'}
          onClick={() => switchTab('clues')}
        >
          手がかり <b>{purchased.length}</b>
        </button>
      </div>

      <div class="grow dx-scroll dx-invest-scroll" ref={scrollRef}>
        {tab === 'suspects' ? (
          <>
            <div class="dx-list-head mono">
              <span>容疑者</span>
              <span>数字で消す</span>
              <span>メモ</span>
            </div>
            <div class="dx-suspect-list">
              {caseFile.suspectIds.map((id) => {
                const suspect = bundle.suspects.find((s) => s.id === id);
                if (!suspect) return null;
                const mark: SuspectMark = progress.marks[id] ?? 'unknown';
                return (
                  <SuspectRow
                    key={id}
                    suspect={suspect}
                    mark={mark}
                    reason={reasonFor(suspect)}
                    onToggle={() => onToggleMark(id)}
                    onOpen={() => {
                      sfx.tap();
                      setDetail(suspect);
                    }}
                  />
                );
              })}
            </div>
            <p class="dx-note dx-memo-note">
              ○ = 候補、× = 消去、？ = 未確認。左のスタンプをタップするとメモを切り替えられる。
            </p>
          </>
        ) : purchased.length ? (
          <div class="dx-clue-list">
            {purchased.map((clue) => (
              <ClueSummary
                key={clue.id}
                clue={clue}
                matches={remainingForClue(bundle, clue.id)}
                showMatches={assist}
              />
            ))}
            <button class="btn btn-ghost dx-inline-btn" onClick={onDeck}>
              手がかりを追加する <IconArrow />
            </button>
          </div>
        ) : (
          <div class="dx-empty">
            <span class="dx-empty-mark">?</span>
            <h2 class="display">まだ手がかりがない</h2>
            <p>{caseFile.scoring.tokens}ptの予算から、手がかりを買って容疑者を消していこう。</p>
            <button class="btn btn-primary" onClick={onDeck}>
              手がかりデッキを開く <IconArrow />
            </button>
          </div>
        )}
      </div>

      <div class="actions dx-actions dx-invest-actions">
        <button class="btn btn-primary" onClick={onDeck}>
          <span>
            手がかりを選ぶ
            <small class="dx-btn-sub">
              {purchased.length}/{caseFile.clues.length}枚 ・ 残り{caseFile.scoring.tokens - used}pt
            </small>
          </span>
          <IconArrow />
        </button>
        <button
          class="btn btn-ghost"
          disabled={purchased.length < caseFile.scoring.evidenceCount}
          onClick={onEvidence}
        >
          <span>
            告発する
            <small class="dx-btn-sub">
              {purchased.length < caseFile.scoring.evidenceCount
                ? `証拠を${caseFile.scoring.evidenceCount}枚買うと解放`
                : '容疑者1人＋証拠2枚'}
            </small>
          </span>
          <IconChevron />
        </button>
      </div>

      {detail && (
        <Modal
          kicker={caseFile.tutorial ? 'SUSPECT' : `SUSPECT / ${tierText(detail.lastTier)}`}
          title={detail.nameJa}
          onClose={() => setDetail(null)}
          footer={
            <div class="dx-btn-row">
              <button
                class={`btn ${progress.marks[detail.id] === 'eliminated' ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => {
                  onToggleMark(detail.id);
                  setDetail(null);
                }}
              >
                {progress.marks[detail.id] === 'eliminated' ? '候補に戻す' : '容疑者から消す'}
              </button>
              <button class="btn btn-ghost" onClick={() => setDetail(null)}>
                閉じる
              </button>
            </div>
          }
        >
          <div class="dx-detail-head">
            {detail.photo ? (
              <PrintPhoto src={detail.photo} alt="" w={86} h={104} color />
            ) : (
              <PhotoSlot size={86} />
            )}
            <div>
              <p class="mono dx-detail-meta">
                {detail.position} / {detail.nation} / {detail.birthYear}年生
              </p>
              <p class="dx-detail-height">
                {detail.height}cm / {detail.foot}足 / {detail.clubCount}クラブ
              </p>
              <MarkBadge mark={progress.marks[detail.id] ?? 'unknown'} name={detail.nameJa} />
            </div>
          </div>
          {detailReason && <p class="dx-detail-reason">× {detailReason}</p>}

          <div class="dx-detail-stats">
            <div>
              <small>通算</small>
              <b class="mono">{detail.careerApps}</b>
              <span>試合</span>
            </div>
            <div>
              <small>通算</small>
              <b class="mono">{detail.careerGoals}</b>
              <span>得点</span>
            </div>
            <div>
              <small>代表</small>
              <b class="mono">{detail.caps}</b>
              <span>試合</span>
            </div>
            <div>
              <small>J1優勝</small>
              <b class="mono">{detail.j1Titles}</b>
              <span>回</span>
            </div>
          </div>

          <section class="dx-detail-section">
            <h3 class="kicker">CLUBS</h3>
            <ul class="dx-club-list">
              {detail.clubs.map((club, i) => (
                <li key={`${club.name}-${i}`}>
                  <span class="mono">
                    {club.from}–{club.to}
                  </span>
                  <b>{club.nameJa}</b>
                  <small>
                    {club.country}
                    {club.loan ? ' / レンタル' : ''}
                  </small>
                </li>
              ))}
            </ul>
          </section>

          <section class="dx-detail-section">
            <h3 class="kicker">HONOURS</h3>
            <ul class="dx-honor-list">
              {detail.honors.map((honor) => (
                <li key={honor}>{honor}</li>
              ))}
            </ul>
            <p class="dx-detail-mvp">
              MVP {detail.mvpCount}回
              {detail.mvpAges.length ? `（${detail.mvpAges.join('歳・')}歳）` : ''}
            </p>
          </section>

          <section class="dx-detail-section">
            <h3 class="kicker">SOURCE</h3>
            <ul class="dx-source-list">
              {detail.sources.map((source) => (
                <li key={source.label}>
                  {source.url.startsWith('http') ? (
                    <a href={source.url} target="_blank" rel="noopener">
                      {source.label}
                    </a>
                  ) : (
                    source.label
                  )}
                </li>
              ))}
            </ul>
          </section>
        </Modal>
      )}
    </div>
  );
}
