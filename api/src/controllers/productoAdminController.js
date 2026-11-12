// CONTROLADOR: administración de productos y pedidos desde el panel.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/connection.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';

export const productoAdminController = {
  cambiarImagen(req, res) {
    const producto = ProductoModel.buscarPorId(req.params.id);
    if (!producto || !req.file) return res.status(400).json({ error: 'Producto o imagen no válidos.' });
    if (producto.imagen) unlink(join(UPLOADS_DIR, producto.imagen)).catch(() => {});
    ProductoModel.cambiarImagen(producto.id, req.file.filename);
    res.json(ProductoModel.buscarPorId(producto.id));
  },

  listarPedidos: (req, res) => res.json(PedidoModel.listarRecientes())
};
