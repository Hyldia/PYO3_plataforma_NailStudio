// CONTROLADOR: servicios, especialistas y productos (consultas públicas).
// Los controladores reciben la petición, piden datos a los modelos y responden.
import { ServicioModel } from '../models/ServicioModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { ProductoModel } from '../models/ProductoModel.js';

export const catalogoController = {
  listarServicios: (req, res) => res.json(ServicioModel.listarActivos()),
  listarEspecialistas: (req, res) => res.json(EspecialistaModel.listar()),
  listarProductos: (req, res) => res.json(ProductoModel.buscar(req.query)),
  listarCategoriasProductos: (req, res) => res.json(ProductoModel.categorias())
};
