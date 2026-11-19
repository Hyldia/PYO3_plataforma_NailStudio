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
    const fecha = new Date(`${hasta}T12:00:00`); fecha.setDate(fecha.getDate() - 29);
    const desde = FECHA.test(q.desde || '') && q.desde <= hasta ? q.desde : fecha.toISOString().slice(0, 10);
    return { desde, hasta };
  },
  // Nombre: generar
  // Descripción: Arma el reporte del negocio.
  // Entrada: El periodo.
  // Salida: Ventas, citas, servicios y equipo.
  // Objetivo: Ver cómo va el salón.
  generar({ desde, hasta }) {
    const db = getDb();
    const rango = { desde, hasta };
    const citasDia = db.prepare(`SELECT fecha AS dia, COUNT(*) AS citas, SUM(CASE WHEN estado = 'completada' THEN total WHEN estado = 'no_asistio' THEN monto_cobrado ELSE 0 END) AS citas_total
      FROM citas WHERE fecha BETWEEN @desde AND @hasta AND estado != 'cancelada' GROUP BY fecha`).all(rango);
    const tiendaDia = db.prepare(`SELECT date(creado_en, 'localtime') AS dia, COUNT(*) AS pedidos, SUM(total) AS tienda_total
      FROM pedidos WHERE date(creado_en, 'localtime') BETWEEN @desde AND @hasta AND estado != 'cancelado' GROUP BY dia`).all(rango);
    // Una fila por día del periodo, aunque ese día no haya ventas
    const porDia = [];
    for (const fecha = new Date(`${desde}T12:00:00`); fecha.toISOString().slice(0, 10) <= hasta; fecha.setDate(fecha.getDate() + 1)) {
      const dia = fecha.toISOString().slice(0, 10);
      const deCitas = citasDia.find((fila) => fila.dia === dia) || {};
      const deTienda = tiendaDia.find((fila) => fila.dia === dia) || {};
      porDia.push({ dia, citas: deCitas.citas || 0, servicios: deCitas.citas_total || 0, pedidos: deTienda.pedidos || 0, tienda: deTienda.tienda_total || 0, total: (deCitas.citas_total || 0) + (deTienda.tienda_total || 0) });
    }
    const porEspecialista = db.prepare(`SELECT e.id, e.nombre, COUNT(c.id) AS citas, COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN c.total WHEN c.estado = 'no_asistio' THEN c.monto_cobrado END), 0) AS vendido
      FROM especialistas e LEFT JOIN citas c ON c.especialista_id = e.id AND c.fecha BETWEEN @desde AND @hasta AND c.estado != 'cancelada'
      GROUP BY e.id HAVING citas > 0 OR e.activa = 1 ORDER BY citas DESC`).all(rango);
    const servicios = db.prepare(`SELECT s.id, s.nombre, COUNT(*) AS citas, COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN c.total END), 0) AS vendido
      FROM citas c JOIN servicios s ON s.id = c.servicio_id WHERE c.fecha BETWEEN @desde AND @hasta AND c.estado != 'cancelada'
      GROUP BY s.id ORDER BY citas DESC LIMIT 8`).all(rango);
    const productos = db.prepare(`SELECT pr.id, pr.nombre, SUM(i.cantidad) AS unidades, SUM(i.cantidad * i.precio_unitario) AS vendido
      FROM pedido_items i JOIN pedidos pe ON pe.id = i.pedido_id JOIN productos pr ON pr.id = i.producto_id
      WHERE date(pe.creado_en, 'localtime') BETWEEN @desde AND @hasta AND pe.estado != 'cancelado'
      GROUP BY pr.id ORDER BY unidades DESC LIMIT 8`).all(rango);
    const pagos = db.prepare(`SELECT metodo_pago AS metodo, COUNT(*) AS pedidos, SUM(total) AS total FROM pedidos
      WHERE date(creado_en, 'localtime') BETWEEN @desde AND @hasta AND estado != 'cancelado' GROUP BY metodo_pago ORDER BY total DESC`).all(rango);
    // Horas con más citas: ayuda a saber a qué horas hace falta más personal
    const porHora = db.prepare(`SELECT CAST(substr(hora, 1, 2) AS INTEGER) AS hora, COUNT(*) AS citas FROM citas
      WHERE fecha BETWEEN @desde AND @hasta AND estado != 'cancelada' GROUP BY 1 ORDER BY 1`).all(rango);
    const estados = db.prepare(`SELECT estado, COUNT(*) AS n FROM citas WHERE fecha BETWEEN @desde AND @hasta GROUP BY estado`).all(rango);
    const clientasNuevas = db.prepare(`SELECT COUNT(*) AS n FROM (SELECT cliente_telefono, MIN(fecha) AS primera FROM citas WHERE estado != 'cancelada' GROUP BY cliente_telefono) WHERE primera BETWEEN @desde AND @hasta`).get(rango).n;
    const totalServicios = porDia.reduce((suma, diaReporte) => suma + diaReporte.servicios, 0);
    const totalTienda = porDia.reduce((suma, diaReporte) => suma + diaReporte.tienda, 0);
    const totalCitas = porDia.reduce((suma, diaReporte) => suma + diaReporte.citas, 0);
    const canceladas = estados.find((estado) => estado.estado === 'cancelada')?.n || 0;
    return {
      desde, hasta, porDia, porEspecialista, servicios, productos, pagos, estados, porHora,
      totales: { ventas: totalServicios + totalTienda, servicios: totalServicios, tienda: totalTienda, citas: totalCitas, canceladas, pedidos: porDia.reduce((suma, diaReporte) => suma + diaReporte.pedidos, 0), clientasNuevas }
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

    // Nombre: ingresoDe
    // Descripción: Dice cuánto dinero dejó una cita.
    // Entrada: La cita.
    // Salida: El total si se atendió, lo cobrado si no llegó, o 0 si se canceló.
    // Objetivo: Sumar los ingresos reales del día.
    const ingresoDe = (cita) => (cita.estado === 'completada' ? cita.total : cita.estado === 'no_asistio' ? cita.monto_cobrado : 0);
    // Una fila por especialista: el Map deja una sola cita de cada una, de donde se toma su nombre y su comisión
    const porEspecialista = [...new Map(citas.map((cita) => [cita.especialista_id, cita])).values()].map((citaDeElla) => {
      const suyas = citas.filter((cita) => cita.especialista_id === citaDeElla.especialista_id);
      const ingresos = suyas.reduce((suma, cita) => suma + ingresoDe(cita), 0);
      const pago = Math.round(ingresos * (citaDeElla.comision / 100)); // su comisión (65 %) de lo que entró por sus citas
      return { id: citaDeElla.especialista_id, nombre: citaDeElla.especialista, comision: citaDeElla.comision, atendidas: suyas.filter((cita) => cita.estado === 'completada').length,
        perdidas: suyas.filter((cita) => ['cancelada', 'no_asistio'].includes(cita.estado)).length, ingresos, pago, salon: ingresos - pago };
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
