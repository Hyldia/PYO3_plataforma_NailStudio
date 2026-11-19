// Muestrario de 250 esmaltes en gel del salón (código, nombre, color, familia y tipo).
// Este mismo archivo está copiado en website/src/lib/esmaltes.js: si lo cambian, cópienlo a los dos lados.
// Los colores se generan por familia, del más claro al más oscuro, y cada uno tiene su nombre.

const FAMILIAS = [
  { familia: 'Nudes', tipo: 'Cremoso', h: [18, 30], s: [28, 48], l: [86, 58], nombres: ['Porcelana', 'Leche de almendra', 'Arena fina', 'Beige suave', 'Nude rosado', 'Vainilla', 'Lino', 'Champaña', 'Piel de durazno', 'Canela clara', 'Avena', 'Galleta', 'Caramelo claro', 'Latte', 'Capuchino', 'Miel', 'Toffee', 'Nuez moscada', 'Camel', 'Bronceado', 'Arena mojada', 'Taupe', 'Mocca', 'Nude profundo', 'Moka oscuro'] },
  { familia: 'Blancos y milky', tipo: 'Cremoso', h: [20, 345], s: [10, 30], l: [97, 88], nombres: ['Blanco puro', 'Nieve', 'Milky white', 'Perla', 'Algodón', 'Marfil', 'Leche rosada', 'Nube', 'Crema', 'Coco'] },
  { familia: 'Rosas', tipo: 'Cremoso', h: [340, 355], s: [45, 80], l: [88, 45], nombres: ['Rosa algodón', 'Rosa bebé', 'Rosa ballet', 'Rosa palo', 'Pétalo', 'Flor de cerezo', 'Rosa empolvado', 'Rosa chicle', 'Malvavisco', 'Rosa fresa', 'Rosa sandía', 'Rosa barbie', 'Rosa coqueta', 'Rosa viejo', 'Rosa té', 'Rosa intenso', 'Frambuesa', 'Peonía', 'Rosa orquídea', 'Rosa magenta', 'Fucsia', 'Rosa mexicano', 'Rosa caramelo', 'Rosa granada', 'Rosa mora', 'Rosa ciruela', 'Rosa vino', 'Rosa berenjena', 'Rosa noche', 'Rosa terciopelo'] },
  { familia: 'Rojos', tipo: 'Cremoso', h: [350, 360], s: [70, 85], l: [55, 18], nombres: ['Rojo fresa', 'Rojo amapola', 'Rojo clásico', 'Rojo bombero', 'Rojo pasión', 'Rojo carmín', 'Rojo cereza', 'Rojo rubí', 'Rojo manzana', 'Rojo granate', 'Rojo cardenal', 'Rojo frambuesa', 'Rojo carmesí', 'Rojo sangría', 'Rojo merlot', 'Vino tinto', 'Borgoña', 'Burdeos', 'Cabernet', 'Rojo ciruela', 'Rojo chocolate', 'Vino oscuro', 'Granate profundo', 'Rojo noche', 'Rojo ébano'] },
  { familia: 'Corales y naranjas', tipo: 'Cremoso', h: [5, 30], s: [75, 90], l: [78, 45], nombres: ['Durazno', 'Melocotón', 'Salmón', 'Coral claro', 'Coral', 'Coral vivo', 'Papaya', 'Mango', 'Mandarina', 'Naranja', 'Calabaza', 'Atardecer', 'Toronja', 'Terracota', 'Ladrillo', 'Cobrizo', 'Óxido', 'Paprika', 'Canela', 'Naranja quemado'] },
  { familia: 'Amarillos', tipo: 'Cremoso', h: [42, 52], s: [70, 85], l: [82, 45], nombres: ['Mantequilla', 'Limonada', 'Vainilla amarilla', 'Pollito', 'Girasol', 'Limón', 'Canario', 'Mostaza clara', 'Mostaza', 'Miel dorada', 'Ocre', 'Curry'] },
  { familia: 'Verdes', tipo: 'Cremoso', h: [95, 165], s: [30, 60], l: [82, 22], nombres: ['Menta', 'Pistacho', 'Té verde', 'Salvia clara', 'Salvia', 'Eucalipto', 'Jade', 'Verde agua', 'Matcha', 'Oliva claro', 'Oliva', 'Verde manzana', 'Verde hoja', 'Albahaca', 'Pino', 'Musgo', 'Esmeralda', 'Verde bosque', 'Cazador', 'Verde botella', 'Verde militar', 'Verde selva', 'Abeto', 'Verde noche', 'Verde profundo'] },
  { familia: 'Azules', tipo: 'Cremoso', h: [195, 230], s: [45, 75], l: [85, 20], nombres: ['Cielo', 'Azul bebé', 'Celeste', 'Hielo', 'Azul polvo', 'Aguamarina', 'Azul piscina', 'Turquesa', 'Azul mar', 'Azul pervinca', 'Azul francia', 'Cobalto', 'Azul rey', 'Azul eléctrico', 'Zafiro', 'Azul jean', 'Azul acero', 'Petróleo', 'Azul tinta', 'Azul marino', 'Azul medianoche', 'Azul profundo', 'Índigo', 'Azul noche', 'Azul abismo'] },
  { familia: 'Morados y lilas', tipo: 'Cremoso', h: [255, 295], s: [35, 65], l: [86, 22], nombres: ['Lila claro', 'Lavanda', 'Malva', 'Lila', 'Violeta suave', 'Glicina', 'Orquídea', 'Amatista', 'Lila intenso', 'Uva clara', 'Morado', 'Violeta', 'Uva', 'Púrpura', 'Berenjena clara', 'Ciruela', 'Mora', 'Berenjena', 'Morado real', 'Vino morado', 'Morado oscuro', 'Grosella', 'Morado noche', 'Púrpura profundo', 'Ciruela negra'] },
  { familia: 'Cafés y otoño', tipo: 'Cremoso', h: [15, 30], s: [30, 55], l: [62, 16], nombres: ['Avellana', 'Caramelo', 'Cacao claro', 'Café con leche', 'Tierra', 'Canela oscura', 'Castaña', 'Café', 'Chocolate', 'Moca', 'Expreso', 'Nogal', 'Caoba', 'Tabaco', 'Cacao', 'Chocolate amargo', 'Café oscuro', 'Ébano'] },
  { familia: 'Grises y negros', tipo: 'Cremoso', h: [300, 330], s: [3, 8], l: [80, 8], nombres: ['Gris perla', 'Niebla', 'Gris piedra', 'Gris cemento', 'Plomo', 'Gris acero', 'Grafito', 'Pizarra', 'Carbón', 'Gris oscuro', 'Negro suave', 'Negro'] },
  { familia: 'Neón', tipo: 'Neón', h: [0, 330], s: [100, 100], l: [58, 52], hs: [330, 320, 300, 55, 75, 120, 160, 190, 210, 25, 10, 270], nombres: ['Rosa neón', 'Fucsia neón', 'Magenta neón', 'Amarillo neón', 'Lima neón', 'Verde neón', 'Menta neón', 'Turquesa neón', 'Azul neón', 'Naranja neón', 'Coral neón', 'Violeta neón'] },
  { familia: 'Glitter', tipo: 'Glitter', h: [0, 360], s: [60, 70], l: [70, 45], hs: [45, 0, 340, 330, 210, 280, 150, 20, 0, 190, 50, 300, 355, 230], nombres: ['Glitter dorado', 'Glitter plateado', 'Glitter rosa', 'Glitter fucsia', 'Glitter azul', 'Glitter lila', 'Glitter verde', 'Glitter cobre', 'Glitter holográfico', 'Glitter turquesa', 'Glitter champaña', 'Glitter morado', 'Glitter rojo', 'Glitter noche'] },
  { familia: 'Metálicos', tipo: 'Metálico', h: [0, 360], s: [40, 55], l: [65, 45], hs: [45, 0, 20, 345, 210, 160, 280, 30, 0, 50], nombres: ['Oro', 'Plata', 'Cobre', 'Oro rosa', 'Azul metálico', 'Verde metálico', 'Morado metálico', 'Bronce', 'Cromo espejo', 'Champaña metálico'] },
  { familia: 'Jelly', tipo: 'Jelly', h: [0, 360], s: [60, 70], l: [72, 62], hs: [345, 0, 25, 50, 140, 200, 270, 320, 15, 180], nombres: ['Jelly rosa', 'Jelly rojo', 'Jelly naranja', 'Jelly ámbar', 'Jelly verde', 'Jelly azul', 'Jelly lila', 'Jelly fucsia', 'Jelly nude', 'Jelly turquesa'] }
];

