import { useMemo, useRef, useState } from 'preact/hooks';
import type { CaseBundle, Clue } from '../data/caseTypes';
import { getCaseBundle, nextCaseAfter, suspectById } from '../data/cases';
import {
  contradictionFor,
  evaluateEvidence,
  matchesEffect,
  scoreCase,
  tokensUsed,
} from '../lib/caseEngine';
import {
  marksAfterPurchase,
  newCaseProgress,
  type CaseProgress,
  type SuspectMark,
} from '../lib/save';
import { useApp } from '../state';
import { sfx } from '../lib/sound';
import { TopBar } from '../components/ui';
import { CaseIntro } from './detective/CaseIntro';
import { Investigate } from './detective/Investigate';
import { ClueDeck } from './detective/ClueDeck';
import { Evidence } from './detective/Evidence';
import { CaseReveal } from './detective/Reveal';
import { CaseResult } from './detective/Result';
import { Modal } from './detective/CaseBits';

type View = 'intro' | 'investigate' | 'deck' | 'evidence' | 'reveal' | 'result';

export function Case({ id }: { id: string }) {
  const bundle = getCaseBundle(id);
  if (!bundle) {
    return (
      <div class="screen">
        <TopBar kicker="CASE FILE" title="事件が見つかりません" />
        <p class="note">事件ファイルが読み込めませんでした。</p>
      </div>
    );
  }
  return <CaseGame key={bundle.caseFile.id} bundle={bundle} />;
}

