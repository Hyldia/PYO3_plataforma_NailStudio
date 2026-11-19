// CONTROLADOR: finalizar compra. Un mismo pedido puede traer productos de la tienda
// y citas (una por persona, cada una con un solo diseño).
import { enTransaccion } from '../db/conexion.js';
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

// Nombre: error
// Descripción: Crea un error con mensaje y código.
// Entrada: El mensaje y el código.
// Salida: El error.
// Objetivo: Avisar problemas claros.
const error = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

// Productos: los precios se leen de la base de datos, no del navegador
// Nombre: armarProductos
// Descripción: Revisa los productos del carrito contra la tienda.
// Entrada: Los productos del carrito.
// Salida: Productos con precio real.
// Objetivo: Que nadie cambie precios desde el navegador.
function armarProductos(items = []) {
  return items.map(({ productoId, cantidad, detalle }) => {
    const producto = ProductoModel.buscarPorId(productoId);
    if (!producto) throw error('Uno de los productos ya no está disponible.');
    if (producto.stock === 0) throw error(`${producto.nombre} se agotó. Quítalo del carrito para continuar.`);
    return { tipo: 'producto', productoId: producto.id, nombre: producto.nombre, precio: producto.precio, precioAnterior: producto.precio_anterior,
      cantidad: Math.max(1, Number(cantidad) || 1), detalle: detalle ? String(detalle).slice(0, 300) : null };
  });
}

// Citas: una por persona, cantidad siempre 1, un solo diseño. Se revisa que la hora siga libre
// y que el mismo carrito no tenga dos citas a la misma hora con la misma especialista.
// Nombre: armarCitas
// Descripción: Revisa las citas del carrito.
// Entrada: Las citas del carrito.
// Salida: Citas con precio real.
// Objetivo: Cobrar el precio correcto.
function armarCitas(citas = []) {
  const usadas = new Set();
  return citas.map((cita) => {
    const servicio = ServicioModel.buscarPorId(cita.servicioId);
    const especialista = EspecialistaModel.buscarPorId(cita.especialistaId);
    if (!servicio || !especialista) throw error('Revisa la cita: falta el servicio o la especialista.');
    if (!CitaModel.esFechaValida(cita.fecha) || !CitaModel.esHoraValida(cita.hora)) throw error('Revisa la fecha y la hora de la cita.');
    const clave = `${especialista.id}|${cita.fecha}|${cita.hora}`;
    if (usadas.has(clave)) throw error(`Hay dos citas con ${especialista.nombre} a las ${cita.hora}. Cambia la hora de una.`);
    usadas.add(clave);
    if (!CitaModel.horaDisponible(especialista.id, cita.fecha, cita.hora)) throw error(`La hora ${cita.hora} con ${especialista.nombre} ya no está disponible. Cámbiala en el carrito.`, 409);
    const diseno = cita.disenoId ? DisenoModel.buscarPorId(cita.disenoId) : null;
    // Si la foto de la galería tiene su propio precio, ese es el que se cobra
    const precioFoto = cita.fotoRefId ? FotoModel.buscarPorId(cita.fotoRefId)?.precio : null;
    const precio = (precioFoto ?? servicio.precio_oferta ?? servicio.precio) + (diseno?.precio || 0);
    return { tipo: 'cita', servicio, especialista, diseno, precio, precioAnterior: precioFoto == null && servicio.precio_oferta != null ? servicio.precio + (diseno?.precio || 0) : null,
      cantidad: 1, fecha: cita.fecha, hora: cita.hora, fotoRefId: cita.fotoRefId || null,
      persona: cita.persona ? String(cita.persona).trim().slice(0, 60) : null, notas: cita.notas ? String(cita.notas).slice(0, 500) : null };
  });
}

