import type {
  CaseBundle,
  CaseFile,
  Rank,
  ScoreResult,
} from '../data/caseTypes';
import { matchesEffect, rankForScore } from './caseEngine';

export type SuspectMark = 'unknown' | 'possible' | 'eliminated';

export interface Settings {
  sound: boolean;
  music: boolean;
  volume: number;
  reduceMotion: boolean;
  textScale: 1 | 1.25 | 1.5;
  colorblind: boolean;
  /** Auto-cross suspects who contradict a bought clue. */
  assist: boolean;
}

export interface CaseProgress {
  caseId: string;
  phase: 'intro' | 'investigating' | 'evidence' | 'reveal' | 'result';
  purchasedClueIds: string[];
  marks: Record<string, SuspectMark>;
  accusedIds: string[];
  wrongAccusations: number;
  selectedEvidenceIds: string[];
  selectedSuspectId?: string | null;
  hintsUsed: number;
  startedAt: string;
  updatedAt: string;
  /** Set with the successful accusation so a reload cannot count the same play twice. */
  resultRecorded?: boolean;
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
}

export interface DailyState {
  lastPlayedDate: string | null;
  streak: number;
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
  terms: string[];
  tutorialSeen: boolean;
  /** One-time notice after importing sound/terms from the old v1 save. */
  migrationNotice?: boolean;
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

export const freshSave = (): SaveDataV2 => ({
  version: 2,
  settings: { ...DEFAULT_SETTINGS },
  progress: {},
  results: {},
  collection: {},
  achievements: [],
  daily: { lastPlayedDate: null, streak: 0, bestByDate: {} },
  terms: [],
  tutorialSeen: false,
});

const KEY_V2 = 'stats-detective/v2';
const KEY_V1 = 'stats-detective/v1';

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function migrateV1(): SaveDataV2 | null {
  const old = readJson(KEY_V1);
  if (!isRecord(old) || old.v !== 1) return null;
  const next = freshSave();
  if (typeof old.sound === 'boolean') next.settings.sound = old.sound;
  if (Array.isArray(old.terms)) {
    next.terms = old.terms.filter((term): term is string => typeof term === 'string');
  }
  // The old tutorial taught a different game. The new tutorial starts from zero.
  next.tutorialSeen = false;
  next.migrationNotice = true;
  return next;
}

export function loadSave(): SaveDataV2 {
  const current = readJson(KEY_V2);
  if (isRecord(current) && current.version === 2) {
    const fresh = freshSave();
    return {
      ...fresh,
      ...current,
      version: 2,
      settings: { ...fresh.settings, ...(isRecord(current.settings) ? current.settings : {}) },
      progress: isRecord(current.progress) ? (current.progress as Record<string, CaseProgress>) : {},
      results: isRecord(current.results) ? (current.results as Record<string, CaseResult>) : {},
      collection: isRecord(current.collection)
        ? (current.collection as Record<string, CollectionEntry>)
        : {},
      daily: {
        ...fresh.daily,
        ...(isRecord(current.daily) ? current.daily : {}),
      } as DailyState,
      terms: Array.isArray(current.terms)
        ? current.terms.filter((term): term is string => typeof term === 'string')
        : [],
      achievements: Array.isArray(current.achievements)
        ? current.achievements.filter((a): a is string => typeof a === 'string')
        : [],
      tutorialSeen: Boolean(current.tutorialSeen),
      migrationNotice: Boolean(current.migrationNotice),
    };
  }
  return migrateV1() ?? freshSave();
}

export function persistSave(save: SaveDataV2): void {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(save));
  } catch {
    // Private mode or storage disabled: progress just won't survive a reload.
  }
}

export function resetStoredSave(): SaveDataV2 {
  const next = freshSave();
  try {
    localStorage.removeItem(KEY_V2);
    localStorage.removeItem(KEY_V1);
  } catch {
    // ignore storage failures
  }
  persistSave(next);
  return next;
}

