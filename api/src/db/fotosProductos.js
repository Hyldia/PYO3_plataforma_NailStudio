// Pone fotos reales de Unsplash a los productos de la tienda que no tienen foto.
//
// Uso (dentro de la carpeta api):
//   PowerShell:  $env:UNSPLASH_KEY="tu_access_key"; npm run fotos-productos
//   Para cambiar también las fotos que ya tienen:  npm run fotos-productos -- --todas
//   Para revisar fotos rotas (que Unsplash borró) y reponerlas:  npm run fotos-productos -- --revisar
//
// Busca fotos por tipo de producto (lámparas, cortacutículas, limas, cremas, frascos de esmalte...)
// y, en los esmaltes y geles, elige la foto cuyo color se parezca al del producto.
// Usa unas 30 consultas, dentro del límite de 50 por hora de Unsplash.
// Si se corta por el límite, espera una hora y vuelve a correrlo: sigue con los que faltan.
import { getDb } from './conexion.js';
import { claveUnsplash, buscarUnsplash, urlFotoUnsplash, autorUnsplash } from './unsplash.js';

const CLAVE = claveUnsplash();
const TODAS = process.argv.includes('--todas');
const REVISAR = process.argv.includes('--revisar');

// Revisa una por una las fotos guardadas: si ya no abren, se borran para ponerles otra
async function revisarRotas(db) {
  const conFoto = db.prepare("SELECT id, imagen FROM productos WHERE imagen LIKE 'http%'").all();
  const quitar = db.prepare('UPDATE productos SET imagen = NULL, imagen_autor = NULL, imagen_autor_url = NULL WHERE id = ?');
  let rotas = 0;
  for (let i = 0; i < conFoto.length; i += 10) {
    await Promise.all(conFoto.slice(i, i + 10).map(async (p) => {
      try {
        const r = await fetch(p.imagen, { method: 'HEAD' });
        if (!r.ok) { quitar.run(p.id); rotas++; }
      } catch { /* sin internet: no se toca */ }
    }));
    process.stdout.write(`\rRevisando fotos: ${Math.min(i + 10, conFoto.length)} de ${conFoto.length}…`);
  }
  console.log(`\n${rotas ? `${rotas} fotos rotas: se les buscará una nueva.` : 'Ninguna foto rota.'}`);
}

// Qué buscar en Unsplash según el nombre del producto (se aplica la primera regla que coincida)
export const GRUPOS = [
  // Primero los frascos y el acrílico, para que "Esmalte gel Dorado glitter" no caiga en decoración
  { re: /^(esmalte|rubber base|top coat|base |builder|primer|deshidratante|bonder|gel |set \d+ geles|gotas secantes|spray secante|diluyente)/i, busquedas: ['nail polish bottle', 'nail polish', 'gel polish'], paginas: 2 },
  // Pedicure antes que las herramientas, para que "Lima para pies" o "Cortaúñas para uña encarnada" busquen fotos de pies
  { re: /\btina\b|pedicure|sandalias|callos|talones|encarnada|podal|volcánica|efervescentes|de pies|para pies|pómez|raspador|separadores|calcetines|talco|sales de baño/i, busquedas: ['pedicure', 'foot spa', 'feet care'] },
  { re: /bowl|cojín|reposamanos|toalla de mesa|organizador de esmaltes|muestrario|estuche|esterilización|alcohol|desinfectante|tarros de vidrio|paleta|bandeja|delantal|lentes|aro de luz|secador/i, busquedas: ['nail salon', 'manicure table'] },
  { re: /placa|sello|estampado|plantillas|esponjas/i, busquedas: ['nail art', 'nail stamping'] },
  { re: /polygel|acrílico|acrílicos|monómero|dappen|moldes|deslizante/i, busquedas: ['acrylic nails', 'nail technician'] },
  { re: /lámpara/i, busquedas: ['uv nail lamp', 'led nail lamp'] },
  { re: /torno|broca|lijas para torno|mandril/i, busquedas: ['nail drill'] },
  { re: /extractor|calentador|esterilizador|lupa/i, busquedas: ['nail salon equipment'] },
  { re: /cortacutícula|alicate|cortaúñas|cortador|tijera|pinza/i, busquedas: ['cuticle nipper', 'nail clipper'] },
  { re: /empujador|cuchareta|palitos/i, busquedas: ['cuticle pusher', 'manicure tools'] },
  { re: /pincel|punzones|espátula|cepillo para polvo|cepillo para limpiar/i, busquedas: ['nail art brushes'] },
  { re: /lima|bloque|buffer/i, busquedas: ['nail file'] },
  { re: /removedor de gel|acetona|sin acetona|limpiador|dispensador/i, busquedas: ['nail polish remover', 'acetone'] },
  { re: /algodón en|toallitas|toallas desechables/i, busquedas: ['cotton pads'] },
  { re: /guantes de nitrilo|mascarillas desechables/i, busquedas: ['nitrile gloves'] },
  { re: /clips|aluminio/i, busquedas: ['manicure tools'] },
  { re: /aceite|sérum|bolígrafo/i, busquedas: ['cuticle oil', 'serum dropper bottle'] },
  { re: /pies|pómez|raspador|separadores|calcetines|talco|sales de baño|cepillo para uñas/i, busquedas: ['foot care spa', 'pedicure'] },
  { re: /crema|loción|bálsamo|exfoliante|parafina|antibacterial|mascarilla de manos|guantes de algodón|endurecedor|tratamiento|removedor de cutícula|protector|mantequilla|guantes de gel/i, busquedas: ['hand cream', 'hand care'] },
  { re: /tips|press-on|pegamento|cinta adhesiva/i, busquedas: ['press on nails', 'fake nails'] },
  { re: /balines|pedrería|perlas|glitter|cromo|perla|stickers|foil|flores secas|cinta de rayas|ojo de gato|charms|cadena|piedras|escamas|polvo terciopelo|polvo neón|polvo efecto/i, busquedas: ['nail rhinestones', 'glitter'] },
  { re: /^kit/i, busquedas: ['manicure kit', 'manicure set'] },
  // Todo lo que no entró en ninguna regla de arriba recibe una foto general de manicure (antes se quedaba sin foto)
  { re: /./, busquedas: ['manicure products', 'nail care products', 'nail salon products'], paginas: 2 }
];

