// CONTROLADOR del panel del salón: agenda con calendario, avisos por WhatsApp,
// productos, equipo y pedidos. Los mensajes usan los patrones de patrones/plantillaMensajes.js.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/conexion.js';
import { CitaModel } from '../models/CitaModel.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { PedidoModel } from '../models/PedidoModel.js';
import { MensajeModel } from '../models/MensajeModel.js';
import { FotoModel } from '../models/FotoModel.js';
import { aplicarAccion } from '../patrones/estadoCita.js';
import { cambiarEstadoPedido } from '../patrones/estadoPedido.js';
import { prepararMensaje, TIPOS_MENSAJE } from '../patrones/plantillaMensajes.js';
import { eventos } from '../patrones/observadorEventos.js';
import ExcelJS from 'exceljs';
import { SALON } from '../patrones/plantillaMensajes.js';

// Nombre: borrarArchivo
// Descripción: Borra del disco una foto subida.
// Entrada: El nombre del archivo.
// Salida: Nada.
// Objetivo: No dejar fotos viejas guardadas.
const borrarArchivo = (nombre) => nombre && !nombre.startsWith('http') && unlink(join(UPLOADS_DIR, nombre)).catch(() => {});
const MES = /^\d{4}-\d{2}$/;

// Prepara el mensaje (Factory + Template Method), avisa a los observadores y lo devuelve con su enlace de WhatsApp
// Nombre: mensajeDeCita
// Descripción: Arma el mensaje de WhatsApp para avisar a la clienta sobre su cita.
// Entrada: La cita, el tipo de aviso y datos extra.
// Salida: El texto del mensaje y su enlace.
// Objetivo: Avisar a la clienta de cambios en su cita.
function mensajeDeCita(cita, tipo, extra = {}, soloVista = false) {
  const m = prepararMensaje(tipo, { ...cita, ...extra }, cita.cliente_telefono);
  if (!soloVista) eventos.emit('mensaje:preparado', { citaId: cita.id, cliente: cita.cliente_nombre, ...m });
  return m;
}

// Cancela una cita con el patrón State y prepara el aviso (también la usa el portal del equipo)
// Nombre: cancelarCita
// Descripción: Cancela o cambia una cita y prepara el aviso.
// Entrada: La cita y el motivo del cambio.
// Salida: La cita actualizada y el mensaje para la clienta.
// Objetivo: Que cancelar funcione igual en el panel y en el portal.
export function cancelarCita(cita, { motivo, tipo = 'cancelacion', nuevaFecha, nuevaHora, nota, quien = '' }) {
  const nuevo = aplicarAccion(cita.estado, 'cancelar');
  CitaModel.cambiarEstado(cita.id, nuevo);
  CitaModel.guardarMotivo(cita.id, `${motivo || 'Emergencia'}${quien ? ` (la canceló ${quien})` : ''}`);
  eventos.emit('cita:cancelada', { citaId: cita.id });
  return { cita: CitaModel.buscarPorId(cita.id), mensaje: mensajeDeCita(cita, tipo, { motivo, nuevaFecha, nuevaHora, nota }) };
}

