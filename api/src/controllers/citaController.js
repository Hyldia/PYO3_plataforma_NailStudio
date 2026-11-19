// CONTROLADOR: disponibilidad de horarios y estado de las citas (las citas se crean al pagar, en pedidoController).
// Usa State para cambiar el estado y Observer para avisar de los cambios.
import { CitaModel } from '../models/CitaModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { aplicarAccion } from '../patrones/estadoCita.js';
import { eventos } from '../patrones/observadorEventos.js';

export const citaController = {
  // Nombre: disponibilidad
  // Descripción: Revisa qué días tienen espacio.
  // Entrada: El servicio y el mes.
  // Salida: Los días con horas libres.
  // Objetivo: Pintar el calendario de reservas.
  disponibilidad(req, res) {
    const { especialistaId, fecha } = req.query;
    if (!especialistaId || !CitaModel.esFechaValida(fecha)) return res.status(400).json({ error: 'Indica especialista y fecha.' });
    res.json(CitaModel.disponibilidad(Number(especialistaId), fecha));
  },

  // GET /api/citas/libres?fecha=2026-11-20&hora=10:00 → especialistas libres a esa hora
  // Nombre: libres
  // Descripción: Busca las horas libres de un día.
  // Entrada: El servicio, la especialista y la fecha.
  // Salida: Las horas disponibles.
  // Objetivo: Que la clienta elija su hora.
  libres(req, res) {
    const { fecha, hora } = req.query;
    if (!CitaModel.esFechaValida(fecha) || !CitaModel.esHoraValida(hora)) return res.status(400).json({ error: 'Indica fecha y hora.' });
    res.json(EspecialistaModel.listar().filter((especialista) => CitaModel.horaDisponible(especialista.id, fecha, hora)).map((especialista) => especialista.id));
  },

  // GET /api/especialistas/:id/agenda: próximos días con horas libres
  // Nombre: agenda
  // Descripción: Trae la agenda de un día.
  // Entrada: La fecha.
  // Salida: Las citas de ese día.
  // Objetivo: Ver quién viene.
  agenda(req, res) {
    if (!EspecialistaModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No encontramos a esa especialista.' });
    res.json(CitaModel.agenda(Number(req.params.id), Math.min(Number(req.query.dias) || 10, 30)));
  },


  // Panel del salón
  // Nombre: listarDelDia
  // Descripción: Lista las citas de un día.
  // Entrada: La fecha.
  // Salida: La lista de citas.
  // Objetivo: Ver la agenda diaria.
  listarDelDia: (req, res) => res.json(CitaModel.listarDelDia(req.query.fecha)),

  // Nombre: cambiarEstado
  // Descripción: Cambia el estado de una cita.
  // Entrada: La cita y el estado nuevo.
  // Salida: La cita actualizada.
  // Objetivo: Marcar citas atendidas o canceladas.
  cambiarEstado(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
    // State: cada estado decide si la acción es válida
    const nuevo = aplicarAccion(cita.estado, req.body.accion);
    const actualizada = CitaModel.cambiarEstado(cita.id, nuevo);
    if (nuevo === 'cancelada') eventos.emit('cita:cancelada', { citaId: cita.id });
    res.json(actualizada);
  }
};
