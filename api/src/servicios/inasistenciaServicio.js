// SERVICIO: cuando una clienta no llegó a su cita (Fabricación pura de GRASP).
// Lo usan el panel de la dueña y el portal de la especialista, así las dos pantallas siguen la misma regla.
import { minutosParaLaCita } from '../models/CitaModel.js';
import { aplicarAccion } from '../patrones/estadoCita.js';
import { estrategiaInasistencia } from '../patrones/estrategiaInasistencia.js';
import { mensajeDeCita } from './citaServicio.js';
import { eventos } from '../patrones/observadorEventos.js';

// Nombre: errorCita
// Descripción: Crea un error con su código HTTP.
// Entrada: El mensaje y el código (400 si no se da).
// Salida: El error listo para lanzar.
// Objetivo: Que el controlador responda el código correcto.
const errorCita = (mensaje, codigo = 400) => Object.assign(new Error(mensaje), { codigo });

// Nombre: registrarNoAsistio
// Descripción: Marca que la clienta no llegó y aplica la decisión (reprogramar o cobrar).
// Entrada: La cita y { decision, fecha, hora, monto, quien }.
// Salida: { cita, nueva?, mensaje } con el mensaje de WhatsApp listo para la clienta.
// Objetivo: Que la dueña o la especialista decidan qué pasa con una cita perdida.
export function registrarNoAsistio(cita, { decision, fecha, hora, monto, quien }) {
  if (!cita) throw errorCita('No encontramos esa cita.', 404);
  if (minutosParaLaCita(cita.fecha, cita.hora) > 0) throw errorCita('Solo se puede marcar "no llegó" cuando ya pasó la hora de la cita.');
  aplicarAccion(cita.estado, 'noAsistio'); // el patrón State revisa que la cita esté pendiente o confirmada
  const estrategia = estrategiaInasistencia(decision);
  const resultado = estrategia.aplicar(cita, { fecha, hora, monto, quien });
  eventos.emit('cita:no-asistio', { citaId: cita.id, decision: estrategia.nombre });
  const citaParaMensaje = resultado.nueva || cita;
  return { ...resultado, mensaje: mensajeDeCita(citaParaMensaje, estrategia.tipoMensaje, { ...resultado.datosMensaje, anticipo: cita.anticipo }) };
}
