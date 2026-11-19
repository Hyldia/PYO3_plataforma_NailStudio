// CONTROLADOR: cupones visibles (se esconden como premios en el sitio). La validación se hace al pagar, en pedidoController.
import { CuponModel } from '../models/CuponModel.js';

export const cuponController = {
  // Nombre: listar
  // Descripción: Lista los cupones vigentes.
  // Entrada: Nada.
  // Salida: La lista de cupones.
  // Objetivo: Esconderlos como premios en el sitio.
  listar: (req, res) => res.json(CuponModel.listarPublicos())
};
