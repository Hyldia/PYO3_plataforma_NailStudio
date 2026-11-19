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

const borrarArchivo = (nombre) => nombre && !nombre.startsWith('http') && unlink(join(UPLOADS_DIR, nombre)).catch(() => {});
const MES = /^\d{4}-\d{2}$/;

// Prepara el mensaje (Factory + Template Method), avisa a los observadores y lo devuelve con su enlace de WhatsApp
function mensajeDeCita(cita, tipo, extra = {}, soloVista = false) {
  const m = prepararMensaje(tipo, { ...cita, ...extra }, cita.cliente_telefono);
  if (!soloVista) eventos.emit('mensaje:preparado', { citaId: cita.id, cliente: cita.cliente_nombre, ...m });
  return m;
}

// Cancela una cita con el patrón State y prepara el aviso (también la usa el portal del equipo)
export function cancelarCita(cita, { motivo, tipo = 'cancelacion', nuevaFecha, nuevaHora, nota, quien = '' }) {
  const nuevo = aplicarAccion(cita.estado, 'cancelar');
  CitaModel.cambiarEstado(cita.id, nuevo);
  CitaModel.guardarMotivo(cita.id, `${motivo || 'Emergencia'}${quien ? ` (la canceló ${quien})` : ''}`);
  eventos.emit('cita:cancelada', { citaId: cita.id });
  return { cita: CitaModel.buscarPorId(cita.id), mensaje: mensajeDeCita(cita, tipo, { motivo, nuevaFecha, nuevaHora, nota }) };
}

export const adminController = {
  // ----- Agenda -----
  calendario(req, res) {
    const mes = MES.test(req.query.mes || '') ? req.query.mes : new Date().toISOString().slice(0, 7);
    res.json({ mes, dias: CitaModel.resumenMes(mes) });
  },
  tiposMensaje: (req, res) => res.json(TIPOS_MENSAJE),

  cancelar(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
    const { tipo = 'cancelacion' } = req.body;
    if (!['cancelacion', 'reprogramacion'].includes(tipo)) return res.status(400).json({ error: 'Tipo de aviso no válido.' });
    res.json(cancelarCita(cita, req.body));
  },

  // Emergencia: cancela todas las citas activas de un día (o solo las de una especialista)
  emergencia(req, res) {
    const { fecha, especialistaId, motivo, tipo = 'cancelacion', nota } = req.body;
    if (!CitaModel.esFechaValida(fecha)) return res.status(400).json({ error: 'Elige el día.' });
    if (!motivo || motivo.trim().length < 3) return res.status(400).json({ error: 'Escribe el motivo para avisarles a las clientas.' });
    const citas = CitaModel.activasDelDia(fecha, especialistaId ? Number(especialistaId) : null);
    if (!citas.length) return res.status(404).json({ error: 'No hay citas activas ese día.' });
    res.json(citas.map((c) => cancelarCita(c, { motivo: motivo.trim(), tipo, nota })));
  },

  mensaje(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
    try { res.json(mensajeDeCita(cita, req.body.tipo || 'recordatorio', req.body, Boolean(req.body.soloVista))); } catch (e) { res.status(400).json({ error: e.message }); }
  },
  mensajes: (req, res) => res.json(MensajeModel.listar(req.query.limite)),
  mensajeEnviado(req, res) { MensajeModel.marcarEnviado(req.params.id); res.status(204).end(); },

  // ----- Galería: cambiar la foto de un diseño -----
  cambiarFotoDiseno(req, res) {
    const foto = FotoModel.buscarPorId(req.params.id);
    if (!foto || !req.file) return res.status(400).json({ error: 'Diseño o imagen no válidos.' });
    FotoModel.cambiarArchivo(foto.id, req.file.filename);
    borrarArchivo(foto.archivo);
    res.json(FotoModel.buscarPorId(foto.id));
  },

  // ----- Productos -----
  productos: (req, res) => res.json(ProductoModel.buscar({ ...req.query, orden: req.query.orden || 'nuevos' })),
  crearProducto(req, res) {
    const error = ProductoModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ProductoModel.crear(ProductoModel.normalizar(req.body)));
  },
  editarProducto(req, res) {
    if (!ProductoModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe ese producto.' });
    const error = ProductoModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(ProductoModel.actualizar(Number(req.params.id), ProductoModel.normalizar(req.body)));
  },
  eliminarProducto(req, res) {
    const p = ProductoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ error: 'No existe ese producto.' });
    const resultado = ProductoModel.eliminar(p.id);
    if (resultado === 'borrado') borrarArchivo(p.imagen);
    res.json({ resultado });
  },

  // ----- Equipo -----
  equipo: (req, res) => res.json(EspecialistaModel.listarTodas()),
  crearEspecialista(req, res) {
    const error = EspecialistaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(EspecialistaModel.crear(EspecialistaModel.normalizar(req.body)));
  },
  editarEspecialista(req, res) {
    if (!EspecialistaModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe esa especialista.' });
    const error = EspecialistaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(EspecialistaModel.actualizar(Number(req.params.id), EspecialistaModel.normalizar(req.body)));
  },
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
  pedidos: (req, res) => res.json(PedidoModel.listarAdmin(req.query)),

  // Descarga los pedidos filtrados como archivo de Excel (.xlsx)
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
