// Reseñas de muestra para la demo de la tienda (marcadas con ejemplo = 1).
// Las que salen de un pedido de ejemplo quedan como "compra verificada".
// IMPORTANTE: antes de abrir la tienda al público, bórrenlas con `npm run limpiar`:
// las reseñas que se muestran deben ser de clientas reales.

const NOMBRES = ['María', 'Ana', 'Valeria', 'Daniela', 'Sofía', 'Camila', 'Fernanda', 'Gabriela', 'Andrea', 'Paola',
  'Natalia', 'Carolina', 'Mariana', 'Laura', 'Melissa', 'Karla', 'Tatiana', 'Priscilla', 'Yesenia', 'Rebeca',
  'Jimena', 'Raquel', 'Silvia', 'Hellen', 'Katherine', 'Nicole', 'Fiorella', 'Adriana', 'Stephanie', 'Lucía'];
const INICIALES = 'ABCDGJMQRSV';

import { SQL_RESUMEN } from '../models/ResenaModel.js';

// Comentarios según el tipo de producto: [estrellas, texto]
const GENERALES = [
  [5, 'Muy buena calidad, igual a la que usan en el salón.'], [5, 'Me encantó, la recomiendo.'],
  [5, 'Lo retiré el mismo día y venía bien empacado.'], [4, 'Buen producto por el precio.'],
  [4, 'Cumple con lo que promete. Lo volvería a comprar.'], [5, 'Excelente atención cuando lo fui a retirar.'],
  [3, 'Está bien, pero esperaba un poco más.'], [5, 'Ya es la segunda vez que lo compro.']
];
const POR_TIPO = {
  'frasco-gel': [[5, 'El color es idéntico a la foto y cubre en dos capas.'], [5, 'Me duró tres semanas sin levantarse.'],
    [4, 'Bonito tono, la primera capa queda un poco rayada pero con la segunda queda perfecto.'], [5, 'Cura rápido en la lámpara de 48 W.'],
    [5, 'No se encoge y el pincel es muy cómodo.'], [2, 'El color me salió más oscuro de lo que esperaba.']],
  frasco: [[5, 'Seca rápido y tiene muy buen brillo.'], [4, 'Bonito color, aguanta unos 5 días.'], [5, 'Cubre en dos capas, buenísimo.']],
  lampara: [[5, 'Seca parejo todos los dedos, hasta el pulgar.'], [5, 'El sensor funciona muy bien y no calienta tanto.'],
    [4, 'Buena lámpara, solo que el cable es corto.'], [5, 'La uso a diario en mi estación y va perfecto.']],
  alicate: [[5, 'Corta muy preciso, sin jalar la cutícula.'], [5, 'Viene bien afilado.'], [4, 'Buen filo, la punta es un poco gruesa para mí.']],
  tijera: [[5, 'Muy precisa y cómoda.'], [4, 'Buena, la uso para los tips.']],
  lima: [[5, 'No se desgasta rápido.'], [4, 'Buen grano, ideal para dar forma.'], [5, 'Perfecta para pedicure.']],
  bloque: [[5, 'Deja la uña lisa y brillante.'], [4, 'Bueno, aunque se ensucia rápido.']],
  crema: [[5, 'Huele delicioso y no deja las manos grasosas.'], [5, 'Se absorbe rápido, mis manos quedaron suaves.'],
    [4, 'Me gusta el olor, aunque me gustaría que fuera más grande.'], [5, 'Me ayudó muchísimo con la resequedad.']],
  gotero: [[5, 'Mis cutículas cambiaron en una semana.'], [5, 'El olor es riquísimo y dura bastante.'], [4, 'Muy bueno, el gotero a veces gotea.']],
  tips: [[5, 'Se ven naturales y son fáciles de limar.'], [5, 'Me duraron más de dos semanas.'], [4, 'Bonitos, tuve que limar un poco los de los lados.']],
  kit: [[5, 'Trae todo lo necesario para empezar.'], [5, 'Lo compré de regalo y le encantó.'], [4, 'Buen kit, la lima es un poco básica.']],
  caja: [[5, 'Muy práctico para el salón.'], [4, 'Buena cantidad por el precio.']],
  tarro: [[5, 'Rinde muchísimo.'], [5, 'Las piedras brillan un montón.'], [4, 'Bonito, trae menos de lo que pensé.']],
  tubo: [[5, 'Fácil de moldear y no se escurre.'], [4, 'Buen producto, hay que tener paciencia al principio.']],
  botella: [[5, 'Retira el gel en pocos minutos.'], [4, 'Cumple, el olor es fuerte.']],
  torno: [[5, 'Potente y silencioso.'], [4, 'Muy bueno, la batería dura bastante.']],
  broca: [[5, 'Corta parejo y no calienta.'], [4, 'Buena calidad.']],
  pincel: [[5, 'Las cerdas no se abren.'], [4, 'Buenos pinceles para empezar.']],
  empujador: [[5, 'Muy cómodo de usar.'], [4, 'Cumple su función.']]
};

