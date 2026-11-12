// Datos iniciales del salón. Cámbialos por los servicios y precios reales.
// Las fotos de la galería y de los productos se suben desde /admin.
import { getDb } from './connection.js';
import { pathToFileURL } from 'node:url';

export function seed({ force = false } = {}) {
  const db = getDb();
  const yaHayDatos = db.prepare('SELECT COUNT(*) AS n FROM servicios').get().n > 0;
  if (yaHayDatos && !force) return false;

  db.exec(`
    DELETE FROM pedido_items; DELETE FROM pedidos; DELETE FROM recordatorios;
    DELETE FROM citas; DELETE FROM disenos; DELETE FROM productos;
    DELETE FROM especialistas; DELETE FROM servicios;
  `);

  const servicio = db.prepare('INSERT INTO servicios (nombre, descripcion, categoria, duracion_min, precio) VALUES (?, ?, ?, ?, ?)');
  [
    ['Manicure tradicional', 'Limado, cutícula, hidratación y esmalte tradicional.', 'Manos', 45, 12000],
    ['Manicure semipermanente', 'Esmaltado en gel que dura hasta tres semanas.', 'Manos', 60, 16000],
    ['Uñas acrílicas', 'Extensión con acrílico, forma y largo a elección.', 'Extensiones', 120, 28000],
    ['Polygel', 'Extensión ligera y resistente con acabado natural.', 'Extensiones', 100, 25000],
    ['Retiro de producto', 'Retiro seguro de gel o acrílico sin dañar la uña.', 'Manos', 30, 6000],
    ['Pedicure spa', 'Exfoliación, masaje, cutícula y esmaltado.', 'Pies', 75, 18000]
  ].forEach((s) => servicio.run(...s));

  const esp = db.prepare('INSERT INTO especialistas (nombre, especialidad) VALUES (?, ?)');
  [['Camila', 'Nail art y diseños a mano'], ['Daniela', 'Acrílico y polygel'], ['Sofía', 'Pedicure y cuidado']].forEach((e) => esp.run(...e));

  const prod = db.prepare('INSERT INTO productos (nombre, descripcion, categoria, marca, precio, stock) VALUES (?, ?, ?, ?, ?, ?)');
  [
    ['Aceite de cutícula', 'Almendra y vitamina E, 15 ml.', 'Cuidado', '[MARCA]', 5500, 40],
    ['Crema de manos reparadora', 'Karité y urea, 75 ml.', 'Cuidado', '[MARCA]', 6500, 30],
    ['Esmalte gel, tono nude', 'Larga duración, 10 ml. Requiere lámpara.', 'Esmaltes', '[MARCA]', 7000, 25],
    ['Esmalte gel, tono rojo', 'Larga duración, 10 ml. Requiere lámpara.', 'Esmaltes', '[MARCA]', 7000, 25],
    ['Lima de cristal', 'Lima duradera que no abre la uña.', 'Herramientas', '[MARCA]', 4000, 50],
    ['Kit press-on personalizado', 'Set de 24 uñas hechas con el diseño que elijas.', 'Kits', 'Nailé', 15000, 10]
  ].forEach((p) => prod.run(...p));

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed({ force: true });
  console.log('Base de datos lista con datos iniciales.');
}
