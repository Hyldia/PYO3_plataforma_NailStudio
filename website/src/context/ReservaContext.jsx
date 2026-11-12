// Guarda lo que la clienta va eligiendo entre páginas: diseño, foto de referencia, servicio...
import { createContext, useContext, useState } from 'react';

const ReservaContext = createContext(null);
const VACIA = { diseno: null, fotoRef: null };

export function ReservaProvider({ children }) {
  const [reserva, setReserva] = useState(VACIA);
  const actualizar = (cambios) => setReserva((r) => ({ ...r, ...cambios }));
  const reiniciar = () => setReserva(VACIA);
  return <ReservaContext.Provider value={{ reserva, actualizar, reiniciar }}>{children}</ReservaContext.Provider>;
}

export const useReserva = () => useContext(ReservaContext);
