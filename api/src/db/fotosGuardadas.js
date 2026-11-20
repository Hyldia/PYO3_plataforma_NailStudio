// FOTOS GUARDADAS: lleva al sitio publicado (Railway) todas las fotos que hay en la computadora.
// Hay dos tipos de fotos:
//   - Las de Unsplash: la base de datos solo guarda su dirección (https://images.unsplash.com/...).
//   - Las subidas desde el panel: son archivos en la carpeta uploads (por ejemplo 0a4e7941-....jpg).
// La base de datos y la carpeta uploads no se suben a GitHub, así que este archivo:
//   - En la computadora (npm run exportar-fotos): guarda las direcciones en fotosGuardadas.json
//     y copia los archivos subidos a la carpeta api/fotos-subidas (las dos cosas sí se suben a GitHub).
//   - En Railway (al prender el servidor): carga las fotos que falten y copia los archivos a su carpeta uploads.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, UPLOADS_DIR } from './conexion.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARCHIVO = join(AQUI, 'fotosGuardadas.json');
const CARPETA_SUBIDAS = join(AQUI, '..', '..', 'fotos-subidas'); // api/fotos-subidas
// Columnas de la galería que no se copian: el número cambia en cada base de datos y las vistas son de cada sitio
const SIN_COPIAR = new Set(['id', 'vistas', 'creado_en']);
// Ajustes que guardan fotos o la forma de los círculos elegidas en el panel
const AJUSTES_CON_FOTO = "clave LIKE 'portada:%' OR clave IN ('asistente_foto', 'circulos_ocultos', 'circulos_inicio_extra')";

// Nombre: columnasDe
// Descripción: Lee los nombres de las columnas de una tabla.
// Entrada: La base de datos y el nombre de la tabla.
// Salida: La lista de columnas.
// Objetivo: Copiar solo las columnas que existen en las dos bases de datos.
const columnasDe = (db, tabla) => db.prepare(`PRAGMA table_info(${tabla})`).all().map((columna) => columna.name);

// Nombre: esArchivoSubido
// Descripción: Dice si un valor es el nombre de una foto subida desde el panel (no una dirección de internet).
// Entrada: El valor guardado en la base de datos.
// Salida: Sí o no.
// Objetivo: Saber qué archivos hay que copiar.
const esArchivoSubido = (valor) => typeof valor === 'string' && /^[\w-]+\.(jpe?g|png|webp)$/i.test(valor);

// Nombre: exportarFotos
// Descripción: Guarda las fotos de la galería, productos, servicios, equipo, clientas y círculos, y copia los archivos subidos.
// Entrada: La base de datos.
// Salida: Cuántas fotos se guardaron de cada tipo.
// Objetivo: Que el sitio publicado tenga las mismas fotos que la computadora.
export function exportarFotos(db = getDb()) {
  const columnasGaleria = columnasDe(db, 'fotos').filter((columna) => !SIN_COPIAR.has(columna));
  const datos = {
    version: new Date().toISOString(), // cambia en cada exportación, así Railway sabe que hay fotos nuevas
    galeria: db.prepare(`SELECT ${columnasGaleria.join(', ')} FROM fotos ORDER BY id`).all(),
    productos: db.prepare("SELECT nombre, imagen, imagen_autor, imagen_autor_url FROM productos WHERE imagen IS NOT NULL AND imagen != ''").all(),
    servicios: db.prepare("SELECT nombre, imagen FROM servicios WHERE imagen IS NOT NULL AND imagen != ''").all(),
    especialistas: db.prepare("SELECT nombre, foto FROM especialistas WHERE foto IS NOT NULL AND foto != ''").all(),
    clientas: db.prepare('SELECT telefono, foto, autor, autor_url FROM fotos_clientas').all(),
    ajustes: db.prepare(`SELECT clave, valor FROM ajustes WHERE ${AJUSTES_CON_FOTO}`).all()
  };
  writeFileSync(ARCHIVO, JSON.stringify(datos));

  // Copia a api/fotos-subidas cada archivo que la base de datos usa (los que no se usan se quedan afuera)
  const usados = [
    ...datos.galeria.map((foto) => foto.archivo), ...datos.productos.map((producto) => producto.imagen),
    ...datos.servicios.map((servicio) => servicio.imagen), ...datos.especialistas.map((especialista) => especialista.foto),
    ...datos.ajustes.map((ajuste) => ajuste.valor)
  ].filter(esArchivoSubido);
  mkdirSync(CARPETA_SUBIDAS, { recursive: true });
  let copiados = 0;
  for (const nombre of new Set(usados)) {
    const origen = join(UPLOADS_DIR, basename(nombre));
    if (existsSync(origen)) { copyFileSync(origen, join(CARPETA_SUBIDAS, basename(nombre))); copiados++; }
  }
  return { galeria: datos.galeria.length, productos: datos.productos.length, servicios: datos.servicios.length,
    especialistas: datos.especialistas.length, clientas: datos.clientas.length, archivos: copiados };
}

