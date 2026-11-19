// MODELO: lo que el panel y el portal necesitan saber del equipo:
// días libres (ausencias), quincenas de pago, cálculo de lo que se le paga a cada una y sus clientas.
import { getDb } from '../db/conexion.js';
import { crearEsquemaPago, NOMBRES_ESQUEMA } from '../patrones/estrategiaComision.js';
import { Contrasenas, hashToken, nuevoToken } from '../patrones/estrategiaAutenticacion.js';

// Nombre: iso
// Descripción: Convierte una fecha a texto año-mes-día.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Trabajar con fechas.
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Nombre: deIso
// Descripción: Convierte un texto a fecha.
// Entrada: El texto año-mes-día.
// Salida: La fecha.
// Objetivo: Trabajar con fechas.
const deIso = (f) => new Date(`${f}T12:00:00`);
// Nombre: hoyIso
// Descripción: Da la fecha de hoy en texto.
// Entrada: Nada.
// Salida: La fecha.
// Objetivo: Usar el día actual.
export const hoyIso = () => iso(new Date());
export const TIPOS_AUSENCIA = { libre: 'Día libre', vacaciones: 'Vacaciones', incapacidad: 'Incapacidad', permiso: 'Permiso' };

// Quincenas: del 1 al 15 (se paga el 15) y del 16 al último día (se paga ese último día).
// Si el día de pago cae domingo, se paga el sábado anterior.
// Nombre: quincenaDe
// Descripción: Calcula la quincena de una fecha.
// Entrada: La fecha.
// Salida: Inicio y fin de la quincena.
// Objetivo: Pagar al equipo cada 15 días.
export function quincenaDe(fecha = hoyIso()) {
  const d = deIso(fecha);
  const a = d.getFullYear();
  const m = d.getMonth();
  const ultimo = new Date(a, m + 1, 0).getDate();
  const primera = d.getDate() <= 15;
  const desde = iso(new Date(a, m, primera ? 1 : 16));
  const hasta = iso(new Date(a, m, primera ? 15 : ultimo));
  const pago = deIso(hasta);
  if (pago.getDay() === 0) pago.setDate(pago.getDate() - 1);
  return { desde, hasta, diaPago: iso(pago) };
}
// Nombre: quincenaAnterior
// Descripción: Calcula la quincena anterior.
// Entrada: La fecha.
// Salida: Inicio y fin.
// Objetivo: Ver el pago pasado.
export const quincenaAnterior = (fecha = hoyIso()) => { const d = deIso(quincenaDe(fecha).desde); d.setDate(d.getDate() - 1); return quincenaDe(iso(d)); };

// Nombre: diasEntre
// Descripción: Lista los días entre dos fechas.
// Entrada: Desde y hasta.
// Salida: La lista de días.
// Objetivo: Contar días trabajados.
function diasEntre(desde, hasta) {
  const lista = [];
  for (const d = deIso(desde); iso(d) <= hasta; d.setDate(d.getDate() + 1)) lista.push(iso(d));
  return lista;
}
// Nombre: trabajaPorHorario
// Descripción: Revisa si una especialista trabaja ese día.
// Entrada: La especialista y la fecha.
// Salida: Sí o no.
// Objetivo: Saber sus días de trabajo.
const trabajaPorHorario = (e, fecha) => String(e.dias || '').split(',').map(Number).includes(deIso(fecha).getDay() || 7);

