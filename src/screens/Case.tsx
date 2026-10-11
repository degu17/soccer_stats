import { useRef, useState } from 'preact/hooks';
import { PLAYERS, playerById } from '../data/players';
import { UNLOCKS } from '../lib/glossary';
import { rankOf } from '../lib/score';
import type { CaseScores } from '../lib/store';
import { useApp } from '../state';
import { shareOrCopy, shareText } from '../lib/share';
import { ScorePill, Steps, TopBar } from '../components/ui';
import { Intro } from './case/Intro';
import { Estimate } from './case/Estimate';
import { Profile } from './case/Profile';
import { Draw } from './case/Draw';
import { Bonus } from './case/Bonus';
import { Reveal } from './case/Reveal';
import { Story } from './case/Story';

type Phase = 'intro' | 'estimate' | 'profile' | 'draw' | 'bonus' | 'reveal' | 'story';

const STEP_INDEX: Partial<Record<Phase, number>> = { estimate: 0, profile: 1, draw: 2, bonus: 3 };

export function Case({ id }: { id: string }) {
  const app = useApp();
  const player = playerById(id);
  const [phase, setPhase] = useState<Phase>('intro');
  const [scores, setScores] = useState<CaseScores>({ estimate: 0, profile: 0, draw: 0, bonus: 0 });
  const [isBest, setIsBest] = useState(false);
  const [completedNow, setCompletedNow] = useState(false);
  const backArmed = useRef(0);
  const [gain, setGain] = useState(0);
  const coach = !app.save.tutorialSeen;
  const running = scores.estimate + scores.profile + scores.draw + scores.bonus;

  const next = (key: keyof CaseScores, value: number, to: Phase) => {
    const s = { ...scores, [key]: value };
    setScores(s);
    setGain(value);
    if (key !== 'bonus') app.unlockTerms(UNLOCKS[key]);
    if (to === 'reveal') {
      const r = app.recordCase(player.id, s);
      setIsBest(r.isBest && !r.firstClear);
      // The clear that finishes the last unsolved file leads to the final results screen.
      setCompletedNow(r.firstClear && PLAYERS.every((p) => p.id === player.id || app.save.results[p.id]));
      app.markTutorialSeen();
    }
    setPhase(to);
  };

  const unsolved = PLAYERS.filter((p) => p.id !== player.id && !app.save.results[p.id]);

  const share = () => {
    const text = shareText(player.file, scores, running, rankOf(running));
    void shareOrCopy(text, app.toast);
  };


  const step = STEP_INDEX[phase];
  const inSteps = step !== undefined && step < 3;

  return (
    <div class="screen" key={phase}>
      <TopBar
        onBack={() => {
          // Mid-investigation, require a second tap so a stray touch doesn't throw the case away.
          const midCase = phase !== 'intro' && phase !== 'reveal' && phase !== 'story';
          if (midCase && Date.now() - backArmed.current > 2500) {
            backArmed.current = Date.now();
            app.toast('もう一度押すと、ファイル一覧に戻ります');
            return;
          }
          app.go({ name: 'board' });
        }}
        kicker={`FILE ${String(player.file).padStart(2, '0')}`}
        title={phase === 'reveal' || phase === 'story' ? player.nameJa : '謎の選手 X'}
        right={
          inSteps ? (
            <>
              <Steps now={step!} />
              <ScorePill value={running} gain={gain} />
            </>
          ) : phase === 'bonus' ? (
            <ScorePill value={running} gain={gain} />
          ) : null
        }
      />
      {phase === 'intro' && <Intro player={player} onStart={() => setPhase('estimate')} />}
      {phase === 'estimate' && <Estimate player={player} coach={coach} onDone={(v) => next('estimate', v, 'profile')} />}
      {phase === 'profile' && <Profile player={player} coach={coach} onDone={(v) => next('profile', v, 'draw')} />}
      {phase === 'draw' && <Draw player={player} coach={coach} onDone={(v) => next('draw', v, 'bonus')} />}
      {phase === 'bonus' && <Bonus player={player} onDone={(v) => next('bonus', v, 'reveal')} />}
      {phase === 'reveal' && <Reveal player={player} scores={scores} isBest={isBest} onNext={() => setPhase('story')} />}
      {phase === 'story' && (
        <Story
          player={player}
          onShare={share}
          nextLabel={completedNow ? '捜査結果へ' : unsolved.length ? '次の事件へ' : 'ファイル一覧へ'}
          onNext={() => {
            if (completedNow) app.go({ name: 'complete' });
            else if (unsolved.length) app.go({ name: 'case', id: unsolved[0].id });
            else app.go({ name: 'board' });
          }}
        />
      )}
    </div>
  );
}
