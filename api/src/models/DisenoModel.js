// MODELO: diseños de uñas que arma la clienta (se construyen con el patrón Builder).
import { getDb } from '../db/connection.js';

export const DisenoModel = {
  buscarPorId: (id) => getDb().prepare('SELECT * FROM disenos WHERE id = ?').get(id),
  crear(d) {
    const r = getDb().prepare(`
      INSERT INTO disenos (forma, largo, color, acabado, decoracion, acento, notas, foto_ref_id, precio, unas)
      VALUES (@forma, @largo, @color, @acabado, @decoracion, @acento, @notas, @fotoRefId, @precio, @unas)
    `).run({ ...d, acento: d.acento ? 1 : 0, notas: d.notas || null, fotoRefId: d.fotoRefId || null, unas: d.unas ? JSON.stringify(d.unas) : null });
    return this.buscarPorId(r.lastInsertRowid);
  }
};
