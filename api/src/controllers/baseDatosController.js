// CONTROLADOR: visor de la base de datos del panel (solo lectura).
import { BaseDatosModel } from '../models/BaseDatosModel.js';

const validar = (req, res) => {
  if (!BaseDatosModel.existe(req.params.tabla)) { res.status(404).json({ error: 'Esa tabla no existe.' }); return false; }
  return true;
};

const celdaCsv = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const baseDatosController = {
  listarTablas: (req, res) => res.json(BaseDatosModel.tablas()),

  verTabla(req, res) {
    if (!validar(req, res)) return;
    res.json({ ...BaseDatosModel.filas(req.params.tabla, req.query), estructura: BaseDatosModel.columnas(req.params.tabla) });
  },

  // Descarga la tabla completa en CSV (se abre con Excel)
  exportarCsv(req, res) {
    if (!validar(req, res)) return;
    const cols = BaseDatosModel.columnas(req.params.tabla).map((c) => c.nombre);
    const lineas = [cols.join(','), ...BaseDatosModel.todasLasFilas(req.params.tabla).map((f) => cols.map((c) => celdaCsv(f[c])).join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.tabla}.csv"`);
    res.send('﻿' + lineas.join('\n'));
  }
};
