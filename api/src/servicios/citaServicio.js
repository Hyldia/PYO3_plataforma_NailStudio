// SERVICIO DE CITAS: las reglas para cancelar una cita y el aviso para la clienta.
// Lo usan el panel de la dueña y el portal del equipo, así ningún controlador depende de otro
// (GRASP: Controlador delgado, Bajo acoplamiento y Fabricación pura).
import { CitaModel, minutosParaLaCita, HORAS_MINIMAS_PARA_CANCELAR } from '../models/CitaModel.js';
import { aplicarAccion } from '../patrones/estadoCita.js';
import { prepararMensaje } from '../patrones/plantillaMensajes.js';
import { eventos } from '../patrones/observadorEventos.js';

// Nombre: errorCita
// Descripción: Crea un error con mensaje y código.
// Entrada: El mensaje y el código.
// Salida: El error.
// Objetivo: Que el controlador responda claro.
const errorCita = (mensaje, codigo = 400) => Object.assign(new Error(mensaje), { codigo });

// Nombre: mensajeDeCita
// Descripción: Prepara el mensaje de WhatsApp de una cita y avisa a los observadores.
// Entrada: La cita, el tipo de mensaje, datos extra y si es solo para ver.
// Salida: El mensaje con su enlace.
// Objetivo: Avisar a la clienta (Factory + Template Method + Observer).
export function mensajeDeCita(cita, tipo, extra = {}, soloVista = false) {
  const mensaje = prepararMensaje(tipo, { ...cita, ...extra }, cita.cliente_telefono);
  if (!soloVista) eventos.emit('mensaje:preparado', { citaId: cita.id, cliente: cita.cliente_nombre, ...mensaje });
  return mensaje;
}

// Nombre: revisarCancelacion
// Descripción: Revisa si una cita se puede cancelar y si el motivo está bien.
// Entrada: La cita, el motivo, el tipo de aviso y si la fecha debe ser futura.
// Salida: Nada, o lanza un error con el problema.
// Objetivo: Tener las reglas de cancelación en un solo lugar.
export function revisarCancelacion(cita, { motivo, tipo = 'cancelacion', soloFuturas = false, motivoObligatorio = false, conAnticipacion = false } = {}) {
  if (!cita) throw errorCita('No encontramos esa cita.', 404);
  if (!['cancelacion', 'reprogramacion'].includes(tipo)) throw errorCita('Tipo de aviso no válido.');
  if (!['pendiente', 'confirmada'].includes(cita.estado)) throw errorCita('Esa cita ya no se puede cancelar.');
  if (soloFuturas && cita.fecha < new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' })) throw errorCita('Esa cita ya pasó.');
  if (motivoObligatorio && String(motivo || '').trim().length < 3) throw errorCita('Escribe el motivo para avisarle a la clienta.');
  // Regla del salón: las clientas y las especialistas solo cancelan hasta 2 horas antes (la dueña puede siempre, por emergencias)
  if (conAnticipacion && minutosParaLaCita(cita.fecha, cita.hora) < HORAS_MINIMAS_PARA_CANCELAR * 60) {
    throw errorCita(`Las citas solo se pueden cancelar hasta ${HORAS_MINIMAS_PARA_CANCELAR} horas antes. Escríbenos por WhatsApp.`);
  }
}

// Nombre: cancelarCita
// Descripción: Cancela una cita (patrón State), guarda el motivo y prepara el aviso.
// Entrada: La cita y los datos del aviso (motivo, tipo, nueva fecha, nota, quién la canceló).
// Salida: La cita actualizada y el mensaje para la clienta.
// Objetivo: Que cancelar funcione igual en el panel y en el portal.
export function cancelarCita(cita, { motivo, tipo = 'cancelacion', nuevaFecha, nuevaHora, nota, quien = '' }) {
  const nuevo = aplicarAccion(cita.estado, 'cancelar');
  CitaModel.cambiarEstado(cita.id, nuevo);
  CitaModel.guardarMotivo(cita.id, `${motivo || 'Emergencia'}${quien ? ` (la canceló ${quien})` : ''}`);
  eventos.emit('cita:cancelada', { citaId: cita.id });
  return { cita: CitaModel.buscarPorId(cita.id), mensaje: mensajeDeCita(cita, tipo, { motivo, nuevaFecha, nuevaHora, nota }) };
}
