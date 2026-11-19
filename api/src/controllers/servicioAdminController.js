// CONTROLADOR: servicios del salón desde el panel (ver, agregar, modificar, cambiar foto y quitar).
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/conexion.js';
import { ServicioModel, CATEGORIAS_SERVICIO } from '../models/ServicioModel.js';

export const servicioAdminController = {
  listar(req, res) {
    const servicios = ServicioModel.listarTodos();
    const categorias = [...new Set([...CATEGORIAS_SERVICIO, ...servicios.map((s) => s.categoria)])];
    res.json({ servicios, categorias });
  },
  crear(req, res) {
    const error = ServicioModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ServicioModel.crear(req.body));
  },
  editar(req, res) {
    if (!ServicioModel.buscarCualquiera(req.params.id)) return res.status(404).json({ error: 'No existe ese servicio.' });
    const error = ServicioModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(ServicioModel.actualizar(Number(req.params.id), req.body));
  },
  cambiarImagen(req, res) {
    const s = ServicioModel.buscarCualquiera(req.params.id);
    if (!s || !req.file) return res.status(400).json({ error: 'Servicio o imagen no válidos.' });
    if (s.imagen && !s.imagen.startsWith('http')) unlink(join(UPLOADS_DIR, s.imagen)).catch(() => {});
    ServicioModel.cambiarImagen(s.id, req.file.filename);
    res.json(ServicioModel.buscarCualquiera(s.id));
  },
  eliminar(req, res) {
    if (!ServicioModel.buscarCualquiera(req.params.id)) return res.status(404).json({ error: 'No existe ese servicio.' });
    res.json({ resultado: ServicioModel.eliminar(Number(req.params.id)) });
  }
};