export const adminController = {
  // ----- Agenda -----
  // Nombre: calendario
  // Descripción: Trae las citas de un rango de fechas para el calendario.
  // Entrada: Las fechas a mostrar.
  // Salida: La lista de citas.
  // Objetivo: Ver la agenda en el panel.
  calendario(req, res) {
    const mes = MES.test(req.query.mes || '') ? req.query.mes : new Date().toISOString().slice(0, 7);
    res.json({ mes, dias: CitaModel.resumenMes(mes) });
  },
  // Nombre: tiposMensaje
  // Descripción: Entrega los tipos de mensaje que se pueden enviar.
  // Entrada: Nada.
  // Salida: La lista de tipos de mensaje.
  // Objetivo: Llenar el menú de avisos del panel.
  tiposMensaje: (req, res) => res.json(TIPOS_MENSAJE),

  // Nombre: cancelar
  // Descripción: Cancela una cita desde el panel.
  // Entrada: El número de la cita y el motivo.
  // Salida: La cita cancelada y el aviso.
  // Objetivo: Que la dueña pueda cancelar citas.
  cancelar(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
    const { tipo = 'cancelacion' } = req.body;
    if (!['cancelacion', 'reprogramacion'].includes(tipo)) return res.status(400).json({ error: 'Tipo de aviso no válido.' });
    res.json(cancelarCita(cita, req.body));
  },

  // Emergencia: cancela todas las citas activas de un día (o solo las de una especialista)
  // Nombre: emergencia
  // Descripción: Cancela todas las citas de un día por una emergencia.
  // Entrada: La fecha y el motivo.
  // Salida: Cuántas citas se cancelaron y sus avisos.
  // Objetivo: Avisar rápido a todas las clientas del día.
  emergencia(req, res) {
    const { fecha, especialistaId, motivo, tipo = 'cancelacion', nota } = req.body;
    if (!CitaModel.esFechaValida(fecha)) return res.status(400).json({ error: 'Elige el día.' });
    if (!motivo || motivo.trim().length < 3) return res.status(400).json({ error: 'Escribe el motivo para avisarles a las clientas.' });
    const citas = CitaModel.activasDelDia(fecha, especialistaId ? Number(especialistaId) : null);
    if (!citas.length) return res.status(404).json({ error: 'No hay citas activas ese día.' });
    res.json(citas.map((c) => cancelarCita(c, { motivo: motivo.trim(), tipo, nota })));
  },

  // Nombre: mensaje
  // Descripción: Prepara un mensaje para una clienta sobre su cita.
  // Entrada: La cita y el tipo de mensaje.
  // Salida: El mensaje listo para enviar.
  // Objetivo: Comunicarse con la clienta.
  mensaje(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
    try { res.json(mensajeDeCita(cita, req.body.tipo || 'recordatorio', req.body, Boolean(req.body.soloVista))); } catch (e) { res.status(400).json({ error: e.message }); }
  },
  // Nombre: mensajes
  // Descripción: Muestra los últimos mensajes preparados.
  // Entrada: Cuántos mostrar.
  // Salida: La lista de mensajes.
  // Objetivo: Llevar control de los avisos.
  mensajes: (req, res) => res.json(MensajeModel.listar(req.query.limite)),
  // Nombre: mensajeEnviado
  // Descripción: Marca un mensaje como ya enviado.
  // Entrada: El número del mensaje.
  // Salida: Nada.
  // Objetivo: Saber qué avisos ya salieron.
  mensajeEnviado(req, res) { MensajeModel.marcarEnviado(req.params.id); res.status(204).end(); },

  // ----- Galería: cambiar la foto de un diseño -----
  // Nombre: cambiarFotoDiseno
  // Descripción: Cambia la foto de un diseño de la galería.
  // Entrada: El diseño y la foto nueva.
  // Salida: El diseño actualizado.
  // Objetivo: Mantener la galería al día.
  cambiarFotoDiseno(req, res) {
    const foto = FotoModel.buscarPorId(req.params.id);
    if (!foto || !req.file) return res.status(400).json({ error: 'Diseño o imagen no válidos.' });
    FotoModel.cambiarArchivo(foto.id, req.file.filename);
    borrarArchivo(foto.archivo);
    res.json(FotoModel.buscarPorId(foto.id));
  },

  // ----- Productos -----
  // Nombre: productos
  // Descripción: Lista los productos para el panel.
  // Entrada: Los filtros de búsqueda.
  // Salida: La lista de productos.
  // Objetivo: Administrar la tienda.
  productos: (req, res) => res.json(ProductoModel.buscar({ ...req.query, orden: req.query.orden || 'nuevos' })),
  // Nombre: crearProducto
  // Descripción: Crea un producto nuevo.
  // Entrada: Los datos del producto.
  // Salida: El producto creado.
  // Objetivo: Agregar productos a la tienda.
  crearProducto(req, res) {
    const error = ProductoModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ProductoModel.crear(ProductoModel.normalizar(req.body)));
  },
  // Nombre: editarProducto
  // Descripción: Edita un producto.
  // Entrada: El producto y sus nuevos datos.
  // Salida: El producto actualizado.
  // Objetivo: Corregir precios, stock o datos.
  editarProducto(req, res) {
    if (!ProductoModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe ese producto.' });
    const error = ProductoModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(ProductoModel.actualizar(Number(req.params.id), ProductoModel.normalizar(req.body)));
  },
  // Nombre: eliminarProducto
  // Descripción: Elimina un producto.
  // Entrada: El número del producto.
  // Salida: Nada.
  // Objetivo: Quitar productos que ya no se venden.
  eliminarProducto(req, res) {
    const p = ProductoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ error: 'No existe ese producto.' });
    const resultado = ProductoModel.eliminar(p.id);
    if (resultado === 'borrado') borrarArchivo(p.imagen);
    res.json({ resultado });
  },

  // ----- Equipo -----
  // Nombre: equipo
  // Descripción: Lista todas las especialistas.
  // Entrada: Nada.
  // Salida: La lista del equipo.
  // Objetivo: Administrar el equipo.
  equipo: (req, res) => res.json(EspecialistaModel.listarTodas()),
  // Nombre: crearEspecialista
  // Descripción: Agrega una especialista.
  // Entrada: Sus datos.
  // Salida: La especialista creada.
  // Objetivo: Sumar personas al equipo.
  crearEspecialista(req, res) {
    const error = EspecialistaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(EspecialistaModel.crear(EspecialistaModel.normalizar(req.body)));
  },
  // Nombre: editarEspecialista
  // Descripción: Edita los datos de una especialista.
  // Entrada: La especialista y sus datos nuevos.
  // Salida: La especialista actualizada.
  // Objetivo: Mantener al día el equipo.
  editarEspecialista(req, res) {
    if (!EspecialistaModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe esa especialista.' });
    const error = EspecialistaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(EspecialistaModel.actualizar(Number(req.params.id), EspecialistaModel.normalizar(req.body)));
  },
  // Nombre: eliminarEspecialista
  // Descripción: Quita una especialista.
  // Entrada: El número de la especialista.
  // Salida: Nada.
  // Objetivo: Sacar a quien ya no trabaja.
  eliminarEspecialista(req, res) {
    const e = EspecialistaModel.buscarPorId(req.params.id);
    if (!e) return res.status(404).json({ error: 'No existe esa especialista.' });
    const futuras = EspecialistaModel.citasFuturas(e.id);
    if (futuras) return res.status(409).json({ error: `${e.nombre} tiene ${futuras} ${futuras === 1 ? 'cita pendiente' : 'citas pendientes'}. Cancélalas o reasígnalas primero (puedes usar «Emergencia» en la agenda).` });
    const resultado = EspecialistaModel.eliminar(e.id);
    if (resultado === 'borrada') borrarArchivo(e.foto);
    res.json({ resultado });
  },

  // ----- Pedidos -----
  // Nombre: pedidos
  // Descripción: Lista los pedidos de la tienda.
  // Entrada: Los filtros.
  // Salida: La lista de pedidos.
  // Objetivo: Ver y atender los pedidos.
  pedidos: (req, res) => res.json(PedidoModel.listarAdmin(req.query)),

  // Descarga los pedidos filtrados como archivo de Excel (.xlsx)
  // Nombre: pedidosExcel
  // Descripción: Descarga los pedidos en un archivo de Excel.
  // Entrada: Los filtros.
  // Salida: Un archivo de Excel.
  // Objetivo: Tener los pedidos en una hoja de cálculo.
  async pedidosExcel(req, res) {
    const filas = PedidoModel.listarAdmin(req.query);
    const libro = new ExcelJS.Workbook();
    libro.creator = SALON.nombre;
    const hoja = libro.addWorksheet('Pedidos', { views: [{ state: 'frozen', ySplit: 1 }] });
    const ESTADO = { recibido: 'Recibido', listo: 'Listo para retirar', completado: 'Completado', cancelado: 'Cancelado' };
    hoja.columns = [
      { header: 'N.º', key: 'id', width: 7 }, { header: 'Fecha', key: 'fecha', width: 18 }, { header: 'Clienta', key: 'cliente', width: 26 },
      { header: 'Teléfono', key: 'tel', width: 13 }, { header: 'Productos', key: 'detalle', width: 60 }, { header: 'Unidades', key: 'unidades', width: 10 },
      { header: 'Cupón', key: 'cupon', width: 14 }, { header: 'Descuento', key: 'descuento', width: 12 }, { header: 'Total', key: 'total', width: 12 },
      { header: 'Pago', key: 'pago', width: 16 }, { header: 'Estado', key: 'estado', width: 18 }, { header: 'Entrega', key: 'retiro', width: 50 },
      { header: 'Completado el', key: 'completado', width: 18 }, { header: 'Retiró', key: 'retiro_por', width: 20 }, { header: 'Notas', key: 'notas', width: 30 }
    ];
    filas.forEach((p) => hoja.addRow({
      id: p.id, fecha: p.fecha_local, cliente: p.cliente_nombre, tel: p.cliente_telefono, detalle: p.detalle, unidades: p.unidades,
      cupon: p.cupon_codigo || '', descuento: p.descuento || 0, total: p.total, pago: p.metodo_pago, estado: ESTADO[p.estado] || p.estado,
      retiro: p.entrega === 'envio' ? `Envío (₡${p.costo_envio}) · ${p.direccion}` : `Retiro en el salón ${SALON.nombre}`, completado: p.completado_en || '', retiro_por: p.retirado_por || '', notas: [p.notas, p.notas_admin].filter(Boolean).join(' · ')
    }));
    const cabeza = hoja.getRow(1);
    cabeza.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cabeza.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C1D4B' } };
    ['descuento', 'total'].forEach((k) => { hoja.getColumn(k).numFmt = '"₡"#,##0'; });
    hoja.autoFilter = { from: 'A1', to: 'O1' };
    const total = hoja.addRow({ detalle: 'TOTAL', total: filas.filter((p) => p.estado !== 'cancelado').reduce((s, p) => s + p.total, 0) });
    total.font = { bold: true };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    await libro.xlsx.write(res);
    res.end();
  },
  // Nombre: estadoPedido
  // Descripción: Cambia el estado de un pedido.
  // Entrada: El pedido y el estado nuevo.
  // Salida: El pedido actualizado.
  // Objetivo: Seguir el avance de cada pedido.
  estadoPedido(req, res) {
    const p = PedidoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ error: 'No existe ese pedido.' });
    let nuevo;
    try { nuevo = cambiarEstadoPedido(p.estado, req.body.estado); } catch (e) { return res.status(400).json({ error: e.message }); }
    const actualizado = PedidoModel.cambiarEstado(p.id, nuevo, req.body);
    // Si quedó listo, se prepara el aviso de WhatsApp para la clienta
    let mensaje = null;
    if (nuevo === 'listo') {
      mensaje = prepararMensaje('pedido-listo', actualizado, actualizado.cliente_telefono);
      eventos.emit('mensaje:preparado', { pedidoId: p.id, cliente: p.cliente_nombre, ...mensaje });
    }
    res.json({ pedido: actualizado, mensaje });
  }
};
