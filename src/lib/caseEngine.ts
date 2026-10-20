import type {
  CaseBundle,
  Clue,
  ClueEffect,
  EvidenceEvaluation,
  Rank,
  ScoreResult,
  ScoringConfig,
  SuspectProfile,
} from '../data/caseTypes';

export const RANK_TITLE: Record<Rank, string> = {
  S: '名探偵',
  A: '敏腕刑事',
  B: '刑事',
  C: '見習い刑事',
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Count distinct foreign countries represented in a player's senior club list. */
export function overseasCountryCount(suspect: SuspectProfile): number {
  const countries = new Set(
    suspect.clubs
      .map((club) => club.country)
      .filter((country) => country !== '日本'),
  );
  return countries.size;
}

export function matchesEffect(effect: ClueEffect, suspect: SuspectProfile): boolean {
  switch (effect.kind) {
    case 'noOverseas':
      return !suspect.overseas;
    case 'maxClubs':
      return suspect.clubCount <= effect.value;
    case 'minCareerApps':
      return suspect.careerApps >= effect.value;
    case 'minCareerGoals':
      return suspect.careerGoals >= effect.value;
    case 'minCaps':
      return suspect.caps >= effect.value;
    case 'minJ1Titles':
      return suspect.j1Titles >= effect.value;
    case 'mvpAtAge':
      return suspect.mvpAges.some((age) => age >= effect.min);
    case 'lastTier':
      return suspect.lastTier === effect.value;
    case 'height':
      return suspect.height === effect.value;
    case 'foot':
      return suspect.foot === effect.value;
    case 'careerSpanIncludes':
      return suspect.careerSpan.from <= effect.to && suspect.careerSpan.to >= effect.from;
    case 'overseasCountries':
      return overseasCountryCount(suspect) === effect.value;
    case 'attribute': {
      const value = suspect[effect.key];
      if (effect.op === 'gte') return value >= effect.value;
      if (effect.op === 'lte') return value <= effect.value;
      return value === effect.value;
    }
  }
}

/** All suspects belonging to the case, in the order the file lists them. */
export function caseSuspects(bundle: CaseBundle): SuspectProfile[] {
  const byId = new Map(bundle.suspects.map((s) => [s.id, s]));
  return bundle.caseFile.suspectIds
    .map((id) => byId.get(id))
    .filter((s): s is SuspectProfile => Boolean(s));
}

/** Candidate set after the free clue(s) are applied. */
export function initialCandidates(bundle: CaseBundle): SuspectProfile[] {
  return caseSuspects(bundle).filter((s) =>
    bundle.caseFile.freeClues.every((free) => matchesEffect(free.effect, s)),
  );
}

/** Candidate set after a bought clue is applied to the free-clue candidates. */
export function remainingForClue(bundle: CaseBundle, clueId: string): SuspectProfile[] {
  const clue = bundle.caseFile.clues.find((c) => c.id === clueId);
  if (!clue) return [];
  return initialCandidates(bundle).filter((s) => matchesEffect(clue.effect, s));
}

/** Suspects that a clue removes from the initial candidate set. */
export function eliminatedByClue(bundle: CaseBundle, clue: Clue): SuspectProfile[] {
  return initialCandidates(bundle).filter((s) => !matchesEffect(clue.effect, s));
}

/** First free or purchased clue that contradicts a suspect, used to explain crosses. */
export function contradictionFor(
  bundle: CaseBundle,
  suspectId: string,
  purchasedClueIds: string[],
): Clue | null {
  const suspect = caseSuspects(bundle).find((s) => s.id === suspectId);
  if (!suspect) return null;
  const clues = bundle.caseFile.clues.filter((c) => purchasedClueIds.includes(c.id));
  return clues.find((clue) => !matchesEffect(clue.effect, suspect)) ?? null;
}

/** Clues that individually leave two or more candidates but whose intersection is one. */
export function tightPairs(bundle: CaseBundle): string[][] {
  const ids = bundle.caseFile.clues.map((c) => c.id);
  const pairs: string[][] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const evaluation = evaluateEvidence(bundle, ids, [ids[i], ids[j]]);
      if (evaluation.tight) pairs.push([ids[i], ids[j]]);
    }
  }
  return pairs;
}

function intersection(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((id) => set.has(id));
}

/**
 * Evidence is exactly two bought clues. A pair is:
 * - tight if each clue alone leaves at least two candidates and their intersection is the answer,
 * - valid if the intersection is the answer but one clue is decisive,
 * - weak if it removes someone but leaves more than the answer,
 * - worthless if it removes nobody.
 */
