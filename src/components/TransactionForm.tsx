import { useId, useState, type FormEvent } from 'react';
import { defaultCategoryFor, getCategory, PAYMENT_METHODS } from '../data/categories';
import { amountToInput, dayKeyOf, joinDateTime, parseAmountInput, timeOf } from '../lib/format';
import { installmentSummary } from '../lib/installments';
import type { CategoryId, PaymentMethod, TxDraft, TxType } from '../types';
import { CategoryPicker } from './CategoryPicker';
import { IconClose } from './Icons';
import { Modal } from './Modal';

interface FormProps {
  initial?: Partial<TxDraft>;
  formId: string;
  onSubmit: (draft: TxDraft) => void;
}

type Errors = Partial<Record<'description' | 'amount' | 'date' | 'time' | 'installments', string>>;

/**
 * Formulário de criação/edição com validação de interface.
 * O horário é opcional e a quantidade de parcelas só aparece com "Compra parcelada" marcada.
 */
export function TransactionForm({ initial, formId, onSubmit }: FormProps) {
  const uidPrefix = useId();
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial?.amount != null ? amountToInput(initial.amount) : '');
  const [category, setCategory] = useState<CategoryId>(initial?.category ?? defaultCategoryFor(initial?.type ?? 'expense'));
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? dayKeyOf(new Date()));
  const [time, setTime] = useState(initial?.date ? timeOf(initial.date) : '');
  const [isInstallment, setIsInstallment] = useState((initial?.installments ?? 1) >= 2);
  const [installments, setInstallments] = useState(String(Math.max(2, initial?.installments ?? 2)));
  const [payment, setPayment] = useState<PaymentMethod | ''>(initial?.paymentMethod ?? '');
  const [errors, setErrors] = useState<Errors>({});

  const fid = (name: string) => `${uidPrefix}-${name}`;
  const parts = isInstallment ? Number(installments) : 1;
  const parsedAmount = parseAmountInput(amount);
  const validParts = Number.isInteger(parts) && parts >= 2 && parts <= 72;

  const changeType = (next: TxType) => {
    setType(next);
    // Sugere uma categoria coerente quando a atual pertence à natureza oposta.
    const nature = getCategory(category).nature;
    if (nature !== 'neutral' && nature !== next) setCategory(defaultCategoryFor(next));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!description.trim()) next.description = 'Informe uma descrição.';
    if (parsedAmount == null || parsedAmount <= 0) next.amount = 'Informe um valor maior que zero.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Informe uma data válida.';
    if (time && !/^\d{2}:\d{2}$/.test(time)) next.time = 'Horário inválido.';
    if (isInstallment && !validParts) next.installments = 'Use de 2 a 72 parcelas.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      description: description.trim(),
      amount: parsedAmount!,
      type,
      category,
      date: joinDateTime(date, time),
      installments: parts,
      paymentMethod: payment || undefined,
    });
  };

  return (
    <form id={formId} className="form" onSubmit={submit} noValidate>
      <div className="segmented segmented--full" role="radiogroup" aria-label="Tipo de movimentação">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            className={`segmented__item${type === t ? ' is-active' : ''} segmented__item--${t}`}
            onClick={() => changeType(t)}
          >
            {t === 'expense' ? 'Saída' : 'Entrada'}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor={fid('desc')}>Descrição</label>
        <input
          id={fid('desc')}
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Supermercado"
          maxLength={80}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? fid('desc-err') : undefined}
          data-autofocus
        />
        {errors.description && <p className="field__error" id={fid('desc-err')}>{errors.description}</p>}
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor={fid('amount')}>{isInstallment ? 'Valor total (R$)' : 'Valor (R$)'}</label>
          <input
            id={fid('amount')}
            className="input input--num"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? fid('amount-err') : undefined}
          />
          {errors.amount && <p className="field__error" id={fid('amount-err')}>{errors.amount}</p>}
        </div>
        <div className="field">
          <label htmlFor={fid('cat')}>Categoria</label>
          <CategoryPicker id={fid('cat')} label="Categoria" value={category} onChange={(v) => v !== 'all' && setCategory(v)} />
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor={fid('date')}>{isInstallment ? 'Data da 1ª parcela' : 'Data'}</label>
          <input
            id={fid('date')}
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date}
          />
          {errors.date && <p className="field__error">{errors.date}</p>}
        </div>
        <div className="field">
          <label htmlFor={fid('time')}>
            Horário <span className="field__optional">(opcional)</span>
          </label>
          <div className="input-clearable">
            <input
              id={fid('time')}
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-invalid={!!errors.time}
            />
            {time && (
              <button
                type="button"
                className="icon-btn icon-btn--sm input-clearable__btn"
                onClick={() => setTime('')}
                aria-label="Remover horário"
              >
                <IconClose size={14} />
              </button>
            )}
          </div>
          {errors.time && <p className="field__error">{errors.time}</p>}
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor={fid('pay')}>Pagamento</label>
          <select id={fid('pay')} className="input" value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod | '')}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="field field--installment">
          <label className="check check--field">
            <input
              type="checkbox"
              checked={isInstallment}
              onChange={(e) => setIsInstallment(e.target.checked)}
              aria-controls={fid('inst-group')}
              aria-expanded={isInstallment}
            />
            <span>Compra parcelada</span>
          </label>
          {isInstallment && (
            <div className="field reveal" id={fid('inst-group')}>
              <label htmlFor={fid('inst')} className="sr-only">Quantidade de parcelas</label>
              <div className="input-suffix">
                <input
                  id={fid('inst')}
                  type="number"
                  min={2}
                  max={72}
                  className="input input--num"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  aria-invalid={!!errors.installments}
                  aria-describedby={fid('inst-hint')}
                />
                <span className="input-suffix__text" aria-hidden="true">parcelas</span>
              </div>
              <p className={errors.installments ? 'field__error' : 'field__hint'} id={fid('inst-hint')} aria-live="polite">
                {errors.installments ?? (validParts && parsedAmount ? `${installmentSummary(parsedAmount, parts)}, uma por mês` : '')}
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: TxDraft) => void;
  initial?: Partial<TxDraft>;
  title?: string;
  subtitle?: React.ReactNode;
  submitLabel?: string;
}

/** Diálogo que envolve o formulário; o `key` reinicia o estado a cada abertura. */
export function TransactionFormModal({ open, onClose, onSubmit, initial, title, subtitle, submitLabel }: ModalProps) {
  const formId = useId();
  const editing = initial && 'description' in initial && initial.description;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? (editing ? 'Editar transação' : 'Nova transação')}
      subtitle={subtitle}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form={formId} className="btn btn--primary">{submitLabel ?? 'Salvar'}</button>
        </>
      }
    >
      {open && <TransactionForm key={JSON.stringify(initial ?? {})} formId={formId} initial={initial} onSubmit={onSubmit} />}
    </Modal>
  );
}
