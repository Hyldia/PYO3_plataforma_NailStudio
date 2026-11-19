// Pone fotos de Unsplash a las especialistas que no tienen foto (con crédito a la fotógrafa).
//
// Uso (dentro de la carpeta api):
//   PowerShell:  $env:UNSPLASH_KEY="tu_access_key"; npm run fotos-especialistas
//   Para cambiar también las que ya tienen foto:  npm run fotos-especialistas -- --todas
//
// Son fotos de muestra para la presentación. Para el sitio real del salón, usen fotos del
// equipo de verdad: las clientas tienen que ver a quien las va a atender.
import { getDb } from './conexion.js';
import { claveUnsplash, buscarUnsplash, urlFotoUnsplash, autorUnsplash } from './unsplash.js';

const CLAVE = claveUnsplash();
const TODAS = process.argv.includes('--todas');
const BUSQUEDAS = ['nail technician', 'manicurist', 'nail artist', 'beautician portrait'];

// Nombre: main
// Descripción: Descarga fotos de Unsplash para las especialistas.
// Entrada: Nada (usa tu clave de Unsplash).
// Salida: Nada.
// Objetivo: Que el equipo tenga foto.
async function main() {
  const db = getDb();
  const lista = db.prepare(`SELECT id, nombre FROM especialistas ${TODAS ? '' : 'WHERE foto IS NULL'} ORDER BY id`).all();
  if (!lista.length) { console.log('Todas las especialistas ya tienen foto. Usa --todas para cambiarlas.'); return; }

  const pool = [];
  for (const busqueda of BUSQUEDAS) {
    if (pool.length >= lista.length * 2) break;
    const { results = [] } = await buscarUnsplash(CLAVE, busqueda, 1);
    results.forEach((resultado) => { if (!pool.some((foto) => foto.id === resultado.id)) pool.push(resultado); });
  }
  const guardar = db.prepare('UPDATE especialistas SET foto = ?, foto_autor = ?, foto_autor_url = ? WHERE id = ?');
  lista.forEach((elemento, i) => {
    const foto = pool[i];
    if (!foto) return;
    const autor = autorUnsplash(foto);
    guardar.run(urlFotoUnsplash(foto), autor.autor, autor.autor_url, elemento.id);
  });
  console.log(`Listo: ${Math.min(lista.length, pool.length)} especialistas con foto.`);
}

main().catch((fallo) => { console.error(fallo.message); process.exit(1); });
