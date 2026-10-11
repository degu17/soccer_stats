import seasonsJson from './seasons.json';
import creditsJson from './credits.json';

export type Position = 'FW' | 'MF' | 'DF' | 'GK';
/** Which per-season number the player is judged on in the drawing step. */
export type Metric = 'goals' | 'apps';

export interface Season {
  season: string;
  year: number;
  age: number;
  club: string;
  league: string;
  apps: number;
  goals: number;
}

export type EventKind = 'move' | 'injury' | 'down' | 'debut' | 'return' | 'honor';

export interface CareerEvent {
  season: string;
  label: string;
  kind: EventKind;
}

export interface StoryBeat {
  season: string;
  title: string;
  text: string;
}

export interface Credit {
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
}

export interface Player {
  id: string;
  file: number;
  nameJa: string;
  /** Short form for tight spots (file list). */
  short: string;
  nameEn: string;
  nation: string;
  position: Position;
  height: number;
  foot: '右' | '左';
  metric: Metric;
  difficulty: 1 | 2 | 3;
  catchcopy: string;
  events: CareerEvent[];
  story: StoryBeat[];
  birth: string;
  seasons: Season[];
  credit: Credit;
  photo: string;
}

type Meta = Omit<Player, 'birth' | 'seasons' | 'credit' | 'photo'>;

