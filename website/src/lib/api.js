// Cliente de la API: todas las llamadas pasan por aquí.
const CLAVE_ADMIN = 'naile-admin';
export const sesionAdmin = {
  obtener: () => sessionStorage.getItem(CLAVE_ADMIN) || '',
  guardar: (t) => sessionStorage.setItem(CLAVE_ADMIN, t),
  cerrar: () => sessionStorage.removeItem(CLAVE_ADMIN)
};

// Sesión de la clienta: el token se guarda en este navegador
const CLAVE_SESION = 'ahnails-sesion';
export const sesionCliente = {
  obtener: () => { try { return localStorage.getItem(CLAVE_SESION) || ''; } catch { return ''; } },
  guardar: (t) => { try { localStorage.setItem(CLAVE_SESION, t); } catch { /* sin almacenamiento */ } },
  cerrar: () => { try { localStorage.removeItem(CLAVE_SESION); } catch { /* sin almacenamiento */ } }
};

// Sesión de una especialista en el portal del equipo
const CLAVE_EQUIPO = 'ahnails-equipo';
export const sesionEquipo = {
  obtener: () => { try { return sessionStorage.getItem(CLAVE_EQUIPO) || ''; } catch { return ''; } },
  guardar: (t) => { try { sessionStorage.setItem(CLAVE_EQUIPO, t); } catch { /* sin almacenamiento */ } },
  cerrar: () => { try { sessionStorage.removeItem(CLAVE_EQUIPO); } catch { /* sin almacenamiento */ } }
};

async function bajarArchivo(ruta, nombre) {
  const res = await fetch(`/api${ruta}`, { headers: { 'x-admin-token': sesionAdmin.obtener() } });
  if (!res.ok) throw new Error('No se pudo generar el archivo.');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  a.click(); URL.revokeObjectURL(url);
}