export function newCaseProgress(bundle: CaseBundle): CaseProgress {
  const now = new Date().toISOString();
  const marks: Record<string, SuspectMark> = {};
  for (const suspect of bundle.suspects) {
    if (!bundle.caseFile.suspectIds.includes(suspect.id)) continue;
    const matchesFree = bundle.caseFile.freeClues.every((free) =>
      matchesEffect(free.effect, suspect),
    );
    marks[suspect.id] = matchesFree ? 'possible' : 'eliminated';
  }
  return {
    caseId: bundle.caseFile.id,
    phase: 'intro',
    purchasedClueIds: [],
    marks,
    accusedIds: [],
    wrongAccusations: 0,
    selectedEvidenceIds: [],
    selectedSuspectId: null,
    hintsUsed: 0,
    startedAt: now,
    updatedAt: now,
    resultRecorded: false,
  };
}

export interface CaseResultInput {
  caseId: string;
  answerId: string;
  score: ScoreResult;
  tokensUsed: number;
  wrongAccusations: number;
  totalCases: number;
  now?: string;
}

export interface CaseResultOutcome {
  save: SaveDataV2;
  isBest: boolean;
  firstClear: boolean;
  best: number;
}

/** Idempotent at the save level; callers guard with progress.resultRecorded. */
export function withCaseResult(save: SaveDataV2, input: CaseResultInput): CaseResultOutcome {
  const now = input.now ?? new Date().toISOString();
  const prev = save.results[input.caseId];
  const isBest = !prev || input.score.total > prev.bestScore;
  const bestScore = prev ? Math.max(prev.bestScore, input.score.total) : input.score.total;
  const bestRank = rankForScore(bestScore);
  const result: CaseResult = {
    caseId: input.caseId,
    bestScore,
    bestRank,
    bestTokensUsed: isBest ? input.tokensUsed : prev.bestTokensUsed,
    bestWrongAccusations: isBest ? input.wrongAccusations : prev.bestWrongAccusations,
    plays: (prev?.plays ?? 0) + 1,
    firstClearedAt: prev?.firstClearedAt ?? now,
    lastPlayedAt: now,
  };

  const previousCollection = save.collection[input.answerId];
  const collection: CollectionEntry = {
    playerId: input.answerId,
    unlockedAt: previousCollection?.unlockedAt ?? now,
    bestRank: previousCollection
      ? rankForScore(Math.max(previousCollection.bestScore, input.score.total))
      : input.score.rank,
    bestScore: previousCollection
      ? Math.max(previousCollection.bestScore, input.score.total)
      : input.score.total,
  };

  const results = { ...save.results, [input.caseId]: result };
  const achievements = new Set(save.achievements);
  achievements.add('first-clear');
  if (input.score.rank === 'S') achievements.add('s-rank');
  if (input.score.rank === 'S' && input.tokensUsed <= 2) achievements.add('two-clue-s');
  const solvedCases = Object.keys(results).length;
  if (solvedCases >= input.totalCases) achievements.add('all-clear');

  return {
    save: {
      ...save,
      results,
      collection: { ...save.collection, [input.answerId]: collection },
      achievements: [...achievements],
    },
    isBest,
    firstClear: !prev,
    best: bestScore,
  };
}

/** Clues whose effect contradicts a suspect, newest first. Used for the row memo. */
export function marksAfterPurchase(
  progress: CaseProgress,
  caseFile: CaseFile,
  bundle: CaseBundle,
  clueId: string,
): Record<string, SuspectMark> {
  const clue = caseFile.clues.find((c) => c.id === clueId);
  if (!clue) return progress.marks;
  const marks = { ...progress.marks };
  for (const suspect of bundle.suspects) {
    if (!caseFile.suspectIds.includes(suspect.id)) continue;
    if (!matchesEffect(clue.effect, suspect)) marks[suspect.id] = 'eliminated';
  }
  return marks;
}
