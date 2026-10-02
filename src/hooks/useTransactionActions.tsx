import { useState } from 'react';
import { ConfirmDialog, Modal } from '../components/Modal';
import { TransactionFormModal } from '../components/TransactionForm';
import { useData, type RemoveScope } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatBRL } from '../lib/format';
import { groupToDraft } from '../lib/installments';
import type { Transaction, TxDraft } from '../types';

/**
 * Centraliza o fluxo de criar / editar / excluir transações com seus diálogos,
 * para que cada página apenas chame `create()`, `edit(tx)` ou `remove(tx)`.
 *
 * Parcelas: editar abre a compra inteira (valor total + nº de parcelas);
 * excluir pergunta se remove só a parcela ou todas.
 */
export function useTransactionActions() {
  const { addTransaction, updateTransaction, removeTransaction, getGroup } = useData();
  const notify = useToast();
  const [form, setForm] = useState<{ editing?: Transaction; initial?: Partial<TxDraft>; groupSize?: number } | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const doDelete = (tx: Transaction, scope: RemoveScope = 'single') => {
    removeTransaction(tx.id, scope);
    notify(
      scope === 'group' ? `Todas as parcelas de "${tx.description}" foram excluídas.` : `"${tx.description}" excluída.`,
      'negative',
    );
  };

  const create = (initial?: Partial<TxDraft>) => setForm({ initial });

  const edit = (tx: Transaction) => {
    const group = tx.groupId ? getGroup(tx.groupId) : [];
    if (group.length) setForm({ editing: tx, initial: groupToDraft(group), groupSize: group.length });
    else setForm({ editing: tx, initial: tx });
  };

  // Toda exclusão pede confirmação; em parcelas, o usuário também escolhe o escopo.
  const remove = (tx: Transaction) => setToDelete(tx);

  const submit = (draft: TxDraft) => {
    if (form?.editing) {
      updateTransaction(form.editing.id, draft);
      notify(form.groupSize ? 'Compra parcelada atualizada.' : 'Transação atualizada.', 'positive');
    } else {
      const created = addTransaction(draft);
      notify(
        created.length > 1 ? `Compra registrada em ${created.length} parcelas mensais.` : 'Transação registrada.',
        'positive',
      );
    }
    setForm(null);
  };

  const deleteGroup = toDelete?.groupId ? getGroup(toDelete.groupId) : [];

  const dialogs = (
    <>
      <TransactionFormModal
        open={!!form}
        onClose={() => setForm(null)}
        onSubmit={submit}
        initial={form?.initial}
        title={form?.groupSize ? 'Editar compra parcelada' : form?.editing ? 'Editar transação' : 'Nova transação'}
        subtitle={form?.groupSize ? `As alterações valem para todas as ${form.groupSize} parcelas.` : undefined}
      />

      {/* Exclusão simples */}
      <ConfirmDialog
        open={!!toDelete && !toDelete.groupId}
        title="Excluir transação"
        message={<>Deseja excluir <strong>{toDelete?.description}</strong>? Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) doDelete(toDelete);
          setToDelete(null);
        }}
      />

      {/* Exclusão de parcela: escolha do escopo */}
      <Modal
        open={!!toDelete?.groupId}
        onClose={() => setToDelete(null)}
        title="Excluir parcela"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setToDelete(null)}>Cancelar</button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                if (toDelete) doDelete(toDelete, 'single');
                setToDelete(null);
              }}
            >
              Só esta parcela
            </button>
            <button
              type="button"
              className="btn btn--danger"
              data-autofocus
              onClick={() => {
                if (toDelete) doDelete(toDelete, 'group');
                setToDelete(null);
              }}
            >
              Todas ({deleteGroup.length})
            </button>
          </>
        }
      >
        <p className="text-secondary">
          <strong>{toDelete?.description}</strong> é a parcela {toDelete?.installmentIndex}/{toDelete?.installments} de uma
          compra de {formatBRL(deleteGroup.reduce((acc, t) => acc + t.amount, 0))}. O que deseja excluir?
        </p>
      </Modal>
    </>
  );

  return { create, edit, remove, dialogs };
}
