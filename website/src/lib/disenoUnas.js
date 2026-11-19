// Lógica del diseñador de uñas (sin pantallas): cómo se guarda el diseño, cómo se cambia una uña
// sin tocar las demás, qué palabras se usan para buscar fotos parecidas y el mensaje para WhatsApp.
// Separarla de la página (Disena.jsx) cumple Alta cohesión y Responsabilidad única (SOLID).
import { DisenoBuilder } from '../patrones/constructorDiseno.js';
import { esmalte, DEDOS, EXTRAS } from './esmaltes.js';
import { dinero } from '../config.js';

export const TODAS_LAS_UNAS = [0, 1, 2, 3, 4];
const UNA_INICIAL = { esmalte: 'AH-038', tecnica: 'Ninguna', acabado: 'Brillante' };
export const CONFIGURACION_INICIAL = { forma: 'Almendra', largo: 'Medio', unas: TODAS_LAS_UNAS.map(() => ({ ...UNA_INICIAL })), decoraciones: [], notas: '' };

// Palabras para buscar en la galería fotos reales parecidas
const PALABRA_POR_FAMILIA = { Nudes: 'nude', 'Blancos y milky': 'blanc', Rosas: 'rosa', Rojos: 'roj', 'Corales y naranjas': 'coral', Amarillos: 'amarill', Verdes: 'verde',
  Azules: 'azul', 'Morados y lilas': 'morad', 'Cafés y otoño': 'café', 'Grises y negros': 'negr', 'Neón': 'neón', Glitter: 'glitter', 'Metálicos': 'cromo', Jelly: 'jelly' };
const PALABRA_POR_TECNICA = { Francesa: 'francesa', 'Francesa de color': 'francesa', 'Baby boomer': 'baby boomer', 'Ombré': 'ombré', 'Mármol': 'mármol', 'Líneas': 'líneas',
  Puntos: 'puntos', Corazones: 'corazon', 'Flores a mano': 'flores', 'Animal print': 'animal', Aura: 'aura' };
const PALABRA_POR_DECORACION = { Perlas: 'perlas', Cristales: 'pedrería', Stickers: 'stickers', 'Flores 3D': 'flores', Foil: 'foil', Charms: 'charms', 'Líneas finas': 'líneas' };

// Nombre: leerConfiguracion
// Descripción: Recupera el diseño que la clienta ya había armado (también el formato de versiones anteriores).
// Entrada: La configuración guardada en la reserva.
// Salida: La configuración con cinco uñas y sus decoraciones.
// Objetivo: No perder lo que la clienta ya había hecho.
export function leerConfiguracion(guardada) {
  if (!guardada) return CONFIGURACION_INICIAL;
  const decoraciones = guardada.decoraciones || guardada.extras || [];
  if (Array.isArray(guardada.unas) && guardada.unas.length === 5) return { ...CONFIGURACION_INICIAL, ...guardada, decoraciones };
  const unas = TODAS_LAS_UNAS.map((indice) => ({
    esmalte: guardada.color2 && guardada.dedosColor2?.includes(indice) ? guardada.color2 : guardada.color1 || UNA_INICIAL.esmalte,
    tecnica: guardada.tecnica && guardada.dedosTecnica?.includes(indice) ? guardada.tecnica : 'Ninguna',
    acabado: guardada.acabado || 'Brillante'
  }));
  return { ...CONFIGURACION_INICIAL, forma: guardada.forma || 'Almendra', largo: guardada.largo || 'Medio', unas, decoraciones, notas: guardada.notas || '' };
}

// Nombre: armarDiseno
// Descripción: Convierte lo elegido en el diseño que entiende el servidor (patrón Builder).
// Entrada: La configuración de la clienta.
// Salida: El diseño con sus cinco uñas, decoraciones y recargo.
// Objetivo: Guardar y cobrar exactamente lo que se pidió.
export function armarDiseno(configuracion) {
  const unas = configuracion.unas.map((una) => ({ esmalte: una.esmalte, acabado: una.acabado, decoracion: una.tecnica }));
  return new DisenoBuilder({
    forma: configuracion.forma,
    largo: configuracion.largo,
    color: esmalte(configuracion.unas[1].esmalte).nombre,
    acabado: configuracion.unas[1].acabado,
    decoracion: configuracion.unas.find((una) => una.tecnica !== 'Ninguna')?.tecnica || 'Ninguna',
    acento: new Set(configuracion.unas.map((una) => una.esmalte)).size > 1,
    notas: configuracion.notas,
    fotoRefId: null,
    unas,
    extras: configuracion.decoraciones.filter((decoracion) => decoracion.dedos.length),
    config: configuracion
  }).build();
}

// Nombre: cambiarUnas
// Descripción: Cambia color, técnica o acabado solo en las uñas indicadas.
// Entrada: La configuración, las uñas, el campo y el valor.
// Salida: La configuración nueva.
// Objetivo: Que tocar una uña no cambie las demás.
export const cambiarUnas = (configuracion, unasElegidas, campo, valor) => ({
  ...configuracion,
  unas: configuracion.unas.map((una, indice) => (unasElegidas.includes(indice) ? { ...una, [campo]: valor } : una))
});

