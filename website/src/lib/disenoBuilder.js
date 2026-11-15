// Patrón Builder (versión del cliente): arma el diseño paso a paso.
// El servidor tiene la misma tabla y recalcula el recargo al guardar.

// Colores agrupados como en un muestrario real de salón
export const COLORES = [
  { nombre: 'Nude', hex: '#E3BFA8', grupo: 'Nudes' }, { nombre: 'Beige', hex: '#D9B99B', grupo: 'Nudes' },
  { nombre: 'Milky white', hex: '#F1E9E4', grupo: 'Nudes' }, { nombre: 'Rosa palo', hex: '#E8B4BC', grupo: 'Rosas' },
  { nombre: 'Rosa chicle', hex: '#F28DB2', grupo: 'Rosas' }, { nombre: 'Rosa intenso', hex: '#D23C6E', grupo: 'Rosas' },
  { nombre: 'Fucsia', hex: '#C2187A', grupo: 'Rosas' }, { nombre: 'Coral', hex: '#F07B6B', grupo: 'Rosas' },
  { nombre: 'Durazno', hex: '#F5B396', grupo: 'Rosas' }, { nombre: 'Rojo', hex: '#B3122E', grupo: 'Rojos' },
  { nombre: 'Rojo cereza', hex: '#8E0E28', grupo: 'Rojos' }, { nombre: 'Vino', hex: '#6B1630', grupo: 'Rojos' },
  { nombre: 'Borgoña', hex: '#4E0F22', grupo: 'Rojos' }, { nombre: 'Lila', hex: '#BBA5DA', grupo: 'Fríos' },
  { nombre: 'Lavanda', hex: '#C9B8E8', grupo: 'Fríos' }, { nombre: 'Celeste', hex: '#A3C9E8', grupo: 'Fríos' },
  { nombre: 'Azul marino', hex: '#1E2F5A', grupo: 'Fríos' }, { nombre: 'Verde salvia', hex: '#A9B79C', grupo: 'Fríos' },
  { nombre: 'Verde esmeralda', hex: '#0F6B4F', grupo: 'Fríos' }, { nombre: 'Mostaza', hex: '#C9962B', grupo: 'Otoño' },
  { nombre: 'Chocolate', hex: '#5A3627', grupo: 'Otoño' }, { nombre: 'Gris', hex: '#7B7577', grupo: 'Otoño' },
  { nombre: 'Negro', hex: '#1E1A1C', grupo: 'Clásicos' }, { nombre: 'Blanco', hex: '#F7F5F2', grupo: 'Clásicos' },
  { nombre: 'Dorado', hex: '#C9A24B', grupo: 'Metálicos' }, { nombre: 'Plateado', hex: '#B9BEC4', grupo: 'Metálicos' }
];

export const OPCIONES = {
  forma: ['Almendra', 'Ovalada', 'Redonda', 'Cuadrada', 'Squoval', 'Coffin', 'Stiletto'],
  largo: ['Corto', 'Medio', 'Largo'],
  acabado: ['Brillante', 'Mate', 'Chrome', 'Glitter', 'Ojo de gato', 'Aurora', 'Perlado'],
  decoracion: ['Ninguna', 'Francesa', 'Francesa de color', 'Baby boomer', 'Ombré', 'Mármol', 'Líneas', 'Puntos', 'Corazones', 'Flores a mano', 'Animal print', 'Foil dorado', 'Pedrería']
};

// Para buscar fotos reales parecidas en la galería
export const BUSQUEDA_GALERIA = {
  decoracion: { Francesa: 'francesa', 'Francesa de color': 'francesa', 'Baby boomer': 'degradado', 'Ombré': 'ombré', 'Mármol': 'mármol', Corazones: 'corazones',
    'Flores a mano': 'flores', 'Animal print': 'leopardo', 'Pedrería': 'pedrería', 'Foil dorado': 'dorado', 'Líneas': 'líneas', Puntos: 'puntos' }
};

export const PRECIO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000 },
  acabado: { Brillante: 0, Mate: 1000, Chrome: 3000, Glitter: 2000, 'Ojo de gato': 3000, Aurora: 3000, Perlado: 2000 },
  decoracion: { Ninguna: 0, Francesa: 2500, 'Francesa de color': 2500, 'Baby boomer': 3000, 'Ombré': 3000, 'Mármol': 3500, 'Líneas': 2000, Puntos: 1500,
    Corazones: 2500, 'Flores a mano': 4500, 'Animal print': 3500, 'Foil dorado': 3000, 'Pedrería': 4000 },
  acento: 2500
};

export const DISENO_INICIAL = {
  forma: 'Almendra', largo: 'Medio', color: 'Nude', acabado: 'Brillante',
  decoracion: 'Ninguna', acento: false, notas: '', fotoRefId: null
};

export class DisenoBuilder {
  constructor(base = DISENO_INICIAL) { this.d = { ...base }; }
  con(campo, valor) { this.d[campo] = valor; return this; }
  build() { return { ...this.d, precio: calcularRecargo(this.d) }; }
}

export function calcularRecargo(d) {
  return PRECIO.largo[d.largo] + PRECIO.acabado[d.acabado]
    + PRECIO.decoracion[d.decoracion] + (d.acento ? PRECIO.acento : 0);
}

export function describir(d) {
  const partes = [d.forma, d.largo.toLowerCase(), d.color.toLowerCase(), d.acabado.toLowerCase()];
  if (d.decoracion !== 'Ninguna') partes.push(d.decoracion.toLowerCase());
  if (d.acento) partes.push('uña de acento');
  return partes.join(', ');
}

export const hexDe = (nombre) => (COLORES.find((c) => c.nombre === nombre) || COLORES[0]).hex;
// Diseños guardados con nombres viejos siguen funcionando
export const normalizar = (d) => ({ ...d, forma: OPCIONES.forma.includes(d.forma) ? d.forma : 'Almendra', acabado: OPCIONES.acabado.includes(d.acabado) ? d.acabado : 'Brillante', decoracion: OPCIONES.decoracion.includes(d.decoracion) ? d.decoracion : 'Ninguna' });
