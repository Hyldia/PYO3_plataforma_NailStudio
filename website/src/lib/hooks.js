import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReserva } from '../context/ReservaContext.jsx';

// Espera a que la persona deje de escribir antes de buscar
export function useDebounce(valor, ms = 300) {
  const [v, setV] = useState(valor);
  useEffect(() => { const t = setTimeout(() => setV(valor), ms); return () => clearTimeout(t); }, [valor, ms]);
  return v;
}

// Guarda una foto de la galería como referencia y lleva a reservar o a personalizar
export function useUsarFoto() {
  const { actualizar } = useReserva();
  const navegar = useNavigate();
  return (foto, destino = '/reservar') => { actualizar({ fotoRef: foto }); navegar(destino); };
}

export function useTitulo(titulo) {
  useEffect(() => { document.title = titulo ? `${titulo} · Nailé` : 'Nailé · Salón de uñas'; }, [titulo]);
}
