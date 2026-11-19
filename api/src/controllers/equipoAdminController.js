// CONTROLADOR: lo del equipo que maneja el panel: estación, forma de pago, acceso al portal,
// días libres y pagos de cada quincena (con descarga en Excel). También las gráficas (reportes).
import ExcelJS from 'exceljs';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { EquipoModel, quincenaDe, quincenaAnterior, TIPOS_AUSENCIA, hoyIso } from '../models/EquipoModel.js';
import { getDb } from '../db/conexion.js';
import { ReporteModel } from '../models/ReporteModel.js';
import { SALON } from '../patrones/plantillaMensajes.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const periodoDe = (q) => (FECHA.test(q.desde || '') && FECHA.test(q.hasta || '') && q.desde <= q.hasta
  ? { ...quincenaDe(q.desde), desde: q.desde, hasta: q.hasta } : quincenaDe(FECHA.test(q.fecha || '') ? q.fecha : undefined));
const existe = (req, res) => {
  const e = EspecialistaModel.buscarPorId(req.params.id);
  if (!e) res.status(404).json({ error: 'No existe esa especialista.' });
  return e;
};

export const equipoAdminController = {
  guardarConfig(req, res) {
    if (!existe(req, res)) return;
    const error = EquipoModel.validarConfig(req.body);
    if (error) return res.status(400).json({ error });
    EquipoModel.guardarConfig(Number(req.params.id), req.body);
    res.json(EspecialistaModel.buscarPorId(req.params.id));
  },
  definirAcceso(req, res) {
    if (!existe(req, res)) return;
    EquipoModel.definirAcceso(Number(req.params.id), req.body);
    res.json({ ok: true, usuario: String(req.body.usuario).trim().toLowerCase() });
  },
  quitarAcceso(req, res) {
    if (!existe(req, res)) return;
    EquipoModel.quitarAcceso(Number(req.params.id));
    res.status(204).end();
  },

  // ----- Días libres / ausencias -----
  ausencias(req, res) {
    if (!existe(req, res)) return;
    res.json({ ausencias: EquipoModel.ausencias(Number(req.params.id), req.query.desde || '2000-01-01'), tipos: TIPOS_AUSENCIA });
  },
  agregarAusencias(req, res) {
    if (!existe(req, res)) return;
    const citasAfectadas = EquipoModel.agregarAusencias(Number(req.params.id), req.body);
    res.status(201).json({ citasAfectadas });
  },
  borrarAusencia(req, res) {
    if (!EquipoModel.borrarAusencia(Number(req.params.id), Number(req.params.ausencia))) return res.status(404).json({ error: 'No encontramos ese día.' });
    res.status(204).end();
  },

  // ----- Avisos del panel (la campanita): lo que está esperando a la administradora -----
  avisos(req, res) {
    const db = getDb();
    const hoy = hoyIso();
    res.json({
      solicitudes: EquipoModel.solicitudesPendientes(),
      pedidosNuevos: db.prepare("SELECT COUNT(*) AS n FROM pedidos WHERE estado = 'recibido'").get().n,
      citasSinMarcar: db.prepare("SELECT COUNT(*) AS n FROM citas WHERE estado IN ('pendiente', 'confirmada') AND fecha < ?").get(hoy).n,
      citasPorConfirmar: db.prepare("SELECT COUNT(*) AS n FROM citas WHERE estado = 'pendiente' AND fecha >= ?").get(hoy).n
    });
  },

  // ----- Días libres que piden las especialistas -----
  resolverSolicitud: (req, res) => res.json(EquipoModel.resolverSolicitud(Number(req.params.id), { aprobar: Boolean(req.body.aprobar), respuesta: req.body.respuesta })),

  // ----- Pagos de la quincena -----
  nomina(req, res) {
    const periodo = periodoDe(req.query);
    res.json({ periodo, actual: quincenaDe(), anterior: quincenaAnterior(), equipo: EquipoModel.nomina(periodo) });
  },
  marcarPagado(req, res) {
    const periodo = periodoDe(req.body);
    res.json(EquipoModel.registrarPago(Number(req.params.id), periodo));
  },
  marcarAtendidas(req, res) {
    const periodo = periodoDe(req.body);
    res.json({ marcadas: EquipoModel.marcarPasadasAtendidas(periodo, req.body.especialistaId ? Number(req.body.especialistaId) : null) });
  },
  quitarPagado(req, res) {
    EquipoModel.quitarPago(Number(req.params.id), periodoDe(req.query));
    res.status(204).end();
  },
  async nominaExcel(req, res) {
    const periodo = periodoDe(req.query);
    const equipo = EquipoModel.nomina(periodo);
    const libro = new ExcelJS.Workbook();
    libro.creator = SALON.nombre;
    const hoja = libro.addWorksheet('Pagos del equipo', { views: [{ state: 'frozen', ySplit: 3 }] });
    hoja.mergeCells('A1:M1');
    hoja.getCell('A1').value = `Pagos del equipo · del ${periodo.desde} al ${periodo.hasta} · día de pago ${periodo.diaPago}`;
    hoja.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF8C1D4B' } };
    hoja.getRow(3).values = ['Especialista', 'Estación', 'Forma de pago', 'Comisión %', 'Citas atendidas', 'Vendido', 'Monto base', 'Por comisión', 'Total a pagar', 'Días programados', 'Días trabajados', 'Días libres', 'Ausencias', 'Pagado el'];
    hoja.columns = [26, 14, 18, 11, 14, 14, 13, 14, 15, 15, 14, 11, 11, 18].map((width) => ({ width }));
    equipo.forEach((e) => hoja.addRow([e.nombre, e.estacion || '', e.esquema, e.comision, e.citas, e.vendido, e.base, e.porComision, e.total, e.diasProgramados, e.diasTrabajados, e.diasLibres, e.ausencias, e.pagado?.pagado_en || 'Pendiente']));
    const cabeza = hoja.getRow(3);
    cabeza.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cabeza.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C1D4B' } };
    [6, 7, 8, 9].forEach((c) => { hoja.getColumn(c).numFmt = '"₡"#,##0'; });
    const total = hoja.addRow(['TOTAL', '', '', '', equipo.reduce((s, e) => s + e.citas, 0), equipo.reduce((s, e) => s + e.vendido, 0), '', '', equipo.reduce((s, e) => s + e.total, 0)]);
    total.font = { bold: true };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="pagos-equipo-${periodo.desde}-al-${periodo.hasta}.xlsx"`);
    await libro.xlsx.write(res);
    res.end();
  },

  // ----- Gráficas -----
  reportes: (req, res) => res.json(ReporteModel.generar(ReporteModel.periodo(req.query)))
};
