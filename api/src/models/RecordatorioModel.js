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
  // Nombre: listarDeCita
  // Descripción: Lista los recordatorios de una cita.
  // Entrada: La cita.
  // Salida: Los recordatorios.
  // Objetivo: Ver qué avisos hay.
  listarDeCita: (citaId) => getDb().prepare('SELECT * FROM recordatorios WHERE cita_id = ? ORDER BY enviar_en').all(citaId),
  // Nombre: eliminarDeCita
  // Descripción: Borra los recordatorios de una cita.
  // Entrada: La cita.
  // Salida: Nada.
  // Objetivo: No avisar citas canceladas.
  eliminarDeCita: (citaId) => getDb().prepare('DELETE FROM recordatorios WHERE cita_id = ?').run(citaId)
};
