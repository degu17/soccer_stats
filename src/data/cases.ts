import type {
  CaseBundle,
  CaseFile,
  Clue,
  FreeClue,
  SourceRef,
  SuspectProfile,
} from './caseTypes';
import { validateCaseBundle } from '../lib/caseEngine';

const RETRIEVED = '2026-10-20';

const wiki = (label: string, url: string): SourceRef => ({
  label,
  url,
  retrievedAt: RETRIEVED,
  license: 'CC BY-SA',
});

const localSeasons: SourceRef = {
  label: 'src/data/seasons.json',
  url: 'local:src/data/seasons.json',
  retrievedAt: RETRIEVED,
};

const jleague: SourceRef = {
  label: 'J.League Data Site',
  url: 'https://data.j-league.or.jp/',
  retrievedAt: RETRIEVED,
};

const ENDO: SuspectProfile = {
  id: 'endo',
  nameJa: '遠藤 保仁',
  nameEn: 'Yasuhito Endo',
  photo: 'players/endo.jpg',
  photoStatus: 'ready',
  position: 'MF',
  nation: '日本',
  birthYear: 1980,
  height: 178,
  foot: '右',
  careerSpan: { from: 1998, to: 2023 },
  clubCount: 4,
  clubs: [
    { name: 'Yokohama Flügels', nameJa: '横浜フリューゲルス', country: '日本', from: 1998, to: 1998 },
    { name: 'Kyoto Purple Sanga', nameJa: '京都パープルサンガ', country: '日本', from: 1999, to: 2000 },
    { name: 'Gamba Osaka', nameJa: 'ガンバ大阪', country: '日本', from: 2001, to: 2020 },
    { name: 'Júbilo Iwata', nameJa: 'ジュビロ磐田', country: '日本', from: 2020, to: 2023 },
  ],
  overseas: false,
  careerApps: 775,
  careerGoals: 113,
  caps: 152,
  j1Titles: 2,
  mvpCount: 1,
  mvpAges: [34],
  lastTier: 2,
  honors: [
    'J1リーグ優勝 2回（2005, 2014）',
    'J1 MVP 2014',
    'アジア年間最優秀選手 2009',
    '日本代表152試合（歴代最多）',
  ],
  tags: ['海外未経験', '長期キャリア', 'J2経験', '代表記録'],
  sparkline: [16, 29, 33, 34, 31, 20],
  sources: [
    wiki('Wikipedia: Yasuhito Endo', 'https://en.wikipedia.org/wiki/Yasuhito_Endo'),
    localSeasons,
    jleague,
  ],
};

const NAKAMURA: SuspectProfile = {
  id: 'nakamura',
  nameJa: '中村 俊輔',
  nameEn: 'Shunsuke Nakamura',
  photo: 'players/nakamura.jpg',
  photoStatus: 'ready',
  position: 'MF',
  nation: '日本',
  birthYear: 1978,
  height: 178,
  foot: '左',
  careerSpan: { from: 1997, to: 2022 },
  clubCount: 6,
  clubs: [
    { name: 'Yokohama F. Marinos', nameJa: '横浜F・マリノス', country: '日本', from: 1997, to: 2002 },
    { name: 'Reggina', nameJa: 'レッジーナ', country: 'イタリア', from: 2002, to: 2005 },
    { name: 'Celtic', nameJa: 'セルティック', country: 'スコットランド', from: 2005, to: 2009 },
    { name: 'Espanyol', nameJa: 'エスパニョール', country: 'スペイン', from: 2009, to: 2010 },
    { name: 'Yokohama F. Marinos', nameJa: '横浜F・マリノス', country: '日本', from: 2010, to: 2016 },
    { name: 'Júbilo Iwata', nameJa: 'ジュビロ磐田', country: '日本', from: 2017, to: 2019 },
    { name: 'Yokohama FC', nameJa: '横浜FC', country: '日本', from: 2019, to: 2022 },
  ],
  overseas: true,
  careerApps: 645,
  careerGoals: 114,
  caps: 98,
  j1Titles: 0,
  mvpCount: 2,
  mvpAges: [22, 35],
  lastTier: 2,
  honors: [
    'J1 MVP 2000, 2013',
    'スコットランド・プレミアリーグ優勝 3回',
    'スコットランド年間MVP 2007',
  ],
  tags: ['左足', '海外経験', 'J1 MVP 2回', 'J2経験'],
  sparkline: [27, 30, 37, 33, 30, 16],
  sources: [
    wiki('Wikipedia: Shunsuke Nakamura', 'https://en.wikipedia.org/wiki/Shunsuke_Nakamura'),
    localSeasons,
    jleague,
  ],
};

