import { useMemo, useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconPlus } from '../components/Icons';
import { Modal } from '../components/Modal';
import { EmptyState, PageHeader } from '../components/PageHeader';
import { TransactionCard } from '../components/TransactionCard';
import { useData } from '../context/DataContext';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { groupByDay, summarize } from '../lib/finance';
import {
  addMonths, dayKeyOf, formatBRL, formatDayHeading, formatNumberCompact, formatSigned,
  monthKey, monthKeyOf, monthLabel, WEEKDAYS_SHORT,
} from '../lib/format';

/** 0 = domingo (padrão brasileiro), 1 = segunda-feira. */
const WEEK_START: 0 | 1 = 0;

interface GridCell {
  day: string;
  /** Dia pertencente ao mês anterior ou seguinte (exibido de forma ofuscada). */
  outside: boolean;
}

/**
 * Monta a grade mensal em semanas completas. Os espaços antes do dia 1 e depois
 * do último dia são preenchidos com os dias dos meses vizinhos.
 */
function buildGrid(key: string, weekStart: 0 | 1): GridCell[] {
  const [y, m] = key.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() - weekStart + 7) % 7;
  const days = new Date(y, m, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  // new Date() normaliza dias fora do intervalo (0 → último dia do mês anterior, 32 → próximo mês).
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(y, m - 1, i - lead + 1);
    return { day: dayKeyOf(d), outside: monthKeyOf(d) !== key };
  });
}

/** Calendário Financeiro (RF04). */
export function CalendarPage() {
  const weekStart = WEEK_START;
  const { transactions } = useData();
  const actions = useTransactionActions();
  const todayKey = dayKeyOf(new Date());
  const [month, setMonth] = useState(monthKeyOf(new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const grid = buildGrid(month, weekStart);
  const monthTx = useMemo(() => transactions.filter((t) => monthKey(t.date) === month), [transactions, month]);
  // Agrupa também os dias vizinhos visíveis na grade.
  const byDay = useMemo(() => {
    const first = grid[0].day;
    const last = grid[grid.length - 1].day;
    return groupByDay(transactions.filter((t) => t.date.slice(0, 10) >= first && t.date.slice(0, 10) <= last));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, month]);
  const totals = summarize(monthTx);
  // A intensidade de densidade considera apenas o mês exibido.
  const maxCount = Math.max(1, ...[...byDay.entries()].filter(([d]) => d.startsWith(month)).map(([, l]) => l.length));
  const weekdays = weekStart === 1 ? [...WEEKDAYS_SHORT.slice(1), WEEKDAYS_SHORT[0]] : WEEKDAYS_SHORT;

  const selectedTx = selected ? transactions.filter((t) => t.date.startsWith(selected)) : [];
  const selectedTotals = summarize(selectedTx);

  return (
    <>
      <PageHeader title="Calendário" subtitle="Distribuição diária das suas movimentações." />

      <section className="card">
        <header className="cal-head">
          <div className="cal-nav">
            <button type="button" className="icon-btn" aria-label="Mês anterior" onClick={() => setMonth((m) => addMonths(m, -1))}>
              <IconChevronLeft />
            </button>
            <h2 className="cal-nav__title" aria-live="polite">{monthLabel(month, 'long')}</h2>
            <button type="button" className="icon-btn" aria-label="Próximo mês" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <IconChevronRight />
            </button>
            {month !== monthKeyOf(new Date()) && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMonth(monthKeyOf(new Date()))}>Hoje</button>
            )}
          </div>
          <dl className="cal-summary">
            <div><dt>Entradas</dt><dd className="is-positive">{formatBRL(totals.income)}</dd></div>
            <div><dt>Saídas</dt><dd className="is-negative">{formatBRL(totals.expense)}</dd></div>
            <div><dt>Saldo</dt><dd>{formatSigned(totals.net)}</dd></div>
          </dl>
        </header>

        <div className="cal-grid" role="grid" aria-label={`Calendário de ${monthLabel(month, 'long')}`}>
          <div className="cal-grid__row cal-grid__weekdays" role="row">
            {weekdays.map((w) => <div key={w} role="columnheader" className="cal-weekday">{w}</div>)}
          </div>
          {Array.from({ length: grid.length / 7 }, (_, row) => (
            <div key={row} className="cal-grid__row" role="row">
              {grid.slice(row * 7, row * 7 + 7).map(({ day, outside }) => {
                const list = byDay.get(day) ?? [];
                const s = summarize(list);
                const level = list.length && !outside ? Math.min(3, Math.ceil((list.length / maxCount) * 3)) : 0;
                const label = `${formatDayHeading(day)}: ${list.length ? `${list.length} movimentações, saldo ${formatBRL(s.net)}` : 'sem movimentações'}`;
                return (
                  <div key={day} role="gridcell">
                    <button
                      type="button"
                      className={`cal-day cal-day--l${level}${day === todayKey ? ' is-today' : ''}${outside ? ' is-outside' : ''}`}
                      onClick={() => setSelected(day)}
                      aria-label={label}
                    >
                      <span className="cal-day__num">{Number(day.slice(8))}</span>
                      {list.length > 0 && (
                        <>
                          <span className={`cal-day__net ${s.net >= 0 ? 'is-positive' : 'is-negative'}`}>
                            <span className="cal-day__net-full">{formatSigned(s.net)}</span>
                            <span className="cal-day__net-compact">{s.net >= 0 ? '+' : '−'}{formatNumberCompact(Math.abs(s.net))}</span>
                          </span>
                          <span className="cal-day__density" aria-hidden="true">
                            {Array.from({ length: Math.min(list.length, 4) }, (_, k) => <i key={k} />)}
                            <span className="cal-day__count">{list.length}</span>
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p className="cal-legend">
          <span className="cal-legend__dots" aria-hidden="true"><i /><i /><i /></span> densidade de movimentações · cor do valor = saldo do dia
        </p>
      </section>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        variant="drawer"
        title={selected ? formatDayHeading(selected) : ''}
        subtitle={
          selectedTx.length ? (
            <span className="drawer-totals">
              <span className="is-positive">+ {formatBRL(selectedTotals.income)}</span>
              <span className="is-negative">− {formatBRL(selectedTotals.expense)}</span>
              <span>Saldo {formatSigned(selectedTotals.net)}</span>
            </span>
          ) : undefined
        }
        footer={
          <button type="button" className="btn btn--primary btn--block" onClick={() => selected && actions.create({ date: selected })}>
            <IconPlus size={16} /> Adicionar nesta data
          </button>
        }
      >
        {selectedTx.length ? (
          <div className="tx-list">
            {selectedTx.map((t) => (
              <TransactionCard key={t.id} tx={t} timeOnly onEdit={() => actions.edit(t)} onDelete={() => actions.remove(t)} />
            ))}
          </div>
        ) : (
          <EmptyState title="Sem movimentações neste dia" />
        )}
      </Modal>
      {actions.dialogs}
    </>
  );
}
