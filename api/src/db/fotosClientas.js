// Pone fotos de Unsplash a las clientas DE EJEMPLO (las que trae la demo), para que el portal del equipo
// se vea con fotos reales. Las clientas de verdad usan la foto de su cuenta (por ejemplo, la de Google).
//
// Uso (dentro de la carpeta api):
//   PowerShell:  $env:UNSPLASH_KEY="tu_access_key"; npm run fotos-clientas
//
// Se borran con `npm run limpiar` junto con las citas de ejemplo.
import { getDb } from './conexion.js';
import { claveUnsplash, buscarUnsplash, urlFotoUnsplash, autorUnsplash } from './unsplash.js';

const CLAVE = claveUnsplash();
const BUSQUEDAS = ['woman portrait smiling', 'latina woman portrait', 'young woman headshot', 'woman face natural light', 'happy woman portrait'];

async function main() {
  const db = getDb();
  const clientas = db.prepare(`SELECT DISTINCT c.cliente_telefono AS telefono FROM citas c
    LEFT JOIN fotos_clientas f ON f.telefono = c.cliente_telefono WHERE c.ejemplo = 1 AND f.telefono IS NULL`).all();
  if (!clientas.length) { console.log('Todas las clientas de ejemplo ya tienen foto.'); return; }

  // Juntamos varias páginas de retratos (cada búsqueda trae hasta 30)
  const pool = [];
  for (const q of BUSQUEDAS) {
    for (let pagina = 1; pagina <= 3 && pool.length < clientas.length; pagina++) {
      const { results = [] } = await buscarUnsplash(CLAVE, q, pagina);
      results.filter((f) => f.height >= f.width * 0.9).forEach((f) => { if (!pool.some((x) => x.id === f.id)) pool.push(f); });
    }
    if (pool.length >= clientas.length) break;
  }
  if (!pool.length) { console.log('Unsplash no devolvió fotos. Intenta más tarde.'); return; }

  // Si hay más clientas que fotos, algunas fotos se repiten (son clientas de ejemplo)
  const guardar = db.prepare('INSERT OR REPLACE INTO fotos_clientas (telefono, foto, autor, autor_url) VALUES (?, ?, ?, ?)');
  db.transaction(() => clientas.forEach((c, i) => {
    const f = pool[i % pool.length];
    const a = autorUnsplash(f);
    guardar.run(c.telefono, urlFotoUnsplash(f).replace('w=1000', 'w=240'), a.autor, a.autor_url);
  }))();
  console.log(`Listo: ${clientas.length} clientas de ejemplo con foto (${pool.length} fotos distintas).`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
