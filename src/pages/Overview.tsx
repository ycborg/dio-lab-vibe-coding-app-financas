import { EvolutionChart } from '../components/charts/EvolutionChart';
import { IconArrowDown, IconArrowUp, IconPlus, IconScale } from '../components/Icons';
import { EmptyState, PageHeader } from '../components/PageHeader';
import { TransactionCard } from '../components/TransactionCard';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { ROUTES } from '../hooks/useHashRoute';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { monthlySeries, summarize } from '../lib/finance';
import { formatBRL, formatSigned, monthKey, monthKeyOf, monthLabel, toLocalISO } from '../lib/format';
import { KEYS, readJSON, writeJSON } from '../lib/storage';

type ChartMonths = 6 | 12;

/** Dashboard de Visão Geral (RF02). */
export function Overview() {
  const { transactions } = useData();
  // Período do gráfico (6 ou 12 meses), lembrado entre visitas.
  const [chartMonths, setChartMonths] = useState<ChartMonths>(() => (readJSON<number>(KEYS.chartMonths, 6) === 12 ? 12 : 6));
  const changeMonths = (m: ChartMonths) => {
    setChartMonths(m);
    writeJSON(KEYS.chartMonths, m);
  };
  const actions = useTransactionActions();

  const currentKey = monthKeyOf(new Date());
  const month = summarize(transactions.filter((t) => monthKey(t.date) === currentKey));
  const series = monthlySeries(transactions, currentKey, chartMonths);
  // Parcelas futuras já existem na base, mas não são "atividade recente".
  const nowIso = toLocalISO(new Date());
  const recent = transactions.filter((t) => t.date <= nowIso).slice(0, 7);

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle={<>Resumo de <strong>{monthLabel(currentKey, 'long')}</strong>.</>}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => actions.create()}>
            <IconPlus size={16} /> Nova transação
          </button>
        }
      />

      <section className="card kpis" aria-label="Indicadores do mês">
        <div className="kpi">
          <span className="kpi__label"><IconScale size={16} /> Saldo líquido</span>
          <strong className={`kpi__value ${month.net >= 0 ? '' : 'is-negative'}`}>{formatSigned(month.net)}</strong>
          <span className="kpi__hint">{month.count} movimentações no mês</span>
        </div>
        <div className="kpi">
          <span className="kpi__label"><IconArrowUp size={16} /> Entradas</span>
          <strong className="kpi__value is-positive">{formatBRL(month.income)}</strong>
          <span className="kpi__hint">Somatório do mês</span>
        </div>
        <div className="kpi">
          <span className="kpi__label"><IconArrowDown size={16} /> Saídas</span>
          <strong className="kpi__value is-negative">{formatBRL(month.expense)}</strong>
          <span className="kpi__hint">
            {month.income > 0 ? `${Math.round((month.expense / month.income) * 100)}% das entradas` : 'Somatório do mês'}
          </span>
        </div>
      </section>

      <div className="overview-grid">
        <section className="card">
          <header className="card__header card__header--wrap">
            <div>
              <h2 className="card__title">Evolução financeira</h2>
              <p className="card__subtitle">Últimos {chartMonths} meses</p>
            </div>
            <div className="segmented" role="radiogroup" aria-label="Período do gráfico">
              {([6, 12] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={chartMonths === m}
                  className={`segmented__item${chartMonths === m ? ' is-active' : ''}`}
                  onClick={() => changeMonths(m)}
                >
                  {m} meses
                </button>
              ))}
            </div>
          </header>
          <EvolutionChart data={series} />
        </section>

        <section className="card">
          <header className="card__header">
            <h2 className="card__title">Atividades recentes</h2>
            <a className="link" href={`#${ROUTES.transactions}`}>Ver todas</a>
          </header>
          {recent.length ? (
            <div className="tx-list">
              {recent.map((t) => (
                <TransactionCard key={t.id} tx={t} onEdit={() => actions.edit(t)} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma transação ainda">
              Registre a primeira pelo botão "Nova transação" ou pelo <a className="link" href={`#${ROUTES.chat}`}>Chat IA</a>.
            </EmptyState>
          )}
        </section>
      </div>
      {actions.dialogs}
    </>
  );
}
