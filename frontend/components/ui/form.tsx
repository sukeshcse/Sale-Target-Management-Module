'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

const FIELD_BASE =
  'rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_BASE} ${className}`} {...props} />;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-primary">
      <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type SelectOption = { value: string; label: string };

/**
 * A native <select>'s open dropdown is rendered by the OS, not the page — it can align
 * itself on the selected option instead of the trigger, which looks misaligned on macOS.
 * This is a custom listbox with the same value/onChange/children API as a native select
 * (so call sites stay unchanged), but the popup is app-rendered and always sits directly
 * under the trigger.
 */
export function Select({
  value,
  onChange,
  children,
  className = '',
  disabled,
}: {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const options = useMemo<SelectOption[]>(
    () =>
      Children.toArray(children)
        .filter((child): child is ReactElement<{ value?: string; children?: ReactNode }> => isValidElement(child))
        .map((child) => ({
          value: child.props.value ?? '',
          label: typeof child.props.children === 'string' ? child.props.children : String(child.props.children ?? ''),
        })),
    [children],
  );

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const listboxId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  // activeIndex is set in openList() at the moment of opening (event handler) rather
  // than in this effect — the effect only handles the DOM focus side effect.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function openList() {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function close(refocusButton: boolean) {
    setOpen(false);
    if (refocusButton) buttonRef.current?.focus();
  }

  function commit(index: number) {
    const opt = options[index];
    if (!opt) return;
    onChange({ target: { value: opt.value } });
    close(true);
  }

  function handleTypeahead(key: string) {
    if (key.length !== 1 || !/[a-z0-9]/i.test(key)) return false;
    typeaheadRef.current += key.toLowerCase();
    clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = setTimeout(() => {
      typeaheadRef.current = '';
    }, 600);
    const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(typeaheadRef.current));
    if (idx >= 0) setActiveIndex(idx);
    return true;
  }

  function onButtonKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openList();
      return;
    }
    if (handleTypeahead(e.key)) e.preventDefault();
  }

  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        handleTypeahead(e.key);
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKeyDown}
        className={`${FIELD_BASE} flex w-full cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          id={listboxId}
          tabIndex={-1}
          aria-activedescendant={`${listboxId}-opt-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className="absolute z-20 mt-1.5 max-h-60 w-full min-w-max overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                  isActive ? 'bg-zinc-50 dark:bg-zinc-800' : ''
                } ${isSelected ? 'font-medium text-primary' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <CheckIcon />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function FieldLabel({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-medium text-zinc-700 dark:text-zinc-300 ${className}`} {...props} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}