export function evaluateEvidence(
  bundle: CaseBundle,
  purchasedClueIds: string[],
  selectedClueIds: string[],
): EvidenceEvaluation {
  const clues = bundle.caseFile.clues;
  const scoring = bundle.caseFile.scoring;
  const initial = initialCandidates(bundle);
  const selected = selectedClueIds
    .map((id) => clues.find((c) => c.id === id))
    .filter((c): c is Clue => Boolean(c));

  const validSelection =
    selectedClueIds.length === scoring.evidenceCount &&
    selected.length === scoring.evidenceCount &&
    selected.every((c) => purchasedClueIds.includes(c.id));

  if (!validSelection) {
    return {
      validSelection: false,
      pairValid: false,
      tight: false,
      decisive: false,
      relevantCount: 0,
      remainingIds: [],
      evidenceScore: 0,
      message: `証拠は、購入済みの手がかりから${scoring.evidenceCount}枚選んでください。`,
    };
  }

  const sets = selected.map((clue) =>
    initial.filter((s) => matchesEffect(clue.effect, s)).map((s) => s.id),
  );
  const remainingIds = intersection(sets[0], sets[1]);
  const pairValid = remainingIds.length === 1 && remainingIds[0] === bundle.caseFile.answerId;
  const sizes = sets.map((set) => set.length);
  const decisive = sizes.some((size) => size === 1);
  const tight = pairValid && sizes.every((size) => size >= 2);
  const relevantCount = sizes.filter((size) => size < initial.length).length;

  if (tight) {
    return {
      validSelection,
      pairValid,
      tight,
      decisive,
      relevantCount,
      remainingIds,
      evidenceScore: scoring.tightEvidence,
      message: '2枚がっちり噛み合っています。どちらも欠かせない証拠です。',
    };
  }
  if (pairValid) {
    return {
      validSelection,
      pairValid,
      tight,
      decisive,
      relevantCount,
      remainingIds,
      evidenceScore: scoring.validEvidence,
      message: '1枚で決まります。もう1枚は補強です。',
    };
  }
  if (relevantCount > 0) {
    return {
      validSelection,
      pairValid,
      tight,
      decisive,
      relevantCount,
      remainingIds,
      evidenceScore: scoring.weakEvidence,
      message: `まだ${Math.max(0, remainingIds.length)}人残ります。証拠としては弱いです。`,
    };
  }
  return {
    validSelection,
    pairValid,
    tight,
    decisive,
    relevantCount,
    remainingIds,
    evidenceScore: 0,
    message: 'この2枚は証拠になっていません。',
  };
}

export function rankForScore(total: number): Rank {
  if (total >= 90) return 'S';
  if (total >= 75) return 'A';
  if (total >= 60) return 'B';
  return 'C';
}

export interface ScoreInput {
  correct: boolean;
  evidenceScore: number;
  tokensTotal: number;
  tokensUsed: number;
  wrongAccusations: number;
  hintsUsed?: number;
  hintPenalty?: number;
  scoring?: ScoringConfig;
}

export function scoreCase(input: ScoreInput): ScoreResult {
  const scoring = input.scoring;
  const correctScore = input.correct ? (scoring?.correct ?? 50) : 0;
  const tokensRemaining = Math.max(0, input.tokensTotal - input.tokensUsed);
  const efficiencyMax = scoring?.efficiency ?? 20;
  const efficiencyScore = Math.round(
    (efficiencyMax * tokensRemaining) / Math.max(1, input.tokensTotal),
  );
  const wrongPenalty =
    input.wrongAccusations * (scoring?.wrongAccusationPenalty ?? 10);
  const hintPenalty =
    (input.hintsUsed ?? 0) * (input.hintPenalty ?? scoring?.hintPenalty ?? 0);
  const total = clamp(
    correctScore + input.evidenceScore + efficiencyScore - wrongPenalty - hintPenalty,
    0,
    100,
  );
  return {
    total,
    rank: rankForScore(total),
    correctScore,
    evidenceScore: input.evidenceScore,
    efficiencyScore,
    wrongPenalty,
    hintPenalty,
    tokensUsed: input.tokensUsed,
    tokensRemaining,
  };
}

export function tokensUsed(bundle: CaseBundle, purchasedClueIds: string[]): number {
  return bundle.caseFile.clues
    .filter((clue) => purchasedClueIds.includes(clue.id))
    .reduce((sum, clue) => sum + clue.cost, 0);
}

export function tokensRemaining(bundle: CaseBundle, purchasedClueIds: string[]): number {
  return bundle.caseFile.scoring.tokens - tokensUsed(bundle, purchasedClueIds);
}

