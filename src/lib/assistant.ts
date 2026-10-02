import { getCategory } from '../data/categories';
import type { CategoryId, Transaction, TxDraft } from '../types';
import { formatBRL, monthKey, monthKeyOf, monthLabel } from './format';
import { expensesByCategory, summarize } from './finance';
import { detectIntent, parseTransaction } from './nlp';

/**
 * Ponto único de integração do assistente.
 *
 * Hoje a interpretação é feita localmente por `nlp.ts`. Para usar um LLM,
 * substitua o corpo de `interpret` por uma chamada ao seu backend (que guarda
 * a chave da API) devolvendo o mesmo formato `AssistantReply` — a interface
 * do chat não precisa mudar.
 */

/** Nome do assistente exibido na interface. */
export const ASSISTANT_NAME = 'Fin';

export interface AssistantReply {
  text: string;
  draft?: TxDraft;
}

export const HELP_EXAMPLES = [
  'Paguei 35 reais de combustível no débito hoje',
  'Almoço no restaurante 42,90 ontem',
  'Comprei um celular de 1500 em 5x',
  'Recebi 1.200 de freela por pix',
  'Quanto gastei este mês?',
];

export async function interpret(message: string, transactions: readonly Transaction[], now = new Date()): Promise<AssistantReply> {
  const intent = detectIntent(message);

  if (intent === 'help' || intent === 'greeting') {
    return {
      text:
        (intent === 'greeting' ? `Olá! Aqui é o ${ASSISTANT_NAME}. ` : '') +
        'Descreva uma movimentação em linguagem natural e eu preparo o lançamento para você confirmar. Exemplos:\n' +
        HELP_EXAMPLES.slice(0, 4).map((e) => `• ${e}`).join('\n'),
    };
  }

  if (intent === 'summary') {
    const key = monthKeyOf(now);
    const monthTx = transactions.filter((t) => monthKey(t.date) === key);
    const s = summarize(monthTx);
    const top = expensesByCategory(monthTx)[0];
    return {
      text:
        `Resumo de ${monthLabel(key, 'long')}:\n` +
        `• Entradas: ${formatBRL(s.income)}\n` +
        `• Saídas: ${formatBRL(s.expense)}\n` +
        `• Saldo líquido: ${formatBRL(s.net)}` +
        (top ? `\nMaior gasto: ${getCategory(top.category).name} (${formatBRL(top.total)}).` : ''),
    };
  }

  const parsed = parseTransaction(message, now);
  if (!parsed) {
    return {
      text: 'Não consegui identificar um valor nessa mensagem. Tente algo como "Gastei 50 reais no mercado hoje".',
    };
  }

  return { text: commentFor(parsed.draft, parsed.assumed.includes('category')), draft: parsed.draft };
}

/**
 * Comentários curtos e amigáveis exibidos junto ao card da prévia.
 *
 * PONTO DE AJUSTE: estes textos são provisórios. Ao integrar um LLM, gere o
 * comentário no prompt do assistente (ex.: "comente a despesa em uma frase curta
 * e amigável, sem repetir valor, data ou categoria") e devolva-o em `text`.
 */
const COMMENTS: Partial<Record<CategoryId, string[]>> = {
  alimentacao: ['Bom apetite!', 'Anotado. Comer bem também é investimento.'],
  transporte: ['Boa viagem!', 'Anotado. Que o trânsito colabore.'],
  compras: ['Aproveite a compra!', 'Anotado. Que seja bem útil.'],
  contas: ['Conta em dia é tranquilidade.', 'Uma a menos para se preocupar.'],
  lazer: ['Divirta-se!', 'Descansar também faz parte do plano.'],
  saude: ['Cuidar da saúde é prioridade.', 'Anotado. Melhoras, se for o caso!'],
  educacao: ['Conhecimento sempre rende.', 'Ótimo investimento em você.'],
  servicos: ['Anotado.', 'Serviço registrado.'],
  investimentos: ['Seu eu do futuro agradece.', 'Mais um passo para os seus objetivos.'],
  salario: ['Dia de pagamento!', 'Salário na conta.'],
  extra: ['Renda extra é sempre bem-vinda!', 'Mandou bem!'],
  reembolso: ['Dinheiro de volta.', 'Reembolso anotado.'],
  vrva: ['Benefício creditado.'],
  vt: ['Benefício creditado.'],
};

function commentFor(draft: TxDraft, unknownCategory: boolean): string {
  if (unknownCategory) return 'Não reconheci a categoria. Se precisar, é só ajustar.';
  const options = COMMENTS[draft.category] ?? ['Anotado.'];
  const base = options[Math.floor(Math.random() * options.length)];
  return draft.installments >= 2 ? `${base} Dividi em ${draft.installments} parcelas mensais.` : base;
}
