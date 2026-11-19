// MODELO: historial de mensajes de WhatsApp preparados desde el panel.
import { getDb } from '../db/conexion.js';

export const MensajeModel = {
  // Nombre: registrar
  // Descripción: Guarda un mensaje preparado.
  // Entrada: Datos de la clienta y el texto.
  // Salida: El mensaje.
  // Objetivo: Llevar registro de avisos.
  registrar({ citaId = null, pedidoId = null, cliente, telefono, tipo, texto, enlace }) {
    const r = getDb().prepare(`INSERT INTO mensajes (cita_id, pedido_id, cliente, telefono, tipo, texto, enlace) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(citaId, pedidoId, cliente, telefono, tipo, texto, enlace);
    return getDb().prepare('SELECT * FROM mensajes WHERE id = ?').get(r.lastInsertRowid);
  },
  // Nombre: listar
  // Descripción: Lista los mensajes.
  // Entrada: Cuántos.
  // Salida: Los mensajes.
  // Objetivo: Ver los avisos.
  listar: (limite = 60) => getDb().prepare('SELECT * FROM mensajes ORDER BY creado_en DESC, id DESC LIMIT ?').all(Math.min(Number(limite) || 60, 300)),
  // Nombre: marcarEnviado
  // Descripción: Marca un mensaje como enviado.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Saber qué se envió.
  marcarEnviado: (id) => getDb().prepare('UPDATE mensajes SET enviado = 1 WHERE id = ?').run(id)
};
