import { useMemo, useState } from 'react';
import { DonutChart } from '../components/charts/DonutChart';
import { IconChevronLeft, IconChevronRight } from '../components/Icons';
import { EmptyState, PageHeader } from '../components/PageHeader';
import { useData } from '../context/DataContext';
import { getCategory } from '../data/categories';
import { expensesByCategory } from '../lib/finance';
import { addMonths, formatBRL, formatPercent, monthKeyOf, monthLabel } from '../lib/format';

type Mode = 'month' | 'year';

/** Análise de Gastos por Categoria (RF05). */
export function Categories() {
  const { transactions } = useData();
  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState(monthKeyOf(new Date()));
  const [year, setYear] = useState(new Date().getFullYear());
  const [active, setActive] = useState<string | null>(null);

  const prefix = mode === 'month' ? month : String(year);
  const label = mode === 'month' ? monthLabel(month, 'long') : `Ano de ${year}`;
  const shares = useMemo(() => expensesByCategory(transactions.filter((t) => t.date.startsWith(prefix))), [transactions, prefix]);
  const total = shares.reduce((acc, s) => acc + s.total, 0);

  const step = (delta: number) => (mode === 'month' ? setMonth((m) => addMonths(m, delta)) : setYear((y) => y + delta));

  return (
    <>
      <PageHeader title="Categorias" subtitle="Para onde vai o seu dinheiro." />

      <section className="card">
        <header className="card__header card__header--wrap">
          <div className="cal-nav">
            <button type="button" className="icon-btn" aria-label="Período anterior" onClick={() => step(-1)}><IconChevronLeft /></button>
            <h2 className="cal-nav__title" aria-live="polite">{label}</h2>
            <button type="button" className="icon-btn" aria-label="Próximo período" onClick={() => step(1)}><IconChevronRight /></button>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Período">
            {(['month', 'year'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={`segmented__item${mode === m ? ' is-active' : ''}`} onClick={() => setMode(m)}>
                {m === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </header>

        {shares.length ? (
          <div className="categories-layout">
            <DonutChart
              segments={shares.map((s) => {
                const c = getCategory(s.category);
                return { id: c.id, label: c.name, value: s.total, color: c.color };
              })}
              total={total}
              centerCaption="Gasto total"
              activeId={active}
              onActiveChange={setActive}
            />
            <ul className="cat-list" aria-label="Gastos por categoria">
              {shares.map((s) => {
                const c = getCategory(s.category);
                return (
                  <li
                    key={c.id}
                    className={`cat-row${active === c.id ? ' is-active' : ''}${active && active !== c.id ? ' is-dim' : ''}`}
                    onMouseEnter={() => setActive(c.id)}
                    onMouseLeave={() => setActive(null)}
                  >
                    <div className="cat-row__head">
                      <span className="cat-row__name"><span className="dot" style={{ background: c.color }} />{c.name}</span>
                      <span className="cat-row__value">{formatBRL(s.total)}</span>
                    </div>
                    <div className="bar" role="progressbar" aria-label={`${c.name}: ${formatPercent(s.pct)} do total`} aria-valuenow={Math.round(s.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <span className="bar__fill" style={{ width: `${Math.max(1, s.pct * 100)}%`, background: c.color }} />
                    </div>
                    <div className="cat-row__meta">
                      <span>{s.count} {s.count === 1 ? 'lançamento' : 'lançamentos'}</span>
                      <span>{formatPercent(s.pct)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <EmptyState title="Sem despesas neste período">Navegue para outro período ou registre novas saídas.</EmptyState>
        )}
      </section>
    </>
  );
}
