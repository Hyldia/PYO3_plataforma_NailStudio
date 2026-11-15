// MODELO: productos de la tienda, con búsqueda, filtros y orden.
import { getDb } from '../db/connection.js';

const ORDEN = {
  relevancia: 'stock > 0 DESC, id',
  vendidos: 'stock > 0 DESC, vendidos DESC',
  descuento: 'stock > 0 DESC, (precio_anterior IS NOT NULL) DESC, (precio_anterior - precio) * 1.0 / COALESCE(precio_anterior, precio) DESC',
  calificacion: 'calificacion DESC, resenas DESC',
  'precio-asc': 'precio ASC',
  'precio-desc': 'precio DESC',
  nuevos: 'creado_en DESC, id DESC'
};

export const ProductoModel = {
  buscar({ q, categoria, min, max, disponibles, ofertas, orden, limite, ids } = {}) {
    const where = [];
    const p = {};
    // ids=1,2,3: el carrito pide el stock y precio actuales de lo que tiene guardado
    if (ids) {
      const lista = String(ids).split(',').map(Number).filter((n) => n > 0).slice(0, 100);
      where.push(`id IN (${lista.length ? lista.join(',') : 0})`);
    }
    if (categoria && categoria !== 'Todas') { where.push('categoria = @categoria'); p.categoria = categoria; }
    if (q && q.trim()) { where.push('(lower(nombre) LIKE @q OR lower(descripcion) LIKE @q OR lower(marca) LIKE @q)'); p.q = `%${q.trim().toLowerCase()}%`; }
    if (min) { where.push('precio >= @min'); p.min = Number(min); }
    if (max) { where.push('precio <= @max'); p.max = Number(max); }
    if (disponibles === '1') where.push('stock > 0');
    if (ofertas === '1') where.push('precio_anterior IS NOT NULL');
    const sql = `SELECT * FROM productos ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${ORDEN[orden] || ORDEN.relevancia}${Number(limite) > 0 ? ` LIMIT ${Math.min(Number(limite), 100)}` : ''}`;
    return getDb().prepare(sql).all(p);
  },
  categorias: () => getDb().prepare('SELECT categoria AS valor, COUNT(*) AS cantidad FROM productos GROUP BY categoria ORDER BY categoria').all(),
  buscarPorId: (id) => getDb().prepare('SELECT * FROM productos WHERE id = ?').get(id),
  buscarPorNombre: (nombre) => getDb().prepare('SELECT * FROM productos WHERE nombre = ?').get(nombre),

  // Productos de la misma categoría, primero los del mismo tipo y los más vendidos
  relacionados(id, limite = 12) {
    const p = this.buscarPorId(id);
    if (!p) return [];
    return getDb().prepare(`SELECT * FROM productos WHERE id != @id AND categoria = @categoria
      ORDER BY (tipo IS @tipo) DESC, vendidos DESC LIMIT @limite`).all({ id: p.id, categoria: p.categoria, tipo: p.tipo, limite: Math.min(Number(limite) || 12, 40) });
  },

  // Variantes: el mismo producto en otros colores o tonos ("Esmalte gel Rojo", "Esmalte gel Nude"...)
  variantes(id) {
    const p = this.buscarPorId(id);
    if (!p) return [];
    const prefijo = p.nombre.split(' ').slice(0, 2).join(' ');
    const lista = getDb().prepare(`SELECT id, nombre, color, imagen, tipo, precio, stock FROM productos
      WHERE categoria = ? AND tipo IS ? AND nombre LIKE ? ORDER BY id LIMIT 90`).all(p.categoria, p.tipo, `${prefijo} %`);
    if (lista.length < 2) return [];
    // La parte del nombre que comparten todas ("Aceite de cutícula") no se repite en cada opción
    const palabras = lista.map((v) => v.nombre.split(' '));
    let comun = 0;
    while (palabras.every((w) => w.length > comun + 1 && w[comun] === palabras[0][comun])) comun++;
    return lista.map((v, i) => ({ ...v, variante: palabras[i].slice(comun).join(' ') }));
  },
  cambiarImagen: (id, imagen) => getDb().prepare('UPDATE productos SET imagen = ?, imagen_autor = NULL, imagen_autor_url = NULL WHERE id = ?').run(imagen, id)
};
