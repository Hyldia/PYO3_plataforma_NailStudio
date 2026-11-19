// CONTROLADOR: finalizar compra. Un mismo pedido puede traer productos de la tienda
// y citas (una por persona, cada una con un solo diseño).
import { getDb } from '../db/conexion.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';
import { CuponModel } from '../models/CuponModel.js';
import { CitaModel, PORCENTAJE_ADELANTO } from '../models/CitaModel.js';
import { ServicioModel } from '../models/ServicioModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { DisenoModel } from '../models/DisenoModel.js';
import { crearMetodoPago } from '../patrones/estrategiaPagos.js';
import { calcularPrecioPedido } from '../patrones/decoradorPrecio.js';
import { eventos } from '../patrones/observadorEventos.js';
import { UsuarioModel } from '../models/UsuarioModel.js';
import { FotoModel } from '../models/FotoModel.js';

// Envío a domicilio (solo productos; las citas son en el salón). Se cambia con la variable COSTO_ENVIO.
export const COSTO_ENVIO = Number(process.env.COSTO_ENVIO ?? 2500);

const error = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

// Productos: los precios se leen de la base de datos, no del navegador
function armarProductos(items = []) {
  return items.map(({ productoId, cantidad, detalle }) => {
    const p = ProductoModel.buscarPorId(productoId);
    if (!p) throw error('Uno de los productos ya no está disponible.');
    if (p.stock === 0) throw error(`${p.nombre} se agotó. Quítalo del carrito para continuar.`);
    return { tipo: 'producto', productoId: p.id, nombre: p.nombre, precio: p.precio, precioAnterior: p.precio_anterior,
      cantidad: Math.max(1, Number(cantidad) || 1), detalle: detalle ? String(detalle).slice(0, 300) : null };
  });
}

// Citas: una por persona, cantidad siempre 1, un solo diseño. Se revisa que la hora siga libre
// y que el mismo carrito no tenga dos citas a la misma hora con la misma especialista.
function armarCitas(citas = []) {
  const usadas = new Set();
  return citas.map((c) => {
    const servicio = ServicioModel.buscarPorId(c.servicioId);
    const especialista = EspecialistaModel.buscarPorId(c.especialistaId);
    if (!servicio || !especialista) throw error('Revisa la cita: falta el servicio o la especialista.');
    if (!CitaModel.esFechaValida(c.fecha) || !CitaModel.esHoraValida(c.hora)) throw error('Revisa la fecha y la hora de la cita.');
    const clave = `${especialista.id}|${c.fecha}|${c.hora}`;
    if (usadas.has(clave)) throw error(`Hay dos citas con ${especialista.nombre} a las ${c.hora}. Cambia la hora de una.`);
    usadas.add(clave);
    if (!CitaModel.horaDisponible(especialista.id, c.fecha, c.hora)) throw error(`La hora ${c.hora} con ${especialista.nombre} ya no está disponible. Cámbiala en el carrito.`, 409);
    const diseno = c.disenoId ? DisenoModel.buscarPorId(c.disenoId) : null;
    // Si la foto de la galería tiene su propio precio, ese es el que se cobra
    const precioFoto = c.fotoRefId ? FotoModel.buscarPorId(c.fotoRefId)?.precio : null;
    const precio = (precioFoto ?? servicio.precio_oferta ?? servicio.precio) + (diseno?.precio || 0);
    return { tipo: 'cita', servicio, especialista, diseno, precio, precioAnterior: precioFoto == null && servicio.precio_oferta != null ? servicio.precio + (diseno?.precio || 0) : null,
      cantidad: 1, fecha: c.fecha, hora: c.hora, fotoRefId: c.fotoRefId || null,
      persona: c.persona ? String(c.persona).trim().slice(0, 60) : null, notas: c.notas ? String(c.notas).slice(0, 500) : null };
  });
}

// Total con cupón (patrón Decorator) y cuánto se paga hoy: productos completos + 30 % de las citas
function cotizar(productos, citas, codigo, metodoPago, entrega = 'retiro') {
  const lineas = [...productos, ...citas];
  let base = calcularPrecioPedido(lineas);
  let cupon = null;
  if (codigo) {
    const v = CuponModel.validar(codigo, { subtotal: base.subtotal, esCombo: citas.some((c) => c.servicio.es_combo) });
    if (v.error) throw error(v.error);
    cupon = v.cupon;
    base = calcularPrecioPedido(lineas, cupon);
  }
  const factor = base.subtotal ? base.total / base.subtotal : 1;
  const subProductos = productos.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const productosNeto = Math.round(subProductos * factor);
  const citasNeto = base.total - productosNeto;
  const envio = entrega === 'envio' && productos.length ? COSTO_ENVIO : 0;
  if (envio && metodoPago === 'salon') throw error('Para el envío a domicilio paga con SINPE Móvil o tarjeta.');
  const anticipo = metodoPago === 'salon' ? 0 : Math.round(citasNeto * PORCENTAJE_ADELANTO);
  const pagasHoy = metodoPago === 'salon' ? 0 : productosNeto + envio + anticipo;
  const sinOfertas = lineas.reduce((s, l) => s + (l.precioAnterior || l.precio) * l.cantidad, 0);
  return { ...base, total: base.total + envio, envio, cupon, factor, productosNeto, citasNeto, anticipo, pagasHoy, enSalon: base.total + envio - pagasHoy, sinOfertas, ahorroOfertas: sinOfertas - base.subtotal };
}

