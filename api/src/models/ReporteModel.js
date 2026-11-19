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
    const citasDia = db.prepare(`SELECT fecha AS dia, COUNT(*) AS citas, SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END) AS citas_total
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
    const porEspecialista = db.prepare(`SELECT e.id, e.nombre, COUNT(c.id) AS citas, COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN c.total END), 0) AS vendido
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
    const estados = db.prepare(`SELECT estado, COUNT(*) AS n FROM citas WHERE fecha BETWEEN @desde AND @hasta GROUP BY estado`).all(p);
    const clientasNuevas = db.prepare(`SELECT COUNT(*) AS n FROM (SELECT cliente_telefono, MIN(fecha) AS primera FROM citas WHERE estado != 'cancelada' GROUP BY cliente_telefono) WHERE primera BETWEEN @desde AND @hasta`).get(p).n;
    const totalServicios = porDia.reduce((s, x) => s + x.servicios, 0);
    const totalTienda = porDia.reduce((s, x) => s + x.tienda, 0);
    const totalCitas = porDia.reduce((s, x) => s + x.citas, 0);
    const canceladas = estados.find((e) => e.estado === 'cancelada')?.n || 0;
    return {
      desde, hasta, porDia, porEspecialista, servicios, productos, pagos, estados,
      totales: { ventas: totalServicios + totalTienda, servicios: totalServicios, tienda: totalTienda, citas: totalCitas, canceladas, pedidos: porDia.reduce((s, x) => s + x.pedidos, 0), clientasNuevas }
    };
  }
};
