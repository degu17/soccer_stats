/**
 * スタッツ探偵 — 事件データ・セーブデータの設計型と参照実装
 *
 * このファイルは設計用。アプリの `src/` からはまだ import しない。
 * 実装時は `src/data/caseTypes.ts` と `src/lib/caseEngine.ts` に分割してよい。
 *
 * 設計の要点:
 * - 手がかりは「文章」ではなく「容疑者を絞る述語（effect）」として持つ。
 * - 事件の正解は `answerId`。すべての手がかりは正解に対して true でなければならない。
 * - 証拠は「購入済みの手がかり2枚」。無料の手がかりは事件の前提として先に適用する。
 * - 採点は 正解50 / 証拠30-20-10-0 / 効率20 / 誤告発-10。
 */

/* ------------------------------------------------------------------ */
/* 基本型                                                              */
/* ------------------------------------------------------------------ */

export type Position = 'FW' | 'MF' | 'DF' | 'GK';
export type Foot = '右' | '左';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';
export type Rank = 'S' | 'A' | 'B' | 'C';
export type ClueCost = 1 | 2 | 3;
export type LastTier = 1 | 2 | 3 | 4 | 5; // 1 = 国内トップ / 2 = 2部 / 5 = 5部以下

export interface CareerSpan {
  /** プロ初年度（西暦） */
  from: number;
  /** 現役最終年（西暦） */
  to: number;
}

export interface Club {
  /** 英語名（データ源の表記） */
  name: string;
  /** 日本語表示名 */
  nameJa: string;
  /** 国。日本なら '日本' */
  country: string;
  from: number;
  to: number;
  /** レンタル移籍なら true */
  loan?: boolean;
}

export interface SourceRef {
  label: string;
  url: string;
  /** ISO 8601 date */
  retrievedAt: string;
  /** 写真ならライセンス名。データなら 'CC BY-SA' など */
  license?: string;
}

export interface CareerCurve {
  /** シーズンごとのリーグ出場数。古い順。 */
  apps: number[];
  /** シーズンごとのリーグ得点。古い順。 */
  goals: number[];
  /** 各点の年齢。apps と同じ長さ。 */
  ages: number[];
  /** 表示用の短いラベル。例: ['1998', '2000', ...] */
  labels: string[];
}

/* ------------------------------------------------------------------ */
/* 容疑者                                                              */
/* ------------------------------------------------------------------ */

