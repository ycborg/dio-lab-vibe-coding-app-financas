import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { generateSampleTransactions } from '../data/seed';
import { sortByDateDesc } from '../lib/finance';
import { expandDraft, migrateLegacyInstallments } from '../lib/installments';
import { KEYS, LEGACY_PREFIX, readJSON, readLegacy, writeJSON } from '../lib/storage';
import type { Transaction, TxDraft } from '../types';

export type RemoveScope = 'single' | 'group';

interface DataValue {
  /** Transações salvas, sempre ordenadas da mais recente para a mais antiga. */
  transactions: Transaction[];
  /** Registra o rascunho; compras parceladas geram uma transação por parcela. */
  addTransaction: (draft: TxDraft) => Transaction[];
  /** Atualiza uma transação. Se ela for parcela, a compra inteira é regerada a partir do rascunho. */
  updateTransaction: (id: string, draft: TxDraft) => void;
  /** Remove uma transação; com `group`, remove todas as parcelas da mesma compra. */
  removeTransaction: (id: string, scope?: RemoveScope) => void;
  /** Todas as parcelas de uma compra, em ordem. */
  getGroup: (groupId: string) => Transaction[];
}

const DataContext = createContext<DataValue | null>(null);

/**
 * Carrega as transações salvas neste navegador. Ordem de prioridade:
 * 1) dados atuais; 2) dados da versão anterior (com contas); 3) histórico de exemplo
 *    gerado uma única vez na primeira visita, para o app já abrir com conteúdo.
 */
function loadInitial(): Transaction[] {
  let stored = readJSON<Transaction[] | null>(KEYS.transactions, null);
  if (!stored) stored = readLegacy<Transaction>(LEGACY_PREFIX.transactions);
  if (!stored && !readJSON<boolean>(KEYS.seeded, false)) {
    stored = generateSampleTransactions();
    writeJSON(KEYS.seeded, true);
  }
  return sortByDateDesc(migrateLegacyInstallments(stored ?? []).list);
}

/** CRUD de transações persistido no navegador (localStorage). */
export function DataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(loadInitial);

  useEffect(() => {
    writeJSON(KEYS.transactions, transactions);
  }, [transactions]);

  const addTransaction = useCallback((draft: TxDraft) => {
    const created = expandDraft(draft);
    setTransactions((prev) => sortByDateDesc([...created, ...prev]));
    return created;
  }, []);

  const updateTransaction = useCallback((id: string, draft: TxDraft) => {
    setTransactions((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      // Parcelas (ou uma transação que passou a ser parcelada) são regeradas por completo,
      // preservando a data de criação original.
      const removeIds = target.groupId
        ? new Set(prev.filter((t) => t.groupId === target.groupId).map((t) => t.id))
        : new Set([id]);
      const regenerated = expandDraft(draft, target.createdAt);
      if (!target.groupId && regenerated.length === 1) regenerated[0].id = id;
      return sortByDateDesc([...prev.filter((t) => !removeIds.has(t.id)), ...regenerated]);
    });
  }, []);

  const removeTransaction = useCallback((id: string, scope: RemoveScope = 'single') => {
    setTransactions((prev) => {
      const target = prev.find((t) => t.id === id);
      if (scope === 'group' && target?.groupId) return prev.filter((t) => t.groupId !== target.groupId);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const getGroup = useCallback(
    (groupId: string) =>
      transactions.filter((t) => t.groupId === groupId).sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0)),
    [transactions],
  );

  const value = useMemo(
    () => ({ transactions, addTransaction, updateTransaction, removeTransaction, getGroup }),
    [transactions, addTransaction, updateTransaction, removeTransaction, getGroup],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>.');
  return ctx;
}
