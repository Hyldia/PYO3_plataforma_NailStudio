// Cliente de la API: todas las llamadas pasan por aquí.
const CLAVE_ADMIN = 'naile-admin';
export const sesionAdmin = {
  // Nombre: obtener
  // Descripción: Lee la sesión del panel.
  // Entrada: Nada.
  // Salida: El permiso.
  // Objetivo: Pedir datos del panel.
  obtener: () => sessionStorage.getItem(CLAVE_ADMIN) || '',
  // Nombre: guardar
  // Descripción: Guarda la sesión del panel.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Seguir conectada.
  guardar: (t) => sessionStorage.setItem(CLAVE_ADMIN, t),
  // Nombre: cerrar
  // Descripción: Borra la sesión del panel.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Salir.
  cerrar: () => sessionStorage.removeItem(CLAVE_ADMIN)
};

// Sesión de la clienta: el token se guarda en este navegador
const CLAVE_SESION = 'ahnails-sesion';
export const sesionCliente = {
  // Nombre: obtener
  // Descripción: Lee la sesión de la clienta.
  // Entrada: Nada.
  // Salida: El permiso.
  // Objetivo: Pedir sus datos.
  obtener: () => { try { return localStorage.getItem(CLAVE_SESION) || ''; } catch { return ''; } },
  // Nombre: guardar
  // Descripción: Guarda la sesión de la clienta.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Seguir conectada.
  guardar: (t) => { try { localStorage.setItem(CLAVE_SESION, t); } catch { /* sin almacenamiento */ } },
  // Nombre: cerrar
  // Descripción: Borra la sesión de la clienta.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Salir.
  cerrar: () => { try { localStorage.removeItem(CLAVE_SESION); } catch { /* sin almacenamiento */ } }
};

// Sesión de una especialista en el portal del equipo
const CLAVE_EQUIPO = 'ahnails-equipo';
export const sesionEquipo = {
  // Nombre: obtener
  // Descripción: Lee la sesión de la especialista.
  // Entrada: Nada.
  // Salida: El permiso.
  // Objetivo: Pedir sus datos.
  obtener: () => { try { return sessionStorage.getItem(CLAVE_EQUIPO) || ''; } catch { return ''; } },
  // Nombre: guardar
  // Descripción: Guarda la sesión de la especialista.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Seguir conectada.
  guardar: (t) => { try { sessionStorage.setItem(CLAVE_EQUIPO, t); } catch { /* sin almacenamiento */ } },
  // Nombre: cerrar
  // Descripción: Borra la sesión de la especialista.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Salir.
  cerrar: () => { try { sessionStorage.removeItem(CLAVE_EQUIPO); } catch { /* sin almacenamiento */ } }
};

// Nombre: bajarArchivo
// Descripción: Descarga un archivo del servidor.
// Entrada: La ruta y el nombre.
// Salida: Nada.
// Objetivo: Bajar el Excel.
async function bajarArchivo(ruta, nombre) {
  const res = await fetch(`/api${ruta}`, { headers: { 'x-admin-token': sesionAdmin.obtener() } });
  if (!res.ok) throw new Error('No se pudo generar el archivo.');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  a.click(); URL.revokeObjectURL(url);
}

// Nombre: pedir
// Descripción: Pide datos al servidor.
// Entrada: La ruta y opciones.
// Salida: La respuesta o un error.
// Objetivo: Hablar con el servidor en un solo lugar.
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

// Nombre: qs
// Descripción: Convierte filtros en texto para la dirección.
// Entrada: Los filtros.
// Salida: El texto (?a=1).
// Objetivo: Enviar búsquedas.
const qs = (params) => {
  const limpio = Object.entries(params).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length));
  return limpio.length ? `?${new URLSearchParams(limpio.map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]))}` : '';
};