export interface SuspectProfile {
  /** 選手ID。事件の answerId / suspectIds と一致させる */
  id: string;
  nameJa: string;
  nameEn: string;
  /** public/players/*.jpg などのパス。未取得なら null */
  photo: string | null;
  photoStatus: 'ready' | 'pending' | 'placeholder';
  position: Position;
  nation: string;
  birthYear: number;
  height: number;
  foot: Foot;
  careerSpan: CareerSpan;
  /** シニアの所属クラブ数。同じクラブへの復帰は1、レンタル先は別 */
  clubCount: number;
  clubs: Club[];
  /** 海外クラブでのプレー経験（レンタル含む） */
  overseas: boolean;
  /** リーグ戦のみの通算 */
  careerApps: number;
  careerGoals: number;
  /** 日本代表A代表のキャップ数 */
  caps: number;
  /** J1リーグ優勝回数 */
  j1Titles: number;
  /** J1年間MVPの受賞回数 */
  mvpCount: number;
  /** J1 MVPを受賞した年齢。複数回なら複数 */
  mvpAges: number[];
  /** 引退シーズンのリーグ階層 */
  lastTier: LastTier;
  /** 表示用の主なタイトル */
  honors: string[];
  /** カードの要約タグ。例: ['海外未経験', '長期キャリア'] */
  tags: string[];
  /** 省略可。事件カードの曲線に使う */
  curve?: CareerCurve;
  /** 表示用の6点スパークライン（曲線データがない場合の代替） */
  sparkline?: number[];
  /** データの出典。最低1件 */
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ */
/* 手がかり                                                            */
/* ------------------------------------------------------------------ */

/**
 * 手がかりの述語。容疑者1人に対して true/false を返す。
 * 事件の正解は、購入したすべての手がかりに対して true でなければならない。
 */
export type ClueEffect =
  | { kind: 'noOverseas' }
  | { kind: 'maxClubs'; value: number }
  | { kind: 'minCareerApps'; value: number }
  | { kind: 'minCareerGoals'; value: number }
  | { kind: 'minCaps'; value: number }
  | { kind: 'minJ1Titles'; value: number }
  | { kind: 'mvpAtAge'; min: number }
  | { kind: 'lastTier'; value: LastTier }
  | { kind: 'height'; value: number }
  | { kind: 'foot'; value: Foot }
  | { kind: 'careerSpanIncludes'; from: number; to: number }
  | {
      kind: 'attribute';
      key: 'careerApps' | 'careerGoals' | 'caps' | 'j1Titles' | 'mvpCount' | 'clubCount';
      op: 'gte' | 'lte' | 'eq';
      value: number;
    };

export interface Clue {
  id: string;
  /** 短い見出し。例: '海外キャリア' */
  title: string;
  /** 購入前の質問。例: '海外のクラブでプレーしたことは？' */
  question: string;
  /** 購入後の答え。例: 'ない' */
  answerText: string;
  cost: ClueCost;
  effect: ClueEffect;
  /** 用語ノートのID */
  lessonId?: string;
  /** この手がかりの出典 */
  source?: SourceRef;
  /** 内容タグ。難易度調整や検索に使う */
  tags: string[];
}

export interface FreeClue {
  id: string;
  /** 事件カードに表示する文章 */
  text: string;
  effect: ClueEffect;
}

/* ------------------------------------------------------------------ */
/* 事件                                                                */
/* ------------------------------------------------------------------ */

export interface StoryBeat {
  /** 表示順 */
  order: number;
  /** 年・シーズン */
  season: string;
  title: string;
  text: string;
}

export interface Lesson {
  id: string;
  title: string;
  body: string;
  /** この事件で追加する用語ID */
  termIds: string[];
}

export interface Reveal {
  /** 正体判明時のキャッチコピー */
  catchcopy: string;
  /** 3〜4ビートの物語 */
  story: StoryBeat[];
  /** 数字の読み方 */
  lesson: Lesson;
  /** 写真・データの出典 */
  sources: SourceRef[];
}

export interface ScoringConfig {
  /** 事件開始時の捜査ポイント */
  tokens: number;
  /** 証拠として選ぶ枚数。基本は2 */
  evidenceCount: number;
  /** 正解点 */
  correct: number;
  /** タイトな証拠 */
  tightEvidence: number;
  /** 有効だがタイトでない証拠 */
  validEvidence: number;
  /** 弱い証拠 */
  weakEvidence: number;
  /** 残りポイントに対する効率点の満点 */
  efficiency: number;
  /** 誤告発1回の減点 */
  wrongAccusationPenalty: number;
  /** ヒント1回の減点（0なら無料） */
  hintPenalty: number;
}

export interface CaseValidation {
  /** 想定される最安の使用ポイント。Sの目安 */
  optimalTokens: number;
  /** 最適解の例。管理用 */
  optimalExample: string[];
  /** タイトな証拠ペアの例。管理用 */
  exampleTightPairs: string[][];
  /** この事件で学ぶこと */
  learningGoal: string;
}

export interface CaseFile {
  id: string;
  volumeId: string;
  /** 巻内の事件番号。1始まり */
  number: number;
  /** 事件タイトル。例: '途切れない線' */
  title: string;
  /** サブタイトル。任意 */
  subtitle?: string;
  difficulty: Difficulty;
  /** 想定プレイ時間（分） */
  estimatedMinutes: number;
  /** 正解の選手ID */
  answerId: string;
  /** 容疑者6人（上級は8人） */
  suspectIds: string[];
  /** 事件開始時に自動適用する手がかり */
  freeClues: FreeClue[];
  /** 購入できる手がかり8枚（上級は10〜12枚） */
  clues: Clue[];
  /** 表示用の事件フック。名前・答えを含めない */
  hook: string;
  /** 正体判明 */
  reveal: Reveal;
  /** 採点設定 */
  scoring: ScoringConfig;
  /** 制作・検証用 */
  validation: CaseValidation;
  /** チュートリアルなら true */
  tutorial?: boolean;
  /** 収録巻の表示名 */
  volumeTitle: string;
}

/** 事件ファイルと容疑者プロフィールをまとめたバンドル */
export interface CaseBundle {
  caseFile: CaseFile;
  suspects: SuspectProfile[];
}

/* ------------------------------------------------------------------ */
/* 手がかりの評価                                                      */
/* ------------------------------------------------------------------ */

/** 1人の容疑者が手がかりに該当するか */
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
      // 期間が重なっていれば「その年代も現役」とみなす
      return suspect.careerSpan.from <= effect.to && suspect.careerSpan.to >= effect.from;
    case 'attribute': {
      const value = suspect[effect.key];
      if (effect.op === 'gte') return value >= effect.value;
      if (effect.op === 'lte') return value <= effect.value;
      return value === effect.value;
    }
  }
}

