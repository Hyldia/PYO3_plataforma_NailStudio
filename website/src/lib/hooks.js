import { SALON } from '../config.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReserva } from '../context/ReservaContext.jsx';

// Espera a que la persona deje de escribir antes de buscar
// Nombre: useDebounce
// Descripción: Espera a que dejen de escribir.
// Entrada: El valor y el tiempo.
// Salida: El valor final.
// Objetivo: No buscar en cada tecla.
export function useDebounce(valor, ms = 300) {
  const [v, setV] = useState(valor);
  useEffect(() => { const t = setTimeout(() => setV(valor), ms); return () => clearTimeout(t); }, [valor, ms]);
  return v;
}

// Guarda una foto de la galería como referencia y lleva a reservar o a personalizar
// Nombre: useUsarFoto
// Descripción: Da la función para usar una foto en el diseñador.
// Entrada: Nada.
// Salida: La función.
// Objetivo: Copiar diseños de la galería.
export function useUsarFoto() {
  const { actualizar } = useReserva();
  const navegar = useNavigate();
  return (foto, destino = '/reservar') => { actualizar({ fotoRef: foto }); navegar(destino); };
}

// Nombre: useTitulo
// Descripción: Cambia el título de la pestaña.
// Entrada: El título.
// Salida: Nada.
// Objetivo: Saber en qué página estás.
export function useTitulo(titulo) {
  useEffect(() => { document.title = titulo ? `${titulo} · ${SALON.nombre}` : `${SALON.nombre} · Salón de uñas`; }, [titulo]);
}

// Nombre: usePorPagina
// Descripción: Cuenta cuántas columnas tiene una rejilla y calcula cuántas tarjetas caben en filas completas.
// Entrada: Cuántas filas se quieren y un número de respaldo.
// Salida: La referencia para la rejilla y la cantidad por página.
// Objetivo: Que cada página quede llena, sin huecos al final de la fila.
export function usePorPagina(filas = 2, respaldo = 8) {
  // Se usa una "referencia de función": así mide aunque la rejilla aparezca después
  const [el, ref] = useState(null);
  const [porPagina, setPorPagina] = useState(respaldo);
  useEffect(() => {
    if (!el) return undefined;
    // Nombre: medir
    // Descripción: Lee cuántas columnas tiene la rejilla ahora.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Ajustar la cantidad cuando cambia el tamaño de la pantalla.
    const medir = () => {
      const estilo = getComputedStyle(el);
      let columnas = 1;
      if (estilo.display.includes('grid')) {
        columnas = estilo.gridTemplateColumns.split(' ').filter((x) => x && x !== '0px').length || 1;
      } else {
        const primera = el.firstElementChild;
        const hueco = parseFloat(estilo.columnGap) || 0;
        if (primera) columnas = Math.max(1, Math.floor((el.clientWidth + hueco) / (primera.getBoundingClientRect().width + hueco)));
      }
      setPorPagina(Math.max(1, columnas * filas));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, filas]);
  return [ref, porPagina];
}