const NAKATA: SuspectProfile = {
  id: 'nakata',
  nameJa: '中田 英寿',
  nameEn: 'Hidetoshi Nakata',
  photo: 'players/nakata.jpg',
  photoStatus: 'ready',
  position: 'MF',
  nation: '日本',
  birthYear: 1977,
  height: 175,
  foot: '右',
  careerSpan: { from: 1995, to: 2006 },
  clubCount: 7,
  clubs: [
    { name: 'Bellmare Hiratsuka', nameJa: 'ベルマーレ平塚', country: '日本', from: 1995, to: 1998 },
    { name: 'Perugia', nameJa: 'ペルージャ', country: 'イタリア', from: 1998, to: 2000 },
    { name: 'Roma', nameJa: 'ローマ', country: 'イタリア', from: 2000, to: 2001 },
    { name: 'Parma', nameJa: 'パルマ', country: 'イタリア', from: 2001, to: 2004 },
    { name: 'Bologna', nameJa: 'ボローニャ', country: 'イタリア', from: 2004, to: 2004, loan: true },
    { name: 'Fiorentina', nameJa: 'フィオレンティーナ', country: 'イタリア', from: 2004, to: 2006 },
    { name: 'Bolton Wanderers', nameJa: 'ボルトン', country: 'イングランド', from: 2005, to: 2006, loan: true },
  ],
  overseas: true,
  careerApps: 288,
  careerGoals: 41,
  caps: 77,
  j1Titles: 0,
  mvpCount: 0,
  mvpAges: [],
  lastTier: 1,
  honors: ['セリエA優勝 2000-01（ローマ）', '日本代表77試合'],
  tags: ['海外経験', '29歳で引退', 'セリエA優勝'],
  sparkline: [26, 33, 30, 15, 31, 20],
  sources: [
    wiki('Wikipedia: Hidetoshi Nakata', 'https://en.wikipedia.org/wiki/Hidetoshi_Nakata'),
    localSeasons,
  ],
};

