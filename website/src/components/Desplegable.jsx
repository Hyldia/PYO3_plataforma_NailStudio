// Botón que abre una lista de opciones (los filtros de Galería y Tienda) y se cierra al tocar afuera.
import { useEffect, useId, useRef, useState } from 'react';

// Chip con menú desplegable (como los filtros de las tiendas en línea).
// Se cierra con Escape o al tocar fuera; el foco vuelve al botón.
// Nombre: Desplegable
// Descripción: Muestra un menú que se abre al tocarlo.
// Entrada: Etiqueta y contenido.
// Salida: El menú.
// Objetivo: Filtros ordenados.
export default function Desplegable({ etiqueta, activo = false, children, alinear = 'izquierda' }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const caja = useRef(null);
  const boton = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    // Nombre: fuera
    // Descripción: Cierra el menú al tocar afuera.
    // Entrada: El clic.
    // Salida: Nada.
    // Objetivo: No estorbar.
    const fuera = (evento) => { if (!caja.current?.contains(evento.target)) setAbierto(false); };
    // Nombre: tecla
    // Descripción: Cierra el menú con Escape.
    // Entrada: La tecla.
    // Salida: Nada.
    // Objetivo: Usar con teclado.
    const tecla = (evento) => { if (evento.key === 'Escape') { setAbierto(false); boton.current?.focus(); } };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  return (
    <div className="desplegable" ref={caja}>
      <button ref={boton} type="button" className={`chip-filtro ${activo ? 'chip-filtro--activo' : ''}`} aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto(!abierto)}>
        {etiqueta}
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d={abierto ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg>
      </button>
      {abierto && (
        <div id={id} className={`desplegable__panel desplegable__panel--${alinear}`}>
          {typeof children === 'function' ? children(() => setAbierto(false)) : children}
        </div>
      )}
    </div>
  );
}
