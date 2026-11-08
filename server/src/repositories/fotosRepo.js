// Patrón Repository para la galería, con búsqueda y filtros combinables.
import { getDb } from '../db/connection.js';

const FILTRABLES = ['categoria', 'forma', 'color', 'acabado'];
const ORDEN = {
  recientes: 'destacada DESC, creado_en DESC, id DESC',
  populares: 'vistas DESC, creado_en DESC',
  antiguas: 'creado_en ASC, id ASC'
};

function construirFiltro({ q, ...filtros }) {
  const where = [];
  const params = {};
  for (const campo of FILTRABLES) {
    // Cada filtro acepta varios valores separados por coma: ?color=Rosa,Nude
    const valores = String(filtros[campo] || '').split(',').map((v) => v.trim()).filter(Boolean);
    if (valores.length) {
      const nombres = valores.map((v, i) => { params[`${campo}${i}`] = v; return `@${campo}${i}`; });
      where.push(`${campo} IN (${nombres.join(', ')})`);
    }
  }
  if (q && q.trim()) {
    params.q = `%${q.trim().toLowerCase()}%`;
    where.push('(lower(titulo) LIKE @q OR lower(descripcion) LIKE @q OR lower(etiquetas) LIKE @q OR lower(color) LIKE @q OR lower(forma) LIKE @q)');
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export const fotosRepo = {
  buscar({ orden = 'recientes', limite = 60, pagina = 1, ...filtros } = {}) {
    const db = getDb();
    const { sql, params } = construirFiltro(filtros);
    const total = db.prepare(`SELECT COUNT(*) AS n FROM fotos ${sql}`).get(params).n;
    const lim = Math.min(Number(limite) || 60, 100);
    const offset = (Math.max(Number(pagina) || 1, 1) - 1) * lim;
    const fotos = db.prepare(`SELECT * FROM fotos ${sql} ORDER BY ${ORDEN[orden] || ORDEN.recientes} LIMIT ${lim} OFFSET ${offset}`).all(params);
    return { total, fotos };
  },

  // Valores disponibles para cada filtro, con cuántas fotos tiene cada uno
  opcionesDeFiltro() {
    const db = getDb();
    return Object.fromEntries(FILTRABLES.map((campo) => [
      campo,
      db.prepare(`SELECT ${campo} AS valor, COUNT(*) AS cantidad FROM fotos WHERE ${campo} IS NOT NULL AND ${campo} != '' GROUP BY ${campo} ORDER BY cantidad DESC, ${campo}`).all()
    ]));
  },

  porId: (id) => getDb().prepare('SELECT * FROM fotos WHERE id = ?').get(id),
  sumarVista: (id) => getDb().prepare('UPDATE fotos SET vistas = vistas + 1 WHERE id = ?').run(id),

  crear(f) {
    const r = getDb().prepare(`
      INSERT INTO fotos (archivo, titulo, descripcion, categoria, forma, color, acabado, etiquetas, destacada)
      VALUES (@archivo, @titulo, @descripcion, @categoria, @forma, @color, @acabado, @etiquetas, @destacada)
    `).run(f);
    return this.porId(r.lastInsertRowid);
  },

  actualizar(id, f) {
    getDb().prepare(`
      UPDATE fotos SET titulo = @titulo, descripcion = @descripcion, categoria = @categoria, forma = @forma,
        color = @color, acabado = @acabado, etiquetas = @etiquetas, destacada = @destacada WHERE id = @id
    `).run({ ...f, id });
    return this.porId(id);
  },

  eliminar: (id) => getDb().prepare('DELETE FROM fotos WHERE id = ?').run(id)
};
