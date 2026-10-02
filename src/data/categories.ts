import type { Category, CategoryId, PaymentMethod, TxType } from '../types';

/** Matriz cromática semântica oficial (DRS §2.4). A ordem define a exibição nos seletores. */
export const CATEGORIES: readonly Category[] = [
  { id: 'alimentacao', name: 'Alimentação', nature: 'expense', color: '#E57373' },
  { id: 'compras', name: 'Compras', nature: 'expense', color: '#BA68C8' },
  { id: 'transporte', name: 'Transporte', nature: 'expense', color: '#64B5F6' },
  { id: 'contas', name: 'Contas', nature: 'expense', color: '#FFB74D' },
  { id: 'lazer', name: 'Lazer', nature: 'expense', color: '#F06292' },
  { id: 'saude', name: 'Saúde', nature: 'expense', color: '#4DB6AC' },
  { id: 'educacao', name: 'Educação', nature: 'expense', color: '#7986CB' },
  { id: 'servicos', name: 'Serviços', nature: 'expense', color: '#90A4AE' },
  { id: 'investimentos', name: 'Investimentos', nature: 'expense', color: '#4DD0E1' },
  { id: 'vrva', name: 'VR/VA', nature: 'income', color: '#81C784' },
  { id: 'vt', name: 'VT', nature: 'income', color: '#4FC3F7' },
  { id: 'salario', name: 'Salário', nature: 'income', color: '#3FB950' },
  { id: 'reembolso', name: 'Reembolso', nature: 'income', color: '#A5D6A7' },
  { id: 'extra', name: 'Extra', nature: 'income', color: '#FFD54F' },
  { id: 'outros', name: 'Outros', nature: 'neutral', color: '#78909C' },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category {
  return BY_ID.get(id) ?? BY_ID.get('outros')!;
}

/** Categoria sugerida ao alternar o tipo da transação. */
export function defaultCategoryFor(type: TxType): CategoryId {
  return type === 'income' ? 'salario' : 'alimentacao';
}

/** Tipo natural de uma categoria (categorias neutras assumem despesa). */
export function naturalType(id: CategoryId): TxType {
  return getCategory(id).nature === 'income' ? 'income' : 'expense';
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
  { id: 'pix', label: 'Pix' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'boleto', label: 'Boleto' },
  { id: 'transferencia', label: 'Transferência' },
];

export function paymentLabel(id?: PaymentMethod): string {
  return PAYMENT_METHODS.find((p) => p.id === id)?.label ?? '—';
}