// Total con cupón (patrón Decorator) y cuánto se paga hoy: productos completos + 30 % de las citas
// Nombre: cotizar
// Descripción: Calcula el total de la compra.
// Entrada: Productos, citas, cupón, pago y entrega.
// Salida: Subtotal, descuentos, envío y total.
// Objetivo: Cobrar lo justo.
function cotizar(productos, citas, codigo, metodoPago, entrega = 'retiro') {
  const lineas = [...productos, ...citas];
  let base = calcularPrecioPedido(lineas);
  let cupon = null;
  if (codigo) {
    const validacion = CuponModel.validar(codigo, { subtotal: base.subtotal, esCombo: citas.some((cita) => cita.servicio.es_combo) });
    if (validacion.error) throw error(validacion.error);
    cupon = validacion.cupon;
    base = calcularPrecioPedido(lineas, cupon);
  }
  const factor = base.subtotal ? base.total / base.subtotal : 1;
  const subProductos = productos.reduce((suma, producto) => suma + producto.precio * producto.cantidad, 0);
  const productosNeto = Math.round(subProductos * factor);
  const citasNeto = base.total - productosNeto;
  const envio = entrega === 'envio' && productos.length ? COSTO_ENVIO : 0;
  if (envio && metodoPago === 'salon') throw error('Para el envío a domicilio paga con SINPE Móvil o tarjeta.');
  const anticipo = metodoPago === 'salon' ? 0 : Math.round(citasNeto * PORCENTAJE_ADELANTO);
  const pagasHoy = metodoPago === 'salon' ? 0 : productosNeto + envio + anticipo;
  const sinOfertas = lineas.reduce((suma, linea) => suma + (linea.precioAnterior || linea.precio) * linea.cantidad, 0);
  return { ...base, total: base.total + envio, envio, cupon, factor, productosNeto, citasNeto, anticipo, pagasHoy, enSalon: base.total + envio - pagasHoy, sinOfertas, ahorroOfertas: sinOfertas - base.subtotal };
}

// Nombre: publico
// Descripción: Deja solo los datos del total que ve la clienta.
// Entrada: El cálculo completo.
// Salida: Un resumen del total.
// Objetivo: No mostrar datos internos.
const publico = (cotizacion) => ({ subtotal: cotizacion.subtotal, total: cotizacion.total, envio: cotizacion.envio, costoEnvio: COSTO_ENVIO, descuento: cotizacion.descuento, detalle: cotizacion.detalle,
  cupon: cotizacion.cupon ? { codigo: cotizacion.cupon.codigo, descripcion: cotizacion.cupon.descripcion } : null,
  productosNeto: cotizacion.productosNeto, citasNeto: cotizacion.citasNeto, anticipo: cotizacion.anticipo, pagasHoy: cotizacion.pagasHoy, enSalon: cotizacion.enSalon,
  sinOfertas: cotizacion.sinOfertas, ahorroOfertas: cotizacion.ahorroOfertas });

