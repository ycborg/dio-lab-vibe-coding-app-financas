import { useRef, useState } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { MonthPoint } from '../../lib/finance';
import { formatBRL, formatBRLCompact, formatSigned, monthLabel } from '../../lib/format';

const HEIGHT = 300;
const PAD = { top: 16, right: 12, bottom: 30, left: 60 };
const COLORS = { income: '#3FB950', expense: '#F85149', line: '#E6EDF3', axis: '#30363D', grid: 'rgba(255,255,255,0.05)' };

type Series = 'income' | 'expense' | 'net';
const SERIES: { id: Series; label: string }[] = [
  { id: 'income', label: 'Entradas' },
  { id: 'expense', label: 'Saídas' },
  { id: 'net', label: 'Saldo líquido' },
];
/** Opacidade das séries não destacadas. */
const DIMMED = 0.15;

/** Passo "redondo" (1, 2, 2.5, 5 × 10^n) para os ticks do eixo Y. */
function niceStep(range: number, count: number): number {
  const raw = range / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
}

function buildTicks(min: number, max: number): number[] {
  const step = niceStep(max - min || 1, 4);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/**
 * Gráfico de evolução financeira (RF02).
 * Entradas sobem a partir do eixo R$ 0, saídas descem; a linha traça o saldo
 * líquido de cada mês. Hover/toque/teclado (setas) revelam o tooltip do mês.
 * Passar o cursor sobre uma legenda destaca a série correspondente e ofusca as demais.
 */
export function EvolutionChart({ data }: { data: MonthPoint[] }) {
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  // Série destacada pelo hover/foco na legenda.
  const [focusSeries, setFocusSeries] = useState<Series | null>(null);
  const seriesOpacity = (id: Series) => (focusSeries == null || focusSeries === id ? 1 : DIMMED);
  const width = Math.max(measured, 280);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const maxUp = Math.max(0, ...data.map((d) => Math.max(d.income, d.net)));
  const maxDown = Math.max(0, ...data.map((d) => Math.max(d.expense, -d.net)));
  const ticks = buildTicks(-maxDown, maxUp || 1);
  const top = ticks[ticks.length - 1];
  const bottom = ticks[0];
  const y = (v: number) => PAD.top + ((top - v) / (top - bottom)) * innerH;

  const band = innerW / data.length;
  const barW = Math.max(6, Math.min(28, band * 0.42));
  const cx = (i: number) => PAD.left + band * i + band / 2;
  const zeroY = y(0);
  const labelEvery = band < 42 ? 2 : 1;

  const linePath = data.map((d, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)},${y(d.net).toFixed(1)}`).join(' ');

  const indexFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width - PAD.left;
    const i = Math.floor(x / band);
    return i >= 0 && i < data.length ? i : null;
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? data.length) - 1));
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
  };

  // O último mês em foco continua renderizado durante o fade-out do destaque/tooltip.
  const lastActive = useRef<number | null>(null);
  if (active != null) lastActive.current = active;
  const shown = active ?? (lastActive.current != null && lastActive.current < data.length ? lastActive.current : null);
  const visible = active != null;
  const point = shown != null ? data[shown] : null;
  const tooltipLeft = shown != null ? cx(shown) : 0;
  const flip = tooltipLeft > width - 230;

  return (
    <div className="evo">
      <ul className="legend legend--interactive">
        {SERIES.map(({ id, label }) => (
          <li key={id}>
            <button
              type="button"
              className={`legend__item${focusSeries && focusSeries !== id ? ' is-dim' : ''}${focusSeries === id ? ' is-active' : ''}`}
              onMouseEnter={() => setFocusSeries(id)}
              onMouseLeave={() => setFocusSeries(null)}
              onFocus={() => setFocusSeries(id)}
              onBlur={() => setFocusSeries(null)}
              aria-label={`Destacar ${label.toLowerCase()} no gráfico`}
            >
              {id === 'net' ? <span className="legend__line" /> : <span className="legend__swatch" style={{ background: COLORS[id] }} />}
              {label}
            </button>
          </li>
        ))}
      </ul>
      <div
        ref={ref}
        className="evo__canvas"
        tabIndex={0}
        role="group"
        aria-label="Gráfico de evolução financeira mensal. Use as setas para navegar entre os meses."
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          onPointerMove={(e) => setActive(indexFromPointer(e))}
          onPointerDown={(e) => setActive(indexFromPointer(e))}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
          role="img"
          aria-hidden="true"
        >
          {/* Grade e eixo Y */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? COLORS.axis : COLORS.grid} strokeWidth={1} />
              <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="chart-label">
                {t === 0 ? 'R$ 0' : formatBRLCompact(t)}
              </text>
            </g>
          ))}

          {/* Faixa do mês em foco */}
          {shown != null && (
            <rect
              className="evo__band"
              x={0}
              y={PAD.top}
              width={band - 4}
              height={innerH}
              rx={4}
              fill="#1F242C"
              style={{ transform: `translateX(${PAD.left + band * shown + 2}px)`, opacity: visible ? 1 : 0 }}
            />
          )}

          {/* Barras: entradas acima, saídas abaixo do eixo zero (uma camada por série) */}
          {(['income', 'expense'] as const).map((id) => (
            <g key={id} className="evo__series" style={{ opacity: seriesOpacity(id) }}>
              {data.map((d, i) => {
                const value = id === 'income' ? d.income : d.expense;
                if (value <= 0) return null;
                const barTop = id === 'income' ? y(d.income) : zeroY;
                const barH = id === 'income' ? zeroY - y(d.income) : y(-d.expense) - zeroY;
                return (
                  <rect
                    key={d.key}
                    className="evo__bar"
                    x={cx(i) - barW / 2}
                    y={barTop}
                    width={barW}
                    height={barH}
                    rx={2}
                    fill={COLORS[id]}
                    style={{ opacity: active == null || active === i ? 1 : 0.5 }}
                  />
                );
              })}
            </g>
          ))}

          {/* Rótulos dos meses */}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={d.key} x={cx(i)} y={HEIGHT - 10} textAnchor="middle" className={`chart-label${active === i ? ' is-active' : ''}`}>
                {monthLabel(d.key)}
              </text>
            ) : null,
          )}

          {/* Linha do saldo líquido */}
          <g className="evo__series" style={{ opacity: seriesOpacity('net') }}>
            <path d={linePath} fill="none" stroke={COLORS.line} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d, i) => (
              <circle
                key={d.key}
                className="evo__dot"
                cx={cx(i)}
                cy={y(d.net)}
                r={3}
                fill="#161B22"
                stroke={COLORS.line}
                strokeWidth={2}
                style={{ transform: active === i ? 'scale(1.5)' : 'scale(1)' }}
              />
            ))}
          </g>
        </svg>

        {point && (
          <div
            className={`chart-tooltip${visible ? ' is-visible' : ''}`}
            style={{ left: tooltipLeft, top: PAD.top, transform: `translateX(${flip ? 'calc(-100% - 14px)' : '14px'})` }}
            role="status"
            aria-hidden={!visible}
          >
            <p className="chart-tooltip__title">{monthLabel(point.key, 'long')}</p>
            <dl>
              <div className={`chart-tooltip__row${seriesOpacity('income') < 1 ? ' is-dim' : ''}`}>
                <dt><span className="dot" style={{ background: COLORS.income }} />Entradas</dt>
                <dd className="is-positive">{formatBRL(point.income)}</dd>
              </div>
              <div className={`chart-tooltip__row${seriesOpacity('expense') < 1 ? ' is-dim' : ''}`}>
                <dt><span className="dot" style={{ background: COLORS.expense }} />Saídas</dt>
                <dd className="is-negative">{formatBRL(point.expense)}</dd>
              </div>
              <div className={`chart-tooltip__row chart-tooltip__total${seriesOpacity('net') < 1 ? ' is-dim' : ''}`}>
                <dt>Saldo líquido</dt>
                <dd>{formatSigned(point.net)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Tabela equivalente para leitores de tela */}
      <div className="sr-only">
      <table>
        <caption>Entradas, saídas e saldo líquido por mês</caption>
        <thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}><td>{monthLabel(d.key, 'long')}</td><td>{formatBRL(d.income)}</td><td>{formatBRL(d.expense)}</td><td>{formatBRL(d.net)}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
