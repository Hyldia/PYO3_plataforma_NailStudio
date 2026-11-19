// MODELO (Experto): días libres, vacaciones e incapacidades de cada especialista.
import { getDb } from '../db/conexion.js';
import { diasEntre } from '../lib/fechas.js';

export const TIPOS_AUSENCIA = { libre: 'Día libre', vacaciones: 'Vacaciones', incapacidad: 'Incapacidad', permiso: 'Permiso' };

export const AusenciaModel = {
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
  borrarAusencia: (especialistaId, id) => getDb().prepare('DELETE FROM ausencias WHERE id = ? AND especialista_id = ?').run(id, especialistaId).changes > 0
};
