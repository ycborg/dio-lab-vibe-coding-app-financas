import { getCategory, paymentLabel } from '../data/categories';
import type { Transaction } from '../types';
import { formatBRL, formatDateTime } from './format';
import { summarize } from './finance';
import { installmentLabel } from './installments';

/** Exportação da listagem filtrada para CSV (compatível com Excel pt-BR) ou PDF (via impressão). */

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCSV(txs: readonly Transaction[], filename = 'fin-transacoes.csv'): void {
  const header = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Parcela', 'Pagamento'];
  const rows = txs.map((t) => [
    formatDateTime(t.date).replace(' · ', ' '),
    t.description,
    getCategory(t.category).name,
    t.type === 'income' ? 'Entrada' : 'Saída',
    (t.type === 'income' ? t.amount : -t.amount).toFixed(2).replace('.', ','),
    // "2 de 5" em vez de "2/5": o Excel converteria a barra em data.
    t.installmentIndex ? `${t.installmentIndex} de ${t.installments}` : 'À vista',
    paymentLabel(t.paymentMethod),
  ]);
  // Separador ";" e BOM UTF-8 para abrir corretamente no Excel em português.
  const content = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Abre um relatório formatado e aciona a impressão; o usuário escolhe "Salvar como PDF". */
export function exportPDF(txs: readonly Transaction[], subtitle: string): boolean {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return false;
  const s = summarize(txs);
  const rows = txs
    .map(
      (t) => `<tr>
        <td>${esc(formatDateTime(t.date))}</td>
        <td>${esc(t.description)}${installmentLabel(t) ? ` <span class="tag">${installmentLabel(t)}</span>` : ''}</td>
        <td><span class="dot" style="background:${getCategory(t.category).color}"></span>${esc(getCategory(t.category).name)}</td>
        <td class="num ${t.type}">${t.type === 'income' ? '+' : '−'} ${esc(formatBRL(t.amount))}</td>
      </tr>`,
    )
    .join('');
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>FIN — Transações</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;color:#161B22;margin:32px;font-size:12px}
    h1{font-size:18px;margin:0 0 4px}p{color:#57606a;margin:0 0 16px}
    .sum{display:flex;gap:24px;margin-bottom:16px}.sum b{display:block;font-size:14px}
    table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #d0d7de}
    th{font-weight:600;color:#57606a}.num{text-align:right;white-space:nowrap}.income{color:#1a7f37}.expense{color:#cf222e}
    .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
    .tag{border:1px solid #d0d7de;border-radius:4px;padding:0 4px;font-size:10px}
  </style></head><body>
  <h1>FIN assistente — Transações</h1><p>${esc(subtitle)} · ${txs.length} registros</p>
  <div class="sum"><div>Entradas<b class="income">${esc(formatBRL(s.income))}</b></div>
  <div>Saídas<b class="expense">${esc(formatBRL(s.expense))}</b></div><div>Saldo<b>${esc(formatBRL(s.net))}</b></div></div>
  <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="num">Valor</th></tr></thead><tbody>${rows}</tbody></table>
  <script>window.onload=()=>{window.print()}<\/script></body></html>`);
  win.document.close();
  return true;
}
