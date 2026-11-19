// MODELO (Experto): días libres que pide la especialista y que la dueña aprueba o rechaza.
import { getDb } from '../db/conexion.js';
import { TIPOS_AUSENCIA, AusenciaModel } from './AusenciaModel.js';
import { hoyIso, diasEntre } from '../lib/fechas.js';

export const SolicitudLibreModel = {
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
      if (aprobar) citasAfectadas = AusenciaModel.agregarAusencias(s.especialista_id, { desde: s.desde, hasta: s.hasta, tipo: s.tipo, motivo: s.motivo || 'Pedido por la especialista' });
      getDb().prepare("UPDATE solicitudes_libres SET estado = ?, respuesta = ?, resuelta_en = datetime('now') WHERE id = ?")
        .run(aprobar ? 'aprobada' : 'rechazada', String(respuesta).trim().slice(0, 200) || null, id);
    })();
    return { citasAfectadas };
  },

  // Citas de la especialista con los datos de cada clienta
};
