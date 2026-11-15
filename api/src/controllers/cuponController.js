// CONTROLADOR: cupones visibles y validación antes de reservar.
import { CuponModel } from '../models/CuponModel.js';
import { ServicioModel } from '../models/ServicioModel.js';
import { CitaModel } from '../models/CitaModel.js';

export const cuponController = {
  listar: (req, res) => res.json(CuponModel.listarPublicos()),

  // GET /api/cupones/validar?codigo=X&servicioId=1&recargo=2000
  validar(req, res) {
    const servicio = ServicioModel.buscarPorId(req.query.servicioId);
    if (!servicio) return res.status(400).json({ error: 'Elige primero un servicio.' });
    const recargo = Number(req.query.recargo) || 0;
    const subtotal = CitaModel.calcularMontos(servicio, recargo, 'salon').total;
    const v = CuponModel.validar(req.query.codigo, { subtotal, esCombo: Boolean(servicio.es_combo) });
    if (v.error) return res.status(400).json({ error: v.error });
    const { total, descuento, detalle } = CitaModel.calcularMontos(servicio, recargo, 'salon', v.cupon);
    res.json({ codigo: v.cupon.codigo, descripcion: v.cupon.descripcion, subtotal, descuento, total, detalle });
  }
};