const publico = (c) => ({ subtotal: c.subtotal, total: c.total, envio: c.envio, costoEnvio: COSTO_ENVIO, descuento: c.descuento, detalle: c.detalle,
  cupon: c.cupon ? { codigo: c.cupon.codigo, descripcion: c.cupon.descripcion } : null,
  productosNeto: c.productosNeto, citasNeto: c.citasNeto, anticipo: c.anticipo, pagasHoy: c.pagasHoy, enSalon: c.enSalon,
  sinOfertas: c.sinOfertas, ahorroOfertas: c.ahorroOfertas });

export const pedidoController = {
  // POST /api/pedidos/cotizar: el resumen antes de pagar
  cotizar(req, res) {
    const { items = [], citas = [], cupon, metodoPago = 'sinpe', entrega = 'retiro' } = req.body;
    if (!items.length && !citas.length) return res.status(400).json({ error: 'No hay nada seleccionado.' });
    res.json(publico(cotizar(armarProductos(items), armarCitas(citas), cupon, metodoPago, entrega)));
  },

  crear(req, res) {
    const { items = [], citas: citasPedidas = [], metodoPago, pago, cupon, notas, entrega = 'retiro', direccionId } = req.body;
    if (!items.length && !citasPedidas.length) return res.status(400).json({ error: 'El carrito está vacío.' });
    // La clienta tiene cuenta (middleware soloUsuario): sus datos vienen de la cuenta
    const u = req.usuario;
    const cliente = { nombre: req.body.cliente?.nombre || u.nombre, telefono: req.body.cliente?.telefono || u.telefono || '', email: u.correo };
    let direccion = null;
    if (entrega === 'envio' && items.length) {
      const d = UsuarioModel.direccion(u.id, direccionId);
      if (!d) return res.status(400).json({ error: 'Elige la dirección de envío.' });
      direccion = UsuarioModel.textoDireccion(d);
    }
    const errorCliente = PedidoModel.validarCliente(cliente);
    if (errorCliente) return res.status(400).json({ error: errorCliente });

    const productos = armarProductos(items);
    const citas = armarCitas(citasPedidas);
    const c = cotizar(productos, citas, cupon, metodoPago, direccion ? 'envio' : 'retiro');

    // Strategy + Factory: se cobra lo que toca pagar hoy
    const metodo = crearMetodoPago(metodoPago);
    const cobro = metodo.cobrar(c.pagasHoy, pago);
    if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

    // Todo o nada: si una cita se ocupó en este momento, no se guarda nada
    const resultado = getDb().transaction(() => {
      const pedido = productos.length ? PedidoModel.crear(cliente, productos, metodo.nombre, {
        total: c.productosNeto + c.envio, usuarioId: u.id, entrega: direccion ? 'envio' : 'retiro', direccion, costoEnvio: c.envio, descuento: Math.round(productos.reduce((s, l) => s + l.precio * l.cantidad, 0) * (1 - c.factor)),
        cupon: c.cupon?.codigo, notas: notas ? String(notas).slice(0, 300) : null, referencia: cobro.referencia
      }) : null;
      const creadas = citas.map((l) => {
        if (!CitaModel.horaDisponible(l.especialista.id, l.fecha, l.hora)) throw error(`La hora ${l.hora} con ${l.especialista.nombre} se acaba de ocupar.`, 409);
        const total = Math.round(l.precio * c.factor);
        return CitaModel.crear({
          servicioId: l.servicio.id, especialistaId: l.especialista.id, disenoId: l.diseno?.id ?? null, fotoRefId: l.fotoRefId,
          nombre: l.persona || cliente.nombre.trim(), telefono: cliente.telefono.trim(), email: cliente.email?.trim() || null,
          notas: [l.persona ? `Viene con ${cliente.nombre.trim()}` : null, l.notas].filter(Boolean).join('. ') || null,
          fecha: l.fecha, hora: l.hora, estado: cobro.requiereVerificacion ? 'pendiente' : 'confirmada',
          total, anticipo: metodoPago === 'salon' ? 0 : Math.round(total * PORCENTAJE_ADELANTO),
          cuponCodigo: c.cupon?.codigo ?? null, descuento: l.precio - total, metodoPago: metodo.nombre, pedidoId: pedido?.id ?? null, usuarioId: u.id
        });
      });
      return { pedido, creadas };
    })();

    if (c.cupon) CuponModel.registrarUso(c.cupon.codigo);
    // Observer: recordatorios por WhatsApp para cada cita
    resultado.creadas.forEach((cita) => eventos.emit('cita:creada', { cita, recordatorios: { whatsapp: true } }));
    res.status(201).json({
      id: resultado.pedido?.id ?? null, citas: resultado.creadas, total: c.total, descuento: c.descuento,
      pagado: c.pagasHoy, enSalon: c.enSalon, envio: c.envio, direccion, metodo: metodo.nombre, referenciaPago: cobro.referencia, requiereVerificacion: Boolean(cobro.requiereVerificacion)
    });
  }
};
