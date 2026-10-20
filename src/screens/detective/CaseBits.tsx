import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { Clue, SuspectProfile } from '../../data/caseTypes';
import type { SuspectMark } from '../../lib/save';
import { IconClose, IconPause } from '../../components/icons';

export function GameBar(props: {
  file: string;
  title: string;
  onPause: () => void;
  right?: ComponentChildren;
}) {
  return (
    <header class="topbar dx-gamebar">
      <button class="icon-btn" aria-label="一時停止" onClick={props.onPause}>
        <IconPause />
      </button>
      <div class="topbar-title">
        <small>{props.file}</small>
        <strong>{props.title}</strong>
      </div>
      {props.right}
    </header>
  );
}

export function BudgetMeter({ used, total }: { used: number; total: number }) {
  const left = total - used;
  return (
    <span class={`dx-budget ${left === 0 ? 'is-empty' : ''}`} aria-label={`残り${left}ポイント、${total}ポイント中`}>
      <small>残り</small>
      <b class="num">{left}</b>
      <span>pt</span>
    </span>
  );
}

export function MarkBadge({
  mark,
  name,
  onClick,
}: {
  mark: SuspectMark;
  name: string;
  onClick?: () => void;
}) {
  const label = mark === 'eliminated' ? '×' : mark === 'possible' ? '○' : '？';
  const word = mark === 'eliminated' ? '消去済み' : mark === 'possible' ? '候補' : '未確認';
  if (!onClick) {
    return (
      <span class={`dx-mark is-${mark}`} aria-label={`${name}は${word}`}>
        {label}
      </span>
    );
  }
  return (
    <button
      class={`dx-mark is-${mark}`}
      aria-label={`${name}のメモを切り替える（現在${word}）`}
      aria-pressed={mark === 'eliminated'}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {label}
    </button>
  );
}

export function Coach({ children, step }: { children: ComponentChildren; step?: string }) {
  return (
    <aside class="dx-coach" aria-live="polite">
      <span class="dx-coach-tag mono">COACH{step ? ` ${step}` : ''}</span>
      <div>{children}</div>
    </aside>
  );
}

export function SuspectRow({
  suspect,
  mark,
  reason,
  onToggle,
  onOpen,
}: {
  suspect: SuspectProfile;
  mark: SuspectMark;
  reason?: string;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const eliminated = mark === 'eliminated';
  const aria = [
    suspect.nameJa,
    suspect.position,
    `${suspect.height}cm`,
    `${suspect.foot}足`,
    `${suspect.birthYear}年生まれ`,
    `${suspect.clubCount}クラブ`,
    suspect.overseas ? '海外経験あり' : '海外経験なし',
    `${suspect.careerApps}試合`,
    `${suspect.careerGoals}得点`,
    `代表${suspect.caps}試合`,
    `J1優勝${suspect.j1Titles}回`,
    `MVP${suspect.mvpCount}回`,
    `最終季${tierText(suspect.lastTier)}`,
  ].join('、');

  return (
    <div class={`dx-suspect ${eliminated ? 'is-eliminated' : ''}`}>
      <button class="dx-suspect-main" aria-label={`${aria}。詳細を開く`} onClick={onOpen}>
        <span class="dx-suspect-head">
          <b class="dx-suspect-name">{suspect.nameJa}</b>
          <span class="dx-suspect-body mono">
            {suspect.height}cm / {suspect.foot}足
          </span>
        </span>
        <span class="dx-suspect-line">
          <span>{suspect.birthYear}年生</span>
          <span>{suspect.clubCount}クラブ</span>
          <span>{suspect.overseas ? '海外○' : '海外×'}</span>
          <span>最終季 {tierText(suspect.lastTier)}</span>
        </span>
        <span class="dx-suspect-line dx-suspect-stats mono">
          <span>{suspect.careerApps}試合</span>
          <span>{suspect.careerGoals}得点</span>
          <span>代表{suspect.caps}</span>
        </span>
        <span class="dx-suspect-line">
          <span>J1優勝 {suspect.j1Titles}</span>
          <span>
            MVP {suspect.mvpCount}
            {suspect.mvpCount > 0 ? `（${suspect.mvpAges.join('・')}歳）` : ''}
          </span>
        </span>
        {eliminated && reason && <span class="dx-suspect-reason">× {reason}</span>}
      </button>
      <MarkBadge mark={mark} name={suspect.nameJa} onClick={onToggle} />
    </div>
  );
}

export function tierText(tier: number): string {
  if (tier === 1) return 'J1';
  if (tier === 2) return 'J2';
  if (tier === 3) return 'J3';
  if (tier === 4) return 'J4';
  return '下部';
}

export function ClueSummary({
  clue,
  matches,
  showMatches = true,
}: {
  clue: Clue;
  matches: SuspectProfile[];
  showMatches?: boolean;
}) {
  return (
    <article class="dx-clue-summary">
      <header>
        <span class="dx-paid-stamp mono">PAID</span>
        <b>{clue.title}</b>
        <span class="mono dx-clue-cost">{clue.cost}pt</span>
      </header>
      <p>
        答え: <strong>{clue.answerText}</strong>
      </p>
      <p class="dx-clue-matches">
        {showMatches
          ? `該当: ${matches.length ? matches.map((s) => s.nameJa).join(' / ') : 'なし'}`
          : `該当 ${matches.length}人（自分で照合）`}
      </p>
    </article>
  );
}

export function SourceLine({ label, url }: { label: string; url: string }) {
  if (!url.startsWith('http')) return <span>{label}</span>;
  return (
    <a href={url} target="_blank" rel="noopener">
      {label}
    </a>
  );
}

export function Modal(props: {
  kicker?: string;
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  footer?: ComponentChildren;
  wide?: boolean;
}) {
  const modalRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  // Keep keyboard focus inside the sheet, and let Escape close it.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const root = modalRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, []);

  return (
    <div class="dx-modal-backdrop" role="presentation" onClick={props.onClose}>
      <section
        class={`dx-modal sheet ${props.wide ? 'is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header class="dx-modal-head">
          <div>
            {props.kicker && <span class="kicker">{props.kicker}</span>}
            <h2 class="display">{props.title}</h2>
          </div>
          <button ref={closeRef} class="icon-btn" aria-label="閉じる" onClick={props.onClose}>
            <IconClose />
          </button>
        </header>
        <div class="dx-modal-body">{props.children}</div>
        {props.footer && <div class="dx-modal-foot">{props.footer}</div>}
      </section>
    </div>
  );
}
