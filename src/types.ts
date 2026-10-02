/** Tipos de domínio compartilhados por toda a aplicação. */

export type TxType = 'income' | 'expense';

export type CategoryId =
  | 'alimentacao'
  | 'compras'
  | 'transporte'
  | 'contas'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'servicos'
  | 'investimentos'
  | 'vrva'
  | 'vt'
  | 'salario'
  | 'reembolso'
  | 'extra'
  | 'outros';

export type CategoryNature = 'expense' | 'income' | 'neutral';

export interface Category {
  id: CategoryId;
  name: string;
  nature: CategoryNature;
  color: string;
}

export type PaymentMethod = 'debito' | 'credito' | 'pix' | 'dinheiro' | 'boleto' | 'transferencia';

export interface Transaction {
  id: string;
  description: string;
  /** Valor sempre positivo; o sinal é dado por `type`. */
  amount: number;
  type: TxType;
  category: CategoryId;
  /** Data local `YYYY-MM-DD`, com horário opcional: `YYYY-MM-DDTHH:mm` (sem fuso, evita deslocamentos). */
  date: string;
  /** Total de parcelas da compra. 1 = à vista. A tag só é exibida para valores >= 2. */
  installments: number;
  /** Posição desta parcela (1-based). Presente apenas em compras parceladas. */
  installmentIndex?: number;
  /** Identificador comum a todas as parcelas de uma mesma compra. */
  groupId?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

/**
 * Dados editáveis de uma transação (sem campos gerados pelo sistema).
 * Em compras parceladas, `amount` é o VALOR TOTAL e `date` a data da 1ª parcela.
 */
export type TxDraft = Omit<Transaction, 'id' | 'createdAt' | 'installmentIndex' | 'groupId'>;
