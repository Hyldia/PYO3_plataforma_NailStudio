// MODELO: recordatorios programados de cada cita.
import { getDb } from '../db/connection.js';

export const RecordatorioModel = {
  crear: (citaId, canal, enviarEn) =>
    getDb().prepare('INSERT INTO recordatorios (cita_id, canal, enviar_en) VALUES (?, ?, ?)').run(citaId, canal, enviarEn),
  listarDeCita: (citaId) => getDb().prepare('SELECT * FROM recordatorios WHERE cita_id = ? ORDER BY enviar_en').all(citaId),
  eliminarDeCita: (citaId) => getDb().prepare('DELETE FROM recordatorios WHERE cita_id = ?').run(citaId)
};
