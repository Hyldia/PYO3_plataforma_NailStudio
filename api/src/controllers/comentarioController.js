// CONTROLADOR: comentarios de la galería y de los servicios.
import { ComentarioModel, TIPOS_COMENTARIO } from '../models/ComentarioModel.js';
import { ResenaModel } from '../models/ResenaModel.js';

function revisar(req, res) {
  const { tipo } = req.params;
  const id = Number(req.params.id);
  if (!TIPOS_COMENTARIO.includes(tipo)) { res.status(404).json({ error: 'Ruta no encontrada.' }); return null; }
  if (!ComentarioModel.existe(tipo, id)) { res.status(404).json({ error: 'No encontramos eso.' }); return null; }
  return { tipo, id };
}

export const comentarioController = {
  listar(req, res) {
    const r = revisar(req, res); if (!r) return;
    res.json(ComentarioModel.listar(r.tipo, r.id, req.query.limite, req.query.filtro));
  },
  resumenes(req, res) {
    if (!TIPOS_COMENTARIO.includes(req.params.tipo)) return res.status(404).json({ error: 'Ruta no encontrada.' });
    res.json(ComentarioModel.resumenes(req.params.tipo));
  },
  crear(req, res) {
    const r = revisar(req, res); if (!r) return;
    const error = ResenaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ComentarioModel.crear(r.tipo, r.id, req.body));
  }
};
