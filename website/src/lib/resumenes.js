// Promedio de estrellas de cada diseño o servicio (se pide una sola vez y se comparte entre tarjetas)
import { useEffect, useState } from 'react';
import { api } from './api.js';

const cache = {};
export function useResumenes(tipo) {
  const [mapa, setMapa] = useState(() => (cache[tipo] instanceof Map ? cache[tipo] : new Map()));
  useEffect(() => {
    if (cache[tipo] instanceof Map) { setMapa(cache[tipo]); return; }
    if (!cache[tipo]) cache[tipo] = api.resumenesComentarios(tipo).then((l) => (cache[tipo] = new Map(l.map((r) => [r.id, r])))).catch(() => { delete cache[tipo]; return new Map(); });
    let vivo = true;
    Promise.resolve(cache[tipo]).then((m) => vivo && setMapa(m));
    return () => { vivo = false; };
  }, [tipo]);
  return mapa;
}
export const olvidarResumenes = (tipo) => { delete cache[tipo]; };