const ONO: SuspectProfile = {
  id: 'ono',
  nameJa: '小野 伸二',
  nameEn: 'Shinji Ono',
  photo: 'players/ono.jpg',
  photoStatus: 'ready',
  position: 'MF',
  nation: '日本',
  birthYear: 1979,
  height: 175,
  foot: '右',
  careerSpan: { from: 1998, to: 2023 },
  clubCount: 7,
  clubs: [
    { name: 'Urawa Reds', nameJa: '浦和レッズ', country: '日本', from: 1998, to: 2001 },
    { name: 'Feyenoord', nameJa: 'フェイエノールト', country: 'オランダ', from: 2001, to: 2005 },
    { name: 'Urawa Reds', nameJa: '浦和レッズ', country: '日本', from: 2006, to: 2007 },
    { name: 'VfL Bochum', nameJa: 'ボーフム', country: 'ドイツ', from: 2008, to: 2009 },
    { name: 'Shimizu S-Pulse', nameJa: '清水エスパルス', country: '日本', from: 2010, to: 2012 },
    { name: 'Western Sydney Wanderers', nameJa: 'ウェスタン・シドニー', country: 'オーストラリア', from: 2012, to: 2014 },
    { name: 'Hokkaido Consadole Sapporo', nameJa: 'コンサドーレ札幌', country: '日本', from: 2014, to: 2019 },
    { name: 'FC Ryukyu', nameJa: 'FC琉球', country: '日本', from: 2019, to: 2020 },
    { name: 'Hokkaido Consadole Sapporo', nameJa: 'コンサドーレ札幌', country: '日本', from: 2021, to: 2023 },
  ],
  overseas: true,
  careerApps: 481,
  careerGoals: 66,
  caps: 56,
  j1Titles: 1,
  mvpCount: 0,
  mvpAges: [],
  lastTier: 1,
  honors: ['UEFAカップ優勝 2001-02', 'J1優勝 2006', 'AFCチャンピオンズリーグ優勝 2007'],
  tags: ['海外経験', '天才', 'J1優勝', 'ケガ'],
  sparkline: [27, 30, 29, 24, 17, 1],
  sources: [wiki('Wikipedia: Shinji Ono', 'https://en.wikipedia.org/wiki/Shinji_Ono')],
};

const INAMOTO: SuspectProfile = {
  id: 'inamoto',
  nameJa: '稲本 潤一',
  nameEn: 'Junichi Inamoto',
  photo: 'players/inamoto.jpg',
  photoStatus: 'ready',
  position: 'MF',
  nation: '日本',
  birthYear: 1979,
  height: 181,
  foot: '右',
  careerSpan: { from: 1997, to: 2024 },
  clubCount: 12,
  clubs: [
    { name: 'Gamba Osaka', nameJa: 'ガンバ大阪', country: '日本', from: 1997, to: 2004 },
    { name: 'Arsenal', nameJa: 'アーセナル', country: 'イングランド', from: 2001, to: 2002, loan: true },
    { name: 'Fulham', nameJa: 'フラム', country: 'イングランド', from: 2002, to: 2004, loan: true },
    { name: 'West Bromwich Albion', nameJa: 'WBA', country: 'イングランド', from: 2004, to: 2006 },
    { name: 'Cardiff City', nameJa: 'カーディフ', country: 'ウェールズ', from: 2004, to: 2005, loan: true },
    { name: 'Galatasaray', nameJa: 'ガラタサライ', country: 'トルコ', from: 2006, to: 2007 },
    { name: 'Eintracht Frankfurt', nameJa: 'フランクフルト', country: 'ドイツ', from: 2007, to: 2009 },
    { name: 'Rennes', nameJa: 'レンヌ', country: 'フランス', from: 2009, to: 2010 },
    { name: 'Kawasaki Frontale', nameJa: '川崎フロンターレ', country: '日本', from: 2010, to: 2014 },
    { name: 'Hokkaido Consadole Sapporo', nameJa: 'コンサドーレ札幌', country: '日本', from: 2015, to: 2018 },
    { name: 'SC Sagamihara', nameJa: 'SC相模原', country: '日本', from: 2019, to: 2021 },
    { name: 'Nankatsu SC', nameJa: '南葛SC', country: '日本', from: 2022, to: 2024 },
  ],
  overseas: true,
  careerApps: 441,
  careerGoals: 25,
  caps: 82,
  j1Titles: 0,
  mvpCount: 0,
  mvpAges: [],
  lastTier: 5,
  honors: ['UEFAインタートトゥカップ優勝 2002', 'J2優勝 2016', '日本代表82試合'],
  tags: ['海外経験', 'プレミアリーグ', '多数クラブ', '下部リーグ'],
  sparkline: [27, 28, 25, 31, 9, 2],
  sources: [wiki('Wikipedia: Junichi Inamoto', 'https://en.wikipedia.org/wiki/Junichi_Inamoto')],
};

