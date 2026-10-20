import { useEffect, useState } from 'preact/hooks';
import { CASES, PLAYABLE_CASES, caseById, firstUnsolvedCase } from '../data/cases';
import { useApp } from '../state';
import { sfx } from '../lib/sound';
import { IconArrow, IconSoundOff, IconSoundOn } from '../components/icons';
import { Modal } from './detective/CaseBits';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function Title() {
  const app = useApp();
  const { save } = app;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    return standalone || iosStandalone;
  });

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    sfx.tap();
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // The browser can expire an install prompt; hiding it is the safe fallback.
    } finally {
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    if (!save.migrationNotice) return;
    app.toast('保存データを更新しました。設定と用語は引き継がれています。');
    app.dismissMigrationNotice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save.migrationNotice]);

  const solvedIds = CASES.filter((c) => Boolean(save.results[c.id])).map((c) => c.id);
  const solvedCount = solvedIds.length;
  const solvedPlayableIds = PLAYABLE_CASES.filter((c) => Boolean(save.results[c.id])).map((c) => c.id);
  const allClear = solvedCount === CASES.length;

  const tutorialCase = CASES.find((c) => c.tutorial);
  const tutorialSolved = Boolean(tutorialCase && save.results[tutorialCase.id]);
  const today = allClear ? null : !tutorialSolved ? tutorialCase : firstUnsolvedCase(solvedPlayableIds);

  const resumeEntry = Object.values(save.progress)
    .filter((p) => p.phase !== 'intro')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const resumeCase = resumeEntry ? caseById(resumeEntry.caseId) : undefined;
  const todayProgress = today ? save.progress[today.id] : undefined;
  const todayHasProgress = Boolean(todayProgress && todayProgress.phase !== 'intro');

  const openCase = (id: string) => {
    sfx.tap();
    app.go({ name: 'case', id });
  };

  const cta = today
    ? todayHasProgress
      ? todayProgress?.phase === 'result' || todayProgress?.phase === 'reveal'
        ? '結果を見る'
        : '捜査を続ける'
      : today.tutorial
        ? 'チュートリアルを始める'
        : '捜査を開始する'
    : '事件ファイルを見る';

  return (
    <div class="screen dx-screen dx-title">
      <header class="masthead dx-masthead">
        <span class="mono">VOL.1</span>
        <span class="dx-masthead-mid mono">STATS DETECTIVE</span>
        <button class="icon-btn masthead-sound" aria-label={save.settings.sound ? '音を消す' : '音を出す'} onClick={app.toggleSound}>
          {save.settings.sound ? <IconSoundOn /> : <IconSoundOff />}
        </button>
      </header>

      <div class="grow dx-title-main">
        <div class="dx-title-copy">
          <span class="dx-issue mono">事件ファイル / スマホ版</span>
          <h1 class="dx-title-headline display">
            この数字、<em>だれ？</em>
          </h1>
          <p class="dx-title-tagline">名前を知らなくても、数字は語る。</p>
        </div>

        {today ? (
          <button class="dx-today sheet" onClick={() => openCase(today.id)}>
            <span class="dx-today-top">
              <span class="kicker">{today.tutorial ? 'FIRST CASE' : "TODAY'S CASE"}</span>
              <span class="dx-today-diff mono">
                {today.tutorial ? 'TUTORIAL' : `FILE ${String(today.number).padStart(3, '0')} / ${today.difficulty.toUpperCase()}`}
              </span>
            </span>
            <span class="dx-today-title display">{today.title}</span>
            <span class="dx-today-sub">{today.subtitle}</span>
            <span class="dx-today-hook">{today.hook}</span>
            <span class="dx-today-meta mono">
              容疑者 {today.suspectIds.length}人 / 手がかり {today.clues.length}枚 / 約{today.estimatedMinutes}分
            </span>
            <span class="dx-today-foot">
              <span class="dx-today-cta">
                {cta} <IconArrow />
              </span>
              {todayHasProgress && <span class="dx-today-save mono">AUTO SAVED</span>}
            </span>
          </button>
        ) : (
          <button class="dx-today dx-today-cleared sheet" onClick={() => app.go({ name: 'board' })}>
            <span class="dx-today-top">
              <span class="kicker">ALL CLEAR</span>
              <span class="dx-today-diff mono">VOL.1</span>
            </span>
            <span class="dx-today-title display">全事件、解決。</span>
            <span class="dx-today-hook">事件ファイルを開けば、いつでも読み返せる。</span>
            <span class="dx-today-foot">
              <span class="dx-today-cta">
                事件ファイルを見る <IconArrow />
              </span>
            </span>
          </button>
        )}

        {!allClear && resumeCase && resumeCase.id !== today?.id && (
          <button class="dx-resume-card" onClick={() => openCase(resumeCase.id)}>
            <span class="dx-resume-tag mono">CONTINUE</span>
            <span class="dx-resume-main">
              <b>
                {resumeCase.number ? `FILE ${String(resumeCase.number).padStart(3, '0')} ` : 'TUTORIAL '}
                {resumeCase.title}
              </b>
              <small>
                手がかり {resumeEntry.purchasedClueIds.length}枚 ・{' '}
                {resumeEntry.phase === 'reveal' || resumeEntry.phase === 'result' ? '結果を見る' : '続きから'}
              </small>
            </span>
            <IconArrow />
          </button>
        )}

        <div class="dx-title-actions">
          <button class="dx-title-link" onClick={() => app.go({ name: 'board' })}>
            <span class="mono">CASE FILES</span>
            <b>事件ファイル</b>
            <small>{solvedCount}/{CASES.length} 解決</small>
          </button>
          <button class="dx-title-link" onClick={() => app.go({ name: 'howto' })}>
            <span class="mono">BRIEFING</span>
            <b>あそびかた</b>
            <small>3分でわかる</small>
          </button>
        </div>

        {installPrompt && !installed && (
          <button class="dx-install" onClick={install}>
            <span class="dx-install-mark mono">INSTALL</span>
            <span class="dx-install-copy">
              <b>ホーム画面に追加</b>
              <small>オフラインでも遊べる</small>
            </span>
            <IconArrow />
          </button>
        )}

        <div class="dx-home-progress">
          <span class="kicker">INVESTIGATION LOG</span>
          <div class="dx-dots" aria-label={`${solvedCount}/${CASES.length}事件を解決`}>
            {CASES.map((c) => (
              <span
                key={c.id}
                class={`dx-dot ${save.results[c.id] ? 'is-done' : c.id === today?.id ? 'is-next' : ''}`}
              >
                {c.tutorial ? 'T' : c.number}
              </span>
            ))}
          </div>
          <b class="mono">{solvedCount}/{CASES.length}</b>
        </div>
      </div>

      <footer class="dx-title-foot">
        <button onClick={() => app.go({ name: 'glossary' })}>用語ノート</button>
        <span aria-hidden="true">·</span>
        <button onClick={() => app.go({ name: 'credits' })}>クレジット</button>
        <span aria-hidden="true">·</span>
        <button onClick={() => setSettingsOpen(true)}>設定</button>
      </footer>

      {settingsOpen && (
        <Modal
          kicker="SETTINGS"
          title="設定"
          onClose={() => {
            setSettingsOpen(false);
            setConfirmReset(false);
          }}
          footer={
            <button
              class="btn btn-primary"
              onClick={() => {
                setSettingsOpen(false);
                setConfirmReset(false);
              }}
            >
              閉じる
            </button>
          }
        >
          <div class="dx-settings">
            <label class="dx-toggle">
              <span>
                <b>効果音</b>
                <small>タイプライターと判子の音</small>
              </span>
              <input
                type="checkbox"
                checked={save.settings.sound}
                onChange={() => {
                  sfx.tap();
                  app.toggleSound();
                }}
              />
            </label>
            <label class="dx-toggle">
              <span>
                <b>推理アシスト</b>
                <small>手がかりを買うと、矛盾する容疑者を自動で×にする</small>
              </span>
              <input
                type="checkbox"
                checked={save.settings.assist}
                onChange={() => {
                  sfx.tap();
                  app.setSetting('assist', !save.settings.assist);
                }}
              />
            </label>
          </div>

          <div class="dx-danger">
            <span class="kicker">RESET</span>
            {confirmReset ? (
              <>
                <p>解決記録・用語ノート・設定をすべて消します。元に戻せません。</p>
                <div class="dx-btn-row">
                  <button class="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                    やめる
                  </button>
                  <button
                    class="btn btn-primary"
                    onClick={() => {
                      app.resetGameData();
                      setSettingsOpen(false);
                      setConfirmReset(false);
                    }}
                  >
                    すべて消す
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>セーブデータを最初からやり直す。</p>
                <button class="btn btn-ghost" onClick={() => setConfirmReset(true)}>
                  データをリセット
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