/** 無料の手がかりを適用した初期候補。事件の容疑者だけに限定する */
export function initialCandidates(bundle: CaseBundle): SuspectProfile[] {
  const ids = new Set(bundle.caseFile.suspectIds);
  const free = bundle.caseFile.freeClues;
  return bundle.suspects.filter(
    (s) => ids.has(s.id) && free.every((f) => matchesEffect(f.effect, s)),
  );
}

/** ある手がかりに該当する初期候補 */
export function remainingForClue(bundle: CaseBundle, clueId: string): SuspectProfile[] {
  const clue = bundle.caseFile.clues.find((c) => c.id === clueId);
  if (!clue) return [];
  return initialCandidates(bundle).filter((s) => matchesEffect(clue.effect, s));
}

function intersection(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

/* ------------------------------------------------------------------ */
/* 証拠評価                                                            */
/* ------------------------------------------------------------------ */

export interface EvidenceEvaluation {
  /** 選択した2枚が購入済みで存在するか */
  validSelection: boolean;
  /** 2枚の積集合が正解1人だけか */
  pairValid: boolean;
  /** 2枚とも単独では1人に絞れない（理想の証拠） */
  tight: boolean;
  /** 片方の手がかりだけで1人に絞れる */
  decisive: boolean;
  /** 初期候補を1人以上消せる手がかりの数（0〜2） */
  relevantCount: number;
  /** 2枚の積集合 */
  remainingIds: string[];
  /** 証拠点 30 / 20 / 10 / 0 */
  evidenceScore: number;
  /** UIに出す短い説明 */
  message: string;
}

/**
 * 証拠を評価する。
 *
 * - 無料の手がかりは event の前提。初期候補に適用済み。
 * - 選択した2枚は、購入済みでなければならない。
 * - pairValid: 2枚の残存集合の積集合が正解1人だけ。
 * - tight: pairValid かつ、どちらの手がかりも単独では1人に絞れない。
 * - decisive: 片方の手がかりだけで1人に絞れる。
 * - relevant: 初期候補を1人以上消せる。
 */
export function evaluateEvidence(
  bundle: CaseBundle,
  purchasedClueIds: string[],
  selectedClueIds: string[],
): EvidenceEvaluation {
  const { answerId, clues } = bundle.caseFile;
  const scoring = bundle.caseFile.scoring;
  const initial = initialCandidates(bundle);
  const selected = selectedClueIds
    .map((id) => clues.find((c) => c.id === id))
    .filter((c): c is Clue => Boolean(c));

  const validSelection =
    selectedClueIds.length === 2 &&
    selected.length === 2 &&
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
      message: '証拠は、購入済みの手がかりから2枚選んでください。',
    };
  }

  const sets = selected.map((c) =>
    initial.filter((s) => matchesEffect(c.effect, s)).map((s) => s.id),
  );
  const remainingIds = intersection(sets[0], sets[1]);
  const pairValid = remainingIds.length === 1 && remainingIds[0] === answerId;
  const sizes = sets.map((s) => s.length);
  const decisive = sizes.some((n) => n === 1);
  const tight = pairValid && sizes.every((n) => n >= 2);
  const relevantCount = sizes.filter((n) => n < initial.length).length;

  let evidenceScore = 0;
  let message = '';
  if (tight) {
    evidenceScore = scoring.tightEvidence;
    message = '2枚がっちり噛み合っています。どちらも欠かせない証拠です。';
  } else if (pairValid) {
    evidenceScore = scoring.validEvidence;
    message = '1枚で決まります。もう1枚は補強です。';
  } else if (relevantCount > 0) {
    evidenceScore = scoring.weakEvidence;
    message = `まだ${Math.max(0, remainingIds.length)}人残ります。証拠としては弱いです。`;
  } else {
    evidenceScore = 0;
    message = 'この2枚は証拠になっていません。';
  }

  return {
    validSelection: true,
    pairValid,
    tight,
    decisive,
    relevantCount,
    remainingIds,
    evidenceScore,
    message,
  };
}

/* ------------------------------------------------------------------ */
/* 採点                                                                */
/* ------------------------------------------------------------------ */

