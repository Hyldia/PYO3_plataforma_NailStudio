// Comentarios de muestra (buenos, regulares y malos) para la galería y los servicios.
// Marcados con ejemplo = 1: se borran con `npm run limpiar` antes de abrir el sitio al público.
import { CUPONES_RULETA } from '../controllers/ruletaController.js';

const NOMBRES = ['María J.', 'Ana P.', 'Valeria R.', 'Daniela C.', 'Sofía M.', 'Camila V.', 'Fernanda A.', 'Gabriela S.', 'Andrea Q.', 'Paola B.',
  'Natalia G.', 'Carolina D.', 'Mariana R.', 'Laura V.', 'Melissa J.', 'Karla S.', 'Tatiana M.', 'Priscilla A.', 'Rebeca C.', 'Jimena G.'];

const TEXTOS = {
  foto: {
    5: ['¡Me lo hice igualito y me encantó!', 'Precioso, todo el mundo me preguntó dónde me hice las uñas.', 'Lo pedí para mi boda y quedó perfecto.', 'Las fotos no le hacen justicia, en persona es más lindo.', 'Duró casi tres semanas sin levantarse.'],
    4: ['Muy lindo, solo que el color me quedó un poquito más oscuro.', 'Me gustó mucho, la próxima lo pido más corto.', 'Bonito diseño, tardaron un poco más de lo que pensé.'],
    3: ['Está bien, pero esperaba más brillo.', 'Bonito, aunque no quedó tan igual a la foto.', 'Normal, cumple, pero no es mi favorito.'],
    2: ['Se me levantó una uña a la semana.', 'El diseño quedó diferente a la foto que llevé.'],
    1: ['No me gustó cómo quedó la forma, tuve que volver a que la arreglaran.']
  },
  servicio: {
    5: ['Excelente atención, muy limpio todo.', 'La mejor manicure que me he hecho, súper detallista.', 'Puntuales y muy amables. Volveré.', 'Me explicaron todo y quedó perfecto.', 'Relajante y el resultado increíble.'],
    4: ['Muy bien, solo esperé unos 10 minutos.', 'Buen servicio, el precio es justo.', 'Me gustó, aunque el local estaba un poco lleno.'],
    3: ['Bien, pero me duró menos de lo que dijeron.', 'Regular, la atención bien pero tardaron mucho.', 'El resultado está bien, nada fuera de lo normal.'],
    2: ['Me dolió un poco la cutícula, deberían tener más cuidado.', 'Llegué a mi hora y me atendieron 30 minutos tarde.'],
    1: ['No me gustó, el esmalte se descascaró a los tres días.']
  }
};

function azar(semilla) {
  let s = semilla;
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return { r, elegir: (l) => l[Math.floor(r() * l.length)], entero: (a, b) => a + Math.floor(r() * (b - a + 1)) };
}
const fecha = (dias) => new Date(Date.now() - dias * 86400000).toISOString().slice(0, 19).replace('T', ' ');

export function cargarComentariosEjemplo(db) {
  // Cupones de la ruleta (no se muestran en la lista pública)
  const cupon = db.prepare(`INSERT OR IGNORE INTO cupones (codigo, descripcion, tipo, valor, minimo, vence, solo_combos, publico)
    VALUES (@codigo, @descripcion, @tipo, @valor, @minimo, @vence, 0, 0)`);
  const vence = `${new Date().getFullYear() + 1}-12-31`;
  CUPONES_RULETA.forEach((c) => cupon.run({ ...c, vence }));

  if (db.prepare("SELECT valor FROM ajustes WHERE clave = 'comentarios_ejemplo'").get()) return false;
  const az = azar(1115);
  const ins = db.prepare('INSERT INTO comentarios (tipo, ref_id, nombre, estrellas, comentario, ejemplo, creada_en) VALUES (?, ?, ?, ?, ?, 1, ?)');
  const estrellas = () => { const x = az.r(); return x < 0.5 ? 5 : x < 0.72 ? 4 : x < 0.86 ? 3 : x < 0.95 ? 2 : 1; };
  db.transaction(() => {
    [['foto', 'fotos', 2, 6], ['servicio', 'servicios', 4, 10]].forEach(([tipo, tabla, min, max]) => {
      db.prepare(`SELECT id FROM ${tabla}`).all().forEach(({ id }) => {
        const n = az.entero(min, max);
        for (let k = 0; k < n; k++) {
          const e = estrellas();
          ins.run(tipo, id, az.elegir(NOMBRES), e, az.elegir(TEXTOS[tipo][e]), fecha(az.entero(1, 150)));
        }
      });
    });
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('comentarios_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
