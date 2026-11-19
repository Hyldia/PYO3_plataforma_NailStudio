// CONTROLADOR: servicios, especialistas y productos (consultas públicas).
// Los controladores reciben la petición, piden datos a los modelos y responden.
import { ServicioModel } from '../models/ServicioModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { ProductoModel } from '../models/ProductoModel.js';

export const catalogoController = {
  // Nombre: listarServicios
  // Descripción: Lista los servicios activos.
  // Entrada: Nada.
  // Salida: La lista de servicios.
  // Objetivo: Mostrar la carta de servicios.
  listarServicios: (req, res) => res.json(ServicioModel.listarActivos()),
  // Nombre: listarEspecialistas
  // Descripción: Lista las especialistas.
  // Entrada: Nada.
  // Salida: La lista del equipo.
  // Objetivo: Elegir especialista al reservar.
  listarEspecialistas: (req, res) => res.json(EspecialistaModel.listar()),
  // Nombre: listarProductos
  // Descripción: Busca productos de la tienda.
  // Entrada: Los filtros de búsqueda.
  // Salida: La lista de productos.
  // Objetivo: Mostrar la tienda.
  listarProductos: (req, res) => res.json(ProductoModel.buscar(req.query)),
  // Nombre: listarCategoriasProductos
  // Descripción: Lista las categorías de productos.
  // Entrada: Nada.
  // Salida: Las categorías con su cantidad.
  // Objetivo: Llenar el filtro de categorías.
  listarCategoriasProductos: (req, res) => res.json(ProductoModel.categorias())
};