export interface ScoreInput {
  correct: boolean;
  /** evaluateEvidence の evidenceScore */
  evidenceScore: number;
  tokensTotal: number;
  tokensUsed: number;
  wrongAccusations: number;
  hintsUsed?: number;
  hintPenalty?: number;
  /** 事件の採点設定。省略時は標準値 */
  scoring?: ScoringConfig;
}

export interface ScoreResult {
  total: number;
  rank: Rank;
  correctScore: number;
  evidenceScore: number;
  efficiencyScore: number;
  wrongPenalty: number;
  hintPenalty: number;
  tokensUsed: number;
  tokensRemaining: number;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function rankOf(total: number): Rank {
  if (total >= 90) return 'S';
  if (total >= 75) return 'A';
  if (total >= 60) return 'B';
  return 'C';
}

export const RANK_TITLE: Record<Rank, string> = {
  S: '名探偵',
  A: '敏腕刑事',
  B: '刑事',
  C: '見習い刑事',
};

export function scoreCase(input: ScoreInput): ScoreResult {
  const scoring = input.scoring;
  const correctScore = input.correct ? (scoring?.correct ?? 50) : 0;
  const tokensRemaining = Math.max(0, input.tokensTotal - input.tokensUsed);
  const efficiencyMax = scoring?.efficiency ?? 20;
  const efficiencyScore = Math.round(
    (efficiencyMax * tokensRemaining) / Math.max(1, input.tokensTotal),
  );
  const wrongPenalty = input.wrongAccusations * (scoring?.wrongAccusationPenalty ?? 10);
  const hintPenalty =
    (input.hintsUsed ?? 0) * (input.hintPenalty ?? scoring?.hintPenalty ?? 0);
  const total = clamp(
    correctScore + input.evidenceScore + efficiencyScore - wrongPenalty - hintPenalty,
    0,
    100,
  );

  return {
    total,
    rank: rankOf(total),
    correctScore,
    evidenceScore: input.evidenceScore,
    efficiencyScore,
    wrongPenalty,
    hintPenalty,
    tokensUsed: input.tokensUsed,
    tokensRemaining,
  };
}

/* ------------------------------------------------------------------ */
/* 事件データの検証                                                    */
/* ------------------------------------------------------------------ */

/**
 * 事件データの破綻を検出する。実装時は `scripts/validate-cases.mjs` から呼ぶ。
 * 空配列なら合格。
 */
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
  if (caseFile.freeClues.length === 0) {
    errors.push('無料の手がかりがありません。');
  }
  if (caseFile.clues.length < 4 || caseFile.clues.length > 12) {
    errors.push('手がかりは4〜12枚にしてください。');
  }
  if (caseFile.scoring.tokens < 1) errors.push('tokens は1以上にしてください。');
  if (caseFile.scoring.evidenceCount !== 2) {
    errors.push('証拠は2枚固定です（evidenceCount = 2）。');
  }

  const initial = initialCandidates(bundle);
  if (initial.length < 2) {
    errors.push('無料の手がかりで候補が1人以下になっています。');
  }
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
    if (clue.cost < 1 || clue.cost > 3) errors.push(`手がかり ${clue.id} のコストが1〜3ではありません。`);
    if (!clue.title || !clue.question || !clue.answerText) {
      errors.push(`手がかり ${clue.id} に空のテキストがあります。`);
    }
    const answerSuspect = byId.get(caseFile.answerId);
    if (answerSuspect && !matchesEffect(clue.effect, answerSuspect)) {
      errors.push(`手がかり ${clue.id} が正解 ${caseFile.answerId} に該当しません。`);
    }
    const eliminated = initial.filter((s) => !matchesEffect(clue.effect, s));
    if (eliminated.length === 0) {
      errors.push(`手がかり ${clue.id} が誰も消していません。`);
    }
  }

  // 事件タイトル・フック・手がかりに正解の名前（姓を含む）が出ていないか
  const answer = byId.get(caseFile.answerId);
  if (answer) {
    const answerNames = [answer.nameJa, ...answer.nameJa.split(/\s+/)].map((n) =>
      n.replace(/\s/g, ''),
    );
    const spoilerText = [
      caseFile.title,
      caseFile.subtitle ?? '',
      caseFile.hook,
      ...caseFile.clues.flatMap((c) => [c.title, c.question, c.answerText]),
    ]
      .join(' ')
      .replace(/\s/g, '');
    if (answerNames.some((n) => n.length >= 2 && spoilerText.includes(n))) {
      errors.push('事件タイトル・フック・手がかりに正解の名前が入っています。');
    }
  }

  // タイトな証拠ペアが1組以上あるか
  const allClueIds = caseFile.clues.map((c) => c.id);
  let tightPairs = 0;
  let decisiveClues = 0;
  for (const c of caseFile.clues) {
    const remaining = remainingForClue(bundle, c.id);
    if (remaining.length === 1) decisiveClues += 1;
  }
  for (let i = 0; i < allClueIds.length; i += 1) {
    for (let j = i + 1; j < allClueIds.length; j += 1) {
      const evaluation = evaluateEvidence(bundle, allClueIds, [allClueIds[i], allClueIds[j]]);
      if (evaluation.tight) tightPairs += 1;
    }
  }
  if (tightPairs < 1) errors.push('タイトな証拠ペアが1組もありません。');
  if (decisiveClues < 1) errors.push('決定的な手がかりが1枚もありません。');
  if (caseFile.validation.optimalTokens > 3) {
    errors.push('最適ルートが3ptを超えています。Sの目安を見直してください。');
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
  }

  return errors;
}