// Nombre: hsl
// Descripción: Convierte un color HSL a hexadecimal.
// Entrada: Tono, saturación y luz.
// Salida: El color.
// Objetivo: Crear esmaltes.
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  // Nombre: k
  // Descripción: Calcula una parte del cambio de color.
  // Entrada: Un número.
  // Salida: Un número.
  // Objetivo: Convertir colores.
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  // Nombre: f
  // Descripción: Calcula un canal de color.
  // Entrada: Un número.
  // Salida: Un valor de 0 a 255.
  // Objetivo: Convertir colores.
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

// Nombre: generar
// Descripción: Crea la lista de esmaltes.
// Entrada: Nada.
// Salida: Los esmaltes.
// Objetivo: Tener colores para elegir.
function generar() {
  const lista = [];
  FAMILIAS.forEach((f) => {
    const n = f.nombres.length;
    f.nombres.forEach((nombre, i) => {
      const t = n === 1 ? 0 : i / (n - 1);
      const h = f.hs ? f.hs[i] : ((f.h[0] + (((f.h[1] - f.h[0]) + 360) % 360) * t) % 360);
      const s = f.s[0] + (f.s[1] - f.s[0]) * t;
      const l = f.l[0] + (f.l[1] - f.l[0]) * t;
      const hex = nombre === 'Glitter plateado' || nombre === 'Plata' || nombre === 'Cromo espejo' ? '#C8CCD2'
        : nombre === 'Glitter holográfico' ? '#D9D4EE' : nombre === 'Negro' ? '#141113' : nombre === 'Blanco puro' ? '#FAF8F6' : hsl(h, s, l);
      lista.push({ codigo: `AH-${String(lista.length + 1).padStart(3, '0')}`, nombre, hex, familia: f.familia, tipo: f.tipo });
    });
  });
  return lista;
}

