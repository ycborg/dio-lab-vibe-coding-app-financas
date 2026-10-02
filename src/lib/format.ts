/** Formatação monetária e de datas (pt-BR) e conversões de datas locais. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatBRL = (value: number): string => brl.format(value);
export const formatBRLCompact = (value: number): string => brlCompact.format(value);
/** Formato ultracompacto para células estreitas: 980 → "980", 1150 → "1,2k", 2000000 → "2M". */
export function formatNumberCompact(value: number): string {
  const abs = Math.abs(value);
  const short = (n: number, suffix: string) => `${n.toFixed(1).replace('.', ',').replace(/,0$/, '')}${suffix}`;
  if (abs < 1000) return String(Math.round(value));
  if (abs < 1_000_000) return short(value / 1000, 'k');
  return short(value / 1_000_000, 'M');
}

/** Valor com sinal explícito, usado em cards e saldos. */
export function formatSigned(value: number): string {
  if (value === 0) return brl.format(0);
  // Espaço não-quebrável: o sinal nunca fica sozinho em outra linha.
  return `${value > 0 ? '+' : '−'}\u00a0${brl.format(Math.abs(value))}`;
}

export const formatPercent = (ratio: number): string =>
  `${(ratio * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export const pad = (n: number): string => String(n).padStart(2, '0');

const MONTHS_LONG = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** Converte um Date para o formato local `YYYY-MM-DDTHH:mm`. */
export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Interpreta `YYYY-MM-DD[THH:mm]` como data local (sem conversão de fuso). */
export function parseLocal(s: string): Date {
  const [datePart, timePart = '00:00'] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

export const dayKey = (iso: string): string => iso.slice(0, 10);
export const monthKey = (iso: string): string => iso.slice(0, 7);
export const yearKey = (iso: string): string => iso.slice(0, 4);
export const monthKeyOf = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const dayKeyOf = (d: Date): string => `${monthKeyOf(d)}-${pad(d.getDate())}`;

/** Soma `delta` meses a uma chave `YYYY-MM`. */
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKeyOf(new Date(y, m - 1 + delta, 1));
}

/** `2026-09` → "set/26" (short) ou "Setembro de 2026" (long). */
export function monthLabel(key: string, style: 'short' | 'long' = 'short'): string {
  const [y, m] = key.split('-').map(Number);
  return style === 'short' ? `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}` : `${MONTHS_LONG[m - 1]} de ${y}`;
}

/**
 * O horário é opcional: datas são gravadas como `YYYY-MM-DD` (sem horário)
 * ou `YYYY-MM-DDTHH:mm` (com horário).
 */
export const hasTime = (iso: string): boolean => iso.length > 10;
export const timeOf = (iso: string): string => (hasTime(iso) ? iso.slice(11, 16) : '');

/** Junta data e horário opcional no formato de armazenamento. */
export const joinDateTime = (date: string, time: string): string => (time ? `${date}T${time}` : date);

/** "01/10/2026 · 14:30", ou apenas "01/10/2026" quando não há horário. */
export function formatDateTime(iso: string): string {
  return hasTime(iso) ? `${formatDate(iso)} · ${timeOf(iso)}` : formatDate(iso);
}

export function formatDate(iso: string): string {
  const d = parseLocal(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "quarta-feira, 1 de outubro" — usado em cabeçalhos de agrupamento por dia. */
export function formatDayHeading(iso: string): string {
  const d = parseLocal(iso);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

/**
 * Converte texto digitado pelo usuário em número.
 * Aceita "1.234,56", "1234,56", "1234.56" e "R$ 35".
 */
export function parseAmountInput(raw: string): number | null {
  const s = raw.replace(/[R$\s]/g, '');
  if (!s) return null;
  let normalized: string;
  if (s.includes(',')) normalized = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) normalized = s.replace(/\./g, '');
  else normalized = s;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Número → texto editável no padrão brasileiro ("1234,5" → "1234,50"). */
export const amountToInput = (n: number): string => n.toFixed(2).replace('.', ',');