const KENGO: SuspectProfile = {
  id: 'kengo',
  nameJa: '中村 憲剛',
  nameEn: 'Kengo Nakamura',
  photo: 'players/kengo.jpg',
  photoStatus: 'ready',
  position: 'MF',
  nation: '日本',
  birthYear: 1980,
  height: 175,
  foot: '右',
  careerSpan: { from: 2003, to: 2020 },
  clubCount: 1,
  clubs: [
    { name: 'Kawasaki Frontale', nameJa: '川崎フロンターレ', country: '日本', from: 2003, to: 2020 },
  ],
  overseas: false,
  careerApps: 546,
  careerGoals: 83,
  caps: 68,
  j1Titles: 3,
  mvpCount: 1,
  mvpAges: [36],
  lastTier: 1,
  honors: ['J1リーグ優勝 3回（2017, 2018, 2020）', 'J1 MVP 2016', 'Jリーグカップ優勝 2019'],
  tags: ['ワンクラブ', '海外未経験', 'J1優勝3回', '30代MVP'],
  sparkline: [34, 41, 34, 33, 20, 13],
  sources: [wiki('Wikipedia: Kengo Nakamura', 'https://en.wikipedia.org/wiki/Kengo_Nakamura')],
};

export const SUSPECTS: SuspectProfile[] = [ENDO, NAKAMURA, NAKATA, ONO, INAMOTO, KENGO];

export const suspectById = (id: string): SuspectProfile =>
  SUSPECTS.find((s) => s.id === id) ?? SUSPECTS[0];

const free2010s: FreeClue = {
  id: 'free-2010s',
  text: '2010年代も現役',
  effect: { kind: 'careerSpanIncludes', from: 2010, to: 2019 },
};

const clue = (input: Clue): Clue => input;

const CASE_001_CLUES: Clue[] = [
  clue({
    id: 'c1',
    title: '海外キャリア',
    question: '海外のクラブでプレーしたことは？',
    answerText: 'ない',
    cost: 1,
    effect: { kind: 'noOverseas' },
    lessonId: 'overseas',
    tags: ['profile', 'career', 'bargain'],
    revealText: '海外経験の有無がわかる',
  }),
  clue({
    id: 'c2',
    title: '所属クラブ数',
    question: 'プロ生活で所属したクラブはいくつ？',
    answerText: '4つ以下',
    cost: 1,
    effect: { kind: 'maxClubs', value: 4 },
    lessonId: 'club-count',
    tags: ['career', 'bargain'],
    revealText: 'キャリアの選び方がわかる',
  }),
  clue({
    id: 'c3',
    title: 'リーグ通算得点',
    question: 'リーグ戦の通算得点は？',
    answerText: '100点以上',
    cost: 2,
    effect: { kind: 'minCareerGoals', value: 100 },
    lessonId: 'total-goals',
    tags: ['stats', 'goals'],
    revealText: '得点力の目安がわかる',
  }),
  clue({
    id: 'c4',
    title: '日本代表',
    question: '日本代表の出場試合数は？',
    answerText: '100試合以上',
    cost: 3,
    effect: { kind: 'minCaps', value: 100 },
    lessonId: 'caps',
    tags: ['stats', 'national-team', 'decisive'],
    revealText: '代表に選ばれ続けたかわかる',
  }),
  clue({
    id: 'c5',
    title: 'J1優勝',
    question: 'J1リーグの優勝回数は？',
    answerText: '2回以上',
    cost: 2,
    effect: { kind: 'minJ1Titles', value: 2 },
    lessonId: 'titles',
    tags: ['honors', 'j1'],
    revealText: '勝ち方を知っているかわかる',
  }),
  clue({
    id: 'c6',
    title: '30代のMVP',
    question: '30歳以降にJ1 MVPを獲ったことは？',
    answerText: 'ある',
    cost: 2,
    effect: { kind: 'mvpAtAge', min: 30 },
    lessonId: 'mvp',
    tags: ['honors', 'weak'],
    revealText: '息の長さがわかる',
  }),
  clue({
    id: 'c7',
    title: '最終シーズン',
    question: '最後のシーズン、所属したリーグは？',
    answerText: '2部',
    cost: 1,
    effect: { kind: 'lastTier', value: 2 },
    lessonId: 'league-tier',
    tags: ['career', 'ending', 'bargain'],
    revealText: 'キャリアの終わり方がわかる',
  }),
  clue({
    id: 'c8',
    title: '身長',
    question: '身長は？',
    answerText: '178cm',
    cost: 1,
    effect: { kind: 'height', value: 178 },
    lessonId: 'height',
    tags: ['profile', 'body', 'bargain'],
    revealText: '体格の違いがわかる',
  }),
];

