// Patrón Builder: arma un diseño de uñas paso a paso y calcula su precio.
// Calcula el recargo del diseño sobre el precio del servicio. El cliente tiene una copia;
// el servidor recalcula para no confiar en el precio que llega del navegador.

export const OPCIONES = {
  formas: ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'],
  largos: ['Corto', 'Medio', 'Largo'],
  colores: ['Nude', 'Rosa palo', 'Rosa intenso', 'Rojo', 'Vino', 'Lila', 'Celeste', 'Verde salvia', 'Negro', 'Blanco'],
  acabados: ['Brillante', 'Mate', 'Chrome', 'Glitter'],
  decoraciones: ['Ninguna', 'Francesa', 'Baby boomer', 'Líneas', 'Flores a mano', 'Pedrería']
};

// Recargos sobre el servicio base (en colones). Ajustar a la lista real del salón.
const PRECIO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000 },
  acabado: { Brillante: 0, Mate: 1000, Chrome: 3000, Glitter: 2000 },
  decoracion: { Ninguna: 0, Francesa: 2500, 'Baby boomer': 3000, 'Líneas': 2000, 'Flores a mano': 4500, 'Pedrería': 4000 },
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
  color(v) { return this.#validar('color', v, OPCIONES.colores); }
  acabado(v) { return this.#validar('acabado', v, OPCIONES.acabados); }
  decoracion(v) { return this.#validar('decoracion', v, OPCIONES.decoraciones); }
  acento(v) { this.d.acento = Boolean(v); return this; }

  build() {
    const recargo = PRECIO.largo[this.d.largo] + PRECIO.acabado[this.d.acabado]
      + PRECIO.decoracion[this.d.decoracion] + (this.d.acento ? PRECIO.acento : 0);
    return { ...this.d, precio: recargo };
  }
}