/** Majority of the UI doesn't need a full validation; this is the authoring gate. */
export function validateCaseBundle(bundle: CaseBundle): string[] {
  const errors: string[] = [];
  const { caseFile, suspects } = bundle;
  const byId = new Map(suspects.map((s) => [s.id, s]));

  if (new Set(suspects.map((s) => s.id)).size !== suspects.length) {
    errors.push('suspects に重複IDがあります。');
  }
  if (!byId.has(caseFile.answerId)) {
    errors.push(`answerId ${caseFile.answerId} が suspects に存在しません。`);
  }
  if (caseFile.suspectIds.length < 4 || caseFile.suspectIds.length > 8) {
    errors.push('容疑者は4〜8人にしてください。');
  }
  if (new Set(caseFile.suspectIds).size !== caseFile.suspectIds.length) {
    errors.push('suspectIds に重複があります。');
  }
  for (const id of caseFile.suspectIds) {
    if (!byId.has(id)) errors.push(`suspectId ${id} が suspects に存在しません。`);
  }
  if (!caseFile.freeClues.length) errors.push('無料の手がかりがありません。');
  if (caseFile.clues.length < 4 || caseFile.clues.length > 12) {
    errors.push('手がかりは4〜12枚にしてください。');
  }
  if (caseFile.scoring.tokens < 1) errors.push('tokens は1以上にしてください。');
  if (caseFile.scoring.evidenceCount !== 2) {
    errors.push('証拠は2枚固定です（evidenceCount = 2）。');
  }

  const initial = initialCandidates(bundle);
  if (initial.length < 2) errors.push('無料の手がかりで候補が1人以下になっています。');
  if (initial.length === caseFile.suspectIds.length) {
    errors.push('無料の手がかりが誰も消していません。');
  }
  if (!initial.some((s) => s.id === caseFile.answerId)) {
    errors.push('無料の手がかりが正解を消しています。');
  }

  const clueIds = new Set<string>();
  for (const clue of caseFile.clues) {
    if (clueIds.has(clue.id)) errors.push(`手がかりID ${clue.id} が重複しています。`);
    clueIds.add(clue.id);
    if (clue.cost < 1 || clue.cost > 3) {
      errors.push(`手がかり ${clue.id} のコストが1〜3ではありません。`);
    }
    if (!clue.title || !clue.question || !clue.answerText || !clue.revealText) {
      errors.push(`手がかり ${clue.id} に空のテキストがあります。`);
    }
    const answer = byId.get(caseFile.answerId);
    if (answer && !matchesEffect(clue.effect, answer)) {
      errors.push(`手がかり ${clue.id} が正解 ${caseFile.answerId} に該当しません。`);
    }
    const eliminated = initial.filter((s) => !matchesEffect(clue.effect, s));
    if (!eliminated.length) errors.push(`手がかり ${clue.id} が誰も消していません。`);
  }

  const answer = byId.get(caseFile.answerId);
  if (answer) {
    const answerNames = [answer.nameJa, ...answer.nameJa.split(/\s+/)].map((n) =>
      n.replace(/\s/g, ''),
    );
    const spoilerText = [
      caseFile.title,
      caseFile.subtitle ?? '',
      caseFile.hook,
      ...caseFile.freeClues.map((f) => f.text),
      ...caseFile.clues.flatMap((c) => [c.title, c.question, c.answerText]),
    ]
      .join(' ')
      .replace(/\s/g, '');
    if (answerNames.some((n) => n.length >= 2 && spoilerText.includes(n))) {
      errors.push('事件タイトル・フック・手がかりに正解の名前が入っています。');
    }
  }

  let decisiveClues = 0;
  for (const clue of caseFile.clues) {
    if (remainingForClue(bundle, clue.id).length === 1) decisiveClues += 1;
  }
  if (!tightPairs(bundle).length) errors.push('タイトな証拠ペアが1組もありません。');
  if (!decisiveClues) errors.push('決定的な手がかりが1枚もありません。');
  if (caseFile.validation.optimalTokens > 3) {
    errors.push('最適ルートが3ptを超えています。Sの目安を見直してください。');
  }

  const optimalCost = caseFile.validation.optimalExample.reduce((sum, id) => {
    const clue = caseFile.clues.find((c) => c.id === id);
    return sum + (clue?.cost ?? 0);
  }, 0);
  if (optimalCost !== caseFile.validation.optimalTokens) {
    errors.push(
      `optimalTokens (${caseFile.validation.optimalTokens}) と optimalExample の合計 (${optimalCost}) が一致しません。`,
    );
  }

  for (const suspect of suspects) {
    if (!suspect.sources.length) errors.push(`容疑者 ${suspect.id} に出典がありません。`);
    if (suspect.clubCount < 1) errors.push(`容疑者 ${suspect.id} の clubCount が不正です。`);
    if (suspect.careerSpan.from > suspect.careerSpan.to) {
      errors.push(`容疑者 ${suspect.id} の careerSpan が逆転しています。`);
    }
    if (suspect.photoStatus === 'ready' && !suspect.photo) {
      errors.push(`容疑者 ${suspect.id} は photoStatus=ready ですが photo がありません。`);
    }
    if (suspect.sparkline.length !== 6) {
      errors.push(`容疑者 ${suspect.id} の sparkline は6点にしてください。`);
    }
  }

  return errors;
}

export function assertValidCaseBundle(bundle: CaseBundle): void {
  const errors = validateCaseBundle(bundle);
  if (errors.length) {
    throw new Error(`事件データが不正です:\n- ${errors.join('\n- ')}`);
  }
}