export const EquipoModel = {
  // ----- Ausencias -----
  // Nombre: ausencias
  // Descripción: Lista los días libres de una especialista.
  // Entrada: La especialista y el rango.
  // Salida: Sus ausencias.
  // Objetivo: Ver sus libres.
  ausencias: (especialistaId, desde = '0000-01-01', hasta = '9999-12-31') => getDb().prepare(
    'SELECT * FROM ausencias WHERE especialista_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha').all(especialistaId, desde, hasta),
  // Nombre: tieneAusencia
  // Descripción: Revisa si tiene libre una fecha.
  // Entrada: La especialista y la fecha.
  // Salida: Sí o no.
  // Objetivo: No darle citas ese día.
  tieneAusencia: (especialistaId, fecha) => Boolean(getDb().prepare('SELECT 1 FROM ausencias WHERE especialista_id = ? AND fecha = ?').get(especialistaId, fecha)),
  // Nombre: agregarAusencias
  // Descripción: Guarda días libres.
  // Entrada: La especialista, fechas y motivo.
  // Salida: Las ausencias guardadas.
  // Objetivo: Registrar libres.
  agregarAusencias(especialistaId, { desde, hasta, tipo = 'libre', motivo = '' }) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '')) throw Object.assign(new Error('Elige la fecha.'), { status: 400 });
    const fin = hasta && hasta >= desde ? hasta : desde;
    const dias = diasEntre(desde, fin);
    if (dias.length > 60) throw Object.assign(new Error('Elige un rango de máximo 60 días.'), { status: 400 });
    const ins = getDb().prepare(`INSERT INTO ausencias (especialista_id, fecha, tipo, motivo) VALUES (?, ?, ?, ?)
      ON CONFLICT(especialista_id, fecha) DO UPDATE SET tipo = excluded.tipo, motivo = excluded.motivo`);
    getDb().transaction(() => dias.forEach((f) => ins.run(especialistaId, f, TIPOS_AUSENCIA[tipo] ? tipo : 'libre', String(motivo).slice(0, 120) || null)))();
    // Citas que ya estaban en esos días: hay que reprogramarlas
    return getDb().prepare(`SELECT COUNT(*) AS n FROM citas WHERE especialista_id = ? AND fecha BETWEEN ? AND ? AND estado IN ('pendiente', 'confirmada')`).get(especialistaId, desde, fin).n;
  },
  // Nombre: borrarAusencia
  // Descripción: Borra un día libre.
  // Entrada: La especialista y la ausencia.
  // Salida: Nada.
  // Objetivo: Corregir libres.
  borrarAusencia: (especialistaId, id) => getDb().prepare('DELETE FROM ausencias WHERE id = ? AND especialista_id = ?').run(id, especialistaId).changes > 0,

  // ----- Cálculo del pago de una especialista en un periodo -----
  // Nombre: calcularPago
  // Descripción: Calcula el pago de una especialista.
  // Entrada: La especialista y el periodo.
  // Salida: Detalle y total a pagar.
  // Objetivo: Pagar lo justo.
  calcularPago(e, { desde, hasta }) {
    const db = getDb();
    const citas = db.prepare(`SELECT fecha, total FROM citas WHERE especialista_id = ? AND estado = 'completada' AND fecha BETWEEN ? AND ?`).all(e.id, desde, hasta);
    const vendido = citas.reduce((s, c) => s + c.total, 0);
    const ausencias = this.ausencias(e.id, desde, hasta);
    const fechasAusencia = new Set(ausencias.map((a) => a.fecha));
    const dias = diasEntre(desde, hasta);
    const programados = dias.filter((f) => trabajaPorHorario(e, f) && !fechasAusencia.has(f));
    const libresPorHorario = dias.filter((f) => !trabajaPorHorario(e, f));
    const trabajados = new Set(citas.map((c) => c.fecha)).size;
    const esquema = crearEsquemaPago(e.esquema_pago);
    const pago = esquema.calcular({ vendido, comision: e.comision, salarioBase: e.esquema_pago === 'base_comision' ? e.salario_base : 0 });
    // Citas de días que ya pasaron y nadie marcó como atendidas (no cuentan para el pago)
    const porMarcar = db.prepare(`SELECT COUNT(*) AS n FROM citas WHERE especialista_id = ? AND estado IN ('pendiente', 'confirmada')
      AND fecha BETWEEN ? AND ? AND fecha < ?`).get(e.id, desde, hasta, hoyIso()).n;
    const pagado = db.prepare('SELECT * FROM pagos_equipo WHERE especialista_id = ? AND desde = ? AND hasta = ?').get(e.id, desde, hasta) || null;
    return {
      citas: citas.length, vendido, ...pago, esquema: esquema.nombre,
      diasProgramados: programados.length, diasTrabajados: trabajados, diasLibres: libresPorHorario.length,
      ausencias: ausencias.length, detalleAusencias: ausencias, porMarcar, pagado
    };
  },
  // Nombre: nomina
  // Descripción: Calcula la planilla de todo el equipo.
  // Entrada: El periodo.
  // Salida: El pago de cada una.
  // Objetivo: Hacer la planilla.
  nomina(periodo) {
    const lista = getDb().prepare('SELECT * FROM especialistas ORDER BY activa DESC, id').all();
    return lista.map((e) => ({
      id: e.id, nombre: e.nombre, especialidad: e.especialidad, foto: e.foto, estacion: e.estacion, activa: e.activa,
      dias: e.dias, hora_inicio: e.hora_inicio, hora_fin: e.hora_fin, comision: e.comision, esquema_pago: e.esquema_pago, salario_base: e.salario_base,
      ...this.calcularPago(e, periodo)
    })).filter((x) => x.activa || x.citas > 0);
  },
  // Nombre: registrarPago
  // Descripción: Guarda que ya se pagó.
  // Entrada: La especialista y el periodo.
  // Salida: El pago guardado.
  // Objetivo: Llevar control de pagos.
  registrarPago(especialistaId, periodo) {
    const e = getDb().prepare('SELECT * FROM especialistas WHERE id = ?').get(especialistaId);
    if (!e) throw Object.assign(new Error('No encontramos a esa especialista.'), { status: 404 });
    const c = this.calcularPago(e, periodo);
    getDb().prepare(`INSERT INTO pagos_equipo (especialista_id, desde, hasta, citas, vendido, monto) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(especialista_id, desde, hasta) DO UPDATE SET citas = excluded.citas, vendido = excluded.vendido, monto = excluded.monto, pagado_en = datetime('now')`)
      .run(e.id, periodo.desde, periodo.hasta, c.citas, c.vendido, c.total);
    return this.calcularPago(e, periodo);
  },
  // Marca como atendidas las citas de días pasados (de una especialista o de todo el equipo)
  // Nombre: marcarPasadasAtendidas
  // Descripción: Marca como atendidas las citas pasadas.
  // Entrada: El periodo y la especialista.
  // Salida: Cuántas se marcaron.
  // Objetivo: Que cuenten para el pago.
  marcarPasadasAtendidas: ({ desde, hasta }, especialistaId = null) => getDb().prepare(`UPDATE citas SET estado = 'completada'
    WHERE estado IN ('pendiente', 'confirmada') AND fecha BETWEEN ? AND ? AND fecha < ? ${especialistaId ? 'AND especialista_id = ?' : ''}`)
    .run(...[desde, hasta, hoyIso(), ...(especialistaId ? [especialistaId] : [])]).changes,
  // Nombre: quitarPago
  // Descripción: Borra un pago marcado.
  // Entrada: La especialista y el periodo.
  // Salida: Nada.
  // Objetivo: Corregir errores.
  quitarPago: (especialistaId, periodo) => getDb().prepare('DELETE FROM pagos_equipo WHERE especialista_id = ? AND desde = ? AND hasta = ?').run(especialistaId, periodo.desde, periodo.hasta),
  // Nombre: historialPagos
  // Descripción: Lista los pagos de una especialista.
  // Entrada: La especialista.
  // Salida: Sus pagos.
  // Objetivo: Ver su historial.
  historialPagos: (especialistaId) => getDb().prepare("SELECT *, datetime(pagado_en, 'localtime') AS pagado_local FROM pagos_equipo WHERE especialista_id = ? ORDER BY desde DESC LIMIT 24").all(especialistaId),

  // ----- Datos de configuración (los guarda el panel) -----
  // Nombre: validarConfig
  // Descripción: Revisa la forma de pago de una especialista.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar datos inválidos.
  validarConfig(d) {
    if (!['comision', 'base_comision'].includes(d.esquema_pago)) return 'Elige cómo se le paga.';
    const c = Number(d.comision);
    if (!(c >= 0 && c <= 100)) return 'La comisión debe estar entre 0 y 100 %.';
    if (d.esquema_pago === 'base_comision' && !(Number(d.salario_base) > 0)) return 'Escribe el monto base por quincena.';
    return null;
  },
  // Nombre: guardarConfig
  // Descripción: Guarda la forma de pago.
  // Entrada: La especialista y los datos.
  // Salida: Nada.
  // Objetivo: Calcular su pago.
  guardarConfig: (id, d) => getDb().prepare('UPDATE especialistas SET estacion = ?, esquema_pago = ?, comision = ?, salario_base = ? WHERE id = ?')
    .run(String(d.estacion || '').trim().slice(0, 60) || null, d.esquema_pago, Number(d.comision), d.esquema_pago === 'base_comision' ? Number(d.salario_base) : 0, id),

  // ----- Acceso al portal del equipo -----
  // Nombre: definirAcceso
  // Descripción: Crea el usuario y contraseña de una especialista.
  // Entrada: Usuario y contraseña.
  // Salida: Nada.
  // Objetivo: Darle acceso a su portal.
  definirAcceso(id, { usuario, contrasena }) {
    const u = String(usuario || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw Object.assign(new Error('El usuario debe tener de 3 a 30 letras o números, sin espacios ni tildes.'), { status: 400 });
    const otro = getDb().prepare('SELECT id FROM especialistas WHERE usuario = ? AND id != ?').get(u, id);
    if (otro) throw Object.assign(new Error('Ese usuario ya lo usa otra persona del equipo.'), { status: 409 });
    if (contrasena) {
      if (contrasena.length < 8 || !/\d/.test(contrasena) || !/[a-záéíóúñ]/i.test(contrasena)) throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres, con letras y números.'), { status: 400 });
      getDb().prepare('UPDATE especialistas SET usuario = ?, contrasena_hash = ? WHERE id = ?').run(u, Contrasenas.crear(contrasena), id);
      getDb().prepare('DELETE FROM sesiones_equipo WHERE especialista_id = ?').run(id);
    } else {
      const tiene = getDb().prepare('SELECT contrasena_hash FROM especialistas WHERE id = ?').get(id)?.contrasena_hash;
      if (!tiene) throw Object.assign(new Error('Escribe una contraseña para darle acceso.'), { status: 400 });
      getDb().prepare('UPDATE especialistas SET usuario = ? WHERE id = ?').run(u, id);
    }
  },
  // Nombre: quitarAcceso
  // Descripción: Quita el acceso de una especialista.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Bloquear su entrada.
  quitarAcceso(id) {
    getDb().prepare('UPDATE especialistas SET usuario = NULL, contrasena_hash = NULL WHERE id = ?').run(id);
    getDb().prepare('DELETE FROM sesiones_equipo WHERE especialista_id = ?').run(id);
  },
  // Nombre: entrar
  // Descripción: Revisa usuario y contraseña de una especialista.
  // Entrada: Usuario y contraseña.
  // Salida: Su permiso o un error.
  // Objetivo: Entrar al portal.
  entrar(usuario, contrasena) {
    const e = getDb().prepare('SELECT * FROM especialistas WHERE usuario = ? AND activa = 1').get(String(usuario || '').trim().toLowerCase());
    if (!e || !Contrasenas.verificar(String(contrasena || ''), e.contrasena_hash || '')) return null;
    const token = nuevoToken();
    getDb().prepare("INSERT INTO sesiones_equipo (token_hash, especialista_id, vence_en) VALUES (?, ?, datetime('now', '+12 hours'))").run(hashToken(token), e.id);
    return token;
  },
  // Nombre: porToken
  // Descripción: Busca a la especialista por su permiso.
  // Entrada: El permiso.
  // Salida: La especialista o nada.
  // Objetivo: Saber quién está en el portal.
  porToken: (token) => (token ? getDb().prepare(`SELECT e.* FROM sesiones_equipo s JOIN especialistas e ON e.id = s.especialista_id
    WHERE s.token_hash = ? AND s.vence_en > datetime('now') AND e.activa = 1`).get(hashToken(token)) || null : null),
  // Nombre: salir
  // Descripción: Cierra la sesión del portal.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Salir del portal.
  salir: (token) => getDb().prepare('DELETE FROM sesiones_equipo WHERE token_hash = ?').run(hashToken(token || '')),

  // ----- Solicitudes de días libres (las pide la especialista, las resuelve la administradora) -----
  // Nombre: pedirLibre
  // Descripción: Guarda una solicitud de día libre.
  // Entrada: La especialista, fechas y motivo.
  // Salida: La solicitud.
  // Objetivo: Pedir libres.
  pedirLibre(especialistaId, { desde, hasta, tipo = 'libre', motivo = '' }) {
    const hoy = hoyIso();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '') || desde < hoy) throw Object.assign(new Error('Elige un día de hoy en adelante.'), { status: 400 });
    const fin = hasta && hasta >= desde ? hasta : desde;
    if (diasEntre(desde, fin).length > 30) throw Object.assign(new Error('Puedes pedir máximo 30 días seguidos.'), { status: 400 });
    const choca = getDb().prepare(`SELECT 1 FROM solicitudes_libres WHERE especialista_id = ? AND estado = 'pendiente' AND desde <= ? AND hasta >= ?`).get(especialistaId, fin, desde);
    if (choca) throw Object.assign(new Error('Ya pediste esos días; espera la respuesta.'), { status: 409 });
    const citas = getDb().prepare(`SELECT COUNT(*) AS n FROM citas WHERE especialista_id = ? AND fecha BETWEEN ? AND ? AND estado IN ('pendiente', 'confirmada')`).get(especialistaId, desde, fin).n;
    getDb().prepare('INSERT INTO solicitudes_libres (especialista_id, desde, hasta, tipo, motivo) VALUES (?, ?, ?, ?, ?)')
      .run(especialistaId, desde, fin, TIPOS_AUSENCIA[tipo] ? tipo : 'libre', String(motivo).trim().slice(0, 160) || null);
    return { citas };
  },
  // Nombre: quitarSolicitud
  // Descripción: Borra una solicitud pendiente.
  // Entrada: La especialista y la solicitud.
  // Salida: Nada.
  // Objetivo: Retirar un pedido.
  quitarSolicitud: (especialistaId, id) => getDb().prepare("DELETE FROM solicitudes_libres WHERE id = ? AND especialista_id = ? AND estado = 'pendiente'").run(id, especialistaId).changes > 0,
  // Nombre: solicitudesDe
  // Descripción: Lista las solicitudes de una especialista.
  // Entrada: La especialista.
  // Salida: Sus solicitudes.
  // Objetivo: Ver qué pidió.
  solicitudesDe: (especialistaId) => getDb().prepare(`SELECT * FROM solicitudes_libres WHERE especialista_id = ?
    ORDER BY (estado = 'pendiente') DESC, desde DESC LIMIT 20`).all(especialistaId),
  // Nombre: solicitudesPendientes
  // Descripción: Lista las solicitudes sin responder.
  // Entrada: Nada.
  // Salida: Las solicitudes pendientes.
  // Objetivo: Avisar a la dueña.
  solicitudesPendientes: () => getDb().prepare(`SELECT s.*, e.nombre, e.foto,
      (SELECT COUNT(*) FROM citas c WHERE c.especialista_id = s.especialista_id AND c.fecha BETWEEN s.desde AND s.hasta AND c.estado IN ('pendiente', 'confirmada')) AS citas
    FROM solicitudes_libres s JOIN especialistas e ON e.id = s.especialista_id WHERE s.estado = 'pendiente' ORDER BY s.desde`).all(),
  // Nombre: resolverSolicitud
  // Descripción: Aprueba o rechaza un día libre.
  // Entrada: La solicitud y la respuesta.
  // Salida: La solicitud actualizada.
  // Objetivo: Responder a la especialista.
  resolverSolicitud(id, { aprobar, respuesta = '' }) {
    const s = getDb().prepare("SELECT * FROM solicitudes_libres WHERE id = ? AND estado = 'pendiente'").get(id);
    if (!s) throw Object.assign(new Error('Esa solicitud ya no está pendiente.'), { status: 404 });
    let citasAfectadas = 0;
    getDb().transaction(() => {
      if (aprobar) citasAfectadas = this.agregarAusencias(s.especialista_id, { desde: s.desde, hasta: s.hasta, tipo: s.tipo, motivo: s.motivo || 'Pedido por la especialista' });
      getDb().prepare("UPDATE solicitudes_libres SET estado = ?, respuesta = ?, resuelta_en = datetime('now') WHERE id = ?")
        .run(aprobar ? 'aprobada' : 'rechazada', String(respuesta).trim().slice(0, 200) || null, id);
    })();
    return { citasAfectadas };
  },

  // Citas de la especialista con los datos de cada clienta
  // Nombre: citasDe
  // Descripción: Lista las citas de una especialista.
  // Entrada: La especialista y el rango.
  // Salida: Sus citas.
  // Objetivo: Llenar su agenda.
  citasDe: (especialistaId, desde, hasta) => getDb().prepare(`
    SELECT c.id, c.fecha, c.hora, c.estado, c.total, c.anticipo, c.notas, c.cliente_nombre, c.cliente_telefono,
           s.nombre AS servicio, s.duracion_min, COALESCE(u.foto, CASE WHEN c.ejemplo = 1 THEN fc.foto END) AS foto_clienta, d.forma, d.largo, d.color, d.acabado, d.decoracion, f.archivo AS foto_ref,
           (SELECT COUNT(*) FROM citas c2 WHERE c2.cliente_telefono = c.cliente_telefono AND c2.especialista_id = c.especialista_id AND c2.estado = 'completada') AS visitas
    FROM citas c JOIN servicios s ON s.id = c.servicio_id LEFT JOIN usuarios u ON u.id = c.usuario_id
    LEFT JOIN fotos_clientas fc ON fc.telefono = c.cliente_telefono
    LEFT JOIN disenos d ON d.id = c.diseno_id LEFT JOIN fotos f ON f.id = c.foto_ref_id
    WHERE c.especialista_id = ? AND c.fecha BETWEEN ? AND ? ORDER BY c.fecha, c.hora`).all(especialistaId, desde, hasta),
  // Nombre: clientas
  // Descripción: Lista las clientas de una especialista.
  // Entrada: La especialista.
  // Salida: Sus clientas con foto.
  // Objetivo: Que conozca a sus clientas.
  clientas: (especialistaId) => getDb().prepare(`
    SELECT c.cliente_nombre AS nombre, c.cliente_telefono AS telefono, COUNT(*) AS visitas, MAX(c.fecha) AS ultima, SUM(c.total) AS total,
           COALESCE(MAX(u.foto), MAX(CASE WHEN c.ejemplo = 1 THEN fc.foto END)) AS foto, MAX(s.nombre) AS servicio
    FROM citas c LEFT JOIN usuarios u ON u.id = c.usuario_id LEFT JOIN servicios s ON s.id = c.servicio_id
    LEFT JOIN fotos_clientas fc ON fc.telefono = c.cliente_telefono
    WHERE c.especialista_id = ? AND c.estado = 'completada' GROUP BY c.cliente_telefono ORDER BY visitas DESC, ultima DESC LIMIT 100`).all(especialistaId),
  NOMBRES_ESQUEMA
};
