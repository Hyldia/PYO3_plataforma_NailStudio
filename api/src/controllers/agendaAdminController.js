// CONTROLADOR de la agenda del panel: calendario del mes, cancelaciones y avisos por WhatsApp.
// Solo recibe la petición y responde; las reglas están en servicios/citaServicio.js.
import { CitaModel } from '../models/CitaModel.js';
import { MensajeModel } from '../models/MensajeModel.js';
import { TIPOS_MENSAJE } from '../patrones/plantillaMensajes.js';
import { cancelarCita, mensajeDeCita, revisarCancelacion } from '../servicios/citaServicio.js';
import { registrarNoAsistio } from '../servicios/inasistenciaServicio.js';

const MES = /^\d{4}-\d{2}$/;

export const agendaAdminController = {
  // Nombre: calendario
  // Descripción: Trae las citas de un rango de fechas para el calendario.
  // Entrada: Las fechas a mostrar.
  // Salida: La lista de citas.
  // Objetivo: Ver la agenda en el panel.
  calendario(req, res) {
    const mes = MES.test(req.query.mes || '') ? req.query.mes : new Date().toISOString().slice(0, 7);
    res.json({ mes, dias: CitaModel.resumenMes(mes) });
  },

  // Nombre: tiposMensaje
  // Descripción: Entrega los tipos de mensaje que se pueden enviar.
  // Entrada: Nada.
  // Salida: La lista de tipos de mensaje.
  // Objetivo: Llenar el menú de avisos del panel.
  tiposMensaje: (req, res) => res.json(TIPOS_MENSAJE),

  // Nombre: cancelar
  // Descripción: Cancela una cita desde el panel.
  // Entrada: El número de la cita y el motivo.
  // Salida: La cita cancelada y el aviso.
  // Objetivo: Que la dueña pueda cancelar citas.
  cancelar(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    try { revisarCancelacion(cita, req.body); } catch (e) { return res.status(e.codigo || 400).json({ error: e.message }); }
    res.json(cancelarCita(cita, req.body));
  },

  // Emergencia: cancela todas las citas activas de un día (o solo las de una especialista)
  // Nombre: emergencia
  // Descripción: Cancela todas las citas de un día por una emergencia.
  // Entrada: La fecha y el motivo.
  // Salida: Cuántas citas se cancelaron y sus avisos.
  // Objetivo: Avisar rápido a todas las clientas del día.
  // Nombre: noAsistio
  // Descripción: La dueña marca que la clienta no llegó y decide si se reprograma o se cobra.
  // Entrada: El número de cita y { decision, fecha, hora, monto }.
  // Salida: La cita, la nueva (si se reprogramó) y el mensaje de WhatsApp.
  // Objetivo: Controlar las citas perdidas.
  noAsistio(req, res) {
    try { res.json(registrarNoAsistio(CitaModel.buscarPorId(req.params.id), { ...req.body, quien: 'la dueña' })); } catch (e) { res.status(e.codigo || 400).json({ error: e.message }); }
  },

  emergencia(req, res) {
    const { fecha, especialistaId, motivo, tipo = 'cancelacion', nota } = req.body;
    if (!CitaModel.esFechaValida(fecha)) return res.status(400).json({ error: 'Elige el día.' });
    if (!motivo || motivo.trim().length < 3) return res.status(400).json({ error: 'Escribe el motivo para avisarles a las clientas.' });
    const citas = CitaModel.activasDelDia(fecha, especialistaId ? Number(especialistaId) : null);
    if (!citas.length) return res.status(404).json({ error: 'No hay citas activas ese día.' });
    res.json(citas.map((c) => cancelarCita(c, { motivo: motivo.trim(), tipo, nota })));
  },

  // Nombre: mensaje
  // Descripción: Prepara un mensaje para una clienta sobre su cita.
  // Entrada: La cita y el tipo de mensaje.
  // Salida: El mensaje listo para enviar.
  // Objetivo: Comunicarse con la clienta.
  mensaje(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
    try { res.json(mensajeDeCita(cita, req.body.tipo || 'recordatorio', req.body, Boolean(req.body.soloVista))); } catch (e) { res.status(400).json({ error: e.message }); }
  },

  // Nombre: mensajes
  // Descripción: Muestra los últimos mensajes preparados.
  // Entrada: Cuántos mostrar.
  // Salida: La lista de mensajes.
  // Objetivo: Llevar control de los avisos.
  mensajes: (req, res) => res.json(MensajeModel.listar(req.query.limite)),

  // Nombre: mensajeEnviado
  // Descripción: Marca un mensaje como ya enviado.
  // Entrada: El número del mensaje.
  // Salida: Nada.
  // Objetivo: Saber qué avisos ya salieron.
  mensajeEnviado(req, res) { MensajeModel.marcarEnviado(req.params.id); res.status(204).end(); }
};
