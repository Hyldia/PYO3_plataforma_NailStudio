// CONTROLADOR: administración de productos y pedidos desde el panel.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/connection.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';

function validarProducto(body = {}) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
  const marca = typeof body.marca === 'string' ? body.marca.trim() : '';
  const precio = Number(body.precio);
  const stock = Number(body.stock);

  if (!nombre || !categoria) {
    return {error: 'El nombre y la categoría son obligatorios.' };
  }
  if (body.precio == null || String(body.precio).trim() === '' ||
      !Number.isFinite(precio) || precio < 0) {
    return { error: 'El precio debe ser un número igual o mayor que cero.' };
  }
  if (body.stock == null || String(body.stock).trim() === '' ||
      !Number.isInteger(stock) || stock < 0) {
    return { error: 'El stock debe ser un entero igual o mayor que cero.' };
  }
  return{
    datos:{nombre, descripcion: descripcion || null, categoria, marca: marca || null, precio, stock}
  };
}

export const productoAdminController = {
  cambiarImagen(req, res) {
    const producto = ProductoModel.buscarPorId(req.params.id);
    if (!producto || !req.file) return res.status(400).json({ error: 'Producto o imagen no válidos.' });
    if (producto.imagen) unlink(join(UPLOADS_DIR, producto.imagen)).catch(() => {});
    ProductoModel.cambiarImagen(producto.id, req.file.filename);
    res.json(ProductoModel.buscarPorId(producto.id));
  },
  listarPedidos: (req, res) => res.json(PedidoModel.listarRecientes()),
  crear(req, res){
    const validacion = validarProducto(req.body);
    if (validacion.error) {
      return res.status(400).json({ error: validacion.error });
    }
    const producto = ProductoModel.crear(validacion.datos);
    return res.status(201).json(producto);
  },
  actualizar(req, res){
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }
    const validacion = validarProducto(req.body);
    if (validacion.error) {
      return res.status(400).json({ error: validacion.error });
    }

    const resultado = ProductoModel.actualizar(id, validacion.datos);
    if (!resultado.changes) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    return res.json(ProductoModel.buscarPorId(id));
  },
    eliminar(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const producto = ProductoModel.buscarPorId(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    if (ProductoModel.tienePedidos(id)) {
      return res.status(409).json({
        error: 'No se puede eliminar un producto que aparece en pedidos.'
      });
    }

    const resultado = ProductoModel.eliminar(id);
    if (!resultado.changes) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    return res.status(204).end();
  }
};
