import { getCategory, naturalType } from '../data/categories';
import type { CategoryId, PaymentMethod, TxDraft, TxType } from '../types';
import { dayKeyOf, toLocalISO } from './format';

/**
 * Interpretador de linguagem natural (pt-BR) para lançamentos financeiros.
 *
 * Funciona com regras determinísticas: extrai valor, parcelas, data, forma de
 * pagamento, tipo e categoria de frases informais como
 * "Paguei 35 reais de combustível no débito hoje".
 *
 * A normalização remove acentos caractere a caractere, preservando os índices,
 * para que trechos encontrados no texto normalizado possam ser recortados do
 * texto original (com acentuação) e usados como descrição.
 */

export interface ParseResult {
  draft: TxDraft;
  /** Campos inferidos por padrão (não encontrados explicitamente no texto). */
  assumed: Array<'type' | 'category' | 'date'>;
}

/** Remove acentos mantendo o mesmo comprimento da string original. */
function normalize(text: string): string {
  let out = '';
  for (const ch of text) {
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += base.length === 1 ? base.toLowerCase() : ch.toLowerCase();
  }
  return out;
}

/** Palavras-chave por categoria (já sem acento). Frases mais longas têm prioridade. */
const KEYWORDS: Record<CategoryId, string[]> = {
  alimentacao: [
    'supermercado', 'mercado', 'almoco', 'jantar', 'lanche', 'ifood', 'restaurante', 'padaria', 'cafe',
    'pizza', 'comida', 'acougue', 'feira', 'hamburguer', 'sorvete', 'marmita', 'delivery', 'hortifruti',
  ],
  compras: [
    'roupa', 'roupas', 'tenis', 'sapato', 'shopping', 'amazon', 'mercado livre', 'shopee', 'presente',
    'celular', 'notebook', 'eletronico', 'compras', 'loja', 'perfume', 'fone', 'movel', 'moveis', 'geladeira', 'eletrodomestico', 'televisao', 'tv',
  ],
  transporte: [
    'combustivel', 'gasolina', 'etanol', 'alcool', 'diesel', 'uber', 'taxi', 'onibus', 'metro', 'trem',
    'estacionamento', 'pedagio', 'posto', 'passagem', 'oficina', 'ipva',
  ],
  contas: [
    'aluguel', 'luz', 'energia', 'agua', 'internet', 'condominio', 'telefone', 'gas', 'iptu',
    'fatura', 'seguro',
  ],
  lazer: [
    'cinema', 'show', 'bar', 'balada', 'viagem', 'passeio', 'jogo', 'ingresso', 'festa', 'teatro', 'hotel',
    'cerveja', 'happy hour',
  ],
  saude: [
    'farmacia', 'remedio', 'remedios', 'medico', 'consulta', 'dentista', 'exame', 'academia',
    'plano de saude', 'hospital', 'terapia', 'psicologo',
  ],
  educacao: ['curso', 'faculdade', 'livro', 'livros', 'escola', 'mensalidade', 'apostila', 'udemy', 'alura', 'material escolar'],
  servicos: [
    'netflix', 'spotify', 'assinatura', 'streaming', 'barbeiro', 'cabeleireiro', 'lavanderia',
    'manutencao', 'conserto', 'diarista', 'prime video', 'youtube premium', 'icloud',
  ],
  investimentos: ['investi', 'investimento', 'aporte', 'cdb', 'tesouro', 'acoes', 'poupanca', 'cripto', 'bitcoin', 'fii', 'fiis'],
  vrva: ['vale refeicao', 'vale alimentacao', 'vr', 'va', 'vr/va'],
  vt: ['vale transporte', 'vt'],
  salario: ['salario', 'pagamento do mes', 'holerite'],
  reembolso: ['reembolso', 'reembolsaram', 'reembolsou', 'estorno', 'devolveram', 'devolucao'],
  extra: ['freela', 'freelance', 'bico', 'extra', 'bonus', 'vendi', 'venda', 'comissao', 'premio', 'pix recebido'],
  outros: [],
};

const INCOME_VERBS = ['recebi', 'ganhei', 'caiu', 'entrou', 'depositaram', 'depositou', 'me pagaram', 'me pagou', 'transferiram'];
const EXPENSE_VERBS = ['paguei', 'gastei', 'comprei', 'pagamento de', 'pago', 'saiu', 'debitou', 'investi', 'assinei'];

const PAYMENT_WORDS: Array<[RegExp, PaymentMethod]> = [
  [/\bdebito\b/, 'debito'],
  [/\bcredito\b|\bcartao\b/, 'credito'],
  [/\bpix\b/, 'pix'],
  [/\bdinheiro\b|\bespecie\b/, 'dinheiro'],
  [/\bboleto\b/, 'boleto'],
  [/\btransferencia\b|\bted\b|\bdoc\b/, 'transferencia'],
];

const MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** Substitui trechos já interpretados por espaços (mantém os índices alinhados). */
function blank(text: string, start: number, end: number): string {
  return text.slice(0, start) + ' '.repeat(end - start) + text.slice(end);
}

function extractInstallments(t: string): { value: number; rest: string } {
  const re = /\b(?:em\s+)?(\d{1,2})\s*(?:x\b|vezes\b|parcelas\b)|\bparcelad[oa]\s+em\s+(\d{1,2})\b/;
  const m = re.exec(t);
  if (!m) return { value: 1, rest: t };
  const n = Number(m[1] ?? m[2]);
  return { value: n >= 1 && n <= 72 ? n : 1, rest: blank(t, m.index, m.index + m[0].length) };
}

function extractDate(t: string, now: Date): { date: Date | null; rest: string } {
  const at = (d: Date) => d;
  const shift = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const rules: Array<[RegExp, (m: RegExpExecArray) => Date | null]> = [
    [/\banteontem\b/, () => shift(-2)],
    [/\bontem\b/, () => shift(-1)],
    [/\bhoje\b|\bagora\b/, () => at(new Date(now))],
    [/\bamanha\b/, () => shift(1)],
    [
      /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
      (m) => {
        const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : now.getFullYear();
        return new Date(year, Number(m[2]) - 1, Number(m[1]), 12, 0);
      },
    ],
    [
      new RegExp(`\\b(?:dia\\s+)?(\\d{1,2})\\s+de\\s+(${Object.keys(MONTHS).join('|')})\\b`),
      (m) => new Date(now.getFullYear(), MONTHS[m[2]], Number(m[1]), 12, 0),
    ],
    [/\bdia\s+(\d{1,2})\b/, (m) => new Date(now.getFullYear(), now.getMonth(), Number(m[1]), 12, 0)],
  ];
  for (const [re, build] of rules) {
    const m = re.exec(t);
    if (!m) continue;
    const d = build(m);
    if (d && !Number.isNaN(d.getTime())) return { date: d, rest: blank(t, m.index, m.index + m[0].length) };
  }
  return { date: null, rest: t };
}

function extractTime(t: string): { h: number; m: number } | null {
  const m = /\b(?:as\s+)?(\d{1,2})(?:h|:)(\d{2})?\b/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  return h < 24 && min < 60 ? { h, m: min } : null;
}

/** Encontra o valor monetário priorizando números marcados com "R$" ou "reais". */
function extractAmount(t: string): number | null {
  const num = String.raw`(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)`;
  const patterns = [
    new RegExp(String.raw`r\$\s*${num}\s*(mil|k)?`),
    new RegExp(String.raw`${num}\s*(mil|k)?\s*(?:reais|real|conto|contos|pila|pilas)\b`),
    new RegExp(String.raw`(?:^|\s)${num}\s*(mil|k)?(?=\s|$|[,.!?])`),
  ];
  for (const re of patterns) {
    const m = re.exec(t);
    if (!m) continue;
    let raw = m[1];
    if (raw.includes(',')) raw = raw.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, '');
    let value = Number(raw);
    if (m[2]) value *= 1000;
    if (Number.isFinite(value) && value > 0) return Math.round(value * 100) / 100;
  }
  return null;
}

/** Palavras-chave que são verbos: definem a categoria, mas não servem como descrição. */
const VERB_KEYWORDS = new Set(['investi', 'vendi', 'reembolsaram', 'reembolsou', 'devolveram']);

interface KeywordHit {
  id: CategoryId;
  start: number;
  end: number;
  verb: boolean;
}

/** Todas as ocorrências de palavras-chave, da primeira citada para a última (empate: termo mais longo). */
function findKeywords(norm: string): KeywordHit[] {
  const hits: KeywordHit[] = [];
  for (const [id, words] of Object.entries(KEYWORDS) as Array<[CategoryId, string[]]>) {
    for (const w of words) {
      const m = new RegExp(`(?:^|[^a-z0-9])(${escapeRe(w)})(?=$|[^a-z0-9])`).exec(norm);
      if (!m) continue;
      const start = m.index + m[0].indexOf(m[1]);
      hits.push({ id, start, end: start + w.length, verb: VERB_KEYWORDS.has(w) });
    }
  }
  return hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
}

const containsAny = (norm: string, words: string[]) =>
  words.some((w) => new RegExp(`(?:^|[^a-z])${escapeRe(w)}(?=$|[^a-z])`).test(norm));

