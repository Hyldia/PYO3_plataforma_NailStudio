// Carta de servicios del salón, combos y cupones. Precios en colones, de referencia:
// cámbienlos por los reales. Las fotos son de Unsplash (se pueden cambiar por fotos del salón).

// Nombre: urlUnsplash
// Descripción: Arma el enlace de una foto de Unsplash.
// Entrada: El código de la foto.
// Salida: El enlace completo.
// Objetivo: Usar fotos reales.
const urlUnsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
const FOTOS = {
  rosa: urlUnsplash('1519014816548-bf5fe059798b'), salon: urlUnsplash('1632345031435-8727f6897d53'), proceso: urlUnsplash('1693776529070-2cdea397595b'),
  francesa: urlUnsplash('1762373349045-c2decd4ec3f3'), stiletto: urlUnsplash('1777287216954-2b4b22bb6bf2'), dorada: urlUnsplash('1770210257340-dc2b0f44642a'),
  glitter: urlUnsplash('1607779097040-26e80aa78e66'), marino: urlUnsplash('1754799670312-8e7da8e40ad7'), corazones: urlUnsplash('1754799670410-b282791342c3'),
  marmol: urlUnsplash('1772322586785-3a34772cbc61'), francesaGlitter: urlUnsplash('1772322586754-34c9e6f5be6f'), ombre: urlUnsplash('1772322586702-73125782bd99'),
  rojo: urlUnsplash('1748163432725-454f46f68340'), blanco: urlUnsplash('1630843599725-32ead7671867'), rosaClaro: urlUnsplash('1610992015762-45dca7fa3a85'),
  flor: urlUnsplash('1736434518489-0eb84070017f'), planta: urlUnsplash('1769687209448-025548dfca8b'), leopardo: urlUnsplash('1777288390469-828f8816231c'),
  pieAzul: urlUnsplash('1778098221994-015e8abb4336'), pies: urlUnsplash('1664643411326-6c589531be3c'), piesFlores: urlUnsplash('1519415510236-718bdfcd89c8'),
  negro: urlUnsplash('1604654894611-6973b376cbde')
};

// [nombre, categoria, descripcion, incluye[], duracion, precio, precioOferta|null, etiqueta|null, imagen, esCombo]
// Nombre: nuevoServicio
// Descripción: Arma un servicio de la carta.
// Entrada: Sus datos.
// Salida: El servicio listo.
// Objetivo: Escribir la carta más corto.
const nuevoServicio = (nombre, categoria, descripcion, incluye, duracion_min, precio, precio_oferta, etiqueta, imagen, es_combo = 0) =>
  ({ nombre, categoria, descripcion, incluye: incluye.join('|'), duracion_min, precio, precio_oferta, etiqueta, imagen, es_combo, destacado: etiqueta === 'Más pedido' ? 1 : 0 });

