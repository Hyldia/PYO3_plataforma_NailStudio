import { Router } from 'express';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { soloAdmin } from '../middleware/admin.js';
import { subirImagen } from '../middleware/subidas.js';
import { UPLOADS_DIR } from '../db/connection.js';
import { fotosRepo } from '../repositories/fotosRepo.js';
import { catalogoRepo } from '../repositories/catalogoRepo.js';
import { citasRepo } from '../repositories/citasRepo.js';
import { pedidosRepo } from '../repositories/pedidosRepo.js';
import { aplicarAccion } from '../patterns/estadoCita.js';
import { eventos } from '../patterns/eventos.js';

const r = Router();
r.use(soloAdmin);

const borrarArchivo = (nombre) => nombre && unlink(join(UPLOADS_DIR, nombre)).catch(() => {});
const datosFoto = (b) => ({
  titulo: (b.titulo || '').trim() || 'Sin título',
  descripcion: b.descripcion || null,
  categoria: b.categoria || 'Manicure',
  forma: b.forma || null, color: b.color || null, acabado: b.acabado || null,
  etiquetas: b.etiquetas || null,
  destacada: b.destacada === 'true' || b.destacada === true ? 1 : 0
});

r.get('/verificar', (req, res) => res.json({ ok: true }));

// Galería
r.post('/fotos', subirImagen.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Elige una imagen.' });
  res.status(201).json(fotosRepo.crear({ archivo: req.file.filename, ...datosFoto(req.body) }));
});
r.put('/fotos/:id', (req, res) => {
  if (!fotosRepo.porId(req.params.id)) return res.status(404).json({ error: 'No existe esa foto.' });
  res.json(fotosRepo.actualizar(Number(req.params.id), datosFoto(req.body)));
});
r.delete('/fotos/:id', (req, res) => {
  const foto = fotosRepo.porId(req.params.id);
  if (!foto) return res.status(404).json({ error: 'No existe esa foto.' });
  fotosRepo.eliminar(foto.id);
  borrarArchivo(foto.archivo);
  res.status(204).end();
});

// Productos
r.post('/productos/:id/imagen', subirImagen.single('imagen'), (req, res) => {
  const p = catalogoRepo.producto(req.params.id);
  if (!p || !req.file) return res.status(400).json({ error: 'Producto o imagen no válidos.' });
  borrarArchivo(p.imagen);
  catalogoRepo.imagenProducto(p.id, req.file.filename);
  res.json(catalogoRepo.producto(p.id));
});

// Agenda
r.get('/citas', (req, res) => res.json(citasRepo.delDia(req.query.fecha)));
r.patch('/citas/:id/estado', (req, res) => {
  const cita = citasRepo.porId(req.params.id);
  if (!cita) return res.status(404).json({ error: 'No encontramos esa cita.' });
  const nuevo = aplicarAccion(cita.estado, req.body.accion);
  const actualizada = citasRepo.cambiarEstado(cita.id, nuevo);
  if (nuevo === 'cancelada') eventos.emit('cita:cancelada', { citaId: cita.id });
  res.json(actualizada);
});

r.get('/pedidos', (req, res) => res.json(pedidosRepo.recientes()));

export default r;
