import type { Transaction, TxDraft } from '../types';
import { formatBRL, joinDateTime, pad, parseLocal, timeOf } from './format';
import { uid } from './finance';

/**
 * Regras de parcelamento.
 *
 * Uma compra de R$ 1.500 em 5x vira 5 transações de R$ 300, uma em cada mês a
 * partir do mês da compra (1/5 no mês da compra, 2/5 no mês seguinte, ...).
 * Todas compartilham o mesmo `groupId`, o que permite editar/excluir a compra inteira.
 */

/**
 * Divide um valor em `n` parcelas em centavos exatos. A diferença de
 * arredondamento vai para a 1ª parcela, para que a soma seja sempre o total.
 */
export function splitAmount(total: number, n: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const parts = Array<number>(n).fill(base);
  parts[0] += cents - base * n;
  return parts.map((c) => c / 100);
}

/** Mesma data (e horário, se houver) `offset` meses depois; dias inexistentes (31/02) caem no último dia do mês. */
export function shiftMonths(iso: string, offset: number): string {
  const d = parseLocal(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day = Math.min(d.getDate(), lastDay);
  return joinDateTime(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(day)}`, timeOf(iso));
}

/** Converte um rascunho em uma ou mais transações (uma por parcela). */
export function expandDraft(draft: TxDraft, createdAt = new Date().toISOString()): Transaction[] {
  const n = Math.max(1, Math.floor(draft.installments));
  if (n < 2) return [{ ...draft, installments: 1, id: uid(), createdAt }];
  const groupId = uid();
  return splitAmount(draft.amount, n).map((amount, i) => ({
    ...draft,
    amount,
    date: shiftMonths(draft.date, i),
    installments: n,
    installmentIndex: i + 1,
    groupId,
    id: uid(),
    createdAt,
  }));
}

/** Reconstrói o rascunho da compra inteira a partir das parcelas (valor total, data da 1ª). */
export function groupToDraft(parts: readonly Transaction[]): TxDraft {
  const sorted = [...parts].sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0));
  const first = sorted[0];
  const total = Math.round(sorted.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
  const { id: _id, createdAt: _c, installmentIndex: _i, groupId: _g, ...rest } = first;
  return { ...rest, amount: total, installments: first.installments };
}

/** Texto da tag: "2/5" para parcelas registradas, "5x" para rascunhos ainda não divididos. */
export function installmentLabel(tx: Pick<Transaction, 'installments' | 'installmentIndex'>): string | null {
  if (tx.installments < 2) return null;
  return tx.installmentIndex ? `${tx.installmentIndex}/${tx.installments}` : `${tx.installments}x`;
}

/** "5x de R$ 300,00" — usado em dicas do formulário e na prévia do chat. */
export function installmentSummary(total: number, n: number): string {
  const parts = splitAmount(total, n);
  const same = parts.every((p) => p === parts[parts.length - 1]);
  return same
    ? `${n}x de ${formatBRL(parts[0])}`
    : `1x de ${formatBRL(parts[0])} + ${n - 1}x de ${formatBRL(parts[n - 1])}`;
}

/**
 * Migração de dados antigos: transações parceladas gravadas como lançamento
 * único (modelo anterior) são expandidas em parcelas mensais.
 */
export function migrateLegacyInstallments(txs: Transaction[]): { list: Transaction[]; changed: boolean } {
  let changed = false;
  const list = txs.flatMap((t) => {
    if (t.installments < 2 || t.groupId) return [t];
    changed = true;
    const { id: _id, createdAt, installmentIndex: _i, groupId: _g, ...draft } = t;
    return expandDraft(draft, createdAt);
  });
  return { list, changed };
}
