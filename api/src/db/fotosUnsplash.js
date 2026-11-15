// Trae fotos gratuitas de uñas desde Unsplash y las agrega a la galería con su crédito.
//
// Uso (dentro de la carpeta api):
//   1. Crea una cuenta gratis en https://unsplash.com/developers → "New Application" → copia el "Access Key".
//   2. Windows PowerShell:  $env:UNSPLASH_KEY="tu_access_key"; npm run fotos -- 200
//      Mac o Linux:         UNSPLASH_KEY=tu_access_key npm run fotos -- 200
//
// El número es cuántas fotos nuevas quieres (por defecto 200). Las fotos se enlazan desde Unsplash
// (así lo piden sus reglas) y cada una guarda el nombre de su fotógrafa para mostrar el crédito.
// No repite fotos que ya estén en la galería. La clasificación es automática: revísenla en /admin.
//
// Unsplash permite 50 consultas por hora. Si se corta, espera una hora y vuelve a correrlo:
// el comando guarda en qué búsqueda y página iba y sigue desde ahí (no gasta consultas repitiendo).
import { getDb } from './connection.js';
import { clasificarFoto } from './clasificarFoto.js';
import { claveUnsplash, buscarUnsplash, urlFotoUnsplash, autorUnsplash } from './unsplash.js';

const CLAVE = claveUnsplash();
const META = Number(process.argv[2]) || 200;
const BUSQUEDAS = ['nail art', 'manicure', 'nails', 'gel nails', 'french manicure', 'acrylic nails', 'nail design',
  'pink nails', 'red nails', 'almond nails', 'pedicure', 'nail polish hand',
  // Búsquedas agregadas para tener más variedad
  'toenails', 'pedicure feet', 'painted toenails', 'nail salon manicure', 'gel manicure', 'chrome nails', 'glitter nails',
  'nude nails', 'french tips', 'coffin nails', 'stiletto nails', 'short nails', 'long nails', 'black nails', 'white nails',
  'blue nails', 'green nails', 'purple nails', 'ombre nails', 'marble nails', 'flower nail art', 'heart nail art',
  'christmas nails', 'summer nails', 'autumn nails', 'press on nails', 'wedding nails', 'manicured hands'];
const PAGINAS = 6;
const buscar = (query, page) => buscarUnsplash(CLAVE, query, page);

// Descarta fotos que no muestran uñas (frascos solos, sillas, paisajes...)
const esDeUnas = (t) => /\b(nail|nails|manicure|manicured|pedicure|toenail|fingernail|polish)\b/.test(t) && /\b(hand|hands|finger|fingers|nail|nails|feet|toe|toes|woman|person)\b/.test(t)
  && !/\b(bottles?|chair|salon interior|hammer|screw|wood)\b/.test(t);

async function main() {
  const db = getDb();
  const existe = db.prepare('SELECT 1 FROM fotos WHERE archivo LIKE ?');
  const insertar = db.prepare(`
    INSERT INTO fotos (archivo, titulo, descripcion, categoria, forma, color, acabado, etiquetas, autor, autor_url)
    VALUES (@archivo, @titulo, @descripcion, @categoria, @forma, @color, @acabado, @etiquetas, @autor, @autor_url)`);

  // Dónde quedó la última vez
  const leer = db.prepare("SELECT valor FROM ajustes WHERE clave = 'progreso_fotos'");
  const guardar = db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('progreso_fotos', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor");
  const guardado = leer.get()?.valor;
  let { b: inicioB = 0, p: inicioP = 1 } = JSON.parse(guardado || '{}');
  // Quien ya corrió la versión anterior (sin progreso guardado) ya recorrió las primeras búsquedas
  const deUnsplash = db.prepare("SELECT COUNT(*) AS n FROM fotos WHERE autor_url LIKE '%unsplash%'").get().n;
  if (!guardado && deUnsplash >= 120) inicioB = 5;
  if (inicioB >= BUSQUEDAS.length) { inicioB = 0; inicioP = 1; }
  if (inicioB > 0 || inicioP > 1) console.log(`Siguiendo desde «${BUSQUEDAS[inicioB]}», página ${inicioP}.`);

  let agregadas = 0;
  for (let b = inicioB; b < BUSQUEDAS.length && agregadas < META; b++) {
    const query = BUSQUEDAS[b];
    for (let page = b === inicioB ? inicioP : 1; page <= PAGINAS && agregadas < META; page++) {
      const { results = [], total_pages: paginas = 0 } = await buscar(query, page);
      guardar.run(JSON.stringify(page >= Math.min(PAGINAS, paginas) ? { b: b + 1, p: 1 } : { b, p: page + 1 }));
      for (const f of results) {
        if (agregadas >= META) break;
        const descripcion = f.alt_description || f.description || '';
        const etiquetas = (f.tags || []).map((t) => t.title).filter(Boolean);
        if (!esDeUnas(`${descripcion} ${etiquetas.join(' ')}`.toLowerCase())) continue;
        const archivo = urlFotoUnsplash(f);
        if (existe.get(`${archivo.split('?')[0]}%`)) continue;

        const c = clasificarFoto(descripcion, etiquetas);
        insertar.run({
          archivo,
          titulo: c.titulo, descripcion: descripcion || c.titulo, categoria: c.categoria,
          forma: c.forma, color: c.color, acabado: c.acabado, etiquetas: c.etiquetas,
          ...autorUnsplash(f)
        });
        agregadas++;
      }
      process.stdout.write(`\r${agregadas} fotos agregadas…`);
      if (page >= paginas) break;
    }
  }
  const total = db.prepare('SELECT COUNT(*) AS n FROM fotos').get().n;
  console.log(`\nListo: ${agregadas} fotos nuevas. La galería tiene ${total} fotos.`);
  if (Number(JSON.parse(leer.get()?.valor || '{}').b) >= BUSQUEDAS.length) {
    guardar.run('{}');
    console.log('Se recorrieron todas las búsquedas. La próxima vez empieza de nuevo (las repetidas se saltan).');
  }
}

main().catch((e) => { console.error(`\n${e.message}`); process.exit(1); });
