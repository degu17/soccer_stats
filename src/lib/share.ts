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
