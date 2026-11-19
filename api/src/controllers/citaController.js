// CONTROLADOR: reservas. Coordina modelos y patrones:
// Strategy + Factory para cobrar, State para cambiar el estado y Observer para los recordatorios.
import { CitaModel } from '../models/CitaModel.js';
import { ServicioModel } from '../models/ServicioModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { DisenoModel } from '../models/DisenoModel.js';
import { RecordatorioModel } from '../models/RecordatorioModel.js';
import { crearMetodoPago } from '../patrones/estrategiaPagos.js';
import { aplicarAccion } from '../patrones/estadoCita.js';
import { eventos } from '../patrones/observadorEventos.js';
import { CuponModel } from '../models/CuponModel.js';
import { FotoModel } from '../models/FotoModel.js';

export const citaController = {
  disponibilidad(req, res) {
    const { especialistaId, fecha } = req.query;
    if (!especialistaId || !CitaModel.esFechaValida(fecha)) return res.status(400).json({ error: 'Indica especialista y fecha.' });
    res.json(CitaModel.disponibilidad(Number(especialistaId), fecha));
  },

  // GET /api/citas/libres?fecha=2026-11-20&hora=10:00 → especialistas libres a esa hora
  libres(req, res) {
    const { fecha, hora } = req.query;
    if (!CitaModel.esFechaValida(fecha) || !CitaModel.esHoraValida(hora)) return res.status(400).json({ error: 'Indica fecha y hora.' });
    res.json(EspecialistaModel.listar().filter((e) => CitaModel.horaDisponible(e.id, fecha, hora)).map((e) => e.id));
  },

  // GET /api/especialistas/:id/agenda: próximos días con horas libres
  agenda(req, res) {
    if (!EspecialistaModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No encontramos a esa especialista.' });
    res.json(CitaModel.agenda(Number(req.params.id), Math.min(Number(req.query.dias) || 10, 30)));
  },

  crear(req, res) {
    const { servicioId, especialistaId, disenoId, fotoRefId, fecha, hora, cliente = {}, notas, metodoPago, pago, recordatorios = {}, cupon: codigoCupon } = req.body;

    const base = ServicioModel.buscarPorId(servicioId);
    if (!base) return res.status(400).json({ error: 'Elige un servicio.' });
    // Si la foto de la galería tiene su propio precio, ese es el que se cobra
    const precioFoto = fotoRefId ? FotoModel.buscarPorId(fotoRefId)?.precio : null;
    const servicio = precioFoto != null ? { ...base, precio: precioFoto, precio_oferta: null } : base;
    if (!EspecialistaModel.buscarPorId(especialistaId)) return res.status(400).json({ error: 'Elige una especialista.' });
    if (!CitaModel.esFechaValida(fecha) || !CitaModel.esHoraValida(hora)) return res.status(400).json({ error: 'Elige una fecha y una hora.' });
    const errorCliente = CitaModel.validarCliente(cliente);
    if (errorCliente) return res.status(400).json({ error: errorCliente });
    if (!CitaModel.horaDisponible(especialistaId, fecha, hora)) {
      return res.status(409).json({ error: 'Esa hora ya no está disponible. Elige otra, por favor.' });
    }

    const diseno = disenoId ? DisenoModel.buscarPorId(disenoId) : null;
    // Cupón opcional: se valida contra el subtotal (servicio + diseño)
    let cupon = null;
    if (codigoCupon) {
      const subtotal = CitaModel.calcularMontos(servicio, diseno?.precio, metodoPago).total;
      const v = CuponModel.validar(codigoCupon, { subtotal, esCombo: Boolean(servicio.es_combo) });
      if (v.error) return res.status(400).json({ error: v.error });
      cupon = v.cupon;
    }
    const { total, descuento, anticipo } = CitaModel.calcularMontos(servicio, diseno?.precio, metodoPago, cupon);

    // Strategy + Factory: el controlador no sabe cómo cobra cada método
    const metodo = crearMetodoPago(metodoPago);
    const cobro = metodo.cobrar(anticipo, pago);
    if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

    const cita = CitaModel.crear({
      servicioId, especialistaId, disenoId: diseno?.id ?? null, fotoRefId: fotoRefId || null,
      nombre: cliente.nombre.trim(), telefono: cliente.telefono.trim(), email: cliente.email?.trim() || null,
      notas: notas?.slice(0, 500) || null, fecha, hora,
      estado: cobro.requiereVerificacion ? 'pendiente' : 'confirmada',
      total, anticipo, cuponCodigo: cupon?.codigo ?? null, descuento, metodoPago: metodo.nombre
    });

    // Observer: quien esté suscrito (recordatorios) reacciona sin que el controlador lo conozca
    if (cupon) CuponModel.registrarUso(cupon.codigo);
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
