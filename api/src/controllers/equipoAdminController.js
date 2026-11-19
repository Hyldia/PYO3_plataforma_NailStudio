// CONTROLADOR: lo del equipo que maneja el panel: estación, forma de pago, acceso al portal,
// días libres y pagos de cada quincena (con descarga en Excel). También las gráficas (reportes).
import ExcelJS from 'exceljs';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { AusenciaModel, TIPOS_AUSENCIA } from '../models/AusenciaModel.js';
import { NominaModel } from '../models/NominaModel.js';
import { AccesoEquipoModel } from '../models/AccesoEquipoModel.js';
import { SolicitudLibreModel } from '../models/SolicitudLibreModel.js';
import { quincenaDe, quincenaAnterior, hoyIso } from '../lib/fechas.js';
import { ReporteModel } from '../models/ReporteModel.js';
import { SALON } from '../patrones/plantillaMensajes.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Nombre: periodoDe
// Descripción: Lee el rango de fechas pedido.
// Entrada: Los datos de la búsqueda.
// Salida: Fecha de inicio y de fin.
// Objetivo: Calcular pagos por periodo.
const periodoDe = (q) => (FECHA.test(q.desde || '') && FECHA.test(q.hasta || '') && q.desde <= q.hasta
  ? { ...quincenaDe(q.desde), desde: q.desde, hasta: q.hasta } : quincenaDe(FECHA.test(q.fecha || '') ? q.fecha : undefined));
// Nombre: existe
// Descripción: Busca la especialista y avisa si no existe.
// Entrada: La petición y la respuesta.
// Salida: La especialista o nada.
// Objetivo: Evitar errores con equipo inexistente.
const existe = (req, res) => {
  const e = EspecialistaModel.buscarPorId(req.params.id);
  if (!e) res.status(404).json({ error: 'No existe esa especialista.' });
  return e;
};

export const equipoAdminController = {
  // Nombre: guardarConfig
  // Descripción: Guarda cómo se le paga a una especialista.
  // Entrada: Su forma de pago y porcentajes.
  // Salida: La especialista actualizada.
  // Objetivo: Calcular bien su pago.
  guardarConfig(req, res) {
    if (!existe(req, res)) return;
    const error = NominaModel.validarConfig(req.body);
    if (error) return res.status(400).json({ error });
    NominaModel.guardarConfig(Number(req.params.id), req.body);
    res.json(EspecialistaModel.buscarPorId(req.params.id));
  },
  // Nombre: definirAcceso
  // Descripción: Crea el usuario y contraseña de una especialista.
  // Entrada: Usuario y contraseña.
  // Salida: Un "ok".
  // Objetivo: Que entre a su propio portal.
  definirAcceso(req, res) {
    if (!existe(req, res)) return;
    AccesoEquipoModel.definirAcceso(Number(req.params.id), req.body);
    res.json({ ok: true, usuario: String(req.body.usuario).trim().toLowerCase() });
  },
  // Nombre: quitarAcceso
  // Descripción: Quita el acceso de una especialista.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Bloquear su entrada.
  quitarAcceso(req, res) {
    if (!existe(req, res)) return;
    AccesoEquipoModel.quitarAcceso(Number(req.params.id));
    res.status(204).end();
  },

  // ----- Días libres / ausencias -----
  // Nombre: ausencias
  // Descripción: Lista los días libres de una especialista.
  // Entrada: La especialista.
  // Salida: Sus ausencias.
  // Objetivo: Ver vacaciones y libres.
  ausencias(req, res) {
    if (!existe(req, res)) return;
    res.json({ ausencias: AusenciaModel.ausencias(Number(req.params.id), req.query.desde || '2000-01-01'), tipos: TIPOS_AUSENCIA });
  },
  // Nombre: agregarAusencias
  // Descripción: Agrega días libres a una especialista.
  // Entrada: Las fechas y el motivo.
  // Salida: Las ausencias guardadas.
  // Objetivo: Que no le lleguen citas esos días.
  agregarAusencias(req, res) {
    if (!existe(req, res)) return;
    const citasAfectadas = AusenciaModel.agregarAusencias(Number(req.params.id), req.body);
    res.status(201).json({ citasAfectadas });
  },
  // Nombre: borrarAusencia
  // Descripción: Borra un día libre.
  // Entrada: El número de la ausencia.
  // Salida: Nada.
  // Objetivo: Corregir libres.
  borrarAusencia(req, res) {
    if (!AusenciaModel.borrarAusencia(Number(req.params.id), Number(req.params.ausencia))) return res.status(404).json({ error: 'No encontramos ese día.' });
    res.status(204).end();
  },

  // ----- Avisos del panel (la campanita): lo que está esperando a la administradora -----
  // Nombre: avisos
  // Descripción: Junta los avisos para la campanita del panel.
  // Entrada: Nada.
  // Salida: La lista de avisos.
  // Objetivo: Que la dueña vea lo pendiente.
  avisos(req, res) {
    res.json({ solicitudes: SolicitudLibreModel.solicitudesPendientes(), ...ReporteModel.avisosPanel(hoyIso()) });
  },

  // ----- Días libres que piden las especialistas -----
  // Nombre: resolverSolicitud
  // Descripción: Aprueba o rechaza un día libre pedido.
  // Entrada: La solicitud y la respuesta.
  // Salida: La solicitud actualizada.
  // Objetivo: Responder a las especialistas.
  resolverSolicitud: (req, res) => res.json(SolicitudLibreModel.resolverSolicitud(Number(req.params.id), { aprobar: Boolean(req.body.aprobar), respuesta: req.body.respuesta })),

  // ----- Pagos de la quincena -----
  // Nombre: nomina
  // Descripción: Calcula lo que se le paga a cada especialista.
  // Entrada: El periodo.
  // Salida: La lista de pagos.
  // Objetivo: Hacer la planilla.
  nomina(req, res) {
    const periodo = periodoDe(req.query);
    res.json({ periodo, actual: quincenaDe(), anterior: quincenaAnterior(), equipo: NominaModel.nomina(periodo) });
  },
  // Nombre: marcarPagado
  // Descripción: Marca un pago como hecho.
  // Entrada: La especialista y el periodo.
  // Salida: El pago guardado.
  // Objetivo: Llevar control de lo pagado.
  marcarPagado(req, res) {
    const periodo = periodoDe(req.body);
    res.json(NominaModel.registrarPago(Number(req.params.id), periodo));
  },
  // Nombre: marcarAtendidas
  // Descripción: Marca como atendidas las citas pasadas.
  // Entrada: La especialista y el periodo.
  // Salida: Cuántas se marcaron.
  // Objetivo: Que cuenten para su pago.
  marcarAtendidas(req, res) {
    const periodo = periodoDe(req.body);
    res.json({ marcadas: NominaModel.marcarPasadasAtendidas(periodo, req.body.especialistaId ? Number(req.body.especialistaId) : null) });
  },
  // Nombre: quitarPagado
  // Descripción: Quita la marca de pagado.
  // Entrada: El pago.
  // Salida: Nada.
  // Objetivo: Corregir un pago marcado por error.
  quitarPagado(req, res) {
    NominaModel.quitarPago(Number(req.params.id), periodoDe(req.query));
    res.status(204).end();
  },
  // Nombre: nominaExcel
  // Descripción: Descarga la planilla en Excel.
  // Entrada: El periodo.
  // Salida: Un archivo de Excel.
  // Objetivo: Guardar o imprimir la planilla.
  async nominaExcel(req, res) {
    const periodo = periodoDe(req.query);
    const equipo = NominaModel.nomina(periodo);
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
  }
};
