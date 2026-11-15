// Ficha del producto: detalles y modo de uso según el tipo de producto.
// Se arma con lo que ya sabemos del producto (categoría, tipo, descripción).

const CONTENIDO = /(\d+(?:[.,]\d+)?\s?(?:ml|g|L|u\.|pares|W|mm))/i;

const USO = {
  'frasco-gel': ['Prepara la uña: limpia, lima y aplica deshidratante.', 'Aplica una capa fina de base y cura 60 s en lámpara UV/LED.',
    'Aplica dos capas finas de color, curando 60 s cada una.', 'Sella con top coat, cura y retira la capa pegajosa si la tiene.'],
  frasco: ['Aplica una capa de base.', 'Pinta dos capas finas dejando secar 2 minutos entre cada una.', 'Termina con top coat para más brillo y duración.'],
  tubo: ['Toma la cantidad necesaria con la espátula.', 'Moldea con el pincel humedecido en solución deslizante.', 'Cura en lámpara y lima la forma final.'],
  tarro: ['Toma una pequeña cantidad con el pincel o punzón.', 'Colócala sobre la uña con gel fresco o adhesivo.', 'Sella con top coat y cura.'],
  botella: ['Aplica sobre algodón o toallita sin pelusa.', 'Deja actuar el tiempo indicado.', 'Retira y limpia la zona. Usa en un lugar ventilado.'],
  gotero: ['Aplica una gota en cada cutícula.', 'Masajea suavemente hasta que se absorba.', 'Úsalo a diario, idealmente antes de dormir.'],
  crema: ['Aplica sobre la piel limpia.', 'Masajea hasta que se absorba por completo.', 'Repite las veces que necesites durante el día.'],
  lampara: ['Conecta la lámpara y elige el tiempo (30, 60 o 90 s).', 'Introduce la mano: el sensor la enciende solo.', 'Cura cada capa del gel por separado.'],
  torno: ['Elige la broca adecuada y ajústala bien.', 'Empieza con velocidad baja y súbela poco a poco.', 'Limpia y desinfecta las brocas después de cada uso.'],
  broca: ['Coloca la broca en el torno hasta el fondo.', 'Trabaja a velocidad baja o media, sin presionar.', 'Lava y desinfecta después de cada clienta.'],
  alicate: ['Ablanda la cutícula con removedor o agua tibia.', 'Corta solo la piel suelta, sin jalar.', 'Desinfecta la herramienta después de usarla.'],
  tijera: ['Usa sobre la uña o el tip limpio.', 'Corta en un solo movimiento.', 'Limpia y guarda en su estuche.'],
  empujador: ['Ablanda la cutícula.', 'Empuja suavemente hacia atrás con el lado plano.', 'Retira los restos con el lado de cuchareta.'],
  pincel: ['Limpia el pincel antes de usarlo.', 'Trabaja con poca cantidad de producto.', 'Limpia con cleanser y guárdalo con la tapa.'],
  lima: ['Lima siempre en una sola dirección.', 'Usa el grano grueso para dar forma y el fino para pulir.', 'Desinfecta o desecha según el material.'],
  bloque: ['Pasa suavemente sobre la superficie de la uña.', 'Usa las caras en orden, de la más gruesa a la más fina.', 'Retira el polvo con un cepillo.'],
  tips: ['Elige el tamaño correcto para cada uña.', 'Pega con gel adhesivo o pegamento y presiona 10 segundos.', 'Lima la forma y el largo que quieras.'],
  kit: ['Revisa el contenido del kit.', 'Sigue el orden: preparación, base, color y sellado.', 'Guarda todo en un lugar fresco y sin sol.'],
  caja: ['Abre y usa según lo necesites.', 'Guarda en un lugar seco.', 'Mantén fuera del alcance de los niños.']
};

export function fichaProducto(p) {
  const contenido = p.descripcion?.match(CONTENIDO)?.[1];
  const detalles = [
    ['Marca', p.marca],
    ['Categoría', p.categoria],
    contenido && ['Contenido', contenido],
    ['Color o tono', p.variante || (p.tipo?.startsWith('frasco') || p.categoria === 'Esmaltes y geles' ? p.nombre.split(' ').slice(2).join(' ') : null)],
    ['Uso', /pedicure|pies/i.test(`${p.nombre} ${p.categoria}`) ? 'Pies' : /Equipos|Manicure profesional/.test(p.categoria) ? 'Profesional (salón)' : 'Manos y uñas'],
    ['Disponibilidad', p.stock === 0 ? 'Agotado' : p.stock < 10 ? `Quedan ${p.stock}` : 'En stock'],
    ['Entrega', 'Retiro en el salón']
  ].filter((d) => d && d[1]);
  return { detalles, uso: USO[p.tipo] || USO.caja };
}

// Nombre de la opción en las variantes: tono para los colores, opción para lo demás
export const etiquetaVariante = (p) => (/Esmaltes|Bases|Acrílico|Decoración/.test(p.categoria) ? 'Tono' : /Cuidado|Pedicure/.test(p.categoria) ? 'Aroma' : 'Opción');
