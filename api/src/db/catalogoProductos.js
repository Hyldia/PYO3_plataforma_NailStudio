// Catálogo de la tienda: unos 470 productos de manicure profesional y cuidado de manos y pies.
// Precios en colones, de referencia. Las marcas son de la línea propia del salón (cámbienlas por las reales).
// `tipo` decide la ilustración que se dibuja cuando el producto no tiene foto.

const GELES = [
  ['Nude rosado', '#E7B9A9'], ['Nude arena', '#D9B79A'], ['Nude canela', '#C49A7C'], ['Beige', '#E5CDB4'], ['Rosa palo', '#E8B4BC'],
  ['Rosa bebé', '#F5C6D6'], ['Rosa chicle', '#F28DB2'], ['Fucsia', '#D6246E'], ['Coral', '#F07B6B'], ['Durazno', '#F5B396'],
  ['Rojo clásico', '#B3122E'], ['Rojo cereza', '#9E0F2E'], ['Vino', '#6B1630'], ['Borgoña', '#5A1424'], ['Ciruela', '#5B2340'],
  ['Lila', '#BBA5DA'], ['Lavanda', '#C9B8E8'], ['Morado', '#6E3A8E'], ['Celeste', '#A3C9E8'], ['Azul cielo', '#6FA8DC'],
  ['Azul rey', '#1F4FA8'], ['Azul marino', '#1E2A4A'], ['Turquesa', '#2EB5B0'], ['Menta', '#A8E0C8'], ['Verde salvia', '#A9B79C'],
  ['Verde oliva', '#6B7040'], ['Verde esmeralda', '#0F6B4F'], ['Amarillo pastel', '#F6E7A1'], ['Amarillo mostaza', '#D4A21C'], ['Naranja', '#F07A28'],
  ['Terracota', '#B5573A'], ['Café chocolate', '#5A3423'], ['Café moca', '#8A5A44'], ['Caramelo', '#B87333'], ['Gris perla', '#C9C5C3'],
  ['Gris humo', '#7B7577'], ['Negro', '#1E1A1C'], ['Blanco puro', '#F7F5F2'], ['Blanco lechoso', '#F2ECE6'], ['Dorado glitter', '#D4AF37'],
  ['Plateado glitter', '#C0C4C8'], ['Rosa glitter', '#E9A3BC']
];

const RUBBER = [['Transparente', '#F4EEEC'], ['Nude', '#E3BFA8'], ['Rosa lechoso', '#F2C8CF'], ['Blanco lechoso', '#F2ECE6'],
  ['Durazno', '#F2C2A8'], ['Beige', '#E5CDB4'], ['Coral suave', '#F2A595'], ['Glitter rosa', '#E9A3BC']];

const POLYGEL = [['Transparente', '#F4EEEC'], ['Nude', '#E3BFA8'], ['Rosa', '#F2C8CF'], ['Blanco', '#F7F5F2'], ['Rosa camuflaje', '#E9B3B5'], ['Glitter', '#E0C9D0']];
const ACRILICO = [['Transparente', '#F4EEEC'], ['Blanco', '#F7F5F2'], ['Rosa', '#F2C8CF'], ['Nude cover', '#E3BFA8'], ['Durazno cover', '#F2C2A8'], ['Glitter', '#E0C9D0']];
const ESMALTE = [['Rojo', '#B3122E'], ['Nude', '#E3BFA8'], ['Rosa', '#F2A3BC'], ['Vino', '#6B1630'], ['Negro', '#1E1A1C'], ['Blanco', '#F7F5F2'], ['Coral', '#F07B6B'], ['Lila', '#BBA5DA']];
const AROMAS = [['Almendra', '#E8B65C'], ['Coco', '#F1E6D2'], ['Vainilla', '#F3DDB0'], ['Rosas', '#F2A3BC'], ['Lavanda', '#C9B8E8'], ['Sandía', '#F0807A']];

// Nombre: nuevoProducto
// Descripción: Arma un producto del catálogo.
// Entrada: Nombre, descripción, categoría, precio y más.
// Salida: El producto listo.
// Objetivo: Escribir el catálogo más corto.
const nuevoProducto = (nombre, descripcion, categoria, tipo, precio, color, extra = {}) =>
  ({ nombre, descripcion, categoria, tipo, precio, color, marca: extra.marca || 'Nailé Pro', stock: extra.stock ?? 20 });

