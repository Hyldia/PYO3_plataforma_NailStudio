// MODELO: pedidos de la tienda.
import { getDb } from '../db/conexion.js';

export const PedidoModel = {
  validarCliente(cliente = {}) {
    if (!cliente.nombre || !/^[\d\s+-]{8,15}$/.test(cliente.telefono || '')) {
      return 'Escribe tu nombre y un teléfono para avisarte cuando el pedido esté listo.';
    }
    return null;
  },

  // Transacción: si un producto no tiene stock, no se guarda nada.
  crear(cliente, lineas, metodoPago, extra = {}) {
    const db = getDb();
    const tx = db.transaction(() => {
      const total = extra.total ?? lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
      const { lastInsertRowid: pedidoId } = db.prepare(`
        INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_email, total, metodo_pago, cupon_codigo, descuento, notas, referencia_pago,
                             usuario_id, entrega, direccion, costo_envio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(cliente.nombre, cliente.telefono, cliente.email || null, total, metodoPago,
        extra.cupon || null, extra.descuento || 0, extra.notas || null, extra.referencia || null,
        extra.usuarioId || null, extra.entrega || 'retiro', extra.direccion || null, extra.costoEnvio || 0);

      const item = db.prepare('INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, detalle) VALUES (?, ?, ?, ?, ?)');
      const descontar = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?');
      for (const l of lineas) {
        if (descontar.run(l.cantidad, l.productoId, l.cantidad).changes === 0) throw new Error(`No hay stock suficiente de ${l.nombre}.`);
        item.run(pedidoId, l.productoId, l.cantidad, l.precio, l.detalle || null);
      }
      return { id: pedidoId, total };
    });
    return tx();
  },

  // Panel: pedidos con filtros (fechas, nombre/teléfono/número, estado y forma de pago)
  listarAdmin({ desde, hasta, q, estado, pago } = {}) {
    const where = [];
    const p = {};
    if (desde) { where.push("date(p.creado_en, 'localtime') >= @desde"); p.desde = desde; }
    if (hasta) { where.push("date(p.creado_en, 'localtime') <= @hasta"); p.hasta = hasta; }
    if (estado) { where.push('p.estado = @estado'); p.estado = estado; }
    if (pago) { where.push('p.metodo_pago = @pago'); p.pago = pago; }
    if (q && q.trim()) { where.push("(lower(p.cliente_nombre) LIKE @q OR p.cliente_telefono LIKE @q OR CAST(p.id AS TEXT) = @id)"); p.q = `%${q.trim().toLowerCase()}%`; p.id = q.trim().replace('#', ''); }
    return getDb().prepare(`
      SELECT p.*, datetime(p.creado_en, 'localtime') AS fecha_local,
        (SELECT GROUP_CONCAT(pi.cantidad || ' × ' || pr.nombre || COALESCE(' (' || pi.detalle || ')', ''), ', ')
           FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id WHERE pi.pedido_id = p.id) AS detalle,
        (SELECT SUM(pi.cantidad) FROM pedido_items pi WHERE pi.pedido_id = p.id) AS unidades,
        (SELECT COUNT(*) FROM citas c WHERE c.pedido_id = p.id) AS citas
      FROM pedidos p ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY p.creado_en DESC, p.id DESC LIMIT 1000`).all(p);
  },
  buscarPorId: (id) => getDb().prepare(`SELECT p.*, (SELECT GROUP_CONCAT(pi.cantidad || ' × ' || pr.nombre, ', ') FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id WHERE pi.pedido_id = p.id) AS detalle FROM pedidos p WHERE p.id = ?`).get(id),

  // Cambia el estado; si se cancela, el stock vuelve a la tienda (todo en una transacción)
  cambiarEstado(id, estado, { retiradoPor, notas } = {}) {
    const db = getDb();
    db.transaction(() => {
      if (estado === 'cancelado') {
        db.prepare('UPDATE productos SET stock = stock + (SELECT SUM(cantidad) FROM pedido_items WHERE pedido_id = @id AND producto_id = productos.id) WHERE id IN (SELECT producto_id FROM pedido_items WHERE pedido_id = @id)').run({ id });
      }
      db.prepare(`UPDATE pedidos SET estado = @estado, completado_en = CASE WHEN @estado = 'completado' THEN datetime('now') ELSE NULL END,
        retirado_por = CASE WHEN @estado = 'completado' THEN @retiradoPor ELSE retirado_por END, notas_admin = COALESCE(@notas, notas_admin) WHERE id = @id`)
        .run({ id, estado, retiradoPor: retiradoPor || null, notas: notas ?? null });
    })();
    return this.buscarPorId(id);
  },

  listarRecientes: () => getDb().prepare(`
    SELECT p.*, GROUP_CONCAT(pi.cantidad || ' × ' || pr.nombre || COALESCE(' (' || pi.detalle || ')', ''), ', ') AS detalle
    FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id JOIN productos pr ON pr.id = pi.producto_id
    GROUP BY p.id ORDER BY p.creado_en DESC LIMIT 50
  `).all()
};
