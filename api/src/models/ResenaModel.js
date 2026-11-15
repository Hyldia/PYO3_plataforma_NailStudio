// MODELO: reseñas de los productos de la tienda.
import { getDb } from '../db/connection.js';

// Guarda en el producto el promedio y la cantidad de reseñas, para mostrarlos en las tarjetas
export const SQL_RESUMEN = `UPDATE productos SET
  resenas = (SELECT COUNT(*) FROM resenas r WHERE r.producto_id = productos.id),
  calificacion = (SELECT ROUND(AVG(estrellas), 1) FROM resenas r WHERE r.producto_id = productos.id)`;
export const actualizarResumen = (db, productoId) => db.prepare(`${SQL_RESUMEN} WHERE id = ?`).run(productoId);

// Buenas: 4 y 5 estrellas · Regulares: 3 · Malas: 1 y 2
export const FILTRO_ESTRELLAS = { buenas: 'AND estrellas >= 4', regulares: 'AND estrellas = 3', malas: 'AND estrellas <= 2' };

export const ResenaModel = {
  // Resumen (promedio y cuántas hay de cada estrella) + las más recientes
  deProducto(productoId, limite = 6, filtro = '') {
    const db = getDb();
    const filas = db.prepare('SELECT estrellas, COUNT(*) AS n FROM resenas WHERE producto_id = ? GROUP BY estrellas').all(productoId);
    const distribucion = [5, 4, 3, 2, 1].map((e) => ({ estrellas: e, cantidad: filas.find((f) => f.estrellas === e)?.n || 0 }));
    const total = distribucion.reduce((s, d) => s + d.cantidad, 0);
    const promedio = total ? Math.round(distribucion.reduce((s, d) => s + d.estrellas * d.cantidad, 0) / total * 10) / 10 : null;
    const resenas = db.prepare(`SELECT id, nombre, estrellas, comentario, opcion, creada_en, pedido_id IS NOT NULL AS verificada
      FROM resenas WHERE producto_id = ? ${FILTRO_ESTRELLAS[filtro] || ''} ORDER BY creada_en DESC, id DESC LIMIT ?`).all(productoId, Math.min(Number(limite) || 6, 50));
    return { total, promedio, distribucion, resenas };
  },

  // Una clienta puede dejar su reseña; si da el número de pedido y su teléfono, queda como compra verificada
  crear(productoId, { nombre, estrellas, comentario, pedido, telefono }) {
    const db = getDb();
    let pedidoId = null;
    if (pedido && telefono) {
      const p = db.prepare(`SELECT p.id FROM pedidos p JOIN pedido_items i ON i.pedido_id = p.id
        WHERE p.id = ? AND i.producto_id = ? AND replace(p.cliente_telefono, ' ', '') = ?`).get(Number(pedido), productoId, String(telefono).replace(/\D/g, ''));
      pedidoId = p?.id ?? null;
    }
    const info = db.prepare('INSERT INTO resenas (producto_id, pedido_id, nombre, estrellas, comentario) VALUES (?, ?, ?, ?, ?)')
      .run(productoId, pedidoId, nombre, estrellas, comentario);
    actualizarResumen(db, productoId);
    return { id: Number(info.lastInsertRowid), verificada: Boolean(pedidoId) };
  },

  validar({ nombre, estrellas, comentario }) {
    if (!nombre || String(nombre).trim().length < 2) return 'Escribe tu nombre.';
    if (!(Number(estrellas) >= 1 && Number(estrellas) <= 5)) return 'Elige de 1 a 5 estrellas.';
    if (!comentario || String(comentario).trim().length < 5) return 'Cuéntanos un poco más en tu comentario.';
    if (String(comentario).length > 800) return 'El comentario es muy largo (máximo 800 caracteres).';
    return null;
  }
};
