// Patrón Builder: arma un diseño de uñas paso a paso y calcula su precio.
// Calcula el recargo del diseño sobre el precio del servicio. El cliente tiene una copia;
// el servidor recalcula para no confiar en el precio que llega del navegador.

import { esmalte, calcularDiseno, OPCIONES_DISENO, ESMALTES, limpiarExtras } from '../db/esmaltes.js';

export const OPCIONES = {
  formas: ['Almendra', 'Ovalada', 'Redonda', 'Cuadrada', 'Squoval', 'Coffin', 'Stiletto', 'Ballerina'],
  largos: ['Corto', 'Medio', 'Largo', 'Extra largo'],
  colores: ['Nude', 'Beige', 'Milky white', 'Rosa palo', 'Rosa chicle', 'Rosa intenso', 'Fucsia', 'Coral', 'Durazno', 'Rojo', 'Rojo cereza',
    'Vino', 'Borgoña', 'Lila', 'Lavanda', 'Celeste', 'Azul marino', 'Verde salvia', 'Verde esmeralda', 'Mostaza', 'Chocolate', 'Gris', 'Negro', 'Blanco', 'Dorado', 'Plateado'],
  acabados: ['Brillante', 'Mate', 'Chrome', 'Glitter', 'Ojo de gato', 'Aurora', 'Perlado'],
  decoraciones: ['Ninguna', 'Francesa', 'Francesa de color', 'Baby boomer', 'Ombré', 'Mármol', 'Líneas', 'Puntos', 'Corazones', 'Flores a mano', 'Animal print', 'Foil dorado', 'Pedrería', 'Aura']
};

// Recargos sobre el servicio base (en colones). Ajustar a la lista real del salón.
export const PRECIO = {
  largo: { Corto: 0, Medio: 2000, Largo: 4000, 'Extra largo': 6000 },
  acabado: { Brillante: 0, Mate: 1000, Chrome: 3000, Glitter: 2000, 'Ojo de gato': 3000, Aurora: 3000, Perlado: 2000 },
  decoracion: { Ninguna: 0, Francesa: 2500, 'Francesa de color': 2500, 'Baby boomer': 3000, 'Ombré': 3000, 'Mármol': 3500, 'Líneas': 2000, Puntos: 1500,
    Corazones: 2500, 'Flores a mano': 4500, 'Animal print': 3500, 'Foil dorado': 3000, 'Pedrería': 4000, Aura: 3000 },
  acento: 2500
};

export class DisenoBuilder {
  // Nombre: constructor
  // Descripción: Empieza un diseño vacío.
  // Entrada: Nada.
  // Salida: El constructor.
  // Objetivo: Armar un diseño paso a paso (Builder).
  constructor() {
    this.diseno = { forma: 'Almendra', largo: 'Medio', color: 'Nude', acabado: 'Brillante', decoracion: 'Ninguna', acento: false, notas: null, fotoRefId: null };
  }
  #validar(campo, valor, lista) {
    if (!lista.includes(valor)) throw new Error(`Valor no válido para ${campo}: ${valor}`);
    this.diseno[campo] = valor;
    return this;
  }
  // Nombre: notas
  // Descripción: Agrega notas al diseño.
  // Entrada: El texto.
  // Salida: El constructor.
  // Objetivo: Guardar indicaciones.
  notas(valor) { this.diseno.notas = valor ? String(valor).slice(0, 500) : null; return this; }
  // Nombre: referencia
  // Descripción: Agrega una foto de referencia.
  // Entrada: El número de la foto.
  // Salida: El constructor.
  // Objetivo: Copiar un diseño de la galería.
  referencia(id) { this.diseno.fotoRefId = id ? Number(id) : null; return this; }
  // Nombre: forma
  // Descripción: Elige la forma de las uñas.
  // Entrada: La forma.
  // Salida: El constructor.
  // Objetivo: Armar el diseño.
  forma(valor) { return this.#validar('forma', valor, OPCIONES.formas); }
  // Nombre: largo
  // Descripción: Elige el largo de las uñas.
  // Entrada: El largo.
  // Salida: El constructor.
  // Objetivo: Armar el diseño.
  largo(valor) { return this.#validar('largo', valor, OPCIONES.largos); }
  // Nombre: color
  // Descripción: Elige el color.
  // Entrada: El color.
  // Salida: El constructor.
  // Objetivo: Armar el diseño.
  color(valor) { return this.#validar('color', valor, [...OPCIONES.colores, ...ESMALTES.map((esmalte) => esmalte.nombre)]); }
  // Nombre: acabado
  // Descripción: Elige el acabado.
  // Entrada: El acabado.
  // Salida: El constructor.
  // Objetivo: Armar el diseño.
  acabado(valor) { return this.#validar('acabado', valor, OPCIONES.acabados); }
  // Nombre: decoracion
  // Descripción: Elige la decoración.
  // Entrada: La decoración.
  // Salida: El constructor.
  // Objetivo: Armar el diseño.
  decoracion(valor) { return this.#validar('decoracion', valor, OPCIONES.decoraciones); }
  // Nombre: acento
  // Descripción: Activa o quita la uña de acento.
  // Entrada: Sí o no.
  // Salida: El constructor.
  // Objetivo: Armar el diseño.
  acento(valor) { this.diseno.acento = Boolean(valor); return this; }

  // Diseño uña por uña: cinco uñas (pulgar a meñique) con su esmalte, acabado y decoración
  // Nombre: unas
  // Descripción: Guarda el diseño de cada uña.
  // Entrada: La lista de uñas.
  // Salida: El constructor.
  // Objetivo: Diseñar uña por uña.
  unas(lista) {
    if (!lista) return this;
    if (!Array.isArray(lista) || lista.length !== 5) throw new Error('El diseño debe traer las cinco uñas.');
    this.diseno.unas = lista.map((elemento) => {
      if (!esmalte(elemento.esmalte)) throw new Error(`Esmalte no válido: ${elemento.esmalte}`);
      if (!OPCIONES_DISENO.acabado.includes(elemento.acabado)) throw new Error(`Acabado no válido: ${elemento.acabado}`);
      if (!OPCIONES_DISENO.decoracion.includes(elemento.decoracion)) throw new Error(`Decoración no válida: ${elemento.decoracion}`);
      return { esmalte: elemento.esmalte, acabado: elemento.acabado, decoracion: elemento.decoracion };
    });
    // Para las columnas de siempre se guarda lo del índice
    const dedoIndice = this.diseno.unas[1];
    this.diseno.color = esmalte(dedoIndice.esmalte).nombre; this.diseno.acabado = dedoIndice.acabado; this.diseno.decoracion = dedoIndice.decoracion;
    return this;
  }

  // Nombre: extras
  // Descripción: Agrega perlas, cristales, stickers, polvos, flores 3D, etc.
  // Entrada: La lista con tipo, variante, uñas y posición.
  // Salida: El mismo constructor.
  // Objetivo: Guardar dónde va cada decoración.
  extras(lista) { this.diseno.extras = limpiarExtras(lista); return this; }

  // Nombre: build
  // Descripción: Termina y revisa el diseño.
  // Entrada: Nada.
  // Salida: El diseño listo.
  // Objetivo: Entregar un diseño completo.
  build() {
    if (this.diseno.unas) return { ...this.diseno, precio: calcularDiseno(this.diseno).total };
    const recargo = PRECIO.largo[this.diseno.largo] + PRECIO.acabado[this.diseno.acabado]
      + PRECIO.decoracion[this.diseno.decoracion] + (this.diseno.acento ? PRECIO.acento : 0);
    return { ...this.diseno, precio: recargo };
  }
}
