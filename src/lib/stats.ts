import { leagueInfo, metricValue, PLAYERS, type Player } from '../data/players';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function careerTotals(p: Player) {
  const apps = sum(p.seasons.map((s) => s.apps));
  const goals = sum(p.seasons.map((s) => s.goals));
  const clubs = new Set(
    p.seasons.flatMap((s) => s.club.split(' → ').map((c) => c.replace(/\s*\(loan\)/, '').replace('Tokyo Verdy 1969', 'Tokyo Verdy'))),
  );
  // North American clubs share one league label, so their country comes from the club itself.
  const CLUB_COUNTRY: Record<string, string> = { 'Montreal Impact': 'カナダ', 'Phoenix Rising': 'アメリカ', 'LA Galaxy': 'アメリカ' };
  const countries = new Set(
    p.seasons.flatMap((s) => {
      const leagues = s.league.split(' → ');
      return s.club.split(' → ').map((c, i) => CLUB_COUNTRY[c] ?? leagueInfo(leagues[Math.min(i, leagues.length - 1)]).country);
    }),
  );
  const bestGoals = Math.max(...p.seasons.map((s) => s.goals));
  const first = p.seasons[0];
  const last = p.seasons.at(-1)!;
  return {
    apps,
    goals,
    perGame: apps ? goals / apps : 0,
    bestGoals,
    clubs: clubs.size,
    countries: countries.size,
    seasons: p.seasons.length,
    firstAge: first.age,
    lastAge: last.age,
    firstYear: first.year,
    lastYear: last.year + (last.season.includes('-') ? 1 : 0),
  };
}

/** The number asked in the estimate step: best goal season, or total league appearances. */
export function estimateTarget(p: Player) {
  const t = careerTotals(p);
  if (p.metric === 'goals') {
    const best = p.seasons.reduce((a, b) => (b.goals > a.goals ? b : a));
    return {
      value: t.bestGoals,
      max: 50,
      step: 1,
      unit: '点',
      question: '1シーズンで決めた\nリーグ戦の最多得点は？',
      hint: 'リーグ戦は1シーズンにおよそ30〜38試合',
      bestSeason: best,
      others: PLAYERS.filter((o) => o.id !== p.id).map((o) => careerTotals(o).bestGoals),
      othersLabel: 'ほかの9人の最多得点',
    };
  }
  return {
    value: t.apps,
    max: 1000,
    step: 10,
    unit: '試合',
    question: 'プロ生活で出場した\nリーグ戦の通算試合数は？',
    hint: 'リーグ戦は1シーズンにおよそ30〜38試合',
    bestSeason: null,
    others: PLAYERS.filter((o) => o.id !== p.id).map((o) => careerTotals(o).apps),
    othersLabel: 'ほかの9人の通算出場',
  };
}

/** A plain-language translation of the estimate answer, so the number means something. */
export function estimateMeaning(p: Player): string {
  const t = careerTotals(p);
  const target = estimateTarget(p);
  if (p.metric === 'goals') {
    const s = target.bestSeason!;
    if (s.goals === 0) return 'GKはゴールを守る役。得点ゼロが当たり前！';
    const per = s.apps / s.goals;
    const pace =
      per < 1 ? '1試合1点を超えるペース！' : per <= 1.15 ? 'ほぼ毎試合ゴール！' : per <= 2 ? `${per.toFixed(1)}試合に1点のペース` : `${Math.round(per)}試合に1点のペース`;
    return `${s.apps}試合で${s.goals}点 → ${pace}`;
  }
  const avg = Math.round(t.apps / t.seasons);
  return `${t.seasons}シーズン × 平均${avg}試合 ＝ ${t.apps}試合`;
}

export function metricSeries(p: Player) {
  return p.seasons.map((s) => metricValue(p, s));
}

/** Y-axis ceiling for the drawing chart: a round number a bit above the career high. */
export function chartMax(p: Player) {
  if (p.metric === 'apps') return 40;
  const hi = Math.max(...metricSeries(p));
  return Math.max(10, Math.ceil((hi + 2) / 5) * 5);
}

/** Goals-per-game bands used to explain the profiling answer. Rough guides, not rules. */
export const PER_GAME_BANDS = [
  { pos: 'GK', from: 0, to: 0.01, label: 'GK' },
  { pos: 'DF', from: 0.01, to: 0.1, label: 'DF' },
  { pos: 'MF', from: 0.1, to: 0.3, label: 'MF' },
  { pos: 'FW', from: 0.3, to: 0.8, label: 'FW' },
] as const;
