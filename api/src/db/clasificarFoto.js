// Clasifica una foto de uñas a partir de su descripción en inglés o español
// (por ejemplo, la de Unsplash). Devuelve categoría, forma, color, acabado y un título en español.
// Es una aproximación: el salón puede corregir cada foto desde /admin.

const REGLAS = {
  categoria: [
    ['Pedicure', /\b(feet|foot|toe|toenail|toenails|pedicure|pies|pedicura)\b/],
    ['Acrílicas', /\b(acrylic|acr[ií]lic|extension|extensions|long nails|stiletto|coffin)\b/],
    ['Gel', /\b(gel|semipermanent|chrome|cromo|ombre|ombr[eé])\b/],
    ['Nail art', /\b(art|design|designs|pattern|patterned|flower|flowers|floral|heart|hearts|leopard|marble|marbled|ornate|stickers?|drawing|painted)\b/]
  ],
  forma: [
    ['Stiletto', /\bstiletto\b/], ['Coffin', /\b(coffin|ballerina)\b/], ['Almendra', /\b(almond|almendra)\b/],
    ['Cuadrada', /\b(square|cuadrad)/], ['Ovalada', /\b(oval|round|ovalad)/]
  ],
  color: [
    ['Nude', /\b(nude|beige|natural|neutral)\b/], ['Rosa', /\b(pink|rosa|rose|blush|mauve)\b/], ['Rojo', /\b(red|rojo|cherry)\b/],
    ['Vino', /\b(burgundy|wine|maroon|vino)\b/], ['Morado', /\b(purple|violet|lilac|lavender|morado|lila)\b/],
    ['Azul', /\b(blue|navy|azul|teal|turquoise)\b/], ['Verde', /\b(green|sage|olive|mint|verde)\b/],
    ['Negro', /\b(black|negro)\b/], ['Blanco', /\b(white|blanco|milky)\b/], ['Dorado', /\b(gold|golden|dorado)\b/],
    ['Café', /\b(brown|chocolate|caf[eé]|tortoiseshell)\b/], ['Amarillo', /\b(yellow|amarillo)\b/], ['Naranja', /\b(orange|naranja|coral)\b/]
  ],
  acabado: [
    ['Glitter', /\b(glitter|sparkl\w*|shimmer|brillantina)\b/], ['Chrome', /\b(chrome|metallic|mirror|cromo|silver)\b/],
    ['Mate', /\b(matte|mate)\b/], ['Brillante', /\b(glossy|shiny|polished|brillante)\b/]
  ]
};

const TITULOS = {
  french: 'Francesa', francesa: 'Francesa', heart: 'Corazones', flower: 'Flores', floral: 'Flores', leopard: 'Animal print', marble: 'Mármol',
  ombre: 'Degradado', glitter: 'Glitter', chrome: 'Chrome', pedicure: 'Pedicure', stiletto: 'Stiletto', almond: 'Almendra'
};

// Nombre: buscar
// Descripción: Busca la primera palabra que calza en una lista.
// Entrada: La lista y el texto.
// Salida: Lo encontrado o nada.
// Objetivo: Clasificar fotos.
const buscar = (lista, texto) => (lista.find(([, re]) => re.test(texto)) || [null])[0];

// Nombre: clasificarFoto
// Descripción: Adivina tipo, forma, color y acabado de una foto.
// Entrada: La descripción y etiquetas.
// Salida: La clasificación.
// Objetivo: Ordenar la galería sola.
export function clasificarFoto(descripcion = '', etiquetas = []) {
  const texto = `${descripcion} ${etiquetas.join(' ')}`.toLowerCase();
  const resultado = {
    categoria: buscar(REGLAS.categoria, texto) || 'Manicure',
    forma: buscar(REGLAS.forma, texto),
    color: buscar(REGLAS.color, texto),
    acabado: buscar(REGLAS.acabado, texto) || 'Brillante'
  };
  if (/\bfrench\b|francesa/.test(texto)) resultado.color = resultado.color || 'Nude';

  // Título en español a partir de lo detectado: "Francesa rosa almendra"
  const clave = Object.keys(TITULOS).find((clave) => texto.includes(clave));
  const partes = [clave ? TITULOS[clave] : resultado.categoria === 'Nail art' ? 'Diseño' : resultado.categoria];
  if (resultado.color && !partes[0].toLowerCase().includes(resultado.color.toLowerCase())) partes.push(resultado.color.toLowerCase());
  if (resultado.forma && !partes.join(' ').toLowerCase().includes(resultado.forma.toLowerCase())) partes.push(resultado.forma.toLowerCase());
  resultado.titulo = partes.join(' ');
  resultado.etiquetas = etiquetas.slice(0, 6).join(', ') || null;
  return resultado;
}

