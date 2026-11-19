// CONTROLADOR: reseñas de productos.
import { ResenaModel } from '../models/ResenaModel.js';
import { ProductoModel } from '../models/ProductoModel.js';

export const resenaController = {
  // Nombre: listar
  // Descripción: Lista las reseñas.
  // Entrada: Nada.
  // Salida: La lista de reseñas.
  // Objetivo: Mostrar opiniones del salón.
  listar(req, res) {
    const id = Number(req.params.id);
    if (!ProductoModel.buscarPorId(id)) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(ResenaModel.deProducto(id, req.query.limite, req.query.filtro));
  },
  // Nombre: crear
  // Descripción: Guarda una reseña.
  // Entrada: El texto y las estrellas.
  // Salida: La reseña creada.
  // Objetivo: Que las clientas opinen.
  crear(req, res) {
    const id = Number(req.params.id);
    if (!ProductoModel.buscarPorId(id)) return res.status(404).json({ error: 'Producto no encontrado.' });
    const error = ResenaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    const { nombre, estrellas, comentario, pedido, telefono } = req.body;
    const r = ResenaModel.crear(id, { nombre: String(nombre).trim().slice(0, 60), estrellas: Number(estrellas), comentario: String(comentario).trim(), pedido, telefono });
    res.status(201).json(r);
  }
};