function CaseGame({ bundle }: { bundle: CaseBundle }) {
  const app = useApp();
  const { caseFile } = bundle;
  const saved = app.save.progress[caseFile.id];
  const [progress, setProgress] = useState<CaseProgress>(() => saved ?? newCaseProgress(bundle));
  const [view, setView] = useState<View>(() => {
    if (!saved) return 'intro';
    if (saved.phase === 'evidence') return 'evidence';
    if (saved.phase === 'reveal') return 'reveal';
    if (saved.phase === 'result') return 'result';
    if (saved.phase === 'investigating') return 'investigate';
    return 'intro';
  });
  const [paused, setPaused] = useState(false);
  const [wrong, setWrong] = useState<{ suspectId: string; clue: Clue | null } | null>(null);
  const [outcome, setOutcome] = useState<{ isBest: boolean; firstClear: boolean } | null>(null);
  const recordedRef = useRef(Boolean(saved?.resultRecorded));

  const purchased = useMemo(
    () => caseFile.clues.filter((clue) => progress.purchasedClueIds.includes(clue.id)),
    [caseFile.clues, progress.purchasedClueIds],
  );
  const used = tokensUsed(bundle, progress.purchasedClueIds);
  const evaluation = useMemo(
    () => evaluateEvidence(bundle, progress.purchasedClueIds, progress.selectedEvidenceIds),
    [bundle, progress.purchasedClueIds, progress.selectedEvidenceIds],
  );
  const score = useMemo(
    () =>
      scoreCase({
        correct: true,
        evidenceScore: evaluation.evidenceScore,
        tokensTotal: caseFile.scoring.tokens,
        tokensUsed: used,
        wrongAccusations: progress.wrongAccusations,
        scoring: caseFile.scoring,
      }),
    [caseFile.scoring, evaluation.evidenceScore, progress.wrongAccusations, used],
  );
  const savedResult = app.save.results[caseFile.id];
  const best = savedResult?.bestScore ?? score.total;
  const next = nextCaseAfter(caseFile.id);

  const commit = (nextProgress: CaseProgress) => {
    const stamped = { ...nextProgress, updatedAt: new Date().toISOString() };
    setProgress(stamped);
    app.saveProgress(stamped);
  };

  const start = () => {
    sfx.stamp();
    commit({ ...progress, phase: 'investigating' });
    setView('investigate');
  };

  const toggleMark = (id: string) => {
    const suspect = caseFile.suspectIds.includes(id)
      ? bundle.suspects.find((s) => s.id === id)
      : undefined;
    if (!suspect) return;
    const current = progress.marks[id] ?? 'unknown';
    const lockedByFree = caseFile.freeClues.some((f) => !matchesEffect(f.effect, suspect));
    const lockedByClue = purchased.some((clue) => !matchesEffect(clue.effect, suspect));
    if (current === 'eliminated' && (lockedByFree || lockedByClue)) {
      app.toast('この容疑者は手がかりと矛盾しています');
      return;
    }
    sfx.tap();
    const marks: Record<string, SuspectMark> = {
      ...progress.marks,
      [id]: current === 'eliminated' ? 'possible' : 'eliminated',
    };
    commit({ ...progress, marks });
  };

  const buyClue = (clueId: string): boolean => {
    const clue = caseFile.clues.find((c) => c.id === clueId);
    if (!clue) return false;
    if (progress.purchasedClueIds.includes(clueId)) return false;
    if (used + clue.cost > caseFile.scoring.tokens) return false;
    const marks = app.save.settings.assist
      ? marksAfterPurchase(progress, caseFile, bundle, clueId)
      : progress.marks;
    commit({
      ...progress,
      purchasedClueIds: [...progress.purchasedClueIds, clueId],
      marks,
      phase: 'investigating',
    });
    return true;
  };

  const updateSelection = (suspectId: string | null, evidenceIds: string[]) => {
    commit({
      ...progress,
      phase: 'evidence',
      selectedSuspectId: suspectId,
      selectedEvidenceIds: evidenceIds.slice(0, caseFile.scoring.evidenceCount),
    });
  };

  const accuse = (suspectId: string, evidenceIds: string[]) => {
    if (recordedRef.current) return;
    if (suspectId !== caseFile.answerId) {
      const clue = contradictionFor(bundle, suspectId, progress.purchasedClueIds);
      const marks: Record<string, SuspectMark> = {
        ...progress.marks,
        [suspectId]: 'eliminated',
      };
      commit({
        ...progress,
        phase: 'investigating',
        marks,
        accusedIds: [...progress.accusedIds, suspectId],
        wrongAccusations: progress.wrongAccusations + 1,
        selectedEvidenceIds: [],
        selectedSuspectId: null,
      });
      setView('investigate');
      setWrong({ suspectId, clue });
      sfx.bad();
      return;
    }

    recordedRef.current = true;
    const finalEvaluation = evaluateEvidence(bundle, progress.purchasedClueIds, evidenceIds);
    const finalScore = scoreCase({
      correct: true,
      evidenceScore: finalEvaluation.evidenceScore,
      tokensTotal: caseFile.scoring.tokens,
      tokensUsed: used,
      wrongAccusations: progress.wrongAccusations,
      scoring: caseFile.scoring,
    });
    const finalProgress: CaseProgress = {
      ...progress,
      phase: 'reveal',
      selectedEvidenceIds: evidenceIds,
      selectedSuspectId: suspectId,
      resultRecorded: true,
    };
    commit(finalProgress);
    const result = app.recordResult({
      caseId: caseFile.id,
      answerId: caseFile.answerId,
      score: finalScore,
      tokensUsed: used,
      wrongAccusations: progress.wrongAccusations,
    });
    setOutcome({ isBest: result.isBest, firstClear: result.firstClear });
    app.unlockTerms(caseFile.reveal.lesson.termIds);
    if (caseFile.tutorial) app.markTutorialSeen();
    sfx.reveal();
    setView('reveal');
  };

  const goResult = () => {
    sfx.tap();
    commit({ ...progress, phase: 'result' });
    setView('result');
  };

  const retry = () => {
    sfx.whoosh();
    const fresh = newCaseProgress(bundle);
    fresh.phase = 'investigating';
    recordedRef.current = false;
    setOutcome(null);
    setWrong(null);
    setPaused(false);
    commit(fresh);
    setView('investigate');
  };

  const exitToBoard = () => {
    setPaused(false);
    app.go({ name: 'board' });
  };

  const coach = tutorialCoach(bundle, progress, view);
  const guideClueId = tutorialGuideClue(bundle, progress);

  if (view === 'intro') {
    return (
      <CaseIntro
        bundle={bundle}
        progress={progress}
        onBack={() => app.go({ name: 'board' })}
        onStart={start}
      />
    );
  }

  if (view === 'investigate') {
    return (
      <>
        <Investigate
          bundle={bundle}
          progress={progress}
          assist={app.save.settings.assist}
          onPause={() => setPaused(true)}
          onDeck={() => {
            sfx.tap();
            setView('deck');
          }}
          onEvidence={() => {
            sfx.tap();
            commit({ ...progress, phase: 'evidence' });
            setView('evidence');
          }}
          onToggleMark={toggleMark}
          coach={coach}
          coachStep={coach ? '01' : undefined}
        />
        {paused && (
          <Modal
            kicker="PAUSE"
            title="一時停止"
            onClose={() => setPaused(false)}
            footer={
              <button class="btn btn-primary" onClick={() => setPaused(false)}>
                捜査に戻る
              </button>
            }
          >
            <p class="dx-note">ここまでの捜査は自動保存されています。閉じても続きから再開できます。</p>
            <div class="dx-pause-menu">
              <button
                class="btn btn-ghost"
                onClick={() => app.go({ name: 'glossary' })}
              >
                用語ノート
              </button>
              <button class="btn btn-ghost" onClick={exitToBoard}>
                事件ファイルへ
              </button>
            </div>
          </Modal>
        )}
        {wrong && (
          <WrongAccusation
            bundle={bundle}
            suspectId={wrong.suspectId}
            clue={wrong.clue}
            onClose={() => setWrong(null)}
          />
        )}
      </>
    );
  }

  if (view === 'deck') {
    return (
      <ClueDeck
        bundle={bundle}
        progress={progress}
        assist={app.save.settings.assist}
        onBack={() => setView('investigate')}
        onBuy={buyClue}
        coach={coach}
        coachStep={coach ? '02' : undefined}
        guideClueId={guideClueId}
      />
    );
  }

  if (view === 'evidence') {
    return (
      <Evidence
        bundle={bundle}
        progress={progress}
        assist={app.save.settings.assist}
        onBack={() => {
          sfx.tap();
          commit({ ...progress, phase: 'investigating' });
          setView('investigate');
        }}
        onSelection={updateSelection}
        onAccuse={accuse}
        coach={coach}
        coachStep={coach ? '03' : undefined}
      />
    );
  }

  if (view === 'reveal') {
    return (
      <CaseReveal
        bundle={bundle}
        isBest={Boolean(outcome?.isBest)}
        onResult={goResult}
        onExit={exitToBoard}
      />
    );
  }

  return (
    <CaseResult
      bundle={bundle}
      nextCase={next}
      progress={progress}
      score={score}
      best={best}
      isBest={Boolean(outcome?.isBest)}
      firstClear={Boolean(outcome?.firstClear ?? savedResult?.plays === 1)}
      onRetry={retry}
      onNext={() => (next ? app.go({ name: 'case', id: next.id }) : app.go({ name: 'board' }))}
      onBoard={exitToBoard}
      toast={app.toast}
    />
  );
}

