// Círculos de categorías de la portada (Inicio). La foto de cada círculo se puede cambiar
// en el panel: Productos → «Fotos de los círculos de la portada».
export const CATEGORIAS = [
  { nombre: 'Esmaltes y geles', tipo: 'frasco-gel', color: '#E0245E', to: '/tienda?categoria=Esmaltes y geles' },
  { nombre: 'Rubber base', tipo: 'frasco-gel', color: '#F2C8CF', to: '/tienda?q=rubber', clave: 'rubber' },
  { nombre: 'Herramientas', tipo: 'alicate', color: '#C0C4C8', to: '/tienda?categoria=Herramientas' },
  { nombre: 'Limas', tipo: 'lima', color: '#1E1A1C', to: '/tienda?categoria=Limas y pulidores' },
  { nombre: 'Cuidado de manos', tipo: 'crema', color: '#F2D4CB', to: '/tienda?categoria=Cuidado de manos' },
  { nombre: 'Pedicure', tipo: 'crema', color: '#A8E0C8', to: '/tienda?categoria=Pedicure' },
  { nombre: 'Manicure pro', tipo: 'caja', color: '#D9B79A', to: '/tienda?categoria=Manicure profesional' },
  { nombre: 'Aceites', tipo: 'gotero', color: '#E8B65C', to: '/tienda?q=aceite', clave: 'aceite' },
  { nombre: 'Decoración', tipo: 'tarro', color: '#D4AF37', to: '/tienda?categoria=Decoración' },
  { nombre: 'Para hombres', tipo: 'kit', color: '#3A3F45', to: '/tienda?categoria=Para hombres' }
];

// Nombre con el que se guarda la foto de cada círculo
// Nombre: claveCategoria
// Descripción: Da la clave de una categoría.
// Entrada: La categoría.
// Salida: La clave.
// Objetivo: Guardar su foto de portada.
export const claveCategoria = (categoria) => categoria.clave || decodeURIComponent(categoria.to.split('categoria=')[1] || '');

// Nombre: circuloDeTienda
// Descripción: Arma un círculo para una categoría de la tienda que no está en la lista fija.
// Entrada: El nombre de la categoría.
// Salida: El círculo (nombre, dibujo, color y enlace).
// Objetivo: Poder agregar al Inicio cualquier categoría de la tienda.
export const circuloDeTienda = (nombre) => ({ nombre, clave: nombre, tipo: 'caja', color: '#F2C8CF', to: `/tienda?categoria=${nombre}` });

// Nombre: circulosDelInicio
// Descripción: Lista final de círculos del Inicio: los fijos más los agregados, sin los ocultos.
// Entrada: { ocultos, inicioExtra } guardado por la dueña en el panel.
// Salida: La lista de círculos.
// Objetivo: Que la dueña agregue o elimine círculos sin tocar el código.
export const circulosDelInicio = ({ ocultos = [], inicioExtra = [] } = {}) => [...CATEGORIAS, ...inicioExtra.filter((categoria) => !CATEGORIAS.some((categoriaActual) => claveCategoria(categoriaActual) === categoria)).map(circuloDeTienda)]
  .filter((categoria) => !ocultos.includes(claveCategoria(categoria)));