export const SERVICIOS = [
  // Manos
  nuevoServicio('Manicure tradicional', 'Manos', 'Uñas limpias, parejas y con brillo: el básico que nunca falla.',
    ['Limado y forma', 'Retiro de cutícula', 'Hidratación con crema', 'Esmalte tradicional'], 45, 12000, null, null, FOTOS.rosaClaro),
  nuevoServicio('Manicure semipermanente', 'Manos', 'Color perfecto que dura hasta tres semanas sin despegarse ni perder el brillo.',
    ['Limado y forma', 'Cutícula', 'Esmalte en gel', 'Top coat de alto brillo'], 60, 16000, null, 'Más pedido', FOTOS.rosa),
  nuevoServicio('Manicure rusa', 'Manos', 'Técnica con torno para una cutícula impecable y un esmaltado muy cerca de la piel.',
    ['Cutícula con torno', 'Nivelación con rubber base', 'Gel semipermanente', 'Aceite de cutícula'], 90, 22000, null, 'Nuevo', FOTOS.blanco),
  nuevoServicio('Manicure spa', 'Manos', 'Un momento para consentirte: exfoliación, masaje y mascarilla hidratante.',
    ['Exfoliación de manos', 'Mascarilla hidratante', 'Masaje relajante', 'Esmalte tradicional'], 60, 18000, 15500, null, FOTOS.flor),
  nuevoServicio('Francesa clásica', 'Manos', 'La elegancia de siempre: base natural y punta blanca perfectamente definida.',
    ['Manicure completa', 'Base rosada o nude', 'Punta blanca a mano', 'Gel semipermanente'], 75, 19000, null, null, FOTOS.francesa),
  nuevoServicio('Baby boomer', 'Manos', 'Degradado suave de rosa a blanco, ideal para novias y ocasiones especiales.',
    ['Manicure completa', 'Degradado en gel', 'Acabado brillante'], 80, 21000, null, null, FOTOS.francesaGlitter),

  // Extensiones
  nuevoServicio('Uñas acrílicas', 'Uñas acrílicas', 'Extensión resistente con la forma y el largo que quieras.',
    ['Preparación de la uña', 'Extensión con molde o tip', 'Forma a elección', 'Color en gel'], 120, 28000, null, 'Más pedido', FOTOS.stiletto),
  nuevoServicio('Acrílicas encapsuladas', 'Uñas acrílicas', 'Flores, glitter o foil atrapados dentro del acrílico para un diseño que no se borra.',
    ['Extensión en acrílico', 'Encapsulado de flores o glitter', 'Pulido y brillo'], 150, 34000, null, null, FOTOS.planta),
  nuevoServicio('Relleno de acrílico', 'Uñas acrílicas', 'Mantenimiento cada 2 o 3 semanas para que tus uñas sigan como el primer día.',
    ['Relleno del crecimiento', 'Corrección de forma', 'Color nuevo'], 90, 18000, null, null, FOTOS.proceso),
  nuevoServicio('Polygel', 'Gel y polygel', 'Extensión ligera y flexible con acabado natural.',
    ['Preparación', 'Extensión con dual form', 'Color en gel'], 100, 25000, 22000, null, FOTOS.dorada),
  nuevoServicio('Builder gel (nivelación)', 'Gel y polygel', 'Refuerza tus uñas naturales para que crezcan fuertes y sin quebrarse.',
    ['Preparación', 'Capa de builder gel', 'Color en gel'], 75, 20000, null, 'Nuevo', FOTOS.rosa),
  nuevoServicio('Soft gel (tips de gel)', 'Gel y polygel', 'Uñas largas en tiempo récord con tips de gel que se ven naturales.',
    ['Tips soft gel', 'Forma a elección', 'Color en gel'], 90, 24000, null, null, FOTOS.ombre),

  // Pies
  nuevoServicio('Pedicure tradicional', 'Pies', 'Pies limpios y uñas perfectas en poco tiempo.',
    ['Remojo', 'Corte y limado', 'Cutícula', 'Esmalte tradicional'], 50, 13000, null, null, FOTOS.pies),
  nuevoServicio('Pedicure spa', 'Pies', 'Exfoliación, masaje y mascarilla para pies suaves y descansados.',
    ['Remojo con sales', 'Exfoliación', 'Remoción de callosidad', 'Masaje', 'Esmalte'], 75, 18000, null, 'Más pedido', FOTOS.piesFlores),
  nuevoServicio('Pedicure semipermanente', 'Pies', 'Color que dura más de un mes en los pies.',
    ['Pedicure completa', 'Esmalte en gel', 'Top coat'], 75, 20000, null, null, FOTOS.pieAzul),
  nuevoServicio('Pedicure con parafina', 'Pies', 'Tratamiento térmico de parafina para pies resecos o agrietados.',
    ['Pedicure spa', 'Baño de parafina', 'Crema reparadora'], 90, 24000, 21000, null, FOTOS.piesFlores),

  // Tratamientos
  nuevoServicio('Hidratación profunda de manos', 'Tratamientos', 'Mascarilla con colágeno y guantes térmicos para manos suaves al instante.',
    ['Exfoliación', 'Mascarilla de colágeno', 'Guantes térmicos', 'Masaje'], 30, 8000, null, null, FOTOS.flor),
  nuevoServicio('Parafina para manos', 'Tratamientos', 'Ideal para manos resecas: la parafina tibia sella la hidratación.',
    ['Baño de parafina', 'Crema reparadora'], 25, 7500, null, null, FOTOS.planta),
  nuevoServicio('Fortalecimiento de uñas naturales', 'Tratamientos', 'Para uñas débiles o que se quiebran después de usar acrílico.',
    ['Limpieza', 'Tratamiento con queratina', 'Base fortalecedora'], 30, 9000, null, null, FOTOS.rosaClaro),

  // Diseños y extras
  nuevoServicio('Nail art a mano (por uña)', 'Diseños y extras', 'Flores, líneas, corazones o el dibujo que traigas en tu foto.',
    ['Diseño pintado a mano', 'Sellado con top coat'], 10, 1500, null, null, FOTOS.corazones),
  nuevoServicio('Efecto chrome o aurora', 'Diseños y extras', 'Brillo espejo o tornasol sobre cualquier color.',
    ['Polvo chrome', 'Sellado'], 15, 3000, null, null, FOTOS.glitter),
  nuevoServicio('Pedrería y balines (set)', 'Diseños y extras', 'Detalles de brillo para tus uñas de acento.',
    ['Cristales o balines', 'Gel de fijación'], 15, 2500, null, null, FOTOS.marino),

  // Retiros y reparaciones
  nuevoServicio('Retiro de producto', 'Retiros y reparaciones', 'Retiro seguro de gel o acrílico sin dañar la uña natural.',
    ['Retiro con acetona o torno', 'Limado', 'Aceite de cutícula'], 30, 6000, null, null, FOTOS.proceso),
  nuevoServicio('Reparación de una uña', 'Retiros y reparaciones', '¿Se te quebró una? La dejamos como nueva.',
    ['Reconstrucción', 'Color igual al resto'], 15, 2500, null, null, FOTOS.negro),

  // Combos
  nuevoServicio('Combo manos y pies semipermanente', 'Combos', 'Manicure y pedicure semipermanente en la misma cita.',
    ['Manicure semipermanente', 'Pedicure semipermanente', 'Aceite de cutícula de regalo'], 120, 36000, 30000, 'Oferta', FOTOS.rosa, 1),
  nuevoServicio('Combo acrílicas + pedicure spa', 'Combos', 'Uñas largas y pies consentidos en una sola visita.',
    ['Uñas acrílicas', 'Pedicure spa', 'Color en gel en ambos'], 180, 46000, 39900, 'Más pedido', FOTOS.stiletto, 1),
  nuevoServicio('Combo manicure + hidratación de manos', 'Combos', 'Tu manicure favorita con un tratamiento hidratante.',
    ['Manicure semipermanente', 'Hidratación profunda', 'Masaje'], 80, 24000, 20500, 'Oferta', FOTOS.flor, 1),
  nuevoServicio('Combo novia', 'Combos', 'Para el gran día: uñas impecables y prueba previa incluida.',
    ['Prueba de diseño', 'Baby boomer o francesa', 'Pedicure spa', 'Hidratación de manos'], 210, 58000, 52000, 'Especial', FOTOS.francesa, 1),
  nuevoServicio('Combo mamá e hija', 'Combos', 'Dos manicures tradicionales para compartir un rato juntas.',
    ['2 manicures tradicionales', 'Diseño sencillo para la niña'], 90, 22000, 19000, 'Oferta', FOTOS.corazones, 1),
  nuevoServicio('Combo spa completo', 'Combos', 'Manicure spa, pedicure con parafina e hidratación profunda.',
    ['Manicure spa', 'Pedicure con parafina', 'Hidratación de manos'], 180, 50000, 42500, 'Especial', FOTOS.piesFlores, 1)
];

// Cupones: porcentaje o monto fijo, con compra mínima y fecha de vencimiento
export const CUPONES = [
  { codigo: 'BIENVENIDA15', descripcion: '15 % de descuento en tu primera cita', tipo: 'porcentaje', valor: 15, minimo: 10000, vence: '2026-12-31', publico: 1 },
  { codigo: 'COMBO5000', descripcion: '₡5 000 menos en cualquier combo', tipo: 'monto', valor: 5000, minimo: 20000, vence: '2026-12-31', publico: 1, solo_combos: 1 },
  { codigo: 'NAVIDAD20', descripcion: '20 % en citas de diciembre', tipo: 'porcentaje', valor: 20, minimo: 15000, vence: '2026-12-24', publico: 1 },
  { codigo: 'AMIGA10', descripcion: '10 % si vienes recomendada por una clienta', tipo: 'porcentaje', valor: 10, minimo: 0, vence: '2027-06-30', publico: 1 },
  { codigo: 'CUMPLE25', descripcion: '25 % en la semana de tu cumpleaños', tipo: 'porcentaje', valor: 25, minimo: 12000, vence: '2027-12-31', publico: 0 }
];