function crearAzar(semilla) {
  let s = semilla;
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return { r, entero: (a, b) => a + Math.floor(r() * (b - a + 1)), elegir: (l) => l[Math.floor(r() * l.length)] };
}

const corto = (nombre) => { const [n, a] = nombre.split(' '); return a ? `${n} ${a[0]}.` : n; };
const fecha = (diasAtras) => new Date(Date.now() - diasAtras * 86400000).toISOString().slice(0, 19).replace('T', ' ');

export function cargarResenasEjemplo(db) {
  if (db.prepare("SELECT valor FROM ajustes WHERE clave = 'resenas_ejemplo'").get()) return false;
  const az = crearAzar(20261114);
  const ins = db.prepare(`INSERT INTO resenas (producto_id, pedido_id, nombre, estrellas, comentario, opcion, ejemplo, creada_en)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)`);
  // Primero las estrellas (la mayoría 5 y 4, como en una tienda que vende bien) y luego un comentario que les corresponda
  const BAJAS = [[2, 'No me duró lo que esperaba.'], [2, 'El empaque llegó un poco dañado, el producto bien.'], [1, 'No era lo que buscaba.']];
  const comentario = (tipo) => {
    const x = az.r();
    const estrellas = x < 0.64 ? 5 : x < 0.88 ? 4 : x < 0.96 ? 3 : x < 0.99 ? 2 : 1;
    const opciones = [...(POR_TIPO[tipo] || []), ...GENERALES, ...BAJAS].filter(([e]) => e === estrellas);
    return opciones.length ? az.elegir(opciones) : az.elegir(BAJAS);
  };

  db.transaction(() => {
    // 1. De los pedidos de ejemplo: compras verificadas
    const items = db.prepare(`SELECT i.pedido_id, i.producto_id, i.detalle, p.cliente_nombre, p.creado_en, pr.tipo
      FROM pedido_items i JOIN pedidos p ON p.id = i.pedido_id JOIN productos pr ON pr.id = i.producto_id`).all();
    items.forEach((it) => {
      if (az.r() > 0.75) return;
      const [estrellas, texto] = comentario(it.tipo);
      ins.run(it.producto_id, it.pedido_id, corto(it.cliente_nombre), estrellas, texto, it.detalle, it.creado_en);
    });
    // 2. Más reseñas en los productos más vendidos
    const populares = db.prepare('SELECT id, tipo FROM productos ORDER BY vendidos DESC LIMIT 220').all();
    populares.forEach((p) => {
      const n = az.entero(1, 5);
      for (let k = 0; k < n; k++) {
        const [estrellas, texto] = comentario(p.tipo);
        ins.run(p.id, null, `${az.elegir(NOMBRES)} ${az.elegir(INICIALES)}.`, estrellas, texto, null, fecha(az.entero(1, 120)));
      }
    });
    db.exec(SQL_RESUMEN);
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('resenas_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