const STOP_WORDS = new Set(['um', 'uma', 'o', 'a', 'os', 'as', 'de', 'do', 'da', 'no', 'na', 'em', 'com', 'por', 'pra', 'para', 'reais', 'real', 'hoje', 'ontem', 'anteontem']);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Monta uma descrição legível, em ordem de preferência:
 * 1) o termo de categoria citado (estendido para "Conta de luz");
 * 2) o objeto após um verbo ("comprei uma geladeira" → "Geladeira");
 * 3) a primeira palavra significativa; 4) o nome da categoria.
 */
function buildDescription(original: string, norm: string, hit: KeywordHit | undefined, category: CategoryId): string {
  if (hit) {
    const prefix = /conta (?:de|da) $/.exec(norm.slice(Math.max(0, hit.start - 9), hit.start));
    const start = prefix ? hit.start - prefix[0].length : hit.start;
    return cap(original.slice(start, hit.end).trim());
  }
  const obj = /\b(?:comprei|paguei|gastei|recebi|ganhei)\s+(?:(?:um|uma|o|a|os|as)\s+)?([a-z]{3,}(?:\s+[a-z]{3,})?)/.exec(norm);
  if (obj) {
    const words = obj[1].split(/\s+/).filter((w) => !STOP_WORDS.has(w));
    const start = obj.index + obj[0].lastIndexOf(obj[1]);
    if (words.length) return cap(original.slice(start, start + words.join(' ').length));
  }
  const word = /[a-z]{3,}/g;
  for (let m = word.exec(norm); m; m = word.exec(norm)) {
    if (!STOP_WORDS.has(m[0]) && !INCOME_VERBS.includes(m[0]) && !EXPENSE_VERBS.includes(m[0])) {
      return cap(original.slice(m.index, m.index + m[0].length));
    }
  }
  return getCategory(category).name;
}

/**
 * Converte uma frase livre em um rascunho de transação.
 * Retorna `null` quando nenhum valor monetário é identificado.
 */
export function parseTransaction(text: string, now: Date = new Date()): ParseResult | null {
  const original = text.trim();
  const norm = normalize(original);
  const assumed: ParseResult['assumed'] = [];

  const inst = extractInstallments(norm);
  const dt = extractDate(inst.rest, now);
  const time = extractTime(dt.rest);
  const restForAmount = time ? dt.rest.replace(/\b(?:as\s+)?\d{1,2}(?:h|:)\d{0,2}\b/, ' ') : dt.rest;
  const amount = extractAmount(restForAmount);
  if (amount == null) return null;

  const hits = findKeywords(norm);
  const cat = hits[0];
  let category: CategoryId = cat?.id ?? 'outros';
  if (!cat) assumed.push('category');

  let type: TxType;
  if (containsAny(norm, INCOME_VERBS)) type = 'income';
  else if (containsAny(norm, EXPENSE_VERBS)) type = 'expense';
  else {
    type = cat ? naturalType(category) : 'expense';
    if (!cat) assumed.push('type');
  }
  // Categoria de entrada citada em frase de despesa (ou vice-versa) vira "Outros".
  if (cat && getCategory(category).nature !== 'neutral' && naturalType(category) !== type) {
    if (!(category === 'investimentos' && type === 'income')) category = 'outros';
  }

  const date = dt.date ?? new Date(now);
  if (!dt.date) assumed.push('date');
  if (time) date.setHours(time.h, time.m, 0, 0);

  const paymentMethod = PAYMENT_WORDS.find(([re]) => re.test(norm))?.[1];

  return {
    draft: {
      description: buildDescription(original, norm, hits.find((h) => !h.verb), category),
      amount,
      type,
      category,
      // Horário só é gravado quando a frase o menciona ("às 22h"); senão, apenas a data.
      date: time ? toLocalISO(date) : dayKeyOf(date),
      installments: inst.value,
      paymentMethod: inst.value >= 2 && !paymentMethod ? 'credito' : paymentMethod,
    },
    assumed,
  };
}

export type Intent = 'register' | 'summary' | 'help' | 'greeting' | 'unknown';

/** Classificação simples da intenção da mensagem antes do parsing. */
export function detectIntent(text: string): Intent {
  const n = normalize(text);
  if (/\b(ajuda|como funciona|o que voce faz|exemplos?)\b/.test(n)) return 'help';
  if (/\b(quanto (eu )?gastei|resumo|saldo|balanco|como estou|minhas financas)\b/.test(n)) return 'summary';
  if (/\d/.test(n)) return 'register';
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(n)) return 'greeting';
  return 'unknown';
}