const CASE_002_CLUES: Clue[] = [
  clue({
    id: 'c1',
    title: '海外3か国',
    question: '海外のクラブでプレーした国はいくつ？',
    answerText: '3か国',
    cost: 2,
    effect: { kind: 'overseasCountries', value: 3 },
    lessonId: 'overseas',
    tags: ['profile', 'career', 'countries'],
    revealText: '海外で戦った国数がわかる',
  }),
  clue({
    id: 'c2',
    title: 'J1 MVP',
    question: 'J1リーグの年間MVPを獲った回数は？',
    answerText: '2回',
    cost: 3,
    effect: { kind: 'attribute', key: 'mvpCount', op: 'gte', value: 2 },
    lessonId: 'mvp',
    tags: ['honors', 'decisive'],
    revealText: '頂点に立った回数がわかる',
  }),
  clue({
    id: 'c3',
    title: '30代のMVP',
    question: '30歳以降にJ1 MVPを獲ったことは？',
    answerText: 'ある',
    cost: 2,
    effect: { kind: 'mvpAtAge', min: 30 },
    lessonId: 'mvp',
    tags: ['honors', 'age'],
    revealText: '30代でも頂点に立てたかわかる',
  }),
  clue({
    id: 'c4',
    title: '最終シーズン',
    question: '最後のシーズン、所属したリーグは？',
    answerText: '2部',
    cost: 2,
    effect: { kind: 'lastTier', value: 2 },
    lessonId: 'league-tier',
    tags: ['career', 'ending'],
    revealText: 'キャリアの終わり方がわかる',
  }),
  clue({
    id: 'c5',
    title: '身長',
    question: '身長は？',
    answerText: '178cm',
    cost: 2,
    effect: { kind: 'height', value: 178 },
    lessonId: 'height',
    tags: ['profile', 'body'],
    revealText: '体格の違いがわかる',
  }),
  clue({
    id: 'c6',
    title: '日本代表',
    question: '日本代表の出場試合数は？',
    answerText: '90試合以上',
    cost: 2,
    effect: { kind: 'minCaps', value: 90 },
    lessonId: 'caps',
    tags: ['stats', 'national-team'],
    revealText: '代表での経験がわかる',
  }),
  clue({
    id: 'c7',
    title: '所属クラブ数',
    question: 'プロ生活で所属したクラブは？',
    answerText: '6つ以上',
    cost: 1,
    effect: { kind: 'attribute', key: 'clubCount', op: 'gte', value: 6 },
    lessonId: 'club-count',
    tags: ['career', 'bargain'],
    revealText: 'キャリアの寄り道がわかる',
  }),
  clue({
    id: 'c8',
    title: 'J1優勝',
    question: 'J1リーグの優勝回数は？',
    answerText: '0回',
    cost: 2,
    effect: { kind: 'attribute', key: 'j1Titles', op: 'eq', value: 0 },
    lessonId: 'titles',
    tags: ['honors', 'j1'],
    revealText: '国内リーグの頂点に立ったかわかる',
  }),
];

