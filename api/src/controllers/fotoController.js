// CONTROLADOR: galería pública y administración de fotos.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/connection.js';
import { FotoModel } from '../models/FotoModel.js';

const borrarArchivo = (nombre) => nombre && unlink(join(UPLOADS_DIR, nombre)).catch(() => {});

export const fotoController = {
  buscar: (req, res) => res.json(FotoModel.buscar(req.query)),
  opcionesDeFiltro: (req, res) => res.json(FotoModel.opcionesDeFiltro()),

  registrarVista(req, res) {
    FotoModel.sumarVista(req.params.id);
    res.status(204).end();
  },

  subir(req, res) {
    if (!req.file) return res.status(400).json({ error: 'Elige una imagen.' });
    res.status(201).json(FotoModel.crear({ archivo: req.file.filename, ...FotoModel.normalizar(req.body) }));
  },

  editar(req, res) {
    if (!FotoModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe esa foto.' });
    res.json(FotoModel.actualizar(Number(req.params.id), FotoModel.normalizar(req.body)));
  },

  eliminar(req, res) {
    const foto = FotoModel.buscarPorId(req.params.id);
    if (!foto) return res.status(404).json({ error: 'No existe esa foto.' });
    FotoModel.eliminar(foto.id);
    borrarArchivo(foto.archivo);
    res.status(204).end();
  }
};
