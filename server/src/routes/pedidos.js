import { Router } from 'express';
import { catalogoRepo } from '../repositories/catalogoRepo.js';
import { pedidosRepo } from '../repositories/pedidosRepo.js';
import { crearMetodoPago } from '../patterns/pagos.js';

const r = Router();

r.post('/', (req, res) => {
  const { items = [], cliente = {}, metodoPago, pago } = req.body;
  if (!items.length) return res.status(400).json({ error: 'El carrito está vacío.' });
  if (!cliente.nombre || !/^[\d\s+-]{8,15}$/.test(cliente.telefono || '')) {
    return res.status(400).json({ error: 'Escribe tu nombre y un teléfono para avisarte cuando el pedido esté listo.' });
  }

  // Los precios se leen de la base de datos, no del navegador
  const lineas = items.map(({ productoId, cantidad }) => {
    const p = catalogoRepo.producto(productoId);
    if (!p) throw new Error('Uno de los productos ya no está disponible.');
    return { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: Math.max(1, Number(cantidad) || 1) };
  });
  const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);

  const metodo = crearMetodoPago(metodoPago);
  const cobro = metodo.cobrar(total, pago);
  if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

  res.status(201).json({ ...pedidosRepo.crear(cliente, lineas, metodo.nombre), referenciaPago: cobro.referencia });
});

export default r;