const commonScoring = {
  tokens: 6,
  evidenceCount: 2 as const,
  correct: 50,
  tightEvidence: 30,
  validEvidence: 20,
  weakEvidence: 10,
  efficiency: 20,
  wrongAccusationPenalty: 10,
  hintPenalty: 0,
};

const TUTORIAL_REVEAL: CaseFile['reveal'] = {
  catchcopy: '18歳でデビュー、43歳で引退。線は、静かに長く続いた。',
  story: [
    {
      order: 1,
      season: '1998',
      title: '18歳でプロへ',
      text: '横浜フリューゲルスでデビュー。翌年は京都パープルサンガへ。2001年、ガンバ大阪に移る。ここから20年、ガンバの中心になる。',
    },
    {
      order: 2,
      season: '2023',
      title: '43歳で引退',
      text: '40歳を過ぎてもジュビロ磐田でプレー。日本代表152試合は歴代最多。26シーズン、同じレベルを続けた。',
    },
  ],
  lesson: {
    id: 'lesson-cross',
    title: '2つの手がかりの交点が、答え',
    body: '「海外経験なし」で2人。「通算100得点以上」で別の2人。2つの条件を重ねると、両方に当てはまるのは1人だけ。1枚では決まらない手がかりも、2枚重ねると証拠になる。',
    termIds: ['evidence', 'overseas', 'total-goals', 'caps'],
  },
  sources: [
    wiki('Wikipedia: Yasuhito Endo', 'https://en.wikipedia.org/wiki/Yasuhito_Endo'),
    jleague,
  ],
};

const CASE_001_REVEAL: CaseFile['reveal'] = {
  catchcopy: '18歳でデビュー、43歳で引退。線は、静かに長く続いた。',
  story: [
    {
      order: 1,
      season: '1998',
      title: '18歳でプロへ',
      text: '横浜フリューゲルスでデビュー。翌年は京都パープルサンガへ。2001年、ガンバ大阪に移る。ここから20年、ガンバの中心になる。',
    },
    {
      order: 2,
      season: '2013',
      title: 'J2でも33試合',
      text: 'ガンバがJ2に降格。33歳の遠藤は残留し、33試合に出場。翌2014年、J1に戻ったチームを優勝に導き、J1 MVPに。年齢は34歳だった。',
    },
    {
      order: 3,
      season: '2023',
      title: '43歳で引退',
      text: '40歳を過ぎてもジュビロ磐田で35試合に出場。日本代表152試合は歴代最多。43歳でスパイクを脱いだ。',
    },
  ],
  lesson: {
    id: 'lesson-total',
    title: '通算記録は「長く続けた人」の記録',
    body: '775試合は、26シーズンで割ると約29.8試合/年。ほぼ毎年、リーグ戦の大半に出ていたということ。113得点はMFとしては多いが、1試合あたり0.15点。点取り屋ではなく、試合を組み立てる選手だった。152キャップは、20年間、代表に選ばれ続けた記録。通算は「すごいプレーを1回した」ではなく、「同じレベルを長く続けた」証明。でも、1試合あたりに直すと役割が見える。',
    termIds: ['total', 'pergame', 'caps', 'league-tier'],
  },
  sources: [
    wiki('Wikipedia: Yasuhito Endo', 'https://en.wikipedia.org/wiki/Yasuhito_Endo'),
    jleague,
  ],
};