async function pedir(ruta, { body, admin, equipo, ...opciones } = {}) {
  const headers = {};
  const token = sesionCliente.obtener();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (admin) headers['x-admin-token'] = sesionAdmin.obtener();
  if (equipo) headers['x-equipo-token'] = sesionEquipo.obtener();
  const res = await fetch(`/api${ruta}`, {
    ...opciones, headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(datos.error || 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'), { status: res.status, requiereCuenta: datos.requiereCuenta });
  return datos;
}

const qs = (params) => {
  const limpio = Object.entries(params).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length));
  return limpio.length ? `?${new URLSearchParams(limpio.map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]))}` : '';
};

export const api = {
  servicios: () => pedir('/servicios'),
  asistente: () => pedir('/asistente'),
  auth: {
    config: () => pedir('/auth/config'),
    registro: (d) => pedir('/auth/registro', { method: 'POST', body: d }),
    entrar: (d) => pedir('/auth/entrar', { method: 'POST', body: d }),
    google: (credential) => pedir('/auth/google', { method: 'POST', body: { credential } }),
    facebook: (accessToken) => pedir('/auth/facebook', { method: 'POST', body: { accessToken } }),
    salir: () => pedir('/auth/salir', { method: 'POST' })
  },
  cuenta: {
    yo: () => pedir('/cuenta'),
    actualizar: (d) => pedir('/cuenta', { method: 'PUT', body: d }),
    historial: () => pedir('/cuenta/historial'),
    crearDireccion: (d) => pedir('/cuenta/direcciones', { method: 'POST', body: d }),
    editarDireccion: (id, d) => pedir(`/cuenta/direcciones/${id}`, { method: 'PUT', body: d }),
    principal: (id) => pedir(`/cuenta/direcciones/${id}/principal`, { method: 'POST' }),
    borrarDireccion: (id) => pedir(`/cuenta/direcciones/${id}`, { method: 'DELETE' })
  },
  cupones: () => pedir('/cupones'),
  validarCupon: (codigo, servicioId, recargo = 0) => pedir(`/cupones/validar${qs({ codigo, servicioId, recargo })}`),
  especialistas: () => pedir('/especialistas'),
  fotos: (params = {}) => pedir(`/fotos${qs(params)}`),
  filtrosFotos: () => pedir('/fotos/filtros'),
  foto: (id) => pedir(`/fotos/${id}`),
  fotosRelacionadas: (id, limite = 15) => pedir(`/fotos/${id}/relacionados${qs({ limite })}`),
  producto: (id) => pedir(`/productos/${id}`),
  productosRelacionados: (id, limite = 15) => pedir(`/productos/${id}/relacionados${qs({ limite })}`),
  vistaFoto: (id) => pedir(`/fotos/${id}/vista`, { method: 'POST' }).catch(() => {}),
  productos: (params = {}) => pedir(`/productos${qs(params)}`),
  portadas: () => pedir('/productos/portadas'),
  productosPorIds: (ids) => pedir(`/productos${qs({ ids })}`),
  resenas: (id, limite = 6, filtro = '') => pedir(`/productos/${id}/resenas${qs({ limite, filtro })}`),
  comentarios: (tipo, id, limite = 6, filtro = '') => pedir(`/comentarios/${tipo}/${id}${qs({ limite, filtro })}`),
  crearComentario: (tipo, id, datos) => pedir(`/comentarios/${tipo}/${id}`, { method: 'POST', body: datos }),
  resumenesComentarios: (tipo) => pedir(`/comentarios/${tipo}`),
  ruleta: () => pedir('/ruleta'),
  girarRuleta: () => pedir('/ruleta', { method: 'POST' }),
  crearResena: (id, datos) => pedir(`/productos/${id}/resenas`, { method: 'POST', body: datos }),
  categoriasProductos: () => pedir('/productos/categorias'),
  guardarDiseno: (d) => pedir('/disenos', { method: 'POST', body: d }),
  agenda: (id, dias = 10) => pedir(`/especialistas/${id}/agenda${qs({ dias })}`),
  libres: (fecha, hora) => pedir(`/citas/libres${qs({ fecha, hora })}`),
  disponibilidad: (especialistaId, fecha) => pedir(`/citas/disponibilidad${qs({ especialistaId, fecha })}`),
  crearCita: (datos) => pedir('/citas', { method: 'POST', body: datos }),
  cotizarPedido: (datos) => pedir('/pedidos/cotizar', { method: 'POST', body: datos }),
  crearPedido: (datos) => pedir('/pedidos', { method: 'POST', body: datos }),

  equipo: {
    entrar: (d) => pedir('/equipo/entrar', { method: 'POST', body: d }),
    yo: () => pedir('/equipo/yo', { equipo: true }),
    cancelarCita: (id, d) => pedir(`/equipo/citas/${id}/cancelar`, { method: 'POST', body: d, equipo: true }),
    pedirLibre: (d) => pedir('/equipo/solicitudes', { method: 'POST', body: d, equipo: true }),
    quitarSolicitud: (id) => pedir(`/equipo/solicitudes/${id}`, { method: 'DELETE', equipo: true }),
    salir: () => pedir('/equipo/salir', { method: 'POST', equipo: true }).catch(() => {})
  },

  admin: {
    servicios: () => pedir('/admin/servicios', { admin: true }),
    crearServicio: (d) => pedir('/admin/servicios', { method: 'POST', body: d, admin: true }),
    editarServicio: (id, d) => pedir(`/admin/servicios/${id}`, { method: 'PUT', body: d, admin: true }),
    borrarServicio: (id) => pedir(`/admin/servicios/${id}`, { method: 'DELETE', admin: true }),
    imagenServicio: (id, formData) => pedir(`/admin/servicios/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    pagoEspecialista: (id, d) => pedir(`/admin/especialistas/${id}/pago`, { method: 'PUT', body: d, admin: true }),
    accesoEspecialista: (id, d) => pedir(`/admin/especialistas/${id}/acceso`, { method: 'PUT', body: d, admin: true }),
    quitarAcceso: (id) => pedir(`/admin/especialistas/${id}/acceso`, { method: 'DELETE', admin: true }),
    ausencias: (id) => pedir(`/admin/especialistas/${id}/ausencias`, { admin: true }),
    agregarAusencias: (id, d) => pedir(`/admin/especialistas/${id}/ausencias`, { method: 'POST', body: d, admin: true }),
    borrarAusencia: (id, ausencia) => pedir(`/admin/especialistas/${id}/ausencias/${ausencia}`, { method: 'DELETE', admin: true }),
    fotoPortada: (clave, formData) => pedir(`/admin/portadas/${encodeURIComponent(clave)}`, { method: 'POST', body: formData, admin: true }),
    quitarFotoPortada: (clave) => pedir(`/admin/portadas/${encodeURIComponent(clave)}`, { method: 'DELETE', admin: true }),
    avisos: () => pedir('/admin/avisos', { admin: true }),
    resolverSolicitud: (id, d) => pedir(`/admin/solicitudes-libres/${id}`, { method: 'POST', body: d, admin: true }),
    nomina: (periodo = {}) => pedir(`/admin/nomina${qs(periodo)}`, { admin: true }),
    marcarAtendidas: (d) => pedir('/admin/nomina/atender-pasadas', { method: 'POST', body: d, admin: true }),
    marcarPagado: (id, periodo) => pedir(`/admin/nomina/${id}/pagado`, { method: 'POST', body: periodo, admin: true }),
    quitarPagado: (id, periodo) => pedir(`/admin/nomina/${id}/pagado${qs(periodo)}`, { method: 'DELETE', admin: true }),
    descargarNomina: (periodo) => bajarArchivo(`/admin/nomina/excel${qs(periodo)}`, `pagos-equipo-${periodo.desde}-al-${periodo.hasta}.xlsx`),
    reportes: (periodo = {}) => pedir(`/admin/reportes${qs(periodo)}`, { admin: true }),
    entrar: (contrasena) => pedir('/admin/entrar', { method: 'POST', body: { contrasena } }),
    verificar: () => pedir('/admin/verificar', { admin: true }),
    salir: () => pedir('/admin/salir', { method: 'POST', admin: true }),
    cambiarContrasena: (datos) => pedir('/admin/contrasena', { method: 'POST', body: datos, admin: true }),
    citas: (fecha) => pedir(`/admin/citas${qs({ fecha })}`, { admin: true }),
    estadoCita: (id, accion) => pedir(`/admin/citas/${id}/estado`, { method: 'PATCH', body: { accion }, admin: true }),
    subirFoto: (formData) => pedir('/admin/fotos', { method: 'POST', body: formData, admin: true }),
    editarFoto: (id, datos) => pedir(`/admin/fotos/${id}`, { method: 'PUT', body: datos, admin: true }),
    borrarFoto: (id) => pedir(`/admin/fotos/${id}`, { method: 'DELETE', admin: true }),
    fotoEspecialista: (id, formData) => pedir(`/admin/especialistas/${id}/foto`, { method: 'POST', body: formData, admin: true }),
    imagenProducto: (id, formData) => pedir(`/admin/productos/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    pedidos: (filtros = {}) => pedir(`/admin/pedidos${qs(filtros)}`, { admin: true }),
    estadoPedido: (id, datos) => pedir(`/admin/pedidos/${id}/estado`, { method: 'PATCH', body: datos, admin: true }),
    calendario: (mes) => pedir(`/admin/calendario${qs({ mes })}`, { admin: true }),
    cancelarCita: (id, datos) => pedir(`/admin/citas/${id}/cancelar`, { method: 'POST', body: datos, admin: true }),
    emergencia: (datos) => pedir('/admin/citas/emergencia', { method: 'POST', body: datos, admin: true }),
    mensajeCita: (id, datos) => pedir(`/admin/citas/${id}/mensaje`, { method: 'POST', body: datos, admin: true }),
    mensajes: () => pedir('/admin/mensajes', { admin: true }),
    tiposMensaje: () => pedir('/admin/mensajes/tipos', { admin: true }),
    mensajeEnviado: (id) => pedir(`/admin/mensajes/${id}/enviado`, { method: 'POST', admin: true }).catch(() => {}),
    fotoAsistente: (formData) => pedir('/admin/asistente/foto', { method: 'POST', body: formData, admin: true }),
    quitarFotoAsistente: () => pedir('/admin/asistente/foto', { method: 'DELETE', admin: true }),
    cambiarFotoDiseno: (id, formData) => pedir(`/admin/fotos/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    productos: (filtros = {}) => pedir(`/admin/productos${qs(filtros)}`, { admin: true }),
    crearProducto: (d) => pedir('/admin/productos', { method: 'POST', body: d, admin: true }),
    editarProducto: (id, d) => pedir(`/admin/productos/${id}`, { method: 'PUT', body: d, admin: true }),
    borrarProducto: (id) => pedir(`/admin/productos/${id}`, { method: 'DELETE', admin: true }),
    equipo: () => pedir('/admin/especialistas', { admin: true }),
    crearEspecialista: (d) => pedir('/admin/especialistas', { method: 'POST', body: d, admin: true }),
    editarEspecialista: (id, d) => pedir(`/admin/especialistas/${id}`, { method: 'PUT', body: d, admin: true }),
    borrarEspecialista: (id) => pedir(`/admin/especialistas/${id}`, { method: 'DELETE', admin: true }),
    async descargarExcelPedidos(filtros = {}) {
      const res = await fetch(`/api/admin/pedidos/excel${qs(filtros)}`, { headers: { 'x-admin-token': sesionAdmin.obtener() } });
      if (!res.ok) throw new Error('No se pudo generar el Excel.');
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: `pedidos-${new Date().toISOString().slice(0, 10)}.xlsx` });
      a.click(); URL.revokeObjectURL(url);
    }
  }
};
