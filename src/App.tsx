import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataProvider } from './context/DataContext';
import { navigate, ROUTES, useHashRoute } from './hooks/useHashRoute';
import { CalendarPage } from './pages/CalendarPage';
import { Categories } from './pages/Categories';
import { Chat } from './pages/Chat';
import { Overview } from './pages/Overview';
import { Transactions } from './pages/Transactions';

const PAGES: Record<string, { title: string; Component: () => React.ReactElement }> = {
  [ROUTES.overview]: { title: 'Visão Geral', Component: Overview },
  [ROUTES.transactions]: { title: 'Transações', Component: Transactions },
  [ROUTES.calendar]: { title: 'Calendário', Component: CalendarPage },
  [ROUTES.categories]: { title: 'Categorias', Component: Categories },
  [ROUTES.chat]: { title: 'Chat IA', Component: Chat },
};

/** Roteamento por hash; rotas desconhecidas levam à Visão Geral. */
export function App() {
  const route = useHashRoute();
  const page = PAGES[route];

  useEffect(() => {
    if (!page) navigate(ROUTES.overview, true);
  }, [page]);

  useEffect(() => {
    document.title = page ? `${page.title} · FIN assistente` : 'FIN assistente';
    window.scrollTo(0, 0);
  }, [route, page]);

  if (!page) return null;

  const { Component } = page;
  return (
    <DataProvider>
      <div className="shell">
        <a className="skip-link" href="#main">Pular para o conteúdo</a>
        <Sidebar route={route} />
        <main id="main" className="main" tabIndex={-1}>
          {/* O chat ocupa toda a área de conteúdo, sem margens nem largura máxima */}
          <div className={route === ROUTES.chat ? 'main__inner main__inner--flush' : 'main__inner'}>
            <Component key={route} />
          </div>
        </main>
      </div>
    </DataProvider>
  );
}