const CASE_002_REVEAL: CaseFile['reveal'] = {
  catchcopy: '左足で曲げた、二度のMVP。遠回りした線が、最後に故郷へ戻った。',
  story: [
    {
      order: 1,
      season: '1997',
      title: '横浜FMでプロへ',
      text: '横浜F・マリノスでプロデビュー。10代から左足の精度で注目される。2000年、22歳でJ1 MVP。',
    },
    {
      order: 2,
      season: '2005',
      title: 'セルティックの左足',
      text: 'イタリア、スコットランド、スペインの3か国でプレー。セルティックではフリーキックで欧州を沸かせ、2007年にスコットランド年間MVP。',
    },
    {
      order: 3,
      season: '2013',
      title: '35歳で、もう一度MVP',
      text: '横浜F・マリノスに戻り、35歳でJ1 MVP。22歳から13年後、二度目の頂点。2019年からは横浜FCでJ2を戦い、2022年に44歳で引退した。',
    },
  ],
  lesson: {
    id: 'lesson-mvp',
    title: 'MVPの「回数」と「年齢」で、山の形が見える',
    body: 'MVPは、その年のリーグで最も優れた選手に贈られる。中村俊輔は22歳と35歳で受賞。13年離れた2つの山は、同じ選手が違うサッカーで頂点に立った証拠。645試合・114得点は、1試合あたり0.18点。点取り屋ではないが、決めるべき時に決めた。98キャップは100に届かなかったが、20年間、代表に選ばれ続けた記録。',
    termIds: ['mvp', 'overseas', 'club-count', 'league-tier', 'caps'],
  },
  sources: [
    wiki('Wikipedia: Shunsuke Nakamura', 'https://en.wikipedia.org/wiki/Shunsuke_Nakamura'),
    jleague,
  ],
};

export const TUTORIAL: CaseFile = {
  id: 'case-000',
  volumeId: 'tutorial',
  number: 0,
  title: 'はじめての事件',
  subtitle: '2枚の手がかりを重ねる',
  difficulty: 'easy',
  estimatedMinutes: 3,
  answerId: 'endo',
  suspectIds: ['endo', 'nakamura', 'nakata', 'kengo'],
  freeClues: [free2010s],
  clues: CASE_001_CLUES.filter((c) => ['c1', 'c3', 'c4', 'c8'].includes(c.id)),
  hook: '4人の容疑者。2枚の手がかりで、1人に絞れる。',
  reveal: TUTORIAL_REVEAL,
  scoring: { ...commonScoring },
  validation: {
    optimalTokens: 2,
    optimalExample: ['c1', 'c8'],
    exampleTightPairs: [['c1', 'c3'], ['c1', 'c8']],
    learningGoal: '2つの手がかりの交点が1人になる感覚をつかむ。',
  },
  tutorial: true,
  volumeTitle: 'チュートリアル',
  otherReasons: {
    nakamura: '海外経験があり、最終季はJ2。だが「海外経験なし」に該当しない。',
    nakata: '2006年に29歳で引退。2010年代の現役ではない。',
    kengo: '海外未経験で30代MVP。だが通算83得点で「100点以上」に届かない。',
  },
};

export const CASE_001: CaseFile = {
  id: 'case-001',
  volumeId: 'vol-01',
  number: 1,
  title: '途切れない線',
  subtitle: '26シーズン、一度も途切れなかった',
  difficulty: 'normal',
  estimatedMinutes: 6,
  answerId: 'endo',
  suspectIds: ['endo', 'nakamura', 'nakata', 'ono', 'inamoto', 'kengo'],
  freeClues: [free2010s],
  clues: CASE_001_CLUES,
  hook: '長く現役を続けた、静かな記録破り。その線は、一度も途切れなかった。',
  reveal: CASE_001_REVEAL,
  scoring: { ...commonScoring },
  validation: {
    optimalTokens: 2,
    optimalExample: ['c1', 'c7'],
    exampleTightPairs: [
      ['c1', 'c3'],
      ['c1', 'c7'],
      ['c1', 'c8'],
      ['c2', 'c3'],
      ['c2', 'c7'],
      ['c2', 'c8'],
      ['c3', 'c5'],
      ['c5', 'c7'],
      ['c5', 'c8'],
    ],
    learningGoal: '2つの手がかりを重ねると1人に絞れる。通算記録は長く続けた証明。',
  },
  tutorial: false,
  volumeTitle: 'Vol.1 日本代表の系譜',
  otherReasons: {
    nakamura: '左足。海外（イタリア・スコットランド・スペイン）でプレー。所属6クラブ。J1優勝0回。',
    nakata: '2006年に29歳で引退。2010年代の現役ではない。通算288試合。',
    ono: '海外（オランダ・ドイツ・オーストラリア）でプレー。所属7クラブ。通算66得点。',
    inamoto: '海外（イングランド・トルコ・ドイツ・フランス）でプレー。所属12クラブ。通算25得点。',
    kengo: '175cm。通算83得点。最終季はJ1。遠藤と最も近いが、得点・身長・最終季で切れる。',
  },
};

