// Lista de favoritos (Observer, igual que el carrito): productos y diseños que la clienta guarda con el corazón.
// Se recuerda en este navegador; si el navegador no deja guardar, funciona igual mientras la página esté abierta.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CLAVE = 'ahnails-favoritos';
const Contexto = createContext(null);
// Nombre: useFavoritos
// Descripción: Usa los favoritos en una página.
// Entrada: Nada.
// Salida: Los favoritos.
// Objetivo: Leer o cambiar favoritos.
export const useFavoritos = () => useContext(Contexto);

// Nombre: leer
// Descripción: Lee los favoritos guardados.
// Entrada: Nada.
// Salida: La lista.
// Objetivo: No perderlos.
function leer() {
  try { const v = JSON.parse(localStorage.getItem(CLAVE)); return Array.isArray(v) ? v : []; } catch { return []; }
}

// Nombre: FavoritosProvider
// Descripción: Comparte los favoritos con todo el sitio.
// Entrada: Las páginas.
// Salida: El proveedor.
// Objetivo: Usarlos en todas partes.
export function FavoritosProvider({ children }) {
  const [items, setItems] = useState(leer);
  const [ultimo, setUltimo] = useState(null); // para la animación del contador
  useEffect(() => { try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* sin almacenamiento */ } }, [items]);

  const valor = useMemo(() => {
    // Nombre: clave
    // Descripción: Arma la clave de un favorito.
    // Entrada: Tipo y número.
    // Salida: La clave.
    // Objetivo: Identificarlo.
    const clave = (tipo, id) => `${tipo}-${id}`;
    // Nombre: tiene
    // Descripción: Revisa si algo está en favoritos.
    // Entrada: Tipo y número.
    // Salida: Sí o no.
    // Objetivo: Pintar el corazón.
    const tiene = (tipo, id) => items.some((i) => i.clave === clave(tipo, id));
    return {
      items,
      ultimo,
      cantidad: items.length,
      tiene,
      // Nombre: alternar
      // Descripción: Agrega o quita de favoritos.
      // Entrada: Tipo y datos.
      // Salida: Nada.
      // Objetivo: Marcar favoritos.
      alternar(tipo, datos) {
        const c = clave(tipo, datos.id);
        setItems((lista) => (lista.some((i) => i.clave === c)
          ? lista.filter((i) => i.clave !== c)
          : [{ ...datos, tipo, clave: c, guardado: Date.now() }, ...lista]));
        setUltimo(Date.now());
      },
      // Nombre: quitar
      // Descripción: Quita un favorito.
      // Entrada: La clave.
      // Salida: Nada.
      // Objetivo: Sacarlo de la lista.
      quitar: (c) => setItems((lista) => lista.filter((i) => i.clave !== c)),
      // Nombre: vaciar
      // Descripción: Vacía los favoritos.
      // Entrada: Nada.
      // Salida: Nada.
      // Objetivo: Empezar de cero.
      vaciar: () => setItems([])
    };
  }, [items, ultimo]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
