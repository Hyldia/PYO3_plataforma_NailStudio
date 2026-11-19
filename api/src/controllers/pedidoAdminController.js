// CONTROLADOR de pedidos del panel: lista con filtros, descarga en Excel y cambio de estado.
import ExcelJS from 'exceljs';
import { PedidoModel } from '../models/PedidoModel.js';
import { cambiarEstadoPedido } from '../patrones/estadoPedido.js';
import { prepararMensaje, SALON } from '../patrones/plantillaMensajes.js';
import { eventos } from '../patrones/observadorEventos.js';

export const pedidoAdminController = {
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
    filas.forEach((fila) => hoja.addRow({
      id: fila.id, fecha: fila.fecha_local, cliente: fila.cliente_nombre, tel: fila.cliente_telefono, detalle: fila.detalle, unidades: fila.unidades,
      cupon: fila.cupon_codigo || '', descuento: fila.descuento || 0, total: fila.total, pago: fila.metodo_pago, estado: ESTADO[fila.estado] || fila.estado,
      retiro: fila.entrega === 'envio' ? `Envío (₡${fila.costo_envio}) · ${fila.direccion}` : `Retiro en el salón ${SALON.nombre}`, completado: fila.completado_en || '', retiro_por: fila.retirado_por || '', notas: [fila.notas, fila.notas_admin].filter(Boolean).join(' · ')
    }));
    const cabeza = hoja.getRow(1);
    cabeza.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cabeza.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C1D4B' } };
    ['descuento', 'total'].forEach((columna) => { hoja.getColumn(columna).numFmt = '"₡"#,##0'; });
    hoja.autoFilter = { from: 'A1', to: 'O1' };
    const total = hoja.addRow({ detalle: 'TOTAL', total: filas.filter((fila) => fila.estado !== 'cancelado').reduce((suma, fila) => suma + fila.total, 0) });
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
    const pedido = PedidoModel.buscarPorId(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'No existe ese pedido.' });
    let nuevo;
    try { nuevo = cambiarEstadoPedido(pedido.estado, req.body.estado); } catch (fallo) { return res.status(400).json({ error: fallo.message }); }
    const actualizado = PedidoModel.cambiarEstado(pedido.id, nuevo, req.body);
    // Si quedó listo, se prepara el aviso de WhatsApp para la clienta
    let mensaje = null;
    if (nuevo === 'listo') {
      mensaje = prepararMensaje('pedido-listo', actualizado, actualizado.cliente_telefono);
      eventos.emit('mensaje:preparado', { pedidoId: pedido.id, cliente: pedido.cliente_nombre, ...mensaje });
    }
    res.json({ pedido: actualizado, mensaje });
  }
};
