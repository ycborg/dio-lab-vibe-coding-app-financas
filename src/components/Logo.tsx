/**
 * Logotipo institucional "Fin-Chart em barras" (DRS §2.3): três colunas de topo
 * angulado, sobre uma linha base #30363D, desenhando a curva ascendente de uma
 * barbatana dorsal que culmina no vértice direito.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M3 27.25h26" stroke="#30363D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 25.5v-5l4.5-2.6v7.6z" fill="#8B949E" />
      <path d="M12.5 25.5v-9.4l5-4.4v13.8z" fill="#B1BAC4" />
      <path d="M19.5 25.5V10.8c0-3.1 2.6-6 7-7.6v22.3z" fill="#E6EDF3" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="logo" aria-label="FIN assistente">
      <LogoMark size={size} />
      <span className="logo__word" aria-hidden="true">
        <span className="logo__fin">FIN</span>
        <span className="logo__sub">assistente</span>
      </span>
    </span>
  );
}