export const ESMALTES = generar();
export const FAMILIAS_ESMALTE = FAMILIAS.map((f) => f.familia);
// Nombre: esmalte
// Descripción: Busca un esmalte por código.
// Entrada: El código.
// Salida: El esmalte o nada.
// Objetivo: Saber el color.
export const esmalte = (codigo) => ESMALTES.find((e) => e.codigo === codigo);
// Los esmaltes especiales cuestan un poco más por uña
export const EXTRA_TIPO = { Cremoso: 0, Jelly: 200, 'Neón': 300, Glitter: 300, 'Metálico': 400 };

// ---------------------------------------------------------------------------
// Opciones del diseño y precios (los usan el diseñador y el servidor)
export const DEDOS = ['Pulgar', 'Índice', 'Medio', 'Anular', 'Meñique'];
export const OPCIONES_DISENO = {
  forma: ['Almendra', 'Cuadrada', 'Redonda', 'Stiletto', 'Coffin', 'Ovalada', 'Squoval', 'Ballerina'],
  largo: ['Corto', 'Medio', 'Largo', 'Extra largo'],
  acabado: ['Brillante', 'Mate', 'Chrome', 'Glitter', 'Ojo de gato', 'Aurora', 'Perlado'],
  decoracion: ['Ninguna', 'Francesa', 'Francesa de color', 'Baby boomer', 'Ombré', 'Mármol', 'Líneas', 'Puntos', 'Corazones', 'Flores a mano', 'Animal print', 'Foil dorado', 'Pedrería', 'Aura']
};
// Precios en colones. Largo: por el juego completo. Acabado y decoración: por dedo (en las dos manos).
export const PRECIO_DISENO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000, 'Extra largo': 6000 },
  acabado: { Brillante: 0, Mate: 200, Chrome: 600, Glitter: 400, 'Ojo de gato': 600, Aurora: 600, Perlado: 400 },
  decoracion: { Ninguna: 0, Francesa: 500, 'Francesa de color': 500, 'Baby boomer': 600, 'Ombré': 600, 'Mármol': 700, 'Líneas': 400, Puntos: 300,
    Corazones: 500, 'Flores a mano': 900, 'Animal print': 700, 'Foil dorado': 600, 'Pedrería': 800, Aura: 600 },
  colorExtra: 500
};