const META: Meta[] = [
  {
    id: 'okubo', file: 1, short: '大久保嘉人', nameJa: '大久保 嘉人', nameEn: 'Yoshito Okubo', nation: '日本',
    position: 'FW', height: 170, foot: '右', metric: 'goals', difficulty: 1,
    catchcopy: '30歳を過ぎて覚醒。史上初、3年連続J1得点王',
    events: [
      { season: '2002', label: '2部', kind: 'down' },
      { season: '2004-05', label: 'スペインへ', kind: 'move' },
      { season: '2008-09', label: 'ドイツへ', kind: 'move' },
      { season: '2013', label: '川崎へ移籍', kind: 'move' },
    ],
    story: [
      { season: '2002', title: '2部で18点', text: 'J2（2部）で18得点。若くして点取り屋の片りんを見せる。' },
      { season: '2005-06', title: '海外では苦戦', text: 'スペインとドイツでは得点が伸びず、日本へ戻る。' },
      { season: '2013', title: '川崎で大爆発', text: '川崎へ移って26得点。ここから3年連続の得点王に。J1通算191得点は歴代最多。' },
    ],
  },
  {
    id: 'buffon', file: 2, short: 'ブッフォン', nameJa: 'ジャンルイジ・ブッフォン', nameEn: 'Gianluigi Buffon', nation: 'イタリア',
    position: 'GK', height: 192, foot: '右', metric: 'apps', difficulty: 1,
    catchcopy: '17歳から45歳まで。ゴールを守り続けた28シーズン',
    events: [
      { season: '1995-96', label: '17歳デビュー', kind: 'debut' },
      { season: '2001-02', label: 'ユヴェントスへ', kind: 'move' },
      { season: '2006-07', label: '2部降格', kind: 'down' },
      { season: '2018-19', label: 'フランスへ', kind: 'move' },
      { season: '2021-22', label: '古巣パルマ', kind: 'return' },
    ],
    story: [
      { season: '1995-96', title: 'セリエAデビュー', text: 'デビュー戦の相手は強豪ACミラン。ここから長い物語が始まる。' },
      { season: '2006-07', title: '2部でも37試合', text: 'クラブが不正事件で2部へ降格。それでも残留し、ゴールを守った。' },
      { season: '2021-22', title: '古巣パルマへ', text: '古巣パルマ（2部）で26試合。セリエA出場数はマルディーニを抜いて歴代最多。' },
    ],
  },
  {
    id: 'nakata', file: 3, short: '中田英寿', nameJa: '中田 英寿', nameEn: 'Hidetoshi Nakata', nation: '日本',
    position: 'MF', height: 175, foot: '右', metric: 'goals', difficulty: 2,
    catchcopy: '21歳でイタリアへ。29歳でスパイクを脱いだ天才',
    events: [
      { season: '1998-99', label: 'イタリアへ', kind: 'move' },
      { season: '1999-2000', label: 'ローマへ', kind: 'move' },
      { season: '2005-06', label: 'イングランドへ', kind: 'move' },
    ],
    story: [
      { season: '1998-99', title: '1年目でいきなり10点', text: '21歳で渡ったイタリア・ペルージャで、リーグ戦10得点の大活躍。' },
      { season: '2000-01', title: 'ローマで優勝', text: '得点は少なくても、ローマ18年ぶりのリーグ優勝に貢献した。' },
      { season: '2005-06', title: 'W杯を最後に引退', text: '2006年、29歳で現役引退。グラフはここで突然終わる。' },
    ],
  },
  {
    id: 'ronaldo', file: 4, short: 'ロナウド', nameJa: 'ロナウド', nameEn: 'Ronaldo', nation: 'ブラジル',
    position: 'FW', height: 183, foot: '右', metric: 'goals', difficulty: 2,
    catchcopy: '“怪物”と呼ばれた男。2度のひざの大ケガからW杯得点王へ',
    events: [
      { season: '1994-95', label: 'オランダへ', kind: 'move' },
      { season: '1996-97', label: 'スペインへ', kind: 'move' },
      { season: '1997-98', label: 'イタリアへ', kind: 'move' },
      { season: '1999-2000', label: 'ひざ大ケガ', kind: 'injury' },
      { season: '2002-03', label: 'レアルへ', kind: 'move' },
    ],
    story: [
      { season: '1996-97', title: 'バルサで34得点', text: '20歳になるシーズン、37試合34得点でリーグ得点王。ほぼ毎試合ゴールする“怪物”。' },
      { season: '2000-01', title: '2度のひざの大ケガ', text: '1999年と2000年に右ひざを重傷。約2シーズン、ほとんど試合に出られない。' },
      { season: '2002-03', title: '奇跡の復活', text: '2002年W杯で得点王になりブラジルを優勝へ。レアルでも23得点。' },
    ],
  },
  {
    id: 'nakazawa', file: 5, short: '中澤佑二', nameJa: '中澤 佑二', nameEn: 'Yuji Nakazawa', nation: '日本',
    position: 'DF', height: 187, foot: '右', metric: 'apps', difficulty: 2,
    catchcopy: '練習生から日本代表の主将へ。178試合連続フル出場の鉄人',
    events: [
      { season: '1999', label: '新人王', kind: 'honor' },
      { season: '2002', label: '横浜FMへ', kind: 'move' },
      { season: '2004', label: 'MVP', kind: 'honor' },
    ],
    story: [
      { season: '1999', title: '練習生からのスタート', text: '給料なしの練習生として入団。1年目で28試合に出て新人王に。' },
      { season: '2004', title: 'DFでJリーグMVP', text: '点を取る役目ではないDFが、リーグ最優秀選手に選ばれた。' },
      { season: '2015', title: '30代後半で全試合出場', text: '2013〜2018年に178試合連続フル出場。34試合＝そのシーズンの全試合。' },
    ],
  },
  {
    id: 'ibra', file: 6, short: 'イブラヒモビッチ', nameJa: 'ズラタン・イブラヒモビッチ', nameEn: 'Zlatan Ibrahimović', nation: 'スウェーデン',
    position: 'FW', height: 195, foot: '右', metric: 'goals', difficulty: 3,
    catchcopy: '全盛期は30代半ば。年齢の常識を壊したストライカー',
    events: [
      { season: '2001-02', label: 'オランダへ', kind: 'move' },
      { season: '2004-05', label: 'イタリアへ', kind: 'move' },
      { season: '2012-13', label: 'フランスへ', kind: 'move' },
      { season: '2018', label: 'アメリカへ', kind: 'move' },
      { season: '2019-20', label: 'ミラン復帰', kind: 'return' },
    ],
    story: [
      { season: '2015-16', title: '30代半ばで自己最多', text: 'パリで31試合38得点。34歳になるシーズン、多くの選手が衰える年齢で頂点に。' },
      { season: '2019', title: 'アメリカで30得点', text: '38歳になる年、アメリカのリーグで29試合30得点。' },
      { season: '2022-23', title: 'セリエA最年長ゴール', text: '41歳でゴールを決めて最年長記録を更新。このシーズン限りで引退。' },
    ],
  },
  {
    id: 'endo', file: 7, short: '遠藤保仁', nameJa: '遠藤 保仁', nameEn: 'Yasuhito Endo', nation: '日本',
    position: 'MF', height: 178, foot: '右', metric: 'apps', difficulty: 2,
    catchcopy: 'ケガ知らずの司令塔。J1出場672試合、日本代表152試合',
    events: [
      { season: '2001', label: 'ガンバへ', kind: 'move' },
      { season: '2013', label: '2部', kind: 'down' },
      { season: '2020', label: '磐田へ', kind: 'move' },
    ],
    story: [
      { season: '2009', title: 'アジア最優秀選手', text: 'ガンバ大阪の中心として、アジア年間最優秀選手に選ばれる。' },
      { season: '2013', title: '2部でも33試合', text: 'チームがJ2へ降格しても残留。翌2014年はJリーグMVPに。' },
      { season: '2021', title: '40代でもフル稼働', text: '磐田で年間35試合に出場。日本代表の出場152試合は歴代最多。' },
    ],
  },
  {
    id: 'drogba', file: 8, short: 'ドログバ', nameJa: 'ディディエ・ドログバ', nameEn: 'Didier Drogba', nation: 'コートジボワール',
    position: 'FW', height: 189, foot: '右', metric: 'goals', difficulty: 3,
    catchcopy: '20代前半はフランス2部。遅れて咲いたアフリカの英雄',
    events: [
      { season: '1998-99', label: '2部でプロ入り', kind: 'down' },
      { season: '2003-04', label: 'マルセイユへ', kind: 'move' },
      { season: '2004-05', label: 'チェルシーへ', kind: 'move' },
      { season: '2012', label: '中国へ', kind: 'move' },
      { season: '2015', label: 'カナダへ', kind: 'move' },
    ],
    story: [
      { season: '2000-01', title: '2部で11試合0点', text: 'プロ入り後もしばらくはフランス2部で控え。目立たない存在だった。' },
      { season: '2006-07', title: 'プレミア得点王', text: '28歳、イングランドのチェルシーで20得点。初の得点王に。' },
      { season: '2009-10', title: 'キャリア最多29得点', text: 'キャリア最多の29得点で2度目の得点王。遅咲きのピーク。' },
    ],
  },
  {
    id: 'nakamura', file: 9, short: '中村俊輔', nameJa: '中村 俊輔', nameEn: 'Shunsuke Nakamura', nation: '日本',
    position: 'MF', height: 178, foot: '左', metric: 'goals', difficulty: 3,
    catchcopy: '魔法の左足。22歳と35歳、2度のJリーグMVP',
    events: [
      { season: '2002-03', label: 'イタリアへ', kind: 'move' },
      { season: '2005-06', label: 'スコットランドへ', kind: 'move' },
      { season: '2010', label: '横浜FM復帰', kind: 'return' },
      { season: '2019', label: '2部', kind: 'down' },
    ],
    story: [
      { season: '2000', title: '5得点でMVP', text: '22歳、史上最年少でJリーグMVP。得点は5点でも、試合を動かすのが司令塔。' },
      { season: '2006-07', title: 'スコットランドの年間MVP', text: 'セルティックでリーグ最多の12アシスト。数字に出ない“お膳立て”も一流。' },
      { season: '2013', title: '自己最多の10得点', text: '初のシーズン2桁、10得点。史上初となる2度目のJリーグMVPに。' },
    ],
  },
  {
    id: 'maldini', file: 10, short: 'マルディーニ', nameJa: 'パオロ・マルディーニ', nameEn: 'Paolo Maldini', nation: 'イタリア',
    position: 'DF', height: 186, foot: '右', metric: 'apps', difficulty: 3,
    catchcopy: '16歳デビュー、41歳引退。25シーズン、ミラン一筋',
    events: [
      { season: '1984-85', label: '16歳デビュー', kind: 'debut' },
      { season: '1997-98', label: 'キャプテン', kind: 'honor' },
    ],
    story: [
      { season: '1984-85', title: 'ミランでデビュー', text: '1985年1月、ケガ人の代わりに16歳でセリエAのピッチへ。' },
      { season: '1997-98', title: 'ミランの主将に', text: '30代でも毎年30試合前後。ほぼ休まず守り続けた。' },
      { season: '2008-09', title: '最後まで主力', text: '最後のシーズンも30試合に出場。所属したのは生涯ACミランだけ。' },
    ],
  },
];