// ---------------------------------------------------------------------------
// Descripción detallada en español (para que el diseñador encuentre fotos parecidas)
const DETALLES = {
  tecnica: [
    ['francesa', /\b(french|francesa)\b/], ['baby boomer', /baby ?boomer/], ['ombré', /\b(ombre|ombré|gradient|degradad\w*)\b/], ['mármol', /\b(marble|marbled|m[aá]rmol)\b/],
    ['líneas', /\b(lines?|stripes?|striped|l[ií]neas)\b/], ['puntos', /\b(dots?|polka|puntos|lunares)\b/], ['corazones', /\b(hearts?|corazon\w*)\b/],
    ['flores', /\b(flowers?|floral|daisy|daisies|roses?|flores?)\b/], ['animal print', /\b(leopard|cheetah|zebra|animal print|cow print)\b/], ['aura', /\baura\b/],
    ['abstracto', /\b(abstract|swirls?|waves?)\b/], ['navidad', /\b(christmas|xmas|navidad|snowflakes?)\b/]
  ],
  decoracion: [
    ['perlas', /\b(pearls?|perlas?)\b/], ['pedrería', /\b(rhinestones?|crystals?|gems?|jewels?|diamonds?|bling|strass|pedrer[ií]a|cristales?)\b/],
    ['stickers', /\b(stickers?|decals?)\b/], ['glitter', /\b(glitter|sparkl\w*|shimmer|brillantina|escarcha)\b/], ['cromo', /\b(chrome|mirror|metallic|cromo)\b/],
    ['flores 3d', /\b(3d flowers?|3d|embossed)\b/], ['foil', /\b(foil|gold leaf|flakes?)\b/], ['charms', /\b(charms?|bows?|ribbons?)\b/],
    ['mariposas', /\b(butterfl\w+|mariposas?)\b/], ['estrellas', /\b(stars?|estrellas?)\b/], ['ojo de gato', /\b(cat ?eye|ojo de gato)\b/]
  ],
  largo: [['cortas', /\b(short|cortas?)\b/], ['largas', /\b(long|largas?|extra long)\b/]],
  ocasion: [['boda', /\b(wedding|bridal|boda|novia)\b/], ['verano', /\b(summer|verano|beach)\b/], ['otoño', /\b(autumn|fall|oto[nñ]o)\b/], ['fiesta', /\b(party|fiesta|new year)\b/], ['elegante', /\b(elegant|classy|minimal\w*|elegante)\b/]]
};

// Nombre: describirFoto
// Descripción: Saca todos los detalles de una foto (colores, técnica, piedras, largo, ocasión) y escribe una descripción en español.
// Entrada: El texto de la foto (título, descripción y etiquetas, en inglés o español).
// Salida: { descripcion, etiquetas } en español.
// Objetivo: Que cada foto tenga palabras claras para encontrarla por color, técnica o decoración.
export function describirFoto(texto = '') {
  const minusculas = String(texto).toLowerCase();
  const todos = (lista) => lista.filter(([, re]) => re.test(minusculas)).map(([n]) => n);
  const colores = todos(REGLAS.color).map((color) => color.toLowerCase());
  const forma = buscar(REGLAS.forma, minusculas);
  const acabado = buscar(REGLAS.acabado, minusculas);
  const tecnicas = todos(DETALLES.tecnica);
  const decoraciones = todos(DETALLES.decoracion);
  const largo = buscar(DETALLES.largo, minusculas);
  const ocasion = todos(DETALLES.ocasion);
  const pies = /\b(feet|foot|toe|toenails?|pedicure|pedicura|pies)\b/.test(minusculas);
  const partes = [`${pies ? 'Pedicure' : 'Uñas'}${forma ? ` ${forma.toLowerCase()}` : ''}${largo ? ` ${largo}` : ''}`];
  if (colores.length) partes.push(`en ${colores.slice(0, 3).join(' y ')}`);
  if (tecnicas.length) partes.push(`con ${tecnicas.join(', ')}`);
  if (decoraciones.length) partes.push(`${tecnicas.length ? 'y' : 'con'} ${decoraciones.join(', ')}`);
  if (acabado && acabado !== 'Brillante') partes.push(`acabado ${acabado.toLowerCase()}`);
  if (ocasion.length) partes.push(`ideal para ${ocasion.join(' o ')}`);
  const etiquetas = [...new Set([...colores, forma?.toLowerCase(), largo, acabado?.toLowerCase(), ...tecnicas, ...decoraciones, ...ocasion].filter(Boolean))];
  return { descripcion: `${partes.join(' ')}.`, etiquetas };
}
