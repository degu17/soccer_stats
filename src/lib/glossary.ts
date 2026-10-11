export interface Term {
  id: string;
  word: string;
  short: string;
  body: string;
}

export const TERMS: Term[] = [
  { id: 'stats', word: 'スタッツ', short: '選手の成績の数字', body: '試合数・得点などの記録のこと。数字を並べると、その選手がどんな選手で、どんな人生を歩んだかが見えてくる。' },
  { id: 'season', word: 'シーズン', short: 'リーグ戦の1年分', body: '日本は春〜冬の1年、ヨーロッパは夏〜翌年春。だから欧州は「2015-16」のように2つの年で書く。' },
  { id: 'league', word: 'リーグ戦', short: '1年かけて戦う総当たり戦', body: '同じリーグのチームと順番に戦う大会。1シーズンはおよそ30〜38試合。カップ戦や代表戦はふくまない。' },
  { id: 'apps', word: '出場数', short: '試合に出た回数', body: '途中から少しだけ出ても1試合と数える。ケガをすると大きく減るので、体の強さも見えてくる。' },
  { id: 'goals', word: '得点', short: '決めたゴールの数', body: 'FWなら1シーズン20点で一流、30点を超えると歴史的。DFやGKはほとんど0〜数点。' },
  { id: 'total', word: '通算', short: '全シーズンの合計', body: 'キャリア全体の合計。長くプレーするほど増えるので、長く第一線にいた証にもなる。' },
  { id: 'pergame', word: '1試合あたり得点', short: '得点 ÷ 出場数', body: '「何試合に1点取るか」がわかる。合計だけでは長くやった人が有利なので、割り算で比べるのがコツ。' },
  { id: 'position', word: 'ポジション', short: 'FW・MF・DF・GK', body: 'FW＝点を取る、MF＝試合を組み立てる、DF＝守る、GK＝ゴールを守る。役割によって数字の出方がまるで違う。' },
  { id: 'peak', word: '全盛期', short: '一番活躍した時期', body: 'グラフの山のてっぺん。20代後半が多いけれど、30代で頂点を迎える遅咲きの選手もいる。' },
  { id: 'transfer', word: '移籍', short: 'チームを移ること', body: '新しいチームやリーグに慣れるまで、数字が落ちることもある。グラフの曲がり角になりやすい。' },
  { id: 'tier', word: '1部・2部', short: 'リーグの階層', body: '成績の悪いチームは下の部へ降格する。2部の数字は、1部とそのまま比べられないことに注意。' },
];

/** Terms unlocked by finishing each step for the first time. */
export const UNLOCKS = {
  estimate: ['stats', 'season', 'league', 'goals', 'apps'],
  profile: ['total', 'pergame', 'position'],
  draw: ['peak', 'transfer', 'tier'],
} as const;

export const termById = (id: string) => TERMS.find((t) => t.id === id)!;
