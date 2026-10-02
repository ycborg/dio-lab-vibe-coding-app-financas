import type { CategoryId, Transaction } from '../types';
import { addMonths, dayKey, monthKey } from './format';

export interface Totals {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface MonthPoint extends Totals {
  key: string;
}

export interface CategoryShare {
  category: CategoryId;
  total: number;
  pct: number;
  count: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Consolida entradas, saídas e saldo líquido de um conjunto de transações. */
export function summarize(txs: readonly Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense), net: round2(income - expense), count: txs.length };
}

/**
 * Série mensal para o gráfico de evolução, terminando em `endKey` (inclusive).
 * Meses sem movimentação aparecem zerados para manter o eixo contínuo.
 */
export function monthlySeries(txs: readonly Transaction[], endKey: string, months: number): MonthPoint[] {
  const buckets = new Map<string, Transaction[]>();
  for (const t of txs) {
    const k = monthKey(t.date);
    const list = buckets.get(k);
    if (list) list.push(t);
    else buckets.set(k, [t]);
  }
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = addMonths(endKey, -i);
    out.push({ key, ...summarize(buckets.get(key) ?? []) });
  }
  return out;
}

/** Distribuição das despesas por categoria, ordenada da maior para a menor. */
export function expensesByCategory(txs: readonly Transaction[]): CategoryShare[] {
  const map = new Map<CategoryId, { total: number; count: number }>();
  let grand = 0;
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const cur = map.get(t.category) ?? { total: 0, count: 0 };
    cur.total += t.amount;
    cur.count += 1;
    map.set(t.category, cur);
    grand += t.amount;
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, total: round2(v.total), count: v.count, pct: grand ? v.total / grand : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function groupByDay(txs: readonly Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const t of txs) {
    const k = dayKey(t.date);
    const list = map.get(k);
    if (list) list.push(t);
    else map.set(k, [t]);
  }
  return map;
}

export const sortByDateDesc = (txs: readonly Transaction[]): Transaction[] =>
  [...txs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
