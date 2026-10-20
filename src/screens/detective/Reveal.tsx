import { useEffect } from 'preact/hooks';
import type { CaseBundle } from '../../data/caseTypes';
import { suspectById } from '../../data/cases';
import { PhotoSlot, PrintPhoto, Stamp, TopBar, useTimeline } from '../../components/ui';
import { IconArrow } from '../../components/icons';
import { sfx } from '../../lib/sound';
import { SourceLine } from './CaseBits';

export function CaseReveal({
  bundle,
  isBest,
  onResult,
  onExit,
}: {
  bundle: CaseBundle;
  isBest: boolean;
  onResult: () => void;
  onExit: () => void;
}) {
  const { caseFile } = bundle;
  const answer = suspectById(caseFile.answerId);
  const stage = useTimeline([260, 950, 1350, 1900]);
  const otherIds = caseFile.suspectIds.filter((id) => id !== caseFile.answerId);

  useEffect(() => {
    sfx.whoosh();
  }, []);
  useEffect(() => {
    if (stage === 1) sfx.reveal();
    if (stage === 2) sfx.stamp();
  }, [stage]);

  const appsPerSeason = answer.careerApps / Math.max(1, answer.careerSpan.to - answer.careerSpan.from + 1);
  const goalsPerGame = answer.careerGoals / Math.max(1, answer.careerApps);

  return (
    <div class="screen dx-screen dx-reveal">
      <TopBar
        onBack={onExit}
        kicker={caseFile.tutorial ? 'TUTORIAL SOLVED' : `FILE ${String(caseFile.number).padStart(3, '0')} / SOLVED`}
        title="正体判明"
      />
      <div class="grow dx-scroll dx-reveal-scroll">
        <div class="dx-reveal-hero">
          <div class={`dx-reveal-photo ${stage >= 1 ? 'on' : ''}`}>
            {answer.photo ? (
              <PrintPhoto src={answer.photo} alt={answer.nameJa} w="100%" h="100%" color />
            ) : (
              <PhotoSlot size={150} />
            )}
            <span class="dx-reveal-stamp">{stage >= 2 && <Stamp text="正体判明" size={38} rot={-7} animate />}</span>
          </div>
          <div class={`dx-reveal-name ${stage >= 2 ? 'on' : ''}`}>
            <span class="kicker">THE ANSWER</span>
            <h1 class="display">
              {answer.nameJa.split(' ').map((part) => (
                <span key={part}>{part}</span>
              ))}
            </h1>
            <p class="mono">
              {answer.position} / {answer.nation} / {answer.birthYear}年生 / {answer.height}cm
            </p>
            <p class="dx-reveal-span mono">
              {answer.careerSpan.from}–{answer.careerSpan.to} / {answer.careerSpan.to - answer.careerSpan.from + 1}シーズン
            </p>
          </div>
        </div>

        <p class={`dx-reveal-catch ${stage >= 2 ? 'on' : ''}`}>{caseFile.reveal.catchcopy}</p>
        {isBest && <span class="dx-new-best mono rise">NEW BEST</span>}

        <section class="dx-story-block">
          <div class="dx-section-head">
            <span class="kicker">THE STORY</span>
            <h2 class="display">線の物語</h2>
            <span class="dx-rule" />
          </div>
          {caseFile.reveal.story
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((beat) => (
              <article class="dx-beat" key={`${beat.order}-${beat.season}`}>
                <span class="dx-beat-no mono">{String(beat.order).padStart(2, '0')}</span>
                <div>
                  <span class="dx-beat-season mono">{beat.season}</span>
                  <h3>{beat.title}</h3>
                  <p>{beat.text}</p>
                </div>
              </article>
            ))}
        </section>

        <section class="dx-lesson sheet">
          <span class="kicker">THE LESSON</span>
          <h2 class="display">{caseFile.reveal.lesson.title}</h2>
          <p>{caseFile.reveal.lesson.body}</p>
          <div class="dx-lesson-math mono">
            <div>
              <span>{answer.careerApps}試合</span>
              <small>÷</small>
              <span>{answer.careerSpan.to - answer.careerSpan.from + 1}シーズン</span>
              <b>≒ {appsPerSeason.toFixed(1)}試合/年</b>
            </div>
            <div>
              <span>{answer.careerGoals}得点</span>
              <small>÷</small>
              <span>{answer.careerApps}試合</span>
              <b>≒ {goalsPerGame.toFixed(2)}点/試合</b>
            </div>
          </div>
          <p class="dx-lesson-terms">
            用語ノート: {caseFile.reveal.lesson.termIds.length}語を追加
          </p>
        </section>

        <details class="dx-others">
          <summary>
            <span>
              <span class="kicker">THE OTHERS</span>
              他の容疑者は、なぜ違う？
            </span>
            <span class="dx-others-count mono">{otherIds.length}人</span>
          </summary>
          <ul>
            {otherIds.map((id) => {
              const suspect = suspectById(id);
              const reason = caseFile.otherReasons?.[id] ?? 'この事件の条件に当てはまらない。';
              return (
                <li key={id}>
                  <b>{suspect.nameJa}</b>
                  <p>{reason}</p>
                </li>
              );
            })}
          </ul>
        </details>

        <section class="dx-sources">
          <span class="kicker">SOURCES</span>
          <ul>
            {caseFile.reveal.sources.map((source) => (
              <li key={source.label}>
                <SourceLine label={source.label} url={source.url} />
                <span class="mono"> / {source.retrievedAt}</span>
              </li>
            ))}
          </ul>
          <p class="dx-note">
            写真は Wikimedia Commons の自由ライセンス作品。詳細はクレジット画面に記載。
          </p>
        </section>
      </div>

      <div class="actions dx-actions">
        <button class={`btn btn-primary ${stage >= 3 ? 'ready' : ''}`} disabled={stage < 3} onClick={onResult}>
          捜査報告書へ <IconArrow />
        </button>
      </div>
    </div>
  );
}
