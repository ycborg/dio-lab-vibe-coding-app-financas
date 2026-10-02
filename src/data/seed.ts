import type { CategoryId, PaymentMethod, Transaction, TxType } from '../types';
import { addMonths, monthKeyOf, pad } from '../lib/format';
import { expandDraft } from '../lib/installments';

/**
 * Gera um histórico fictício de ~6 meses para novas contas (compras parceladas
 * já divididas em parcelas mensais), de modo que os
 * gráficos e o calendário tenham conteúdo imediatamente. PRNG com semente
 * fixa = dados reproduzíveis.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Template = [description: string, category: CategoryId, min: number, max: number, method?: PaymentMethod];

const VARIABLE: Template[] = [
  ['Supermercado', 'alimentacao', 120, 380, 'debito'],
  ['Almoço', 'alimentacao', 28, 65, 'debito'],
  ['iFood', 'alimentacao', 35, 90, 'credito'],
  ['Padaria', 'alimentacao', 12, 35, 'pix'],
  ['Uber', 'transporte', 14, 48, 'credito'],
  ['Combustível', 'transporte', 120, 260, 'debito'],
  ['Cinema', 'lazer', 40, 90, 'credito'],
  ['Bar com amigos', 'lazer', 60, 180, 'pix'],
  ['Farmácia', 'saude', 25, 140, 'debito'],
  ['Roupas', 'compras', 90, 320, 'credito'],
  ['Barbeiro', 'servicos', 45, 70, 'pix'],
];

export function generateSampleTransactions(now: Date = new Date()): Transaction[] {
  const rand = mulberry32(20261001);
  const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
  const out: Transaction[] = [];
  const endKey = monthKeyOf(now);

  const push = (
    key: string,
    day: number,
    description: string,
    category: CategoryId,
    amount: number,
    type: TxType,
    extra: { installments?: number; method?: PaymentMethod; hour?: number } = {},
  ) => {
    const [y, m] = key.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const d = Math.min(day, lastDay);
    const hour = extra.hour ?? 8 + Math.floor(rand() * 13);
    const date = `${key}-${pad(d)}T${pad(hour)}:${pad(Math.floor(rand() * 60))}`;
    // Compras nunca são futuras; parcelas posteriores de uma compra passada podem ser.
    if (new Date(y, m - 1, d, hour) > now) return;
    out.push(
      ...expandDraft({ description, category, amount, type, date, installments: extra.installments ?? 1, paymentMethod: extra.method }),
    );
  };

  for (let i = 5; i >= 0; i--) {
    const key = addMonths(endKey, -i);
    // Entradas fixas
    push(key, 5, 'Salário', 'salario', 6800, 'income', { method: 'transferencia', hour: 9 });
    push(key, 1, 'Vale refeição', 'vrva', 880, 'income', { hour: 7 });
    push(key, 1, 'Vale transporte', 'vt', 240, 'income', { hour: 7 });
    if (rand() > 0.55) push(key, 12 + Math.floor(rand() * 10), 'Freela de design', 'extra', between(600, 1800), 'income', { method: 'pix' });
    if (rand() > 0.7) push(key, 18, 'Reembolso de despesas', 'reembolso', between(80, 260), 'income', { method: 'pix' });

    // Despesas recorrentes
    push(key, 10, 'Aluguel', 'contas', 1850, 'expense', { method: 'boleto' });
    push(key, 12, 'Conta de luz', 'contas', between(140, 230), 'expense', { method: 'boleto' });
    push(key, 15, 'Internet', 'contas', 119.9, 'expense', { method: 'debito' });
    push(key, 8, 'Netflix', 'servicos', 55.9, 'expense', { method: 'credito' });
    push(key, 8, 'Spotify', 'servicos', 21.9, 'expense', { method: 'credito' });
    push(key, 3, 'Academia', 'saude', 99.9, 'expense', { method: 'credito' });
    push(key, 6, 'Curso de inglês', 'educacao', 289, 'expense', { method: 'boleto' });
    push(key, 6, 'Aporte Tesouro Direto', 'investimentos', 800, 'expense', { method: 'transferencia' });

    // Despesas variáveis
    const count = 14 + Math.floor(rand() * 8);
    for (let n = 0; n < count; n++) {
      const [description, category, min, max, method] = VARIABLE[Math.floor(rand() * VARIABLE.length)];
      push(key, 1 + Math.floor(rand() * 28), description, category, between(min, max), 'expense', { method });
    }

    // Compras parceladas ocasionais
    if (rand() > 0.5) push(key, 20, 'Fone de ouvido', 'compras', 899, 'expense', { installments: 10, method: 'credito' });
    if (rand() > 0.6) push(key, 22, 'Passagem aérea', 'lazer', 1240, 'expense', { installments: 4, method: 'credito' });
    if (rand() > 0.75) push(key, 25, 'Consulta dentista', 'saude', 350, 'expense', { installments: 2, method: 'credito' });
  }
  return out;
}
