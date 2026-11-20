// Datos iniciales del salón. Cámbialos por los servicios y precios reales.
// Las fotos de la galería y de los productos se suben desde /admin.
import { getDb } from './conexion.js';
import { cargarDatosEjemplo } from './datosEjemplo.js';
import { cargarResenasEjemplo } from './resenasEjemplo.js';
import { cargarComentariosEjemplo } from './comentariosEjemplo.js';
import { cargarAgendaEjemplo } from './agendaEjemplo.js';
import { cargarHistorialEjemplo } from './historialEjemplo.js';
import { enriquecerFotos } from './enriquecerFotos.js';
import { cargarEquipoEjemplo, cargarSolicitudesEjemplo } from './equipoEjemplo.js';
import { cargarSeccionHombres } from './seccionHombres.js';
import { ESPECIALISTAS, VERSION_ESPECIALISTAS } from './especialistasEjemplo.js';
import { generarCatalogo } from './catalogoProductos.js';
import { SERVICIOS, CUPONES } from './catalogoServicios.js';
import { importarFotos } from './fotosGuardadas.js';
import { FOTOS_MUESTRA, IMAGENES_PRODUCTOS, VERSION_FOTOS } from './fotosMuestra.js';

// Nombre: seed
// Descripción: Llena la base de datos con todo lo inicial.
// Entrada: Si se debe forzar o no.
// Salida: Nada.
// Objetivo: Tener el sitio listo para usar.
export function seed({ force = false } = {}) {
  const db = getDb();
  const yaHayDatos = db.prepare('SELECT COUNT(*) AS n FROM servicios').get().n > 0;
  if (yaHayDatos && !force) {
    const servicios = cargarServicios(db);
    const catalogo = cargarCatalogo(db);
    const fotos = cargarFotosMuestra(db);
    const equipo = cargarEspecialistas(db);
    const datos = cargarDatosEjemplo(db);
    const resenas = cargarResenasEjemplo(db);
    const comentarios = cargarComentariosEjemplo(db);
    const agenda = cargarAgendaEjemplo(db);
    const historial = cargarHistorialEjemplo(db);
    const pagos = cargarEquipoEjemplo(db);
    const solicitudes = cargarSolicitudesEjemplo(db);
    const hombres = cargarSeccionHombres(db);
    const guardadas = importarFotos(db); // fotos de Unsplash que se bajaron en la computadora (npm run exportar-fotos)
    const descritas = enriquecerFotos(db) > 0;
    return servicios || catalogo || fotos || equipo || datos || resenas || comentarios || agenda || historial || pagos || solicitudes || hombres || guardadas || descritas;
  }

  db.exec(`
    DELETE FROM comentarios; DELETE FROM resenas; DELETE FROM pedido_items; DELETE FROM pedidos; DELETE FROM recordatorios;
    DELETE FROM citas; DELETE FROM disenos; DELETE FROM productos;
    DELETE FROM especialistas; DELETE FROM servicios; DELETE FROM cupones; DELETE FROM fotos; DELETE FROM ajustes;
  `);

  cargarServicios(db);

  cargarEspecialistas(db);

  cargarCatalogo(db);

  cargarFotosMuestra(db);
  cargarDatosEjemplo(db);
  cargarResenasEjemplo(db);
  cargarComentariosEjemplo(db);
  cargarAgendaEjemplo(db);
  cargarHistorialEjemplo(db);
  cargarEquipoEjemplo(db);
  cargarSolicitudesEjemplo(db);
  cargarSeccionHombres(db);
  importarFotos(db);
  enriquecerFotos(db);
  db.exec('UPDATE citas SET ejemplo = 1');
  return true;
}

