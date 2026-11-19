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