function WrongAccusation({
  bundle,
  suspectId,
  clue,
  onClose,
}: {
  bundle: CaseBundle;
  suspectId: string;
  clue: Clue | null;
  onClose: () => void;
}) {
  const suspect = suspectById(suspectId);
  return (
    <Modal
      kicker="WRONG"
      title="違います。"
      onClose={onClose}
      footer={
        <button class="btn btn-primary" onClick={onClose}>
          捜査に戻る
        </button>
      }
    >
      <p class="dx-wrong-name">{suspect?.nameJa} は、この事件の犯人ではない。</p>
      {clue ? (
        <p class="dx-wrong-reason">
          <b>「{clue.title}」の答えは「{clue.answerText}」。</b>
          <br />
          {suspect?.nameJa}はこの条件と矛盾する。
        </p>
      ) : (
        <p class="dx-wrong-reason">証拠が足りない。もう少し候補を絞ってから告発しよう。</p>
      )}
      <p class="dx-wrong-penalty mono">誤告発 −10点</p>
      <p class="dx-note">告発した人物は×になり、捜査を続けられる。Sは遠のくが、事件は終わらない。</p>
    </Modal>
  );
}

function tutorialCoach(bundle: CaseBundle, progress: CaseProgress, view: View): string | null {
  if (!bundle.caseFile.tutorial) return null;
  const has1 = progress.purchasedClueIds.includes('c1');
  const hasB = progress.purchasedClueIds.includes('c3') || progress.purchasedClueIds.includes('c8');
  if (view === 'evidence') {
    return '容疑者を1人選び、証拠を2枚。海外キャリアと、通算得点（または身長）を選ぶと1人に絞れる。';
  }
  if (!has1) {
    return 'まずは『海外キャリア』を買ってみよう。1ptで、海外経験の有無がわかる。';
  }
  if (!hasB) {
    return '次は『リーグ通算得点』。100点以上で、また別の2人に絞れる。2つの交点を見よう。';
  }
  return '2つの手がかりの交点は1人だけ。容疑者を確認して、『告発する』へ進もう。';
}

function tutorialGuideClue(bundle: CaseBundle, progress: CaseProgress): string | undefined {
  if (!bundle.caseFile.tutorial) return undefined;
  if (!progress.purchasedClueIds.includes('c1')) return 'c1';
  if (!progress.purchasedClueIds.includes('c3') && !progress.purchasedClueIds.includes('c8')) {
    return 'c3';
  }
  return undefined;
}
