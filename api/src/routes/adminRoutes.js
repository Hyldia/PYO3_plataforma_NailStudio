// RUTAS del panel del salón: todas pasan primero por soloAdmin.
import { Router } from 'express';
import { soloAdmin } from '../middleware/admin.js';
import { subirImagen } from '../middleware/subidas.js';
import { fotoController } from '../controllers/fotoController.js';
import { citaController } from '../controllers/citaController.js';
import { productoAdminController } from '../controllers/productoAdminController.js';
import { baseDatosController } from '../controllers/baseDatosController.js';

const r = Router();
r.use(soloAdmin);

r.get('/verificar', (req, res) => res.json({ ok: true }));

r.post('/fotos', subirImagen.single('imagen'), fotoController.subir);
r.put('/fotos/:id', fotoController.editar);
r.delete('/fotos/:id', fotoController.eliminar);

r.post('/productos/:id/imagen', subirImagen.single('imagen'), productoAdminController.cambiarImagen);
r.post('/especialistas/:id/foto', subirImagen.single('imagen'), productoAdminController.fotoEspecialista);
r.get('/pedidos', productoAdminController.listarPedidos);

r.get('/citas', citaController.listarDelDia);
r.patch('/citas/:id/estado', citaController.cambiarEstado);

// Visor de la base de datos (solo lectura)
r.get('/tablas', baseDatosController.listarTablas);
r.get('/tablas/:tabla', baseDatosController.verTabla);
r.get('/tablas/:tabla/csv', baseDatosController.exportarCsv);

export default r;
