// Nombre: numerosPagina
// Descripción: Calcula qué números de página mostrar.
// Entrada: La página y el total.
// Salida: La lista de números.
// Objetivo: Paginación clara.
function numerosPagina(pagina, paginas) {
  if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1);
  if (pagina <= 4) return [1, 2, 3, 4, 5, '...', paginas];
  if (pagina >= paginas - 3) return [1, '...', paginas - 4, paginas - 3, paginas - 2, paginas - 1, paginas];
  return [1, '...', pagina - 1, pagina, pagina + 1, '...', paginas];
}

// Nombre: VerMas
// Descripción: Muestra los botones de páginas.
// Entrada: Página, total y qué hacer al cambiar.
// Salida: Los botones.
// Objetivo: Moverse entre páginas.
export default function VerMas({ pagina = 1, paginas = 1, cargando = false, onCambiar }) {
  if (paginas <= 1) return null;

  // Nombre: cambiar
  // Descripción: Cambia de página.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Ver más resultados.
  const cambiar = (numero) => {
    if (!cargando && numero >= 1 && numero <= paginas && numero !== pagina) onCambiar(numero);
  };

  return (
    <nav className="paginacion" aria-label="Paginación de resultados">
      <button type="button" className="paginacion__boton paginacion__flecha" onClick={() => cambiar(pagina - 1)}
              disabled={cargando || pagina === 1} aria-label="Página anterior">
        <span aria-hidden="true">‹</span>
      </button>
      {numerosPagina(pagina, paginas).map((numero, i) => numero === '...' ? (
        <span key={`e${i}`} className="paginacion__puntos" aria-hidden="true">…</span>
      ) : (
        <button type="button" key={numero} className={`paginacion__boton ${numero === pagina ? 'paginacion__boton--activo' : ''}`}
                onClick={() => cambiar(numero)} disabled={cargando} aria-current={numero === pagina ? 'page' : undefined}
                aria-label={`Página ${numero}`}>
          {numero}
        </button>
      ))}
      <button type="button" className="paginacion__boton paginacion__flecha" onClick={() => cambiar(pagina + 1)}
              disabled={cargando || pagina === paginas} aria-label="Página siguiente">
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}

// Tarjetas grises que brillan mientras llegan las siguientes
// Nombre: Fantasmas
// Descripción: Muestra tarjetas grises mientras carga.
// Entrada: Cuántas.
// Salida: Las tarjetas.
// Objetivo: Que no se vea vacío.
export const Fantasmas = ({ n = 5 }) => Array.from({ length: n }, (_, i) => (
  <li key={`f${i}`} className="tarjeta-fantasma" aria-hidden="true"><span /><span /><span /></li>
));
