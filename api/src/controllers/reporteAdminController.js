// CONTROLADOR: reportes del panel (gráficas del periodo y cierre del día).
// Solo recibe la petición y devuelve lo que calcula ReporteModel (Controlador delgado de GRASP).
import { ReporteModel } from '../models/ReporteModel.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Nombre: hoyEnCostaRica
// Descripción: Da la fecha de hoy en Costa Rica.
// Entrada: Nada.
// Salida: AAAA-MM-DD.
// Objetivo: Que el cierre sea del día correcto aunque el servidor esté en otro país.
const hoyEnCostaRica = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });

export const reporteAdminController = {
  // Nombre: reportes
  // Descripción: Devuelve los números para las gráficas.
  // Entrada: Desde y hasta (opcionales).
  // Salida: Ventas, citas, servicios y equipo.
  // Objetivo: Ver cómo va el salón.
  reportes: (req, res) => res.json(ReporteModel.generar(ReporteModel.periodo(req.query))),

  // Nombre: cierre
  // Descripción: Devuelve el cierre de un día (hoy si no se indica).
  // Entrada: ?fecha=AAAA-MM-DD
  // Salida: Ingresos, pago al equipo, ganancia, pérdidas y citas perdidas.
  // Objetivo: El reporte de fin de día de la dueña.
  cierre: (req, res) => res.json(ReporteModel.cierreDelDia(FECHA.test(req.query.fecha || '') ? req.query.fecha : hoyEnCostaRica()))
};
