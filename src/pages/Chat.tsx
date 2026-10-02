import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { IconCheck, IconEdit, IconSend } from '../components/Icons';
import { LogoMark } from '../components/Logo';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionFormModal } from '../components/TransactionForm';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { ASSISTANT_NAME, HELP_EXAMPLES, interpret } from '../lib/assistant';
import { uid } from '../lib/finance';
import { formatBRL } from '../lib/format';
import { installmentSummary, splitAmount } from '../lib/installments';
import { KEYS, LEGACY_PREFIX, readJSON, readLegacy, writeJSON } from '../lib/storage';
import type { Transaction, TxDraft } from '../types';

type PreviewStatus = 'pending' | 'confirmed' | 'cancelled';

/** Mensagens renderizadas ao abrir o chat; as anteriores carregam ao rolar para o topo. */
const PAGE_SIZE = 30;
/** Limite do histórico persistido. */
const HISTORY_LIMIT = 1000;
/** Distância (px) do topo que dispara o carregamento da página anterior. */
const LOAD_THRESHOLD = 120;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
  preview?: { draft: TxDraft; status: PreviewStatus };
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: `Olá! Eu sou o ${ASSISTANT_NAME}, seu assistente financeiro. Conte o que você gastou ou recebeu, do seu jeito, e eu preparo o lançamento para você revisar antes de salvar.`,
  at: new Date().toISOString(),
};

/** Carrega o histórico salvo, sempre com a mensagem de boas-vindas atualizada. */
function loadHistory(): Message[] {
  const saved = readJSON<Message[] | null>(KEYS.chat, null) ?? readLegacy<Message>(LEGACY_PREFIX.chat) ?? [];
  return saved.length ? saved.map((m) => (m.id === WELCOME.id ? WELCOME : m)) : [WELCOME];
}

/** Card exibido na prévia: em compras parceladas mostra a 1ª parcela ("1/5"). */
function previewCard(draft: TxDraft): TxDraft | Transaction {
  if (draft.installments < 2) return draft;
  const card: Transaction = {
    ...draft,
    amount: splitAmount(draft.amount, draft.installments)[0],
    installmentIndex: 1,
    id: 'preview',
    createdAt: '',
  };
  return card;
}

function FinAvatar() {
  return (
    <span className="msg__avatar" aria-hidden="true">
      <LogoMark size={16} />
    </span>
  );
}

