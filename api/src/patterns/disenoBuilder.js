// Patrón Builder: arma un diseño de uñas paso a paso y calcula su precio.
// Calcula el recargo del diseño sobre el precio del servicio. El cliente tiene una copia;
// el servidor recalcula para no confiar en el precio que llega del navegador.

import { esmalte, calcularDiseno, OPCIONES_DISENO, ESMALTES } from '../db/esmaltes.js';

export const OPCIONES = {
  formas: ['Almendra', 'Ovalada', 'Redonda', 'Cuadrada', 'Squoval', 'Coffin', 'Stiletto', 'Ballerina'],
  largos: ['Corto', 'Medio', 'Largo', 'Extra largo'],
  colores: ['Nude', 'Beige', 'Milky white', 'Rosa palo', 'Rosa chicle', 'Rosa intenso', 'Fucsia', 'Coral', 'Durazno', 'Rojo', 'Rojo cereza',
    'Vino', 'Borgoña', 'Lila', 'Lavanda', 'Celeste', 'Azul marino', 'Verde salvia', 'Verde esmeralda', 'Mostaza', 'Chocolate', 'Gris', 'Negro', 'Blanco', 'Dorado', 'Plateado'],
  acabados: ['Brillante', 'Mate', 'Chrome', 'Glitter', 'Ojo de gato', 'Aurora', 'Perlado'],
  decoraciones: ['Ninguna', 'Francesa', 'Francesa de color', 'Baby boomer', 'Ombré', 'Mármol', 'Líneas', 'Puntos', 'Corazones', 'Flores a mano', 'Animal print', 'Foil dorado', 'Pedrería']
};

// Recargos sobre el servicio base (en colones). Ajustar a la lista real del salón.
const PRECIO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000, 'Extra largo': 6000 },
  acabado: { Brillante: 0, Mate: 1000, Chrome: 3000, Glitter: 2000, 'Ojo de gato': 3000, Aurora: 3000, Perlado: 2000 },
  decoracion: { Ninguna: 0, Francesa: 2500, 'Francesa de color': 2500, 'Baby boomer': 3000, 'Ombré': 3000, 'Mármol': 3500, 'Líneas': 2000, Puntos: 1500,
    Corazones: 2500, 'Flores a mano': 4500, 'Animal print': 3500, 'Foil dorado': 3000, 'Pedrería': 4000 },
  acento: 2500
};

export class DisenoBuilder {
  constructor() {
    this.d = { forma: 'Almendra', largo: 'Medio', color: 'Nude', acabado: 'Brillante', decoracion: 'Ninguna', acento: false, notas: null, fotoRefId: null };
  }
  #validar(campo, valor, lista) {
    if (!lista.includes(valor)) throw new Error(`Valor no válido para ${campo}: ${valor}`);
    this.d[campo] = valor;
    return this;
  }
  notas(v) { this.d.notas = v ? String(v).slice(0, 500) : null; return this; }
  referencia(id) { this.d.fotoRefId = id ? Number(id) : null; return this; }
  forma(v) { return this.#validar('forma', v, OPCIONES.formas); }
  largo(v) { return this.#validar('largo', v, OPCIONES.largos); }
  color(v) { return this.#validar('color', v, [...OPCIONES.colores, ...ESMALTES.map((e) => e.nombre)]); }
  acabado(v) { return this.#validar('acabado', v, OPCIONES.acabados); }
  decoracion(v) { return this.#validar('decoracion', v, OPCIONES.decoraciones); }
  acento(v) { this.d.acento = Boolean(v); return this; }

  // Diseño uña por uña: cinco uñas (pulgar a meñique) con su esmalte, acabado y decoración
  unas(lista) {
    if (!lista) return this;
    if (!Array.isArray(lista) || lista.length !== 5) throw new Error('El diseño debe traer las cinco uñas.');
    this.d.unas = lista.map((u) => {
      if (!esmalte(u.esmalte)) throw new Error(`Esmalte no válido: ${u.esmalte}`);
      if (!OPCIONES_DISENO.acabado.includes(u.acabado)) throw new Error(`Acabado no válido: ${u.acabado}`);
      if (!OPCIONES_DISENO.decoracion.includes(u.decoracion)) throw new Error(`Decoración no válida: ${u.decoracion}`);
      return { esmalte: u.esmalte, acabado: u.acabado, decoracion: u.decoracion };
    });
    // Para las columnas de siempre se guarda lo del índice
    const i = this.d.unas[1];
    this.d.color = esmalte(i.esmalte).nombre; this.d.acabado = i.acabado; this.d.decoracion = i.decoracion;
    return this;
  }

  build() {
    if (this.d.unas) return { ...this.d, precio: calcularDiseno(this.d).total };
    const recargo = PRECIO.largo[this.d.largo] + PRECIO.acabado[this.d.acabado]
      + PRECIO.decoracion[this.d.decoracion] + (this.d.acento ? PRECIO.acento : 0);
    return { ...this.d, precio: recargo };
  }
}
