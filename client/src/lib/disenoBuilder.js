// Patrón Builder (versión del cliente): arma el diseño paso a paso.
// El servidor tiene la misma tabla y recalcula el recargo al guardar.

export const COLORES = [
  { nombre: 'Nude', hex: '#E3BFA8' }, { nombre: 'Rosa palo', hex: '#E8B4BC' },
  { nombre: 'Rosa intenso', hex: '#D23C6E' }, { nombre: 'Rojo', hex: '#B3122E' },
  { nombre: 'Vino', hex: '#6B1630' }, { nombre: 'Lila', hex: '#BBA5DA' },
  { nombre: 'Celeste', hex: '#A3C9E8' }, { nombre: 'Verde salvia', hex: '#A9B79C' },
  { nombre: 'Negro', hex: '#1E1A1C' }, { nombre: 'Blanco', hex: '#F7F5F2' }
];

export const OPCIONES = {
  forma: ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'],
  largo: ['Corto', 'Medio', 'Largo'],
  acabado: ['Brillante', 'Mate', 'Chrome', 'Glitter'],
  decoracion: ['Ninguna', 'Francesa', 'Baby boomer', 'Líneas', 'Flores a mano', 'Pedrería']
};

const PRECIO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000 },
  acabado: { Brillante: 0, Mate: 1000, Chrome: 3000, Glitter: 2000 },
  decoracion: { Ninguna: 0, Francesa: 2500, 'Baby boomer': 3000, 'Líneas': 2000, 'Flores a mano': 4500, 'Pedrería': 4000 },
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
