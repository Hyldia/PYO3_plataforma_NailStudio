// Carrusel que se mueve solo, despacio, sin barra para arrastrar.
// Si las tarjetas caben en la pantalla, se quedan quietas.
// Se detiene al pasar el mouse o al usar el teclado, y respeta "reducir movimiento".
import { useEffect, useRef, useState } from 'react';

const VELOCIDAD = 35; // píxeles por segundo: lento y suave

// Nombre: CarruselAuto
// Descripción: Muestra una fila de tarjetas que se desliza sola en bucle.
// Entrada: Las tarjetas, la clase de la lista y un nombre para lectores de pantalla.
// Salida: El carrusel animado.
// Objetivo: Ver todas las tarjetas sin usar la barra de abajo.
export default function CarruselAuto({ children, className = '', etiqueta }) {
  const marco = useRef(null);
  const lista = useRef(null);
  const [mover, setMover] = useState(false);
  const [duracion, setDuracion] = useState(40);

  useEffect(() => {
    // Nombre: medir
    // Descripción: Revisa si las tarjetas se salen del espacio.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Mover solo cuando hace falta.
    const medir = () => {
      if (!marco.current || !lista.current) return;
      const ancho = lista.current.scrollWidth;
      setMover(ancho > marco.current.clientWidth + 4);
      setDuracion(Math.max(20, ancho / VELOCIDAD));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(marco.current);
    if (lista.current) ro.observe(lista.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={marco} className={`carrusel-auto ${mover ? 'carrusel-auto--mueve' : ''}`} role="region" aria-label={etiqueta}>
      <div className="carrusel-auto__pista" style={{ '--duracion': `${duracion}s` }}>
        <ul ref={lista} className={`${className} carrusel-auto__lista`}>{children}</ul>
        {/* Copia para que el movimiento no se corte (los lectores de pantalla la ignoran) */}
        {mover && <ul className={`${className} carrusel-auto__lista`} aria-hidden="true" inert="">{children}</ul>}
      </div>
    </div>
  );
}
