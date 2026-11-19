// MODELO: fotos de la galería, con búsqueda y filtros combinables.
import { getDb } from '../db/conexion.js';
import { ServicioModel } from './ServicioModel.js';
import { ProductoModel } from './ProductoModel.js';

const PRESSON = 'Press-on personalizado con tu diseño';
// Palabras que pesan más al buscar fotos parecidas a un diseño
const PALABRAS_DECORACION = ['perla', 'pedrer', 'cristal', 'sticker', 'glitter', 'cromo', 'aurora', 'flor', 'foil', 'charm', 'moño', 'mariposa', 'francesa', 'ombré', 'baby boomer',
  'mármol', 'líneas', 'puntos', 'corazon', 'animal', 'aura', 'ojo de gato', 'terciopelo', 'perlado'];
const PALABRAS_COLOR = ['rosa', 'roj', 'nude', 'blanc', 'negr', 'azul', 'verde', 'morad', 'lila', 'amarill', 'coral', 'naranja', 'café', 'dorad', 'platead', 'vino', 'metálic', 'neón', 'jelly'];

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
    const valores = String(filtros[campo] || '').split(',').map((parte) => parte.trim()).filter(Boolean);
    if (valores.length) {
      const nombres = valores.map((valor, i) => { params[`${campo}${i}`] = valor; return `@${campo}${i}`; });
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

  // Nombre: parecidas
  // Descripción: Busca fotos reales que se parecen al diseño que arma la clienta.
  // Entrada: Palabras del diseño (color, forma, técnica, decoraciones) y cuántas fotos.
  // Salida: Las fotos ordenadas de la más parecida a la menos, con las palabras que coinciden.
  // Objetivo: Mostrar cómo se ve el diseño en uñas de verdad.
  parecidas(palabras = [], limite = 9) {
    const claves = [...new Set(palabras.map((palabra) => String(palabra).trim().toLowerCase()).filter((palabra) => palabra.length > 2))].slice(0, 12);
    const fotos = getDb().prepare("SELECT * FROM fotos WHERE categoria != 'Pedicure' OR categoria IS NULL").all();
    const texto = (foto) => `${foto.titulo} ${foto.descripcion || ''} ${foto.etiquetas || ''} ${foto.color || ''} ${foto.forma || ''} ${foto.acabado || ''}`.toLowerCase();
    // Lo más importante para que la foto se parezca: las piedras y la técnica; después el color; al final la forma
    const pesoDe = (palabra) => (PALABRAS_DECORACION.some((decoracion) => palabra.startsWith(decoracion)) ? 3 : PALABRAS_COLOR.some((color) => palabra.startsWith(color)) ? 2 : 1);
    return fotos
      .map((foto) => { const textoFoto = texto(foto); const coinciden = claves.filter((clave) => textoFoto.includes(clave)); return { ...foto, coinciden, puntos: coinciden.reduce((suma, coincidencia) => suma + pesoDe(coincidencia), 0) }; })
      .sort((a, b) => b.puntos - a.puntos || b.destacada - a.destacada || b.vistas - a.vistas)
      .slice(0, Math.min(Number(limite) || 9, 24));
  },
  // Nombre: buscarPorId
  // Descripción: Busca una foto por su número.
  // Entrada: El número de la foto.
  // Salida: La foto o nada.
  // Objetivo: Abrir el detalle de un diseño.
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
    const foto = this.buscarPorId(id);
    if (!foto) return [];
    return getDb().prepare(`
      SELECT * FROM (SELECT f.*, RANK() OVER (PARTITION BY categoria ORDER BY vistas DESC) AS puesto FROM fotos f)
      WHERE id != @id
      ORDER BY (categoria = @categoria) * 3 + (color IS @color) * 2 + (forma IS @forma) * 2 + (acabado IS @acabado) DESC, vistas DESC
      LIMIT @limite`).all({ id: foto.id, categoria: foto.categoria, color: foto.color, forma: foto.forma, acabado: foto.acabado, limite: Math.min(Number(limite) || 10, 40) });
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
    const resultado = getDb().prepare(`
      INSERT INTO fotos (archivo, titulo, descripcion, categoria, forma, color, acabado, etiquetas, destacada, precio)
      VALUES (@archivo, @titulo, @descripcion, @categoria, @forma, @color, @acabado, @etiquetas, @destacada, @precio)
    `).run(f);
    return this.buscarPorId(resultado.lastInsertRowid);
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
    return fotos.map((foto) => {
      const sv = ServicioModel.sugeridoParaDiseno(foto);
      return { ...foto, servicio_id: sv?.id ?? null, precio_salon: foto.precio ?? sv?.precio ?? null, precio_presson: presson?.precio ?? null, presson_anterior: presson?.precio_anterior ?? null };
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