export const api = {
  // Nombre: servicios
  // Descripción: Pide los servicios.
  // Entrada: Nada.
  // Salida: Los servicios.
  // Objetivo: Mostrar la carta.
  servicios: () => pedir('/servicios'),
  // Nombre: asistente
  // Descripción: Pide la foto de la asistente.
  // Entrada: Nada.
  // Salida: La foto.
  // Objetivo: Mostrar su cara.
  asistente: () => pedir('/asistente'),
  auth: {
    // Nombre: config
    // Descripción: Pide la configuración de entrada.
    // Entrada: Nada.
    // Salida: Los métodos.
    // Objetivo: Mostrar botones.
    config: () => pedir('/auth/config'),
    // Nombre: registro
    // Descripción: Crea una cuenta.
    // Entrada: Los datos.
    // Salida: La sesión.
    // Objetivo: Registrarse.
    registro: (d) => pedir('/auth/registro', { method: 'POST', body: d }),
    // Nombre: entrar
    // Descripción: Entra con correo.
    // Entrada: Correo y contraseña.
    // Salida: La sesión.
    // Objetivo: Iniciar sesión.
    entrar: (d) => pedir('/auth/entrar', { method: 'POST', body: d }),
    // Nombre: google
    // Descripción: Entra con Google.
    // Entrada: El dato de Google.
    // Salida: La sesión.
    // Objetivo: Iniciar sesión.
    google: (credential) => pedir('/auth/google', { method: 'POST', body: { credential } }),
    // Nombre: facebook
    // Descripción: Entra con Facebook.
    // Entrada: El dato de Facebook.
    // Salida: La sesión.
    // Objetivo: Iniciar sesión.
    facebook: (accessToken) => pedir('/auth/facebook', { method: 'POST', body: { accessToken } }),
    // Nombre: salir
    // Descripción: Cierra la sesión.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Salir.
    salir: () => pedir('/auth/salir', { method: 'POST' })
  },
  cuenta: {
    // Nombre: yo
    // Descripción: Pide los datos de la clienta.
    // Entrada: Nada.
    // Salida: Sus datos.
    // Objetivo: Mostrar "Mi cuenta".
    yo: () => pedir('/cuenta'),
    // Nombre: actualizar
    // Descripción: Actualiza los datos de la clienta.
    // Entrada: Los datos.
    // Salida: La clienta.
    // Objetivo: Editar perfil.
    actualizar: (d) => pedir('/cuenta', { method: 'PUT', body: d }),
    // Nombre: historial
    // Descripción: Pide el historial.
    // Entrada: Nada.
    // Salida: Pedidos y citas.
    // Objetivo: Ver compras.
    historial: () => pedir('/cuenta/historial'),
    // Nombre: cancelarMiCita
    // Descripción: La clienta cancela su cita (solo hasta 2 horas antes).
    // Entrada: El número de cita.
    // Salida: La cita cancelada.
    // Objetivo: Liberar el espacio a tiempo.
    cancelarMiCita: (id) => pedir(`/cuenta/citas/${id}/cancelar`, { method: 'POST', body: {} }),
    // Nombre: crearDireccion
    // Descripción: Crea una dirección.
    // Entrada: Los datos.
    // Salida: La dirección.
    // Objetivo: Guardar direcciones.
    crearDireccion: (d) => pedir('/cuenta/direcciones', { method: 'POST', body: d }),
    // Nombre: editarDireccion
    // Descripción: Edita una dirección.
    // Entrada: Número y datos.
    // Salida: La dirección.
    // Objetivo: Corregirla.
    editarDireccion: (id, d) => pedir(`/cuenta/direcciones/${id}`, { method: 'PUT', body: d }),
    // Nombre: principal
    // Descripción: Marca la dirección principal.
    // Entrada: El número.
    // Salida: Las direcciones.
    // Objetivo: Elegir la de siempre.
    principal: (id) => pedir(`/cuenta/direcciones/${id}/principal`, { method: 'POST' }),
    // Nombre: borrarDireccion
    // Descripción: Borra una dirección.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Quitarla.
    borrarDireccion: (id) => pedir(`/cuenta/direcciones/${id}`, { method: 'DELETE' })
  },
  // Nombre: cupones
  // Descripción: Pide los cupones.
  // Entrada: Nada.
  // Salida: Los cupones.
  // Objetivo: Esconderlos como premios.
  cupones: () => pedir('/cupones'),
  // Nombre: validarCupon
  // Descripción: Revisa un cupón.
  // Entrada: Código, servicio y recargo.
  // Salida: El descuento.
  // Objetivo: Aplicarlo.
  validarCupon: (codigo, servicioId, recargo = 0) => pedir(`/cupones/validar${qs({ codigo, servicioId, recargo })}`),
  // Nombre: especialistas
  // Descripción: Pide las especialistas.
  // Entrada: Nada.
  // Salida: El equipo.
  // Objetivo: Elegir especialista.
  especialistas: () => pedir('/especialistas'),
  // Nombre: fotos
  // Descripción: Pide diseños de la galería.
  // Entrada: Los filtros.
  // Salida: Los diseños.
  // Objetivo: Mostrar la galería.
  fotos: (params = {}) => pedir(`/fotos${qs(params)}`),
  // Nombre: filtrosFotos
  // Descripción: Pide los filtros de la galería.
  // Entrada: Nada.
  // Salida: Las opciones.
  // Objetivo: Llenar filtros.
  filtrosFotos: () => pedir('/fotos/filtros'),
  // Nombre: fotosParecidas
  // Descripción: Pide fotos reales parecidas a un diseño.
  // Entrada: Las palabras del diseño.
  // Salida: La lista de fotos.
  // Objetivo: Mostrar ejemplos reales en el diseñador.
  fotosParecidas: (palabras, limite = 9) => pedir(`/fotos/parecidas${qs({ palabras: palabras.join(','), limite })}`),
  // Nombre: foto
  // Descripción: Pide un diseño.
  // Entrada: El número.
  // Salida: El diseño.
  // Objetivo: Ver su página.
  foto: (id) => pedir(`/fotos/${id}`),
  // Nombre: fotosRelacionadas
  // Descripción: Pide diseños parecidos.
  // Entrada: Número y cuántos.
  // Salida: Los diseños.
  // Objetivo: Sugerir ideas.
  fotosRelacionadas: (id, limite = 15) => pedir(`/fotos/${id}/relacionados${qs({ limite })}`),
  // Nombre: producto
  // Descripción: Pide un producto.
  // Entrada: El número.
  // Salida: El producto.
  // Objetivo: Ver su página.
  producto: (id) => pedir(`/productos/${id}`),
  // Nombre: productosRelacionados
  // Descripción: Pide productos parecidos.
  // Entrada: Número y cuántos.
  // Salida: Los productos.
  // Objetivo: Sugerir compras.
  productosRelacionados: (id, limite = 15) => pedir(`/productos/${id}/relacionados${qs({ limite })}`),
  // Nombre: vistaFoto
  // Descripción: Suma una vista a un diseño.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Contar vistas.
  vistaFoto: (id) => pedir(`/fotos/${id}/vista`, { method: 'POST' }).catch(() => {}),
  // Nombre: productos
  // Descripción: Pide productos.
  // Entrada: Los filtros.
  // Salida: Los productos.
  // Objetivo: Mostrar la tienda.
  productos: (params = {}) => pedir(`/productos${qs(params)}`),
  // Nombre: portadas
  // Descripción: Pide las fotos de portada.
  // Entrada: Nada.
  // Salida: Las fotos.
  // Objetivo: Decorar categorías.
  portadas: () => pedir('/productos/portadas'),
  // Nombre: circulos
  // Descripción: Pide qué círculos de categorías están ocultos y cuáles se agregaron al Inicio.
  // Entrada: Nada.
  // Salida: { ocultos, inicioExtra }.
  // Objetivo: Mostrar solo los círculos que eligió la dueña.
  circulos: () => pedir('/productos/circulos'),
  // Nombre: productosPorIds
  // Descripción: Pide productos por número.
  // Entrada: Los números.
  // Salida: Los productos.
  // Objetivo: Actualizar carrito y favoritos.
  productosPorIds: (ids) => pedir(`/productos${qs({ ids })}`),
  // Nombre: resenas
  // Descripción: Pide reseñas de un producto.
  // Entrada: Número, cuántas y filtro.
  // Salida: Las reseñas.
  // Objetivo: Mostrar opiniones.
  resenas: (id, limite = 6, filtro = '') => pedir(`/productos/${id}/resenas${qs({ limite, filtro })}`),
  // Nombre: comentarios
  // Descripción: Pide comentarios.
  // Entrada: Tipo, número, cuántos y filtro.
  // Salida: Los comentarios.
  // Objetivo: Mostrar opiniones.
  comentarios: (tipo, id, limite = 6, filtro = '') => pedir(`/comentarios/${tipo}/${id}${qs({ limite, filtro })}`),
  // Nombre: crearComentario
  // Descripción: Envía un comentario.
  // Entrada: Tipo, número y datos.
  // Salida: El comentario.
  // Objetivo: Opinar.
  crearComentario: (tipo, id, datos) => pedir(`/comentarios/${tipo}/${id}`, { method: 'POST', body: datos }),
  // Nombre: resumenesComentarios
  // Descripción: Pide el resumen de estrellas.
  // Entrada: El tipo.
  // Salida: Los resúmenes.
  // Objetivo: Mostrar estrellas.
  resumenesComentarios: (tipo) => pedir(`/comentarios/${tipo}`),
  // Nombre: ruleta
  // Descripción: Pide los premios de la ruleta.
  // Entrada: Nada.
  // Salida: Los premios.
  // Objetivo: Dibujar la ruleta.
  ruleta: () => pedir('/ruleta'),
  // Nombre: girarRuleta
  // Descripción: Gira la ruleta.
  // Entrada: Nada.
  // Salida: El premio.
  // Objetivo: Ganar un regalo.
  girarRuleta: () => pedir('/ruleta', { method: 'POST' }),
  // Nombre: crearResena
  // Descripción: Envía una reseña.
  // Entrada: Número y datos.
  // Salida: La reseña.
  // Objetivo: Opinar.
  crearResena: (id, datos) => pedir(`/productos/${id}/resenas`, { method: 'POST', body: datos }),
  // Nombre: categoriasProductos
  // Descripción: Pide las categorías.
  // Entrada: Nada.
  // Salida: Las categorías.
  // Objetivo: Llenar filtros.
  categoriasProductos: () => pedir('/productos/categorias'),
  // Nombre: guardarDiseno
  // Descripción: Guarda un diseño.
  // Entrada: El diseño.
  // Salida: El diseño guardado.
  // Objetivo: Reservarlo.
  guardarDiseno: (d) => pedir('/disenos', { method: 'POST', body: d }),
  // Nombre: agenda
  // Descripción: Pide la agenda de una especialista.
  // Entrada: Número y días.
  // Salida: Los días libres.
  // Objetivo: Elegir fecha.
  agenda: (id, dias = 10) => pedir(`/especialistas/${id}/agenda${qs({ dias })}`),
  // Nombre: libres
  // Descripción: Pide especialistas libres.
  // Entrada: Fecha y hora.
  // Salida: Las libres.
  // Objetivo: Elegir con quién.
  libres: (fecha, hora) => pedir(`/citas/libres${qs({ fecha, hora })}`),
  // Nombre: disponibilidad
  // Descripción: Pide horas libres.
  // Entrada: Especialista y fecha.
  // Salida: Las horas.
  // Objetivo: Elegir hora.
  disponibilidad: (especialistaId, fecha) => pedir(`/citas/disponibilidad${qs({ especialistaId, fecha })}`),
  // Nombre: crearCita
  // Descripción: Crea una cita.
  // Entrada: Los datos.
  // Salida: La cita.
  // Objetivo: Reservar.
  crearCita: (datos) => pedir('/citas', { method: 'POST', body: datos }),
  // Nombre: cotizarPedido
  // Descripción: Calcula el total.
  // Entrada: El carrito.
  // Salida: El resumen.
  // Objetivo: Mostrar cuánto se paga.
  cotizarPedido: (datos) => pedir('/pedidos/cotizar', { method: 'POST', body: datos }),
  // Nombre: crearPedido
  // Descripción: Crea el pedido.
  // Entrada: El carrito y el pago.
  // Salida: El pedido.
  // Objetivo: Comprar.
  crearPedido: (datos) => pedir('/pedidos', { method: 'POST', body: datos }),

  equipo: {
    // Nombre: entrar
    // Descripción: Entra al portal del equipo.
    // Entrada: Usuario y contraseña.
    // Salida: La sesión.
    // Objetivo: Iniciar sesión.
    entrar: (d) => pedir('/equipo/entrar', { method: 'POST', body: d }),
    // Nombre: yo
    // Descripción: Pide los datos de la especialista.
    // Entrada: Nada.
    // Salida: Su información.
    // Objetivo: Llenar su portal.
    yo: () => pedir('/equipo/yo', { equipo: true }),
    // Nombre: cancelarCita
    // Descripción: Cancela una cita desde el portal.
    // Entrada: Número y motivo.
    // Salida: La cita y el aviso.
    // Objetivo: Cancelar.
    cancelarCita: (id, d) => pedir(`/equipo/citas/${id}/cancelar`, { method: 'POST', body: d, equipo: true }),
    // Nombre: noAsistio
    // Descripción: La especialista registra que su clienta no llegó (reprogramar o cobrar).
    // Entrada: El número de cita y la decisión.
    // Salida: La cita y el mensaje para la clienta.
    // Objetivo: Decidir sobre citas perdidas.
    noAsistio: (id, datos) => pedir(`/equipo/citas/${id}/no-asistio`, { method: 'POST', body: datos, equipo: true }),
    // Nombre: pedirLibre
    // Descripción: Pide un día libre.
    // Entrada: Fechas y motivo.
    // Salida: La solicitud.
    // Objetivo: Pedir libres.
    pedirLibre: (d) => pedir('/equipo/solicitudes', { method: 'POST', body: d, equipo: true }),
    // Nombre: quitarSolicitud
    // Descripción: Retira una solicitud.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Cancelar la solicitud.
    quitarSolicitud: (id) => pedir(`/equipo/solicitudes/${id}`, { method: 'DELETE', equipo: true }),
    // Nombre: salir
    // Descripción: Sale del portal.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Cerrar sesión.
    salir: () => pedir('/equipo/salir', { method: 'POST', equipo: true }).catch(() => {})
  },

  admin: {
    // Nombre: servicios
    // Descripción: Pide los servicios del panel.
    // Entrada: Nada.
    // Salida: Los servicios.
    // Objetivo: Administrarlos.
    servicios: () => pedir('/admin/servicios', { admin: true }),
    // Nombre: crearServicio
    // Descripción: Crea un servicio.
    // Entrada: Los datos.
    // Salida: El servicio.
    // Objetivo: Agregar.
    crearServicio: (d) => pedir('/admin/servicios', { method: 'POST', body: d, admin: true }),
    // Nombre: editarServicio
    // Descripción: Edita un servicio.
    // Entrada: Número y datos.
    // Salida: El servicio.
    // Objetivo: Cambiar.
    editarServicio: (id, d) => pedir(`/admin/servicios/${id}`, { method: 'PUT', body: d, admin: true }),
    // Nombre: borrarServicio
    // Descripción: Borra un servicio.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Quitar.
    borrarServicio: (id) => pedir(`/admin/servicios/${id}`, { method: 'DELETE', admin: true }),
    // Nombre: imagenServicio
    // Descripción: Sube la foto de un servicio.
    // Entrada: Número y foto.
    // Salida: El servicio.
    // Objetivo: Cambiar foto.
    imagenServicio: (id, formData) => pedir(`/admin/servicios/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    // Nombre: pagoEspecialista
    // Descripción: Guarda la forma de pago de una especialista.
    // Entrada: Número y datos.
    // Salida: La especialista.
    // Objetivo: Calcular su pago.
    pagoEspecialista: (id, d) => pedir(`/admin/especialistas/${id}/pago`, { method: 'PUT', body: d, admin: true }),
    // Nombre: accesoEspecialista
    // Descripción: Crea el acceso de una especialista.
    // Entrada: Número y datos.
    // Salida: Nada.
    // Objetivo: Darle entrada.
    accesoEspecialista: (id, d) => pedir(`/admin/especialistas/${id}/acceso`, { method: 'PUT', body: d, admin: true }),
    // Nombre: quitarAcceso
    // Descripción: Quita el acceso.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Bloquear.
    quitarAcceso: (id) => pedir(`/admin/especialistas/${id}/acceso`, { method: 'DELETE', admin: true }),
    // Nombre: ausencias
    // Descripción: Pide los libres de una especialista.
    // Entrada: El número.
    // Salida: Sus ausencias.
    // Objetivo: Verlos.
    ausencias: (id) => pedir(`/admin/especialistas/${id}/ausencias`, { admin: true }),
    // Nombre: agregarAusencias
    // Descripción: Agrega libres.
    // Entrada: Número y fechas.
    // Salida: Las ausencias.
    // Objetivo: Registrar libres.
    agregarAusencias: (id, d) => pedir(`/admin/especialistas/${id}/ausencias`, { method: 'POST', body: d, admin: true }),
    // Nombre: borrarAusencia
    // Descripción: Borra un libre.
    // Entrada: Número y ausencia.
    // Salida: Nada.
    // Objetivo: Corregir.
    borrarAusencia: (id, ausencia) => pedir(`/admin/especialistas/${id}/ausencias/${ausencia}`, { method: 'DELETE', admin: true }),
    // Nombre: fotoPortada
    // Descripción: Sube la foto de una categoría.
    // Entrada: Clave y foto.
    // Salida: La foto.
    // Objetivo: Cambiar portada.
    fotoPortada: (clave, formData) => pedir(`/admin/portadas/${encodeURIComponent(clave)}`, { method: 'POST', body: formData, admin: true }),
    // Nombre: quitarFotoPortada
    // Descripción: Quita la foto de una categoría.
    // Entrada: La clave.
    // Salida: Nada.
    // Objetivo: Volver a la automática.
    quitarFotoPortada: (clave) => pedir(`/admin/portadas/${encodeURIComponent(clave)}`, { method: 'DELETE', admin: true }),
    // Nombre: guardarCirculos
    // Descripción: Guarda los círculos ocultos y los agregados al Inicio.
    // Entrada: { ocultos, inicioExtra }.
    // Salida: Lo guardado.
    // Objetivo: Agregar o eliminar círculos desde el panel.
    guardarCirculos: (datos) => pedir('/admin/circulos', { method: 'PUT', body: datos, admin: true }),
    // Nombre: avisos
    // Descripción: Pide los avisos de la campanita.
    // Entrada: Nada.
    // Salida: Los avisos.
    // Objetivo: Ver pendientes.
    avisos: () => pedir('/admin/avisos', { admin: true }),
    // Nombre: resolverSolicitud
    // Descripción: Responde un día libre.
    // Entrada: Número y respuesta.
    // Salida: La solicitud.
    // Objetivo: Aprobar o rechazar.
    resolverSolicitud: (id, d) => pedir(`/admin/solicitudes-libres/${id}`, { method: 'POST', body: d, admin: true }),
    // Nombre: nomina
    // Descripción: Pide la planilla.
    // Entrada: El periodo.
    // Salida: Los pagos.
    // Objetivo: Ver qué pagar.
    nomina: (periodo = {}) => pedir(`/admin/nomina${qs(periodo)}`, { admin: true }),
    // Nombre: marcarAtendidas
    // Descripción: Marca citas pasadas como atendidas.
    // Entrada: Los datos.
    // Salida: Cuántas.
    // Objetivo: Contarlas para el pago.
    marcarAtendidas: (d) => pedir('/admin/nomina/atender-pasadas', { method: 'POST', body: d, admin: true }),
    // Nombre: marcarPagado
    // Descripción: Marca un pago como hecho.
    // Entrada: Número y periodo.
    // Salida: El pago.
    // Objetivo: Registrar.
    marcarPagado: (id, periodo) => pedir(`/admin/nomina/${id}/pagado`, { method: 'POST', body: periodo, admin: true }),
    // Nombre: quitarPagado
    // Descripción: Quita la marca de pagado.
    // Entrada: Número y periodo.
    // Salida: Nada.
    // Objetivo: Corregir.
    quitarPagado: (id, periodo) => pedir(`/admin/nomina/${id}/pagado${qs(periodo)}`, { method: 'DELETE', admin: true }),
    // Nombre: descargarNomina
    // Descripción: Descarga la planilla en Excel.
    // Entrada: El periodo.
    // Salida: Nada.
    // Objetivo: Guardarla.
    descargarNomina: (periodo) => bajarArchivo(`/admin/nomina/excel${qs(periodo)}`, `pagos-equipo-${periodo.desde}-al-${periodo.hasta}.xlsx`),
    // Nombre: reportes
    // Descripción: Pide los reportes.
    // Entrada: El periodo.
    // Salida: Los reportes.
    // Objetivo: Ver cómo va el salón.
    reportes: (periodo = {}) => pedir(`/admin/reportes${qs(periodo)}`, { admin: true }),
    // Nombre: entrar
    // Descripción: Entra al panel.
    // Entrada: La contraseña.
    // Salida: La sesión.
    // Objetivo: Iniciar sesión.
    entrar: (contrasena) => pedir('/admin/entrar', { method: 'POST', body: { contrasena } }),
    // Nombre: verificar
    // Descripción: Revisa la sesión del panel.
    // Entrada: Nada.
    // Salida: Sí o no.
    // Objetivo: Seguir dentro.
    verificar: () => pedir('/admin/verificar', { admin: true }),
    // Nombre: salir
    // Descripción: Sale del panel.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Cerrar sesión.
    salir: () => pedir('/admin/salir', { method: 'POST', admin: true }),
    // Nombre: cambiarContrasena
    // Descripción: Cambia la contraseña del panel.
    // Entrada: La actual y la nueva.
    // Salida: Nada.
    // Objetivo: Seguridad.
    cambiarContrasena: (datos) => pedir('/admin/contrasena', { method: 'POST', body: datos, admin: true }),
    // Nombre: citas
    // Descripción: Pide las citas de un día.
    // Entrada: La fecha.
    // Salida: Las citas.
    // Objetivo: Ver la agenda.
    citas: (fecha) => pedir(`/admin/citas${qs({ fecha })}`, { admin: true }),
    // Nombre: estadoCita
    // Descripción: Cambia el estado de una cita.
    // Entrada: Número y acción.
    // Salida: La cita.
    // Objetivo: Confirmar o completar.
    estadoCita: (id, accion) => pedir(`/admin/citas/${id}/estado`, { method: 'PATCH', body: { accion }, admin: true }),
    // Nombre: subirFoto
    // Descripción: Sube un diseño a la galería.
    // Entrada: Foto y datos.
    // Salida: El diseño.
    // Objetivo: Agregar.
    subirFoto: (formData) => pedir('/admin/fotos', { method: 'POST', body: formData, admin: true }),
    // Nombre: editarFoto
    // Descripción: Edita un diseño.
    // Entrada: Número y datos.
    // Salida: El diseño.
    // Objetivo: Cambiar.
    editarFoto: (id, datos) => pedir(`/admin/fotos/${id}`, { method: 'PUT', body: datos, admin: true }),
    // Nombre: borrarFoto
    // Descripción: Borra un diseño.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Quitar.
    borrarFoto: (id) => pedir(`/admin/fotos/${id}`, { method: 'DELETE', admin: true }),
    // Nombre: fotoEspecialista
    // Descripción: Sube la foto de una especialista.
    // Entrada: Número y foto.
    // Salida: La especialista.
    // Objetivo: Cambiar foto.
    fotoEspecialista: (id, formData) => pedir(`/admin/especialistas/${id}/foto`, { method: 'POST', body: formData, admin: true }),
    // Nombre: imagenProducto
    // Descripción: Sube la foto de un producto.
    // Entrada: Número y foto.
    // Salida: El producto.
    // Objetivo: Cambiar foto.
    imagenProducto: (id, formData) => pedir(`/admin/productos/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    // Nombre: pedidos
    // Descripción: Pide los pedidos.
    // Entrada: Los filtros.
    // Salida: Los pedidos.
    // Objetivo: Atender ventas.
    pedidos: (filtros = {}) => pedir(`/admin/pedidos${qs(filtros)}`, { admin: true }),
    // Nombre: estadoPedido
    // Descripción: Cambia el estado de un pedido.
    // Entrada: Número y datos.
    // Salida: El pedido.
    // Objetivo: Seguir su avance.
    estadoPedido: (id, datos) => pedir(`/admin/pedidos/${id}/estado`, { method: 'PATCH', body: datos, admin: true }),
    // Nombre: calendario
    // Descripción: Pide el resumen del mes.
    // Entrada: El mes.
    // Salida: Los días con citas.
    // Objetivo: Pintar el calendario.
    calendario: (mes) => pedir(`/admin/calendario${qs({ mes })}`, { admin: true }),
    // Nombre: cancelarCita
    // Descripción: Cancela una cita.
    // Entrada: Número y motivo.
    // Salida: La cita y el aviso.
    // Objetivo: Cancelar.
    cancelarCita: (id, datos) => pedir(`/admin/citas/${id}/cancelar`, { method: 'POST', body: datos, admin: true }),
    // Nombre: noAsistio
    // Descripción: La dueña registra que la clienta no llegó (reprogramar o cobrar).
    // Entrada: El número de cita y la decisión.
    // Salida: La cita y el mensaje para la clienta.
    // Objetivo: Decidir sobre citas perdidas.
    noAsistio: (id, datos) => pedir(`/admin/citas/${id}/no-asistio`, { method: 'POST', body: datos, admin: true }),
    // Nombre: cierreDelDia
    // Descripción: Pide el reporte de cierre de un día.
    // Entrada: La fecha (opcional; hoy si no se da).
    // Salida: Ingresos, pago al equipo, ganancia, pérdidas y citas perdidas.
    // Objetivo: El reporte de fin de día.
    cierreDelDia: (fecha) => pedir(`/admin/reportes/cierre${qs({ fecha })}`, { admin: true }),
    // Nombre: emergencia
    // Descripción: Cancela las citas de un día.
    // Entrada: Fecha y motivo.
    // Salida: Las citas y avisos.
    // Objetivo: Emergencias.
    emergencia: (datos) => pedir('/admin/citas/emergencia', { method: 'POST', body: datos, admin: true }),
    // Nombre: mensajeCita
    // Descripción: Prepara un mensaje para una cita.
    // Entrada: Número y tipo.
    // Salida: El mensaje.
    // Objetivo: Avisar a la clienta.
    mensajeCita: (id, datos) => pedir(`/admin/citas/${id}/mensaje`, { method: 'POST', body: datos, admin: true }),
    // Nombre: mensajes
    // Descripción: Pide los mensajes.
    // Entrada: Nada.
    // Salida: Los mensajes.
    // Objetivo: Ver avisos.
    mensajes: () => pedir('/admin/mensajes', { admin: true }),
    // Nombre: tiposMensaje
    // Descripción: Pide los tipos de mensaje.
    // Entrada: Nada.
    // Salida: Los tipos.
    // Objetivo: Llenar el menú.
    tiposMensaje: () => pedir('/admin/mensajes/tipos', { admin: true }),
    // Nombre: mensajeEnviado
    // Descripción: Marca un mensaje como enviado.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Llevar control.
    mensajeEnviado: (id) => pedir(`/admin/mensajes/${id}/enviado`, { method: 'POST', admin: true }).catch(() => {}),
    // Nombre: fotoAsistente
    // Descripción: Sube la foto de la asistente.
    // Entrada: La foto.
    // Salida: La foto guardada.
    // Objetivo: Cambiar su cara.
    fotoAsistente: (formData) => pedir('/admin/asistente/foto', { method: 'POST', body: formData, admin: true }),
    // Nombre: quitarFotoAsistente
    // Descripción: Quita la foto de la asistente.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Volver al dibujo.
    quitarFotoAsistente: () => pedir('/admin/asistente/foto', { method: 'DELETE', admin: true }),
    // Nombre: cambiarFotoDiseno
    // Descripción: Cambia la foto de un diseño.
    // Entrada: Número y foto.
    // Salida: El diseño.
    // Objetivo: Actualizar la galería.
    cambiarFotoDiseno: (id, formData) => pedir(`/admin/fotos/${id}/imagen`, { method: 'POST', body: formData, admin: true }),
    // Nombre: productos
    // Descripción: Pide los productos del panel.
    // Entrada: Los filtros.
    // Salida: Los productos.
    // Objetivo: Administrar la tienda.
    productos: (filtros = {}) => pedir(`/admin/productos${qs(filtros)}`, { admin: true }),
    // Nombre: crearProducto
    // Descripción: Crea un producto.
    // Entrada: Los datos.
    // Salida: El producto.
    // Objetivo: Agregar.
    crearProducto: (d) => pedir('/admin/productos', { method: 'POST', body: d, admin: true }),
    // Nombre: editarProducto
    // Descripción: Edita un producto.
    // Entrada: Número y datos.
    // Salida: El producto.
    // Objetivo: Cambiar.
    editarProducto: (id, d) => pedir(`/admin/productos/${id}`, { method: 'PUT', body: d, admin: true }),
    // Nombre: borrarProducto
    // Descripción: Borra un producto.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Quitar.
    borrarProducto: (id) => pedir(`/admin/productos/${id}`, { method: 'DELETE', admin: true }),
    // Nombre: equipo
    // Descripción: Pide el equipo.
    // Entrada: Nada.
    // Salida: Las especialistas.
    // Objetivo: Administrar.
    equipo: () => pedir('/admin/especialistas', { admin: true }),
    // Nombre: crearEspecialista
    // Descripción: Crea una especialista.
    // Entrada: Los datos.
    // Salida: La especialista.
    // Objetivo: Agregar.
    crearEspecialista: (d) => pedir('/admin/especialistas', { method: 'POST', body: d, admin: true }),
    // Nombre: editarEspecialista
    // Descripción: Edita una especialista.
    // Entrada: Número y datos.
    // Salida: La especialista.
    // Objetivo: Cambiar.
    editarEspecialista: (id, d) => pedir(`/admin/especialistas/${id}`, { method: 'PUT', body: d, admin: true }),
    // Nombre: borrarEspecialista
    // Descripción: Borra una especialista.
    // Entrada: El número.
    // Salida: Nada.
    // Objetivo: Quitar.
    borrarEspecialista: (id) => pedir(`/admin/especialistas/${id}`, { method: 'DELETE', admin: true }),
    // Nombre: descargarExcelPedidos
    // Descripción: Descarga los pedidos en Excel.
    // Entrada: Los filtros.
    // Salida: Nada.
    // Objetivo: Guardar los pedidos.
    async descargarExcelPedidos(filtros = {}) {
      const res = await fetch(`/api/admin/pedidos/excel${qs(filtros)}`, { headers: { 'x-admin-token': sesionAdmin.obtener() } });
      if (!res.ok) throw new Error('No se pudo generar el Excel.');
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: `pedidos-${new Date().toISOString().slice(0, 10)}.xlsx` });
      a.click(); URL.revokeObjectURL(url);
    }
  }
};