// Equipo del salón: actualiza las que existen (por nombre) y agrega las nuevas, una vez por versión
// Nombre: cargarEspecialistas
// Descripción: Carga las especialistas.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Tener el equipo inicial.
function cargarEspecialistas(db) {
  const actual = Number(db.prepare("SELECT valor FROM ajustes WHERE clave = 'version_especialistas'").get()?.valor || 0);
  if (actual >= VERSION_ESPECIALISTAS) return false;
  const buscar = db.prepare('SELECT id FROM especialistas WHERE nombre = ?');
  const actualizar = db.prepare(`UPDATE especialistas SET especialidad = @especialidad, bio = @bio, experiencia = @experiencia,
    dias = @dias, hora_inicio = @hora_inicio, hora_fin = @hora_fin WHERE id = @id`);
  const insertar = db.prepare(`INSERT INTO especialistas (nombre, especialidad, bio, experiencia, dias, hora_inicio, hora_fin)
    VALUES (@nombre, @especialidad, @bio, @experiencia, @dias, @hora_inicio, @hora_fin)`);
  db.transaction(() => {
    ESPECIALISTAS.forEach((especialista) => { const ya = buscar.get(especialista.nombre); if (ya) actualizar.run({ ...especialista, id: ya.id }); else insertar.run(especialista); });
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('version_especialistas', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(String(VERSION_ESPECIALISTAS));
  })();
  return true;
}

// Carga las fotos de muestra nuevas una sola vez por versión.
// Si el salón borra una foto de muestra, no vuelve a aparecer.
// Nombre: cargarFotosMuestra
// Descripción: Carga las fotos de muestra de la galería.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Tener diseños para mostrar.
function cargarFotosMuestra(db) {
  const actual = Number(db.prepare("SELECT valor FROM ajustes WHERE clave = 'version_fotos'").get()?.valor || 0);
  if (actual >= VERSION_FOTOS) return false;

  const existe = db.prepare('SELECT 1 FROM fotos WHERE archivo = ?');
  const foto = db.prepare(`
    INSERT INTO fotos (archivo, titulo, descripcion, categoria, forma, color, acabado, etiquetas, destacada, autor, autor_url)
    VALUES (@archivo, @titulo, @descripcion, @categoria, @forma, @color, @acabado, @etiquetas, @destacada, @autor, @autor_url)
  `);
  const vacio = { forma: null, color: null, acabado: null, etiquetas: null, destacada: 0 };
  const img = db.prepare('UPDATE productos SET imagen = ? WHERE nombre = ? AND imagen IS NULL');

  db.transaction(() => {
    FOTOS_MUESTRA.forEach((fotoActual) => { if (!existe.get(fotoActual.archivo)) foto.run({ ...vacio, ...fotoActual }); });
    Object.entries(IMAGENES_PRODUCTOS).forEach(([nombre, url]) => img.run(url, nombre));
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('version_fotos', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(String(VERSION_FOTOS));
  })();
  return true;
}

// Catálogo de la tienda (~470 productos). Se carga una vez por versión y no duplica productos por nombre.
const VERSION_CATALOGO = 6;
// Nombre: cargarCatalogo
// Descripción: Carga el catálogo de productos.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Tener la tienda llena.
function cargarCatalogo(db) {
  const actual = Number(db.prepare("SELECT valor FROM ajustes WHERE clave = 'version_catalogo'").get()?.valor || 0);
  if (actual >= VERSION_CATALOGO) return false;
  const existe = db.prepare('SELECT 1 FROM productos WHERE nombre = ?');
  const ins = db.prepare(`INSERT INTO productos (nombre, descripcion, categoria, marca, precio, stock, color, tipo)
    VALUES (@nombre, @descripcion, @categoria, @marca, @precio, @stock, @color, @tipo)`);
  db.transaction(() => {
    const nuevos = [];
    generarCatalogo().forEach((producto) => { if (!existe.get(producto.nombre)) nuevos.push(Number(ins.run(producto).lastInsertRowid)); });
    // Productos de versiones anteriores: asignarles una ilustración
    db.exec(`
      UPDATE productos SET tipo = 'frasco-gel', categoria = 'Esmaltes y geles' WHERE tipo IS NULL AND nombre LIKE 'Esmalte%';
      UPDATE productos SET tipo = 'gotero', categoria = 'Cuidado de manos' WHERE tipo IS NULL AND nombre LIKE 'Aceite%';
      UPDATE productos SET tipo = 'crema', categoria = 'Cuidado de manos' WHERE tipo IS NULL AND nombre LIKE 'Crema%';
      UPDATE productos SET tipo = 'kit' WHERE tipo IS NULL;
      UPDATE productos SET marca = 'Nailé Pro' WHERE marca = '[MARCA]';
      UPDATE productos SET categoria = 'Pedicure' WHERE categoria = 'Cuidado de pies';
    `);
    // Versión 3: quitar las fotos de muestra que no correspondían al producto,
    // para que `npm run fotos-productos` les ponga una adecuada
    // Descuentos, estrellas y ventas: a todo en la versión 4, y después solo a lo nuevo
    if (actual < 4) darDatosDeVenta(db);
    else if (nuevos.length) darDatosDeVenta(db, nuevos);
    // Versión 6: algunos productos agotados, como en cualquier tienda real
    if (actual < 6) marcarAgotados(db);
    if (actual < 3) db.exec("UPDATE productos SET imagen = NULL WHERE imagen LIKE 'https://images.unsplash.com/%' AND imagen_autor IS NULL");
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('version_catalogo', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(String(VERSION_CATALOGO));
  })();
  return true;
}

// Carta de servicios, combos y cupones (catalogoServicios.js). Actualiza los servicios
// que ya existen por nombre (sin cambiar su id, así las citas viejas siguen bien) y agrega los nuevos.
const VERSION_SERVICIOS = 2;
// Nombre: cargarServicios
// Descripción: Carga la carta de servicios.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Tener los servicios.
function cargarServicios(db) {
  const actual = Number(db.prepare("SELECT valor FROM ajustes WHERE clave = 'version_servicios'").get()?.valor || 0);
  if (actual >= VERSION_SERVICIOS) return false;
  const buscar = db.prepare('SELECT id FROM servicios WHERE nombre = ?');
  const campos = 'descripcion = @descripcion, categoria = @categoria, duracion_min = @duracion_min, precio = @precio, precio_oferta = @precio_oferta, incluye = @incluye, etiqueta = @etiqueta, imagen = @imagen, es_combo = @es_combo, destacado = @destacado';
  const actualizar = db.prepare(`UPDATE servicios SET ${campos} WHERE id = @id`);
  const insertar = db.prepare(`INSERT INTO servicios (nombre, descripcion, categoria, duracion_min, precio, precio_oferta, incluye, etiqueta, imagen, es_combo, destacado)
    VALUES (@nombre, @descripcion, @categoria, @duracion_min, @precio, @precio_oferta, @incluye, @etiqueta, @imagen, @es_combo, @destacado)`);
  const cupon = db.prepare(`INSERT OR IGNORE INTO cupones (codigo, descripcion, tipo, valor, minimo, vence, solo_combos, publico)
    VALUES (@codigo, @descripcion, @tipo, @valor, @minimo, @vence, @solo_combos, @publico)`);
  db.transaction(() => {
    SERVICIOS.forEach((servicio) => { const existente = buscar.get(servicio.nombre); if (existente) actualizar.run({ ...servicio, id: existente.id }); else insertar.run(servicio); });
    CUPONES.forEach((cuponActual) => cupon.run({ solo_combos: 0, ...cuponActual }));
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('version_servicios', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(String(VERSION_SERVICIOS));
  })();
  return true;
}

// Descuentos, estrellas, reseñas y unidades vendidas de ejemplo (siempre los mismos, por id)
// Nombre: marcarAgotados
// Descripción: Marca algunos productos como agotados.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Que se vea cómo luce un agotado.
function marcarAgotados(db) {
  // Nombre: azar
  // Descripción: Da un número fijo "al azar" para un producto.
  // Entrada: El número del producto.
  // Salida: Un número entre 0 y 1.
  // Objetivo: Que los datos no cambien al reiniciar.
  const azar = (id) => { const x = Math.sin(id * 7919 + 104729) * 233280; return x - Math.floor(x); };
  const upd = db.prepare('UPDATE productos SET stock = 0 WHERE id = ?');
  db.prepare("SELECT id FROM productos WHERE nombre != 'Press-on personalizado con tu diseño'").all()
    .forEach(({ id }) => { if (azar(id) < 0.07) upd.run(id); });
}

// Nombre: darDatosDeVenta
// Descripción: Da ventas y estrellas de ejemplo a los productos.
// Entrada: La base de datos y qué productos.
// Salida: Nada.
// Objetivo: Que haya "más vendidos".
function darDatosDeVenta(db, ids = null) {
  // Nombre: azar
  // Descripción: Da un número fijo "al azar" para un producto.
  // Entrada: El producto y un número extra.
  // Salida: Un número entre 0 y 1.
  // Objetivo: Variar las ventas de ejemplo.
  const azar = (id, numero) => { const x = Math.sin(id * 9301 + numero * 49297) * 233280; return x - Math.floor(x); };
  const todos = db.prepare('SELECT id, precio FROM productos').all();
  const productos = ids ? todos.filter((todo) => ids.includes(todo.id)) : todos;
  const upd = db.prepare('UPDATE productos SET precio = ?, precio_anterior = ?, calificacion = ?, resenas = ?, vendidos = ?, stock = ? WHERE id = ?');
  productos.forEach(({ id, precio }) => {
    const enOferta = azar(id, 1) < 0.4;
    const descuento = [10, 15, 20, 25, 30, 40][Math.floor(azar(id, 2) * 6)];
    const nuevo = enOferta ? Math.round(precio * (1 - descuento / 100) / 100) * 100 : precio;
    const resenas = Math.floor(azar(id, 3) * 400);
    const calificacion = resenas ? Math.round((4 + azar(id, 4)) * 10) / 10 : null;
    const vendidos = Math.floor(azar(id, 5) * 1500) + resenas;
    const stock = azar(id, 6) < 0.15 ? Math.floor(azar(id, 7) * 9) + 1 : 10 + Math.floor(azar(id, 8) * 50);
    upd.run(nuevo, enOferta ? precio : null, calificacion, resenas, vendidos, stock, id);
  });
}
