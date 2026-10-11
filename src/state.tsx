import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { load, persist, type CaseScores, type Save } from './lib/store';
import { rankOf } from './lib/score';
import { setSoundEnabled } from './lib/sound';

export type Route =
  | { name: 'title' }
  | { name: 'howto'; then: Route }
  | { name: 'board' }
  | { name: 'case'; id: string }
  | { name: 'glossary' }
  | { name: 'complete' }
  | { name: 'credits' };

interface Ctx {
  save: Save;
  route: Route;
  go: (r: Route) => void;
  toast: (msg: string) => void;
  toggleSound: () => void;
  unlockTerms: (ids: readonly string[]) => void;
  recordCase: (id: string, scores: CaseScores) => { total: number; isBest: boolean; firstClear: boolean };
  markTutorialSeen: () => void;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: (ctx: Ctx, toastMsg: string | null) => ComponentChildren }) {
  const [save, setSave] = useState<Save>(load);
  const [route, setRoute] = useState<Route>({ name: 'title' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  // Read through a ref so callbacks can see the latest save synchronously.
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => persist(save), [save]);
  useEffect(() => setSoundEnabled(save.sound), [save.sound]);

  const go = useCallback((r: Route) => setRoute(r), []);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1800);
  }, []);
  const toggleSound = useCallback(() => setSave((s) => ({ ...s, sound: !s.sound })), []);
  const unlockTerms = useCallback(
    (ids: readonly string[]) => {
      const add = ids.filter((id) => !saveRef.current.terms.includes(id));
      if (!add.length) return;
      setSave((s) => ({ ...s, terms: [...s.terms, ...add.filter((id) => !s.terms.includes(id))] }));
      toast(`用語ノートに ${add.length}語 追加！`);
    },
    [toast],
  );
  const markTutorialSeen = useCallback(() => setSave((s) => (s.tutorialSeen ? s : { ...s, tutorialSeen: true })), []);

  const recordCase = useCallback((id: string, scores: CaseScores) => {
    const total = scores.estimate + scores.profile + scores.draw + scores.bonus;
    const prev = saveRef.current.results[id];
    const isBest = !prev || total > prev.best;
    const best = Math.max(total, prev?.best ?? 0);
    const next = {
      ...saveRef.current,
      results: {
        ...saveRef.current.results,
        [id]: { best, bestRank: rankOf(best), last: scores, plays: (prev?.plays ?? 0) + 1 },
      },
    };
    saveRef.current = next;
    setSave(next);
    return { total, isBest, firstClear: !prev };
  }, []);

  const ctx = useMemo(
    () => ({ save, route, go, toast, toggleSound, unlockTerms, recordCase, markTutorialSeen }),
    [save, route, go, toast, toggleSound, unlockTerms, recordCase, markTutorialSeen],
  );

  return <AppCtx.Provider value={ctx}>{children(ctx, toastMsg)}</AppCtx.Provider>;
}
