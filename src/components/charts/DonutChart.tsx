import { formatBRL, formatPercent } from '../../lib/format';

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  total: number;
  centerCaption: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
}

const SIZE = 240;
const R = 100;
const STROKE = 24;
const C = SIZE / 2;

function polar(angle: number, r = R) {
  return [C + r * Math.cos(angle), C + r * Math.sin(angle)] as const;
}

/** Arco SVG (traçado) de `start` a `end`, em radianos. */
function arcPath(start: number, end: number): string {
  const [x1, y1] = polar(start);
  const [x2, y2] = polar(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

/**
 * Donut de espessura fina (RF05). O centro mostra o total do período e, ao
 * passar o cursor (ou focar) uma fatia, alterna para nome, valor e percentual.
 */
export function DonutChart({ segments, total, centerCaption, activeId, onActiveChange }: Props) {
  const gap = segments.length > 1 ? 0.02 : 0;
  let cursor = -Math.PI / 2;
  const arcs = segments.map((s) => {
    const sweep = total ? (s.value / total) * Math.PI * 2 : 0;
    const start = cursor + gap / 2;
    const end = cursor + sweep - gap / 2;
    cursor += sweep;
    return { ...s, start, end: Math.max(start + 0.001, end), pct: total ? s.value / total : 0 };
  });
  const active = arcs.find((a) => a.id === activeId);

  return (
    <div className="donut">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="donut__svg" role="img" aria-label={`${centerCaption}: ${formatBRL(total)}`}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="#1F242C" strokeWidth={STROKE} />
        {arcs.length === 1 ? (
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={arcs[0].color}
            strokeWidth={activeId === arcs[0].id ? STROKE + 4 : STROKE}
            className="donut__arc"
            onPointerEnter={() => onActiveChange(arcs[0].id)}
            onPointerLeave={() => onActiveChange(null)}
          />
        ) : (
          arcs.map((a) => (
            <path
              key={a.id}
              d={arcPath(a.start, a.end)}
              fill="none"
              stroke={a.color}
              strokeWidth={activeId === a.id ? STROKE + 4 : STROKE}
              opacity={activeId && activeId !== a.id ? 0.35 : 1}
              className="donut__arc"
              tabIndex={0}
              role="button"
              aria-label={`${a.label}: ${formatBRL(a.value)}, ${formatPercent(a.pct)}`}
              onPointerEnter={() => onActiveChange(a.id)}
              onPointerLeave={() => onActiveChange(null)}
              onFocus={() => onActiveChange(a.id)}
              onBlur={() => onActiveChange(null)}
            />
          ))
        )}
      </svg>
      {/* `key` reinicia a animação de fade a cada troca de conteúdo do centro */}
      <div className="donut__center" aria-live="polite" key={active?.id ?? 'total'}>
        {active ? (
          <>
            <span className="donut__caption">
              <span className="dot" style={{ background: active.color }} />
              {active.label}
            </span>
            <strong className="donut__value">{formatBRL(active.value)}</strong>
            <span className="donut__pct">{formatPercent(active.pct)} do total</span>
          </>
        ) : (
          <>
            <span className="donut__caption">{centerCaption}</span>
            <strong className="donut__value">{formatBRL(total)}</strong>
            <span className="donut__pct">{segments.length} {segments.length === 1 ? 'categoria' : 'categorias'}</span>
          </>
        )}
      </div>
    </div>
  );
}