// Decoraciones que se pegan o se aplican encima del color (se eligen en qué uñas y en qué parte de la uña).
// Precio por uña, en las dos manos.
export const EXTRAS = {
  Perlas: { precio: 400, variantes: ['Blancas', 'Doradas', 'De colores'] },
  Cristales: { precio: 400, variantes: ['Transparentes', 'Tornasol', 'Dorados', 'De colores'] },
  Stickers: { precio: 300, variantes: ['Flores', 'Mariposas', 'Corazones', 'Estrellas', 'Letras'] },
  Polvo: { precio: 500, variantes: ['Glitter', 'Cromo espejo', 'Aurora', 'Terciopelo', 'Perlado'] },
  'Flores 3D': { precio: 900, variantes: ['Rosas', 'Margaritas', 'Florecitas'] },
  Foil: { precio: 400, variantes: ['Dorado', 'Plateado', 'Tornasol'] },
  Charms: { precio: 700, variantes: ['Moños', 'Corazones', 'Estrellas', 'Mariposas'] },
  'Líneas finas': { precio: 300, variantes: ['Doradas', 'Blancas', 'Negras'] }
};
export const POSICIONES = ['Base', 'Centro', 'Punta', 'Un lado', 'Toda la uña'];

// Nombre: limpiarExtras
// Descripción: Revisa la lista de decoraciones extra.
// Entrada: La lista que manda la clienta.
// Salida: La lista limpia (o un error si algo no existe).
// Objetivo: Guardar solo decoraciones válidas.
export function limpiarExtras(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, 12).map((x) => {
    const tipo = EXTRAS[x?.tipo];
    if (!tipo) throw new Error(`Decoración no válida: ${x?.tipo}`);
    const dedos = [...new Set((x.dedos || []).map(Number))].filter((i) => i >= 0 && i <= 4).sort();
    if (!dedos.length) throw new Error(`Elige en qué uñas van las ${String(x.tipo).toLowerCase()}.`);
    return {
      tipo: x.tipo,
      variante: tipo.variantes.includes(x.variante) ? x.variante : tipo.variantes[0],
      posicion: POSICIONES.includes(x.posicion) ? x.posicion : 'Centro',
      dedos
    };
  });
}

// Recargo del diseño uña por uña. Devuelve el total y las líneas para mostrar el desglose.
// Nombre: calcularDiseno
// Descripción: Calcula precio y tiempo de un diseño.
// Entrada: El diseño.
// Salida: Precio y minutos.
// Objetivo: Mostrar cuánto cuesta.
export function calcularDiseno(d) {
  const lineas = [];
  const largo = PRECIO_DISENO.largo[d.largo] || 0;
  if (largo) lineas.push({ concepto: `Largo ${String(d.largo).toLowerCase()} (extensión)`, monto: largo });
  (d.unas || []).forEach((u, i) => {
    const e = esmalte(u.esmalte);
    const partes = [
      [u.acabado !== 'Brillante' && u.acabado, PRECIO_DISENO.acabado[u.acabado] || 0],
      [u.decoracion !== 'Ninguna' && u.decoracion, PRECIO_DISENO.decoracion[u.decoracion] || 0],
      [e && e.tipo !== 'Cremoso' && `esmalte ${e.tipo.toLowerCase()}`, e ? EXTRA_TIPO[e.tipo] : 0]
    ].filter(([nombre, monto]) => nombre && monto);
    const monto = partes.reduce((s, [, m]) => s + m, 0) * 2;
    if (monto) lineas.push({ concepto: `${DEDOS[i]}: ${partes.map(([n]) => n.toLowerCase()).join(' + ')} (x2 manos)`, monto, dedo: i });
  });
  (d.extras || []).forEach((x) => {
    const p = EXTRAS[x.tipo];
    if (!p || !x.dedos?.length) return;
    lineas.push({ concepto: `${x.tipo} ${x.variante.toLowerCase()} en ${x.dedos.length === 5 ? 'todas las uñas' : x.dedos.map((i) => DEDOS[i].toLowerCase()).join(', ')} (x2 manos)`, monto: p.precio * x.dedos.length * 2 });
  });
  const distintos = new Set((d.unas || []).map((u) => u.esmalte)).size;
  if (distintos > 1) lineas.push({ concepto: `${distintos} colores combinados`, monto: (distintos - 1) * PRECIO_DISENO.colorExtra });
  return { total: lineas.reduce((s, l) => s + l.monto, 0), lineas };
}
