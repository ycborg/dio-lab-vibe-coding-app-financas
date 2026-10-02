import { ROUTES } from '../hooks/useHashRoute';
import { IconCalendar, IconChat, IconList, IconOverview, IconPie } from './Icons';
import { Logo } from './Logo';

const NAV = [
  { path: ROUTES.overview, label: 'Visão Geral', Icon: IconOverview },
  { path: ROUTES.transactions, label: 'Transações', Icon: IconList },
  { path: ROUTES.calendar, label: 'Calendário', Icon: IconCalendar },
  { path: ROUTES.categories, label: 'Categorias', Icon: IconPie },
  { path: ROUTES.chat, label: 'Chat IA', Icon: IconChat },
];

/**
 * Navegação principal (RF01).
 * - Desktop (>= 1024px): menu lateral fixo à esquerda.
 * - Mobile/tablet (< 1024px): barra superior com o logo + barra de navegação
 *   inferior com os ícones de cada aba.
 */
export function Sidebar({ route }: { route: string }) {
  return (
    <>
      <header className="topbar">
        <a href={`#${ROUTES.overview}`} className="topbar__brand"><Logo size={24} /></a>
      </header>

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="sidebar__head">
          <a href={`#${ROUTES.overview}`} className="sidebar__brand"><Logo /></a>
        </div>

        <nav className="sidebar__nav">
          <ul>
            {NAV.map(({ path, label, Icon }) => (
              <li key={path}>
                <a href={`#${path}`} className={`nav-link${route === path ? ' is-active' : ''}`} aria-current={route === path ? 'page' : undefined}>
                  <Icon />
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="sidebar__foot">Seus dados ficam salvos apenas neste navegador.</p>
      </aside>

      <nav className="bottom-nav" aria-label="Navegação principal">
        <ul>
          {NAV.map(({ path, label, Icon }) => (
            <li key={path}>
              <a
                href={`#${path}`}
                className={`bottom-nav__link${route === path ? ' is-active' : ''}`}
                aria-current={route === path ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                <Icon size={22} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