// Nombre: importarFotos
// Descripción: Carga las fotos de fotosGuardadas.json en la base de datos (sin repetir) y copia los archivos a uploads.
// Entrada: La base de datos.
// Salida: true si cargó algo nuevo.
// Objetivo: Que al publicar el sitio salgan las fotos reales y no los dibujos.
export function importarFotos(db = getDb()) {
  if (!existsSync(ARCHIVO)) return false;
  const datos = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
  const yaCargada = db.prepare("SELECT valor FROM ajustes WHERE clave = 'fotos_guardadas'").get()?.valor;
  if (yaCargada === datos.version) return false;

  // Primero los archivos: se copian a la carpeta uploads del servidor los que todavía no están
  if (existsSync(CARPETA_SUBIDAS)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
    const nombres = [
      ...(datos.galeria || []).map((foto) => foto.archivo), ...(datos.productos || []).map((producto) => producto.imagen),
      ...(datos.servicios || []).map((servicio) => servicio.imagen), ...(datos.especialistas || []).map((especialista) => especialista.foto),
      ...(datos.ajustes || []).map((ajuste) => ajuste.valor)
    ].filter(esArchivoSubido);
    for (const nombre of new Set(nombres)) {
      const origen = join(CARPETA_SUBIDAS, basename(nombre));
      const destino = join(UPLOADS_DIR, basename(nombre));
      if (existsSync(origen) && !existsSync(destino)) copyFileSync(origen, destino);
    }
  }

  db.transaction(() => {
    // Galería: solo las columnas que existen aquí, y sin repetir una foto que ya está (mismo archivo o dirección)
    const columnasAqui = new Set(columnasDe(db, 'fotos'));
    const existe = db.prepare('SELECT 1 FROM fotos WHERE archivo = ?');
    for (const foto of datos.galeria || []) {
      if (existe.get(foto.archivo)) continue;
      const columnas = Object.keys(foto).filter((columna) => columnasAqui.has(columna));
      db.prepare(`INSERT INTO fotos (${columnas.join(', ')}) VALUES (${columnas.map((columna) => `@${columna}`).join(', ')})`)
        .run(Object.fromEntries(columnas.map((columna) => [columna, foto[columna]])));
    }
    // Productos, servicios y equipo se buscan por nombre.
    // No se tocan los que ya tienen una foto subida en el sitio publicado (para no borrar lo que se cambió allá).
    const sinFotoPropia = (columna) => `(${columna} IS NULL OR ${columna} = '' OR ${columna} LIKE 'http%')`;
    const fotoProducto = db.prepare(`UPDATE productos SET imagen = @imagen, imagen_autor = @imagen_autor, imagen_autor_url = @imagen_autor_url
      WHERE nombre = @nombre AND ${sinFotoPropia('imagen')}`);
    (datos.productos || []).forEach((producto) => fotoProducto.run(producto));
    const fotoServicio = db.prepare(`UPDATE servicios SET imagen = @imagen WHERE nombre = @nombre AND ${sinFotoPropia('imagen')}`);
    (datos.servicios || []).forEach((servicio) => fotoServicio.run(servicio));
    const fotoEspecialista = db.prepare(`UPDATE especialistas SET foto = @foto WHERE nombre = @nombre AND ${sinFotoPropia('foto')}`);
    (datos.especialistas || []).forEach((especialista) => fotoEspecialista.run(especialista));
    const fotoClienta = db.prepare(`INSERT INTO fotos_clientas (telefono, foto, autor, autor_url) VALUES (@telefono, @foto, @autor, @autor_url)
      ON CONFLICT(telefono) DO NOTHING`);
    (datos.clientas || []).forEach((clienta) => fotoClienta.run(clienta));
    // Fotos de los círculos y del asistente: solo si en el sitio publicado no se eligió otra
    const ajuste = db.prepare('INSERT INTO ajustes (clave, valor) VALUES (@clave, @valor) ON CONFLICT(clave) DO NOTHING');
    (datos.ajustes || []).forEach((fila) => ajuste.run(fila));
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('fotos_guardadas', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(datos.version);
  })();
  return true;
}

// Comando: npm run exportar-fotos
if (process.argv[1]?.endsWith('fotosGuardadas.js')) {
  const cantidades = exportarFotos();
  console.log(`Listo: ${cantidades.galeria} fotos de la galería, ${cantidades.productos} de productos, ${cantidades.servicios} de servicios, `
    + `${cantidades.especialistas} del equipo y ${cantidades.clientas} de clientas. Se copiaron ${cantidades.archivos} archivos a api/fotos-subidas.`);
  console.log('Ahora súbelo a GitHub (git add -A, git commit, git push) y Railway las carga solas.');
}