export function assertValidCaseBundle(bundle: CaseBundle): void {
  const errors = validateCaseBundle(bundle);
  if (errors.length) {
    throw new Error(`事件データが不正です:\n- ${errors.join('\n- ')}`);
  }
}

/* ------------------------------------------------------------------ */
/* セーブデータ                                                        */
/* ------------------------------------------------------------------ */

export interface Settings {
  sound: boolean;
  music: boolean;
  volume: number; // 0..1
  reduceMotion: boolean;
  textScale: 1 | 1.25 | 1.5;
  colorblind: boolean;
  /** 手がかり購入後の自動消去 */
  assist: boolean;
}

export type SuspectMark = 'unknown' | 'possible' | 'eliminated';

export interface CaseProgress {
  caseId: string;
  phase: 'intro' | 'investigating' | 'evidence' | 'reveal' | 'result';
  purchasedClueIds: string[];
  /** 容疑者ID → メモ状態。正解判定には使わない */
  marks: Record<string, SuspectMark>;
  accusedIds: string[];
  wrongAccusations: number;
  selectedEvidenceIds: string[];
  hintsUsed: number;
  startedAt: string;
  updatedAt: string;
}

export interface CaseResult {
  caseId: string;
  bestScore: number;
  bestRank: Rank;
  bestTokensUsed: number;
  bestWrongAccusations: number;
  plays: number;
  firstClearedAt: string;
  lastPlayedAt: string;
}

export interface CollectionEntry {
  playerId: string;
  unlockedAt: string;
  bestRank: Rank;
  bestScore: number;
  /** 表示する物語のID。未解決なら null */
  storyId: string | null;
}

export interface DailyState {
  /** 最後に日替わりを遊んだ日。YYYY-MM-DD */
  lastPlayedDate: string | null;
  streak: number;
  /** 日付 → ベストスコア */
  bestByDate: Record<string, number>;
}

export interface SaveDataV2 {
  version: 2;
  settings: Settings;
  progress: Record<string, CaseProgress>;
  results: Record<string, CaseResult>;
  collection: Record<string, CollectionEntry>;
  achievements: string[];
  daily: DailyState;
  /** 用語ノート。解放済みの term id */
  terms: string[];
  tutorialSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  volume: 0.7,
  reduceMotion: false,
  textScale: 1,
  colorblind: false,
  assist: true,
};

export const DEFAULT_SAVE_V2: SaveDataV2 = {
  version: 2,
  settings: { ...DEFAULT_SETTINGS },
  progress: {},
  results: {},
  collection: {},
  achievements: [],
  daily: { lastPlayedDate: null, streak: 0, bestByDate: {} },
  terms: [],
  tutorialSeen: false,
};

/* ------------------------------------------------------------------ */
/* 参考: サンプル事件の採点例                                          */
/* ------------------------------------------------------------------ */

/**
 * FILE 001 の例:
 * - C1 + C7 = 2pt, tight, 0 wrong
 *   scoreCase({ correct: true, evidenceScore: 30, tokensTotal: 6, tokensUsed: 2, wrongAccusations: 0 })
 *   => total 93, rank S
 * - C4 + C1 = 4pt, valid (not tight), 0 wrong
 *   => total 77, rank A
 * - C1 + C5 = 3pt, weak, 0 wrong
 *   => total 70, rank B
 * - C1 + C7 = 2pt, tight, 1 wrong
 *   => total 83, rank A
 */
