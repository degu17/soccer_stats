import type { Rank } from './score';

export interface CaseScores {
  estimate: number;
  profile: number;
  draw: number;
  bonus: number;
}

export interface CaseResult {
  best: number;
  bestRank: Rank;
  last: CaseScores;
  plays: number;
}

export interface Save {
  v: 1;
  results: Record<string, CaseResult>;
  tutorialSeen: boolean;
  sound: boolean;
  terms: string[];
}

const KEY = 'stats-detective/v1';

const fresh = (): Save => ({ v: 1, results: {}, tutorialSeen: false, sound: true, terms: [] });

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as Save;
    return s && s.v === 1 ? { ...fresh(), ...s } : fresh();
  } catch {
    return fresh();
  }
}

export function persist(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or storage disabled: progress just won't survive a reload.
  }
}