// Nombre: decoracionesDe
// Descripción: Lista las decoraciones que tiene una uña.
// Entrada: La configuración y el número de uña.
// Salida: Las decoraciones de esa uña.
// Objetivo: Mostrar y editar lo de esa uña.
export const decoracionesDe = (configuracion, indiceUna) => configuracion.decoraciones.filter((decoracion) => decoracion.dedos.includes(indiceUna));

// Nombre: ponerDecoracion
// Descripción: Pone, cambia o quita una decoración SOLO en las uñas indicadas. Si otra uña tiene la misma
//              decoración con otro tipo o en otra parte, esa uña no cambia.
// Entrada: La configuración, las uñas, el tipo de decoración y sus datos (variante y posición), o null para quitarla.
// Salida: La configuración nueva.
// Objetivo: Decorar uña por uña de verdad.
export function ponerDecoracion(configuracion, unasElegidas, tipo, datos) {
  let lista = configuracion.decoraciones.map((decoracion) => (decoracion.tipo === tipo
    ? { ...decoracion, dedos: decoracion.dedos.filter((indice) => !unasElegidas.includes(indice)) }
    : decoracion));
  if (datos) {
    const igual = lista.find((decoracion) => decoracion.tipo === tipo && decoracion.variante === datos.variante && decoracion.posicion === datos.posicion);
    lista = igual
      ? lista.map((decoracion) => (decoracion === igual ? { ...decoracion, dedos: [...new Set([...decoracion.dedos, ...unasElegidas])].sort() } : decoracion))
      : [...lista, { tipo, variante: datos.variante, posicion: datos.posicion, dedos: [...unasElegidas].sort() }];
  }
  return { ...configuracion, decoraciones: lista.filter((decoracion) => decoracion.dedos.length) };
}

// Nombre: datosNuevaDecoracion
// Descripción: Da el tipo y la parte de la uña con que empieza una decoración.
// Entrada: El tipo de decoración.
// Salida: { variante, posicion }.
// Objetivo: Empezar con la opción más común.
export const datosNuevaDecoracion = (tipo) => ({ variante: EXTRAS[tipo].variantes[0], posicion: tipo === 'Polvo' || tipo === 'Foil' ? 'Toda la uña' : 'Base' });

// Nombre: palabrasParaFotos
// Descripción: Arma las palabras con que se buscan fotos reales parecidas (colores, técnica, acabado, forma y decoraciones).
// Entrada: La configuración.
// Salida: Lista de palabras sin repetir.
// Objetivo: Que la foto real se parezca lo más posible al diseño.
export function palabrasParaFotos(configuracion) {
  return [...new Set([
    ...configuracion.unas.map((una) => PALABRA_POR_FAMILIA[esmalte(una.esmalte)?.familia]),
    ...configuracion.unas.map((una) => PALABRA_POR_TECNICA[una.tecnica]),
    ...configuracion.unas.map((una) => una.acabado !== 'Brillante' && una.acabado.toLowerCase()),
    configuracion.forma.toLowerCase(),
    ['Largo', 'Extra largo'].includes(configuracion.largo) ? 'largas' : configuracion.largo === 'Corto' ? 'cortas' : null,
    ...configuracion.decoraciones.map((decoracion) => (decoracion.tipo === 'Polvo' ? decoracion.variante.split(' ')[0].toLowerCase() : PALABRA_POR_DECORACION[decoracion.tipo]))
  ].filter(Boolean))];
}

// Nombre: textoDeUna
// Descripción: Describe una uña en palabras sencillas.
// Entrada: La configuración y el número de uña.
// Salida: El texto (color, acabado, técnica y decoraciones).
// Objetivo: Mostrarlo en la tabla y en el mensaje de WhatsApp.
export function textoDeUna(configuracion, indiceUna) {
  const una = configuracion.unas[indiceUna];
  const decoraciones = decoracionesDe(configuracion, indiceUna).map((decoracion) => `${decoracion.tipo.toLowerCase()} ${decoracion.variante.toLowerCase()} (${decoracion.posicion.toLowerCase()})`);
  return [una.tecnica !== 'Ninguna' && una.tecnica.toLowerCase(), una.acabado !== 'Brillante' && una.acabado.toLowerCase(), ...decoraciones].filter(Boolean).join(', ');
}

// Nombre: mensajeWhatsApp
// Descripción: Escribe el pedido completo para mandarlo al salón por WhatsApp.
// Entrada: La configuración y el precio total.
// Salida: El texto del mensaje.
// Objetivo: Cotizar el diseño o mandar una foto de referencia.
export function mensajeWhatsApp(configuracion, total) {
  return [
    'Hola, quiero cotizar este diseño de uñas:',
    `• Forma: ${configuracion.forma} · Largo: ${configuracion.largo}`,
    ...configuracion.unas.map((una, indice) => `• ${DEDOS[indice]}: ${esmalte(una.esmalte).nombre} (${una.esmalte})${textoDeUna(configuracion, indice) ? `, ${textoDeUna(configuracion, indice)}` : ''}`),
    configuracion.notas && `• Notas: ${configuracion.notas}`,
    `Precio estimado: ${dinero(total)}`
  ].filter(Boolean).join('\n');
}
