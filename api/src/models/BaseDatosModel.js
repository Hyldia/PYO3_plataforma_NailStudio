// MODELO: consulta de solo lectura de la base de datos, para el panel del salón.
// Solo permite leer tablas que existen (lista blanca), nunca escribir.
import { getDb } from '../db/connection.js';

const POR_PAGINA_MAX = 100;

export const BaseDatosModel = {
  tablas() {
    const db = getDb();
    return db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
      .map((t) => ({ nombre: t.name, filas: db.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get().n, sql: t.sql }));
  },

  existe: (nombre) => Boolean(getDb().prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? AND name NOT LIKE 'sqlite_%'").get(nombre)),

  columnas: (tabla) => getDb().prepare(`PRAGMA table_info("${tabla}")`).all().map((c) => ({ nombre: c.name, tipo: c.type, clave: Boolean(c.pk) })),

  // Filas paginadas, con búsqueda de texto en todas las columnas
  filas(tabla, { pagina = 1, porPagina = 25, q = '' } = {}) {
    const db = getDb();
    const cols = this.columnas(tabla).map((c) => c.nombre);
    const where = q.trim() ? `WHERE ${cols.map((c) => `CAST("${c}" AS TEXT) LIKE @q`).join(' OR ')}` : '';
    const params = { q: `%${q.trim()}%` };
    const total = db.prepare(`SELECT COUNT(*) AS n FROM "${tabla}" ${where}`).get(params).n;
    const lim = Math.min(Math.max(Number(porPagina) || 25, 1), POR_PAGINA_MAX);
    const offset = (Math.max(Number(pagina) || 1, 1) - 1) * lim;
    const filas = db.prepare(`SELECT * FROM "${tabla}" ${where} ORDER BY rowid DESC LIMIT ${lim} OFFSET ${offset}`).all(params);
    return { total, pagina: Number(pagina) || 1, porPagina: lim, columnas: cols, filas };
  },

  todasLasFilas: (tabla) => getDb().prepare(`SELECT * FROM "${tabla}" ORDER BY rowid`).all()
};
