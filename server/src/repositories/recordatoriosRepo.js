import { getDb } from '../db/connection.js';

export const recordatoriosRepo = {
  crear: (citaId, canal, enviarEn) =>
    getDb().prepare('INSERT INTO recordatorios (cita_id, canal, enviar_en) VALUES (?, ?, ?)').run(citaId, canal, enviarEn),
  deCita: (citaId) => getDb().prepare('SELECT * FROM recordatorios WHERE cita_id = ? ORDER BY enviar_en').all(citaId),
  eliminarDeCita: (citaId) => getDb().prepare('DELETE FROM recordatorios WHERE cita_id = ?').run(citaId)
};
