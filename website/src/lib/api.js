// Cliente de la API: todas las llamadas pasan por aquí.
const CLAVE_ADMIN = 'naile-admin';
export const sesionAdmin = {
  obtener: () => sessionStorage.getItem(CLAVE_ADMIN) || '',
  guardar: (t) => sessionStorage.setItem(CLAVE_ADMIN, t),
  cerrar: () => sessionStorage.removeItem(CLAVE_ADMIN)
};

async function pedir(ruta, { body, admin, ...opciones } = {}) {
  const headers = {};
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (admin) headers['x-admin-token'] = sesionAdmin.obtener();
  const res = await fetch(`/api${ruta}`, {
    ...opciones, headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  return datos;
}

const qs = (params) => {
  const limpio = Object.entries(params).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length));
  return limpio.length ? `?${new URLSearchParams(limpio.map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]))}` : '';
};

export const api = {
  servicios: () => pedir('/servicios'),
  especialistas: () => pedir('/especialistas'),
  fotos: (params = {}) => pedir(`/fotos${qs(params)}`),
  filtrosFotos: () => pedir('/fotos/filtros'),
  vistaFoto: (id) => pedir(`/fotos/${id}/vista`, { method: 'POST' }).catch(() => {}),
  productos: (params = {}) => pedir(`/productos${qs(params)}`),
  producto: (id) => pedir(`/productos/${id}`),
  categoriasProductos: () => pedir('/productos/categorias'),
  guardarDiseno: (d) => pedir('/disenos', { method: 'POST', body: d }),
  disponibilidad: (especialistaId, fecha) => pedir(`/citas/disponibilidad${qs({ especialistaId, fecha })}`),
  crearCita: (datos) => pedir('/citas', { method: 'POST', body: datos }),
  crearPedido: (datos) => pedir('/pedidos', { method: 'POST', body: datos }),

  admin: {
    verificar: () => pedir('/admin/verificar', { admin: true }),
    citas: (fecha) => pedir(`/admin/citas${qs({ fecha })}`, { admin: true }),
    estadoCita: (id, accion) => pedir(`/admin/citas/${id}/estado`, { method: 'PATCH', body: { accion }, admin: true }),
    subirFoto: (formData) => pedir('/admin/fotos', { method: 'POST', body: formData, admin: true }),
    editarFoto: (id, datos) => pedir(`/admin/fotos/${id}`, { method: 'PUT', body: datos, admin: true }),
    borrarFoto: (id) => pedir(`/admin/fotos/${id}`, { method: 'DELETE', admin: true }),
    imagenProducto: (id, formData) => pedir(`/admin/productos/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    pedidos: () => pedir('/admin/pedidos', { admin: true }),
    crearProducto: (datos) => pedir('/admin/productos', { method: 'POST', body: datos, admin: true }),
    actualizarProducto: (id, datos) => pedir(`/admin/productos/${id}`, { method: 'PUT', body: datos, admin: true }),
    borrarProducto: (id) => pedir(`/admin/productos/${id}`, { method: 'DELETE', admin: true }),
  }
};
