// Fotos de muestra para la galería, tomadas de Unsplash (licencia gratuita, uso comercial permitido).
// Se enlazan desde los servidores de Unsplash y se da crédito a cada fotógrafa.
// Cuando el salón tenga sus propias fotos, súbanlas desde /admin y borren estas.
//
// La clasificación (forma, color, acabado) sale de la descripción de cada foto en Unsplash.
// Revísenla en el panel y corrijan lo que no coincida con la imagen.

// Subir este número cuando se agreguen fotos nuevas a la lista
export const VERSION_FOTOS = 2;

// Nombre: U
// Descripción: Arma el enlace de una foto de Unsplash.
// Entrada: El código de la foto.
// Salida: El enlace completo.
// Objetivo: Usar fotos reales.
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;
// Nombre: autor
// Descripción: Arma los datos del autor de una foto.
// Entrada: Nombre y usuario.
// Salida: Los datos del autor.
// Objetivo: Dar crédito al fotógrafo.
const autor = (nombre, usuario) => ({ autor: nombre, autor_url: `https://unsplash.com/@${usuario}?utm_source=naile&utm_medium=referral` });

export const FOTOS_MUESTRA = [
  { archivo: U('1519014816548-bf5fe059798b'), titulo: 'Manicure rosa natural', descripcion: 'Manicure en tono rosa suave con brillo', categoria: 'Manicure', color: 'Rosa', acabado: 'Brillante', etiquetas: 'natural, elegante, oficina', destacada: 1, ...autor('DESIGNECOLOGIST', 'designecologist') },
  { archivo: U('1770210257340-dc2b0f44642a'), titulo: 'Almendra dorada', descripcion: 'Uñas almendradas en tono dorado metálico', categoria: 'Gel', forma: 'Almendra', color: 'Dorado', acabado: 'Chrome', etiquetas: 'fiesta, metálico, navidad', ...autor('Caroline Badran', '___atmos') },
  { archivo: U('1777287216954-2b4b22bb6bf2'), titulo: 'Stiletto metálico con pedrería', descripcion: 'Uñas stiletto metálicas decoradas con piedras', categoria: 'Acrílicas', forma: 'Stiletto', acabado: 'Chrome', etiquetas: 'pedrería, fiesta, largas', ...autor('de Aura', 'deaura2026') },
  { archivo: U('1607779097040-26e80aa78e66'), titulo: 'Malva con glitter plateado', descripcion: 'Uñas en malva y blanco con glitter plateado', categoria: 'Gel', color: 'Morado', acabado: 'Glitter', etiquetas: 'glitter, invierno', ...autor('Patrícia Hellinger', 'newleonin') },
  { archivo: U('1754799670312-8e7da8e40ad7'), titulo: 'Azul marino con dorado', descripcion: 'Diseño ornamentado en azul marino, dorado y blanco', categoria: 'Nail art', color: 'Azul', acabado: 'Brillante', etiquetas: 'dorado, elegante, diseño a mano', ...autor('Ari Kurniawan', 'arikurniawan') },
  { archivo: U('1754799670410-b282791342c3'), titulo: 'Corazones blanco y rosa', descripcion: 'Uñas blanco y rosa con corazones pintados', categoria: 'Nail art', color: 'Rosa', acabado: 'Brillante', etiquetas: 'corazones, san valentín, romántico', ...autor('Ari Kurniawan', 'arikurniawan') },
  { archivo: U('1772322586785-3a34772cbc61'), titulo: 'Blanco con puntas marmoleadas', descripcion: 'Uñas blancas con puntas marmoleadas en morado y negro', categoria: 'Nail art', color: 'Blanco', acabado: 'Brillante', etiquetas: 'mármol, francesa de color', ...autor('Margarita Yutsaytis', 'marsnails') },
  { archivo: U('1777288390469-828f8816231c'), titulo: 'Animal print y hojas', descripcion: 'Uñas decoradas con estampado de leopardo y hojas', categoria: 'Nail art', acabado: 'Brillante', etiquetas: 'leopardo, animal print, hojas', ...autor('de Aura', 'deaura2026') },
  { archivo: U('1604654894610-df63bc536371'), titulo: 'Negro y carey', descripcion: 'Uñas negras con diseño de carey y anillo dorado', categoria: 'Nail art', color: 'Negro', acabado: 'Brillante', etiquetas: 'carey, otoño', ...autor('Bryony Elena', 'b_elena') },
  { archivo: U('1604654894611-6973b376cbde'), titulo: 'Negro clásico', descripcion: 'Manicure en negro con anillo plateado', categoria: 'Manicure', color: 'Negro', acabado: 'Brillante', etiquetas: 'minimalista, clásico', ...autor('Bryony Elena', 'b_elena') },
  { archivo: U('1610992015762-45dca7fa3a85'), titulo: 'Rosa claro minimalista', descripcion: 'Manicure en rosa claro sobre fondo blanco', categoria: 'Manicure', color: 'Rosa', acabado: 'Brillante', etiquetas: 'natural, minimalista', ...autor('Chelson Tamares', 'jd_chon') },
  { archivo: U('1612887390768-fb02affea7a6'), titulo: 'Rosa sobre blanco', descripcion: 'Manicure rosa sobre textil blanco', categoria: 'Manicure', color: 'Rosa', acabado: 'Brillante', etiquetas: 'natural', ...autor('Jodene Isakowitz', 'jojobean24') },
  { archivo: U('1769687209448-025548dfca8b'), titulo: 'Diseño ornamentado', descripcion: 'Uñas con diseño ornamentado sosteniendo una planta', categoria: 'Nail art', acabado: 'Brillante', etiquetas: 'diseño a mano, primavera', ...autor('Julia Schuwer', 'julia_2501') },
  { archivo: U('1736434518489-0eb84070017f'), titulo: 'Manicure con flor', descripcion: 'Mano con manicure sosteniendo una flor', categoria: 'Manicure', acabado: 'Brillante', etiquetas: 'primavera, natural', ...autor('Caroline Badran', '___atmos') },
  { archivo: U('1571290274554-6a2eaa771e5f'), titulo: 'Manicure clásica', descripcion: 'Uñas con manicure tradicional', categoria: 'Manicure', acabado: 'Brillante', etiquetas: 'clásico', ...autor('Budka Damdinsuren', 'buudkaanaa') },
  { archivo: U('1632345031435-8727f6897d53'), titulo: 'En el salón', descripcion: 'Clienta recibiendo manicure en un salón de uñas', categoria: 'Manicure', etiquetas: 'salón, servicio', ...autor('Giorgio Trovato', 'giorgiotrovato') },
  { archivo: U('1762373349045-c2decd4ec3f3'), titulo: 'Francesa con flor', descripcion: 'Manicure francesa sosteniendo una flor pequeña', categoria: 'Manicure', color: 'Nude', acabado: 'Brillante', etiquetas: 'francesa, clásico, boda', ...autor('Anna Meshkov', 'anna_meshkov') },
  { archivo: U('1772322586754-34c9e6f5be6f'), titulo: 'Francesa con glitter', descripcion: 'Manicure francesa con detalles de glitter', categoria: 'Gel', color: 'Nude', acabado: 'Glitter', etiquetas: 'francesa, glitter, fiesta', ...autor('Margarita Yutsaytis', 'marsnails') },
  { archivo: U('1772322586702-73125782bd99'), titulo: 'Degradado azul y blanco', descripcion: 'Uñas en degradado de azul a blanco', categoria: 'Gel', color: 'Azul', acabado: 'Brillante', etiquetas: 'ombré, degradado, verano', ...autor('Margarita Yutsaytis', 'marsnails') },
  { archivo: U('1748163432725-454f46f68340'), titulo: 'Rojo clásico', descripcion: 'Uñas pintadas de rojo intenso', categoria: 'Manicure', color: 'Rojo', acabado: 'Brillante', etiquetas: 'rojo, clásico, navidad', ...autor('photo koala', 'koalaaaah') },
  { archivo: U('1630843599725-32ead7671867'), titulo: 'Blanco lechoso', descripcion: 'Manicure en blanco', categoria: 'Manicure', color: 'Blanco', acabado: 'Brillante', etiquetas: 'blanco, minimalista, boda', ...autor('Ellie Eshaghi', 'eliiesh') },
  { archivo: U('1633955726992-2b7c0d2d2a69'), titulo: 'Blanco brillante', descripcion: 'Manos con esmalte blanco', categoria: 'Manicure', color: 'Blanco', acabado: 'Brillante', etiquetas: 'blanco, verano', ...autor('Alazar Kassahun', 'alazar_k5') },
  { archivo: U('1643648854897-7b5845b4c04c'), titulo: 'Rosa delicado', descripcion: 'Mano con manicure rosa', categoria: 'Manicure', color: 'Rosa', acabado: 'Brillante', etiquetas: 'rosa, natural', ...autor('Esther Olayiwola', 'estherolayiwo19_8853927_sink') },
  { archivo: U('1604902396830-aca29e19b067'), titulo: 'Manicure sobre rosa', descripcion: 'Mano con manicure sobre fondo rosa', categoria: 'Manicure', etiquetas: 'natural', ...autor('KARTIK GADA', 'kartikgada') },
  { archivo: U('1693776529070-2cdea397595b'), titulo: 'Manicure en proceso', descripcion: 'Especialista haciendo una manicure en el salón', categoria: 'Manicure', etiquetas: 'salón, servicio', ...autor('Anna Keibalo', 'anyutakejbalo') },
  { archivo: U('1778098221994-015e8abb4336'), titulo: 'Pedicure azul oscuro', descripcion: 'Pies con esmalte azul oscuro', categoria: 'Pedicure', color: 'Azul', acabado: 'Brillante', etiquetas: 'pedicure, pies, verano', ...autor('Konstantin Shmatov', 'shmatov') },
  { archivo: U('1664643411326-6c589531be3c'), titulo: 'Pedicure de color', descripcion: 'Pies con uñas pintadas', categoria: 'Pedicure', acabado: 'Brillante', etiquetas: 'pedicure, pies', ...autor('Konstantin Shmatov', 'shmatov') },
  { archivo: U('1519415510236-718bdfcd89c8'), titulo: 'Pedicure spa con flores', descripcion: 'Pies en spa decorados con flores', categoria: 'Pedicure', etiquetas: 'spa, relajación, pies', ...autor('Rune Enstad', 'runejohs') }
];

// Las fotos de los productos se traen con `npm run fotos-productos` (ver fotosProductos.js).
export const IMAGENES_PRODUCTOS = {};
