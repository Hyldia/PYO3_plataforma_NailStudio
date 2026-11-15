// Lista de favoritos (Observer, igual que el carrito): productos y diseños que la clienta guarda con el corazón.
// Se recuerda en este navegador; si el navegador no deja guardar, funciona igual mientras la página esté abierta.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CLAVE = 'ahnails-favoritos';
const Contexto = createContext(null);
export const useFavoritos = () => useContext(Contexto);

function leer() {
  try { const v = JSON.parse(localStorage.getItem(CLAVE)); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function FavoritosProvider({ children }) {
  const [items, setItems] = useState(leer);
  const [ultimo, setUltimo] = useState(null); // para la animación del contador
  useEffect(() => { try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* sin almacenamiento */ } }, [items]);

  const valor = useMemo(() => {
    const clave = (tipo, id) => `${tipo}-${id}`;
    const tiene = (tipo, id) => items.some((i) => i.clave === clave(tipo, id));
    return {
      items,
      ultimo,
      cantidad: items.length,
      tiene,
      alternar(tipo, datos) {
        const c = clave(tipo, datos.id);
        setItems((lista) => (lista.some((i) => i.clave === c)
          ? lista.filter((i) => i.clave !== c)
          : [{ ...datos, tipo, clave: c, guardado: Date.now() }, ...lista]));
        setUltimo(Date.now());
      },
      quitar: (c) => setItems((lista) => lista.filter((i) => i.clave !== c)),
      vaciar: () => setItems([])
    };
  }, [items, ultimo]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
