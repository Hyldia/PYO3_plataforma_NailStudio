// RUTAS del panel del salón: todas pasan primero por soloAdmin.
import { Router } from 'express';
import { soloAdmin } from '../middleware/admin.js';
import { subirImagen } from '../middleware/subidas.js';
import { fotoController } from '../controllers/fotoController.js';
import { citaController } from '../controllers/citaController.js';
import { productoAdminController } from '../controllers/productoAdminController.js';

const r = Router();
r.use(soloAdmin);

r.get('/verificar', (req, res) => res.json({ ok: true }));

r.post('/fotos', subirImagen.single('imagen'), fotoController.subir);
r.put('/fotos/:id', fotoController.editar);
r.delete('/fotos/:id', fotoController.eliminar);

r.post('/productos/:id/imagen', subirImagen.single('imagen'), productoAdminController.cambiarImagen);
r.get('/pedidos', productoAdminController.listarPedidos);

r.get('/citas', citaController.listarDelDia);
r.patch('/citas/:id/estado', citaController.cambiarEstado);

export default r;