// Nombre: generarCatalogo
// Descripción: Crea todo el catálogo de productos.
// Entrada: Nada.
// Salida: La lista de productos.
// Objetivo: Llenar la tienda.
export function generarCatalogo() {
  const lista = [];
  // Esmaltes y geles
  GELES.forEach(([n, c], i) => lista.push(nuevoProducto(`Esmalte gel ${n}`, 'Semipermanente, 10 ml. Dura hasta 3 semanas. Requiere lámpara UV/LED.', 'Esmaltes y geles', 'frasco-gel', 5500, c, { stock: 6 + (i * 7) % 25 })));
  ESMALTE.forEach(([n, c]) => lista.push(nuevoProducto(`Esmalte tradicional ${n}`, 'Secado al aire, 15 ml. Ideal para retoques en casa.', 'Esmaltes y geles', 'frasco', 3200, c, { marca: 'Nailé' })));
  ['Gel cat eye magnético', 'Gel efecto aurora', 'Gel termocromático', 'Gel neón fucsia', 'Gel neón amarillo', 'Gel reflectivo'].forEach((nombre, i) =>
    lista.push(nuevoProducto(nombre, 'Gel de efecto especial, 10 ml.', 'Esmaltes y geles', 'frasco-gel', 6900, ['#4B3B6E', '#9FD3E0', '#E58CB0', '#FF2E8A', '#F2F23A', '#C9C5C3'][i])));

  // Bases y top coats
  RUBBER.forEach(([n, c]) => lista.push(nuevoProducto(`Rubber base ${n}`, 'Base nivelante y flexible, 15 ml. Refuerza la uña natural.', 'Bases y top coats', 'frasco-gel', 8500, c)));
  [['Base coat gel', 'Base adherente para gel, 15 ml.', 6500], ['Top coat brillo extremo', 'Sin capa pegajosa, 15 ml.', 7500],
   ['Top coat mate', 'Acabado mate aterciopelado, 15 ml.', 7500], ['Top coat con glitter', 'Brillo con destellos finos, 15 ml.', 7900],
   ['Builder gel transparente', 'Gel constructor para estructura y alargar, 15 g.', 9500], ['Builder gel nude', 'Gel constructor color nude, 15 g.', 9500],
   ['Primer sin ácido', 'Mejora la adherencia, 15 ml.', 5900], ['Deshidratante (nail prep)', 'Prepara la uña antes del gel, 15 ml.', 5200],
   ['Bonder', 'Adherente para acrílico y gel, 15 ml.', 5900], ['Top coat para esmalte tradicional', 'Secado rápido, 15 ml.', 3900]]
    .forEach(([n, d, p]) => lista.push(nuevoProducto(n, d, 'Bases y top coats', 'frasco-gel', p, '#F4EEEC')));

  // Acrílico y polygel
  POLYGEL.forEach(([n, c]) => lista.push(nuevoProducto(`Polygel ${n}`, 'Tubo de 30 g. Ligero y fácil de moldear.', 'Acrílico y polygel', 'tubo', 9500, c)));
  ACRILICO.forEach(([n, c]) => lista.push(nuevoProducto(`Polvo acrílico ${n}`, 'Frasco de 28 g, partícula fina.', 'Acrílico y polygel', 'tarro', 7500, c)));
  [['Monómero 120 ml', 'Líquido para acrílico, bajo olor.', 9500, 'botella'], ['Monómero 240 ml', 'Líquido para acrílico, bajo olor.', 16500, 'botella'],
   ['Solución deslizante para polygel', 'Para moldear sin que se pegue al pincel, 30 ml.', 4500, 'botella'],
   ['Dappen de cristal', 'Vaso para monómero con tapa.', 3500, 'tarro'], ['Moldes dual form (100 u.)', 'Para polygel, formas variadas.', 6500, 'caja'],
   ['Moldes de papel (300 u.)', 'Formas adhesivas para esculpir.', 4500, 'caja']]
    .forEach(([n, d, p, t]) => lista.push(nuevoProducto(n, d, 'Acrílico y polygel', t, p, '#F2C8CF')));

  // Equipos
  [['Lámpara UV/LED 48 W', 'Sensor automático y temporizador de 30, 60 y 90 s.', 24900], ['Lámpara UV/LED 80 W', 'Secado rápido para geles y builder.', 37900],
   ['Lámpara UV/LED recargable', 'Inalámbrica, ideal para servicio a domicilio.', 42900], ['Lámpara mini para curado rápido', 'Para fijar tips y detalles.', 9900]]
    .forEach(([n, d, p]) => lista.push(nuevoProducto(n, d, 'Equipos', 'lampara', p, '#F7F5F2', { stock: 6 })));
  [['Torno eléctrico 35 000 rpm', 'Con pedal y control de velocidad.', 49900], ['Torno recargable portátil', 'Batería de 6 horas.', 64900],
   ['Extractor de polvo de mesa', 'Con filtro lavable.', 34900], ['Calentador de parafina', 'Para tratamientos de manos y pies.', 29900],
   ['Esterilizador de herramientas', 'Por calor seco.', 27900], ['Lupa con luz LED', 'Para trabajo de detalle.', 18900]]
    .forEach(([n, d, p]) => lista.push(nuevoProducto(n, d, 'Equipos', n.startsWith('Torno') ? 'torno' : 'caja', p, '#E5CDB4', { stock: 4 })));
  ['Brocas de carburo (set 6)', 'Brocas de cerámica (set 5)', 'Broca de diamante para cutícula', 'Lijas para torno (100 u.)', 'Mandril para lijas']
    .forEach((nombre, i) => lista.push(nuevoProducto(nombre, 'Compatible con tornos estándar de 3/32".', 'Equipos', 'broca', [12900, 11900, 3900, 3500, 2500][i], '#C0C4C8')));

  // Herramientas
  [['Cortacutícula acero inoxidable 12 mm', 14900], ['Cortacutícula punta fina 7 mm', 12900], ['Cortacutícula básico', 6500], ['Cortacutícula para pedicure', 11900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Afilado a mano, corte preciso.', 'Herramientas', 'alicate', p, '#C0C4C8')));
  [['Alicate para uña de pie', 9900], ['Cortaúñas recto', 3500], ['Cortaúñas curvo', 3500], ['Cortador de tips', 4500], ['Tijera para cutícula', 5900], ['Pinza de precisión', 3900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Acero inoxidable.', 'Herramientas', n.includes('Tijera') || n.includes('Pinza') ? 'tijera' : 'alicate', p, '#C0C4C8')));
  [['Empujador de cutícula doble', 3900], ['Empujador y raspador', 3900], ['Cuchareta para cutícula', 3500], ['Palitos de naranjo (100 u.)', 1900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Para retirar cutícula sin lastimar.', 'Herramientas', 'empujador', p, '#C0C4C8')));
  [['Set de pinceles para nail art (15 u.)', 9500], ['Pincel para acrílico #8', 6900], ['Pincel para gel plano', 3900], ['Pincel delineador', 2900],
   ['Punzones para puntos (5 u.)', 2900], ['Espátula para polygel', 2500], ['Cepillo para polvo', 2500]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Cerdas suaves de alta calidad.', 'Herramientas', 'pincel', p, '#8C1D4B')));

  // Limas y pulidores
  [['Lima 100/180 (10 u.)', 3900], ['Lima 180/240 (10 u.)', 3900], ['Lima banana 100/180', 1500], ['Lima de cristal', 4500], ['Lima desechable (50 u.)', 4900],
   ['Lima de acero', 2900], ['Lima para pies', 3500], ['Lima zebra', 1200]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Grano según la numeración.', 'Limas y pulidores', 'lima', p, '#1E1A1C')));
  [['Bloque pulidor 4 caras', 1500], ['Bloque pulidor (10 u.)', 6900], ['Buffer brillo espejo', 1800], ['Bloque blanco 100/100', 1200]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Deja la superficie lisa y brillante.', 'Limas y pulidores', 'bloque', p, '#F2C8CF')));

  // Removedores y desechables
  [['Removedor de gel 120 ml', 'Retira semipermanente en 10 minutos.', 3900, 'botella'], ['Acetona pura 1 L', 'Para retirar acrílico y gel.', 4900, 'botella'],
   ['Removedor sin acetona 120 ml', 'Suave con la uña y la piel.', 3500, 'botella'], ['Limpiador (cleanser) 500 ml', 'Retira la capa pegajosa del gel.', 5900, 'botella'],
   ['Clips para remover gel (10 u.)', 'Reutilizables.', 3500, 'caja'], ['Papel aluminio precortado (200 u.)', 'Para remover gel.', 2900, 'caja'],
   ['Algodón en motas (100 g)', 'Suave y absorbente.', 1900, 'caja'], ['Toallitas sin pelusa (500 u.)', 'Para limpiar sin dejar residuos.', 3900, 'caja'],
   ['Guantes de nitrilo (100 u.)', 'Talla M.', 6500, 'caja'], ['Mascarillas desechables (50 u.)', 'Tres capas.', 3900, 'caja'],
   ['Toallas desechables (50 u.)', 'Para estación de trabajo.', 4500, 'caja'], ['Dispensador con bomba', 'Para acetona o cleanser.', 3900, 'botella']]
    .forEach(([n, d, p, t]) => lista.push(nuevoProducto(n, d, 'Removedores y desechables', t, p, '#A3C9E8')));

  // Decoración
  [['Balines dorados mixtos', 2500, '#D4AF37'], ['Pedrería cristal mixta', 3500, '#E6EEF8'], ['Perlas para uñas', 2900, '#F2ECE6'], ['Glitter fino holográfico', 2500, '#C0C4C8'],
   ['Polvo cromo espejo plateado', 3500, '#C0C4C8'], ['Polvo cromo dorado', 3500, '#D4AF37'], ['Polvo cromo aurora', 3500, '#9FD3E0'], ['Polvo efecto perla', 3500, '#F2ECE6'],
   ['Stickers flores', 1500, '#F2A3BC'], ['Stickers navideños', 1500, '#B3122E'], ['Stickers corazones', 1500, '#D6246E'], ['Stickers mariposas', 1500, '#6FA8DC'],
   ['Foil de transferencia', 2900, '#D4AF37'], ['Flores secas', 2900, '#F5B396'], ['Cinta de rayas', 1500, '#D4AF37'], ['Gel para pegar piedras', 4500, '#F4EEEC'],
   ['Gel pintura blanco', 4500, '#F7F5F2'], ['Gel pintura negro', 4500, '#1E1A1C'], ['Gel encapsulado de flores', 6500, '#F2A3BC'], ['Ojo de gato imán', 2500, '#4B3B6E']]
    .forEach(([n, p, c]) => lista.push(nuevoProducto(n, 'Para decoraciones y nail art.', 'Decoración', n.startsWith('Gel') ? 'frasco-gel' : 'tarro', p, c)));

  // Tips y press-on
  [['almendra', 'Almendra'], ['coffin', 'Coffin'], ['cuadrada', 'Cuadrada'], ['stiletto', 'Stiletto'], ['ovalada', 'Ovalada']].forEach(([k, n]) => {
    lista.push(nuevoProducto(`Tips ${n} transparentes (500 u.)`, 'Tips completos para extensión.', 'Tips y press-on', 'tips', 5900, '#F4EEEC'));
    lista.push(nuevoProducto(`Tips soft gel ${n} (240 u.)`, 'Se pegan con gel, efecto natural.', 'Tips y press-on', 'tips', 7900, '#F2C8CF'));
  });
  [['Press-on francesa almendra', '#F2ECE6'], ['Press-on nude con brillo', '#E3BFA8'], ['Press-on rojo coffin', '#B3122E'], ['Press-on flores', '#F2A3BC'],
   ['Press-on chrome', '#C0C4C8'], ['Press-on personalizado con tu diseño', '#BBA5DA'], ['Pegamento para uñas', '#F4EEEC'], ['Cinta adhesiva para press-on', '#F2C8CF']]
    .forEach(([n, c]) => lista.push(nuevoProducto(n, n.startsWith('Press') ? 'Set de 24 uñas reutilizables con lima y adhesivos.' : 'Para fijar press-on y tips.', 'Tips y press-on', n.startsWith('Press') ? 'tips' : 'tubo', n.includes('personalizado') ? 15000 : n.startsWith('Press') ? 8900 : 2500, c, { marca: 'Nailé' })));

  // Cuidado de manos
  AROMAS.forEach(([n, c]) => lista.push(nuevoProducto(`Aceite de cutícula ${n}`, 'Hidrata y suaviza la cutícula, 15 ml con pincel.', 'Cuidado de manos', 'gotero', 3900, c, { marca: 'Nailé Care' })));
  AROMAS.forEach(([n, c]) => lista.push(nuevoProducto(`Crema de manos ${n}`, 'Hidratación profunda, 75 ml.', 'Cuidado de manos', 'crema', 4500, c, { marca: 'Nailé Care' })));
  [['Crema reparadora con urea', 'Para manos muy secas, 100 ml.', 6900], ['Exfoliante de manos de azúcar', '200 g, deja la piel suave.', 6500],
   ['Mascarilla de manos con colágeno', 'Guantes hidratantes de un uso.', 2500], ['Guantes de algodón para tratamiento', 'Reutilizables.', 2900],
   ['Parafina de durazno 450 g', 'Para tratamiento en calentador.', 5900], ['Endurecedor de uñas', 'Para uñas débiles, 15 ml.', 4900],
   ['Tratamiento crecimiento', 'Con queratina, 15 ml.', 5500], ['Bálsamo de cutícula', 'Tarro de 10 g.', 3500], ['Sérum de uñas con biotina', '15 ml.', 6500],
   ['Gel antibacterial 250 ml', 'Con aloe vera.', 2500], ['Loción de masaje', '500 ml.', 7500], ['Removedor de cutícula', 'Ablanda la cutícula en 1 minuto, 30 ml.', 3900],
   ['Protector de cutícula (látex líquido)', 'Para nail art sin manchar la piel.', 4500], ['Bolígrafo de aceite para cutícula', 'Para llevar en la cartera.', 2900]]
    .forEach(([n, d, p]) => lista.push(nuevoProducto(n, d, 'Cuidado de manos', n.includes('Guantes') || n.includes('Mascarilla') ? 'caja' : n.includes('aceite') || n.includes('Sérum') ? 'gotero' : 'crema', p, '#F2D4CB', { marca: 'Nailé Care' })));

  // Pedicure (cuidado de pies)
  [['Crema para pies con menta', 6500], ['Exfoliante de pies', 6900], ['Sales de baño para pies', 4500], ['Piedra pómez', 1500], ['Raspador de pies doble', 3900],
   ['Separadores de dedos (10 pares)', 1900], ['Calcetines exfoliantes', 4900], ['Talco para pies', 2900], ['Gel refrescante para pies', 4900], ['Cepillo para uñas', 1900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Para pedicure en casa o en el salón.', 'Pedicure', n.includes('Raspador') || n.includes('Cepillo') ? 'lima' : n.includes('Separadores') || n.includes('Calcetines') ? 'caja' : 'crema', p, '#A8E0C8', { marca: 'Nailé Care' })));

  // Kits
  [['Kit de inicio semipermanente', 'Lámpara 48 W, base, top, 3 colores, removedor y lima.', 39900], ['Kit polygel completo', '6 polygel, moldes, lámpara mini y espátula.', 45900],
   ['Kit acrílico profesional', '6 polvos, monómero, pincel #8, dappen y moldes.', 52900], ['Kit de cuidado de manos', 'Crema, aceite, exfoliante y lima de cristal.', 16900],
   ['Kit de limas y pulidor', 'Lima 100/180, 180/240, banana y bloque.', 6000], ['Kit de nail art', '15 pinceles, punzones, balines y stickers.', 14900],
   ['Kit de retiro de gel', 'Removedor, clips, empujador y lima.', 9900], ['Kit de pedicure en casa', 'Raspador, piedra pómez, crema y separadores.', 12900],
   ['Kit regalo Nailé', 'Esmalte gel, aceite de cutícula y crema de manos en caja de regalo.', 14900], ['Kit de herramientas', 'Cortacutícula, empujador, cortaúñas y tijera.', 22900]]
    .forEach(([n, d, p]) => lista.push(nuevoProducto(n, d, 'Kits', 'kit', p, '#8C1D4B', { marca: 'Nailé', stock: 8 })));

  // ---------------------------------------------------------------- Ampliación (versión 5)
  // Más colores de gel
  [['Malva', '#B07A8C'], ['Champán', '#EAD7B7'], ['Rosa empolvado', '#E2B4B0'], ['Nude café', '#A47864'], ['Mocha latte', '#9C7A66'],
   ['Rosa neón', '#FF3D8B'], ['Verde neón', '#3DFF7A'], ['Naranja neón', '#FF7A1F'], ['Azul eléctrico', '#1F6BFF'], ['Lila pastel', '#D9C8EE'],
   ['Rosa durazno', '#F4B6A6'], ['Gris topo', '#8E837E'], ['Bronce', '#9C6B3C'], ['Cobre', '#B4673E'], ['Rosa gold', '#D9A39A'],
   ['Champán glitter', '#E8D3A7'], ['Rojo glitter', '#C2223B'], ['Azul glitter', '#3E62B8'], ['Verde glitter', '#2F8F5B'], ['Morado glitter', '#7B4AA8'],
   ['Negro glitter', '#2A2629'], ['Blanco nieve glitter', '#F4F2F6'], ['Holográfico', '#CFD8F0'], ['Blanco francesa', '#FBFAF8'], ['Rosa francesa', '#F5D2D6']]
    .forEach(([n, c]) => lista.push(nuevoProducto(`Esmalte gel ${n}`, 'Semipermanente, 10 ml. Dura hasta 3 semanas. Requiere lámpara UV/LED.', 'Esmaltes y geles', 'frasco-gel', 5500, c)));
  [['rosa', '#F7A8C2'], ['rojo', '#C81E3A'], ['lila', '#C3A6E8'], ['azul', '#7FB2F0'], ['ámbar', '#E3A44A'], ['nude', '#E9C2AE']]
    .forEach(([n, c]) => lista.push(nuevoProducto(`Gel jelly ${n}`, 'Gel translúcido efecto cristal, 10 ml.', 'Esmaltes y geles', 'frasco-gel', 5900, c)));
  [['Set 6 geles nude', '#E3BFA8'], ['Set 6 geles rojos', '#B3122E'], ['Set 6 geles glitter', '#D4AF37'], ['Set 6 geles pastel', '#C9B8E8'],
   ['Set 6 geles otoño', '#8A5A44'], ['Set 12 geles verano', '#F07B6B'], ['Set 12 geles favoritos', '#E8B4BC']]
    .forEach(([n, c]) => lista.push(nuevoProducto(n, 'Colores combinables en estuche, 10 ml cada uno.', 'Esmaltes y geles', 'kit', n.includes('12') ? 49900 : 27900, c)));
  [['Rosa chicle', '#F2A3BC'], ['Durazno', '#F5B396'], ['Celeste', '#A3C9E8'], ['Verde menta', '#A8E0C8'], ['Gris', '#7B7577'], ['Dorado', '#D4AF37']]
    .forEach(([n, c]) => lista.push(nuevoProducto(`Esmalte tradicional ${n}`, 'Secado al aire, 15 ml. Ideal para retoques en casa.', 'Esmaltes y geles', 'frasco', 3200, c, { marca: 'Nailé' })));
  [['Gotas secantes', 'Secan el esmalte tradicional en 2 minutos, 15 ml.', 3500, 'gotero'], ['Spray secante de esmalte', '100 ml.', 4500, 'botella'],
   ['Diluyente de esmalte', 'Recupera esmaltes espesos, 30 ml.', 2500, 'botella']]
    .forEach(([n, d, p, t]) => lista.push(nuevoProducto(n, d, 'Esmaltes y geles', t, p, '#F4EEEC')));

  // Builder y bases en tarro
  [['Builder gel en tarro transparente 50 g', '#F4EEEC'], ['Builder gel en tarro rosa 50 g', '#F2C8CF'], ['Builder gel en tarro nude 50 g', '#E3BFA8'],
   ['Builder gel en tarro blanco 50 g', '#F7F5F2'], ['Gel de construcción con glitter 50 g', '#E0C9D0'], ['Gel francés blanco intenso', '#FBFAF8'],
   ['Base fortalecedora con calcio', '#F4EEEC'], ['Rubber base con fibra', '#F2C8CF'], ['Top coat no wipe 30 ml', '#F4EEEC'], ['Top coat antiamarillo', '#F4EEEC']]
    .forEach(([n, c]) => lista.push(nuevoProducto(n, 'Para estructura y acabado profesional.', 'Bases y top coats', n.includes('tarro') || n.includes('50 g') ? 'tarro' : 'frasco-gel', n.includes('50 g') ? 14900 : 7900, c)));

  // Acrílico
  [['Set acrílicos de color (12 u.)', 18900, 'kit'], ['Set acrílicos glitter (12 u.)', 19900, 'kit'], ['Monómero 500 ml', 29900, 'botella'],
   ['Pincel para acrílico #10', 7900, 'pincel'], ['Pincel para acrílico #12', 8900, 'pincel'], ['Polvo acrílico cover rosado 100 g', 15900, 'tarro'],
   ['Polvo acrílico transparente 100 g', 15900, 'tarro'], ['Moldes reutilizables de silicona', 5900, 'caja']]
    .forEach(([n, p, t]) => lista.push(nuevoProducto(n, 'Para extensiones en acrílico.', 'Acrílico y polygel', t, p, '#F2C8CF')));

  // Brocas y equipos
  [['Broca cono de diamante', 3900], ['Broca llama para cutícula', 3900], ['Broca barril de carburo', 6900], ['Broca bala de cerámica', 6500],
   ['Broca para limpiar bajo la uña', 3500], ['Broca de pedicure para callos', 5900], ['Organizador de brocas', 4500]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Compatible con tornos estándar de 3/32".', 'Equipos', n.startsWith('Organizador') ? 'caja' : 'broca', p, '#C0C4C8')));
  [['Lámpara de mesa con aro de luz', 'Luz blanca para fotos y detalle.', 19900, 'lampara'], ['Secador de esmalte con ventilador', 'Para esmalte tradicional.', 8900, 'lampara'],
   ['Calentador de toallas', 'Para tratamientos de spa.', 34900, 'caja'], ['Lima eléctrica para callos', 'Recargable, con 3 rodillos.', 15900, 'torno']]
    .forEach(([n, d, p, t]) => lista.push(nuevoProducto(n, d, 'Equipos', t, p, '#E5CDB4', { stock: 5 })));

  // Manicure profesional (estación de trabajo)
  [['Bowl para manicure', 'Para remojar las manos.', 3900, 'tarro'], ['Cojín apoyamanos', 'Lavable, de cuerina.', 8900, 'caja'],
   ['Reposamanos de acrílico', 'Con soporte para dedos.', 11900, 'caja'], ['Toalla de mesa para manicure (3 u.)', 'Microfibra.', 6500, 'caja'],
   ['Organizador de esmaltes (48 frascos)', 'Acrílico transparente.', 16900, 'caja'], ['Muestrario de colores (120 tips)', 'Para exhibir tus geles.', 5900, 'tips'],
   ['Estuche para herramientas', 'Con cierre y elásticos.', 7900, 'caja'], ['Bolsas de esterilización (200 u.)', 'Con indicador de color.', 6900, 'caja'],
   ['Alcohol isopropílico 1 L', 'Para limpiar superficies y herramientas.', 4900, 'botella'], ['Desinfectante de inmersión', 'Para herramientas metálicas, 500 ml.', 8900, 'botella'],
   ['Spray desinfectante de manos', '250 ml.', 3500, 'botella'], ['Tarros de vidrio con tapa (6 u.)', 'Para decoraciones.', 4500, 'tarro'],
   ['Paleta para mezclar gel', 'De acero inoxidable.', 2900, 'empujador'], ['Bandeja de herramientas', 'Acero inoxidable.', 5900, 'caja'],
   ['Delantal para manicurista', 'Antimanchas.', 7900, 'caja'], ['Lentes de protección', 'Para el polvo del torno.', 3900, 'caja']]
    .forEach(([n, d, p, t]) => lista.push(nuevoProducto(n, d, 'Manicure profesional', t, p, '#D9B79A')));

  // Pedicure
  [['Tina para pedicure con masaje', 'Agua tibia y burbujas.', 32900, 'caja'], ['Bandeja para pedicure', 'Plástico resistente.', 6900, 'caja'],
   ['Bolsas desechables para tina (100 u.)', 'Higiene en cada clienta.', 7900, 'caja'], ['Sandalias desechables (50 pares)', 'Para después de la pedicure.', 6900, 'caja'],
   ['Separadores de espuma (100 pares)', 'Suaves y desechables.', 4900, 'caja'], ['Cuchilla para callos con repuestos', 'Uso profesional.', 5900, 'empujador'],
   ['Lima de pie doble cara', 'Gruesa y fina.', 3900, 'lima'], ['Piedra volcánica', 'Natural.', 1900, 'bloque'],
   ['Cortaúñas para uña encarnada', 'Punta fina.', 6900, 'alicate'], ['Lima para uña encarnada', 'Acero inoxidable.', 3500, 'lima'],
   ['Crema para talones agrietados', 'Con urea al 25 %, 100 ml.', 7900, 'crema'], ['Mascarilla de pies (par)', 'Hidratación profunda.', 2500, 'caja'],
   ['Calcetines de gel hidratantes', 'Reutilizables.', 5900, 'caja'], ['Tratamiento para uñas de pies', 'Con árbol de té, 15 ml.', 6900, 'gotero'],
   ['Aceite de pies árbol de té', '30 ml.', 4900, 'gotero'], ['Spray refrescante para pies', '150 ml.', 4500, 'botella'],
   ['Polvo podal', '100 g.', 3500, 'tarro'], ['Cepillo para talones', 'Cerdas firmes.', 2500, 'lima'],
   ['Toallas para pies (3 u.)', 'Algodón.', 6900, 'caja'], ['Bolsitas de parafina para pies', 'Botas térmicas desechables.', 4900, 'caja']]
    .forEach(([n, d, p, t]) => lista.push(nuevoProducto(n, d, 'Pedicure', t, p, '#A8E0C8', { marca: 'Nailé Care' })));
  [['Lavanda', '#C9B8E8'], ['Menta', '#A8E0C8'], ['Eucalipto', '#9FCFB8'], ['Rosas', '#F2A3BC'], ['Cítricos', '#F6C65B']]
    .forEach(([n, c]) => {
      lista.push(nuevoProducto(`Sales efervescentes de ${n.toLowerCase()}`, 'Para remojo de pies, 500 g.', 'Pedicure', 'tarro', 4900, c, { marca: 'Nailé Care' }));
      lista.push(nuevoProducto(`Exfoliante de pies ${n.toLowerCase()}`, '300 g, con sal marina.', 'Pedicure', 'tarro', 6900, c, { marca: 'Nailé Care' }));
    });

  // Cuidado de manos: más aromas
  [['Mango', '#F6B24A'], ['Fresa', '#F0607A'], ['Frutos rojos', '#B3263F'], ['Té verde', '#A9C27A'], ['Manzanilla', '#F3E3A0'], ['Cereza', '#C8203F']]
    .forEach(([n, c]) => {
      lista.push(nuevoProducto(`Aceite de cutícula ${n}`, 'Hidrata y suaviza la cutícula, 15 ml con pincel.', 'Cuidado de manos', 'gotero', 3900, c, { marca: 'Nailé Care' }));
      lista.push(nuevoProducto(`Crema de manos ${n}`, 'Hidratación profunda, 75 ml.', 'Cuidado de manos', 'crema', 4500, c, { marca: 'Nailé Care' }));
      lista.push(nuevoProducto(`Exfoliante de manos ${n}`, 'De azúcar, 200 g.', 'Cuidado de manos', 'tarro', 6500, c, { marca: 'Nailé Care' }));
    });
  [['Aceite de cutícula 100 ml (recarga)', 9900, 'botella'], ['Crema de manos 500 ml (salón)', 14900, 'botella'], ['Mantequilla corporal para manos', 7900, 'tarro'],
   ['Guantes de gel hidratantes', 5900, 'caja'], ['Protector solar para manos', 5900, 'crema'], ['Mascarilla de parafina sin calor', 6900, 'crema']]
    .forEach(([n, p, t]) => lista.push(nuevoProducto(n, 'Para manos suaves y cutículas sanas.', 'Cuidado de manos', t, p, '#F2D4CB', { marca: 'Nailé Care' })));

  // Nail art
  [['Stickers otoño', '#B5573A'], ['Stickers Halloween', '#F07A28'], ['Stickers letras', '#1E1A1C'], ['Stickers animal print', '#B87333'], ['Stickers mármol', '#C9C5C3'],
   ['Stickers geométricos', '#D4AF37'], ['Stickers de agua flores', '#F2A3BC'], ['Stickers 3D encaje', '#F7F5F2']]
    .forEach(([n, c]) => lista.push(nuevoProducto(n, 'Hoja con diseños variados.', 'Decoración', 'caja', 1500, c)));
  [['Placa de estampado flores', 4500], ['Placa de estampado geométrica', 4500], ['Sello de silicona con raspador', 3900],
   ['Esmalte para estampado negro', 2900], ['Esmalte para estampado blanco', 2900], ['Esmalte para estampado dorado', 2900],
   ['Plantillas para degradado (aerógrafo)', 3500], ['Esponjas para degradado (20 u.)', 1900], ['Pincel para francesa', 3500], ['Pincel abanico', 2900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Para nail art con estampado y degradado.', 'Decoración', n.startsWith('Esmalte') ? 'frasco' : n.startsWith('Pincel') ? 'pincel' : 'caja', p, n.includes('negro') ? '#1E1A1C' : n.includes('dorado') ? '#D4AF37' : '#F2ECE6')));
  [['Charms lazos', '#F2A3BC'], ['Charms corazones', '#D6246E'], ['Charms ositos', '#B87333'], ['Charms estrellas', '#D4AF37'], ['Cadena dorada', '#D4AF37'],
   ['Piedras grandes de cristal', '#E6EEF8'], ['Pedrería AB tornasol', '#CFD8F0'], ['Glitter chunky rosa', '#F28DB2'], ['Glitter chunky plateado', '#C0C4C8'],
   ['Escamas de sirena', '#9FD3E0'], ['Polvo terciopelo', '#B07A8C'], ['Polvo neón', '#FF3D8B'], ['Polvo efecto azúcar', '#F4F2F6'],
   ['Gel 4D para relieve', '#F4EEEC'], ['Gel araña negro', '#1E1A1C'], ['Gel araña dorado', '#D4AF37'], ['Gel pintura rojo', '#B3122E'], ['Gel pintura rosa', '#F28DB2']]
    .forEach(([n, c]) => lista.push(nuevoProducto(n, 'Para decoraciones y nail art.', 'Decoración', n.startsWith('Gel') ? 'frasco-gel' : 'tarro', n.startsWith('Gel') ? 4900 : 2900, c)));

  // Tips y press-on
  [['Press-on francesa coffin', '#F2ECE6'], ['Press-on milky white', '#F2ECE6'], ['Press-on glitter rosa', '#E9A3BC'], ['Press-on mármol', '#C9C5C3'],
   ['Press-on ombré nude', '#E3BFA8'], ['Press-on negro mate stiletto', '#1E1A1C'], ['Press-on cortas para pies', '#F2A3BC'], ['Press-on novia con perlas', '#F7F5F2']]
    .forEach(([n, c]) => lista.push(nuevoProducto(n, 'Set de 24 uñas reutilizables con lima y adhesivos.', 'Tips y press-on', 'tips', 8900, c, { marca: 'Nailé' })));
  [['Tips francesa (500 u.)', 5900], ['Tips para pies (500 u.)', 4900], ['Tips de colores (240 u.)', 6900], ['Gel adhesivo para tips', 4900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Para extensiones rápidas.', 'Tips y press-on', n.startsWith('Gel') ? 'frasco-gel' : 'tips', p, '#F4EEEC')));

  // Herramientas y limas
  [['Cortacutícula rosa gold', 13900], ['Alicate para acrílico', 8900], ['Empujador de cutícula de vidrio', 2900], ['Tijera curva para uñas', 4900],
   ['Pinza para curvar uñas (C-curve)', 4500], ['Cepillo para limpiar el polvo de uñas', 2500]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Acero inoxidable de calidad profesional.', 'Herramientas', n.includes('Tijera') || n.includes('Pinza') ? 'tijera' : n.includes('Empujador') ? 'empujador' : n.includes('Cepillo') ? 'pincel' : 'alicate', p, '#C0C4C8')));
  [['Lima 80/80 para acrílico (10 u.)', 3900], ['Lima 240/240 acabado fino (10 u.)', 3900], ['Lima de cristal para pies', 5900], ['Lima mini para cartera (6 u.)', 1900]]
    .forEach(([n, p]) => lista.push(nuevoProducto(n, 'Grano según la numeración.', 'Limas y pulidores', 'lima', p, '#1E1A1C')));

  // Kits nuevos
  [['Kit de pedicure spa', 'Sales, exfoliante, crema de talones, lima y separadores.', 19900], ['Kit francesa', 'Gel blanco francés, pincel, base y top.', 18900],
   ['Kit de estampado', '2 placas, sello y 3 esmaltes.', 13900], ['Kit builder gel', '3 builders en tarro, lima, pincel y cleanser.', 42900],
   ['Kit de manicure rusa', 'Brocas de cutícula, rubber base y aceite.', 29900], ['Kit press-on para principiantes', '3 sets, pegamento, lima y palitos.', 21900]]
    .forEach(([n, d, p]) => lista.push(nuevoProducto(n, d, 'Kits', 'kit', p, '#8C1D4B', { marca: 'Nailé', stock: 8 })));

  return lista;
}
