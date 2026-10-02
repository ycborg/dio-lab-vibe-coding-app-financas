import { getCategory } from '../data/categories';
import type { CategoryId } from '../types';

/** Pílula preenchida com a cor semântica exclusiva da categoria (RF07). */
export function CategoryPill({ id }: { id: CategoryId }) {
  const c = getCategory(id);
  return (
    <span className="pill" style={{ background: c.color }}>
      {c.name}
    </span>
  );
}

export function CategoryDot({ id, size = 8 }: { id: CategoryId; size?: number }) {
  return <span className="dot" style={{ background: getCategory(id).color, width: size, height: size }} aria-hidden="true" />;
}
