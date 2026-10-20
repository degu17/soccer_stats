export interface AchievementDef {
  id: string;
  mark: string;
  title: string;
  detail: string;
}

/** Unlock ids are written by `withCaseResult` in lib/save.ts. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-clear', mark: '✓', title: '初解決', detail: 'はじめて事件を解決した' },
  { id: 's-rank', mark: 'S', title: 'Sランク', detail: '事件をSランクで解決した' },
  { id: 'two-clue-s', mark: '2', title: '2pt以内でS', detail: '手がかり2pt以内でSランク' },
  { id: 'all-clear', mark: '全', title: '全事件解決', detail: 'チュートリアルと全ファイルを解決' },
];
