// Patrón Builder (versión del cliente): arma el diseño paso a paso.
import { ESMALTES, esmalte, calcularDiseno } from '../lib/esmaltes.js';
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
  forma: ['Almendra', 'Ovalada', 'Redonda', 'Cuadrada', 'Squoval', 'Coffin', 'Stiletto', 'Ballerina'],
  largo: ['Corto', 'Medio', 'Largo', 'Extra largo'],
  acabado: ['Brillante', 'Mate', 'Chrome', 'Glitter', 'Ojo de gato', 'Aurora', 'Perlado'],
  decoracion: ['Ninguna', 'Francesa', 'Francesa de color', 'Baby boomer', 'Ombré', 'Mármol', 'Líneas', 'Puntos', 'Corazones', 'Flores a mano', 'Animal print', 'Foil dorado', 'Pedrería', 'Aura']
};

export const PRECIO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000, 'Extra largo': 6000 },
  acabado: { Brillante: 0, Mate: 1000, Chrome: 3000, Glitter: 2000, 'Ojo de gato': 3000, Aurora: 3000, Perlado: 2000 },
  decoracion: { Ninguna: 0, Francesa: 2500, 'Francesa de color': 2500, 'Baby boomer': 3000, 'Ombré': 3000, 'Mármol': 3500, 'Líneas': 2000, Puntos: 1500,
    Corazones: 2500, 'Flores a mano': 4500, 'Animal print': 3500, 'Foil dorado': 3000, 'Pedrería': 4000, Aura: 3000 },
  acento: 2500
};

const UNA_INICIAL = { esmalte: 'AH-038', acabado: 'Brillante', decoracion: 'Ninguna' };
export const DISENO_INICIAL = {
  forma: 'Almendra', largo: 'Medio', color: 'Rosa ballet', acabado: 'Brillante',
  decoracion: 'Ninguna', acento: false, notas: '', fotoRefId: null,
  unas: [UNA_INICIAL, UNA_INICIAL, UNA_INICIAL, UNA_INICIAL, UNA_INICIAL]
};

export class DisenoBuilder {
  // Nombre: constructor
  // Descripción: Empieza un diseño.
  // Entrada: El diseño base.
  // Salida: Nada.
  // Objetivo: Armar el diseño (Builder).
  constructor(base = DISENO_INICIAL) { this.diseno = { ...base }; }
  // Nombre: build
  // Descripción: Termina el diseño con su precio.
  // Entrada: Nada.
  // Salida: El diseño.
  // Objetivo: Usarlo en la página.
  build() { return { ...this.diseno, precio: calcularRecargo(this.diseno) }; }
}

// Nombre: calcularRecargo
// Descripción: Calcula el costo extra del diseño.
// Entrada: El diseño.
// Salida: El monto.
// Objetivo: Cobrar lo justo.
export function calcularRecargo(datos) {
  if (datos.unas) return calcularDiseno(datos).total;
  return PRECIO.largo[datos.largo] + PRECIO.acabado[datos.acabado]
    + PRECIO.decoracion[datos.decoracion] + (datos.acento ? PRECIO.acento : 0);
}

// Nombre: describir
// Descripción: Describe el diseño en palabras.
// Entrada: El diseño.
// Salida: El texto.
// Objetivo: Mostrarlo en el carrito.
export function describir(datos) {
  if (datos.unas) {
    const nombres = [...new Set(datos.unas.map((una) => esmalte(una.esmalte)?.nombre).filter(Boolean))];
    const extras = [...new Set(datos.unas.flatMap((una) => [una.acabado !== 'Brillante' && una.acabado, una.decoracion !== 'Ninguna' && una.decoracion]).filter(Boolean))];
    const pegados = (datos.extras || []).map((extra) => `${extra.tipo.toLowerCase()} ${extra.variante.toLowerCase()} (${extra.dedos.length === 5 ? 'todas' : extra.dedos.map((dedo) => ['pulgar', 'índice', 'medio', 'anular', 'meñique'][dedo]).join(', ')}, ${extra.posicion.toLowerCase()})`);
    return [datos.forma, datos.largo.toLowerCase(), nombres.join(' + ').toLowerCase(), ...extras.map((extra) => extra.toLowerCase()), ...pegados].join(', ');
  }
  const partes = [datos.forma, datos.largo.toLowerCase(), datos.color.toLowerCase(), datos.acabado.toLowerCase()];
  if (datos.decoracion !== 'Ninguna') partes.push(datos.decoracion.toLowerCase());
  if (datos.acento) partes.push('uña de acento');
  return partes.join(', ');
}

// Nombre: hexDe
// Descripción: Da el color en código de un esmalte.
// Entrada: El nombre.
// Salida: El color.
// Objetivo: Pintar las uñas.
export const hexDe = (nombre) => (COLORES.find((color) => color.nombre === nombre) || ESMALTES.find((esmalte) => esmalte.nombre === nombre) || COLORES[0]).hex;
// Diseños guardados con nombres viejos siguen funcionando
// Nombre: normalizar
// Descripción: Completa un diseño con lo que falte.
// Entrada: El diseño.
// Salida: El diseño completo.
// Objetivo: Evitar datos vacíos.
export const normalizar = (datos) => ({ ...DISENO_INICIAL, ...datos, unas: Array.isArray(datos.unas) && datos.unas.length === 5 ? datos.unas : DISENO_INICIAL.unas, forma: OPCIONES.forma.includes(datos.forma) ? datos.forma : 'Almendra', acabado: OPCIONES.acabado.includes(datos.acabado) ? datos.acabado : 'Brillante', decoracion: OPCIONES.decoracion.includes(datos.decoracion) ? datos.decoracion : 'Ninguna' });
