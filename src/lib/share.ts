import type { Rank } from './score';
import { MAX_TOTAL, RANK_TITLE } from './score';
import type { CaseScores } from './store';

const bar = (v: number, max: number) => {
  const n = Math.round((v / max) * 5);
  return '■'.repeat(n) + '□'.repeat(5 - n);
};

/** Spoiler-free result text: no player name, so friends can play the same file. */
export function shareText(file: number, s: CaseScores, total: number, rank: Rank) {
  return [
    `🔎 この数字、だれ？ FILE ${String(file).padStart(2, '0')}`,
    `目利き ${bar(s.estimate, 100)} ${s.estimate}`,
    `見抜き ${bar(s.profile, 100)} ${s.profile}`,
    `描く　 ${bar(s.draw, 100)} ${s.draw}`,
    `合計 ${total}/${MAX_TOTAL}（${rank}・${RANK_TITLE[rank]}）`,
    '#スタッツ探偵',
  ].join('\n');
}

export function shareAllText(total: number, max: number, rank: Rank) {
  return [`🔎 この数字、だれ？ 全10事件 解決！`, `総合 ${total}/${max}（${rank}・${RANK_TITLE[rank]}）`, '#スタッツ探偵'].join('\n');
}

/** execCommand fallback for frames that refuse the async clipboard API. */
function legacyCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/**
 * Share the result text. Inside an embedding frame (e.g. a hosted artifact) the share sheet is
 * refused, so copy straight away while the click still counts as a user gesture.
 */
export async function shareOrCopy(text: string, toast: (msg: string) => void) {
  const embedded = window.self !== window.top;
  if (!embedded && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // the player closed the share sheet
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('結果をコピーしました');
  } catch {
    toast(legacyCopy(text) ? '結果をコピーしました' : 'コピーできませんでした');
  }
}
