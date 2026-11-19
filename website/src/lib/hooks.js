// Hooks propios que usan varias pantallas (esperar al escribir, título de la pestaña, cuántas tarjetas caben por fila, etc.).
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
  const [valorFinal, setValorFinal] = useState(valor);
  useEffect(() => { const temporizador = setTimeout(() => setValorFinal(valor), ms); return () => clearTimeout(temporizador); }, [valor, ms]);
  return valorFinal;
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
  const [rejilla, ref] = useState(null);
  const [porPagina, setPorPagina] = useState(respaldo);
  useEffect(() => {
    if (!rejilla) return undefined;
    // Nombre: medir
    // Descripción: Lee cuántas columnas tiene la rejilla ahora.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Ajustar la cantidad cuando cambia el tamaño de la pantalla.
    const medir = () => {
      const estilo = getComputedStyle(rejilla);
      let columnas = 1;
      if (estilo.display.includes('grid')) {
        // En una rejilla CSS cada medida de gridTemplateColumns es una columna
        columnas = estilo.gridTemplateColumns.split(' ').filter((parte) => parte && parte !== '0px').length || 1;
      } else {
        // Sin rejilla: cuántas tarjetas caben a lo ancho (se suma un hueco porque la última no lleva hueco a la derecha)
        const primera = rejilla.firstElementChild;
        const hueco = parseFloat(estilo.columnGap) || 0;
        if (primera) columnas = Math.max(1, Math.floor((rejilla.clientWidth + hueco) / (primera.getBoundingClientRect().width + hueco)));
      }
      setPorPagina(Math.max(1, columnas * filas)); // filas completas, sin huecos al final
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(rejilla);
    return () => observador.disconnect();
  }, [rejilla, filas]);
  return [ref, porPagina];
}
