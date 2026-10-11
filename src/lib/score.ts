export type Rank = 'S' | 'A' | 'B' | 'C';

export const MAX = { estimate: 100, profile: 100, draw: 100, bonus: 50 } as const;
export const MAX_TOTAL = MAX.estimate + MAX.profile + MAX.draw + MAX.bonus;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Closeness score for the slider guess. Error is measured relative to the answer, with a floor
 * so that tiny answers (a defender's best goal season) don't make every guess look terrible.
 */
export function estimateScore(guess: number, actual: number, max: number) {
  const denom = Math.max(actual, max * 0.2);
  const err = Math.abs(guess - actual) / denom;
  return Math.round(100 * Math.exp(-((err / 0.4) ** 2)));
}

export function estimateVerdict(score: number) {
  if (score >= 95) return { word: 'ドンピシャ！', tone: 'great' as const };
  if (score >= 75) return { word: 'おしい！', tone: 'good' as const };
  if (score >= 45) return { word: 'いい線いってる', tone: 'ok' as const };
  return { word: '大ハズレ…', tone: 'bad' as const };
}

/** Points for the type question by number of tries (1st try = full marks). */
export const PROFILE_POINTS = [100, 50, 20, 0];

function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

const smooth = (a: number[]) =>
  a.map((_, i) => {
    const w = a.slice(Math.max(0, i - 1), i + 2);
    return w.reduce((x, y) => x + y, 0) / w.length;
  });

/**
 * Career-drawing score: mostly "how close were the values", plus credit for getting the shape
 * (rises and falls) right even if the level is off. Nobody can foresee single-season noise, so
 * each season gets a tolerance band and the shape is compared against a lightly smoothed career.
 * Calibrated so a smoothed-but-faithful sketch scores ~85 and a flat line at the average ~45.
 */
export function drawScore(user: number[], actual: number[], yMax: number) {
  const n = actual.length;
  const sm = smooth(actual);
  const miss = user.reduce((acc, u, i) => {
    const band = 0.5 * Math.abs(actual[i] - sm[i]) + 0.04 * yMax;
    return acc + Math.max(0, Math.abs(u - actual[i]) - band);
  }, 0);
  const level = clamp01(1 - miss / n / yMax / 0.3);
  const shape = Math.max(0, pearson(user, sm));
  return Math.round(100 * clamp01(0.65 * level + 0.35 * shape));
}

export function rankOf(total: number): Rank {
  if (total >= 290) return 'S';
  if (total >= 230) return 'A';
  if (total >= 160) return 'B';
  return 'C';
}

export const RANK_TITLE: Record<Rank, string> = {
  S: '名探偵',
  A: '敏腕刑事',
  B: '刑事',
  C: '見習い刑事',
};
