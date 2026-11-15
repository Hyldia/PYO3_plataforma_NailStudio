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

const buscar = (lista, texto) => (lista.find(([, re]) => re.test(texto)) || [null])[0];

export function clasificarFoto(descripcion = '', etiquetas = []) {
  const texto = `${descripcion} ${etiquetas.join(' ')}`.toLowerCase();
  const r = {
    categoria: buscar(REGLAS.categoria, texto) || 'Manicure',
    forma: buscar(REGLAS.forma, texto),
    color: buscar(REGLAS.color, texto),
    acabado: buscar(REGLAS.acabado, texto) || 'Brillante'
  };
  if (/\bfrench\b|francesa/.test(texto)) r.color = r.color || 'Nude';

  // Título en español a partir de lo detectado: "Francesa rosa almendra"
  const clave = Object.keys(TITULOS).find((k) => texto.includes(k));
  const partes = [clave ? TITULOS[clave] : r.categoria === 'Nail art' ? 'Diseño' : r.categoria];
  if (r.color && !partes[0].toLowerCase().includes(r.color.toLowerCase())) partes.push(r.color.toLowerCase());
  if (r.forma && !partes.join(' ').toLowerCase().includes(r.forma.toLowerCase())) partes.push(r.forma.toLowerCase());
  r.titulo = partes.join(' ');
  r.etiquetas = etiquetas.slice(0, 6).join(', ') || null;
  return r;
}
