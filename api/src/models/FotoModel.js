// MODELO: fotos de la galería, con búsqueda y filtros combinables.
import { getDb } from '../db/conexion.js';
import { ServicioModel } from './ServicioModel.js';
import { ProductoModel } from './ProductoModel.js';

const PRESSON = 'Press-on personalizado con tu diseño';

export const CAMPOS_FILTRABLES = ['categoria', 'forma', 'color', 'acabado'];
const ORDEN = {
  recientes: 'destacada DESC, creado_en DESC, id DESC',
  populares: 'vistas DESC, creado_en DESC',
  antiguas: 'creado_en ASC, id ASC'
};

// Nombre: construirFiltro
// Descripción: Arma el filtro de búsqueda de la galería.
// Entrada: Lo buscado y los filtros.
// Salida: El filtro listo.
// Objetivo: Buscar diseños.
function construirFiltro({ q, ...filtros }) {
  const where = [];
  const params = {};
  for (const campo of CAMPOS_FILTRABLES) {
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

export const FotoModel = {
  // Nombre: buscar
  // Descripción: Busca diseños con filtros y páginas.
  // Entrada: Orden, página y filtros.
  // Salida: Los diseños y el total.
  // Objetivo: Mostrar la galería.
  buscar({ orden = 'recientes', limite = 60, pagina = 1, ...filtros } = {}) {
    const db = getDb();
    const { sql, params } = construirFiltro(filtros);
    const total = db.prepare(`SELECT COUNT(*) AS n FROM fotos ${sql}`).get(params).n;
    // "puesto": lugar de la foto entre las más vistas de su categoría (para la insignia "#1 más popular")
    const lim = Math.min(Number(limite) || 60, 100);
    const offset = (Math.max(Number(pagina) || 1, 1) - 1) * lim;
    const fotos = db.prepare(`SELECT * FROM (SELECT f.*, RANK() OVER (PARTITION BY categoria ORDER BY vistas DESC) AS puesto FROM fotos f) ${sql} ORDER BY ${ORDEN[orden] || ORDEN.recientes} LIMIT ${lim} OFFSET ${offset}`).all(params);
    return { total, fotos };
  },

  // Valores disponibles para cada filtro, con cuántas fotos tiene cada uno
  // Nombre: opcionesDeFiltro
  // Descripción: Junta las opciones de filtro.
  // Entrada: Nada.
  // Salida: Las opciones con su cantidad.
  // Objetivo: Llenar los filtros.
  opcionesDeFiltro() {
    const db = getDb();
    return Object.fromEntries(CAMPOS_FILTRABLES.map((campo) => [
      campo,
      db.prepare(`SELECT ${campo} AS valor, COUNT(*) AS cantidad FROM fotos WHERE ${campo} IS NOT NULL AND ${campo} != '' GROUP BY ${campo} ORDER BY cantidad DESC, ${campo}`).all()
    ]));
  },

  // Nombre: buscarPorId
  // Descripción: Busca un diseño.
  // Entrada: El número.
  // Salida: El diseño o nada.
  // Objetivo: Ver un diseño.
  buscarPorId: (id) => getDb().prepare('SELECT * FROM fotos WHERE id = ?').get(id),

  // Nombre: conPuesto
  // Descripción: Busca un diseño con su puesto en el ranking.
  // Entrada: El número.
  // Salida: El diseño y su puesto.
  // Objetivo: Mostrar "#1 en Manicure".
  conPuesto: (id) => getDb().prepare('SELECT * FROM (SELECT f.*, RANK() OVER (PARTITION BY categoria ORDER BY vistas DESC) AS puesto FROM fotos f) WHERE id = ?').get(id),

  // Diseños parecidos: misma categoría, color, forma o acabado (los que más coinciden primero)
  // Nombre: relacionados
  // Descripción: Busca diseños parecidos.
  // Entrada: El número y cuántos.
  // Salida: Una lista.
  // Objetivo: Sugerir ideas.
  relacionados(id, limite = 10) {
    const f = this.buscarPorId(id);
    if (!f) return [];
    return getDb().prepare(`
      SELECT * FROM (SELECT f.*, RANK() OVER (PARTITION BY categoria ORDER BY vistas DESC) AS puesto FROM fotos f)
      WHERE id != @id
      ORDER BY (categoria = @categoria) * 3 + (color IS @color) * 2 + (forma IS @forma) * 2 + (acabado IS @acabado) DESC, vistas DESC
      LIMIT @limite`).all({ id: f.id, categoria: f.categoria, color: f.color, forma: f.forma, acabado: f.acabado, limite: Math.min(Number(limite) || 10, 40) });
  },
  // Nombre: sumarVista
  // Descripción: Suma una vista a un diseño.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Saber qué gusta más.
  sumarVista: (id) => getDb().prepare('UPDATE fotos SET vistas = vistas + 1 WHERE id = ?').run(id),

  // Nombre: crear
  // Descripción: Guarda un diseño nuevo.
  // Entrada: Los datos.
  // Salida: El diseño.
  // Objetivo: Agregar a la galería.
  crear(f) {
    const r = getDb().prepare(`
      INSERT INTO fotos (archivo, titulo, descripcion, categoria, forma, color, acabado, etiquetas, destacada, precio)
      VALUES (@archivo, @titulo, @descripcion, @categoria, @forma, @color, @acabado, @etiquetas, @destacada, @precio)
    `).run(f);
    return this.buscarPorId(r.lastInsertRowid);
  },

  // Nombre: actualizar
  // Descripción: Actualiza un diseño.
  // Entrada: El número y los datos.
  // Salida: El diseño.
  // Objetivo: Editar la galería.
  actualizar(id, f) {
    getDb().prepare(`
      UPDATE fotos SET titulo = @titulo, descripcion = @descripcion, categoria = @categoria, forma = @forma,
        color = @color, acabado = @acabado, etiquetas = @etiquetas, destacada = @destacada, precio = @precio WHERE id = @id
    `).run({ ...f, id });
    return this.buscarPorId(id);
  },

  // Nombre: cambiarArchivo
  // Descripción: Cambia la foto de un diseño.
  // Entrada: El número y la foto.
  // Salida: Nada.
  // Objetivo: Actualizar la foto.
  cambiarArchivo: (id, archivo) => getDb().prepare('UPDATE fotos SET archivo = ?, autor = NULL, autor_url = NULL WHERE id = ?').run(archivo, id),
  // Nombre: eliminar
  // Descripción: Elimina un diseño.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Quitar de la galería.
  eliminar: (id) => getDb().prepare('DELETE FROM fotos WHERE id = ?').run(id),

  // Regla del modelo: normaliza lo que llega del formulario del panel
  // Nombre: normalizar
  // Descripción: Ordena los datos de un diseño.
  // Entrada: Los datos.
  // Salida: Los datos limpios.
  // Objetivo: Guardar siempre igual.
  normalizar: (b) => ({
    titulo: (b.titulo || '').trim() || 'Sin título',
    descripcion: b.descripcion || null,
    categoria: b.categoria || 'Manicure',
    forma: b.forma || null, color: b.color || null, acabado: b.acabado || null,
    // Precio libre del diseño (vacío = se usa el precio del servicio)
    precio: b.precio === '' || b.precio == null || !(Number(b.precio) > 0) ? null : Math.round(Number(b.precio)),
    etiquetas: b.etiquetas || null,
    destacada: b.destacada === 'true' || b.destacada === true ? 1 : 0
  }),

  // Nombre: conPrecios
  // Descripción: Agrega a cada diseño su precio en el salón y en press-on.
  // Entrada: La lista de diseños.
  // Salida: Los diseños con sus precios.
  // Objetivo: Que cada foto diga cuánto cuesta.
  conPrecios(fotos) {
    const presson = ProductoModel.buscarPorNombre(PRESSON);
    return fotos.map((f) => {
      const sv = ServicioModel.sugeridoParaDiseno(f);
      return { ...f, servicio_id: sv?.id ?? null, precio_salon: f.precio ?? sv?.precio ?? null, precio_presson: presson?.precio ?? null, presson_anterior: presson?.precio_anterior ?? null };
    });
  },

  // Nombre: detalleConPrecios
  // Descripción: Arma el detalle de un diseño con su servicio y su press-on.
  // Entrada: El número del diseño.
  // Salida: El diseño completo o nada.
  // Objetivo: Llenar la página del diseño.
  detalleConPrecios(id) {
    const foto = this.conPuesto(id);
    if (!foto) return null;
    const presson = ProductoModel.buscarPorNombre(PRESSON);
    const sv = ServicioModel.sugeridoParaDiseno(foto);
    return { ...foto, servicio: sv && { ...sv, precio: foto.precio ?? sv.precio }, presson: presson && { id: presson.id, precio: presson.precio, precio_anterior: presson.precio_anterior, stock: presson.stock } };
  }
};
