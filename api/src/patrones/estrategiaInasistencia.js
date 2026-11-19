// Patrón Strategy: qué hacer cuando la clienta NO llegó a su cita.
// La dueña o la especialista elige una de dos estrategias:
//   - Reprogramar: se crea una cita nueva (confirmada) en otro día y hora, con el mismo servicio y el mismo adelanto.
//   - Cobrar: se cobra un monto (el adelanto, el total o el que decidan) y queda como ingreso del día.
// Para agregar otra decisión (por ejemplo "perdonar") se crea otra clase sin tocar estas (Abierto/Cerrado de SOLID).
import { CitaModel } from '../models/CitaModel.js';

const errorDecision = (mensaje, codigo = 400) => Object.assign(new Error(mensaje), { codigo });

class Reprogramar {
  nombre = 'reprogramada';
  tipoMensaje = 'no-asistio-reprogramada';

  // Nombre: aplicar
  // Descripción: Crea la cita nueva y marca la original como "no llegó, reprogramada".
  // Entrada: La cita original y { fecha, hora, quien }.
  // Salida: { cita, nueva, datosMensaje }.
  // Objetivo: Darle otra oportunidad a la clienta sin perder su adelanto.
  aplicar(cita, { fecha, hora, quien }) {
    if (!CitaModel.esFechaValida(fecha) || !CitaModel.esHoraValida(hora)) throw errorDecision('Elige el día y la hora de la nueva cita.');
    if (!CitaModel.horaDisponible(cita.especialista_id, fecha, hora)) throw errorDecision('Esa hora ya no está libre. Elige otra.', 409);
    const nueva = CitaModel.crear({
      servicioId: cita.servicio_id, especialistaId: cita.especialista_id, disenoId: cita.diseno_id, fotoRefId: cita.foto_ref_id,
      nombre: cita.cliente_nombre, telefono: cita.cliente_telefono, email: cita.cliente_email,
      notas: `Reprogramada de la cita #${cita.id} (no llegó).${cita.notas ? ` ${cita.notas}` : ''}`,
      fecha, hora, estado: 'confirmada', total: cita.total, anticipo: cita.anticipo, cuponCodigo: cita.cupon_codigo,
      descuento: cita.descuento, metodoPago: cita.metodo_pago, usuarioId: cita.usuario_id
    });
    const original = CitaModel.registrarInasistencia(cita.id, { decision: this.nombre, reprogramadaA: nueva.id, decididoPor: quien });
    return { cita: original, nueva, datosMensaje: { nuevaFecha: fecha, nuevaHora: hora } };
  }
}

class Cobrar {
  nombre = 'cobrada';
  tipoMensaje = 'no-asistio-cobro';

  // Nombre: aplicar
  // Descripción: Marca la cita como "no llegó, cobrada" con el monto decidido.
  // Entrada: La cita y { monto, quien }.
  // Salida: { cita, datosMensaje }.
  // Objetivo: Que el salón no pierda el espacio reservado.
  aplicar(cita, { monto, quien }) {
    const montoCobrado = Math.round(Number(monto));
    if (!Number.isFinite(montoCobrado) || montoCobrado < 0 || montoCobrado > cita.total) throw errorDecision(`El cobro debe ser entre ₡0 y ₡${Math.round(cita.total).toLocaleString('es-CR')}.`);
    const original = CitaModel.registrarInasistencia(cita.id, { decision: this.nombre, montoCobrado, decididoPor: quien });
    return { cita: original, datosMensaje: { monto: montoCobrado } };
  }
}

const ESTRATEGIAS = { reprogramar: Reprogramar, cobrar: Cobrar };

// Nombre: estrategiaInasistencia
// Descripción: Da la estrategia según lo que decidió la dueña o la especialista.
// Entrada: 'reprogramar' o 'cobrar'.
// Salida: La estrategia.
// Objetivo: Elegir la acción sin usar if por cada caso.
export function estrategiaInasistencia(decision) {
  const Estrategia = ESTRATEGIAS[decision];
  if (!Estrategia) throw errorDecision('Elige si se reprograma o se cobra.');
  return new Estrategia();
}
