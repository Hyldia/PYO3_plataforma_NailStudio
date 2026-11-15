// CONTROLADOR: compras de la tienda (finalizar compra).
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';
import { CuponModel } from '../models/CuponModel.js';
import { crearMetodoPago } from '../patterns/pagos.js';
import { calcularPrecioPedido } from '../patterns/precio.js';

// Los precios se leen de la base de datos, no del navegador
function armarLineas(items = []) {
  return items.map(({ productoId, cantidad, detalle }) => {
    const p = ProductoModel.buscarPorId(productoId);
    if (!p) throw new Error('Uno de los productos ya no está disponible.');
    if (p.stock === 0) throw new Error(`${p.nombre} se agotó. Quítalo del carrito para continuar.`);
    return { productoId: p.id, nombre: p.nombre, precio: p.precio, precioAnterior: p.precio_anterior, cantidad: Math.max(1, Number(cantidad) || 1), detalle: detalle ? String(detalle).slice(0, 300) : null };
  });
}

// Total con el cupón aplicado (patrón Decorator). Devuelve { error } si el cupón no sirve.
function cotizar(lineas, codigo) {
  const base = calcularPrecioPedido(lineas);
  if (!codigo) return { ...base, cupon: null };
  const v = CuponModel.validar(codigo, { subtotal: base.subtotal, esCombo: false });
  if (v.error) return { error: v.error };
  return { ...calcularPrecioPedido(lineas, v.cupon), cupon: { codigo: v.cupon.codigo, descripcion: v.cupon.descripcion } };
}

export const pedidoController = {
  // POST /api/pedidos/cotizar: el resumen del pedido antes de pagar
  cotizar(req, res) {
    const { items = [], cupon } = req.body;
    if (!items.length) return res.status(400).json({ error: 'No hay artículos seleccionados.' });
    const lineas = armarLineas(items);
    const c = cotizar(lineas, cupon);
    if (c.error) return res.status(400).json({ error: c.error });
    const sinOfertas = lineas.reduce((s, l) => s + (l.precioAnterior || l.precio) * l.cantidad, 0);
    res.json({ ...c, sinOfertas, ahorroOfertas: sinOfertas - c.subtotal });
  },

  crear(req, res) {
    const { items = [], cliente = {}, metodoPago, pago, cupon, notas } = req.body;
    if (!items.length) return res.status(400).json({ error: 'El carrito está vacío.' });
    const errorCliente = PedidoModel.validarCliente(cliente);
    if (errorCliente) return res.status(400).json({ error: errorCliente });

    const lineas = armarLineas(items);
    const c = cotizar(lineas, cupon);
    if (c.error) return res.status(400).json({ error: c.error });

    const metodo = crearMetodoPago(metodoPago);
    const cobro = metodo.cobrar(c.total, pago);
    if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

    const pedido = PedidoModel.crear(cliente, lineas, metodo.nombre, {
      total: c.total, descuento: c.descuento, cupon: c.cupon?.codigo, notas: notas ? String(notas).slice(0, 300) : null, referencia: cobro.referencia
    });
    if (c.cupon) CuponModel.registrarUso(c.cupon.codigo);
    res.status(201).json({ ...pedido, descuento: c.descuento, metodo: metodo.nombre, referenciaPago: cobro.referencia, requiereVerificacion: Boolean(cobro.requiereVerificacion) });
  }
};
