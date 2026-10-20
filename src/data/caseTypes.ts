/**
 * Data model for the deduction game.
 *
 * A case is a set of suspects plus predicates ("clues"). The answer is a suspect id.
 * Clues are evaluated against suspect attributes, never against prose, so the puzzle
 * can be validated by machine and re-skinned without touching the engine.
 */

export type Position = 'FW' | 'MF' | 'DF' | 'GK';
export type Foot = '右' | '左';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';
export type Rank = 'S' | 'A' | 'B' | 'C';
export type ClueCost = 1 | 2 | 3;
/** 1 = 国内トップ, 2 = 2部, 3 = 3部, 4 = 4部, 5 = 5部以下 */
export type LastTier = 1 | 2 | 3 | 4 | 5;

export interface CareerSpan {
  from: number;
  to: number;
}

export interface Club {
  name: string;
  nameJa: string;
  country: string;
  from: number;
  to: number;
  loan?: boolean;
}

export interface SourceRef {
  label: string;
  url: string;
  retrievedAt: string;
  license?: string;
}

export interface CareerCurve {
  apps: number[];
  goals: number[];
  ages: number[];
  labels: string[];
}

export interface SuspectProfile {
  id: string;
  nameJa: string;
  nameEn: string;
  /** public/players/*.jpg, or null while a cleared photo is being sourced. */
  photo: string | null;
  photoStatus: 'ready' | 'pending' | 'placeholder';
  position: Position;
  nation: string;
  birthYear: number;
  height: number;
  foot: Foot;
  careerSpan: CareerSpan;
  /** Senior clubs, counting a return as the same club and a loan as a separate club. */
  clubCount: number;
  clubs: Club[];
  overseas: boolean;
  /** League appearances only. */
  careerApps: number;
  /** League goals only. */
  careerGoals: number;
  /** Japan senior caps only. */
  caps: number;
  j1Titles: number;
  mvpCount: number;
  mvpAges: number[];
  lastTier: LastTier;
  honors: string[];
  tags: string[];
  /** Normalised six-point career shape (0..100) used for the anonymous cover star. */
  sparkline: number[];
  sources: SourceRef[];
}

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
  | { kind: 'overseasCountries'; value: number }
  | {
      kind: 'attribute';
      key: 'careerApps' | 'careerGoals' | 'caps' | 'j1Titles' | 'mvpCount' | 'clubCount';
      op: 'gte' | 'lte' | 'eq';
      value: number;
    };

export interface Clue {
  id: string;
  title: string;
  question: string;
  answerText: string;
  cost: ClueCost;
  effect: ClueEffect;
  lessonId?: string;
  source?: SourceRef;
  tags: string[];
  /** A short, non-spoiler sentence used on the clue deck. */
  revealText: string;
}

export interface FreeClue {
  id: string;
  text: string;
  effect: ClueEffect;
}

export interface StoryBeat {
  order: number;
  season: string;
  title: string;
  text: string;
}

export interface Lesson {
  id: string;
  title: string;
  body: string;
  termIds: string[];
}

export interface Reveal {
  catchcopy: string;
  story: StoryBeat[];
  lesson: Lesson;
  sources: SourceRef[];
}

export interface ScoringConfig {
  tokens: number;
  evidenceCount: number;
  correct: number;
  tightEvidence: number;
  validEvidence: number;
  weakEvidence: number;
  efficiency: number;
  wrongAccusationPenalty: number;
  hintPenalty: number;
}

export interface CaseValidation {
  optimalTokens: number;
  optimalExample: string[];
  exampleTightPairs: string[][];
  learningGoal: string;
}

export interface CaseFile {
  id: string;
  volumeId: string;
  number: number;
  title: string;
  subtitle?: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  answerId: string;
  suspectIds: string[];
  freeClues: FreeClue[];
  clues: Clue[];
  hook: string;
  reveal: Reveal;
  scoring: ScoringConfig;
  validation: CaseValidation;
  tutorial?: boolean;
  volumeTitle: string;
  /** Optional curated explanation for each non-answer suspect shown after the reveal. */
  otherReasons?: Record<string, string>;
}

export interface CaseBundle {
  caseFile: CaseFile;
  suspects: SuspectProfile[];
}

export interface EvidenceEvaluation {
  validSelection: boolean;
  pairValid: boolean;
  tight: boolean;
  decisive: boolean;
  relevantCount: number;
  remainingIds: string[];
  evidenceScore: number;
  message: string;
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

export interface CaseSelection {
  suspectId: string | null;
  evidenceIds: string[];
}
