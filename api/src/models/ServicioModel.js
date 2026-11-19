// MODELO: servicios del salón (manicure, acrílicas, pedicure...).
// Los modelos son la única capa que habla con la base de datos.
import { getDb } from '../db/conexion.js';

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
  validar(d) {
    if (!String(d.nombre || '').trim()) return 'Escribe el nombre del servicio.';
    if (!String(d.categoria || '').trim()) return 'Elige la categoría.';
    const dur = Number(d.duracion_min);
    if (!(dur >= 15 && dur <= 360)) return 'La duración debe estar entre 15 y 360 minutos.';
    const precio = Number(d.precio);
    if (!(precio > 0)) return 'Escribe un precio mayor a 0.';
    if (d.precio_oferta !== '' && d.precio_oferta != null) {
      const o = Number(d.precio_oferta);
      if (!(o > 0 && o < precio)) return 'El precio de oferta debe ser menor al precio normal.';
    }
    return null;
  },
  // Nombre: normalizar
  // Descripción: Ordena los datos de un servicio.
  // Entrada: Los datos.
  // Salida: Los datos limpios.
  // Objetivo: Guardar siempre igual.
  normalizar: (d) => ({
    nombre: String(d.nombre).trim().slice(0, 80),
    descripcion: String(d.descripcion || '').trim().slice(0, 500) || null,
    categoria: String(d.categoria).trim().slice(0, 40),
    duracion_min: Math.round(Number(d.duracion_min)),
    precio: Math.round(Number(d.precio)),
    precio_oferta: d.precio_oferta === '' || d.precio_oferta == null ? null : Math.round(Number(d.precio_oferta)),
    incluye: (Array.isArray(d.incluye) ? d.incluye : String(d.incluye || '').split(/[|\n]/)).map((x) => x.trim()).filter(Boolean).slice(0, 12).join('|') || null,
    etiqueta: String(d.etiqueta || '').trim().slice(0, 20) || null,
    es_combo: d.es_combo ? 1 : 0,
    destacado: d.destacado ? 1 : 0,
    activo: d.activo === undefined ? 1 : (Number(d.activo) ? 1 : 0)
  }),
  // Nombre: crear
  // Descripción: Crea un servicio.
  // Entrada: Los datos.
  // Salida: El servicio.
  // Objetivo: Agregar a la carta.
  crear(d) {
    const n = this.normalizar(d);
    const r = getDb().prepare(`INSERT INTO servicios (${CAMPOS.join(', ')}) VALUES (${CAMPOS.map((c) => `@${c}`).join(', ')})`).run(n);
    return this.buscarCualquiera(r.lastInsertRowid);
  },
  // Nombre: actualizar
  // Descripción: Actualiza un servicio.
  // Entrada: El número y los datos.
  // Salida: El servicio.
  // Objetivo: Editar la carta.
  actualizar(id, d) {
    const n = this.normalizar(d);
    getDb().prepare(`UPDATE servicios SET ${CAMPOS.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`).run({ ...n, id });
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
  }
};
