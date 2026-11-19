// Importa a la galería todas las fotos de una carpeta (por ejemplo, las del celular del salón).
//
// Uso (dentro de la carpeta api):
//   npm run importar -- "C:\Users\arias\Pictures\unas"
//
// El nombre del archivo se usa como título y para clasificar: nómbrenlas con palabras como
// "francesa rosa almendra.jpg" o "pedicure rojo.jpg" y los filtros se llenan solos.
// No repite archivos que ya se importaron. Después se pueden corregir desde /admin.
import { readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDb, UPLOADS_DIR } from './conexion.js';
import { clasificarFoto } from './clasificarFoto.js';

const carpeta = process.argv[2];
if (!carpeta) { console.error('Indica la carpeta: npm run importar -- "ruta/de/la/carpeta"'); process.exit(1); }

const EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const db = getDb();
const yaImportada = db.prepare('SELECT 1 FROM fotos WHERE etiquetas LIKE ?');
const insertar = db.prepare(`
  INSERT INTO fotos (archivo, titulo, descripcion, categoria, forma, color, acabado, etiquetas)
  VALUES (@archivo, @titulo, @descripcion, @categoria, @forma, @color, @acabado, @etiquetas)`);

let cantidad = 0;
for (const nombre of readdirSync(carpeta)) {
  const ruta = join(carpeta, nombre);
  const ext = extname(nombre).toLowerCase();
  if (!EXT.includes(ext) || !statSync(ruta).isFile()) continue;
  const marca = `archivo:${nombre}`;
  if (yaImportada.get(`%${marca}%`)) continue;

  const texto = basename(nombre, ext).replace(/[_-]+/g, ' ');
  const clasificacion = clasificarFoto(texto);
  const destino = `${randomUUID()}${ext === '.jpeg' ? '.jpg' : ext}`;
  copyFileSync(ruta, join(UPLOADS_DIR, destino));
  const titulo = texto.charAt(0).toUpperCase() + texto.slice(1);
  insertar.run({ archivo: destino, titulo, descripcion: titulo, categoria: clasificacion.categoria, forma: clasificacion.forma, color: clasificacion.color, acabado: clasificacion.acabado, etiquetas: `${texto}, ${marca}` });
  cantidad++;
}
console.log(`Listo: ${cantidad} fotos importadas desde ${carpeta}.`);
