// Patrón State: cada estado decide qué transiciones son válidas.

class Estado {
  // Nombre: constructor
  // Descripción: Crea un estado de cita.
  // Entrada: El nombre del estado.
  // Salida: Nada.
  // Objetivo: Base de los estados (State).
  constructor(nombre) { this.nombre = nombre; }
  // Nombre: confirmar
  // Descripción: Avisa que no se puede confirmar.
  // Entrada: Nada.
  // Salida: Un error.
  // Objetivo: Evitar pasos inválidos.
  confirmar() { throw new Error(`No se puede confirmar una cita ${this.nombre}.`); }
  // Nombre: cancelar
  // Descripción: Avisa que no se puede cancelar.
  // Entrada: Nada.
  // Salida: Un error.
  // Objetivo: Evitar pasos inválidos.
  cancelar() { throw new Error(`No se puede cancelar una cita ${this.nombre}.`); }
  // Nombre: completar
  // Descripción: Avisa que no se puede completar.
  // Entrada: Nada.
  // Salida: Un error.
  // Objetivo: Evitar pasos inválidos.
  completar() { throw new Error(`No se puede completar una cita ${this.nombre}.`); }
}

class Pendiente extends Estado {
  // Nombre: constructor
  // Descripción: Crea el estado "pendiente".
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Primer estado de la cita.
  constructor() { super('pendiente'); }
  // Nombre: confirmar
  // Descripción: Pasa la cita a confirmada.
  // Entrada: Nada.
  // Salida: El estado confirmada.
  // Objetivo: Confirmar citas.
  confirmar() { return new Confirmada(); }
  // Nombre: cancelar
  // Descripción: Pasa la cita a cancelada.
  // Entrada: Nada.
  // Salida: El estado cancelada.
  // Objetivo: Cancelar citas.
  cancelar() { return new Cancelada(); }
}

class Confirmada extends Estado {
  // Nombre: constructor
  // Descripción: Crea el estado "confirmada".
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Estado de cita confirmada.
  constructor() { super('confirmada'); }
  // Nombre: cancelar
  // Descripción: Pasa la cita a cancelada.
  // Entrada: Nada.
  // Salida: El estado cancelada.
  // Objetivo: Cancelar citas.
  cancelar() { return new Cancelada(); }
  // Nombre: completar
  // Descripción: Pasa la cita a completada.
  // Entrada: Nada.
  // Salida: El estado completada.
  // Objetivo: Marcar atendida.
  completar() { return new Completada(); }
}

// Nombre: constructor
// Descripción: Crea el estado "completada".
// Entrada: Nada.
// Salida: Nada.
// Objetivo: Estado final.
class Completada extends Estado { constructor() { super('completada'); } }
// Nombre: constructor
// Descripción: Crea el estado "cancelada".
// Entrada: Nada.
// Salida: Nada.
// Objetivo: Estado final.
class Cancelada extends Estado { constructor() { super('cancelada'); } }

const ESTADOS = { pendiente: Pendiente, confirmada: Confirmada, completada: Completada, cancelada: Cancelada };

// Nombre: estadoDesde
// Descripción: Convierte un nombre en su estado.
// Entrada: El nombre del estado.
// Salida: El estado.
// Objetivo: Trabajar con estados.
export function estadoDesde(nombre) {
  const Clase = ESTADOS[nombre];
  if (!Clase) throw new Error(`Estado desconocido: ${nombre}`);
  return new Clase();
}

// Nombre: aplicarAccion
// Descripción: Aplica una acción a una cita.
// Entrada: El estado actual y la acción.
// Salida: El estado nuevo o un error.
// Objetivo: Cambiar estados de forma segura.
export function aplicarAccion(nombreEstado, accion) {
  const estado = estadoDesde(nombreEstado);
  if (typeof estado[accion] !== 'function' || !['confirmar', 'cancelar', 'completar'].includes(accion)) {
    throw new Error(`Acción no válida: ${accion}`);
  }
  return estado[accion]().nombre;
}