// Palabras en inglés para elegir el frasco del color correcto
const COLORES = [
  [/nude|arena|canela|beige|transparente|camuflaje/i, ['nude', 'beige', 'neutral', 'clear', 'transparent']],
  [/rosa|fucsia|chicle|bebé|palo/i, ['pink', 'rose', 'magenta', 'fuchsia']],
  [/rojo|cereza/i, ['red', 'cherry', 'scarlet']],
  [/vino|borgoña|ciruela/i, ['burgundy', 'wine', 'maroon', 'plum']],
  [/lila|lavanda|morado|aurora/i, ['purple', 'lilac', 'lavender', 'violet']],
  [/azul|celeste|cielo|marino|rey/i, ['blue', 'navy']],
  [/turquesa|menta/i, ['teal', 'turquoise', 'mint']],
  [/verde|salvia|oliva|esmeralda/i, ['green', 'olive', 'emerald']],
  [/amarillo|mostaza/i, ['yellow', 'mustard']],
  [/naranja|coral|durazno|terracota/i, ['orange', 'coral', 'peach']],
  [/café|chocolate|moca|caramelo/i, ['brown', 'chocolate', 'caramel']],
  [/negro/i, ['black']],
  [/blanco|lechoso/i, ['white', 'milky']],
  [/gris|perla/i, ['grey', 'gray', 'silver']],
  [/dorado/i, ['gold', 'golden']],
  [/plateado|chrome|cromo/i, ['silver', 'chrome', 'metallic']]
];

const descripcion = (f) => `${f.alt_description || ''} ${f.description || ''}`.toLowerCase();

function puntajeColor(nombre, foto) {
  const texto = descripcion(foto);
  const regla = COLORES.find(([re]) => re.test(nombre));
  if (!regla) return 0;
  return regla[1].some((w) => texto.includes(w)) ? 2 : 0;
}

async function main() {
  const db = getDb();
  if (REVISAR) await revisarRotas(db);
  const productos = db.prepare(`SELECT id, nombre FROM productos ${TODAS ? '' : 'WHERE imagen IS NULL'} ORDER BY id`).all();
  if (!productos.length) { console.log('Todos los productos ya tienen foto. Usa --todas para cambiarlas.'); return; }

  // Fotos ya usadas en la tienda, para no repetir la misma en varios productos
  const usadas = new Set(db.prepare("SELECT imagen FROM productos WHERE imagen LIKE 'http%'").all().map((p) => p.imagen.split('?')[0]));
  const guardar = db.prepare('UPDATE productos SET imagen = ?, imagen_autor = ?, imagen_autor_url = ? WHERE id = ?');

  let asignados = 0;
  let consultas = 0;
  try {
    for (const grupo of GRUPOS) {
      const lista = productos.filter((p) => !p.hecho && grupo.re.test(p.nombre));
      if (!lista.length) continue;

      const pool = [];
      for (const q of grupo.busquedas) {
        for (let page = 1; page <= (grupo.paginas || 1); page++) {
          const { results } = await buscarUnsplash(CLAVE, q, page);
          consultas++;
          results.forEach((f) => { if (!pool.some((x) => x.id === f.id)) pool.push(f); });
        }
      }
      if (!pool.length) continue;

      for (const p of lista) {
        // Prefiere una foto no usada y, si es esmalte, del color del producto
        const candidatas = pool
          .map((f) => ({ f, puntos: puntajeColor(p.nombre, f) + (usadas.has(urlFotoUnsplash(f).split('?')[0]) ? -5 : 0) }))
          .sort((a, b) => b.puntos - a.puntos);
        const elegida = candidatas[0].f;
        const url = urlFotoUnsplash(elegida);
        const a = autorUnsplash(elegida);
        guardar.run(url, a.autor, a.autor_url, p.id);
        usadas.add(url.split('?')[0]);
        p.hecho = true;
        asignados++;
      }
      process.stdout.write(`\r${asignados} de ${productos.length} productos con foto (${consultas} consultas)…`);
    }
  } finally {
    console.log(`\nListo: ${asignados} productos con foto nueva.`);
    const sin = db.prepare('SELECT COUNT(*) AS n FROM productos WHERE imagen IS NULL').get().n;
    if (sin) console.log(`Quedan ${sin} sin foto: muestran una ilustración. Puedes subirles foto desde /admin → Productos.`);
  }
}

if (process.argv[1]?.endsWith('fotosProductos.js')) main().catch((e) => { console.error(`\n${e.message}`); process.exit(1); });
