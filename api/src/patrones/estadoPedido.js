// Patrón State para los pedidos de la tienda: recibido → listo para retirar → completado (o cancelado).
// Cada estado sabe a cuáles puede pasar; el controlador no usa if/else por estado.
class EstadoPedido {
  // Nombre: constructor
  // Descripción: Crea un estado de pedido.
  // Entrada: El nombre y a cuáles puede pasar.
  // Salida: Nada.
  // Objetivo: Base de estados del pedido.
  constructor(nombre, siguientes) { this.nombre = nombre; this.siguientes = siguientes; }
  // Nombre: pasarA
  // Descripción: Pasa el pedido a otro estado.
  // Entrada: El estado nuevo.
  // Salida: El estado o un error.
  // Objetivo: Evitar saltos inválidos.
  pasarA(nuevo) {
    if (!this.siguientes.includes(nuevo)) throw new Error(`Un pedido ${ETIQUETAS[this.nombre]} no puede pasar a ${ETIQUETAS[nuevo] || nuevo}.`);
    return ESTADOS[nuevo];
  }
}
export const ETIQUETAS = { recibido: 'recibido', listo: 'listo para retirar', completado: 'completado', cancelado: 'cancelado' };
const ESTADOS = {
  recibido: new EstadoPedido('recibido', ['listo', 'completado', 'cancelado']),
  listo: new EstadoPedido('listo', ['completado', 'recibido', 'cancelado']),
  completado: new EstadoPedido('completado', ['listo']),
  cancelado: new EstadoPedido('cancelado', [])
};
// Nombre: cambiarEstadoPedido
// Descripción: Cambia el estado de un pedido.
// Entrada: El estado actual y el nuevo.
// Salida: El estado nuevo.
// Objetivo: Seguir el pedido paso a paso.
export function cambiarEstadoPedido(actual, nuevo) {
  const estado = ESTADOS[actual] || ESTADOS.recibido;
  return estado.pasarA(nuevo).nombre;
}
