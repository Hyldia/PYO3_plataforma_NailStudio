// SECCIÓN PARA HOMBRES: servicios y productos de cuidado de uñas, manos y pies para caballeros.
// Se agregan una sola vez (si la dueña los borra desde el panel, no vuelven a aparecer).
const SERVICIOS_HOMBRES = [
  { nombre: 'Manicure para caballero', descripcion: 'Uñas limpias, cortas y parejas, con acabado natural sin brillo.', incluye: 'Corte y limado|Limpieza de cutícula|Pulido natural|Hidratación de manos', duracion_min: 40, precio: 9000, precio_oferta: null, etiqueta: 'Nuevo' },
  { nombre: 'Pedicure para caballero', descripcion: 'Pies cómodos y cuidados: corte correcto, callosidades y mucha hidratación.', incluye: 'Remojo relajante|Corte y limado|Retiro de callosidades|Crema hidratante', duracion_min: 50, precio: 12000, precio_oferta: null, etiqueta: null },
  { nombre: 'Spa de manos para caballero', descripcion: 'Manos suaves para el trabajo o una ocasión especial: exfoliación, mascarilla y masaje.', incluye: 'Exfoliación|Mascarilla reparadora|Masaje de manos|Uñas pulidas mate', duracion_min: 45, precio: 11000, precio_oferta: null, etiqueta: null },
  { nombre: 'Manos y pies para caballero', descripcion: 'Manicure y pedicure en una sola cita, a mejor precio.', incluye: 'Manicure para caballero|Pedicure para caballero|Hidratación profunda', duracion_min: 90, precio: 21000, precio_oferta: 18500, etiqueta: 'Oferta' }
];

const PRODUCTOS_HOMBRES = [
  ['Crema de manos para hombre sin aroma 75 ml', 'Se absorbe rápido y no deja las manos grasosas.', 'crema', 4500, '#DCE3E8', 6000],
  ['Kit de cuidado de uñas para hombre (7 piezas)', 'Cortaúñas, tijera, lima, empujador y estuche de cuero.', 'kit', 12900, '#3A3F45', 15900],
  ['Cortaúñas de acero inoxidable', 'Corte limpio y firme, no se oxida.', 'alicate', 3500, '#C0C4C8', null],
  ['Lima de cristal para hombre', 'Deja el borde liso, dura años y se lava con agua.', 'lima', 3900, '#2F3A45', null],
  ['Aceite de cutícula sin aroma', 'Cutículas sanas sin perfume, de uso diario.', 'gotero', 3800, '#C9A46A', null],
  ['Fortalecedor de uñas acabado mate', 'Endurece uñas débiles sin que se note brillo.', 'frasco-gel', 4900, '#E8E2DA', 5900],
  ['Bálsamo reparador de manos y nudillos', 'Para manos resecas o agrietadas por el trabajo.', 'crema', 5200, '#B9C7B0', null],
  ['Exfoliante de manos con carbón activado', 'Quita la piel muerta y deja las manos suaves.', 'tarro', 4800, '#2B2B2B', null],
  ['Crema de pies para hombre 100 ml', 'Hidrata talones secos y refresca.', 'crema', 4900, '#A8C8E0', null],
  ['Cepillo para uñas de madera', 'Limpia debajo de las uñas sin dañarlas.', 'lima', 2500, '#B07A4A', null]
];

// Nombre: cargarSeccionHombres
// Descripción: Agrega los servicios y productos para hombres si todavía no están.
// Entrada: La base de datos.
// Salida: Sí, si agregó algo.
// Objetivo: Tener una sección de cuidado de uñas y manos para caballeros.
export function cargarSeccionHombres(db) {
  if (db.prepare("SELECT 1 FROM ajustes WHERE clave = 'seccion_hombres'").get()) return false;
  const servicio = db.prepare('SELECT 1 FROM servicios WHERE nombre = ?');
  const producto = db.prepare('SELECT 1 FROM productos WHERE nombre = ?');
  const insServicio = db.prepare(`INSERT INTO servicios (nombre, descripcion, categoria, duracion_min, precio, precio_oferta, incluye, etiqueta, imagen, es_combo, destacado)
    VALUES (@nombre, @descripcion, 'Hombres', @duracion_min, @precio, @precio_oferta, @incluye, @etiqueta, NULL, 0, 0)`);
  const insProducto = db.prepare(`INSERT INTO productos (nombre, descripcion, categoria, marca, precio, precio_anterior, stock, color, tipo, calificacion, resenas, vendidos)
    VALUES (?, ?, 'Para hombres', 'AH Nails', ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => {
    SERVICIOS_HOMBRES.forEach((s) => { if (!servicio.get(s.nombre)) insServicio.run(s); });
    PRODUCTOS_HOMBRES.forEach(([nombre, desc, tipo, precio, color, antes], i) => {
      if (!producto.get(nombre)) insProducto.run(nombre, desc, precio, antes, 15 + i * 3, color, tipo, 4.3 + (i % 6) / 10, 4 + i * 2, 30 + i * 17);
    });
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('seccion_hombres', '1')").run();
  })();
  return true;
}
