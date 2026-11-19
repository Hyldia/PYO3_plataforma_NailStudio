// MODELO: números para las gráficas del panel (ventas, citas, servicios, productos y equipo).
import { getDb } from '../db/conexion.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const ReporteModel = {
  // Nombre: periodo
  // Descripción: Calcula el periodo del reporte.
  // Entrada: Las fechas pedidas.
  // Salida: Desde y hasta.
  // Objetivo: Hacer reportes por fechas.
  periodo(q = {}) {
    const hoy = new Date();
    const hasta = FECHA.test(q.hasta || '') ? q.hasta : hoy.toISOString().slice(0, 10);
    const d = new Date(`${hasta}T12:00:00`); d.setDate(d.getDate() - 29);
    const desde = FECHA.test(q.desde || '') && q.desde <= hasta ? q.desde : d.toISOString().slice(0, 10);
    return { desde, hasta };
  },
  // Nombre: generar
  // Descripción: Arma el reporte del negocio.
  // Entrada: El periodo.
  // Salida: Ventas, citas, servicios y equipo.
  // Objetivo: Ver cómo va el salón.
  generar({ desde, hasta }) {
    const db = getDb();
    const p = { desde, hasta };
    const citasDia = db.prepare(`SELECT fecha AS dia, COUNT(*) AS citas, SUM(CASE WHEN estado = 'completada' THEN total WHEN estado = 'no_asistio' THEN monto_cobrado ELSE 0 END) AS citas_total
      FROM citas WHERE fecha BETWEEN @desde AND @hasta AND estado != 'cancelada' GROUP BY fecha`).all(p);
    const tiendaDia = db.prepare(`SELECT date(creado_en, 'localtime') AS dia, COUNT(*) AS pedidos, SUM(total) AS tienda_total
      FROM pedidos WHERE date(creado_en, 'localtime') BETWEEN @desde AND @hasta AND estado != 'cancelado' GROUP BY dia`).all(p);
    // Una fila por día del periodo, aunque ese día no haya ventas
    const porDia = [];
    for (const d = new Date(`${desde}T12:00:00`); d.toISOString().slice(0, 10) <= hasta; d.setDate(d.getDate() + 1)) {
      const dia = d.toISOString().slice(0, 10);
      const c = citasDia.find((x) => x.dia === dia) || {};
      const t = tiendaDia.find((x) => x.dia === dia) || {};
      porDia.push({ dia, citas: c.citas || 0, servicios: c.citas_total || 0, pedidos: t.pedidos || 0, tienda: t.tienda_total || 0, total: (c.citas_total || 0) + (t.tienda_total || 0) });
    }
    const porEspecialista = db.prepare(`SELECT e.id, e.nombre, COUNT(c.id) AS citas, COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN c.total WHEN c.estado = 'no_asistio' THEN c.monto_cobrado END), 0) AS vendido
      FROM especialistas e LEFT JOIN citas c ON c.especialista_id = e.id AND c.fecha BETWEEN @desde AND @hasta AND c.estado != 'cancelada'
      GROUP BY e.id HAVING citas > 0 OR e.activa = 1 ORDER BY citas DESC`).all(p);
    const servicios = db.prepare(`SELECT s.id, s.nombre, COUNT(*) AS citas, COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN c.total END), 0) AS vendido
      FROM citas c JOIN servicios s ON s.id = c.servicio_id WHERE c.fecha BETWEEN @desde AND @hasta AND c.estado != 'cancelada'
      GROUP BY s.id ORDER BY citas DESC LIMIT 8`).all(p);
    const productos = db.prepare(`SELECT pr.id, pr.nombre, SUM(i.cantidad) AS unidades, SUM(i.cantidad * i.precio_unitario) AS vendido
      FROM pedido_items i JOIN pedidos pe ON pe.id = i.pedido_id JOIN productos pr ON pr.id = i.producto_id
      WHERE date(pe.creado_en, 'localtime') BETWEEN @desde AND @hasta AND pe.estado != 'cancelado'
      GROUP BY pr.id ORDER BY unidades DESC LIMIT 8`).all(p);
    const pagos = db.prepare(`SELECT metodo_pago AS metodo, COUNT(*) AS pedidos, SUM(total) AS total FROM pedidos
      WHERE date(creado_en, 'localtime') BETWEEN @desde AND @hasta AND estado != 'cancelado' GROUP BY metodo_pago ORDER BY total DESC`).all(p);
    // Horas con más citas: ayuda a saber a qué horas hace falta más personal
    const porHora = db.prepare(`SELECT CAST(substr(hora, 1, 2) AS INTEGER) AS hora, COUNT(*) AS citas FROM citas
      WHERE fecha BETWEEN @desde AND @hasta AND estado != 'cancelada' GROUP BY 1 ORDER BY 1`).all(p);
    const estados = db.prepare(`SELECT estado, COUNT(*) AS n FROM citas WHERE fecha BETWEEN @desde AND @hasta GROUP BY estado`).all(p);
    const clientasNuevas = db.prepare(`SELECT COUNT(*) AS n FROM (SELECT cliente_telefono, MIN(fecha) AS primera FROM citas WHERE estado != 'cancelada' GROUP BY cliente_telefono) WHERE primera BETWEEN @desde AND @hasta`).get(p).n;
    const totalServicios = porDia.reduce((s, x) => s + x.servicios, 0);
    const totalTienda = porDia.reduce((s, x) => s + x.tienda, 0);
    const totalCitas = porDia.reduce((s, x) => s + x.citas, 0);
    const canceladas = estados.find((e) => e.estado === 'cancelada')?.n || 0;
    return {
      desde, hasta, porDia, porEspecialista, servicios, productos, pagos, estados, porHora,
      totales: { ventas: totalServicios + totalTienda, servicios: totalServicios, tienda: totalTienda, citas: totalCitas, canceladas, pedidos: porDia.reduce((s, x) => s + x.pedidos, 0), clientasNuevas }
    };
  },

  // Nombre: cierreDelDia
  // Descripción: Arma el reporte de cierre de un día: ingresos, pago al equipo, ganancia del salón, pérdidas y citas perdidas.
  // Entrada: La fecha (AAAA-MM-DD).
  // Salida: Totales, detalle por especialista, citas perdidas y pedidos de la tienda.
  // Objetivo: Que la dueña sepa al final del día cómo le fue.
  cierreDelDia(fecha) {
    const db = getDb();
    const citas = db.prepare(`SELECT c.id, c.hora, c.estado, c.total, c.anticipo, c.descuento, c.monto_cobrado, c.decision_inasistencia, c.motivo_cancelacion,
        c.cliente_nombre, c.cliente_telefono, c.reprogramada_a, s.nombre AS servicio, e.id AS especialista_id, e.nombre AS especialista, e.comision
      FROM citas c JOIN servicios s ON s.id = c.servicio_id JOIN especialistas e ON e.id = c.especialista_id
      WHERE c.fecha = ? ORDER BY c.hora`).all(fecha);
    const pedidos = db.prepare(`SELECT id, total, metodo_pago, estado FROM pedidos WHERE date(creado_en, 'localtime') = ? AND estado != 'cancelado'`).all(fecha);
    const sumar = (lista, campo) => lista.reduce((suma, fila) => suma + (Number(fila[campo]) || 0), 0);

    const atendidas = citas.filter((cita) => cita.estado === 'completada');
    const canceladas = citas.filter((cita) => cita.estado === 'cancelada');
    const noLlegaron = citas.filter((cita) => cita.estado === 'no_asistio');
    const sinMarcar = citas.filter((cita) => ['pendiente', 'confirmada'].includes(cita.estado));
    const cobradas = noLlegaron.filter((cita) => cita.decision_inasistencia === 'cobrada');
    const reprogramadas = noLlegaron.filter((cita) => cita.decision_inasistencia === 'reprogramada');

    // Ingreso de cada cita: lo atendido o lo cobrado por no llegar
    const ingresoDe = (cita) => (cita.estado === 'completada' ? cita.total : cita.estado === 'no_asistio' ? cita.monto_cobrado : 0);
    const porEspecialista = [...new Map(citas.map((cita) => [cita.especialista_id, cita])).values()].map((una) => {
      const suyas = citas.filter((cita) => cita.especialista_id === una.especialista_id);
      const ingresos = suyas.reduce((suma, cita) => suma + ingresoDe(cita), 0);
      const pago = Math.round(ingresos * (una.comision / 100));
      return { id: una.especialista_id, nombre: una.especialista, comision: una.comision, atendidas: suyas.filter((c) => c.estado === 'completada').length,
        perdidas: suyas.filter((c) => ['cancelada', 'no_asistio'].includes(c.estado)).length, ingresos, pago, salon: ingresos - pago };
    }).sort((a, b) => b.ingresos - a.ingresos);

    const ingresosCitas = sumar(atendidas, 'total') + sumar(cobradas, 'monto_cobrado');
    const ingresosTienda = sumar(pedidos, 'total');
    const pagoEquipo = porEspecialista.reduce((suma, fila) => suma + fila.pago, 0);
    // Pérdidas: lo que se dejó de ganar por citas canceladas y por las que no llegaron y no se cobró completo
    const perdidoCanceladas = sumar(canceladas, 'total');
    const perdidoNoLlegaron = cobradas.reduce((suma, cita) => suma + (cita.total - cita.monto_cobrado), 0);
    const descuentos = sumar(atendidas, 'descuento');
    return {
      fecha,
      totales: {
        ingresos: ingresosCitas + ingresosTienda, ingresosCitas, ingresosTienda, pagoEquipo,
        gananciaSalon: ingresosCitas + ingresosTienda - pagoEquipo,
        perdidas: perdidoCanceladas + perdidoNoLlegaron, perdidoCanceladas, perdidoNoLlegaron, descuentos,
        citas: citas.length, atendidas: atendidas.length, canceladas: canceladas.length, noLlegaron: noLlegaron.length,
        cobradas: cobradas.length, reprogramadas: reprogramadas.length, sinMarcar: sinMarcar.length, pedidos: pedidos.length
      },
      porEspecialista,
      citasPerdidas: [...canceladas, ...noLlegaron].sort((a, b) => a.hora.localeCompare(b.hora)).map((cita) => ({
        id: cita.id, hora: cita.hora, cliente: cita.cliente_nombre, telefono: cita.cliente_telefono, servicio: cita.servicio, especialista: cita.especialista,
        valor: cita.total, estado: cita.estado, decision: cita.decision_inasistencia, cobrado: cita.monto_cobrado, motivo: cita.motivo_cancelacion, reprogramadaA: cita.reprogramada_a
      })),
      sinMarcar: sinMarcar.map((cita) => ({ id: cita.id, hora: cita.hora, cliente: cita.cliente_nombre, especialista: cita.especialista }))
    };
  },

  // Nombre: avisosPanel
  // Descripción: Cuenta lo pendiente para la campanita del panel.
  // Entrada: La fecha de hoy.
  // Salida: Pedidos nuevos, citas sin marcar y citas por confirmar.
  // Objetivo: Que la dueña vea de un vistazo lo que falta atender.
  avisosPanel(hoy) {
    const db = getDb();
    return {
      pedidosNuevos: db.prepare("SELECT COUNT(*) AS n FROM pedidos WHERE estado = 'recibido'").get().n,
      citasSinMarcar: db.prepare("SELECT COUNT(*) AS n FROM citas WHERE estado IN ('pendiente', 'confirmada') AND fecha < ?").get(hoy).n,
      citasPorConfirmar: db.prepare("SELECT COUNT(*) AS n FROM citas WHERE estado = 'pendiente' AND fecha >= ?").get(hoy).n
    };
  }
};
