/**
 * Camada de persistência local. Toda leitura/escrita é protegida por try/catch
 * porque o armazenamento pode estar indisponível (modo privado, bloqueio do navegador).
 */

export const KEYS = {
  transactions: 'fin:transactions',
  chat: 'fin:chat',
  chartMonths: 'fin:chart-months',
  /** Marca que os dados de exemplo já foram gerados na primeira visita. */
  seeded: 'fin:seeded',
} as const;

/** Prefixos da versão anterior (com contas de usuário), usados apenas para migração. */
export const LEGACY_PREFIX = { transactions: 'fin:tx:', chat: 'fin:chat:' } as const;

/**
 * Lê o maior conjunto salvo sob um prefixo legado (ex.: `fin:tx:<id>`), para que os
 * dados criados quando o app tinha login não se percam.
 */
export function readLegacy<T>(prefix: string): T[] | null {
  try {
    let best: T[] | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const list = JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
      if (Array.isArray(list) && list.length > (best?.length ?? 0)) best = list;
    }
    return best;
  } catch {
    return null;
  }
}

type Area = 'local' | 'session';

function area(kind: Area): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: Area = 'local'): T {
  try {
    const raw = area(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, kind: Area = 'local'): void {
  try {
    area(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento cheio ou bloqueado: a sessão continua apenas em memória */
  }
}

export function removeKey(key: string, kind?: Area): void {
  const kinds: Area[] = kind ? [kind] : ['local', 'session'];
  for (const k of kinds) {
    try {
      area(k)?.removeItem(key);
    } catch {
      /* ignora */
    }
  }
}
