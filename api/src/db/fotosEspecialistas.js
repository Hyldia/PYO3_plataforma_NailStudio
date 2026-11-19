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

async function main() {
  const db = getDb();
  const lista = db.prepare(`SELECT id, nombre FROM especialistas ${TODAS ? '' : 'WHERE foto IS NULL'} ORDER BY id`).all();
  if (!lista.length) { console.log('Todas las especialistas ya tienen foto. Usa --todas para cambiarlas.'); return; }

  const pool = [];
  for (const q of BUSQUEDAS) {
    if (pool.length >= lista.length * 2) break;
    const { results = [] } = await buscarUnsplash(CLAVE, q, 1);
    results.forEach((f) => { if (!pool.some((x) => x.id === f.id)) pool.push(f); });
  }
  const guardar = db.prepare('UPDATE especialistas SET foto = ?, foto_autor = ?, foto_autor_url = ? WHERE id = ?');
  lista.forEach((e, i) => {
    const f = pool[i];
    if (!f) return;
    const a = autorUnsplash(f);
    guardar.run(urlFotoUnsplash(f), a.autor, a.autor_url, e.id);
  });
  console.log(`Listo: ${Math.min(lista.length, pool.length)} especialistas con foto.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
