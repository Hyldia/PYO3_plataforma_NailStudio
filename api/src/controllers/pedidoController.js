// CONTROLADOR: compras de la tienda.
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';
import { crearMetodoPago } from '../patterns/pagos.js';

export const pedidoController = {
  crear(req, res) {
    const { items = [], cliente = {}, metodoPago, pago } = req.body;
    if (!items.length) return res.status(400).json({ error: 'El carrito está vacío.' });
    const errorCliente = PedidoModel.validarCliente(cliente);
    if (errorCliente) return res.status(400).json({ error: errorCliente });

    // Los precios se leen de la base de datos, no del navegador
    const lineas = items.map(({ productoId, cantidad }) => {
      const p = ProductoModel.buscarPorId(productoId);
      if (!p) throw new Error('Uno de los productos ya no está disponible.');
      return { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: Math.max(1, Number(cantidad) || 1) };
    });
    const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);

    const metodo = crearMetodoPago(metodoPago);
    const cobro = metodo.cobrar(total, pago);
    if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

    res.status(201).json({ ...PedidoModel.crear(cliente, lineas, metodo.nombre), referenciaPago: cobro.referencia });
  }
};
