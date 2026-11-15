// CONTROLADOR: administración de productos y pedidos desde el panel.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/connection.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { getDb } from '../db/connection.js';

export const productoAdminController = {
  cambiarImagen(req, res) {
    const producto = ProductoModel.buscarPorId(req.params.id);
    if (!producto || !req.file) return res.status(400).json({ error: 'Producto o imagen no válidos.' });
    if (producto.imagen && !producto.imagen.startsWith('http')) unlink(join(UPLOADS_DIR, producto.imagen)).catch(() => {});
    ProductoModel.cambiarImagen(producto.id, req.file.filename);
    res.json(ProductoModel.buscarPorId(producto.id));
  },

  // Foto real de una especialista (subida desde el panel)
  fotoEspecialista(req, res) {
    const e = EspecialistaModel.buscarPorId(req.params.id);
    if (!e || !req.file) return res.status(400).json({ error: 'Especialista o imagen no válidas.' });
    if (e.foto && !e.foto.startsWith('http')) unlink(join(UPLOADS_DIR, e.foto)).catch(() => {});
    getDb().prepare('UPDATE especialistas SET foto = ?, foto_autor = NULL, foto_autor_url = NULL WHERE id = ?').run(req.file.filename, e.id);
    res.json(EspecialistaModel.buscarPorId(e.id));
  },

  listarPedidos: (req, res) => res.json(PedidoModel.listarRecientes())
};
