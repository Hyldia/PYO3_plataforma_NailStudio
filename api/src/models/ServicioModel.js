// MODELO: servicios del salón (manicure, acrílicas, pedicure...).
// Los modelos son la única capa que habla con la base de datos.
import { getDb } from '../db/conexion.js';
import { PRECIO } from '../patrones/constructorDiseno.js';

// Servicio con el que se hace cada tipo de diseño de la galería
const SERVICIO_POR_CATEGORIA = {
  Manicure: 'Manicure semipermanente', Gel: 'Manicure semipermanente', 'Nail art': 'Manicure semipermanente',
  'Acrílicas': 'Uñas acrílicas', Polygel: 'Polygel', Pedicure: 'Pedicure semipermanente'
};
const RECARGO_NAIL_ART = 4500;

export const CATEGORIAS_SERVICIO = ['Combos', 'Manos', 'Uñas acrílicas', 'Gel y polygel', 'Pies', 'Tratamientos', 'Diseños y extras', 'Retiros y reparaciones'];
const CAMPOS = ['nombre', 'descripcion', 'categoria', 'duracion_min', 'precio', 'precio_oferta', 'incluye', 'etiqueta', 'es_combo', 'destacado', 'activo'];

export const ServicioModel = {
  // Nombre: listarActivos
  // Descripción: Lista los servicios activos.
  // Entrada: Nada.
  // Salida: Los servicios.
  // Objetivo: Mostrar la carta.
  listarActivos: () => getDb().prepare('SELECT * FROM servicios WHERE activo = 1 ORDER BY id').all(),
  // Nombre: buscarPorId
  // Descripción: Busca un servicio activo.
  // Entrada: El número.
  // Salida: El servicio o nada.
  // Objetivo: Reservar ese servicio.
  buscarPorId: (id) => getDb().prepare('SELECT * FROM servicios WHERE id = ? AND activo = 1').get(id),

  // ----- Panel del salón -----
  // Nombre: listarTodos
  // Descripción: Lista todos los servicios con su uso.
  // Entrada: Nada.
  // Salida: Los servicios.
  // Objetivo: Administrarlos.
  listarTodos: () => getDb().prepare(`SELECT s.*,
      (SELECT COUNT(*) FROM citas c WHERE c.servicio_id = s.id AND c.estado != 'cancelada') AS citas,
      (SELECT COALESCE(SUM(c.total), 0) FROM citas c WHERE c.servicio_id = s.id AND c.estado = 'completada') AS vendido
    FROM servicios s ORDER BY s.activo DESC, s.categoria, s.id`).all(),
  // Nombre: buscarCualquiera
  // Descripción: Busca un servicio aunque esté oculto.
  // Entrada: El número.
  // Salida: El servicio o nada.
  // Objetivo: Editarlo en el panel.
  buscarCualquiera: (id) => getDb().prepare('SELECT * FROM servicios WHERE id = ?').get(id),

  // Nombre: validar
  // Descripción: Revisa los datos de un servicio.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar datos inválidos.
  validar(datos) {
    if (!String(datos.nombre || '').trim()) return 'Escribe el nombre del servicio.';
    if (!String(datos.categoria || '').trim()) return 'Elige la categoría.';
    const dur = Number(datos.duracion_min);
    if (!(dur >= 15 && dur <= 360)) return 'La duración debe estar entre 15 y 360 minutos.';
    const precio = Number(datos.precio);
    if (!(precio > 0)) return 'Escribe un precio mayor a 0.';
    if (datos.precio_oferta !== '' && datos.precio_oferta != null) {
      const oferta = Number(datos.precio_oferta);
      if (!(oferta > 0 && oferta < precio)) return 'El precio de oferta debe ser menor al precio normal.';
    }
    return null;
  },
  // Nombre: normalizar
  // Descripción: Ordena los datos de un servicio.
  // Entrada: Los datos.
  // Salida: Los datos limpios.
  // Objetivo: Guardar siempre igual.
  normalizar: (datos) => ({
    nombre: String(datos.nombre).trim().slice(0, 80),
    descripcion: String(datos.descripcion || '').trim().slice(0, 500) || null,
    categoria: String(datos.categoria).trim().slice(0, 40),
    duracion_min: Math.round(Number(datos.duracion_min)),
    precio: Math.round(Number(datos.precio)),
    precio_oferta: datos.precio_oferta === '' || datos.precio_oferta == null ? null : Math.round(Number(datos.precio_oferta)),
    incluye: (Array.isArray(datos.incluye) ? datos.incluye : String(datos.incluye || '').split(/[|\n]/)).map((linea) => linea.trim()).filter(Boolean).slice(0, 12).join('|') || null,
    etiqueta: String(datos.etiqueta || '').trim().slice(0, 20) || null,
    es_combo: datos.es_combo ? 1 : 0,
    destacado: datos.destacado ? 1 : 0,
    activo: datos.activo === undefined ? 1 : (Number(datos.activo) ? 1 : 0)
  }),
  // Nombre: crear
  // Descripción: Crea un servicio.
  // Entrada: Los datos.
  // Salida: El servicio.
  // Objetivo: Agregar a la carta.
  crear(datos) {
    const normalizado = this.normalizar(datos);
    const resultado = getDb().prepare(`INSERT INTO servicios (${CAMPOS.join(', ')}) VALUES (${CAMPOS.map((campo) => `@${campo}`).join(', ')})`).run(normalizado);
    return this.buscarCualquiera(resultado.lastInsertRowid);
  },
  // Nombre: actualizar
  // Descripción: Actualiza un servicio.
  // Entrada: El número y los datos.
  // Salida: El servicio.
  // Objetivo: Editar la carta.
  actualizar(id, datos) {
    const normalizado = this.normalizar(datos);
    getDb().prepare(`UPDATE servicios SET ${CAMPOS.map((campo) => `${campo} = @${campo}`).join(', ')} WHERE id = @id`).run({ ...normalizado, id });
    return this.buscarCualquiera(id);
  },
  // Nombre: cambiarImagen
  // Descripción: Cambia la foto de un servicio.
  // Entrada: El número y la foto.
  // Salida: Nada.
  // Objetivo: Actualizar la foto.
  cambiarImagen: (id, archivo) => getDb().prepare('UPDATE servicios SET imagen = ? WHERE id = ?').run(archivo, id),
  // Si ya tiene citas no se borra (el historial las necesita): solo se oculta
  // Nombre: eliminar
  // Descripción: Elimina u oculta un servicio.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Quitar de la carta.
  eliminar(id) {
    const usadas = getDb().prepare('SELECT COUNT(*) AS n FROM citas WHERE servicio_id = ?').get(id).n;
    if (usadas) { getDb().prepare('UPDATE servicios SET activo = 0 WHERE id = ?').run(id); return 'oculto'; }
    getDb().prepare('DELETE FROM servicios WHERE id = ?').run(id);
    return 'borrado';
  },

  // Nombre: sugeridoParaDiseno
  // Descripción: Busca el servicio con el que se hace un diseño de la galería y su recargo.
  // Entrada: La foto del diseño.
  // Salida: El servicio con precio, duración y recargo, o nada.
  // Objetivo: Mostrar cuánto cuesta cada diseño (el experto en servicios y precios es este modelo).
  sugeridoParaDiseno(foto) {
    const nombre = SERVICIO_POR_CATEGORIA[foto.categoria] || 'Manicure semipermanente';
    const servicio = getDb().prepare('SELECT * FROM servicios WHERE nombre = ? AND activo = 1').get(nombre);
    if (!servicio) return null;
    // Los recargos salen de la misma tabla que usa el diseñador de uñas: así un acabado cuesta igual en todo el sitio
    const recargo = (PRECIO.acabado[foto.acabado] || 0) + (foto.categoria === 'Nail art' ? RECARGO_NAIL_ART : 0);
    return { id: servicio.id, nombre: servicio.nombre, duracion_min: servicio.duracion_min, precio: servicio.precio_oferta ?? servicio.precio, recargo };
  }
};
