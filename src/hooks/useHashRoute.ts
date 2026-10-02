import { useEffect, useState } from 'react';

/** Rotas da aplicação (hash routing: funciona em qualquer hospedagem estática). */
export const ROUTES = {
  overview: '/visao-geral',
  transactions: '/transacoes',
  calendar: '/calendario',
  categories: '/categorias',
  chat: '/chat',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

const current = () => window.location.hash.replace(/^#/, '') || '/';

export function useHashRoute(): string {
  const [path, setPath] = useState(current);
  useEffect(() => {
    const onChange = () => setPath(current());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export function navigate(path: RoutePath, replace = false): void {
  if (replace) window.history.replaceState(null, '', `#${path}`);
  else window.location.hash = path;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}
