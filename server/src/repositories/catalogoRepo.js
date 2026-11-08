// Patrón Repository: las rutas no escriben SQL, piden datos al repositorio.
import { getDb } from '../db/connection.js';

const ORDEN_PRODUCTOS = {
  relevancia: 'stock > 0 DESC, id',
  'precio-asc': 'precio ASC',
  'precio-desc': 'precio DESC',
  nuevos: 'creado_en DESC, id DESC'
};

export const catalogoRepo = {
  servicios: () => getDb().prepare('SELECT * FROM servicios WHERE activo = 1 ORDER BY id').all(),
  servicio: (id) => getDb().prepare('SELECT * FROM servicios WHERE id = ? AND activo = 1').get(id),
  especialistas: () => getDb().prepare('SELECT * FROM especialistas ORDER BY id').all(),
  especialista: (id) => getDb().prepare('SELECT * FROM especialistas WHERE id = ?').get(id),

  productos({ q, categoria, min, max, disponibles, orden } = {}) {
    const where = [];
    const p = {};
    if (categoria && categoria !== 'Todas') { where.push('categoria = @categoria'); p.categoria = categoria; }
    if (q && q.trim()) { where.push('(lower(nombre) LIKE @q OR lower(descripcion) LIKE @q OR lower(marca) LIKE @q)'); p.q = `%${q.trim().toLowerCase()}%`; }
    if (min) { where.push('precio >= @min'); p.min = Number(min); }
    if (max) { where.push('precio <= @max'); p.max = Number(max); }
    if (disponibles === '1') where.push('stock > 0');
    const sql = `SELECT * FROM productos ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${ORDEN_PRODUCTOS[orden] || ORDEN_PRODUCTOS.relevancia}`;
    return getDb().prepare(sql).all(p);
  },
  categoriasProductos: () => getDb().prepare('SELECT categoria AS valor, COUNT(*) AS cantidad FROM productos GROUP BY categoria ORDER BY categoria').all(),
  producto: (id) => getDb().prepare('SELECT * FROM productos WHERE id = ?').get(id),
  imagenProducto: (id, imagen) => getDb().prepare('UPDATE productos SET imagen = ? WHERE id = ?').run(imagen, id)
};
