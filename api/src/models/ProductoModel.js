// MODELO: productos de la tienda, con búsqueda, filtros y orden.
import { getDb } from '../db/connection.js';

const ORDEN = {
  relevancia: 'stock > 0 DESC, id',
  'precio-asc': 'precio ASC',
  'precio-desc': 'precio DESC',
  nuevos: 'creado_en DESC, id DESC'
};

export const ProductoModel = {
  buscar({ q, categoria, min, max, disponibles, orden } = {}) {
    const where = [];
    const p = {};
    if (categoria && categoria !== 'Todas') { where.push('categoria = @categoria'); p.categoria = categoria; }
    if (q && q.trim()) { where.push('(lower(nombre) LIKE @q OR lower(descripcion) LIKE @q OR lower(marca) LIKE @q)'); p.q = `%${q.trim().toLowerCase()}%`; }
    if (min) { where.push('precio >= @min'); p.min = Number(min); }
    if (max) { where.push('precio <= @max'); p.max = Number(max); }
    if (disponibles === '1') where.push('stock > 0');
    const sql = `SELECT * FROM productos ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${ORDEN[orden] || ORDEN.relevancia}`;
    return getDb().prepare(sql).all(p);
  },
  categorias: () => getDb().prepare('SELECT categoria AS valor, COUNT(*) AS cantidad FROM productos GROUP BY categoria ORDER BY categoria').all(),
  buscarPorId: (id) => getDb().prepare('SELECT * FROM productos WHERE id = ?').get(id),
  crear(datos) {
    const resultado = getDb().prepare(`INSERT INTO productos (nombre, descripcion, categoria, marca, precio, stock)
                                VALUES (@nombre, @descripcion, @categoria, @marca, @precio, @stock)`).run(datos);

    return getDb().prepare('SELECT * FROM productos WHERE id = ?').get(resultado.lastInsertRowid);
  },
  actualizar(id, datos){
    return getDb().prepare(`
                    UPDATE productos
                    SET nombre = @nombre,
                        descripcion = @descripcion,
                        categoria = @categoria,
                        marca = @marca,
                        precio = @precio,
                        stock = @stock
                    WHERE id = @id
                  `).run({ ...datos, id });
  },
  tienePedidos(id) {
    return Boolean(
      getDb()
        .prepare('SELECT 1 FROM pedido_items WHERE producto_id = ? LIMIT 1')
        .get(id)
    );
  },
  eliminar(id) {
    return getDb().prepare('DELETE FROM productos WHERE id = ?').run(id);
  },
  cambiarImagen: (id, imagen) => getDb().prepare('UPDATE productos SET imagen = ? WHERE id = ?').run(imagen, id)
};