export const CASE_002: CaseFile = {
  id: 'case-002',
  volumeId: 'vol-01',
  number: 2,
  title: '左足の魔法',
  subtitle: '二度のMVPは、13年離れていた',
  difficulty: 'normal',
  estimatedMinutes: 7,
  answerId: 'nakamura',
  suspectIds: ['endo', 'nakamura', 'nakata', 'ono', 'inamoto', 'kengo'],
  freeClues: [free2010s],
  clues: CASE_002_CLUES,
  hook: '美しい弧線は、二度、頂点を描いた。遠回りした線の先に、もう一つの山がある。',
  reveal: CASE_002_REVEAL,
  scoring: { ...commonScoring },
  validation: {
    optimalTokens: 3,
    optimalExample: ['c7', 'c4'],
    exampleTightPairs: [
      ['c7', 'c4'],
      ['c7', 'c5'],
      ['c7', 'c6'],
      ['c7', 'c3'],
      ['c1', 'c8'],
    ],
    learningGoal: 'MVPの回数と年齢でキャリアの山を読む。海外3か国と最終季を組み合わせる。',
  },
  tutorial: false,
  volumeTitle: 'Vol.1 日本代表の系譜',
  otherReasons: {
    endo: '海外経験なし。J1 MVPは34歳の1回。所属4クラブ。最終季はJ2だが「海外3か国」ではない。',
    ono: '海外3か国だが、J1優勝1回、最終季はJ1。MVPは0回。',
    inamoto: '海外4か国。J1優勝0回だが、所属12クラブ、MVPは0回。',
    kengo: '海外未経験。J1優勝3回、MVPは36歳の1回。所属クラブは1つ。',
    nakata: '2010年代の現役ではない。2006年に29歳で引退。',
  },
};

export const CASES: CaseFile[] = [TUTORIAL, CASE_001, CASE_002];

export const PLAYABLE_CASES: CaseFile[] = [CASE_001, CASE_002];

const bundleOf = (caseFile: CaseFile): CaseBundle => ({ caseFile, suspects: SUSPECTS });

export const CASE_BUNDLES: CaseBundle[] = CASES.map(bundleOf);

export function caseById(id: string): CaseFile | undefined {
  return CASES.find((c) => c.id === id);
}

export function getCaseBundle(id: string): CaseBundle | undefined {
  const caseFile = caseById(id);
  return caseFile ? bundleOf(caseFile) : undefined;
}

export function firstUnsolvedCase(solvedIds: readonly string[]): CaseFile {
  return PLAYABLE_CASES.find((c) => !solvedIds.includes(c.id)) ?? PLAYABLE_CASES[PLAYABLE_CASES.length - 1];
}

export function nextCaseAfter(id: string): CaseFile | undefined {
  if (id === TUTORIAL.id) return CASE_001;
  if (id === CASE_001.id) return CASE_002;
  return undefined;
}

export const TUTORIAL_ID = TUTORIAL.id;
export const VOLUME_TITLE = 'Vol.1 日本代表の系譜';

if (import.meta.env.DEV) {
  for (const bundle of CASE_BUNDLES) {
    const errors = validateCaseBundle(bundle);
    if (errors.length) {
      console.error(`[case validation] ${bundle.caseFile.id}`, errors);
    }
  }
}