export const pedidoController = {
  // POST /api/pedidos/cotizar: el resumen antes de pagar
  // Nombre: cotizar
  // Descripción: Calcula el total antes de pagar.
  // Entrada: El carrito.
  // Salida: El resumen del total.
  // Objetivo: Mostrar cuánto se paga.
  cotizar(req, res) {
    const { items = [], citas = [], cupon, metodoPago = 'sinpe', entrega = 'retiro' } = req.body;
    if (!items.length && !citas.length) return res.status(400).json({ error: 'No hay nada seleccionado.' });
    res.json(publico(cotizar(armarProductos(items), armarCitas(citas), cupon, metodoPago, entrega)));
  },

  // Nombre: crear
  // Descripción: Crea el pedido y cobra.
  // Entrada: El carrito y el pago.
  // Salida: El pedido creado o un error.
  // Objetivo: Terminar la compra.
  crear(req, res) {
    const { items = [], citas: citasPedidas = [], metodoPago, pago, cupon, notas, entrega = 'retiro', direccionId } = req.body;
    if (!items.length && !citasPedidas.length) return res.status(400).json({ error: 'El carrito está vacío.' });
    // La clienta tiene cuenta (middleware soloUsuario): sus datos vienen de la cuenta
    const usuario = req.usuario;
    const cliente = { nombre: req.body.cliente?.nombre || usuario.nombre, telefono: req.body.cliente?.telefono || usuario.telefono || '', email: usuario.correo };
    let direccion = null;
    if (entrega === 'envio' && items.length) {
      const direccionGuardada = UsuarioModel.direccion(usuario.id, direccionId);
      if (!direccionGuardada) return res.status(400).json({ error: 'Elige la dirección de envío.' });
      direccion = UsuarioModel.textoDireccion(direccionGuardada);
    }
    const errorCliente = PedidoModel.validarCliente(cliente);
    if (errorCliente) return res.status(400).json({ error: errorCliente });

    const productos = armarProductos(items);
    const citas = armarCitas(citasPedidas);
    const cotizacion = cotizar(productos, citas, cupon, metodoPago, direccion ? 'envio' : 'retiro');

    // Strategy + Factory: se cobra lo que toca pagar hoy
    const metodo = crearMetodoPago(metodoPago);
    const cobro = metodo.cobrar(cotizacion.pagasHoy, pago);
    if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

    // Todo o nada: si una cita se ocupó en este momento, no se guarda nada
    const resultado = enTransaccion(() => {
      const pedido = productos.length ? PedidoModel.crear(cliente, productos, metodo.nombre, {
        total: cotizacion.productosNeto + cotizacion.envio, usuarioId: usuario.id, entrega: direccion ? 'envio' : 'retiro', direccion, costoEnvio: cotizacion.envio, descuento: Math.round(productos.reduce((suma, producto) => suma + producto.precio * producto.cantidad, 0) * (1 - cotizacion.factor)),
        cupon: cotizacion.cupon?.codigo, notas: notas ? String(notas).slice(0, 300) : null, referencia: cobro.referencia
      }) : null;
      const creadas = citas.map((cita) => {
        if (!CitaModel.horaDisponible(cita.especialista.id, cita.fecha, cita.hora)) throw error(`La hora ${cita.hora} con ${cita.especialista.nombre} se acaba de ocupar.`, 409);
        const total = Math.round(cita.precio * cotizacion.factor);
        return CitaModel.crear({
          servicioId: cita.servicio.id, especialistaId: cita.especialista.id, disenoId: cita.diseno?.id ?? null, fotoRefId: cita.fotoRefId,
          nombre: cita.persona || cliente.nombre.trim(), telefono: cliente.telefono.trim(), email: cliente.email?.trim() || null,
          notas: [cita.persona ? `Viene con ${cliente.nombre.trim()}` : null, cita.notas].filter(Boolean).join('. ') || null,
          fecha: cita.fecha, hora: cita.hora, estado: cobro.requiereVerificacion ? 'pendiente' : 'confirmada',
          total, anticipo: metodoPago === 'salon' ? 0 : Math.round(total * PORCENTAJE_ADELANTO),
          cuponCodigo: cotizacion.cupon?.codigo ?? null, descuento: cita.precio - total, metodoPago: metodo.nombre, pedidoId: pedido?.id ?? null, usuarioId: usuario.id
        });
      });
      return { pedido, creadas };
    });

    if (cotizacion.cupon) CuponModel.registrarUso(cotizacion.cupon.codigo);
    // Observer: recordatorios por WhatsApp para cada cita
    resultado.creadas.forEach((cita) => eventos.emit('cita:creada', { cita, recordatorios: { whatsapp: true } }));
    res.status(201).json({
      id: resultado.pedido?.id ?? null, citas: resultado.creadas, total: cotizacion.total, descuento: cotizacion.descuento,
      pagado: cotizacion.pagasHoy, enSalon: cotizacion.enSalon, envio: cotizacion.envio, direccion, metodo: metodo.nombre, referenciaPago: cobro.referencia, requiereVerificacion: Boolean(cobro.requiereVerificacion)
    });
  }
};
