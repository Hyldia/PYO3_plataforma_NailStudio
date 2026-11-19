// Cuenta de la clienta (Observer como el carrito): quién entró y sus direcciones guardadas.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, sesionCliente } from '../lib/api.js';

const Contexto = createContext(null);
// Nombre: useUsuario
// Descripción: Usa la clienta conectada en una página.
// Entrada: Nada.
// Salida: La sesión.
// Objetivo: Saber quién está.
export const useUsuario = () => useContext(Contexto);

// Nombre: UsuarioProvider
// Descripción: Comparte la sesión de la clienta.
// Entrada: Las páginas.
// Salida: El proveedor.
// Objetivo: Usarla en todo el sitio.
export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(Boolean(sesionCliente.obtener()));

  // Nombre: recargar
  // Descripción: Vuelve a leer los datos de la clienta.
  // Entrada: Nada.
  // Salida: Una promesa.
  // Objetivo: Tener datos al día.
  const recargar = () => api.cuenta.yo()
    .then((respuesta) => { setUsuario(respuesta.usuario); setDirecciones(respuesta.direcciones); })
    .catch((e) => { if (e.status === 401) { sesionCliente.cerrar(); setUsuario(null); setDirecciones([]); } })
    .finally(() => setCargando(false));

  useEffect(() => { if (sesionCliente.obtener()) recargar(); }, []);

  const valor = useMemo(() => ({
    usuario, direcciones, cargando, setDirecciones, recargar,
    // Nombre: entrar
    // Descripción: Guarda la sesión al entrar.
    // Entrada: El permiso y la clienta.
    // Salida: Una promesa.
    // Objetivo: Dejarla conectada.
    entrar({ token, usuario: u }) { sesionCliente.guardar(token); setUsuario(u); return recargar(); },
    // Nombre: salir
    // Descripción: Cierra la sesión.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Salir de la cuenta.
    async salir() { await api.auth.salir().catch(() => {}); sesionCliente.cerrar(); setUsuario(null); setDirecciones([]); },
    actualizarUsuario: setUsuario
  }), [usuario, direcciones, cargando]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
