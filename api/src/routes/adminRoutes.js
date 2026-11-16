// RUTAS del panel del salón: todas pasan primero por soloAdmin.
import { Router } from 'express';
import { soloAdmin } from '../middleware/admin.js';
import { subirImagen } from '../middleware/subidas.js';
import { fotoController } from '../controllers/fotoController.js';
import { citaController } from '../controllers/citaController.js';
import { productoAdminController } from '../controllers/productoAdminController.js';
import { baseDatosController } from '../controllers/baseDatosController.js';
import { adminController as a } from '../controllers/adminController.js';

const r = Router();
r.use(soloAdmin);

r.get('/verificar', (req, res) => res.json({ ok: true }));

r.post('/fotos', subirImagen.single('imagen'), fotoController.subir);
r.put('/fotos/:id', fotoController.editar);
r.delete('/fotos/:id', fotoController.eliminar);

r.post('/productos/:id/imagen', subirImagen.single('imagen'), productoAdminController.cambiarImagen);
r.post('/especialistas/:id/foto', subirImagen.single('imagen'), productoAdminController.fotoEspecialista);
r.post('/fotos/:id/imagen', subirImagen.single('imagen'), a.cambiarFotoDiseno);

// Productos: listar, crear, editar y eliminar
r.get('/productos', a.productos);
r.post('/productos', a.crearProducto);
r.put('/productos/:id', a.editarProducto);
r.delete('/productos/:id', a.eliminarProducto);

// Equipo
r.get('/especialistas', a.equipo);
r.post('/especialistas', a.crearEspecialista);
r.put('/especialistas/:id', a.editarEspecialista);
r.delete('/especialistas/:id', a.eliminarEspecialista);

// Pedidos con filtros y estados
r.get('/pedidos', a.pedidos);
r.get('/pedidos/excel', a.pedidosExcel);
r.patch('/pedidos/:id/estado', a.estadoPedido);

// Agenda: calendario del mes, cancelaciones y avisos por WhatsApp
r.get('/calendario', a.calendario);
r.get('/mensajes/tipos', a.tiposMensaje);
r.get('/mensajes', a.mensajes);
r.post('/mensajes/:id/enviado', a.mensajeEnviado);
r.post('/citas/emergencia', a.emergencia);
r.post('/citas/:id/cancelar', a.cancelar);
r.post('/citas/:id/mensaje', a.mensaje);

r.get('/citas', citaController.listarDelDia);
r.patch('/citas/:id/estado', citaController.cambiarEstado);

// Visor de la base de datos (solo lectura)
r.get('/tablas', baseDatosController.listarTablas);
r.get('/tablas/:tabla', baseDatosController.verTabla);
r.get('/tablas/:tabla/csv', baseDatosController.exportarCsv);

export default r;
