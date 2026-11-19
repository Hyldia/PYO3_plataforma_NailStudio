// MODELO (Experto): la agenda y las clientas de cada especialista.
// Lo demás del equipo está en modelos separados (Alta cohesión): AusenciaModel, NominaModel,
// AccesoEquipoModel y SolicitudLibreModel; las cuentas con fechas en lib/fechas.js.
import { getDb } from '../db/conexion.js';

export const EquipoModel = {
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
    WHERE c.especialista_id = ? AND c.estado = 'completada' GROUP BY c.cliente_telefono ORDER BY visitas DESC, ultima DESC LIMIT 100`).all(especialistaId)
};
