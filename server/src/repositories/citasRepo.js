import { getDb } from '../db/connection.js';

export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:30', '15:30', '16:30', '17:30'];

const SELECT = `
  SELECT c.*, s.nombre AS servicio, s.duracion_min, e.nombre AS especialista,
         d.forma, d.largo, d.color, d.acabado, d.decoracion, f.archivo AS foto_ref
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
  JOIN especialistas e ON e.id = c.especialista_id
  LEFT JOIN disenos d ON d.id = c.diseno_id
  LEFT JOIN fotos f ON f.id = COALESCE(c.foto_ref_id, d.foto_ref_id)`;

export const citasRepo = {
  horasOcupadas: (especialistaId, fecha) => getDb().prepare(`
    SELECT hora FROM citas WHERE especialista_id = ? AND fecha = ? AND estado != 'cancelada'
  `).all(especialistaId, fecha).map((f) => f.hora),

  porId: (id) => getDb().prepare(`${SELECT} WHERE c.id = ?`).get(id),
  delDia: (fecha) => getDb().prepare(`${SELECT} WHERE c.fecha = ? ORDER BY c.hora, e.nombre`).all(fecha),

  crear(c) {
    const r = getDb().prepare(`
      INSERT INTO citas (servicio_id, especialista_id, diseno_id, foto_ref_id, cliente_nombre, cliente_telefono, cliente_email,
                         notas, fecha, hora, estado, total, anticipo, metodo_pago)
      VALUES (@servicioId, @especialistaId, @disenoId, @fotoRefId, @nombre, @telefono, @email,
              @notas, @fecha, @hora, @estado, @total, @anticipo, @metodoPago)
    `).run(c);
    return this.porId(r.lastInsertRowid);
  },

  cambiarEstado(id, estado) {
    getDb().prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, id);
    return this.porId(id);
  }
};
