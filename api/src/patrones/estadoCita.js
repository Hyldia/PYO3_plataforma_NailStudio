// Patrón State: cada estado decide qué transiciones son válidas.

class Estado {
  constructor(nombre) { this.nombre = nombre; }
  confirmar() { throw new Error(`No se puede confirmar una cita ${this.nombre}.`); }
  cancelar() { throw new Error(`No se puede cancelar una cita ${this.nombre}.`); }
  completar() { throw new Error(`No se puede completar una cita ${this.nombre}.`); }
}

class Pendiente extends Estado {
  constructor() { super('pendiente'); }
  confirmar() { return new Confirmada(); }
  cancelar() { return new Cancelada(); }
}

class Confirmada extends Estado {
  constructor() { super('confirmada'); }
  cancelar() { return new Cancelada(); }
  completar() { return new Completada(); }
}

class Completada extends Estado { constructor() { super('completada'); } }
class Cancelada extends Estado { constructor() { super('cancelada'); } }

const ESTADOS = { pendiente: Pendiente, confirmada: Confirmada, completada: Completada, cancelada: Cancelada };

export function estadoDesde(nombre) {
  const Clase = ESTADOS[nombre];
  if (!Clase) throw new Error(`Estado desconocido: ${nombre}`);
  return new Clase();
}

export function aplicarAccion(nombreEstado, accion) {
  const estado = estadoDesde(nombreEstado);
  if (typeof estado[accion] !== 'function' || !['confirmar', 'cancelar', 'completar'].includes(accion)) {
    throw new Error(`Acción no válida: ${accion}`);
  }
  return estado[accion]().nombre;
}