const seasons = seasonsJson as Record<string, { birth: string; seasons: Season[] }>;
const credits = creditsJson as Record<string, Credit>;

export const PLAYERS: Player[] = META.map((m) => ({
  ...m,
  birth: seasons[m.id].birth,
  seasons: seasons[m.id].seasons,
  credit: credits[m.id],
  photo: `players/${m.id}.jpg`,
})).sort((a, b) => a.file - b.file);

export const playerById = (id: string) => PLAYERS.find((p) => p.id === id)!;

export const POSITIONS: Record<Position, { name: string; role: string; short: string }> = {
  FW: { name: '点取り屋', role: 'フォワード', short: 'FW' },
  MF: { name: '司令塔', role: 'ミッドフィールダー', short: 'MF' },
  DF: { name: '守備の要', role: 'ディフェンダー', short: 'DF' },
  GK: { name: '守護神', role: 'ゴールキーパー', short: 'GK' },
};

const CLUB_JA: Record<string, string> = {
  'Cerezo Osaka': 'セレッソ大阪', 'Mallorca (loan)': 'マジョルカ', 'Vissel Kobe': 'ヴィッセル神戸',
  'VfL Wolfsburg': 'ヴォルフスブルク', 'Kawasaki Frontale': '川崎フロンターレ', 'FC Tokyo': 'FC東京',
  'Júbilo Iwata': 'ジュビロ磐田', 'Júbilo Iwata (loan)': 'ジュビロ磐田', 'Tokyo Verdy': '東京ヴェルディ',
  'Yokohama F. Marinos': '横浜F・マリノス', Reggina: 'レッジーナ', Celtic: 'セルティック', Espanyol: 'エスパニョール',
  'Yokohama FC': '横浜FC', 'Bellmare Hiratsuka': 'ベルマーレ平塚', Perugia: 'ペルージャ', Roma: 'ローマ',
  Parma: 'パルマ', 'Bologna (loan)': 'ボローニャ', Fiorentina: 'フィオレンティーナ',
  'Bolton Wanderers (loan)': 'ボルトン', 'Yokohama Flügels': '横浜フリューゲルス',
  'Kyoto Purple Sanga': '京都パープルサンガ', 'Gamba Osaka': 'ガンバ大阪', Cruzeiro: 'クルゼイロ', PSV: 'PSV',
  Barcelona: 'バルセロナ', 'Inter Milan': 'インテル', 'Real Madrid': 'レアル・マドリード', 'AC Milan': 'ACミラン',
  'AC Milan (loan)': 'ACミラン', Corinthians: 'コリンチャンス', 'Le Mans': 'ル・マン', Guingamp: 'ギャンガン',
  Marseille: 'マルセイユ', Chelsea: 'チェルシー', 'Shanghai Shenhua': '上海申花', Galatasaray: 'ガラタサライ',
  'Montreal Impact': 'モントリオール', 'Phoenix Rising': 'フェニックス', 'Malmö FF': 'マルメ', Ajax: 'アヤックス',
  Juventus: 'ユヴェントス', 'Paris Saint-Germain': 'パリSG', 'Manchester United': 'マンチェスターU',
  'LA Galaxy': 'LAギャラクシー', 'Tokyo Verdy 1969': '東京ヴェルディ',
};

