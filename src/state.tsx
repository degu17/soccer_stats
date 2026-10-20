import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CASES } from './data/cases';
import {
  loadSave,
  persistSave,
  resetStoredSave,
  withCaseResult,
  type CaseProgress,
  type CaseResultInput,
  type SaveDataV2,
  type Settings,
} from './lib/save';
import { setSoundEnabled } from './lib/sound';

export type Route =
  | { name: 'title' }
  | { name: 'howto' }
  | { name: 'board' }
  | { name: 'case'; id: string }
  | { name: 'glossary' }
  | { name: 'credits' };

interface Ctx {
  save: SaveDataV2;
  route: Route;
  go: (r: Route) => void;
  toast: (msg: string) => void;
  toggleSound: () => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  unlockTerms: (ids: readonly string[]) => void;
  markTutorialSeen: () => void;
  saveProgress: (progress: CaseProgress) => void;
  clearProgress: (caseId: string) => void;
  recordResult: (input: Omit<CaseResultInput, 'totalCases'>) => {
    isBest: boolean;
    firstClear: boolean;
    best: number;
  };
  resetGameData: () => void;
  dismissMigrationNotice: () => void;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: (ctx: Ctx, toastMsg: string | null) => ComponentChildren }) {
  const [save, setSave] = useState<SaveDataV2>(loadSave);
  const [route, setRoute] = useState<Route>({ name: 'title' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => persistSave(save), [save]);
  useEffect(() => setSoundEnabled(save.settings.sound), [save.settings.sound]);

  const go = useCallback((r: Route) => setRoute(r), []);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1900);
  }, []);

  const toggleSound = useCallback(() => {
    setSave((s) => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }));
  }, []);

  const setSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSave((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  }, []);

  const unlockTerms = useCallback(
    (ids: readonly string[]) => {
      const add = ids.filter((id) => !saveRef.current.terms.includes(id));
      if (!add.length) return;
      setSave((s) => ({ ...s, terms: [...s.terms, ...add.filter((id) => !s.terms.includes(id))] }));
      toast(`用語ノートに ${add.length}語 追加！`);
    },
    [toast],
  );

  const markTutorialSeen = useCallback(() => {
    setSave((s) => (s.tutorialSeen ? s : { ...s, tutorialSeen: true }));
  }, []);

  const saveProgress = useCallback((progress: CaseProgress) => {
    const stamped = { ...progress, updatedAt: new Date().toISOString() };
    const next = {
      ...saveRef.current,
      progress: { ...saveRef.current.progress, [stamped.caseId]: stamped },
    };
    saveRef.current = next;
    setSave(next);
  }, []);

  const clearProgress = useCallback((caseId: string) => {
    const { [caseId]: _removed, ...rest } = saveRef.current.progress;
    const next = { ...saveRef.current, progress: rest };
    saveRef.current = next;
    setSave(next);
  }, []);

  const recordResult = useCallback((input: Omit<CaseResultInput, 'totalCases'>) => {
    const outcome = withCaseResult(saveRef.current, {
      ...input,
      totalCases: CASES.length,
    });
    saveRef.current = outcome.save;
    setSave(outcome.save);
    return { isBest: outcome.isBest, firstClear: outcome.firstClear, best: outcome.best };
  }, []);

  const resetGameData = useCallback(() => {
    const next = resetStoredSave();
    saveRef.current = next;
    setSave(next);
    setRoute({ name: 'title' });
    toast('事件データをリセットしました');
  }, [toast]);

  const dismissMigrationNotice = useCallback(() => {
    setSave((s) => ({ ...s, migrationNotice: false }));
  }, []);

  const ctx = useMemo(
    () => ({
      save,
      route,
      go,
      toast,
      toggleSound,
      setSetting,
      unlockTerms,
      markTutorialSeen,
      saveProgress,
      clearProgress,
      recordResult,
      resetGameData,
      dismissMigrationNotice,
    }),
    [
      save,
      route,
      go,
      toast,
      toggleSound,
      setSetting,
      unlockTerms,
      markTutorialSeen,
      saveProgress,
      clearProgress,
      recordResult,
      resetGameData,
      dismissMigrationNotice,
    ],
  );

  return <AppCtx.Provider value={ctx}>{children(ctx, toastMsg)}</AppCtx.Provider>;
}
