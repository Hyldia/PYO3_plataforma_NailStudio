// MODELO: pedidos de la tienda.
import { getDb } from '../db/connection.js';

export const PedidoModel = {
  validarCliente(cliente = {}) {
    if (!cliente.nombre || !/^[\d\s+-]{8,15}$/.test(cliente.telefono || '')) {
      return 'Escribe tu nombre y un teléfono para avisarte cuando el pedido esté listo.';
    }
    return null;
  },

  // Transacción: si un producto no tiene stock, no se guarda nada.
  crear(cliente, lineas, metodoPago) {
    const db = getDb();
    const tx = db.transaction(() => {
      const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
      const { lastInsertRowid: pedidoId } = db.prepare(`
        INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_email, total, metodo_pago) VALUES (?, ?, ?, ?, ?)
      `).run(cliente.nombre, cliente.telefono, cliente.email || null, total, metodoPago);

      const item = db.prepare('INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)');
      const descontar = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?');
      for (const l of lineas) {
        if (descontar.run(l.cantidad, l.productoId, l.cantidad).changes === 0) throw new Error(`No hay stock suficiente de ${l.nombre}.`);
        item.run(pedidoId, l.productoId, l.cantidad, l.precio);
      }
      return { id: pedidoId, total };
    });
    return tx();
  },

  listarRecientes: () => getDb().prepare(`
    SELECT p.*, GROUP_CONCAT(pi.cantidad || ' × ' || pr.nombre, ', ') AS detalle
    FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id JOIN productos pr ON pr.id = pi.producto_id
    GROUP BY p.id ORDER BY p.creado_en DESC LIMIT 50
  `).all()
};