export const clubJa = (club: string) =>
  club.split(' → ').map((c) => CLUB_JA[c] ?? c).filter((c, i, a) => a.indexOf(c) === i).join('→');

/** League → short Japanese label plus its tier, used for the league strip under the chart. */
const LEAGUE_JA: Record<string, { label: string; tier: 1 | 2; country: string }> = {
  'J1 League': { label: 'J1', tier: 1, country: '日本' },
  'J2 League': { label: 'J2', tier: 2, country: '日本' },
  'La Liga': { label: 'スペイン', tier: 1, country: 'スペイン' },
  Bundesliga: { label: 'ドイツ', tier: 1, country: 'ドイツ' },
  'Serie A': { label: 'イタリア', tier: 1, country: 'イタリア' },
  'Serie B': { label: 'イタリア2部', tier: 2, country: 'イタリア' },
  'Série A': { label: 'ブラジル', tier: 1, country: 'ブラジル' },
  Eredivisie: { label: 'オランダ', tier: 1, country: 'オランダ' },
  'Scottish Premier League': { label: 'スコットランド', tier: 1, country: 'スコットランド' },
  'Premier League': { label: 'イングランド', tier: 1, country: 'イングランド' },
  'French Division 2': { label: 'フランス2部', tier: 2, country: 'フランス' },
  'French Division 1': { label: 'フランス', tier: 1, country: 'フランス' },
  'Ligue 1': { label: 'フランス', tier: 1, country: 'フランス' },
  'Chinese Super League': { label: '中国', tier: 1, country: '中国' },
  'Süper Lig': { label: 'トルコ', tier: 1, country: 'トルコ' },
  MLS: { label: '北米', tier: 1, country: '北米' },
  'Major League Soccer': { label: '北米', tier: 1, country: '北米' },
  USL: { label: '北米2部', tier: 2, country: '北米' },
  Allsvenskan: { label: 'スウェーデン', tier: 1, country: 'スウェーデン' },
  Superettan: { label: 'スウェーデン2部', tier: 2, country: 'スウェーデン' },
};

/** The league a season is filed under; mid-season moves count as the league played in last. */
export const leagueInfo = (league: string) => {
  const last = league.split(' → ').at(-1)!;
  return LEAGUE_JA[last] ?? { label: last, tier: 1 as const, country: last };
};

export const metricValue = (p: Player, s: Season) => (p.metric === 'goals' ? s.goals : s.apps);
export const metricUnit = (p: Player) => (p.metric === 'goals' ? '点' : '試合');
export const metricName = (p: Player) => (p.metric === 'goals' ? 'リーグ得点' : 'リーグ出場数');