/** Chat com o assistente Fin para registros em linguagem natural (RF06), em tela cheia. */
export function Chat() {
  const { transactions, addTransaction } = useData();
  const notify = useToast();
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  // Janela de renderização: apenas as últimas `visibleCount` mensagens ficam no DOM,
  // para que a barra de rolagem não encolha indefinidamente com o histórico.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const pendingAnchor = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // A barra de digitação flutua sobre o histórico: expõe sua altura (para o espaçamento
  // final das mensagens) e a largura da barra de rolagem (para não cobri-la).
  useEffect(() => {
    const screen = screenRef.current;
    const log = logRef.current;
    const footer = footerRef.current;
    if (!screen || !log || !footer) return;
    const sync = () => {
      screen.style.setProperty('--composer-h', `${footer.offsetHeight}px`);
      screen.style.setProperty('--scrollbar-w', `${log.offsetWidth - log.clientWidth}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(footer);
    ro.observe(log);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    writeJSON(KEYS.chat, messages.slice(-HISTORY_LIMIT));
  }, [messages]);

  // Rola até o fim somente quando chega uma mensagem nova (não ao carregar antigas
  // nem ao atualizar o status de uma prévia).
  const lastId = messages[messages.length - 1]?.id;
  const firstRender = useRef(true);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: firstRender.current ? 'auto' : 'smooth', block: 'end' });
    firstRender.current = false;
  }, [lastId, thinking]);

  const hasOlder = visibleCount < messages.length;
  const visible = messages.slice(-visibleCount);

  /** Ao se aproximar do topo, carrega a página anterior preservando a posição de leitura. */
  const onLogScroll = () => {
    const log = logRef.current;
    if (!log || !hasOlder || pendingAnchor.current != null || log.scrollTop > LOAD_THRESHOLD) return;
    pendingAnchor.current = log.scrollHeight - log.scrollTop;
    setVisibleCount((c) => Math.min(messages.length, c + PAGE_SIZE));
  };

  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log || pendingAnchor.current == null) return;
    log.scrollTop = log.scrollHeight - pendingAnchor.current;
    pendingAnchor.current = null;
  }, [visibleCount]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;
    setInput('');
    setMessages((m) => [...m, { id: uid(), role: 'user', text: content, at: new Date().toISOString() }]);
    setThinking(true);
    try {
      const reply = await interpret(content, transactions);
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: reply.text,
          at: new Date().toISOString(),
          preview: reply.draft ? { draft: reply.draft, status: 'pending' } : undefined,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', text: 'Tive um problema ao interpretar sua mensagem. Tente novamente.', at: new Date().toISOString() },
      ]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const setPreview = (id: string, patch: Partial<NonNullable<Message['preview']>>) =>
    setMessages((m) => m.map((msg) => (msg.id === id && msg.preview ? { ...msg, preview: { ...msg.preview, ...patch } } : msg)));

  /** Gravação definitiva: só acontece após confirmação explícita do usuário. */
  const confirm = (id: string, draft: TxDraft) => {
    const created = addTransaction(draft);
    setPreview(id, { draft, status: 'confirmed' });
    notify(created.length > 1 ? `${ASSISTANT_NAME} registrou ${created.length} parcelas mensais.` : `${ASSISTANT_NAME} registrou a transação.`, 'positive');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const editingMsg = messages.find((m) => m.id === editing);

  return (
    <div className="chat-screen" ref={screenRef}>
      <header className="chat-screen__header">
        <div className="chat-screen__column chat-screen__header-inner">
          <div className="chat-screen__identity">
            <span className="chat-screen__avatar" aria-hidden="true"><LogoMark size={22} /></span>
            <div>
              <h1 className="chat-screen__name">{ASSISTANT_NAME}</h1>
              <p className="chat-screen__role">Seu assistente financeiro</p>
            </div>
          </div>
        </div>
      </header>

      <div className="chat-screen__log" ref={logRef} onScroll={onLogScroll} role="log" aria-live="polite" aria-label={`Conversa com ${ASSISTANT_NAME}`}>
        <div className="chat-screen__column chat-screen__messages">
          <p className="chat-screen__history" aria-hidden={!hasOlder}>
            {hasOlder ? 'Role para cima para ver mensagens anteriores' : 'Início da conversa'}
          </p>
          {visible.map((m) => (
            <div key={m.id} className={`msg msg--${m.role}`}>
              {m.role === 'assistant' && <FinAvatar />}
              <div className="msg__content">
                {m.preview ? (
                  // Resposta de registro: apenas um comentário curto + o card da prévia.
                  <div className={`preview preview--${m.preview.status}`}>
                    <p className="preview__comment">{m.text}</p>
                    <TransactionCard tx={previewCard(m.preview.draft)} />
                    {m.preview.draft.installments >= 2 && (
                      <p className="preview__total">
                        Total {formatBRL(m.preview.draft.amount)} · {installmentSummary(m.preview.draft.amount, m.preview.draft.installments)}
                      </p>
                    )}
                    {m.preview.status === 'pending' ? (
                      <div className="preview__actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPreview(m.id, { status: 'cancelled' })}>Descartar</button>
                        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(m.id)}><IconEdit size={14} /> Ajustar</button>
                        <button type="button" className="btn btn--primary btn--sm" onClick={() => confirm(m.id, m.preview!.draft)}><IconCheck size={14} /> Confirmar</button>
                      </div>
                    ) : (
                      <p className={`preview__status ${m.preview.status === 'confirmed' ? 'is-positive' : ''}`}>
                        {m.preview.status === 'cancelled'
                          ? 'Lançamento descartado.'
                          : m.preview.draft.installments >= 2
                            ? `Registrada em ${m.preview.draft.installments} parcelas mensais.`
                            : 'Registrada com sucesso.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="msg__bubble">{m.text}</p>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="msg msg--assistant">
              <FinAvatar />
              <p className="msg__bubble msg__typing"><span /><span /><span /><span className="sr-only">{ASSISTANT_NAME} está digitando…</span></p>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="chat-screen__footer" ref={footerRef}>
        <div className="chat-screen__column">
          <div className="chat__suggestions" aria-label="Sugestões">
            {HELP_EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => send(ex)} disabled={thinking}>{ex}</button>
            ))}
          </div>
          <form className="chat__composer" onSubmit={onSubmit}>
            <label htmlFor="chat-input" className="sr-only">Mensagem para {ASSISTANT_NAME}</label>
            <textarea
              id="chat-input"
              ref={inputRef}
              className="input chat__input"
              rows={1}
              value={input}
              placeholder={`Fale com o ${ASSISTANT_NAME}… ex.: "Paguei 35 reais de combustível no débito hoje"`}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              autoFocus
            />
            <button type="submit" className="btn btn--primary chat__send" disabled={!input.trim() || thinking} aria-label="Enviar">
              <IconSend size={16} />
            </button>
          </form>
        </div>
      </footer>

      <TransactionFormModal
        open={!!editingMsg?.preview}
        onClose={() => setEditing(null)}
        initial={editingMsg?.preview?.draft}
        title="Ajustar lançamento"
        submitLabel="Confirmar e registrar"
        onSubmit={(draft) => {
          if (editingMsg) confirm(editingMsg.id, draft);
          setEditing(null);
        }}
      />
    </div>
  );
}
