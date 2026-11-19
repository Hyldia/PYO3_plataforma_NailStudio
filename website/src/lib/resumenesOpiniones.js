// Promedio de estrellas de cada diseño o servicio (se pide una sola vez y se comparte entre tarjetas)
import { useEffect, useState } from 'react';
import { api } from './api.js';

const cache = {};
// Nombre: useResumenes
// Descripción: Trae las estrellas de muchos elementos.
// Entrada: El tipo.
// Salida: Los resúmenes.
// Objetivo: Mostrar estrellas en tarjetas.
export function useResumenes(tipo) {
  const [mapa, setMapa] = useState(() => (cache[tipo] instanceof Map ? cache[tipo] : new Map()));
  useEffect(() => {
    if (cache[tipo] instanceof Map) { setMapa(cache[tipo]); return; }
    if (!cache[tipo]) cache[tipo] = api.resumenesComentarios(tipo).then((resumenes) => (cache[tipo] = new Map(resumenes.map((resumen) => [resumen.id, resumen])))).catch(() => { delete cache[tipo]; return new Map(); });
    let vivo = true;
    Promise.resolve(cache[tipo]).then((respuesta) => vivo && setMapa(respuesta));
    return () => { vivo = false; };
  }, [tipo]);
  return mapa;
}
// Nombre: olvidarResumenes
// Descripción: Olvida los resúmenes guardados.
// Entrada: El tipo.
// Salida: Nada.
// Objetivo: Volver a pedirlos al opinar.
export const olvidarResumenes = (tipo) => { delete cache[tipo]; };
