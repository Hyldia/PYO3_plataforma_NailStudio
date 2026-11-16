// Cuenta de la clienta (Observer como el carrito): quién entró y sus direcciones guardadas.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, sesionCliente } from '../lib/api.js';

const Contexto = createContext(null);
export const useUsuario = () => useContext(Contexto);

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(Boolean(sesionCliente.obtener()));

  const recargar = () => api.cuenta.yo()
    .then((r) => { setUsuario(r.usuario); setDirecciones(r.direcciones); })
    .catch((e) => { if (e.status === 401) { sesionCliente.cerrar(); setUsuario(null); setDirecciones([]); } })
    .finally(() => setCargando(false));

  useEffect(() => { if (sesionCliente.obtener()) recargar(); }, []);

  const valor = useMemo(() => ({
    usuario, direcciones, cargando, setDirecciones, recargar,
    entrar({ token, usuario: u }) { sesionCliente.guardar(token); setUsuario(u); return recargar(); },
    async salir() { await api.auth.salir().catch(() => {}); sesionCliente.cerrar(); setUsuario(null); setDirecciones([]); },
    actualizarUsuario: setUsuario
  }), [usuario, direcciones, cargando]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
