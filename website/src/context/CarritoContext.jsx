// Patrón Observer: los componentes que usan useCarrito() se actualizan
// automáticamente cuando el carrito cambia (por ejemplo, la insignia del menú).
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const CarritoContext = createContext(null);
const CLAVE = 'naile-carrito';

function reducer(items, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      const existe = items.find((i) => i.id === accion.producto.id);
      if (existe) return items.map((i) => (i.id === existe.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...items, { ...accion.producto, cantidad: 1 }];
    }
    case 'cambiar':
      return items
        .map((i) => (i.id === accion.id ? { ...i, cantidad: i.cantidad + accion.delta } : i))
        .filter((i) => i.cantidad > 0);
    case 'vaciar':
      return [];
    default:
      return items;
  }
}

function cargar() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch { return []; }
}

export function CarritoProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], cargar);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }, [items]);

  const [abierto, setAbierto] = useState(false);

  const valor = useMemo(() => ({
    items, abierto, abrir: () => setAbierto(true), cerrar: () => setAbierto(false),
    cantidad: items.reduce((s, i) => s + i.cantidad, 0),
    total: items.reduce((s, i) => s + i.cantidad * i.precio, 0),
    agregar: (producto) => dispatch({ tipo: 'agregar', producto }),
    cambiar: (id, delta) => dispatch({ tipo: 'cambiar', id, delta }),
    vaciar: () => dispatch({ tipo: 'vaciar' })
  }), [items, abierto]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export const useCarrito = () => useContext(CarritoContext);
