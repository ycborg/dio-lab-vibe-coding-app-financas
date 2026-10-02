import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryPicker } from '../components/CategoryPicker';
import { IconDownload, IconPlus, IconSearch } from '../components/Icons';
import { EmptyState, PageHeader } from '../components/PageHeader';
import { TransactionCard } from '../components/TransactionCard';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { exportCSV, exportPDF } from '../lib/export';
import { groupByDay, summarize } from '../lib/finance';
import { dayKey, dayKeyOf, formatBRL, formatDate, formatDayHeading, formatSigned, monthKeyOf, monthLabel, yearKey } from '../lib/format';
import type { CategoryId, Transaction } from '../types';

type TypeFilter = 'all' | 'income' | 'expense';
type Granularity = 'all' | 'day' | 'month' | 'year';

interface Filters {
  type: TypeFilter;
  category: CategoryId | 'all';
  granularity: Granularity;
  day: string;
  month: string;
  year: string;
  query: string;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Aplica todos os filtros simultaneamente (tipo + categoria + período + busca). */
function applyFilters(txs: readonly Transaction[], f: Filters): Transaction[] {
  const q = normalize(f.query.trim());
  return txs.filter((t) => {
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.category !== 'all' && t.category !== f.category) return false;
    if (f.granularity === 'day' && dayKey(t.date) !== f.day) return false;
    if (f.granularity === 'month' && !t.date.startsWith(f.month)) return false;
    if (f.granularity === 'year' && yearKey(t.date) !== f.year) return false;
    if (q && !normalize(t.description).includes(q)) return false;
    return true;
  });
}

function periodLabel(f: Filters): string {
  switch (f.granularity) {
    case 'day': return formatDate(f.day);
    case 'month': return monthLabel(f.month, 'long');
    case 'year': return `Ano de ${f.year}`;
    default: return 'Todo o período';
  }
}

/** Gestão de Transações (RF03). */
export function Transactions() {
  const { transactions } = useData();
  const notify = useToast();
  const actions = useTransactionActions();
  const now = new Date();
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    category: 'all',
    granularity: 'month',
    day: dayKeyOf(now),
    month: monthKeyOf(now),
    year: String(now.getFullYear()),
    query: '',
  });
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);
  const totals = summarize(filtered);
  const groups = useMemo(() => [...groupByDay(filtered).entries()], [filtered]);
  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => yearKey(t.date)));
    set.add(String(now.getFullYear()));
    return [...set].sort().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => !exportRef.current?.contains(e.target as Node) && setExportOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setExportOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [exportOpen]);

  const doExport = (kind: 'csv' | 'pdf') => {
    setExportOpen(false);
    if (!filtered.length) return notify('Não há transações para exportar com os filtros atuais.');
    if (kind === 'csv') {
      exportCSV(filtered, `fin-transacoes-${filters.granularity === 'all' ? 'todas' : periodLabel(filters).replace(/\W+/g, '-').toLowerCase()}.csv`);
      notify(`${filtered.length} transações exportadas em CSV.`, 'positive');
    } else if (!exportPDF(filtered, periodLabel(filters))) {
      notify('Permita pop-ups para gerar o PDF.', 'negative');
    }
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.query || filters.granularity !== 'all';

  return (
    <>
      <PageHeader
        title="Transações"
        subtitle="Consulte, filtre e mantenha seus lançamentos."
        actions={
          <>
            <div className="menu" ref={exportRef}>
              <button type="button" className="btn btn--secondary" aria-haspopup="menu" aria-expanded={exportOpen} onClick={() => setExportOpen((o) => !o)}>
                <IconDownload size={16} /> Exportar
              </button>
              {exportOpen && (
                <div className="menu__list" role="menu">
                  <button type="button" role="menuitem" className="menu__item" onClick={() => doExport('csv')}>Planilha CSV</button>
                  <button type="button" role="menuitem" className="menu__item" onClick={() => doExport('pdf')}>Relatório PDF</button>
                </div>
              )}
            </div>
            <button type="button" className="btn btn--primary" onClick={() => actions.create()}>
              <IconPlus size={16} /> Nova transação
            </button>
          </>
        }
      />

      <section className="card filters" aria-label="Filtros">
        <div className="filters__search">
          <IconSearch size={16} className="filters__search-icon" />
          <label htmlFor="tx-search" className="sr-only">Buscar pela descrição</label>
          <input
            id="tx-search"
            type="search"
            className="input"
            placeholder="Buscar pela descrição…"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
          />
        </div>

        <div className="filters__row">
          <div className="segmented" role="radiogroup" aria-label="Tipo de movimentação">
            {(
              [
                ['all', 'Todas'],
                ['income', 'Entradas'],
                ['expense', 'Saídas'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={filters.type === value}
                className={`segmented__item${filters.type === value ? ' is-active' : ''}`}
                onClick={() => set('type', value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="filters__field">
            <CategoryPicker includeAll label="Filtrar por categoria" value={filters.category} onChange={(v) => set('category', v)} />
          </div>

          <div className="filters__period">
            <label htmlFor="tx-granularity" className="sr-only">Intervalo temporal</label>
            <select id="tx-granularity" className="input filters__granularity" value={filters.granularity} onChange={(e) => set('granularity', e.target.value as Granularity)}>
              <option value="all">Todo o período</option>
              <option value="day">Dia</option>
              <option value="month">Mês</option>
              <option value="year">Ano</option>
            </select>
            {filters.granularity === 'day' && (
              <input type="date" className="input" aria-label="Dia" value={filters.day} onChange={(e) => e.target.value && set('day', e.target.value)} />
            )}
            {filters.granularity === 'month' && (
              <input type="month" className="input" aria-label="Mês" value={filters.month} onChange={(e) => e.target.value && set('month', e.target.value)} />
            )}
            {filters.granularity === 'year' && (
              <select className="input" aria-label="Ano" value={filters.year} onChange={(e) => set('year', e.target.value)}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>
      </section>

      <section className="results-bar" aria-live="polite">
        <span><strong>{filtered.length}</strong> {filtered.length === 1 ? 'transação' : 'transações'} · {periodLabel(filters)}</span>
        <span className="results-bar__totals">
          <span className="is-positive">+ {formatBRL(totals.income)}</span>
          <span className="is-negative">− {formatBRL(totals.expense)}</span>
          <span>Saldo {formatSigned(totals.net)}</span>
        </span>
      </section>

      {groups.length ? (
        <div className="day-groups">
          {groups.map(([day, list]) => (
            <section key={day} className="day-group" aria-label={formatDayHeading(day)}>
              <h2 className="day-group__title">{formatDayHeading(day)}</h2>
              <div className="tx-list">
                {list.map((t) => (
                  <TransactionCard key={t.id} tx={t} timeOnly onEdit={() => actions.edit(t)} onDelete={() => actions.remove(t)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState title="Nenhuma transação encontrada">
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setFilters((f) => ({ ...f, type: 'all', category: 'all', granularity: 'all', query: '' }))}
              >
                Limpar filtros
              </button>
            ) : (
              'Adicione sua primeira transação.'
            )}
          </EmptyState>
        </div>
      )}
      {actions.dialogs}
    </>
  );
}
