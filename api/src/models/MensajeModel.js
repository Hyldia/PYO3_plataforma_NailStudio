// MODELO: historial de mensajes de WhatsApp preparados desde el panel.
import { getDb } from '../db/connection.js';

export const MensajeModel = {
  registrar({ citaId = null, pedidoId = null, cliente, telefono, tipo, texto, enlace }) {
    const r = getDb().prepare(`INSERT INTO mensajes (cita_id, pedido_id, cliente, telefono, tipo, texto, enlace) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(citaId, pedidoId, cliente, telefono, tipo, texto, enlace);
    return getDb().prepare('SELECT * FROM mensajes WHERE id = ?').get(r.lastInsertRowid);
  },
  listar: (limite = 60) => getDb().prepare('SELECT * FROM mensajes ORDER BY creado_en DESC, id DESC LIMIT ?').all(Math.min(Number(limite) || 60, 300)),
  marcarEnviado: (id) => getDb().prepare('UPDATE mensajes SET enviado = 1 WHERE id = ?').run(id)
};
