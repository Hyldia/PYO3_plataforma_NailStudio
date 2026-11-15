// Botón "Ver más" al estilo de las tiendas en línea: barra de avance y botón animado
export default function VerMas({ vistos, total, cargando, onClick, texto = 'Ver más', cosa = 'artículos' }) {
  if (vistos >= total) return null;
  return (
    <div className="ver-mas">
      <p className="ver-mas__texto">Viendo {vistos} de {total} {cosa}</p>
      <div className="ver-mas__barra" aria-hidden="true"><span style={{ width: `${Math.round((vistos / total) * 100)}%` }} /></div>
      <button type="button" className="boton-ver-mas" onClick={onClick} disabled={cargando}>
        {cargando ? <><span className="girando" aria-hidden="true" /> Cargando…</> : <>{texto} <span className="flecha-baja" aria-hidden="true">⌄</span></>}
      </button>
    </div>
  );
}

// Tarjetas grises que brillan mientras llegan las siguientes
export const Fantasmas = ({ n = 5 }) => Array.from({ length: n }, (_, i) => (
  <li key={`f${i}`} className="tarjeta-fantasma" aria-hidden="true"><span /><span /><span /></li>
));
