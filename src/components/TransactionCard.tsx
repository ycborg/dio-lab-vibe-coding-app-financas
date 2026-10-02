import { paymentLabel } from '../data/categories';
import { formatBRL, formatDateTime, timeOf } from '../lib/format';
import { installmentLabel } from '../lib/installments';
import type { Transaction, TxDraft } from '../types';
import { CategoryPill } from './CategoryPill';
import { IconEdit, IconTrash } from './Icons';

interface Props {
  tx: Transaction | TxDraft;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Exibe apenas a hora (útil quando a lista já está agrupada por dia). */
  timeOnly?: boolean;
}

/**
 * Card padrão de transação (RF07): pílula da categoria, descrição, data/hora,
 * valor colorido pela natureza e tag de parcelamento ("2/5") apenas para >= 2 parcelas.
 */
export function TransactionCard({ tx, onEdit, onDelete, timeOnly }: Props) {
  const isIncome = tx.type === 'income';
  // Sem horário, a lista agrupada por dia não precisa repetir a data.
  const when = timeOnly ? timeOf(tx.date) : formatDateTime(tx.date);
  const installment = installmentLabel(tx);
  return (
    <article className="tx-card">
      <div className="tx-card__main">
        <div className="tx-card__tags">
          <CategoryPill id={tx.category} />
          {installment && (
            <span
              className="tag"
              title={'installmentIndex' in tx && tx.installmentIndex
                ? `Parcela ${tx.installmentIndex} de ${tx.installments}`
                : `Parcelado em ${tx.installments} vezes`}
            >
              {installment}
            </span>
          )}
        </div>
        <h3 className="tx-card__title">{tx.description}</h3>
        {(when || tx.paymentMethod) && (
          <p className="tx-card__meta">
            {when && <time dateTime={tx.date}>{when}</time>}
            {when && tx.paymentMethod && ' · '}
            {tx.paymentMethod && <span>{paymentLabel(tx.paymentMethod)}</span>}
          </p>
        )}
      </div>
      <div className="tx-card__side">
        <span className={`tx-card__amount ${isIncome ? 'is-positive' : 'is-negative'}`}>
          <span className="sr-only">{isIncome ? 'Entrada de' : 'Saída de'} </span>
          <span aria-hidden="true">{isIncome ? '+' : '−'} </span>
          {formatBRL(tx.amount)}
        </span>
        {(onEdit || onDelete) && (
          <div className="tx-card__actions">
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--sm" onClick={onEdit} aria-label={`Editar ${tx.description}`}>
                <IconEdit size={16} />
              </button>
            )}
            {onDelete && (
              <button type="button" className="icon-btn icon-btn--sm icon-btn--danger" onClick={onDelete} aria-label={`Excluir ${tx.description}`}>
                <IconTrash size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
