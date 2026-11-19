// Guarda lo que la clienta va eligiendo entre páginas: diseño, foto de referencia, servicio...
import { createContext, useContext, useState } from 'react';

const ReservaContext = createContext(null);
const VACIA = { diseno: null, fotoRef: null };

// Nombre: ReservaProvider
// Descripción: Comparte la reserva en curso con el sitio.
// Entrada: Las páginas.
// Salida: El proveedor.
// Objetivo: No perder la reserva al navegar.
export function ReservaProvider({ children }) {
  const [reserva, setReserva] = useState(VACIA);
  // Nombre: actualizar
  // Descripción: Cambia datos de la reserva.
  // Entrada: Los cambios.
  // Salida: Nada.
  // Objetivo: Ir armando la cita.
  const actualizar = (cambios) => setReserva((anterior) => ({ ...anterior, ...cambios }));
  // Nombre: reiniciar
  // Descripción: Borra la reserva en curso.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Empezar otra.
  const reiniciar = () => setReserva(VACIA);
  return <ReservaContext.Provider value={{ reserva, actualizar, reiniciar }}>{children}</ReservaContext.Provider>;
}

// Nombre: useReserva
// Descripción: Usa la reserva en una página.
// Entrada: Nada.
// Salida: La reserva.
// Objetivo: Leer o cambiarla.
export const useReserva = () => useContext(ReservaContext);
