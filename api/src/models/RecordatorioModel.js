// MODELO: recordatorios programados de cada cita.
import { getDb } from '../db/conexion.js';

export const RecordatorioModel = {
  // Nombre: crear
  // Descripción: Programa un recordatorio de cita.
  // Entrada: La cita, el medio y cuándo.
  // Salida: El recordatorio.
  // Objetivo: Recordarle a la clienta.
  crear: (citaId, canal, enviarEn) =>
    getDb().prepare('INSERT INTO recordatorios (cita_id, canal, enviar_en) VALUES (?, ?, ?)').run(citaId, canal, enviarEn),
  // Nombre: eliminarDeCita
  // Descripción: Borra los recordatorios de una cita.
  // Entrada: La cita.
  // Salida: Nada.
  // Objetivo: No avisar citas canceladas.
  eliminarDeCita: (citaId) => getDb().prepare('DELETE FROM recordatorios WHERE cita_id = ?').run(citaId)
};
