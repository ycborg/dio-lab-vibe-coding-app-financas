import { useEffect, useId, useRef, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import type { CategoryId } from '../types';
import { CategoryDot } from './CategoryPill';
import { IconChevronDown } from './Icons';

type Value = CategoryId | 'all';

interface Props {
  value: Value;
  onChange: (value: Value) => void;
  /** Inclui a opção "Todas as categorias" (uso em filtros). */
  includeAll?: boolean;
  label: string;
  id?: string;
}

/**
 * Seletor de categoria com indicador de cor. Implementa o padrão ARIA
 * "listbox" (setas, Home/End, Enter/Espaço, Esc) — o <select> nativo não
 * permite exibir as cores semânticas.
 */
export function CategoryPicker({ value, onChange, includeAll, label, id }: Props) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const options: { value: Value; label: string }[] = [
    ...(includeAll ? [{ value: 'all' as Value, label: 'Todas as categorias' }] : []),
    ...CATEGORIES.map((c) => ({ value: c.id as Value, label: c.name })),
  ];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    listRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive((a) => Math.max(0, a - 1)); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(options.length - 1); break;
      case 'Enter':
      case ' ': e.preventDefault(); choose(active); break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); setOpen(false); buttonRef.current?.focus(); break;
      case 'Tab': setOpen(false); break;
    }
  };

  return (
    <div className="picker" ref={rootRef}>
      <span className="sr-only" id={`${baseId}-label`}>{label}</span>
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        className="input picker__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${baseId}-label ${baseId}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {selected.value !== 'all' ? <CategoryDot id={selected.value} /> : <span className="dot dot--all" aria-hidden="true" />}
        <span className="picker__text">{selected.label}</span>
        <IconChevronDown size={16} className="picker__chevron" />
      </button>
      {open && (
        <ul
          ref={listRef}
          className="picker__list"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${baseId}-label`}
          aria-activedescendant={`${baseId}-opt-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${baseId}-opt-${i}`}
              data-index={i}
              role="option"
              aria-selected={o.value === value}
              className={`picker__option${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {o.value !== 'all' ? <CategoryDot id={o.value} /> : <span className="dot dot--all" aria-hidden="true" />}
              <span>{o.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
