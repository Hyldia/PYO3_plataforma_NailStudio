// Mejora la descripción de las fotos de la galería: les pone en español los colores, la forma, el largo,
// la técnica (francesa, ombré, mármol…), las piedras y decoraciones (perlas, cristales, flores 3D…) y la ocasión.
// Así el diseñador de uñas encuentra muchas más fotos parecidas a lo que arma la clienta.
// Se corre solo una vez al prender el servidor; también a mano con:  npm run describir-fotos
import { getDb } from './conexion.js';
import { describirFoto } from './clasificarFoto.js';

// Nombre: enriquecerFotos
// Descripción: Agrega detalles en español a la descripción y etiquetas de cada foto.
// Entrada: La base de datos y si se debe repetir aunque ya se haya hecho.
// Salida: Cuántas fotos se mejoraron.
// Objetivo: Más opciones de fotos reales en el diseñador.
export function enriquecerFotos(db, { forzar = false } = {}) {
  if (!forzar && db.prepare("SELECT 1 FROM ajustes WHERE clave = 'fotos_descritas_v1'").get()) return 0;
  const fotos = db.prepare('SELECT id, titulo, descripcion, etiquetas, color, forma, acabado FROM fotos').all();
  const guardar = db.prepare('UPDATE fotos SET descripcion = @descripcion, etiquetas = @etiquetas WHERE id = @id');
  let n = 0;
  db.transaction(() => {
    fotos.forEach((f) => {
      const original = String(f.descripcion || '');
      const d = describirFoto(`${f.titulo} ${original} ${f.etiquetas || ''} ${f.color || ''} ${f.forma || ''} ${f.acabado || ''}`);
      // Se conserva lo que ya estaba (en inglés también sirve para buscar) y se agregan las palabras en español
      const viejas = String(f.etiquetas || '').split(',').map((x) => x.trim()).filter(Boolean);
      const etiquetas = [...new Set([...d.etiquetas, ...viejas])].slice(0, 16).join(', ');
      const enIngles = /\b(the|with|and|of|a|on|her|woman|hand)\b/i.test(original) && !/[áéíóúñ]/i.test(original);
      const descripcion = !original || enIngles ? d.descripcion : original;
      if (etiquetas !== (f.etiquetas || '') || descripcion !== original) { guardar.run({ id: f.id, descripcion, etiquetas }); n++; }
    });
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('fotos_descritas_v1', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return n;
}

if (process.argv[1]?.endsWith('enriquecerFotos.js')) {
  const n = enriquecerFotos(getDb(), { forzar: true });
  console.log(`Listo: ${n} fotos con descripción y etiquetas en español.`);
}
