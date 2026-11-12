// CONTROLADOR: reservas. Coordina modelos y patrones:
// Strategy + Factory para cobrar, State para cambiar el estado y Observer para los recordatorios.
import { CitaModel } from '../models/CitaModel.js';
import { ServicioModel } from '../models/ServicioModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { DisenoModel } from '../models/DisenoModel.js';
import { RecordatorioModel } from '../models/RecordatorioModel.js';
import { crearMetodoPago } from '../patterns/pagos.js';
import { aplicarAccion } from '../patterns/estadoCita.js';
import { eventos } from '../patterns/eventos.js';

export const citaController = {
  disponibilidad(req, res) {
    const { especialistaId, fecha } = req.query;
    if (!especialistaId || !CitaModel.esFechaValida(fecha)) return res.status(400).json({ error: 'Indica especialista y fecha.' });
    res.json(CitaModel.disponibilidad(Number(especialistaId), fecha));
  },

  crear(req, res) {
    const { servicioId, especialistaId, disenoId, fotoRefId, fecha, hora, cliente = {}, notas, metodoPago, pago, recordatorios = {} } = req.body;

    const servicio = ServicioModel.buscarPorId(servicioId);
    if (!servicio) return res.status(400).json({ error: 'Elige un servicio.' });
    if (!EspecialistaModel.buscarPorId(especialistaId)) return res.status(400).json({ error: 'Elige una especialista.' });
    if (!CitaModel.esFechaValida(fecha) || !CitaModel.esHoraValida(hora)) return res.status(400).json({ error: 'Elige una fecha y una hora.' });
    const errorCliente = CitaModel.validarCliente(cliente);
    if (errorCliente) return res.status(400).json({ error: errorCliente });
    if (CitaModel.horasOcupadas(especialistaId, fecha).includes(hora)) {
      return res.status(409).json({ error: 'Esa hora se acaba de ocupar. Elige otra, por favor.' });
    }

    const diseno = disenoId ? DisenoModel.buscarPorId(disenoId) : null;
    const { total, anticipo } = CitaModel.calcularMontos(servicio.precio, diseno?.precio, metodoPago);

    // Strategy + Factory: el controlador no sabe cómo cobra cada método
    const metodo = crearMetodoPago(metodoPago);
    const cobro = metodo.cobrar(anticipo, pago);
    if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

    const cita = CitaModel.crear({
      servicioId, especialistaId, disenoId: diseno?.id ?? null, fotoRefId: fotoRefId || null,
      nombre: cliente.nombre.trim(), telefono: cliente.telefono.trim(), email: cliente.email?.trim() || null,
      notas: notas?.slice(0, 500) || null, fecha, hora,
      estado: cobro.requiereVerificacion ? 'pendiente' : 'confirmada',
      total, anticipo, metodoPago: metodo.nombre
    });

    // Observer: quien esté suscrito (recordatorios) reacciona sin que el controlador lo conozca
    eventos.emit('cita:creada', { cita, recordatorios });
    res.status(201).json({ ...cita, recordatorios: RecordatorioModel.listarDeCita(cita.id), referenciaPago: cobro.referencia });
  },

  // Panel del salón
  listarDelDia: (req, res) => res.json(CitaModel.listarDelDia(req.query.fecha)),

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
